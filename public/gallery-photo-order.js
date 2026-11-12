(() => {
  const normalizeSource = (source) => {
    try {
      return decodeURIComponent(new URL(source, window.location.href).pathname).replace(/^\//, "");
    } catch {
      return source;
    }
  };

  async function applySavedOrders() {
    try {
      const response = await fetch("/api/gallery-orders", { cache: "no-store" });
      if (!response.ok) return;
      const { galleries } = await response.json();

      for (const project of galleries) {
        const root = document.getElementById(project.sectionId);
        const gallery = project.id === "bandundu"
          ? document.querySelector("#photos")
          : root?.querySelector(project.lightboxKey === "futureTower" ? ".renovation-gallery" : ".construction-gallery");
        const manifest = portfolioGalleries[project.lightboxKey];
        if (!gallery || !Array.isArray(manifest) || !Array.isArray(project.order)) continue;

        const nodes = new Map(Array.from(gallery.children).map((card) => {
          const image = card.querySelector("img");
          return [image ? normalizeSource(image.getAttribute("src")) : "", card];
        }));
        const manifestBySource = new Map(manifest.map((photo) => [normalizeSource(photo.src), photo]));
        if (nodes.size !== project.order.length || manifestBySource.size !== project.order.length) continue;
        if (!project.order.every((source) => nodes.has(normalizeSource(source)) && manifestBySource.has(normalizeSource(source)))) continue;

        const orderedManifest = [];
        project.order.forEach((source, index) => {
          const normalized = normalizeSource(source);
          const card = nodes.get(normalized);
          const photo = manifestBySource.get(normalized);
          if (!card || !photo) return;

          gallery.appendChild(card);
          orderedManifest.push(photo);
          const openAttribute = Array.from(card.attributes).find((attribute) =>
            attribute.name.startsWith("data-") && attribute.name.endsWith("-open"),
          );
          if (openAttribute) card.setAttribute(openAttribute.name, String(index));
          else if (project.lightboxKey === "bandundu") {
            card.onclick = () => window.openPhoto(index, project.lightboxKey);
          }
        });

        if (orderedManifest.length !== project.order.length) continue;
        portfolioGalleries[project.lightboxKey] = orderedManifest;

        if (root && project.lightboxKey === "futureTower") {
          const newIndexBySource = new Map(project.order.map((source, index) => [normalizeSource(source), index]));
          root.querySelectorAll("[data-project-open]").forEach((button) => {
            if (gallery.contains(button)) return;
            const image = button.querySelector("img");
            const index = image && newIndexBySource.get(normalizeSource(image.getAttribute("src")));
            if (index !== undefined) button.setAttribute("data-project-open", String(index));
          });
        }
      }
      window.portfolioPhotoOrdersLoaded = true;
    } catch (error) {
      console.warn("Impossible de charger l’ordre des galeries.", error);
    }
  }

  applySavedOrders();
})();
