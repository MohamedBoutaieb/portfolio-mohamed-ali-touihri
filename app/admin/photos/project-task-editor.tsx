"use client";

import { useState } from "react";
import styles from "./project-task-editor.module.css";
import type { ProjectId } from "@/lib/project-tasks";

export type ProjectTask = { id: ProjectId; title: string };

type ProjectTaskEditorProps = {
  projects: readonly ProjectTask[];
  initialDescriptions: Record<ProjectId, string>;
};

export function ProjectTaskEditor({ projects, initialDescriptions }: ProjectTaskEditorProps) {
  const [descriptions, setDescriptions] = useState(initialDescriptions);
  const [savedDescriptions, setSavedDescriptions] = useState(initialDescriptions);
  const [savingId, setSavingId] = useState<ProjectId | null>(null);
  const [messages, setMessages] = useState<Partial<Record<ProjectId, string>>>({});

  async function save(projectId: ProjectId) {
    setSavingId(projectId);
    setMessages((current) => ({ ...current, [projectId]: "" }));
    try {
      const response = await fetch("/api/project-tasks", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, description: descriptions[projectId] }),
      });
      const result = (await response.json()) as { error?: string; description?: string };
      if (!response.ok || typeof result.description !== "string") {
        throw new Error(result.error || "Impossible d’enregistrer cette description.");
      }
      setDescriptions((current) => ({ ...current, [projectId]: result.description! }));
      setSavedDescriptions((current) => ({ ...current, [projectId]: result.description! }));
      setMessages((current) => ({
        ...current,
        [projectId]: result.description
          ? "Description enregistrée dans le portfolio."
          : "Description effacée du portfolio.",
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [projectId]: error instanceof Error ? error.message : "Une erreur est survenue.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className={styles.section} id="task-descriptions" aria-labelledby="task-descriptions-title">
      <div className={styles.content}>
        <p className={styles.eyebrow}>Gestion du portfolio</p>
        <h2 id="task-descriptions-title">Décrire mes tâches par projet</h2>
        <p className={styles.intro}>
          Ajoutez les travaux que vous avez réalisés. Chaque description apparaîtra dans la fiche publique du projet correspondant.
        </p>
        <div className={styles.list}>
          {projects.map((project) => {
            const changed = descriptions[project.id] !== savedDescriptions[project.id];
            const saving = savingId === project.id;
            return (
              <article className={styles.card} key={project.id}>
                <label className={styles.label} htmlFor={`tasks-${project.id}`}>{project.title}</label>
                <textarea
                  id={`tasks-${project.id}`}
                  value={descriptions[project.id]}
                  maxLength={4000}
                  rows={5}
                  placeholder="Décrivez les tâches que vous avez réalisées sur ce projet…"
                  onChange={(event) => setDescriptions((current) => ({ ...current, [project.id]: event.target.value }))}
                />
                <div className={styles.footer}>
                  <span className={styles.count}>{descriptions[project.id].length} / 4 000 caractères</span>
                  <button type="button" onClick={() => void save(project.id)} disabled={!changed || saving}>
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
                <p className={styles.status} role="status" aria-live="polite">{messages[project.id]}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
