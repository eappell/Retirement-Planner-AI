## AI Insights & Reporting: Stable release  Milestone 2025-12-10

### Summary
- Centralized AI generation in the Planner.
- Added robust serverless `api/report` to forward client telemetry to Portal for analytics.
- Implemented model fallback for Google GenAI (`gemini-2.0-flash`) when the configured model is unavailable.
- Added diagnostics in AI responses and improved 500 error reporting for faster debugging.
- Implemented `X-Report-Source` header and loop detection to avoid infinite forwarding loops.
- Ensured `fetch` fallback to `node-fetch` in serverless runtime and converted the serverless function to ESM to match repo configuration.

### Fixes
- Fixed clients posting to `/report` by normalizing to `/api/report`.
- Prevented Vercel serverless route conflicts by moving `insights` into `lib` and keeping a single serverless wrapper.
- Resolved `FUNCTION_INVOCATION_FAILED` by ensuring `fetch` available and matching ESM export behavior.

### Files / Key changes
- `api/report.js`  new serverless function; forwards to `PORTAL_TRACK_URL` with `X-Report-Source` header; always returns a 200 diagnostic response.
- `lib/insights.cjs`  added model fallback to `gemini-2.0-flash` and non-sensitive diagnostics.
- `server/index.js`  Express-based local dev server mirrored the serverless behavior.
- `hooks/usePlanCalculation.ts`  client now posts to `/api/report` (changed from `/report`).
- `scripts/test-report-handler.js`  added to test `api/report` locally.

### Validation / Tests
- Verified endpoints via `curl` and PowerShell `Invoke-RestMethod` to ensure endpoints return 200 and expected headers.
- Verified loop prevention by checking `forwarded: true` and `forwardedBody` diagnostics.
- Ensured AI generation is returned after `gemini-2.0-flash` fallback in cases where the configured model is unsupported.

### Notes for Deployers
- Confirm `PORTAL_TRACK_URL`, `GOOGLE_MODEL`, and AI provider keys are correctly configured in Vercel/production env.
- Node 20.x is required for GenAI and Anthropic SDKs; set Vercel runtime or engines accordingly.

### Next steps (optional)
- Add a CI health-check to assert `/api/insights` returns non-fallback text and `/api/report` responses include `forwarded` diagnostics.
- Add a `X-Forward-Hops` header to make loops even more robust against multi-hop forwards.

---
This release is a draft. Tag: milestone/ai-insights-stable-20251210
