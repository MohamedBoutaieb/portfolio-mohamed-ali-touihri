import galleryPhotoData from "./gallery-photo-data.json";

export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  label?: string;
  group?: string;
};

export type ProjectGallery = {
  id: string;
  title: string;
  sectionId: string;
  lightboxKey: keyof typeof galleryPhotoData;
  photos: readonly GalleryPhoto[];
};

const projectDefinitions: Omit<ProjectGallery, "photos">[] = [
  { id: "bandundu", title: "Voirie et drainage à Bandundu", sectionId: "photos", lightboxKey: "bandundu" },
  { id: "voiries-kinshasa", title: "Voiries et assainissement à Kinshasa", sectionId: "voiries-kinshasa", lightboxKey: "voiriesKinshasa" },
  { id: "construction-projet-01", title: "Bâtiment R+1 à Kinshasa · Projet 01", sectionId: "construction-projet-01", lightboxKey: "construction01" },
  { id: "ecole-cite-du-savoir", title: "École Cité du savoir · Projet 02", sectionId: "ecole-cite-du-savoir", lightboxKey: "ecoleCite" },
  { id: "lycee-libanais", title: "Lycée libanais de Kinshasa · Projet 03", sectionId: "lycee-libanais-kinshasa", lightboxKey: "lyceeLibanais" },
  { id: "projet-pont-ngaby", title: "Boutiques commerciales à Pont Ngaby", sectionId: "projet-pont-ngaby", lightboxKey: "pontNgaby" },
  { id: "projet-mitendi", title: "Bâtiment résidentiel à Mitendi", sectionId: "projet-mitendi", lightboxKey: "mitendi" },
  { id: "projet-elicom", title: "ELICOM · Bâtiment résidentiel", sectionId: "projet-elicom", lightboxKey: "elicom" },
  { id: "future-tower", title: "Future Tower · Rénovation", sectionId: "future-tower", lightboxKey: "futureTower" },
  { id: "hangar-onatra", title: "Hangar métallique ONATRA", sectionId: "hangar-onatra", lightboxKey: "hangarOnatra" },
  { id: "parking-industriel", title: "Parking industriel", sectionId: "parking-industriel", lightboxKey: "parkingIndustriel" },
];

export const PROJECT_GALLERIES: ProjectGallery[] = projectDefinitions.map((definition) => ({
  ...definition,
  photos: (galleryPhotoData[definition.lightboxKey] as { src: string; label: string; group?: string }[]).map((photo) => ({
    id: photo.src,
    src: photo.src,
    alt: photo.label,
    label: photo.label,
    ...(photo.group ? { group: photo.group } : {}),
  })),
}));

export function getProjectGallery(galleryId: string): ProjectGallery | undefined {
  return PROJECT_GALLERIES.find((gallery) => gallery.id === galleryId);
}

export function isProjectPhotoOrder(gallery: ProjectGallery, value: unknown): value is string[] {
  if (!Array.isArray(value) || value.length !== gallery.photos.length) return false;
  const allowed = new Set(gallery.photos.map((photo) => photo.id));
  const seen = new Set<string>();
  for (const id of value) {
    if (typeof id !== "string" || !allowed.has(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}
