/* =========================================================
   Global omnisearch — searches across pages, citizens,
   programs, cases, and knowledge base articles.
   Exposes window.Search.query(q, opts).
   ========================================================= */

(function () {
  // Static catalog of pages — quick navigation results
  const PAGES = [
    { title: "Agent Dashboard",        keywords: "home overview agent kpi alerts recommendations", href: "agent-dashboard.html",    icon: "🏠" },
    { title: "Citizens",               keywords: "citizen profile lookup search resident",          href: "citizen-profile.html",    icon: "👤" },
    { title: "My Dashboard (Citizen)", keywords: "self service citizen loyalty points tier",        href: "citizen-dashboard.html",  icon: "🧍" },
    { title: "Engagement History",     keywords: "engagement events history timeline activity",     href: "engagement-history.html", icon: "📈" },
    { title: "Programs",               keywords: "programs enroll recommendations community",       href: "programs.html",           icon: "🎯" },
    { title: "Cases",                  keywords: "cases service requests resolution escalate",      href: "cases.html",              icon: "🗂️" },
    { title: "Insights",               keywords: "supervisor insights trends ratings performance",  href: "insights.html",           icon: "📊" },
    { title: "Knowledge Base",         keywords: "knowledge articles policy process kb",            href: "knowledge-base.html",     icon: "📚" },
    { title: "Settings",               keywords: "settings profile notifications preferences",      href: "settings.html",           icon: "⚙️" },
  ];

  // Score how well a record matches the query.
  // Returns a number; higher is better. 0 means no match.
  function score(query, fields) {
    const q = query.toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    let total = 0;
    for (const t of tokens) {
      let best = 0;
      for (const f of fields) {
        if (!f) continue;
        const v = String(f).toLowerCase();
        if (v === t) best = Math.max(best, 5);
        else if (v.startsWith(t)) best = Math.max(best, 3);
        else if (v.includes(t)) best = Math.max(best, 2);
      }
      if (best === 0) return 0; // every token must match somewhere
      total += best;
    }
    return total;
  }

  async function query(q, opts = {}) {
    q = (q || "").trim();
    if (!q) return [];
    const prefix = opts.pagePrefix || "";

    // Run mock services in parallel — easy to replace with a real /search endpoint later
    const [citizens, programs, cases, articles] = await Promise.all([
      window.Services.fetchCitizens(),
      window.Services.fetchPrograms(),
      window.Services.fetchCases(),
      window.Services.fetchKnowledgeArticles(),
    ]);

    const results = [];
    const role = (window.Services?.getCurrentRole && window.Services.getCurrentRole()) || "guest";
    const PAGE_ACCESS = {
      "agent-dashboard.html":    ["agent", "supervisor"],
      "citizen-profile.html":    ["agent", "supervisor"],
      "engagement-history.html": ["agent", "supervisor", "citizen"],
      "programs.html":           ["agent", "supervisor", "citizen"],
      "cases.html":              ["agent", "supervisor", "citizen"],
      "insights.html":           ["agent", "supervisor"],
      "knowledge-base.html":     ["agent", "supervisor", "citizen"],
      "settings.html":           ["agent", "supervisor", "citizen"],
      "citizen-dashboard.html":  ["citizen"],
    };
    const canSeePage = (href) => (PAGE_ACCESS[href] || []).includes(role);

    // Pages
    for (const p of PAGES) {
      if (!canSeePage(p.href)) continue;
      const s = score(q, [p.title, p.keywords]);
      if (s) results.push({ category: "Pages", title: p.title, subtitle: "", icon: p.icon, href: prefix + p.href, score: s + 1 });
    }

    // Citizens (skip for citizen role \u2014 they only see themselves and shouldn't navigate to the agent profile page)
    if (role !== "citizen") {
      for (const c of citizens) {
        const s = score(q, [c.name, c.id, c.email, c.phone, c.tier, ...(c.tags || [])]);
        if (s) results.push({
          category: "Citizens",
          title: c.name,
          subtitle: `${c.id} · ${c.tier} · ${c.email}`,
          icon: "👤",
          href: `${prefix}citizen-profile.html?id=${encodeURIComponent(c.id)}`,
          score: s,
        });
      }
    }

    // Programs
    for (const p of programs) {
      const s = score(q, [p.name, p.category, p.description, p.eligibility]);
      if (s) results.push({
        category: "Programs",
        title: p.name,
        subtitle: `${p.category} · +${p.points} pts`,
        icon: "🎯",
        href: `${prefix}programs.html#${encodeURIComponent(p.id)}`,
        score: s,
      });
    }

    // Cases
    for (const k of cases) {
      const s = score(q, [k.id, k.title, k.status, k.priority, k.assignedTo]);
      if (s) results.push({
        category: "Cases",
        title: `${k.id} — ${k.title}`,
        subtitle: `${k.status} · ${k.priority} priority`,
        icon: "🗂️",
        href: `${prefix}cases.html#${encodeURIComponent(k.id)}`,
        score: s,
      });
    }

    // Knowledge articles
    for (const a of articles) {
      const s = score(q, [a.title, a.category, a.excerpt]);
      if (s) results.push({
        category: "Knowledge Base",
        title: a.title,
        subtitle: `${a.category} · Updated ${a.updated}`,
        icon: "📚",
        href: `${prefix}knowledge-base.html#${encodeURIComponent(a.id)}`,
        score: s,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 12);
  }

  window.Search = { query };
})();
