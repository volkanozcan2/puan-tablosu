import { getStore } from "@netlify/blobs";

// Tek, kalici global store. Deploy'lar (GitHub push) bu veriyi SIFIRLAMAZ.
const STORE_NAME = "puan-tablosu-skorlar";
function getScoreStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export default async (req) => {
  const store = getScoreStore();
  const url = new URL(req.url);

  try {
    // --- Gecmis maclari listele ---
    if (req.method === "GET") {
      const { blobs } = await store.list({ prefix: "game:" });
      const games = await Promise.all(
        blobs.map((b) => store.get(b.key, { type: "json" }))
      );
      games.sort((a, b) => (b?.savedAt || 0) - (a?.savedAt || 0));
      return Response.json(games.filter(Boolean));
    }

    // --- Yeni mac kaydet ---
    if (req.method === "POST") {
      const body = await req.json();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record = {
        id,
        savedAt: Date.now(),
        mode: body.mode === "group" ? "group" : "solo",
        rounds: Number(body.rounds) || 0,
        results: Array.isArray(body.results) ? body.results : [],
      };
      await store.setJSON(`game:${id}`, record);
      return Response.json(record, { status: 201 });
    }

    // --- Sil (tek mac ya da tumu) ---
    if (req.method === "DELETE") {
      if (url.searchParams.get("all") === "1") {
        const { blobs } = await store.list({ prefix: "game:" });
        await Promise.all(blobs.map((b) => store.delete(b.key)));
        return Response.json({ deleted: blobs.length });
      }
      const id = url.searchParams.get("id");
      if (id) {
        await store.delete(`game:${id}`);
        return Response.json({ deleted: 1 });
      }
      return new Response("id veya all parametresi gerekli", { status: 400 });
    }

    return new Response("Desteklenmeyen metot", { status: 405 });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};

export const config = { path: "/api/scores" };
