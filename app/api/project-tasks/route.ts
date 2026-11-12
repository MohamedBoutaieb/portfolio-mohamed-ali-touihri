import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getProjectTaskDescriptions, saveProjectTaskDescription } from "@/lib/project-task-store";
import { isProjectId, isProjectTaskDescription } from "@/lib/project-tasks";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET() {
  return json({ descriptions: await getProjectTaskDescriptions() });
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
  if (contentLength > 12_000) {
    return json({ error: "La description envoyée est trop volumineuse." }, 413);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "La requête ne contient pas une description valide." }, 400);
  }

  if (typeof payload !== "object" || payload === null || !("projectId" in payload) || !("description" in payload)) {
    return json({ error: "Le projet et sa description sont nécessaires." }, 400);
  }

  const projectId = payload.projectId;
  const description = payload.description;
  if (!isProjectId(projectId) || !isProjectTaskDescription(description)) {
    return json({ error: "Choisissez un projet et une description de 4 000 caractères maximum." }, 400);
  }

  await saveProjectTaskDescription(projectId, description);
  return json({ saved: true, projectId, description: description.trim() });
}
