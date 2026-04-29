/* =========================================================
   Citizen Profile page logic — agent workspace
   ========================================================= */

(function () {
  const params = new URLSearchParams(window.location.search);
  const citizenId = params.get("id") || "C-10293";

  const toast = (m, t = "success") => window.Toast && window.Toast.show(m, t);

  function avatar(name, size = "lg") {
    const initials = (name || "?").split(" ").map(s => s[0]).slice(0, 2).join("");
    return `<span class="avatar avatar--${size}">${initials}</span>`;
  }
  function tierBadge(tier) {
    const t = tier || "bronze";
    return `<span class="tier-badge ${t}">${t.charAt(0).toUpperCase() + t.slice(1)} Citizen</span>`;
  }
  function stars(score) {
    const n = Math.round(score || 0);
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".tab-panel");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        const target = tab.getAttribute("data-tab");
        panels.forEach(p => p.classList.toggle("hidden", p.getAttribute("data-panel") !== target));
      });
    });
  }

  function tierProgressHtml(c) {
    const p = window.Services.tierProgress(c.points);
    return `
      <div class="tier-progress mt-3" style="max-width:380px;">
        <div class="tier-progress__bar"><div class="tier-progress__fill" style="width:${p.percent}%"></div></div>
        <div class="tier-progress__meta">
          <span>${p.current.label}</span>
          <span>${p.next ? `${p.pointsToNext.toLocaleString()} pts to ${p.next.label}` : "Top tier reached"}</span>
        </div>
      </div>`;
  }

  async function render() {
    const c = await window.Services.fetchCitizenProfile(citizenId);
    if (!c) {
      document.getElementById("profileName").textContent = "Citizen not found";
      return;
    }
    document.getElementById("profileName").textContent = c.name;
    document.getElementById("crumbName").textContent = c.name;

    // ---- Summary ----
    document.getElementById("profileSummary").innerHTML = `
      ${avatar(c.name)}
      <div class="profile-summary__meta" style="flex:1; min-width:240px;">
        <h2 class="profile-summary__name">${c.name}</h2>
        <div class="profile-summary__sub">${c.id} · ${c.address}</div>
        <div class="mt-2 flex gap-2 items-center" style="flex-wrap:wrap;">
          ${tierBadge(c.tier)}
          ${(c.badges || []).map(b => `<span class="badge badge--success">🏅 ${b}</span>`).join("")}
          ${(c.tags || []).map(t => `<span class="badge">${t}</span>`).join("")}
        </div>
        ${tierProgressHtml(c)}
      </div>
      <div class="profile-summary__stats">
        <div><div class="profile-stat__label">Points</div><div class="profile-stat__value">${c.points.toLocaleString()}</div></div>
        <div><div class="profile-stat__label">Satisfaction</div><div class="profile-stat__value">${c.satisfaction} ★</div></div>
        <div><div class="profile-stat__label">Member since</div><div class="profile-stat__value">${c.since}</div></div>
      </div>
    `;

    // ---- Contact / preferences ----
    document.getElementById("contactDetails").innerHTML = `
      <div><strong>Email:</strong> ${c.email}</div>
      <div class="mt-2"><strong>Phone:</strong> ${c.phone}</div>
      <div class="mt-2"><strong>Address:</strong> ${c.address}</div>
    `;
    document.getElementById("prefDetails").innerHTML = `
      <div><strong>Preferred channel:</strong> ${c.preferredChannel}</div>
      <div class="mt-2"><strong>Languages:</strong> ${c.languages.join(", ")}</div>
      <div class="mt-2"><strong>Marketing opt-in:</strong> Yes</div>
    `;

    // ---- Timeline ----
    const events = await window.Services.fetchEngagementHistory(c.id);
    document.getElementById("timeline").innerHTML = events.length ? events.map(e => `
      <div class="timeline__item">
        <div class="timeline__time">${e.date} · ${e.channel}</div>
        <div class="timeline__title">${e.type}: ${e.description}</div>
        <div class="timeline__desc">+${e.points} points</div>
      </div>`).join("") : `<div class="empty-state">No engagement yet</div>`;

    // ---- Recent programs ----
    const progEvents = events.filter(e => e.type === "Program");
    document.getElementById("recentPrograms").innerHTML = progEvents.length
      ? progEvents.map(p => `<div class="mb-2"><strong>${p.description}</strong><br/><small class="text-muted">${p.date} · +${p.points} pts</small></div>`).join("")
      : `<div class="empty-state">No programs yet</div>`;

    // ---- Service interactions (with agent attribution) ----
    const interactions = (await window.Services.fetchRecentInteractions()).filter(i => i.citizenId === c.id);
    document.getElementById("serviceInteractions").innerHTML = interactions.length
      ? interactions.map(i => `<div class="mb-2"><strong>${i.topic}</strong><br/><small class="text-muted">${i.date} · ${i.channel} · Agent ${i.agent} · ${i.status}</small></div>`).join("")
      : `<div class="empty-state">No recent interactions</div>`;

    // ---- History table ----
    document.getElementById("historyTable").innerHTML = `
      <table class="data-table">
        <thead><tr><th>Date</th><th>Type</th><th>Channel</th><th>Description</th><th>Points</th></tr></thead>
        <tbody>${events.map(e => `<tr>
          <td>${e.date}</td><td>${e.type}</td><td>${e.channel}</td><td>${e.description}</td><td>+${e.points}</td>
        </tr>`).join("")}</tbody>
      </table>`;

    // ---- Rewards ----
    document.getElementById("rewPoints").textContent = c.points.toLocaleString();
    document.getElementById("rewTier").textContent = c.tier.charAt(0).toUpperCase() + c.tier.slice(1);
    document.getElementById("rewSince").textContent = c.since;

    // ---- Recommendations ----
    const recs = await window.Services.fetchRecommendations(c.id);
    const recsHtml = recs.length ? recs.map((r) => `
      <div class="reco-card" data-rec-id="${r.id}">
        <div class="reco-card__icon">✨</div>
        <div style="flex:1;">
          <div class="reco-card__title">${r.title}</div>
          <div class="reco-card__why">${r.why}</div>
          <div class="reco-card__actions">
            <button class="btn btn--sm btn--primary" data-rec-action="${r.action}">${r.action}</button>
            <button class="btn btn--sm btn--ghost" data-rec-dismiss="1">Dismiss</button>
          </div>
        </div>
      </div>`).join("") : `<div class="empty-state">No recommendations</div>`;
    document.getElementById("recsPanel").innerHTML = recsHtml;
    document.getElementById("asideRecs").innerHTML = recsHtml;

    // ---- Cases ----
    const cases = (await window.Services.fetchCases()).filter(k => k.citizenId === c.id);
    document.getElementById("casesTable").innerHTML = cases.length ? `
      <table class="data-table"><thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Status</th><th>Opened</th></tr></thead>
      <tbody>${cases.map(k => `<tr><td>${k.id}</td><td>${k.title}</td><td>${k.priority}</td><td>${k.status}</td><td>${k.opened}</td></tr>`).join("")}</tbody></table>
    ` : `<div class="empty-state">No cases</div>`;

    // ---- Feedback (citizen ratings of agents) ----
    const ratings = (await window.Services.fetchRatingsSummary()).filter(r => r.citizenId === c.id);
    document.getElementById("feedbackList").innerHTML = ratings.length
      ? ratings.map(r => `<div class="mb-3"><div>${stars(r.score)} <small class="text-muted">${r.date} · ${r.channel} · Agent ${r.agent || "—"}</small></div><div>${r.comment}</div></div>`).join("")
      : `<div class="empty-state">No feedback yet</div>`;

    // ---- Sat panel ----
    document.getElementById("satPanel").innerHTML = `
      <div style="font-size:24px;font-weight:700;">${c.satisfaction} ★</div>
      <small class="text-muted">Avg across last ${ratings.length || 6} interactions</small>
    `;

    // ---- KB prompts (filter by citizen tags when possible) ----
    const allKb = await window.Services.fetchKnowledgeArticles("");
    const tagWords = (c.tags || []).join(" ").toLowerCase();
    const relevant = allKb.filter(a =>
      tagWords && (a.title.toLowerCase().split(/\W+/).some(w => w && tagWords.includes(w)) ||
                   a.excerpt.toLowerCase().split(/\W+/).some(w => w && tagWords.includes(w)))
    );
    const kb = (relevant.length ? relevant : allKb).slice(0, 3);
    document.getElementById("kbPrompts").innerHTML = kb.map(a => `
      <a href="knowledge-base.html#${a.id}">📄 ${a.title}</a>
    `).join("");

    // ---- Populate enroll modal program list ----
    const sel = document.getElementById("enrollAction_program");
    if (sel) {
      const programs = await window.Services.fetchPrograms();
      sel.innerHTML = programs.map(p => `<option value="${p.id}">${p.name} (+${p.points} pts)</option>`).join("");
    }
  }

  /* ---------- Action wiring ---------- */
  function wireActions() {
    // Send thank-you
    document.getElementById("thankSubmit").addEventListener("click", async () => {
      const channel = document.getElementById("thankChannel").value;
      const message = document.getElementById("thankMessage").value;
      await window.Services.sendRecognition({ citizenId, channel, message });
      window.Modals.close("thankAction");
      toast(`Thank-you sent via ${channel}.`);
      render();
    });

    // Enroll
    document.getElementById("enrollActionSubmit").addEventListener("click", async () => {
      const programId = document.getElementById("enrollAction_program").value;
      const notes     = document.getElementById("enrollAction_notes").value;
      const res = await window.Services.submitEnrollment({ citizenId, programId, notes });
      window.Modals.close("enrollAction");
      toast(`Enrolled (confirmation ${res.confirmationId}).`);
    });

    // Escalate
    document.getElementById("escalateSubmit").addEventListener("click", async () => {
      const reason = document.getElementById("escalateReason").value;
      const notes  = document.getElementById("escalateNotes").value;
      const res = await window.Services.escalate({ citizenId, reason, notes });
      window.Modals.close("escalateAction");
      toast(`Escalated → case ${res.caseId} created.`, "warn");
      render();
    });

    // Resolve
    document.getElementById("resolveSubmit").addEventListener("click", async () => {
      const notes = document.getElementById("resolveNotes").value;
      await window.Services.logResolution({ citizenId, notes });
      window.Modals.close("resolveAction");
      toast("Issue resolved and logged on engagement timeline.");
      render();
    });

    // AI recommendation actions
    document.addEventListener("click", (e) => {
      const actBtn = e.target.closest("[data-rec-action]");
      if (actBtn) {
        const action = actBtn.getAttribute("data-rec-action");
        if (/Enroll/i.test(action))                 window.Modals.open("enrollAction");
        else if (/Recognition|Thank/i.test(action)) window.Modals.open("thankAction");
        else if (/Credit/i.test(action))            toast("Service credit applied to citizen account.");
        else                                        toast(`Action "${action}" recorded.`);
        actBtn.closest(".reco-card")?.classList.add("is-applied");
        return;
      }
      const dis = e.target.closest("[data-rec-dismiss]");
      if (dis) {
        dis.closest(".reco-card")?.remove();
        toast("Recommendation dismissed.", "info");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    setupTabs();
    await render();
    wireActions();
  });
})();
