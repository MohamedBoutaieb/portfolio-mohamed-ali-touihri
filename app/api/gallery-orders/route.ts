import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getProjectGallery, isProjectPhotoOrder, PROJECT_GALLERIES } from "@/lib/project-galleries";
import { getProjectPhotoOrder, saveProjectPhotoOrder } from "@/lib/lycee-order-store";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export async function GET() {
  const galleries = await Promise.all(PROJECT_GALLERIES.map(async (gallery) => ({
    id: gallery.id,
    title: gallery.title,
    sectionId: gallery.sectionId,
    lightboxKey: gallery.lightboxKey,
    photos: gallery.photos,
    order: await getProjectPhotoOrder(gallery.id),
  })));
  return json({ galleries });
}

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Origine non autorisée." }, 403);

  const user = await getChatGPTUser();
  const adminEmail = env.PORTFOLIO_ADMIN_EMAIL?.trim().toLowerCase();
  if (!user) return json({ error: "Connectez-vous pour enregistrer." }, 401);
  if (!adminEmail || user.email.trim().toLowerCase() !== adminEmail) {
    return json({ error: "Accès réservé au propriétaire du portfolio." }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 20_000) return json({ error: "La liste envoyée est trop volumineuse." }, 413);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "La requête ne contient pas un ordre valide." }, 400);
  }

  const galleryId = typeof payload === "object" && payload !== null && "galleryId" in payload
    ? payload.galleryId
    : null;
  const order = typeof payload === "object" && payload !== null && "order" in payload
    ? payload.order
    : null;
  if (typeof galleryId !== "string") return json({ error: "Projet manquant." }, 400);
  const gallery = getProjectGallery(galleryId);
  if (!gallery) return json({ error: "Projet inconnu." }, 404);
  if (!isProjectPhotoOrder(gallery, order)) {
    return json({ error: "La liste doit contenir chaque photo une seule fois." }, 400);
  }

  await saveProjectPhotoOrder(galleryId, order);
  return json({ saved: true, galleryId, order });
}
