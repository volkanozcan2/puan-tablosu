// Sayfa acilisinda (oturum basina bir kez) cagrilir.
// IP + cografi bilgiyi Netlify'dan, cihaz/tarayici bilgisini tarayicidan alip
// TEK SATIR JSON olarak ntfy log kanalina yollar. Her cihazda UID bulunur.
const LOG_TOPIC = "ortaokuldart-log-x9k2";

export default async (req, context) => {
  try {
    const body = await req.json().catch(() => ({}));
    const h = req.headers;

    const ip =
      h.get("x-nf-client-connection-ip") ||
      (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "bilinmiyor";

    const geo = (context && context.geo) || {};
    const record = {
      kanal: "ziyaret",
      event: "ziyaret",
      uid: (body.uid || "").toString(),
      zaman: new Date().toISOString(),
      ip,
      sehir: geo.city || "",
      bolge: (geo.subdivision && geo.subdivision.name) || "",
      ulke: (geo.country && (geo.country.name || geo.country.code)) || "",
      enlem: geo.latitude || null,
      boylam: geo.longitude || null,
      cihaz: body.platform || "",
      mobil: !!body.mobile,
      tarayici: body.browser || "",
      ekran: body.screen || "",
      pencere: body.viewport || "",
      dil: body.language || (h.get("accept-language") || "").split(",")[0] || "",
      saat_dilimi: body.timezone || "",
      referrer: body.referrer || "",
      ua: h.get("user-agent") || "",
    };

    await fetch(`https://ntfy.sh/${LOG_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": "Yeni ziyaret",
        "Tags": "eyes",
        "Priority": "low",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(record),
    });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
};

export const config = { path: "/api/visit" };
