const header = document.querySelector(".site-header");

// Sombra sutil estilo macOS al hacer scroll
const syncHeaderScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};
syncHeaderScroll();
window.addEventListener("scroll", syncHeaderScroll, { passive: true });

// =========================================================
// Menú Lateral (Navigation Drawer derecho con Scroll Snap)
// =========================================================
const drawer = document.getElementById("drawer");
const openBtn = document.getElementById("drawer-open");
const closeBtn = document.getElementById("drawer-close");
const scroller = drawer?.querySelector(".Drawer-scroller");
const sheet = drawer?.querySelector(".Drawer-sheet");

if (drawer && openBtn && closeBtn && scroller && sheet) {
  let isOpening = false;

  async function openDrawer() {
    if (drawer.open) return;
    isOpening = true;
    drawer.showModal();

    if (!CSS.supports("scroll-initial-target", "nearest")) {
      scroller.scrollTo({ left: 0, behavior: "instant" });
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
    }

    scroller.scrollTo({ left: sheet.offsetWidth, behavior: "auto" });
  }

  function closeDrawer() {
    if (!drawer.open) return;
    isOpening = false;
    scroller.scrollTo({ left: 0, behavior: "auto" });
  }

  function onDrawerOpened() {
    isOpening = false;
    openBtn.setAttribute("aria-expanded", "true");
  }

  function onDrawerClosed() {
    if (isOpening || !drawer.open) return;
    drawer.close();
    openBtn.setAttribute("aria-expanded", "false");
  }

  if (!CSS.supports("animation-timeline: scroll()")) {
    scroller.addEventListener("scroll", () => {
      const width = sheet.offsetWidth || 1;
      const ratio = Math.min(1, Math.max(0, scroller.scrollLeft / width));
      drawer.style.setProperty("--drawer-backdrop", String(ratio));
    });
  }

  const visibleThreshold = 1 / Math.max(window.innerWidth, 320);

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries.at(-1);
      if (!entry) return;
      if (entry.intersectionRatio >= visibleThreshold) {
        isOpening = false;
      }
      if (entry.intersectionRatio < visibleThreshold) onDrawerClosed();
      if (entry.intersectionRatio >= 0.99) onDrawerOpened();
    },
    { root: drawer, threshold: [visibleThreshold, 0.99] }
  );
  observer.observe(sheet);

  openBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (event) => {
    if (!sheet.contains(event.target)) closeDrawer();
  });

  drawer.addEventListener("cancel", (event) => {
    if (event.cancelable) {
      event.preventDefault();
      closeDrawer();
    }
  });

  drawer.querySelectorAll("[data-drawer-link]").forEach((link) => {
    link.addEventListener("click", () => {
      closeDrawer();
    });
  });
}

// =========================================================
// Iluminación e inclinación macOS + Fallback para :has()
// =========================================================
const serviceCards = document.querySelectorAll(".service-card");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const supportsHover = window.matchMedia("(hover: hover)");
const supportsHas = CSS.supports("selector(:has(*))");

serviceCards.forEach((card) => {
  if (supportsHover.matches && !prefersReducedMotion.matches) {
    card.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width;
      const relY = (event.clientY - rect.top) / rect.height;

      const tiltY = (relX - 0.5) * 4;
      const tiltX = (0.5 - relY) * 3;

      card.style.setProperty("--pointer-x", `${(relX * 100).toFixed(2)}%`);
      card.style.setProperty("--pointer-y", `${(relY * 100).toFixed(2)}%`);
      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  }

  if (!supportsHas) {
    const trigger = card.querySelector(".card-cta-trigger");
    if (trigger) {
      trigger.addEventListener("mouseenter", () => card.classList.add("is-hovered"));
      trigger.addEventListener("mouseleave", () => {
        card.classList.remove("is-hovered", "is-pressed");
      });
      trigger.addEventListener("pointerdown", () => card.classList.add("is-pressed"));
      trigger.addEventListener("pointerup", () => card.classList.remove("is-pressed"));
      trigger.addEventListener("focus", () => card.classList.add("is-focused"));
      trigger.addEventListener("blur", () => card.classList.remove("is-focused"));
    }
  }
});

// =========================================================
// Modal unificado para todas las tarjetas presionables
// =========================================================
const cardTriggers = document.querySelectorAll(".card-cta-trigger");
const bloqueoModal = document.getElementById("bloqueo-modal");
const modalCloseBtn = document.getElementById("modal-close");
const modalCancelBtn = document.getElementById("modal-cancel");
const bloqueoForm = document.getElementById("bloqueo-form");
const imeiInput = document.getElementById("imei-input");
const modeloInput = document.getElementById("modelo-input");
const modeloField = document.getElementById("modelo-field");
const servicioInput = document.getElementById("servicio-input");
const modalBadge = document.getElementById("modal-service-badge");
const modalTitle = document.getElementById("modal-title");
const modalSubtitle = document.getElementById("modal-subtitle");
const modalFormRow = document.getElementById("modal-form-row");
const alcanceField = document.getElementById("alcance-field");

function openServiceModal(trigger) {
  if (!bloqueoModal || bloqueoModal.open) return;

  const serviceName = trigger.dataset.service || "Bloqueo de IMEI";
  const titleText = trigger.dataset.modalTitle || "Solicitar servicio";
  const subtitleText = trigger.dataset.modalSubtitle || "";
  const showScope = trigger.dataset.showScope === "true";
  const imeiOnly = trigger.dataset.imeiOnly === "true";

  if (servicioInput) servicioInput.value = serviceName;
  if (modalBadge) modalBadge.textContent = serviceName;
  if (modalTitle) modalTitle.textContent = titleText;
  if (modalSubtitle) modalSubtitle.textContent = subtitleText;

  if (modeloField && modeloInput) {
    modeloField.hidden = imeiOnly;
    modeloInput.required = !imeiOnly;
    if (imeiOnly) modeloInput.value = "";
  }

  if (alcanceField) {
    alcanceField.hidden = !showScope;
  }

  if (modalFormRow) {
    const visibleFields = (imeiOnly ? 0 : 1) + (showScope ? 1 : 0);
    modalFormRow.classList.toggle("is-single", visibleFields <= 1);
  }

  bloqueoModal.showModal();
}

cardTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => openServiceModal(trigger));
});

if (modalCloseBtn && bloqueoModal) {
  modalCloseBtn.addEventListener("click", () => bloqueoModal.close());
}

if (modalCancelBtn && bloqueoModal) {
  modalCancelBtn.addEventListener("click", () => bloqueoModal.close());
}

if (bloqueoModal) {
  bloqueoModal.addEventListener("click", (event) => {
    if (event.target === bloqueoModal) bloqueoModal.close();
  });
}

if (imeiInput) {
  imeiInput.addEventListener("input", () => {
    imeiInput.value = imeiInput.value.replace(/\D/g, "").slice(0, 15);
  });
}

if (bloqueoForm && bloqueoModal) {
  bloqueoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(bloqueoForm);
    const servicio = String(formData.get("servicio") || "Servicio IMEI").trim();
    const imei = String(formData.get("imei") || "").trim();
    const showModel = modeloField ? !modeloField.hidden : true;
    const modelo = showModel ? String(formData.get("modelo") || "").trim() : "";
    const showScope = alcanceField ? !alcanceField.hidden : false;
    const alcance = showScope ? String(formData.get("alcance") || "").trim() : "";

    let message = `Hola REDIMEI, quiero solicitar el servicio de ${encodeURIComponent(servicio)}:%0A• IMEI: ${encodeURIComponent(imei)}`;
    if (modelo) {
      message += `%0A• Modelo: ${encodeURIComponent(modelo)}`;
    }
    if (alcance) {
      message += `%0A• Alcance: ${encodeURIComponent(alcance)}`;
    }

    window.open(`https://wa.me/573057556566?text=${message}`, "_blank", "noopener,noreferrer");
    bloqueoModal.close();
    bloqueoForm.reset();
  });
}
