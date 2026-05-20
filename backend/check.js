// Run with: node check.js
// Checks your setup before starting the server

require("dotenv").config();
const key = process.env.GROQ_API_KEY;

console.log("\n🔍 NutriInfo Setup Check\n");

if (!key || key === "gsk_your_groq_api_key_here") {
  console.log("❌  GROQ_API_KEY is not set!");
  console.log("    1. Open backend/.env");
  console.log("    2. Replace gsk_your_groq_api_key_here with your real key");
  console.log("    3. Get a free key at https://console.groq.com\n");
  process.exit(1);
} else if (!key.startsWith("gsk_")) {
  console.log("❌  GROQ_API_KEY looks wrong — Groq keys start with 'gsk_'\n");
  process.exit(1);
} else {
  console.log("✅  GROQ_API_KEY found:", key.slice(0, 8) + "••••••••");
  console.log("✅  PORT:", process.env.PORT || 5000);
  console.log("\n🚀  Everything looks good! Run:  npm run dev\n");
}
