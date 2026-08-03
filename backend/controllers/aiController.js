const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.generateSubtasks = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // We use gemini-1.5-flash as it is extremely fast and perfect for JSON generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert Technical Project Manager. Break down the following parent task into 3 to 5 smaller, highly specific, actionable sub-tasks. 
    Parent Task Title: ${title}
    Parent Task Description: ${description || 'No description provided.'}
    
    You MUST return ONLY a valid JSON array of objects. Do not include markdown formatting or extra text.
    Each object must have exactly these keys:
    "title" (string: concise action-oriented title),
    "description" (string: 1 sentence explaining the specific technical requirement),
    "priority" (string: "Low", "Medium", "High", or "Urgent"),
    "department" (string: "General", "Design", "Frontend", "Backend", or "DevOps")`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        // This forces the AI to output parseable JSON instead of standard text
        responseMimeType: "application/json" 
      }
    });

    const subtasks = JSON.parse(result.response.text());
    res.json(subtasks);
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ message: 'Failed to generate sub-tasks from AI.' });
  }
};