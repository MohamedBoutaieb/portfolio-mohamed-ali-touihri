import { env } from "cloudflare:workers";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "@/app/chatgpt-auth";
import { PhotoOrderEditor } from "./photo-order-editor";
import { ProjectTaskEditor } from "./project-task-editor";
import { PROJECT_GALLERIES } from "@/lib/project-galleries";
import { getAllProjectPhotoOrders } from "@/lib/lycee-order-store";
import { getProjectTaskDescriptions } from "@/lib/project-task-store";
import { PROJECTS } from "@/lib/project-tasks";

export const dynamic = "force-dynamic";

export default async function PhotoAdministrationPage() {
  const returnTo = "/admin/photos";
  const user = await getChatGPTUser();

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="eyebrow">Administration du portfolio</p>
          <h1>Connectez-vous pour gérer le portfolio</h1>
          <p>La gestion des photos et des descriptions est réservée au propriétaire du site.</p>
          <a className="primary-link" href={chatGPTSignInPath(returnTo)} target="_top">
            Se connecter avec ChatGPT
          </a>
          <a className="back-link" href="/" target="_top">Retour au portfolio</a>
        </section>
        <style>{authStyles}</style>
      </main>
    );
  }

  const adminEmail = env.PORTFOLIO_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email.trim().toLowerCase() !== adminEmail) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="eyebrow">Administration du portfolio</p>
          <h1>Accès réservé</h1>
          <p>Ce compte n’est pas autorisé à modifier le portfolio.</p>
          <a className="back-link" href={chatGPTSignOutPath(returnTo)} target="_top">
            Changer de compte
          </a>
          <a className="back-link" href="/" target="_top">Retour au portfolio</a>
        </section>
        <style>{authStyles}</style>
      </main>
    );
  }

  const initialOrders = await getAllProjectPhotoOrders();
  const initialDescriptions = await getProjectTaskDescriptions();
  return (
    <>
      <PhotoOrderEditor
        galleries={PROJECT_GALLERIES}
        initialOrders={initialOrders}
        signOutHref={chatGPTSignOutPath(returnTo)}
      />
      <ProjectTaskEditor projects={PROJECTS} initialDescriptions={initialDescriptions} />
    </>
  );
}

const authStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f1e9; color: #192c32; font-family: Arial, sans-serif; }
  .auth-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
  .auth-card { max-width: 560px; background: white; border: 1px solid #d8dbd3; padding: 36px; }
  .eyebrow { color: #153e4a; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; }
  h1 { font: 36px/1.12 Georgia, serif; margin: 18px 0; }
  p { line-height: 1.6; }
  .primary-link { display: inline-block; margin: 14px 12px 0 0; padding: 13px 18px; background: #153e4a; color: white; text-decoration: none; }
  .back-link { display: inline-block; margin: 14px 12px 0 0; color: #153e4a; }
`;
