/* =========================================================
   Programs / Recommendations page logic
   ========================================================= */

(function () {
  let programs = [];

  function programCard(p, opts = {}) {
    return `
      <div class="card">
        <div class="card__body">
          <div class="flex justify-between items-center mb-2">
            <strong>${p.name}</strong>
            <span class="badge badge--info">${p.category}</span>
          </div>
          <p class="text-muted">${p.description}</p>
          <div class="mb-2"><small class="text-muted">Eligibility:</small> ${p.eligibility}</div>
          <div class="flex justify-between items-center mt-3">
            <span class="badge badge--success">+${p.points} pts</span>
            <button class="btn btn--sm btn--success" data-modal-open="enrollModal">${opts.cta || "Enroll"}</button>
          </div>
          ${opts.why ? `<div class="alert alert--info mt-3"><span class="alert__icon">✨</span><div>${opts.why}</div></div>` : ""}
        </div>
      </div>`;
  }

  function renderAll(filter = "") {
    const list = filter ? programs.filter(p => p.category === filter) : programs;
    document.getElementById("programGrid").innerHTML = list.map(p => programCard(p)).join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    programs = await window.Services.fetchPrograms();

    // Recommended grid (top 3 — in real app, request /citizens/{id}/recommendations)
    const recos = await window.Services.fetchRecommendations("C-10293");
    const recoIds = new Set(recos.map((_, i) => programs[i]?.id));
    const recoCards = programs.slice(0, 3).map((p, i) =>
      programCard(p, { cta: "Enroll", why: recos[i]?.why || "Matches engagement profile" })
    ).join("");
    document.getElementById("recoGrid").innerHTML = recoCards;

    renderAll();

    document.getElementById("catFilter").addEventListener("change", (e) => renderAll(e.target.value));

    // Populate enroll select
    document.getElementById("enrollProgram").innerHTML =
      programs.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

    // For citizens, prefill + lock the citizen field on the enroll modal
    const me = window.Services?.getCurrentUser?.();
    if (me && me.roleKey === "citizen") {
      const f = document.getElementById("enrollCitizen");
      if (f) {
        f.value = `${me.name} (${me.citizenId})`;
        f.readOnly = true;
      }
    }

    // Enroll submit
    document.getElementById("enrollSubmit").addEventListener("click", async () => {
      const payload = {
        citizen: document.getElementById("enrollCitizen").value,
        programId: document.getElementById("enrollProgram").value,
        date: document.getElementById("enrollDate").value,
      };
      await window.Services.submitEnrollment(payload);
      window.Modals.close("enrollModal");
      const banner = document.getElementById("confirmBanner");
      banner.classList.remove("hidden");
      setTimeout(() => banner.classList.add("hidden"), 4000);
    });
  });
})();
