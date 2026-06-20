// Oyun olaylarini JSON olarak ntfy'ye yollar. Mesaj govdesi tek satir JSON'dur.
const NTFY_TOPIC = "ortaokuldart";

export default async (req) => {
  if (req.method !== "POST") return new Response("Sadece POST", { status: 405 });
  try {
    const body = await req.json().catch(() => ({}));
    const event = (body.event || "olay").toString();

    const record = {
      kanal: "oyun",
      event,                          // oyun_basladi | oyun_bitti
      uid: (body.uid || "").toString(),
      zaman: new Date().toISOString(),
      veri: body.data || {},
    };

    const titleMap = {
      oyun_basladi: "Oyun basladi",
      oyun_bitti: "Oyun bitti",
    };
    const tagMap = {
      oyun_basladi: "arrow_forward",
      oyun_bitti: "checkered_flag",
    };

    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": titleMap[event] || "Oyun olayi",
        "Tags": "dart," + (tagMap[event] || "information_source"),
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(record),
    });

    if (!res.ok) return Response.json({ ok: false, status: res.status }, { status: 502 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
};

export const config = { path: "/api/notify" };
