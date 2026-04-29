/* =========================================================
   Generic modal controller.
   Usage:
     <div class="modal-overlay" data-modal id="enrollModal">...</div>
     <button data-modal-open="enrollModal">Open</button>
     <button data-modal-close>Close</button>
   ========================================================= */

(function () {
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("is-open");
  }
  function closeModal(el) {
    el.classList.remove("is-open");
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

    // Click on overlay backdrop closes the modal
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

  window.Modals = { open: openModal, close: (id) => {
    const el = document.getElementById(id); if (el) closeModal(el);
  }};
})();
