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
require('dotenv').config();

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
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.indexOf('*') !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

if (!process.env.API_KEY) {
  console.warn('Warning: API_KEY not set in server environment. AI proxy will return a fallback message.');
}

// Create an `ai` wrapper. If GoogleGenAI is available, use it; otherwise provide a safe fallback.
let ai;
if (GoogleGenAI) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}
if (!ai) {
  // fallback implementation so server builds and runs even when the real client isn't installed
  ai = {
    models: {
      async generateContent(opts) {
        return { text: 'AI proxy not available: server dependency @google/genai is not installed or could not be initialized.' };
      }
    }
  };
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({ text: response.text });
  } catch (err) {
    console.error('AI proxy error', err);
    return res.status(500).json({ error: 'AI proxy error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`AI proxy listening on ${port}`));
