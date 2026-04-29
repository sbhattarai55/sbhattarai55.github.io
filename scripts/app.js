/* =========================================================
   App bootstrapper — injects shared header & sidebar into
   every page that includes <div data-app-shell>.
   ========================================================= */

(function () {
  // Page-level access matrix. Roles not listed are denied and redirected.
  // 'guest' is anyone not signed in — always redirected to login.
  const PAGE_ACCESS = {
    "agent-dashboard.html":    ["agent", "supervisor"],
    "citizen-profile.html":    ["agent", "supervisor"],
    "engagement-history.html": ["agent", "supervisor", "citizen"], // citizen sees own only
    "programs.html":           ["agent", "supervisor", "citizen"],
    "cases.html":              ["agent", "supervisor", "citizen"], // citizen sees own only
    "insights.html":           ["agent", "supervisor"],
    "knowledge-base.html":     ["agent", "supervisor", "citizen"],
    "settings.html":           ["agent", "supervisor", "citizen"],
    "citizen-dashboard.html":  ["citizen"],
  };

  const HOME_BY_ROLE = {
    agent: "agent-dashboard.html",
    supervisor: "insights.html",
    citizen: "citizen-dashboard.html",
  };

  const NAV_BY_ROLE = {
    agent: [
      { href: "agent-dashboard.html",    icon: "🏠", label: "Dashboard" },
      { href: "citizen-profile.html",    icon: "👤", label: "Citizens" },
      { href: "engagement-history.html", icon: "📈", label: "Engagement" },
      { href: "programs.html",           icon: "🎯", label: "Programs" },
      { href: "cases.html",              icon: "🗂️", label: "Cases" },
      { href: "knowledge-base.html",     icon: "📚", label: "Knowledge Base" },
      { href: "settings.html",           icon: "⚙️", label: "Settings" },
    ],
    supervisor: [
      { href: "agent-dashboard.html",    icon: "🏠", label: "Dashboard" },
      { href: "citizen-profile.html",    icon: "👤", label: "Citizens" },
      { href: "engagement-history.html", icon: "📈", label: "Engagement" },
      { href: "programs.html",           icon: "🎯", label: "Programs" },
      { href: "cases.html",              icon: "🗂️", label: "Cases" },
      { href: "insights.html",           icon: "📊", label: "Insights" },
      { href: "knowledge-base.html",     icon: "📚", label: "Knowledge Base" },
      { href: "settings.html",           icon: "⚙️", label: "Settings" },
    ],
    citizen: [
      { href: "citizen-dashboard.html",  icon: "🏠", label: "My Dashboard" },
      { href: "engagement-history.html", icon: "📈", label: "My Activity" },
      { href: "cases.html",              icon: "🗂️", label: "My Requests" },
      { href: "programs.html",           icon: "🎯", label: "Programs" },
      { href: "knowledge-base.html",     icon: "📚", label: "Help Center" },
      { href: "settings.html",           icon: "⚙️", label: "Settings" },
    ],
  };

  function currentFile() {
    const path = window.location.pathname.split("/").pop();
    return path || "agent-dashboard.html";
  }

  // Returns true if access is allowed; otherwise redirects and returns false.
  function enforceAccess(user) {
    const here = currentFile();
    const allowed = PAGE_ACCESS[here];
    if (!allowed) return true; // unknown page — leave alone

    const role = (user && user.roleKey) || "guest";
    if (role === "guest") {
      window.location.replace("../index.html");
      return false;
    }
    if (!allowed.includes(role)) {
      const home = HOME_BY_ROLE[role] || "agent-dashboard.html";
      window.location.replace(home);
      return false;
    }
    return true;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function renderSidebar(role) {
    const here = currentFile();
    const items = (NAV_BY_ROLE[role] || NAV_BY_ROLE.agent).map((it) => {
      const isActive = it.href === here;
      const activeClass = isActive ? "is-active" : "";
      const ariaCurrent = isActive ? ' aria-current="page"' : "";
      return `
        <a class="side-nav__item ${activeClass}" href="${it.href}"${ariaCurrent}>
          <span class="side-nav__icon" aria-hidden="true">${it.icon}</span>
          <span>${it.label}</span>
        </a>`;
    }).join("");

    return `
      <aside class="side-nav" id="sideNav" aria-label="Primary">
        <div class="side-nav__brand">
          <span class="side-nav__brand-mark" aria-hidden="true">C</span>
          <span>Civic Desk</span>
        </div>
        <nav class="side-nav__section" aria-label="Main navigation">
          <div class="side-nav__label" id="sideNavLabel">Workspace</div>
          <ul class="side-nav__list" role="list" aria-labelledby="sideNavLabel" style="list-style:none; padding:0; margin:0;">
            ${items.replace(/<a /g, '<li role="none" style="display:block;"><a role="menuitem" ').replace(/<\/a>/g, '</a></li>')}
          </ul>
        </nav>
      </aside>`;
  }

  function renderHeader(user) {
    const initials = user?.initials || "G";
    const name = user?.name || "Guest";
    const role = user?.role || "Visitor";
    return `
      <header class="app-header" role="banner">
        <div class="flex items-center" style="min-width:0;">
          <button class="menu-toggle" id="menuToggle" aria-label="Open navigation menu" aria-controls="sideNav" aria-expanded="false">
            <span aria-hidden="true">☰</span>
          </button>
          <span class="app-header__brand">
            <span class="side-nav__brand-mark" aria-hidden="true">C</span> Civic Desk
          </span>
        </div>

        <div class="app-header__search" role="search">
          <label class="sr-only" for="globalSearch">Search citizens, programs, cases, articles, and pages</label>
          <input id="globalSearch" type="search" autocomplete="off"
                 role="combobox"
                 aria-controls="globalSearchResults"
                 aria-expanded="false"
                 aria-autocomplete="list"
                 placeholder="Search citizens, programs, cases, articles, pages…" />
          <div class="search-results" id="globalSearchResults" role="listbox" aria-label="Search suggestions" hidden></div>
        </div>

        <div class="app-header__actions">
          <button class="icon-btn" type="button" id="themeToggleBtn" aria-label="Switch to dark theme" aria-pressed="false" title="Toggle theme">
            <span aria-hidden="true" id="themeToggleIcon">🌙</span>
          </button>
          <button class="icon-btn" type="button" aria-label="Notifications, 1 unread">
            <span aria-hidden="true">🔔</span>
            <span class="badge-dot" aria-hidden="true"></span>
          </button>
          <button class="icon-btn" type="button" aria-label="Help">
            <span aria-hidden="true">❔</span>
          </button>
          <div class="user-menu-wrap">
            <button class="user-menu" type="button" id="userMenuBtn"
                    aria-haspopup="menu" aria-expanded="false" aria-controls="userMenuDropdown"
                    aria-label="Account menu for ${escapeHtml(name)}, ${escapeHtml(role)}">
              <span class="user-menu__avatar" aria-hidden="true">${initials}</span>
              <span class="user-menu__meta" aria-hidden="true">
                <strong>${escapeHtml(name)}</strong><br/>
                <span>${escapeHtml(role)}</span>
              </span>
              <span aria-hidden="true" style="margin-left:4px;color:var(--color-text-muted);">▾</span>
            </button>
            <div class="user-menu__dropdown" id="userMenuDropdown" role="menu" aria-labelledby="userMenuBtn">
              <a href="settings.html" role="menuitem">
                <span aria-hidden="true">⚙️</span> Settings
              </a>
              <button type="button" id="logoutBtn" role="menuitem">
                <span aria-hidden="true">↪</span> Sign out
              </button>
            </div>
          </div>
        </div>
      </header>`;
  }

  function injectShell() {
    const shell = document.querySelector("[data-app-shell]");
    if (!shell) return;

    const user = (window.Services && window.Services.getCurrentUser()) || null;

    // Route guard — stop rendering if the role is not allowed on this page.
    if (!enforceAccess(user)) return;

    const role = (user && user.roleKey) || "agent";
    shell.classList.add("app-shell");

    // Skip link — first focusable element on the page so keyboard users
    // can bypass the nav and jump straight to <main>.
    const skipLink = document.createElement("a");
    skipLink.href = "#mainContent";
    skipLink.className = "skip-link";
    skipLink.textContent = "Skip to main content";
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Mark the existing <main> so the skip link targets it and so it
    // can receive programmatic focus without being in the tab order.
    const mainEl = shell.querySelector("main") || shell.querySelector(".app-main");
    if (mainEl) {
      if (!mainEl.id) mainEl.id = "mainContent";
      mainEl.setAttribute("tabindex", "-1");
      if (!mainEl.hasAttribute("role")) mainEl.setAttribute("role", "main");
    }

    shell.insertAdjacentHTML("afterbegin", renderSidebar(role) + renderHeader(user));

    // Mobile menu toggle
    const toggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sideNav");
    if (toggle && sidebar) {
      toggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
      });
      document.addEventListener("click", (e) => {
        if (window.innerWidth > 900) return;
        if (!sidebar.contains(e.target) && e.target !== toggle) {
          sidebar.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Open navigation menu");
        }
      });
      // Esc closes mobile nav
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && sidebar.classList.contains("is-open")) {
          sidebar.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }

    // Global search — multi-source omnisearch
    const search = document.getElementById("globalSearch");
    const results = document.getElementById("globalSearchResults");
    if (search && results) {
      const inPages = window.location.pathname.includes("/pages/");
      const pagePrefix = inPages ? "" : "pages/";

      let activeIndex = -1;
      let lastItems = [];

      const closeResults = () => {
        results.hidden = true;
        search.setAttribute("aria-expanded", "false");
        search.removeAttribute("aria-activedescendant");
        activeIndex = -1;
      };
      const openResults = () => {
        results.hidden = false;
        search.setAttribute("aria-expanded", "true");
      };

      const navigate = (href) => { window.location.href = href; };

      const performSearch = async (q) => {
        q = (q || "").trim();
        if (!q) { closeResults(); return; }

        const items = await window.Search.query(q, { pagePrefix });
        lastItems = items;
        if (!items.length) {
          results.innerHTML = `<div class="search-results__empty">No results for “${escapeHtml(q)}”</div>`;
          openResults();
          return;
        }

        // Group by category, preserving rank order
        const groups = {};
        items.forEach((it) => { (groups[it.category] = groups[it.category] || []).push(it); });
        let i = 0;
        const html = Object.entries(groups).map(([cat, list]) => `
          <div class="search-results__group">
            <div class="search-results__label">${cat}</div>
            ${list.map((it) => {
              const idx = i++;
              return `<a class="search-results__item" data-idx="${idx}" href="${it.href}" role="option">
                <span class="search-results__icon">${it.icon || "•"}</span>
                <span class="search-results__text">
                  <strong>${escapeHtml(it.title)}</strong>
                  ${it.subtitle ? `<small>${escapeHtml(it.subtitle)}</small>` : ""}
                </span>
              </a>`;
            }).join("")}
          </div>`).join("");
        results.innerHTML = html;
        activeIndex = -1;
        openResults();
      };

      const setActive = (next) => {
        const nodes = results.querySelectorAll(".search-results__item");
        if (!nodes.length) return;
        if (next < 0) next = nodes.length - 1;
        if (next >= nodes.length) next = 0;
        nodes.forEach((n) => {
          n.classList.remove("is-active");
          n.setAttribute("aria-selected", "false");
        });
        nodes[next].classList.add("is-active");
        nodes[next].setAttribute("aria-selected", "true");
        if (!nodes[next].id) nodes[next].id = `search-opt-${next}`;
        search.setAttribute("aria-activedescendant", nodes[next].id);
        nodes[next].scrollIntoView({ block: "nearest" });
        activeIndex = next;
      };

      let debounce;
      search.addEventListener("input", (e) => {
        clearTimeout(debounce);
        const v = e.target.value;
        debounce = setTimeout(() => performSearch(v), 120);
      });
      search.addEventListener("focus", () => { if (search.value.trim()) performSearch(search.value); });
      search.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIndex + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIndex - 1); }
        else if (e.key === "Enter") {
          e.preventDefault();
          if (activeIndex >= 0 && lastItems[activeIndex]) navigate(lastItems[activeIndex].href);
          else if (lastItems.length) navigate(lastItems[0].href);
        } else if (e.key === "Escape") { closeResults(); search.blur(); }
      });
      document.addEventListener("click", (e) => {
        if (!results.contains(e.target) && e.target !== search) closeResults();
      });
    }

    // User menu dropdown + logout
    const userBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userMenuDropdown");
    if (userBtn && userDropdown) {
      userBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = userDropdown.classList.toggle("is-open");
        userBtn.setAttribute("aria-expanded", String(open));
        if (open) {
          // Move focus into the menu
          const first = userDropdown.querySelector('a, button');
          if (first) first.focus();
        }
      });
      document.addEventListener("click", (e) => {
        if (!userDropdown.contains(e.target) && e.target !== userBtn) {
          userDropdown.classList.remove("is-open");
          userBtn.setAttribute("aria-expanded", "false");
        }
      });
      // Esc closes the user menu and returns focus to the trigger
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && userDropdown.classList.contains("is-open")) {
          userDropdown.classList.remove("is-open");
          userBtn.setAttribute("aria-expanded", "false");
          userBtn.focus();
        }
      });
      // Arrow-key navigation within the menu
      userDropdown.addEventListener("keydown", (e) => {
        const items = Array.from(userDropdown.querySelectorAll('a, button'));
        const i = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          items[(i + 1) % items.length]?.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          items[(i - 1 + items.length) % items.length]?.focus();
        }
      });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (window.Services) window.Services.logout();
        // Redirect to login (works from /pages/* and from project root)
        const inPages = window.location.pathname.includes("/pages/");
        window.location.href = inPages ? "../index.html" : "index.html";
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById("themeToggleBtn");
    const themeIcon = document.getElementById("themeToggleIcon");
    function syncThemeButton() {
      if (!themeBtn) return;
      const isDark = (window.Theme && window.Theme.current() === "dark") ||
                     document.documentElement.getAttribute("data-theme") === "dark";
      themeBtn.setAttribute("aria-pressed", String(isDark));
      themeBtn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";
    }
    if (themeBtn && window.Theme) {
      syncThemeButton();
      themeBtn.addEventListener("click", () => {
        window.Theme.toggle();
        syncThemeButton();
      });
      window.addEventListener("themechange", syncThemeButton);
    }
  }

  document.addEventListener("DOMContentLoaded", injectShell);
})();
