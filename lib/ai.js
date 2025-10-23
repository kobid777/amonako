import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = process.env["GITHUB_TOKEN"];
const client = ModelClient(
  "https://models.github.ai/inference",
  new AzureKeyCredential(token)
);

// Summarize news
export async function summarizeNews(text) {
  const response = await client.path("/chat/completions").post({
    body: {
      model: "deepseek/DeepSeek-R1",
      messages: [
        {
          role: "user",
          content: `Summarize this crypto news in one short paragraph (max 300 words):\n\n${text}`,
        },
      ],
      max_tokens: 400,
    },
  });

  if (isUnexpected(response)) throw response.body.error;
  return response.body.choices[0].message.content.trim();
}

// Generate human-like reply
export async function generateReply(articleSummary, userComment) {
  const response = await client.path("/chat/completions").post({
    body: {
      model: "deepseek/DeepSeek-R1",
      messages: [
        {
          role: "user",
          content: `Article summary:\n${articleSummary}\n\nUser comment:\n${userComment}\n\nRespond naturally and conversationally in ≤300 words. Detect and reply in user's language.`,
        },
      ],
      max_tokens: 400,
    },
  });

  if (isUnexpected(response)) throw response.body.error;
  return response.body.choices[0].message.content.trim();
}
