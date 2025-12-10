// Vercel serverless function that forwards report events to the configured
// `PORTAL_TRACK_URL`. Mirrors the behavior from the Express dev server so
// production deployments (Vercel) can accept /api/report requests.

/**
 * Expected env:
 * - PORTAL_TRACK_URL: the fully qualified URL to forward reports to (e.g., https://retirement-portal.vercel.app/api/report)
 */

const parseJsonBody = async (req) => {
  if (req.body) return req.body;
  return await new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
};

console.log('api/report module loaded', { PORTAL_TRACK_URL: process.env.PORTAL_TRACK_URL, hasGlobalFetch: typeof globalThis.fetch !== 'undefined' });

export default async (req, res) => {
  try {
    const body = await parseJsonBody(req);
    // Ensure we have a working fetch implementation
    let fetchFn = globalThis.fetch;
    if (!fetchFn) {
      try {
        const { default: nodeFetch } = await import('node-fetch');
        fetchFn = nodeFetch;
      } catch (e) {
        console.error('No fetch available and failed to load node-fetch', e);
        return res.status(500).json({ error: 'No fetch implementation available' });
      }
    }
    const trackUrl = process.env.PORTAL_TRACK_URL;
    if (!trackUrl) {
      // Keep parity with local dev: don't fail the client
      const warning = 'PORTAL_TRACK_URL not configured; skipping portal forwarding';
      console.warn(warning);
      return res.status(200).json({ ok: true, warning, forwarded: false });
    }

    const outgoingHeaders = { 'Content-Type': 'application/json', 'X-Report-Source': 'retirement-planner' };
    // Prevent loops: if the incoming request already had an X-Report-Source header
    // (e.g., 'retire-portal' or 'retirement-planner'), do not forward.
    const incomingSource = req.headers && (req.headers['x-report-source'] || req.headers['X-Report-Source']);
    if (incomingSource) {
      console.warn('Skipping forwarding to avoid loop: incoming X-Report-Source=', incomingSource);
      return res.status(200).json({ ok: true, forwarded: false, reason: 'loop detected', incomingSource });
    }

    const resp = await fetchFn(trackUrl, { method: 'POST', headers: outgoingHeaders, body: JSON.stringify(body) });
    // Avoid forwarding loops by including a label of where this forward originated.
    // Recipients should not forward again if they see this header.
    // We included header on the outgoing request above; but ensure our handler won't re-forward requests
    // where the incoming request already included X-Report-Source.

    const text = await resp.text();
    // Try to return JSON if possible
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) { /* ignore */ }
    // Always succeed to avoid causing a 4xx/5xx on caller that would treat reporting
    // failures as hard errors. Instead surface diagnostic info in the response.
    return res.status(200).json({ ok: true, forwarded: resp.ok, forwardedStatus: resp.status, forwardedBody: parsed || text });
  } catch (err) {
    console.error('Report handler error', err);
    const errMsg = (err && err.message) ? err.message : String(err);
    console.error('Report forwarding failed', errMsg);
    return res.status(500).json({ error: 'Report forwarding failed', details: errMsg });
  }
};
