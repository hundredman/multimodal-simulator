// netlify/functions/analyze.js

const { Configuration, OpenAIApi } = require("openai");

exports.handler = async function(event, context) {
  const body = JSON.parse(event.body);
  const question = body.question;
  const answer = body.answer;

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // 환경변수 사용
  });

  const openai = new OpenAIApi(configuration);

  const prompt = `
You are an interview coach. Analyze the following job interview answer in Korean.
Give a short analysis and a score from 1 to 10.

Question: ${question}
Answer: ${answer}

Respond in this JSON format:
{
  "score": number,
  "feedback": "string"
}
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const response = completion.data.choices[0].message.content;

    return {
      statusCode: 200,
      body: response,
      headers: {
        "Content-Type": "application/json"
      }
    };
  } catch (error) {
    console.error("GPT API Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI API 호출 오류", details: error.message }),
    };
  }
};