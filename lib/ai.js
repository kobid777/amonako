import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("❌ Missing GITHUB_TOKEN in environment variables");
}

const client = ModelClient("https://models.github.ai/inference", new AzureKeyCredential(token));

export async function summarizeNews(text) {
  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          {
            role: "user",
            content: `Summarize the following crypto news article in one short paragraph (max 300 words). Do not include links:\n\n${text}`,
          },
        ],
        model: "deepseek/DeepSeek-R1",
        max_tokens: 400,
      },
    });

    if (isUnexpected(response)) {
      console.error("AI API returned error:", response.body?.error);
      throw new Error(response.body?.error?.message || "AI request failed");
    }

    const output = response.body.choices?.[0]?.message?.content || "";
    return output.trim() || "No summary generated.";
  } catch (err) {
    console.error("❌ summarizeNews() failed:", err);
    return "⚠️ AI summarization failed. Please check the logs or token.";
  }
}
