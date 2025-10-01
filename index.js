require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const gemini = require("./services/gemini"); // helper
const Quiz = require("./models/Quiz");

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// --- Create a quiz manually ---
app.post("/api/quizzes", async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    console.error("Error saving quiz:", err);
    res.status(500).json({ error: "Failed to save quiz" });
  }
});

// --- Generate quiz using Gemini ---
app.post("/api/quizzes/generate", async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;

    const prompt = `
Generate ${count} hard multiple-choice questions (each with 4 options and one correct option) about: ${topic}.
Questions should be designed to test deeper understanding, tricky concepts, or application-based reasoning (not simple recall).
Return ONLY raw JSON in this format:
[
  { "question": "...", "options": ["A...", "B...", "C...", "D..."], "answer": "A", "explanation": "..." }
]
    `;

    // Use Gemini service
    const aiResponse = await gemini.generate(prompt);

    let questions;
    try {
      // Clean response before parsing
      let cleaned = aiResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      questions = JSON.parse(cleaned);

      if (!Array.isArray(questions)) {
        throw new Error("AI did not return an array");
      }
    } catch (parseErr) {
      console.error("❌ JSON parse failed. Raw response:", aiResponse);
      return res.status(500).json({ error: "Invalid JSON from AI" });
    }

    // Save quiz to DB
    const quiz = new Quiz({ title: `AI: ${topic}`, questions });
    await quiz.save();

    res.json(quiz);
  } catch (err) {
    console.error("Error generating quiz:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Get quiz by ID ---
app.get("/api/quizzes/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    console.error("Error fetching quiz:", err);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
