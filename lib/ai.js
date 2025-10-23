import axios from "axios";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_MODEL = "deepseek/DeepSeek-R1";
const API_URL = "https://api.github.com/inference";

export async function summarizeNews(text) {
  try {
    const response = await axios.post(
      `${API_URL}`,
      {
        model: GITHUB_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are an assistant that summarizes cryptocurrency news clearly and briefly (max 300 characters). No links, no repetition.",
          },
          {
            role: "user",
            content: text,
          },
        ],
        max_output_tokens: 256,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const content = response.data.output?.[0]?.content?.[0]?.text || "";
    return content.length > 300 ? content.slice(0, 297) + "..." : content;
  } catch (error) {
    console.error("AI summarize error:", error.response?.data || error.message);

    // fallback jika rate limit atau error respons tidak valid
    if (error.response?.status === 429) {
      return "⏳ Too many requests to AI. Please wait before summarizing again.";
    }
    return "⚠️ Failed to summarize this news. Please retry later.";
  }
}

export async function replyToUser(context, userMessage) {
  try {
    const response = await axios.post(
      `${API_URL}`,
      {
        model: GITHUB_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are an AI that replies naturally to comments about crypto news. Be friendly, concise, and reply in the same language as the user. Max 300 characters.",
          },
          { role: "assistant", content: context },
          { role: "user", content: userMessage },
        ],
        max_output_tokens: 256,
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const reply = response.data.output?.[0]?.content?.[0]?.text || "";
    return reply.length > 300 ? reply.slice(0, 297) + "..." : reply;
  } catch (error) {
    console.error("AI reply error:", error.response?.data || error.message);

    if (error.response?.status === 429) {
      return "AI rate limit reached. Please try again in a few seconds.";
    }
    return "⚠️ Sorry, I couldn’t reply right now.";
  }
}
