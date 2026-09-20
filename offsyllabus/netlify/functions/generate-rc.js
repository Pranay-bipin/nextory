exports.handler = async function(event, context) {
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable" })
    };
  }

  const topics = ["Philosophy", "Economics", "Sociology", "Psychology", "Political Science"];
  const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `
Generate a single JSON object for a CAT/IPMAT level Reading Comprehension passage.
Topic: ${selectedTopic}.

Respond ONLY with valid raw JSON using this exact structure:
{
  "id": "gen-${Date.now()}",
  "date": "${new Date().toISOString().slice(0, 10)}",
  "source": "generated",
  "title": "<Catchy Academic Title>",
  "genre": "${selectedTopic}",
  "difficulty": "CAT/IPMAT Level",
  "passage": "<Passage text around 350-400 words with dense vocabulary and complex argument structure>",
  "questions": [
    {
      "id": "q1",
      "question": "<Inference or Main Idea Question>",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "answer": 0,
      "explanation": "<Step-by-step elimination why the correct answer works and why distractors fail>"
    }
  ]
}
Include exactly 4 questions. The answer field must be an integer index (0, 1, 2, or 3).
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) || rawText.match(/```([\s\S]*?)\n```/);
    const parsedData = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate passage: " + error.message })
    };
  }
};