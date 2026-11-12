"use client";

import { useState } from "react";
import styles from "./photo-order-editor.module.css";
import type { ProjectGallery } from "@/lib/project-galleries";

type Photo = ProjectGallery["photos"][number];

type PhotoOrderEditorProps = {
  galleries: readonly ProjectGallery[];
  initialOrders: Record<string, string[]>;
  signOutHref: string;
};

export function PhotoOrderEditor({
  galleries,
  initialOrders,
  signOutHref,
}: PhotoOrderEditorProps) {
  const [selectedGalleryId, setSelectedGalleryId] = useState("lycee-libanais");
  const [orders, setOrders] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(Object.entries(initialOrders).map(([id, order]) => [id, [...order]])),
  );
  const [savedOrders, setSavedOrders] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(Object.entries(initialOrders).map(([id, order]) => [id, [...order]])),
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const gallery = galleries.find((item) => item.id === selectedGalleryId) ?? galleries[0];
  const photos = gallery.photos;
  const order = orders[gallery.id] ?? [];
  const savedOrder = savedOrders[gallery.id] ?? [];
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const orderedPhotos = order.map((id) => byId.get(id)).filter((photo): photo is Photo => Boolean(photo));
  const hasChanges = order.some((id, index) => id !== savedOrder[index]);

  function move(id: string, targetIndex: number) {
    setOrders((currentOrders) => {
      const current = currentOrders[gallery.id] ?? [];
      const fromIndex = current.indexOf(id);
      if (fromIndex < 0 || targetIndex < 0 || targetIndex >= current.length) return currentOrders;
      const next = [...current];
      next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, id);
      return { ...currentOrders, [gallery.id]: next };
    });
    setMessage("Ordre modifié. Enregistrez pour mettre à jour la galerie publique.");
  }

  function moveBefore(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const targetIndex = (orders[gallery.id] ?? []).indexOf(targetId);
    if (targetIndex >= 0) move(sourceId, targetIndex);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/gallery-orders", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ galleryId: gallery.id, order }),
      });
      const result = (await response.json()) as { error?: string; order?: string[]; galleryId?: string };
      if (!response.ok || !result.order) {
        throw new Error(result.error || "Impossible d’enregistrer cet ordre.");
      }
      setOrders((current) => ({ ...current, [gallery.id]: result.order! }));
      setSavedOrders((current) => ({ ...current, [gallery.id]: result.order! }));
      setMessage("Ordre enregistré. La galerie publique affichera maintenant cette disposition.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue pendant l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" target="_top">Mohamed Ali Touihri <span>/ Portfolio</span></a>
        <nav className={styles.nav} aria-label="Navigation de l’administration">
          <a href={`/#${gallery.sectionId}`} target="_top">Voir le projet</a>
          <a href="#task-descriptions">Descriptions des tâches</a>
          <a href={signOutHref} target="_top">Se déconnecter</a>
        </nav>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>Espace de gestion · Galeries du portfolio</p>
        <h1>Réorganiser les photos</h1>
        <p className={styles.description}>
          Choisissez un projet, faites glisser ses photos à la place voulue ou utilisez les flèches, puis enregistrez.
          Le nouvel ordre s’appliquera à la galerie et à son affichage agrandi.
        </p>
        <label className={styles.projectPicker}>
          <span>Projet</span>
          <select
            value={gallery.id}
            onChange={(event) => {
              setSelectedGalleryId(event.target.value);
              setDraggedId(null);
              setMessage("");
            }}
          >
            {galleries.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </label>
        <p className={styles.selectedProject}>{gallery.title} · {photos.length} photos</p>
        <div className={styles.actions}>
          <button className={styles.save} type="button" onClick={save} disabled={saving || !hasChanges}>
            {saving ? "Enregistrement…" : "Enregistrer l’ordre"}
          </button>
          <button
            className={styles.reset}
            type="button"
            onClick={() => {
              setOrders((current) => ({ ...current, [gallery.id]: photos.map((photo) => photo.id) }));
              setMessage("Ordre initial restauré dans l’aperçu. Enregistrez pour le publier.");
            }}
            disabled={saving || !hasChanges}
          >
            Restaurer l’ordre initial
          </button>
          <span className={styles.count}>{photos.length} images</span>
        </div>
        <p className={styles.status} role="status" aria-live="polite">{message}</p>
      </section>

      <ol className={styles.grid} aria-label={`Ordre des photos : ${gallery.title}`}>
        {orderedPhotos.length === 0 ? (
          <li className={styles.empty}>Aucune photo n’a encore été ajoutée à ce projet.</li>
        ) : orderedPhotos.map((photo, index) => (
          <li
            className={`${styles.card} ${draggedId === photo.id ? styles.dragging : ""}`}
            key={photo.id}
            draggable
            onDragStart={(event) => {
              setDraggedId(photo.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", photo.id);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const sourceId = event.dataTransfer.getData("text/plain") || draggedId;
              if (sourceId) moveBefore(sourceId, photo.id);
              setDraggedId(null);
            }}
            onDragEnd={() => setDraggedId(null)}
          >
            <div className={styles.imageWrap}>
              <img src={`/${photo.src}`} alt={photo.alt} loading="lazy" />
              <span className={styles.position}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.handle} aria-hidden="true">⠿</span>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.fileName}>{photo.src.split("/").at(-1)}</span>
              <span className={styles.arrows}>
                <button type="button" aria-label={`Déplacer ${photo.alt} vers le haut`} onClick={() => move(photo.id, index - 1)} disabled={index === 0}>↑</button>
                <button type="button" aria-label={`Déplacer ${photo.alt} vers le bas`} onClick={() => move(photo.id, index + 1)} disabled={index === orderedPhotos.length - 1}>↓</button>
              </span>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
