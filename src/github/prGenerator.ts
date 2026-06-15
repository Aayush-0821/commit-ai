import { getOpenAIClient } from "../ai/client.js";

export async function generatePRContent(diff: string) {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "openrouter/free",
    messages: [
      {
        role: "system",

        content: `
You are a strict, machine-readable API. 
Your ONLY output must be a raw, valid JSON object. 
DO NOT wrap the response in markdown code blocks (\`\`\`json).
DO NOT add conversational text.

Structure your response EXACTLY like this:
{
  "title": "feat(scope): conventional commit style title",
  "body": "## Summary\\nBrief summary\\n\\n## Changes\\n- Bullet points\\n\\n## Risks\\n- Known risks"
}
`,
      },

      {
        role: "user",

        content: diff,
      },
    ],
  });

  let text = response.choices[0].message.content?.trim() || "{}";

  if (text.startsWith("```json")) {
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
  }

  return JSON.parse(text);
}
