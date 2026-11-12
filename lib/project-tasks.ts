export const PROJECTS = [
  { id: "bandundu", title: "Travaux publics à Bandundu" },
  { id: "voiries-kinshasa", title: "Voiries et assainissement à Kinshasa" },
  { id: "future-tower", title: "Rénovation — Future Tower" },
  { id: "construction-projet-01", title: "Bâtiment R+1 à Kinshasa" },
  { id: "ecole-cite-du-savoir", title: "École Cité du savoir" },
  { id: "lycee-libanais-kinshasa", title: "Lycée libanais de Kinshasa" },
  { id: "projet-pont-ngaby", title: "Aménagement de boutiques à Pont Ngaby" },
  { id: "projet-mitendi", title: "Bâtiment résidentiel à Mitendi" },
  { id: "projet-elicom", title: "ELICOM · Bâtiment résidentiel" },
  { id: "hangar-onatra", title: "Hangar métallique ONATRA" },
  { id: "parking-industriel", title: "Parking industriel à Kinshasa" },
] as const;

export type ProjectId = (typeof PROJECTS)[number]["id"];

export function isProjectId(value: unknown): value is ProjectId {
  return typeof value === "string" && PROJECTS.some((project) => project.id === value);
}

export function emptyProjectTaskDescriptions(): Record<ProjectId, string> {
  return Object.fromEntries(PROJECTS.map((project) => [project.id, ""])) as Record<ProjectId, string>;
}

export function isProjectTaskDescription(value: unknown): value is string {
  return typeof value === "string" && value.length <= 4000;
}
