require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 5000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NutriInfo backend running ✅",
    groq_configured: !!GROQ_API_KEY && GROQ_API_KEY !== "gsk_your_groq_api_key_here",
  });
});

// ── Helper: strip control chars that break JSON.parse ─────────────────
function cleanJSON(raw) {
  return (
    raw
      .trim()
      // remove markdown code fences
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
      // replace literal newlines / tabs / carriage returns INSIDE the string
      // with their escaped versions so JSON.parse doesn't choke
      .replace(/[\u0000-\u001F\u007F]/g, (ch) => {
        const escapes = {
          "\n": "\\n",
          "\r": "\\r",
          "\t": "\\t",
          "\b": "\\b",
          "\f": "\\f",
        };
        return escapes[ch] ?? ""; // drop other control chars entirely
      })
  );
}

// ── Analyze food ──────────────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "query field is required." });
  }

  if (!GROQ_API_KEY || GROQ_API_KEY === "gsk_your_groq_api_key_here") {
    return res.status(500).json({
      error: "GROQ_API_KEY not set. Open backend/.env and paste your key from console.groq.com",
    });
  }

  const prompt = `You are a professional nutritionist. Analyze the nutrition for: "${query.trim()}"
Respond with ONLY a single-line JSON object. No newlines inside string values. No markdown. No explanation.
Use this exact shape:
{"food_name":"name","emoji":"emoji","category":"type","serving_size":"desc","calories":0,"daily_calories_pct":0,"macros":{"protein":{"g":0,"pct_calories":0},"carbs":{"g":0,"pct_calories":0},"fat":{"g":0,"pct_calories":0},"fiber":{"g":0}},"nutrients":{"saturated_fat":0,"sugar":0,"sodium":0,"potassium":0,"calcium":0,"iron":0,"vitamin_c":0,"vitamin_a":0},"nutrient_units":{"saturated_fat":"g","sugar":"g","sodium":"mg","potassium":"mg","calcium":"mg","iron":"mg","vitamin_c":"mg","vitamin_a":"μg"},"health_score":0,"health_label":"Excellent","health_summary":"summary here","badges":[{"text":"label","type":"green"}],"tips":["tip1","tip2","tip3"],"comparison":[{"label":"vs Avg Meal","value":0,"max":600,"color":"#2d6a4f"},{"label":"Daily Fiber","value":0,"max":30,"color":"#d4a017"},{"label":"Daily Protein","value":0,"max":50,"color":"#e76f51"}]}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "You are a nutrition expert. Output ONLY a compact single-line JSON object. No markdown, no backticks, no newlines inside values, no extra text before or after.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.json().catch(() => ({}));
      const msg = errBody?.error?.message || `Groq API error ${groqRes.status}`;
      console.error("Groq error:", msg);
      return res.status(groqRes.status).json({ error: msg });
    }

    const data = await groqRes.json();
    const rawContent = data.choices[0].message.content;

    // ── Sanitize then parse ───────────────────────────────────────────
    const cleaned = cleanJSON(rawContent);

    let nutrition;
    try {
      nutrition = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw content:\n", rawContent);
      console.error("Cleaned string:\n", cleaned);
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    return res.json({ success: true, data: nutrition });

  } catch (err) {
    console.error("Server error:", err.message);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  NutriInfo backend → http://localhost:${PORT}`);
  console.log(`🔑  Groq key : ${GROQ_API_KEY && GROQ_API_KEY !== "gsk_your_groq_api_key_here" ? "configured ✓" : "NOT SET ✗"}\n`);
});