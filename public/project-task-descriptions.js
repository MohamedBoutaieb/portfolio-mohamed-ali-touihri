(async function () {
  try {
    const response = await fetch("/api/project-tasks", { cache: "no-store" });
    if (!response.ok) return;
    const result = await response.json();
    const descriptions = result.descriptions;
    if (!descriptions || typeof descriptions !== "object") return;

    const style = document.createElement("style");
    style.textContent = `
      .portfolio-tasks { border-top: 1px solid var(--line); margin-top: 30px; padding-top: 24px; }
      .portfolio-tasks h5 { margin: 0 0 12px; color: var(--blue); font: 25px/1.2 Georgia,serif; }
      .portfolio-tasks p { margin: 0; color: var(--muted); font: 14px/1.7 Arial,sans-serif; white-space: pre-wrap; }
    `;
    document.head.append(style);

    for (const [projectId, description] of Object.entries(descriptions)) {
      if (typeof description !== "string" || !description.trim()) continue;
      const project = document.getElementById(projectId);
      if (!project || project.querySelector(":scope > .portfolio-tasks")) continue;

      const block = document.createElement("section");
      block.className = "portfolio-tasks";
      const heading = document.createElement("h5");
      heading.textContent = "Tâches réalisées";
      const text = document.createElement("p");
      text.textContent = description.trim();
      block.append(heading, text);
      project.append(block);
    }
  } catch (error) {
    console.warn("Impossible de charger les descriptions des tâches.", error);
  }
})();
