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
    document.body.appendChild(c);
    return c;
  }

  function show(message, type = "success", opts = {}) {
    const container = ensureContainer();
    const t = document.createElement("div");
    t.className = `toast toast--${type}`;
    const icon = { success: "✅", info: "ℹ️", warn: "⚠️", danger: "🚨" }[type] || "•";
    t.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${icon}</span>
      <div class="toast__msg">${message}</div>
      <button class="toast__close" aria-label="Dismiss">×</button>`;
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
