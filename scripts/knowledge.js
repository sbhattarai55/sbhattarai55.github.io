/* =========================================================
   Knowledge base page logic
   ========================================================= */

(function () {
  let allArticles = [];

  function applyFilters() {
    const q = document.getElementById("kbSearch").value.toLowerCase();
    const cat = document.getElementById("kbCategory").value;
    return allArticles.filter(a =>
      (!q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)) &&
      (!cat || a.category === cat)
    );
  }

  function render() {
    const list = applyFilters();
    document.getElementById("kbCount").textContent = `${list.length} article${list.length === 1 ? "" : "s"}`;
    document.getElementById("kbList").innerHTML = list.length ? `
      <table class="data-table">
        <thead><tr><th>Title</th><th>Category</th><th>Updated</th><th></th></tr></thead>
        <tbody>${list.map(a => `
          <tr>
            <td><strong>${a.title}</strong><br/><small class="text-muted">${a.excerpt}</small></td>
            <td><span class="badge">${a.category}</span></td>
            <td><small>${a.updated}</small></td>
            <td class="row-actions"><button class="btn btn--sm btn--ghost" data-preview="${a.id}">Preview</button></td>
          </tr>`).join("")}
        </tbody>
      </table>
    ` : `<div class="empty-state">No articles found</div>`;
  }

  function preview(id) {
    const a = allArticles.find(x => x.id === id);
    if (!a) return;
    document.getElementById("kbPreview").innerHTML = `
      <h3>${a.title}</h3>
      <small class="text-muted">${a.category} · Updated ${a.updated}</small>
      <p class="mt-3">${a.excerpt}</p>
      <p class="text-muted">[Full article body would render here. TODO: load from CMS or markdown file.]</p>
      <div class="btn-group mt-3">
        <button class="btn btn--ghost-info btn--sm" data-kb-send="${a.id}">Send to citizen</button>
        <button class="btn btn--ghost btn--sm" data-kb-copy="${a.id}">Copy link</button>
      </div>`;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    allArticles = await window.Services.fetchKnowledgeArticles();
    render();

    document.getElementById("kbSuggested").innerHTML = allArticles.slice(0, 3).map(a => `
      <div class="mb-2"><strong>${a.title}</strong><br/><small class="text-muted">${a.category}</small></div>
    `).join("");

    document.getElementById("kbSearch").addEventListener("input", render);
    document.getElementById("kbCategory").addEventListener("change", render);

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-preview]");
      if (btn) preview(btn.getAttribute("data-preview"));
      const send = e.target.closest("[data-kb-send]");
      if (send) window.Toast?.show("Article shared with citizen via their preferred channel.");
      const cp = e.target.closest("[data-kb-copy]");
      if (cp) window.Toast?.show("Article link copied to clipboard.", "info");
    });
  });
})();
