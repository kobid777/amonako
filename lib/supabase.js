import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export async function articleExists(guid) {
  const { data } = await supabase.from("articles").select("id").eq("guid", guid).limit(1);
  return data && data.length > 0;
}

export async function saveArticle({ source, title, guid, summary }) {
  await supabase.from("articles").insert([{ source, title, guid, summary }]);
}

export async function cleanupOld() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("articles").delete().lt("created_at", cutoff);
  await supabase.from("messages").delete().lt("created_at", cutoff);
}
