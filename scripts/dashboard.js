/* =========================================================
   Agent Dashboard page logic
   ========================================================= */

(function () {
  function tierBadge(tier) {
    const cls = tier || "bronze";
    const label = cls.charAt(0).toUpperCase() + cls.slice(1);
    return `<span class="tier-badge ${cls}">${label}</span>`;
  }

  function statusBadge(status) {
    const map = {
      "Resolved":   "success",
      "In progress":"info",
      "Open":       "warn",
      "Escalated":  "danger",
      "In review":  "info",
    };
    return `<span class="badge badge--${map[status] || "info"}">${status}</span>`;
  }

  function avatar(name) {
    const initials = name.split(" ").map(s => s[0]).slice(0,2).join("");
    return `<span class="avatar avatar--sm">${initials}</span>`;
  }

  async function renderKpis() {
    const citizens = await window.Services.fetchCitizens();
    const cases = await window.Services.fetchCases();
    document.getElementById("kpiActive").textContent = citizens.length.toLocaleString();
    document.getElementById("kpiHigh").textContent = citizens.filter(c => c.tier === "gold" || c.tier === "platinum").length;
    document.getElementById("kpiOpen").textContent = cases.filter(c => c.status !== "Resolved").length;
    document.getElementById("kpiEsc").textContent = cases.filter(c => c.status === "Escalated").length;
  }

  async function renderLookup(query = "") {
    const list = await window.Services.fetchCitizens(query);
    const tbody = document.getElementById("lookupResults");
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">🔍</div>No matching citizens</div></td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(c => `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            ${avatar(c.name)}
            <div>
              <strong>${c.name}</strong><br/>
              <small class="text-muted">${c.id} · ${c.email}</small>
            </div>
          </div>
        </td>
        <td>${tierBadge(c.tier)}</td>
        <td><strong>${c.points.toLocaleString()}</strong></td>
        <td><small>${c.preferredChannel}</small></td>
        <td>${"★".repeat(Math.round(c.satisfaction))}<small class="text-muted"> ${c.satisfaction}</small></td>
        <td class="row-actions">
          <a class="btn btn--sm btn--ghost" href="citizen-profile.html?id=${c.id}">Open</a>
        </td>
      </tr>
    `).join("");
  }

  async function renderRecent() {
    const items = await window.Services.fetchRecentInteractions();
    const citizens = await window.Services.fetchCitizens();
    const byId = Object.fromEntries(citizens.map(c => [c.id, c]));
    document.getElementById("recentInteractions").innerHTML = items.map(i => {
      const c = byId[i.citizenId];
      return `
        <tr>
          <td><small>${i.date}</small></td>
          <td>
            <div class="flex items-center gap-2">
              ${avatar(c?.name || "?")}
              <a href="citizen-profile.html?id=${i.citizenId}">${c?.name || i.citizenId}</a>
            </div>
          </td>
          <td>${i.channel}</td>
          <td>${i.topic}</td>
          <td>${statusBadge(i.status)}</td>
        </tr>`;
    }).join("");
  }

  async function renderAlerts() {
    const insights = await window.Services.fetchInsights();
    const cases = await window.Services.fetchCases();
    const alerts = [
      ...insights.lowSatisfactionAlerts.map(a => ({
        type: "warn", icon: "⚠️",
        text: `Low satisfaction (${a.lastScore}★) from <strong>${a.citizenId}</strong> via ${a.channel}`,
      })),
      ...cases.filter(c => c.status === "Escalated").map(c => ({
        type: "danger", icon: "🚨",
        text: `Escalated case <strong>${c.id}</strong>: ${c.title}`,
      })),
    ];
    document.getElementById("alertsCount").textContent = alerts.length;
    const panel = document.getElementById("alertsPanel");
    panel.innerHTML = alerts.length
      ? alerts.map(a => `<div class="alert alert--${a.type}"><span class="alert__icon">${a.icon}</span><div>${a.text}</div></div>`).join("")
      : `<div class="empty-state"><div class="empty-state__icon">✅</div>All clear</div>`;
  }

  async function renderRecommendations() {
    const recs = await window.Services.fetchRecommendations();
    const citizens = await window.Services.fetchCitizens();
    const byId = Object.fromEntries(citizens.map(c => [c.id, c]));
    document.getElementById("recommendationsPanel").innerHTML = recs.length ? recs.map(r => `
      <div class="reco-card" data-rec-id="${r.id}" data-citizen="${r.citizenId}">
        <div class="reco-card__icon">✨</div>
        <div style="flex:1;">
          <div class="reco-card__title">${r.title}</div>
          <div class="reco-card__why">For ${byId[r.citizenId]?.name || r.citizenId} — ${r.why}</div>
          <div class="reco-card__actions">
            <button class="btn btn--sm btn--primary" data-rec-action="${r.action}">${r.action}</button>
            <a class="btn btn--sm btn--ghost" href="citizen-profile.html?id=${r.citizenId}">Open profile</a>
            <button class="btn btn--sm btn--ghost" data-rec-dismiss="1">Dismiss</button>
          </div>
        </div>
      </div>
    `).join("") : `<div class="empty-state">No active recommendations</div>`;
  }

  async function populateProgramsSelect() {
    const sel = document.getElementById("enrollProgram");
    if (!sel) return;
    const programs = await window.Services.fetchPrograms();
    sel.innerHTML = programs.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderKpis();
    renderLookup("");
    renderRecent();
    renderAlerts();
    renderRecommendations();
    populateProgramsSelect();

    document.getElementById("lookupBtn").addEventListener("click", () => {
      renderLookup(document.getElementById("lookupQuery").value);
    });
    document.getElementById("lookupQuery").addEventListener("keydown", (e) => {
      if (e.key === "Enter") renderLookup(e.target.value);
    });

    // Enrollment submission — TODO: wire to real service
    const submit = document.getElementById("enrollSubmit");
    if (submit) {
      submit.addEventListener("click", async () => {
        const payload = {
          citizen: document.getElementById("enrollCitizen").value,
          programId: document.getElementById("enrollProgram").value,
          channel: document.getElementById("enrollChannel").value,
          date: document.getElementById("enrollDate").value,
          notes: document.getElementById("enrollNotes").value,
        };
        const res = await window.Services.submitEnrollment(payload);
        window.Modals.close("enrollModal");
        (window.Toast?.show || alert)(`Enrollment confirmed (${res.confirmationId}).`);
      });
    }

    // Thank / recognition modal send
    const thankSend = document.getElementById("thankModalSend");
    if (thankSend) {
      thankSend.addEventListener("click", async () => {
        const channel = document.getElementById("thankModalChannel").value;
        const message = document.getElementById("thankModalMsg").value;
        await window.Services.sendRecognition({ citizenId: "C-10293", channel, message });
        window.Modals.close("thankModal");
        window.Toast?.show(`Recognition sent via ${channel}.`);
      });
    }

    // AI recommendation actions on dashboard
    document.addEventListener("click", (e) => {
      const actBtn = e.target.closest("[data-rec-action]");
      if (actBtn) {
        const action = actBtn.getAttribute("data-rec-action");
        const card = actBtn.closest(".reco-card");
        const cid  = card?.getAttribute("data-citizen");
        if (/Enroll/i.test(action)) {
          if (cid) document.getElementById("enrollCitizen").value = cid;
          window.Modals.open("enrollModal");
        } else if (/Recognition|Thank/i.test(action)) {
          window.Modals.open("thankModal");
        } else if (/Credit/i.test(action)) {
          window.Toast?.show("Service credit applied to citizen account.");
          card?.classList.add("is-applied");
        } else {
          window.Toast?.show(`Action "${action}" recorded.`);
          card?.classList.add("is-applied");
        }
        return;
      }
      const dis = e.target.closest("[data-rec-dismiss]");
      if (dis) {
        dis.closest(".reco-card")?.remove();
        window.Toast?.show("Recommendation dismissed.", "info");
      }
    });
  });
})();
