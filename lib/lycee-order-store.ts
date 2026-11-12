import { env } from "cloudflare:workers";
import { getProjectGallery, isProjectPhotoOrder, PROJECT_GALLERIES } from "./project-galleries";

const GALLERY_ID = "lycee-libanais";

export async function getProjectPhotoOrder(galleryId: string): Promise<string[]> {
  const gallery = getProjectGallery(galleryId);
  if (!gallery) throw new Error("Galerie inconnue.");
  const defaultOrder = gallery.photos.map((photo) => photo.id);
  const database = env.DB;
  if (!database) return defaultOrder;

  const row = await database
    .prepare(
      "SELECT photo_order_json FROM gallery_orders WHERE gallery_id = ?",
    )
    .bind(galleryId)
    .first<{ photo_order_json: string }>();

  if (!row) return [...LYCEE_DEFAULT_ORDER];

  try {
    const parsed: unknown = JSON.parse(row.photo_order_json);
    return isProjectPhotoOrder(gallery, parsed)
      ? parsed
      : defaultOrder;
  } catch {
    return defaultOrder;
  }
}

export async function getAllProjectPhotoOrders(): Promise<Record<string, string[]>> {
  const entries = await Promise.all(PROJECT_GALLERIES.map(async (gallery) => [
    gallery.id,
    await getProjectPhotoOrder(gallery.id),
  ] as const));
  return Object.fromEntries(entries);
}

export async function saveProjectPhotoOrder(galleryId: string, order: string[]): Promise<void> {
  const gallery = getProjectGallery(galleryId);
  if (!gallery || !isProjectPhotoOrder(gallery, order)) {
    throw new Error("La liste doit contenir chaque photo une seule fois.");
  }
  const database = env.DB;
  if (!database) throw new Error("La base du portfolio est indisponible.");

  await database
    .prepare(
      `INSERT INTO gallery_orders (gallery_id, photo_order_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(gallery_id) DO UPDATE SET
         photo_order_json = excluded.photo_order_json,
         updated_at = excluded.updated_at`,
    )
    .bind(galleryId, JSON.stringify(order), new Date().toISOString())
    .run();
}

export async function getLyceePhotoOrder(): Promise<string[]> {
  return getProjectPhotoOrder(GALLERY_ID);
}

export async function saveLyceePhotoOrder(order: string[]): Promise<void> {
  return saveProjectPhotoOrder(GALLERY_ID, order);
}
