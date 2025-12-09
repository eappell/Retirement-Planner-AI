const fetch = globalThis.fetch || require('node-fetch');
let GoogleGenAI;
try { GoogleGenAI = require('@google/genai').GoogleGenAI; } catch (e) { GoogleGenAI = null; }

const generateWithGoogle = async (prompt) => {
  if (!GoogleGenAI) throw new Error('Google GenAI client not available');
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const resp = await client.models.generateContent({ model: process.env.GOOGLE_MODEL || 'gemini-2.5-flash', contents: prompt });
  return resp.text;
};

const generateWithClaude = async (prompt) => {
  const key = process.env.CLAUDE_API_KEY;
  if (!key) throw new Error('CLAUDE_API_KEY not set');
  const model = process.env.CLAUDE_MODEL || 'claude-2.1';
  const url = model.startsWith('claude-opus') ? 'https://api.anthropic.com/v1/messages' : 'https://api.anthropic.com/v1/complete';
  const body = model.startsWith('claude-opus') ? { model, messages: [{ role: 'user', content: prompt }], max_tokens: 800 } : { model, prompt, max_tokens_to_sample: 800 };
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key }, body: JSON.stringify(body) });
  if (!resp.ok) throw new Error(`Claude error: ${resp.status}`);
  const json = await resp.json();
  if (json?.output_text) return json.output_text;
  if (json?.completion) return json.completion;
  if (json?.message?.content) return json.message.content;
  return JSON.stringify(json);
};

module.exports = async (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'X-AI-Provider');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const body = req.body || await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(JSON.parse(d||'{}'))); });
    const { plan, result } = body || {};
    if (!plan || !result || !plan.person1) return res.status(400).json({ error: 'Missing required plan or result data (need plan.person1 and result)' });

    const planType = plan.planType || 'Unknown';
    const p1 = plan.person1 || {};
    const planSummary = `A user is planning for retirement with the following details:\n- Planning for: ${planType}\n\nPeople:\n- ${p1.name || 'Person 1'}: age ${p1.currentAge ?? 'Unknown'}, retires ${p1.retirementAge ?? 'Unknown'}\n\nFinancials:\n- Avg monthly net income (today): ${result.avgMonthlyNetIncomeToday || 0}`;

    const prompt = `You are a friendly financial advisor. Read the plan summary and give a short Overview and three Actionable Tips in Markdown.\n\n${planSummary}`;

    const provider = (body && body.aiProvider) || process.env.AI_PROVIDER || 'google';
    const providerLower = String(provider).toLowerCase();

    let text;
    try {
      if (providerLower === 'claude') text = await generateWithClaude(prompt);
      else text = await generateWithGoogle(prompt);
    } catch (err) {
      console.error('AI generation error', String(err));
      const fallback = `Overview:\nThis is a fallback response summarizing the plan.\n\nTips:\n1. Review asset allocation.\n2. Increase retirement savings by 1-3%.\n3. Revisit retirement age and Social Security timing.`;
      res.setHeader('X-AI-Provider', providerLower);
      return res.status(200).json({ text: fallback, _fallback: true });
    }

    if (typeof text !== 'string') text = String(text);
    try { text = text.replace(/\n---\n/g, '\n<hr />\n'); } catch (e) { /* ignore */ }
    res.setHeader('X-AI-Provider', providerLower);
    return res.status(200).json({ text });
  } catch (err) {
    console.error('insights function error', err);
    return res.status(500).json({ error: 'insights error' });
  }
};
