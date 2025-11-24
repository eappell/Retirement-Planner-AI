const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

if (!process.env.API_KEY) {
  console.warn('Warning: API_KEY not set in server environment. AI proxy will fail without it.');
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

app.post('/api/insights', async (req, res) => {
  try {
    const { plan, result } = req.body || {};
    if (!plan || !result) return res.status(400).json({ error: 'Missing plan or result in request body' });

    const totalInvestments = ([...(plan.retirementAccounts || []), ...(plan.investmentAccounts || [])]).reduce((s, a) => s + (a.balance || 0), 0);

    const planSummary = `A user is planning for retirement with the following details:\n- Planning for: ${plan.planType}\n- State: ${plan.state}\n- Inflation: ${plan.inflationRate}%\n- Avg return: ${plan.avgReturn}%\n\nPeople:\n- ${plan.person1.name}: age ${plan.person1.currentAge}, retires ${plan.person1.retirementAge}\n${plan.planType==='Couple' ? `- ${plan.person2.name}: age ${plan.person2.currentAge}, retires ${plan.person2.retirementAge}\n` : ''}\nFinancials:\n- Total investments: ${formatCurrency(totalInvestments)}\n- Avg monthly net income (today): ${formatCurrency(result.avgMonthlyNetIncomeToday)}\n- Net worth at end: ${formatCurrency(result.netWorthAtEnd)}\n`;

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
