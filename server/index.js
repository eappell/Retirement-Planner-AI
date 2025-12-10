const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
let GoogleGenAI;
try {
  // optional dependency: @google/genai may not be published/available in some registries
  GoogleGenAI = require('@google/genai').GoogleGenAI;
} catch (err) {
  console.warn('Optional dependency @google/genai is not installed; AI proxy will return a fallback message.');
}
// Prefer loading project-specific secrets from .env.local for local dev
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

// Configure CORS: allow origins from env or sensible defaults for dev and production
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://retirement-planner-ai.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin like mobile apps or server-to-server
    if (!origin) return callback(null, true);

    // Allow any localhost origin (useful during development when Vite picks
    // a dynamic port such as 5174) while keeping stricter policies for other
    // hosts.
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return callback(null, true);
    } catch (e) {
      // ignore parse errors
    }

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.indexOf('*') !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-AI-Provider'],
  credentials: true,
}));

if (!process.env.API_KEY) {
  console.warn('Warning: API_KEY not set in server environment. AI proxy will return a fallback message.');
}

// Support multiple AI providers via env `AI_PROVIDER` (google|claude). Provide
// fallbacks if a provider client isn't available.
const AI_PROVIDER = (process.env.AI_PROVIDER || 'google').toLowerCase();

let googleClient = null;
if (GoogleGenAI) {
  try {
    googleClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Helper to call Google GenAI (Gemini)
async function generateWithGoogle(prompt) {
  if (!googleClient) throw new Error('Google GenAI client not initialized');
  const response = await googleClient.models.generateContent({ model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash', contents: prompt });
  return response.text;
}

// Helper to call Anthropic Claude via HTTP (no dependency required).
// Expects CLAUDE_API_KEY in env and will call the /v1/complete endpoint.
async function generateWithClaude(prompt) {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new Error('CLAUDE_API_KEY not set');
  const model = process.env.CLAUDE_MODEL || 'claude-2.1';

  // Prefer using the installed `anthropic` SDK when available. Fall back to
  // the existing raw HTTP calls if the SDK isn't present or an invocation
  // style isn't detected.
  let AnthropicSDK = null;
  try {
    AnthropicSDK = require('@anthropic-ai/sdk');
  } catch (e) {
    try { AnthropicSDK = require('anthropic'); } catch (e2) { AnthropicSDK = null; }
  }

  // Helper to try various SDK shapes and extract text safely
  const extractSdkResponseText = (resp) => {
    if (!resp) return '';
    if (typeof resp === 'string') return resp;
    if (resp.output_text) return resp.output_text;
    if (resp.completion) return resp.completion;
    if (resp.completion_text) return resp.completion_text;
    // Newer Responses API shapes
    if (resp.output && Array.isArray(resp.output)) {
      // output is an array of content blocks
      return resp.output.map(o => {
        if (typeof o === 'string') return o;
        if (o.content && Array.isArray(o.content)) return o.content.map(c => c.text || c).join('');
        if (o.text) return o.text;
        return '';
      }).join('\n\n');
    }
    // choices/message-style
    if (Array.isArray(resp.choices) && resp.choices[0]) {
      const c = resp.choices[0];
      if (c.message && typeof c.message.content === 'string') return c.message.content;
      if (c.text) return c.text;
    }
    // fallback: stringify
    try { return JSON.stringify(resp); } catch (e) { return String(resp); }
  };

  if (AnthropicSDK) {
    // Attempt to construct a client in several supported ways
    let client = null;
    try {
      if (typeof AnthropicSDK === 'function') {
        client = new AnthropicSDK({ apiKey: key });
      } else if (AnthropicSDK.Anthropic) {
        client = new AnthropicSDK.Anthropic({ apiKey: key });
      } else if (AnthropicSDK.default) {
        client = new AnthropicSDK.default({ apiKey: key });
      } else {
        client = AnthropicSDK;
      }
    } catch (e) {
      client = AnthropicSDK;
    }

    try {
      // Responses API (newer SDKs)
      if (client && client.responses && typeof client.responses.create === 'function') {
        const resp = await client.responses.create({ model, input: prompt, max_tokens: 800, temperature: 0.7 });
        return extractSdkResponseText(resp);
      }

      // Older SDK surface: completions/createCompletion/complete
      if (client && typeof client.complete === 'function') {
        const resp = await client.complete({ model, prompt, max_tokens_to_sample: 800, temperature: 0.7 });
        return extractSdkResponseText(resp);
      }
      if (client && client.completions && typeof client.completions.create === 'function') {
        const resp = await client.completions.create({ model, prompt, max_tokens_to_sample: 800, temperature: 0.7 });
        return extractSdkResponseText(resp);
      }
      if (client && typeof client.createCompletion === 'function') {
        const resp = await client.createCompletion({ model, prompt, max_tokens_to_sample: 800, temperature: 0.7 });
        return extractSdkResponseText(resp);
      }
    } catch (err) {
      console.warn('Anthropic SDK call failed, falling back to HTTP:', String(err));
      // Fall through to HTTP fallback below
    }
  }

  // If SDK not present or SDK invocation failed, keep previous HTTP-based logic
  const anthropicVersion = process.env.CLAUDE_API_VERSION || '2023-10-01';
  const isMessagesModel = String(model).toLowerCase().startsWith('claude-opus');

  if (isMessagesModel) {
    const url = `https://api.anthropic.com/v1/messages`;
    const body = {
      model,
      messages: [ { role: 'user', content: prompt } ],
      max_tokens: 800,
      temperature: 0.7,
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'Anthropic-Version': anthropicVersion,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Claude Messages API error: ${resp.status} ${t}`);
    }
    const json = await resp.json();
    if (typeof json === 'string') return json;
    if (json.output && typeof json.output === 'string') return json.output;
    if (json.completion && typeof json.completion === 'string') return json.completion;
    if (json.message && json.message.content) {
      if (typeof json.message.content === 'string') return json.message.content;
      if (Array.isArray(json.message.content)) {
        return json.message.content.map(c => (c && c.text) ? c.text : (typeof c === 'string' ? c : JSON.stringify(c))).join('\n\n');
      }
    }
    if (Array.isArray(json.content)) {
      const parts = [];
      for (const item of json.content) {
        if (!item) continue;
        if (typeof item === 'string') parts.push(item);
        else if (typeof item.text === 'string') parts.push(item.text);
        else if (item.content && typeof item.content === 'string') parts.push(item.content);
      }
      if (parts.length) return parts.join('\n\n');
    }
    if (Array.isArray(json.choices) && json.choices[0] && json.choices[0].message) {
      const msg = json.choices[0].message;
      if (typeof msg.content === 'string') return msg.content;
      if (Array.isArray(msg.content)) return msg.content.map(c => c.text || JSON.stringify(c)).join('\n\n');
    }
    return JSON.stringify(json);
  }

  // Legacy complete
  const url = `https://api.anthropic.com/v1/complete`;
  const body = { model, prompt, max_tokens_to_sample: 800, temperature: 0.7 };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'Anthropic-Version': anthropicVersion,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Claude API error: ${resp.status} ${t}`);
  }
  const json = await resp.json();
  return json.completion || json.completion_text || json.output || JSON.stringify(json);
}

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

app.post('/api/insights', async (req, res) => {
  try {
    const { plan, result } = req.body || {};
    if (!plan || !result || !plan.person1) {
            return res.status(400).json({ error: 'Missing required plan or result data (need plan.person1 and result)' });
    }

    const totalInvestments = ([...(plan.retirementAccounts || []), ...(plan.investmentAccounts || [])]).reduce((s, a) => s + (a.balance || 0), 0);

    // Safely access nested fields with defaults to avoid runtime errors when callers send partial data
    const planType = plan.planType || 'Unknown';
    const state = plan.state || 'Unknown';
    const inflationRate = plan.inflationRate ?? 'Unknown';
    const avgReturn = plan.avgReturn ?? 'Unknown';
    const p1 = plan.person1 || {};
    const p2 = plan.person2 || {};

    const planSummary = `A user is planning for retirement with the following details:\n- Planning for: ${planType}\n- State: ${state}\n- Inflation: ${inflationRate}%\n- Avg return: ${avgReturn}%\n\nPeople:\n- ${p1.name || 'Person 1'}: age ${p1.currentAge ?? 'Unknown'}, retires ${p1.retirementAge ?? 'Unknown'}\n${planType === 'Couple' ? `- ${p2.name || 'Person 2'}: age ${p2.currentAge ?? 'Unknown'}, retires ${p2.retirementAge ?? 'Unknown'}\n` : ''}\nFinancials:\n- Total investments: ${formatCurrency(totalInvestments)}\n- Avg monthly net income (today): ${formatCurrency(result.avgMonthlyNetIncomeToday || 0)}\n- Net worth at end: ${formatCurrency(result.netWorthAtEnd || 0)}\n`;

    const prompt = `You are a friendly financial advisor. Read the plan summary and give a short Overview and three Actionable Tips in Markdown.\n\n${planSummary}`;

    // Determine provider per-request: request body `aiProvider`, query `ai_provider`, or env fallback
    const provider = (req.body && req.body.aiProvider) || req.query.ai_provider || process.env.AI_PROVIDER || 'google';
    const providerLower = String(provider).toLowerCase();

    // Debugging: log provider sources to help trace why provider selection may be unexpected
    try {
      console.log('insights: provider lookup', { body_aiProvider: req.body && req.body.aiProvider, query_ai_provider: req.query && req.query.ai_provider, env_AI_PROVIDER: process.env.AI_PROVIDER, chosen: providerLower });
    } catch (e) { /* ignore logging errors */ }

    try {
      let text;
      if (providerLower === 'claude') {
        // Wrap prompt slightly for Claude conversational style
        const claudePrompt = `Human: Please read the following retirement plan summary and provide a short Overview and three Actionable Tips in Markdown.\n\n${planSummary}\n\nAssistant:`;
        text = await generateWithClaude(claudePrompt);
      } else {
        // default to google/gemini with a safe fallback model if configured model is unsupported
        const googlePrompt = prompt;
        const configuredModel = process.env.GOOGLE_MODEL || 'gemini-2.0-flash';
        try {
          text = await generateWithGoogle(googlePrompt);
        } catch (err) {
          console.warn('Google model generation with', configuredModel, 'failed, attempting fallback model. Error:', String(err));
          // If the configured model is not found or not supported, try a conservative fallback
          const fallbackModel = 'gemini-2.0-flash';
          if (configuredModel !== fallbackModel) {
            try {
              // Temporarily override env for this call
              const orig = process.env.GOOGLE_MODEL;
              process.env.GOOGLE_MODEL = fallbackModel;
              text = await generateWithGoogle(googlePrompt);
              process.env.GOOGLE_MODEL = orig;
            } catch (err2) {
              console.error('Fallback google model also failed:', String(err2));
              throw err2;
            }
          } else {
            throw err;
          }
        }
      }

      // If the provider returned a JSON object or complex shape, stringify minimal text
      if (typeof text !== 'string') text = String(text);
      // Convert triple-dash separators to HTML <hr /> for frontend rendering
      try {
        text = text.replace(/\n---\n/g, '\n<hr />\n');
      } catch (e) { /* ignore replacement errors */ }
    // include provider as a response header (so frontend can show badge)
    try { res.setHeader('X-AI-Provider', providerLower); } catch (e) { /* ignore */ }
      return res.json({ text });
    } catch (err) {
      console.error('AI proxy error', err);
      // Deterministic fallback for local dev/testing so client/reporting flow can be exercised
      const fallback = `Overview:\nThis is a local fallback response summarizing the plan for ${p1.name || 'Person 1'}.\n\nTips:\n1. Review asset allocation.\n2. Increase retirement savings by 1-3%.\n3. Revisit retirement age and Social Security timing.`;
            try { res.setHeader('X-AI-Provider', (req.body && req.body.aiProvider) || req.query.ai_provider || process.env.AI_PROVIDER || 'google'); } catch (e) { /* ignore */ }
            return res.status(200).json({ text: fallback, _fallback: true });
    }
  } catch (err) {
    console.error('AI proxy error', err);
    return res.status(500).json({ error: 'AI proxy error' });
  }
});

// Server-side event forwarding to avoid CORS issues calling portal cloud function
const fs = require('fs');
app.post('/api/report', async (req, res) => {
  try {
    const trackUrl = process.env.PORTAL_TRACK_URL;
    if (!trackUrl) {
      // For local dev, don't fail the client — return a harmless success with a warning
      const warning = 'PORTAL_TRACK_URL not configured; skipping portal forwarding';
      console.warn(warning);
      fs.appendFileSync('/tmp/ai-proxy-4000.log', `${new Date().toISOString()} - report: skipped forwarding (${warning})\n`);
      return res.status(200).json({ ok: true, warning, forwarded: false });
    }

    const resp = await fetch(trackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await resp.text();
    if (!resp.ok) {
      fs.appendFileSync('/tmp/ai-proxy-4000.log', `${new Date().toISOString()} - report: forwarding failed status=${resp.status} body=${text}\n`);
      return res.status(resp.status).send(text);
    }

    // Try to parse JSON response to validate shape
    let parsed = null;
    try { parsed = JSON.parse(text); } catch (e) { /* non-json body */ }
    fs.appendFileSync('/tmp/ai-proxy-4000.log', `${new Date().toISOString()} - report: forwarded OK response=${parsed ? JSON.stringify(parsed) : text}\n`);
    return res.status(200).send(text);
  } catch (err) {
    console.error('Report forwarding error', err);
    try { fs.appendFileSync('/tmp/ai-proxy-4000.log', `${new Date().toISOString()} - report: error ${String(err)}\n`); } catch (e) { /* ignore */ }
    return res.status(500).json({ error: 'Report forwarding failed' });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AI proxy listening on ${port}`));
