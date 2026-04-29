/* =========================================================
   Generic modal controller — accessible dialog.
   Handles: open/close via [data-modal-open] / [data-modal-close],
            backdrop click, Escape, focus trap, aria-modal, and
            returning focus to the previously-focused element.
   ========================================================= */

(function () {
  let lastFocused = null;

  function focusableIn(el) {
    return Array.from(
      el.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((n) => n.offsetParent !== null || n === document.activeElement);
  }

  function trapFocus(overlay, dialog) {
    overlay.__trap = (e) => {
      if (e.key !== "Tab") return;
      const items = focusableIn(dialog);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    overlay.addEventListener("keydown", overlay.__trap);
  }

  function releaseTrap(overlay) {
    if (overlay.__trap) {
      overlay.removeEventListener("keydown", overlay.__trap);
      overlay.__trap = null;
    }
  }

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    const dialog = overlay.querySelector(".modal") || overlay;
    if (!dialog.hasAttribute("role")) dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");

    lastFocused = document.activeElement;
    overlay.classList.add("is-open");

    // Hide the rest of the page from assistive tech
    Array.from(document.body.children).forEach((node) => {
      if (node !== overlay && !node.classList.contains("toast-container")) {
        if (!node.hasAttribute("data-prev-aria-hidden")) {
          node.setAttribute("data-prev-aria-hidden", node.getAttribute("aria-hidden") || "");
        }
        node.setAttribute("aria-hidden", "true");
      }
    });

    // Move focus into the dialog
    requestAnimationFrame(() => {
      const items = focusableIn(dialog);
      (items[0] || dialog).focus();
    });

    trapFocus(overlay, dialog);
  }

  function closeModal(overlay) {
    overlay.classList.remove("is-open");
    releaseTrap(overlay);

    // Restore aria-hidden on siblings
    Array.from(document.body.children).forEach((node) => {
      if (node.hasAttribute("data-prev-aria-hidden")) {
        const prev = node.getAttribute("data-prev-aria-hidden");
        if (prev) node.setAttribute("aria-hidden", prev);
        else node.removeAttribute("aria-hidden");
        node.removeAttribute("data-prev-aria-hidden");
      }
    });

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-modal-open]");
    if (opener) {
      openModal(opener.getAttribute("data-modal-open"));
      return;
    }

    const closer = e.target.closest("[data-modal-close]");
    if (closer) {
      const overlay = closer.closest(".modal-overlay");
      if (overlay) closeModal(overlay);
      return;
    }

    if (e.target.classList && e.target.classList.contains("modal-overlay")) {
      closeModal(e.target);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.is-open")
        .forEach((m) => closeModal(m));
    }
  });

  window.Modals = {
    open: openModal,
    close: (id) => {
      const el = document.getElementById(id);
      if (el) closeModal(el);
    },
  };
})();
