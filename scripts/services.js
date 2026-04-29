/* =========================================================
   Service layer — async mock APIs.
   Each function simulates a network call and returns a Promise.
   TODO: Replace each implementation with real REST/GraphQL calls.
   ========================================================= */

(function () {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  async function call(data, ms = 200) {
    await delay(ms);
    return JSON.parse(JSON.stringify(data));
  }

  const Services = {
    // ---- Auth ----
    // TODO: POST /api/auth/login
    async login(role) {
      await delay(150);
      const user = {
        agent:      { name: "Sam Park",      role: "Service Agent", initials: "SP", roleKey: "agent" },
        citizen:    { name: "Maria Alvarez", role: "Citizen",       initials: "MA", roleKey: "citizen", citizenId: "C-10293" },
        supervisor: { name: "Lena Brooks",   role: "Supervisor",    initials: "LB", roleKey: "supervisor" },
      }[role] || { name: "Guest", role: "Visitor", initials: "G", roleKey: "guest" };
      sessionStorage.setItem("scd_user", JSON.stringify(user));
      return user;
    },
    getCurrentUser() {
      try { return JSON.parse(sessionStorage.getItem("scd_user")) || null; }
      catch { return null; }
    },
    getCurrentRole() {
      const u = this.getCurrentUser();
      return (u && u.roleKey) || "guest";
    },
    getCurrentCitizenId() {
      const u = this.getCurrentUser();
      return (u && u.roleKey === "citizen") ? (u.citizenId || null) : null;
    },
    isCitizen() { return this.getCurrentRole() === "citizen"; },
    logout() { sessionStorage.removeItem("scd_user"); },

    // ---- Registration ----
    // TODO: POST /api/auth/register
    async register(payload) {
      console.info("[mock] register", payload);
      // Simulate validation latency + persist a pending record so the prototype
      // can echo it back later if desired.
      await delay(400);
      const records = JSON.parse(sessionStorage.getItem("scd_registrations") || "[]");
      records.push({
        id: "REG-" + Date.now(),
        submittedAt: new Date().toISOString(),
        status: payload.role === "supervisor" ? "Pending approval" : "Active",
        ...payload,
      });
      sessionStorage.setItem("scd_registrations", JSON.stringify(records));
      return { ok: true, accountId: "ACCT-" + Date.now() };
    },

    // ---- Citizens ----
    // TODO: GET /api/citizens?query=...&page=
    async fetchCitizens(query = "") {
      // Citizens can only see themselves — enforce on the service boundary.
      const ownId = this.getCurrentCitizenId();
      const list = window.MOCK.citizens.filter((c) => {
        if (ownId && c.id !== ownId) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return [c.name, c.id, c.email, c.phone].some((v) =>
          (v || "").toLowerCase().includes(q)
        );
      });
      return call(list);
    },
    // TODO: GET /api/citizens/{id}
    async fetchCitizenProfile(id) {
      const ownId = this.getCurrentCitizenId();
      if (ownId && id !== ownId) return call(null);
      return call(window.MOCK.citizens.find((c) => c.id === id) || null);
    },

    // ---- Engagement ----
    // TODO: GET /api/citizens/{id}/engagement?from=&to=
    async fetchEngagementHistory(citizenId) {
      const ownId = this.getCurrentCitizenId();
      const scopeId = ownId || citizenId;
      const list = scopeId
        ? window.MOCK.engagementEvents.filter((e) => e.citizenId === scopeId)
        : window.MOCK.engagementEvents;
      return call(list);
    },

    // ---- Interactions ----
    // TODO: GET /api/interactions/recent
    async fetchRecentInteractions() {
      const ownId = this.getCurrentCitizenId();
      const list = ownId
        ? window.MOCK.interactions.filter((i) => i.citizenId === ownId)
        : window.MOCK.interactions;
      return call(list);
    },

    // ---- Loyalty / rewards ----
    // TODO: GET /api/citizens/{id}/loyalty
    async fetchLoyalty(citizenId) {
      const c = window.MOCK.citizens.find((x) => x.id === citizenId);
      return call(c ? { tier: c.tier, points: c.points, since: c.since } : null);
    },

    // ---- Programs / Recommendations ----
    // TODO: GET /api/programs
    async fetchPrograms() { return call(window.MOCK.programs); },

    // TODO: GET /api/citizens/{id}/recommendations
    async fetchRecommendations(citizenId) {
      const ownId = this.getCurrentCitizenId();
      const scopeId = ownId || citizenId;
      const list = scopeId
        ? window.MOCK.recommendations.filter((r) => r.citizenId === scopeId)
        : window.MOCK.recommendations;
      return call(list);
    },

    // TODO: POST /api/programs/{id}/enroll
    async submitEnrollment(payload) {
      console.info("[mock] submitEnrollment", payload);
      return call({ ok: true, confirmationId: "ENR-" + Date.now() }, 350);
    },

    // ---- Cases ----
    // TODO: GET /api/cases
    async fetchCases() {
      const ownId = this.getCurrentCitizenId();
      const list = ownId
        ? window.MOCK.cases.filter((c) => c.citizenId === ownId)
        : window.MOCK.cases;
      return call(list);
    },
    // TODO: POST /api/cases
    async createCase(payload) {
      console.info("[mock] createCase", payload);
      return call({ ok: true, id: "CASE-" + Date.now() }, 300);
    },
    // TODO: PATCH /api/cases/{id}
    async updateCase(id, patch) {
      console.info("[mock] updateCase", id, patch);
      return call({ ok: true });
    },

    // ---- Feedback / Ratings ----
    // TODO: GET /api/ratings/summary
    async fetchRatingsSummary() {
      const ownId = this.getCurrentCitizenId();
      const list = ownId
        ? window.MOCK.ratings.filter((r) => r.citizenId === ownId)
        : window.MOCK.ratings;
      return call(list);
    },
    // TODO: POST /api/ratings
    async submitFeedback(payload) {
      console.info("[mock] submitFeedback", payload);
      return call({ ok: true });
    },

    // ---- Knowledge base ----
    // TODO: GET /api/kb/articles?q=
    async fetchKnowledgeArticles(query = "") {
      const list = window.MOCK.knowledgeArticles.filter((a) =>
        !query || a.title.toLowerCase().includes(query.toLowerCase())
      );
      return call(list);
    },

    // ---- Insights ----
    // TODO: GET /api/insights/overview
    async fetchInsights() {
      // Aggregate analytics are not visible to citizens.
      if (this.isCitizen()) return call(null);
      return call(window.MOCK.insights);
    },

    // ---- Recognition (thank-yous, milestone messages) ----
    // TODO: GET /api/citizens/{id}/recognitions
    async fetchRecognitions(citizenId) {
      const ownId = this.getCurrentCitizenId();
      const scopeId = ownId || citizenId;
      const list = scopeId
        ? window.MOCK.recognitions.filter((r) => r.citizenId === scopeId)
        : window.MOCK.recognitions;
      return call(list);
    },
    // TODO: POST /api/recognitions
    async sendRecognition(payload) {
      console.info("[mock] sendRecognition", payload);
      window.MOCK.recognitions.unshift({
        id: "REC-" + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        from: (this.getCurrentUser() || {}).name || "Agent",
        ...payload,
      });
      return call({ ok: true });
    },

    // ---- Loyalty tier progress ----
    tierProgress(points) {
      const tiers = window.MOCK.tiers;
      const current = [...tiers].reverse().find((t) => points >= t.min) || tiers[0];
      const next = tiers.find((t) => t.min > points) || null;
      const span = next ? (next.min - current.min) : 1;
      const into = Math.max(0, points - current.min);
      const pct  = next ? Math.min(100, Math.round((into / span) * 100)) : 100;
      return {
        current,
        next,
        pointsToNext: next ? next.min - points : 0,
        percent: pct,
      };
    },

    // ---- Cross-cutting actions ----
    // TODO: POST /api/cases (escalation creates a high-priority case)
    async escalate({ citizenId, reason, notes }) {
      console.info("[mock] escalate", { citizenId, reason, notes });
      const caseId = "CASE-" + Date.now();
      window.MOCK.cases.unshift({
        id: caseId, citizenId, title: "Escalation: " + (reason || "Citizen request"),
        priority: "High", status: "Escalated",
        opened: new Date().toISOString().slice(0, 10),
        assignedTo: "Supervisor",
      });
      return call({ ok: true, caseId });
    },
    // TODO: POST /api/citizens/{id}/resolve-issue
    async logResolution({ citizenId, notes }) {
      console.info("[mock] logResolution", { citizenId, notes });
      window.MOCK.engagementEvents.unshift({
        id: "E-" + Date.now(), citizenId,
        date: new Date().toISOString().slice(0, 10),
        type: "Service", channel: "Agent", points: 10,
        description: "Issue resolved by agent",
      });
      return call({ ok: true });
    },
    // Citizen rates an interaction
    // TODO: POST /api/interactions/{id}/rate
    async rateInteraction({ interactionId, score, comment }) {
      console.info("[mock] rateInteraction", { interactionId, score, comment });
      const i = window.MOCK.interactions.find((x) => x.id === interactionId);
      if (i) {
        i.rated = true;
        window.MOCK.ratings.unshift({
          id: "RT-" + Date.now(),
          citizenId: i.citizenId, agent: i.agent,
          date: new Date().toISOString().slice(0, 10),
          channel: i.channel, score, comment,
        });
      }
      return call({ ok: true });
    },
  };

  window.Services = Services;
})();
