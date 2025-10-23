import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { replyToUser } from "../lib/ai.js"; // ✅ sudah sinkron dengan lib/ai.js

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BOT_ID = process.env.BOT_ID || "999999999"; // isi ID bot kamu dari @userinfobot

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  try {
    const body = req.body;

    // Pastikan ini pesan valid
    if (!body.message) return res.status(200).json({ ok: true });

    const msg = body.message;
    const chatId = msg.chat.id;
    const messageId = msg.message_id;
    const userId = msg.from.id;
    const username = msg.from.username || `user${userId}`;
    const text = msg.text?.trim() || "";

    // Simpan pesan ke Supabase
    await supabase.from("conversations").insert([
      {
        chat_id: chatId,
        message_id: messageId,
        user_id: userId,
        text,
      },
    ]);

    // Ambil 3 pesan terakhir untuk konteks
    const { data: history } = await supabase
      .from("conversations")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(3);

    // Format untuk AI context
    const context = history
      .reverse()
      .map((h) =>
        h.user_id.toString() === BOT_ID
          ? `Bot: ${h.text}`
          : `User: ${h.text}`
      )
      .join("\n");

    // 🔮 Dapatkan balasan dari AI (pakai DeepSeek-R1)
    let reply = await replyToUser(context, text);

    // Batas 300 karakter
    if (reply.length > 300) reply = reply.slice(0, 297) + "...";

    // Kirim balasan ke Telegram
    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: reply,
        reply_to_message_id: messageId,
      });
    } catch (err) {
      console.warn("Telegram sendMessage failed:", err.response?.data || err.message);

      // fallback kalau reply gagal (misalnya pesan terlalu cepat)
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: `@${username} ${reply}`,
      });
    }

    // 🔄 Bersihkan pesan lama (>24 jam)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("conversations").delete().lt("created_at", cutoff);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
      }
