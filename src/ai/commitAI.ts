import { openai } from "./client.js";

export async function generateAICommitMessage(
    diff:string,
    pastCommits:string = ""
){
    const response = await openai.chat.completions.create({
       model:"openrouter/free",
        messages:[
            {
                role:"system",
                content:
                `
                You are an expert developer workflow assistant. Your only task is to generate a single, professional Git commit message based on the provided diff.

**CRITICAL RULES:**
1. Follow the Conventional Commits specification strictly.
2. Format: <type>(<scope>): <subject>
3. Valid Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci.
4. Keep the subject line under 72 characters.
5. Use the imperative mood in the subject line (e.g., "add feature", not "added feature" or "adds feature").
6. Do not end the subject line with a period.
7. Output ONLY the commit message. No markdown blocks, no explanations, no chatty introductions.

**USER'S STYLE CONTEXT:**
Here are the user's recent commits. Try to match their formatting style (e.g., if they use emojis, use an emoji; if they use specific scopes, match them):
${pastCommits ? pastCommits : "No past commits available. Use standard conventions."}
            `
            },
            {
                role:"user",
                content: `Analyze this git diff and generate the commit message:\n\n${diff}`
            }
        ]
    });

    return response.choices[0].message.content?.trim() || "";
}