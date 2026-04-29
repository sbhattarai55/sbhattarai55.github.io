/* =========================================================
   Citizen self-service dashboard logic
   ========================================================= */

(function () {
  const CITIZEN_ID = "C-10293"; // demo citizen
  const toast = (m, t = "success") => window.Toast && window.Toast.show(m, t);

  function tierBadge(t) {
    return `<span class="tier-badge ${t}">${t.charAt(0).toUpperCase() + t.slice(1)} Citizen</span>`;
  }

  function tierProgressHtml(c) {
    const p = window.Services.tierProgress(c.points);
    return `
      <div class="tier-progress">
        <div class="tier-progress__bar"><div class="tier-progress__fill" style="width:${p.percent}%"></div></div>
        <div class="tier-progress__meta">
          <span>${p.current.label}</span>
          <span>${p.next ? `${p.pointsToNext.toLocaleString()} pts to ${p.next.label}` : "Top tier reached"}</span>
        </div>
      </div>`;
  }

  function setupRatingInput(container) {
    const buttons = container.querySelectorAll("button");
    const setVisual = (n, hover = false) => {
      buttons.forEach((b, i) => {
        b.classList.toggle(hover ? "is-hover" : "is-on", i < n);
        if (!hover) b.classList.remove("is-hover");
      });
    };
    const initial = parseInt(container.getAttribute("data-value"), 10) || 0;
    setVisual(initial);
    buttons.forEach((b) => {
      b.addEventListener("mouseenter", () => setVisual(parseInt(b.getAttribute("data-score"), 10), true));
      b.addEventListener("mouseleave", () => {
        buttons.forEach(x => x.classList.remove("is-hover"));
        setVisual(parseInt(container.getAttribute("data-value"), 10) || 0);
      });
      b.addEventListener("click", () => {
        const v = parseInt(b.getAttribute("data-score"), 10);
        container.setAttribute("data-value", String(v));
        setVisual(v);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const c = await window.Services.fetchCitizenProfile(CITIZEN_ID);
    if (!c) return;

    document.getElementById("welcomeName").textContent = c.name.split(" ")[0];
    document.getElementById("myPoints").textContent = c.points.toLocaleString();
    document.getElementById("myTier").innerHTML = tierBadge(c.tier);
    document.getElementById("myTierProgress").innerHTML = tierProgressHtml(c);

    // Badges
    document.getElementById("myBadges").innerHTML =
      (c.badges && c.badges.length)
        ? c.badges.map(b => `<span class="badge badge--success">🏅 ${b}</span>`).join("")
        : `<span class="text-muted">No badges yet — engage to earn your first!</span>`;

    // Open requests
    const cases = (await window.Services.fetchCases()).filter(k => k.citizenId === c.id && k.status !== "Resolved");
    document.getElementById("myOpen").textContent = cases.length;

    // Activity timeline
    const events = await window.Services.fetchEngagementHistory(c.id);
    document.getElementById("myTimeline").innerHTML = events.length ? events.map(e => `
      <div class="timeline__item">
        <div class="timeline__time">${e.date}</div>
        <div class="timeline__title">${e.description}</div>
        <div class="timeline__desc">+${e.points} points · ${e.channel}</div>
      </div>`).join("") : `<div class="empty-state">No activity yet</div>`;

    // Recommendations + extra programs
    const recs = await window.Services.fetchRecommendations(c.id);
    const programs = await window.Services.fetchPrograms();
    const recoCards = (recs.length ? recs.slice(0, 2) : []).map(r => `
      <div class="card">
        <div class="card__body">
          <strong>${r.title}</strong>
          <p class="text-muted mt-2">${r.why}</p>
          <button class="btn btn--primary btn--sm" data-modal-open="joinProgramModal">${r.action}</button>
        </div>
      </div>`).join("");
    const extra = programs.slice(0, 2).map(p => `
      <div class="card">
        <div class="card__body">
          <strong>${p.name}</strong>
          <p class="text-muted mt-2">${p.description}</p>
          <small class="text-muted">+${p.points} pts</small>
          <div class="mt-3"><button class="btn btn--ghost btn--sm" data-modal-open="joinProgramModal" data-prefill="${p.id}">Learn more</button></div>
        </div>
      </div>`).join("");
    document.getElementById("myRecs").innerHTML = recoCards + extra;

    // Recognition received
    const recognitions = await window.Services.fetchRecognitions(c.id);
    document.getElementById("myRecognitions").innerHTML = recognitions.length
      ? recognitions.map(r => `<div class="mb-3">
          <strong>🎉 ${r.from}</strong> <small class="text-muted">${r.date} · ${r.channel}</small>
          <div>${r.message}</div>
        </div>`).join("")
      : `<div class="empty-state">No recognitions yet</div>`;

    // My past feedback
    const ratings = (await window.Services.fetchRatingsSummary()).filter(r => r.citizenId === c.id);
    document.getElementById("myFeedback").innerHTML = ratings.length
      ? ratings.map(r => `<div class="mb-2">
          <strong>${"★".repeat(r.score)}</strong> <small class="text-muted">${r.date} · Agent ${r.agent || "—"}</small>
          <div>${r.comment}</div></div>`).join("")
      : `<div class="empty-state">No feedback yet</div>`;

    // ---- Rate your recent agent interaction (unrated only) ----
    const recentInteractions = (await window.Services.fetchRecentInteractions())
      .filter(i => i.citizenId === c.id && !i.rated && i.status === "Resolved");
    const rateCard = document.getElementById("rateAgentCard");
    if (recentInteractions.length) {
      const i = recentInteractions[0];
      rateCard.hidden = false;
      document.getElementById("rateAgentBody").innerHTML = `
        <p class="mb-3">Your recent <strong>${i.topic}</strong> interaction with <strong>Agent ${i.agent}</strong>
        on ${i.date} via ${i.channel}.</p>
        <div class="form-field"><label>Your rating</label>
          <div class="rating-input" id="rateInput" data-value="5">
            <button type="button" data-score="1">★</button>
            <button type="button" data-score="2">★</button>
            <button type="button" data-score="3">★</button>
            <button type="button" data-score="4">★</button>
            <button type="button" data-score="5">★</button>
          </div>
        </div>
        <div class="form-field mt-3"><label>Comment (optional)</label>
          <textarea id="rateComment" placeholder="Share what worked well or how we can improve…"></textarea>
        </div>
        <div class="btn-group mt-3">
          <button class="btn btn--primary" id="rateSubmit">Submit rating</button>
          <button class="btn btn--ghost" id="rateSkip">Not now</button>
        </div>
      `;
      setupRatingInput(document.getElementById("rateInput"));
      document.getElementById("rateSubmit").addEventListener("click", async () => {
        const score = parseInt(document.getElementById("rateInput").getAttribute("data-value"), 10) || 5;
        const comment = document.getElementById("rateComment").value;
        await window.Services.rateInteraction({ interactionId: i.id, score, comment });
        rateCard.hidden = true;
        toast(`Thanks! Your ${score}★ rating has been shared with the team.`);
      });
      document.getElementById("rateSkip").addEventListener("click", () => {
        rateCard.hidden = true;
      });
    }

    // ---- Join program modal ----
    const sel = document.getElementById("joinProgramSelect");
    const desc = document.getElementById("joinProgramDesc");
    const updateDesc = () => {
      const p = programs.find(x => x.id === sel.value);
      desc.textContent = p ? `${p.description} (+${p.points} pts)` : "";
    };
    if (sel) {
      sel.innerHTML = programs.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
      sel.addEventListener("change", updateDesc);
      updateDesc();
    }
    document.addEventListener("click", (e) => {
      const pre = e.target.closest("[data-prefill]");
      if (pre && sel) { sel.value = pre.getAttribute("data-prefill"); updateDesc(); }
    });
    document.getElementById("joinProgramSubmit").addEventListener("click", async () => {
      const programId = sel.value;
      const res = await window.Services.submitEnrollment({ citizenId: c.id, programId });
      window.Modals.close("joinProgramModal");
      toast(`You're in! Confirmation ${res.confirmationId}.`);
    });

    // ---- Submit-feedback modal ----
    setupRatingInput(document.getElementById("feedbackRating"));
    document.getElementById("feedbackSubmit").addEventListener("click", async () => {
      const score = parseInt(document.getElementById("feedbackRating").getAttribute("data-value"), 10) || 5;
      const comment = document.getElementById("feedbackComment").value;
      await window.Services.submitFeedback({ citizenId: c.id, score, comment });
      window.Modals.close("feedbackModal");
      toast("Thank you for your feedback!");
    });

    // ---- Milestone celebration: show once per session if Gold+ ----
    if (!sessionStorage.getItem("scd_milestone_shown") && (c.tier === "gold" || c.tier === "platinum")) {
      sessionStorage.setItem("scd_milestone_shown", "1");
      setTimeout(() => window.Modals.open("milestoneModal"), 600);
    }
  });
})();
