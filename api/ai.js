// /api/ai.js — Vercel Serverless Function
module.exports = async function(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system, content } = req.body;

    if (!system || !content) {
      return res.status(400).json({ error: "system e content são obrigatórios" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          { role: "system", content: system + "\nHoje: " + new Date().toLocaleDateString("pt-BR") },
          { role: "user",   content: content }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `OpenAI HTTP ${response.status}`;
      return res.status(502).json({ error: msg });
    }

    const text = (data.choices?.[0]?.message?.content || "")
      .replace(/```json|```/g, "")
      .trim();

    if (!text) {
      return res.status(502).json({ error: "Resposta vazia da OpenAI" });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "IA retornou formato inválido. Tente novamente." });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno no servidor" });
  }
}