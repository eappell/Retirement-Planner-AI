import React, { useMemo } from 'react';

interface Props { df?: number; std?: number; }

// Small demo: render simple histogram comparing Normal vs Student-t (same mean/std)
export const FatTailDemo: React.FC<Props> = ({ df = 4, std = 0.15 }) => {
  const samples = useMemo(() => {
    const N = 2000;
    const normal: number[] = [];
    const tdist: number[] = [];

    const randomNormal = (mean = 0, sd = 1) => {
      let u1 = 0, u2 = 0;
      while (u1 === 0) u1 = Math.random();
      while (u2 === 0) u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return mean + z0 * sd;
    };

    const randomStudentT = (mean = 0, sd = 1, dfLocal = 4) => {
      if (dfLocal <= 2) return randomNormal(mean, sd);
      const z = randomNormal(0, 1);
      let v = 0;
      for (let i = 0; i < Math.floor(dfLocal); i++) {
        const n = randomNormal(0, 1);
        v += n * n;
      }
      const frac = dfLocal - Math.floor(dfLocal);
      if (frac > 0) {
        const n = randomNormal(0, 1);
        v += frac * (n * n);
      }
      const t = z / Math.sqrt(v / dfLocal);
      const theoreticalStd = Math.sqrt(dfLocal / (dfLocal - 2));
      const scale = sd / theoreticalStd;
      return mean + t * scale;
    };

    for (let i = 0; i < N; i++) {
      normal.push(randomNormal(0, std));
      tdist.push(randomStudentT(0, std, df));
    }
    return { normal, tdist };
  }, [df, std]);

  const buildHistogram = (data: number[], bins = 40) => {
    let min = Math.min(...data);
    let max = Math.max(...data);
    // center around 0
    min = Math.min(min, -std * 3);
    max = Math.max(max, std * 3);
    const width = max - min;
    const counts = new Array(bins).fill(0);
    data.forEach(v => {
      let idx = Math.floor(((v - min) / width) * bins);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      counts[idx]++;
    });
    return { counts, min, max };
  };

  const normalHist = buildHistogram(samples.normal);
  const tHist = buildHistogram(samples.tdist);
  const maxCount = Math.max(...normalHist.counts, ...tHist.counts);

  const w = 360, h = 120, pad = 8;

  return (
    <div className="mt-3">
      <h5 className="text-sm font-medium mb-2">Fat Tails Demo</h5>
      <svg width={w} height={h} className="block">
        {normalHist.counts.map((c, i) => {
          const x = pad + (i * (w - pad * 2)) / normalHist.counts.length;
          const bw = (w - pad * 2) / normalHist.counts.length - 1;
          const nh = (c / maxCount) * (h - pad * 2);
          const th = (tHist.counts[i] / maxCount) * (h - pad * 2);
          return (
            <g key={i} transform={`translate(${x},${h - pad})`}>
              <rect x={0} y={-nh} width={bw} height={nh} fill="#93c5fd" opacity={0.7} />
              <rect x={0} y={-th} width={bw} height={th} fill="#fca5a5" opacity={0.6} />
            </g>
          );
        })}
        <text x={pad} y={pad + 10} className="text-xs" fill="#374151">Normal (blue) vs Student's t (red) — df={df}</text>
      </svg>
      <p className="text-xs text-gray-500 mt-2">Small random sample: Student's t with lower df shows heavier tails (more extreme outcomes).</p>
    </div>
  );
};

export default FatTailDemo;
