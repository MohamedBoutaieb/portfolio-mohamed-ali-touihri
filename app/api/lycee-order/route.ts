import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { LYCEE_PHOTOS, isLyceePhotoOrder } from "@/lib/lycee-photos";
import {
  getLyceePhotoOrder,
  saveLyceePhotoOrder,
} from "@/lib/lycee-order-store";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET() {
  const order = await getLyceePhotoOrder();
  return json({ order, photos: LYCEE_PHOTOS });
}

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "Origine non autorisée." }, 403);
  }

  const user = await getChatGPTUser();
  const adminEmail = env.PORTFOLIO_ADMIN_EMAIL?.trim().toLowerCase();
  if (!user) return json({ error: "Connectez-vous pour enregistrer." }, 401);
  if (!adminEmail || user.email.trim().toLowerCase() !== adminEmail) {
    return json({ error: "Accès réservé au propriétaire du portfolio." }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 10_000) {
    return json({ error: "La liste envoyée est trop volumineuse." }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "La requête ne contient pas une liste valide." }, 400);
  }

  const order =
    typeof payload === "object" && payload !== null && "order" in payload
      ? payload.order
      : null;
  if (!isLyceePhotoOrder(order)) {
    return json({ error: "La liste doit contenir chaque photo une seule fois." }, 400);
  }

  await saveLyceePhotoOrder(order);
  return json({ saved: true, order });
}
