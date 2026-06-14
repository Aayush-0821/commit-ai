import { getOpenAIClient } from "../ai/client.js";

export async function generatePRContent(diff: string) {
    const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "openrouter/free",
    messages: [
      {
        role: "system",

        content: `

You are a senior developer.

Create GitHub PR information.

Return JSON only:

{
"title":"",
"body":""
}

Title should follow conventional commits.

Body should summarize:
- what changed
- why
- risks
`,
      },

      {
        role: "user",

        content: diff,
      },
    ],
  });

  let text = response.choices[0].message.content?.trim() || "{}";

  if(text.startsWith("```json")){
    text = text.replace(/```json/g,"").replace(/```/g,"").trim();
  }

  return JSON.parse(text);
}
