import { env } from "cloudflare:workers";
import {
  emptyProjectTaskDescriptions,
  isProjectId,
  type ProjectId,
} from "./project-tasks";

export async function getProjectTaskDescriptions(): Promise<Record<ProjectId, string>> {
  const descriptions = emptyProjectTaskDescriptions();
  const database = env.DB;
  if (!database) return descriptions;

  const rows = await database
    .prepare("SELECT project_id, description FROM project_task_descriptions")
    .all<{ project_id: string; description: string }>();

  for (const row of rows.results ?? []) {
    if (isProjectId(row.project_id)) descriptions[row.project_id] = row.description;
  }
  return descriptions;
}

export async function saveProjectTaskDescription(
  projectId: ProjectId,
  description: string,
): Promise<void> {
  const database = env.DB;
  if (!database) throw new Error("La base du portfolio est indisponible.");

  if (!description.trim()) {
    await database
      .prepare("DELETE FROM project_task_descriptions WHERE project_id = ?")
      .bind(projectId)
      .run();
    return;
  }

  await database
    .prepare(
      `INSERT INTO project_task_descriptions (project_id, description, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(project_id) DO UPDATE SET
         description = excluded.description,
         updated_at = excluded.updated_at`,
    )
    .bind(projectId, description.trim(), new Date().toISOString())
    .run();
}
