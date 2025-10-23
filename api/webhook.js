import { generateReply } from "../lib/ai.js";
import { replyMessage } from "../lib/telegram.js";

export default async function handler(req, res) {
  try {
    const update = req.body;
    if (!update.message || !update.message.reply_to_message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const replyTo = update.message.reply_to_message.message_id;
    const userComment = update.message.text;

    const articleSummary = update.message.reply_to_message.text.slice(0, 1000);
    const reply = await generateReply(articleSummary, userComment);

    await replyMessage(chatId, reply, replyTo);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
}
