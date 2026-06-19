// Tarayicidan gelen bildirim istegini ntfy.sh'a iletir (CORS sorunu olmadan).
const NTFY_TOPIC = "ortaokuldart";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Sadece POST", { status: 405 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body.title || "Puan Tablosu").toString().slice(0, 120);
    const message = (body.message || "").toString().slice(0, 2000);
    const tags = (body.tags || "").toString().slice(0, 120);

    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": encodeHeader(title),
        "Tags": encodeHeader(tags),
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: message,
    });

    if (!res.ok) {
      return Response.json({ ok: false, status: res.status }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
};

// ntfy header'lari ASCII ister; turkce karakterleri sadelestir.
function encodeHeader(s) {
  return s
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/[^\x20-\x7E]/g, "");
}

export const config = { path: "/api/notify" };
