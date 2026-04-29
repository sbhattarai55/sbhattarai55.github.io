/* =========================================================
   Toast notifications — window.Toast.show(message, type)
   type: "success" | "info" | "warn" | "danger"
   ========================================================= */

(function () {
  function ensureContainer() {
    let c = document.getElementById("toastContainer");
    if (c) return c;
    c = document.createElement("div");
    c.id = "toastContainer";
    c.className = "toast-container";
    // ARIA live region: SR announces new toasts without stealing focus.
    c.setAttribute("role", "status");
    c.setAttribute("aria-live", "polite");
    c.setAttribute("aria-atomic", "false");
    document.body.appendChild(c);
    return c;
  }

  function show(message, type = "success", opts = {}) {
    const container = ensureContainer();
    const t = document.createElement("div");
    t.className = `toast toast--${type}`;
    // Errors should be assertive so they're announced immediately.
    if (type === "danger") t.setAttribute("role", "alert");
    const icon = { success: "✅", info: "ℹ️", warn: "⚠️", danger: "🚨" }[type] || "•";
    const label = { success: "Success", info: "Information", warn: "Warning", danger: "Error" }[type] || "Notice";
    t.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${icon}</span>
      <span class="sr-only">${label}: </span>
      <div class="toast__msg">${message}</div>
      <button class="toast__close" type="button" aria-label="Dismiss notification">
        <span aria-hidden="true">×</span>
      </button>`;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add("is-visible"));

    const ttl = opts.ttl ?? 3500;
    const remove = () => {
      t.classList.remove("is-visible");
      setTimeout(() => t.remove(), 200);
    };
    const timer = setTimeout(remove, ttl);
    t.querySelector(".toast__close").addEventListener("click", () => {
      clearTimeout(timer);
      remove();
    });
  }

  window.Toast = { show };
})();
