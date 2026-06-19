// Sayfa acilisinda cagrilir. Cihazin IP + cografi bilgisini Netlify header'larindan,
// cihaz/tarayici bilgisini tarayicidan alip ntfy log kanalina yollar.
const LOG_TOPIC = "ortaokuldart-log-x9k2";

export default async (req, context) => {
  try {
    const body = await req.json().catch(() => ({}));
    const h = req.headers;

    // IP: Netlify gercek istemci IP'sini bu header'da verir
    const ip =
      h.get("x-nf-client-connection-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "bilinmiyor";

    // Cografi bilgi: Netlify context.geo (Edge) saglar
    const geo = (context && context.geo) || {};
    const city = geo.city || "?";
    const region = (geo.subdivision && geo.subdivision.name) || "";
    const country =
      (geo.country && (geo.country.name || geo.country.code)) || "?";
    const ll =
      geo.latitude && geo.longitude ? `${geo.latitude},${geo.longitude}` : "";

    const ua = h.get("user-agent") || "?";
    const acceptLang = (h.get("accept-language") || "").split(",")[0] || "?";

    // Tarayicidan gelen ek bilgiler
    const b = body || {};
    const lines = [
      `IP: ${ip}`,
      `Yer: ${city}${region ? ", " + region : ""}, ${country}`,
      ll ? `Konum: ${ll}` : "",
      `Cihaz: ${b.platform || "?"} ${b.mobile ? "(mobil)" : ""}`.trim(),
      `Tarayici: ${b.browser || shortUA(ua)}`,
      `Ekran: ${b.screen || "?"} | Pencere: ${b.viewport || "?"}`,
      `Dil: ${b.language || acceptLang}`,
      `Saat dilimi: ${b.timezone || "?"}`,
      b.referrer ? `Referrer: ${b.referrer}` : "Referrer: dogrudan",
      `UA: ${ua}`,
    ].filter(Boolean);

    await fetch(`https://ntfy.sh/${LOG_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": "Yeni ziyaret",
        "Tags": "eyes",
        "Priority": "low",
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: lines.join("\n"),
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
};

function shortUA(ua) {
  // kaba bir tarayici tahmini (tarayici JS gondermezse yedek)
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "bilinmiyor";
}

export const config = { path: "/api/visit" };
