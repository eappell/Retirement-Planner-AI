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

    const resp = await fetchFn(trackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

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
