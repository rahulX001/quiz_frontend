// services/gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getModel(name) {
  return genAI.getGenerativeModel({ model: name });
}

async function generate(prompt) {
  try {
    // Try main model
    const flashModel = getModel("gemini-2.5-flash");
    const result = await flashModel.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.warn("⚠️ flash model error:", err.message);

    // If model not found or overloaded — fallback to pro
    try {
      console.warn("👉 Using gemini-2.5-pro instead...");
      const proModel = getModel("gemini-2.5-pro");
      const result = await proModel.generateContent(prompt);
      return result.response.text();
    } catch (innerErr) {
      console.error("❌ Gemini API Error:", innerErr.message);
      throw innerErr;
    }
  }
}

module.exports = { generate };
