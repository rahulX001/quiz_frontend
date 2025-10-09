const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getModel(modelName) {
  return genAI.getGenerativeModel({ model: modelName });
}

async function generate(prompt) {
  try {
    const flashModel = getModel("gemini-2.5-flash"); // ✅ new model
    const result = await flashModel.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    if (err.message.includes("404")) {
      console.warn("⚠️ gemini-2.5-flash not found, retrying with gemini-2.5-pro...");
      try {
        const proModel = getModel("gemini-2.5-pro"); // ✅ new model
        const result = await proModel.generateContent(prompt);
        return result.response.text();
      } catch (innerErr) {
        console.error("Gemini API (pro) error:", innerErr.message);
        throw innerErr;
      }
    } else {
      console.error("Gemini API error:", err.message);
      throw err;
    }
  }
}

module.exports = { generate };
