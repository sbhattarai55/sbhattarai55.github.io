/* =========================================================
   Theme controller — light/dark for the internal app.
   Loaded synchronously in <head> so the theme is applied
   before paint (avoids FOUC). Auth pages don't include this
   script and keep their self-contained dark UI.
   ========================================================= */
(function () {
  const KEY = "scd_theme";
  function getStored() {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  }
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
  function preferred() {
    return getStored() ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
  }
  function set(theme) {
    apply(theme);
    try { localStorage.setItem(KEY, theme); } catch (_) {}
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }
  function toggle() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    set(next);
    return next;
  }
  function current() {
    return document.documentElement.getAttribute("data-theme") || "light";
  }

  // Apply immediately (this script runs in <head>, before body paints)
  apply(preferred());

  window.Theme = { set, toggle, current };
})();
