(() => {
  "use strict";

  const TIENDA = window.TIENDA;
  const PRODUCTOS = window.PRODUCTOS || [];
  const CATEGORIAS = { mates: "Mates", bolsos: "Bolsos y canastas", kits: "Kits" };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const byId = (id) => PRODUCTOS.find((p) => p.id === id);
  const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const precio = (n) => moneda.format(n).replace(/ /g, " ");
  const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const normalizar = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const waLink = (texto) => `https://wa.me/${TIENDA.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;

  // Fotos con versión liviana de 480px (assets/img/p-xxx-480.webp). Las fotos nuevas sin versión chica se usan tal cual.
  const CON_CHICA = /\/p-(kit|canasta|bolso-1|bolso-2|imperial|mate-grabado)\.webp$/;
  const chica = (src) => (CON_CHICA.test(src) ? src.replace(/\.webp$/, "-480.webp") : src);
  const srcsetDe = (src, sizes) => (CON_CHICA.test(src) ? `srcset="${chica(src)} 480w, ${src} 900w" sizes="${sizes}"` : "");
  const TAM_CARD = "(max-width: 980px) 50vw, 400px";

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* sin almacenamiento: el carrito vive sólo en esta pestaña */
      }
    },
  };

  /* =========================================================
     Datos de contacto y precios desde la config
     ========================================================= */
  $$(".wa-float, [data-wa-chat]").forEach((a) => (a.href = waLink("¡Hola Tienda Mate! Tengo una consulta.")));
  $$("[data-wa-visible]").forEach((a) => {
    a.href = waLink();
    a.textContent = TIENDA.whatsappVisible;
  });
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-price-of]").forEach((el) => {
    const p = byId(el.dataset.priceOf);
    if (p) el.textContent = precio(p.precio);
  });

  /* =========================================================
     Scroll suave (Lenis)
     ========================================================= */
  const header = $("[data-header]");
  let lenis = null;
  if (motionOK && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4, smoothWheel: true });
    const raf = (t) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  const headerOffset = () => -(header.offsetHeight + 16);
  function scrollToTarget(target) {
    if (target === "top") {
      lenis ? lenis.scrollTo(0, { duration: 1.4 }) : window.scrollTo({ top: 0, behavior: motionOK ? "smooth" : "auto" });
      return;
    }
    if (lenis) lenis.scrollTo(target, { offset: headerOffset(), duration: 1.3 });
    else {
      const y = target.getBoundingClientRect().top + window.scrollY + headerOffset();
      window.scrollTo({ top: y, behavior: motionOK ? "smooth" : "auto" });
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (id === "inicio" || id === "") {
      e.preventDefault();
      scrollToTarget("top");
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const menuOpen = menuDialog.open;
    if (menuOpen) closeSheet(menuDialog);
    setTimeout(() => scrollToTarget(target), menuOpen ? 280 : 0);
  });
  $("[data-to-top]").addEventListener("click", () => scrollToTarget("top"));

  /* =========================================================
     Header fijo: sombra suave cuando la página ya bajó
     ========================================================= */
  const topSentinel = document.createElement("span");
  topSentinel.setAttribute("aria-hidden", "true");
  topSentinel.style.cssText = "position:absolute;top:120px;left:0;width:1px;height:1px;pointer-events:none;";
  document.body.prepend(topSentinel);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => header.classList.toggle("is-scrolled", !e.isIntersecting)).observe(topSentinel);
  }

  /* =========================================================
     Barra de anuncios rotativa
     ========================================================= */
  const announceItems = $$(".announce-track p");
  let announceIdx = 0;
  let announcePaused = false;
  $("[data-announce]").addEventListener("mouseenter", () => (announcePaused = true));
  $("[data-announce]").addEventListener("mouseleave", () => (announcePaused = false));
  setInterval(() => {
    if (announcePaused || document.hidden) return;
    const current = announceItems[announceIdx];
    announceIdx = (announceIdx + 1) % announceItems.length;
    const next = announceItems[announceIdx];
    current.classList.remove("is-active");
    current.classList.add("is-leaving");
    next.classList.remove("is-leaving");
    // reiniciar posición de entrada sin transición
    next.style.transition = "none";
    next.style.transform = "translateY(100%)";
    void next.offsetWidth;
    next.style.transition = "";
    next.style.transform = "";
    next.classList.add("is-active");
    setTimeout(() => current.classList.remove("is-leaving"), 800);
  }, 4200);

  /* =========================================================
     Fila de categorías: marca la sección activa
     ========================================================= */
  const navLinks = $$(".hn-link");
  const spyLinks = navLinks.filter((l) => l.dataset.spy);
  const spySections = [...spyLinks.map((l) => document.getElementById(l.dataset.spy)), $("#productos")].filter(Boolean);
  let seccionActiva = "portada";
  function marcarActivo() {
    navLinks.forEach((l) => {
      const activo =
        l.dataset.spy === seccionActiva ||
        (seccionActiva === "productos" && l.dataset.filterGo && l.dataset.filterGo === filtro);
      l.setAttribute("aria-current", String(Boolean(activo)));
    });
  }
  if ("IntersectionObserver" in window) {
    const visible = new Map();
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const id = spySections.find((s) => visible.get(s.id))?.id;
        if (id) seccionActiva = id;
        marcarActivo();
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    spySections.forEach((s) => spy.observe(s));
  }

  /* =========================================================
     Revelados al hacer scroll + texto palabra por palabra
     ========================================================= */
  function splitWords(el) {
    if (el.dataset.splitDone) return;
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words
      .map((w, i) => `<span class="w" aria-hidden="true"><span class="wi" style="--wi:${i}">${escapeHTML(w)}</span></span>`)
      .join(" ");
    el.dataset.splitDone = "1";
  }
  $$("[data-split]").forEach(splitWords);

  const revealObserver =
    motionOK && "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              e.target.classList.add("is-in");
              revealObserver.unobserve(e.target);
            });
          },
          { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
        )
      : null;

  function observeReveals(root = document) {
    const els = $$("[data-reveal], [data-split]", root).filter((el) => !el.classList.contains("is-in"));
    if (!revealObserver) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    els.forEach((el) => {
      if (el.closest(".hero")) return; // el hero entra con su propia coreografía
      revealObserver.observe(el);
    });
  }

  // Coreografía del hero al cargar
  requestAnimationFrame(() =>
    requestAnimationFrame(() => $$(".hero [data-split], .hero [data-reveal]").forEach((el) => el.classList.add("is-in")))
  );

  /* =========================================================
     Parallax y cinta (ligados al scroll)
     ========================================================= */
  const parallaxEls = $$("[data-parallax]");
  const visibleParallax = new Set();
  if (motionOK && "IntersectionObserver" in window) {
    const po = new IntersectionObserver((entries) =>
      entries.forEach((e) => (e.isIntersecting ? visibleParallax.add(e.target) : visibleParallax.delete(e.target)))
    );
    parallaxEls.forEach((el) => po.observe(el.parentElement));
  }
  function updateParallax() {
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      if (!visibleParallax.has(el.parentElement)) return;
      const r = el.parentElement.getBoundingClientRect();
      const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1 a 1
      const amount = parseFloat(el.dataset.parallax) || 0.06;
      el.style.transform = `translate3d(0, ${(-progress * amount * r.height).toFixed(2)}px, 0)`;
    });
  }

  const marqueeTrack = $("[data-marquee]");
  const marqueeGroup = $(".marquee-group", marqueeTrack);
  let marqueeX = 0;
  let marqueeW = 0;
  let marqueeDir = -1;
  let marqueeVisible = true;
  function buildMarquee() {
    $$(".marquee-group", marqueeTrack).slice(1).forEach((g) => g.remove());
    marqueeW = marqueeGroup.offsetWidth;
    const copies = Math.ceil((window.innerWidth * 2) / marqueeW) + 1;
    for (let i = 0; i < copies; i++) marqueeTrack.append(marqueeGroup.cloneNode(true));
  }
  buildMarquee();
  if (motionOK) {
    new IntersectionObserver(([e]) => (marqueeVisible = e.isIntersecting)).observe(marqueeTrack);
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min(64, now - prev);
      prev = now;
      if (marqueeVisible && marqueeW) {
        const v = lenis ? lenis.velocity : 0;
        if (v > 0.5) marqueeDir = -1;
        else if (v < -0.5) marqueeDir = 1;
        const speed = 0.045 + Math.min(Math.abs(v) * 0.02, 0.9);
        marqueeX += marqueeDir * speed * dt;
        if (marqueeX <= -marqueeW) marqueeX += marqueeW;
        if (marqueeX > 0) marqueeX -= marqueeW;
        marqueeTrack.style.transform = `translate3d(${marqueeX.toFixed(2)}px, 0, 0)`;
      }
      if (visibleParallax.size) updateParallax();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    let resizeT;
    window.addEventListener("resize", () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(buildMarquee, 200);
    });
  }

  /* =========================================================
     Grilla de productos
     ========================================================= */
  const grid = $("[data-grid]");
  const search = $("[data-search]");
  let filtro = "todos";
  let busqueda = "";

  function cardHTML(p, featured, i) {
    const [img1, img2] = p.imagenes;
    const meta = `
      <p class="card-meta">
        <span>${CATEGORIAS[p.categoria] || ""}</span>
        ${p.personalizable ? '<span class="tag">Personalizable</span>' : ""}
      </p>`;
    const media = `
      <button class="card-media" type="button" data-open="${p.id}" aria-label="Ver ${escapeHTML(p.nombre)}">
        <img src="${img1}" ${srcsetDe(img1, featured ? "(max-width: 640px) 100vw, 400px" : TAM_CARD)} alt="${escapeHTML(p.nombre)}" loading="lazy" decoding="async" width="900" height="1125">
        ${img2 && !featured ? `<img class="card-alt" src="${img2}" ${srcsetDe(img2, TAM_CARD)} alt="" loading="lazy" decoding="async" width="900" height="1125">` : ""}
        ${featured ? "" : '<span class="card-quick" aria-hidden="true"><svg class="ic ic-eye" aria-hidden="true"><use href="#i-eye"></use></svg> Ver producto</span>'}
      </button>`;

    if (featured) {
      return `
        <article class="card card--featured" data-reveal style="--i:${i}">
          ${media}
          <div class="card-feature-body">
            ${meta}
            <h3 class="card-title"><button type="button" data-open="${p.id}">${escapeHTML(p.nombre)}</button></h3>
            <p class="card-desc">${escapeHTML(p.descripcion)}</p>
            ${
              p.incluye
                ? `<ul class="card-includes" aria-label="Incluye">${p.incluye
                    .map((x) => `<li><svg class="ic ic-check" aria-hidden="true"><use href="#i-check"></use></svg>${escapeHTML(x)}</li>`)
                    .join("")}</ul>`
                : ""
            }
            <div class="card-feature-foot">
              <p class="card-price">${precio(p.precio)}</p>
              <button class="btn btn-primary" type="button" data-add="${p.id}">Agregar al carrito</button>
            </div>
          </div>
        </article>`;
    }

    return `
      <article class="card" data-reveal style="--i:${i}">
        ${media}
        <div class="card-body">
          ${meta}
          <h3 class="card-title"><button type="button" data-open="${p.id}">${escapeHTML(p.nombre)}</button></h3>
          <p class="card-price">${precio(p.precio)}</p>
          <button class="btn btn-primary btn-sm card-add" type="button" data-add="${p.id}" aria-label="Agregar ${escapeHTML(p.nombre)} al carrito">Agregar</button>
        </div>
      </article>`;
  }

  const filtrar = (q, cat = "todos") => {
    const nq = normalizar(q.trim());
    return PRODUCTOS.filter(
      (p) =>
        (cat === "todos" || p.categoria === cat) &&
        (!nq || normalizar(`${p.nombre} ${p.descripcion} ${CATEGORIAS[p.categoria]} ${(p.incluye || []).join(" ")}`).includes(nq))
    );
  };

  function renderGrid() {
    const q = busqueda.trim();
    const lista = filtrar(q, filtro);
    const conDestacado = filtro === "todos" && !q;

    if (!lista.length) {
      grid.innerHTML = `
        <div class="grid-empty">
          <svg class="ic ic-magnifying-glass" aria-hidden="true"><use href="#i-magnifying-glass"></use></svg>
          <p>No encontramos productos${q ? ` para “${escapeHTML(q)}”` : " en esta categoría"}.</p>
          <button class="btn btn-ghost btn-sm" type="button" data-reset>Ver todos los productos</button>
        </div>`;
      return;
    }
    grid.innerHTML = lista.map((p, i) => cardHTML(p, conDestacado && p.destacado, i)).join("");
    observeReveals(grid);
  }

  function setFiltro(valor) {
    filtro = valor;
    $$("[data-filter]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.filter === valor)));
    renderGrid();
    marcarActivo();
  }

  $$("[data-filter]").forEach((b) => b.addEventListener("click", () => setFiltro(b.dataset.filter)));
  search.addEventListener("input", () => {
    busqueda = search.value;
    renderGrid();
  });
  grid.addEventListener("click", (e) => {
    if (e.target.closest("[data-reset]")) {
      busqueda = "";
      search.value = "";
      setFiltro("todos");
    }
  });

  function irACategoria(cat) {
    busqueda = "";
    search.value = "";
    setFiltro(cat);
    const fromMenu = menuDialog.open;
    if (fromMenu) closeSheet(menuDialog);
    setTimeout(() => scrollToTarget($("#productos")), fromMenu ? 280 : 0);
  }

  /* =========================================================
     Hojas (dialog) con entrada y salida animadas
     ========================================================= */
  let sheetsAbiertas = 0;
  function openSheet(dlg) {
    if (dlg.open) return;
    dlg.showModal();
    sheetsAbiertas++;
    document.body.classList.add("has-sheet");
    document.documentElement.style.overflow = "hidden";
    lenis?.stop();
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add("is-open")));
  }
  function closeSheet(dlg) {
    if (!dlg.open || dlg.dataset.closing) return;
    dlg.dataset.closing = "1";
    dlg.classList.remove("is-open");
    setTimeout(
      () => {
        dlg.close();
        delete dlg.dataset.closing;
        sheetsAbiertas = Math.max(0, sheetsAbiertas - 1);
        if (!sheetsAbiertas) {
          document.body.classList.remove("has-sheet");
          document.documentElement.style.overflow = "";
          lenis?.start();
        }
      },
      motionOK ? 260 : 0
    );
  }
  $$(".sheet").forEach((dlg) => {
    dlg.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeSheet(dlg);
    });
    dlg.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closeSheet(dlg);
    });
  });

  /* Menú mobile */
  const menuDialog = $("[data-menu-dialog]");
  $("[data-menu-open]").addEventListener("click", () => openSheet(menuDialog));

  /* Buscador de la cabecera con resultados en vivo */
  const hsWrap = $("[data-hs]");
  const hsInput = $("[data-hs-input]");
  const hsResults = $("[data-hs-results]");
  let hsIndex = -1;

  function setHs(open) {
    hsResults.hidden = !open;
    hsInput.setAttribute("aria-expanded", String(open));
    if (!open) hsIndex = -1;
  }
  function renderHs() {
    const q = hsInput.value.trim();
    if (!q) return setHs(false);
    const lista = filtrar(q);
    hsIndex = -1;
    hsResults.innerHTML = lista.length
      ? lista
          .map(
            (p, i) => `
          <button class="search-result" type="button" role="option" id="hs-opt-${i}" aria-selected="false" data-open="${p.id}" style="--i:${i}">
            <img src="${chica(p.imagenes[0])}" alt="" width="56" height="70" decoding="async">
            <span><strong>${escapeHTML(p.nombre)}</strong><small>${CATEGORIAS[p.categoria]}</small></span>
            <span class="sr-price">${precio(p.precio)}</span>
          </button>`
          )
          .join("") +
        `<button class="hs-all" type="button" data-hs-all>Ver los ${lista.length} resultados en la tienda <svg class="ic ic-arrow-right" aria-hidden="true"><use href="#i-arrow-right"></use></svg></button>`
      : `<p class="search-empty">No encontramos nada para “${escapeHTML(q)}”. Probá con “mate”, “cuero” o “kit”.</p>`;
    setHs(true);
  }
  function verTodosLosResultados() {
    busqueda = hsInput.value;
    search.value = hsInput.value;
    setFiltro("todos");
    setHs(false);
    hsInput.blur();
    scrollToTarget($("#productos"));
  }
  hsInput.addEventListener("input", renderHs);
  hsInput.addEventListener("focus", () => hsInput.value.trim() && renderHs());
  hsInput.addEventListener("keydown", (e) => {
    const opts = $$('[role="option"]', hsResults);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!opts.length) return;
      e.preventDefault();
      hsIndex = (hsIndex + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute("aria-selected", String(i === hsIndex)));
      hsInput.setAttribute("aria-activedescendant", opts[hsIndex].id);
      opts[hsIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hsIndex >= 0 && opts[hsIndex]) opts[hsIndex].click();
      else if (hsInput.value.trim()) verTodosLosResultados();
    } else if (e.key === "Escape") {
      setHs(false);
    }
  });
  hsResults.addEventListener("click", (e) => {
    if (e.target.closest("[data-hs-all]")) verTodosLosResultados();
  });
  document.addEventListener("click", (e) => {
    if (!hsResults.hidden && !e.target.closest("[data-hs]")) setHs(false);
  });

  /* =========================================================
     Punto comprable del hero
     ========================================================= */
  const hotspot = $("[data-hotspot]");
  const hotspotCard = $("[data-hotspot-card]");
  const setHotspot = (open) => {
    hotspotCard.classList.toggle("is-open", open);
    hotspot.setAttribute("aria-expanded", String(open));
  };
  hotspot.addEventListener("click", (e) => {
    e.stopPropagation();
    setHotspot(!hotspotCard.classList.contains("is-open"));
  });
  document.addEventListener("click", (e) => {
    if (hotspotCard.classList.contains("is-open") && !e.target.closest("[data-hotspot-card], [data-hotspot]")) setHotspot(false);
  });

  /* =========================================================
     Ficha de producto
     ========================================================= */
  const productDialog = $("[data-product-dialog]");
  const pd = $("[data-pd]");

  function openProduct(id) {
    const p = byId(id);
    if (!p) return;
    const thumbs =
      p.imagenes.length > 1
        ? `<div class="pd-thumbs">${p.imagenes
            .map(
              (src, i) =>
                `<button type="button" data-thumb="${src}" aria-label="Ver foto ${i + 1}" aria-current="${i === 0}"><img src="${chica(src)}" alt=""></button>`
            )
            .join("")}</div>`
        : "";
    let i = 0;
    const n = () => `style="--i:${i++}"`;

    pd.innerHTML = `
      <div class="pd-gallery">
        <div class="pd-main"><img src="${p.imagenes[0]}" ${srcsetDe(p.imagenes[0], "(max-width: 760px) 100vw, 480px")} alt="${escapeHTML(p.nombre)}" width="900" height="1125"></div>
        ${thumbs}
      </div>
      <form class="pd-info" data-pd-form>
        <p class="pd-cat" ${n()}>${CATEGORIAS[p.categoria] || ""}</p>
        <h2 id="pd-title" ${n()}>${escapeHTML(p.nombre)}</h2>
        <p class="pd-price" ${n()}>${precio(p.precio)}</p>
        <p class="pd-desc" ${n()}>${escapeHTML(p.descripcion)}</p>
        ${
          p.incluye
            ? `<ul class="pd-includes" aria-label="Incluye" ${n()}>${p.incluye
                .map((x) => `<li><svg class="ic ic-check" aria-hidden="true"><use href="#i-check"></use></svg>${escapeHTML(x)}</li>`)
                .join("")}</ul>`
            : ""
        }
        ${
          p.personalizable
            ? `<div class="field" ${n()}>
                 <label for="pd-grabado">¿Qué te grabamos? <span class="field-help">(opcional)</span></label>
                 <textarea id="pd-grabado" name="grabado" maxlength="80" rows="2" placeholder="Ej: Martín 21/09/2026" aria-describedby="pd-grabado-help"></textarea>
                 <p class="field-help" id="pd-grabado-help">Nombre, fecha o frase. Si querés un diseño especial, lo charlamos por WhatsApp.</p>
               </div>`
            : ""
        }
        <div class="pd-buy" ${n()}>
          <div class="stepper" role="group" aria-label="Cantidad">
            <button type="button" data-qty="-1" aria-label="Restar uno" disabled><svg class="ic ic-minus" aria-hidden="true"><use href="#i-minus"></use></svg></button>
            <output data-qty-value aria-live="polite">1</output>
            <button type="button" data-qty="1" aria-label="Sumar uno"><svg class="ic ic-plus" aria-hidden="true"><use href="#i-plus"></use></svg></button>
          </div>
          <button class="btn btn-primary btn-lg" type="submit">Agregar al carrito</button>
        </div>
      </form>`;

    const form = $("[data-pd-form]", pd);
    let qty = 1;
    const out = $("[data-qty-value]", form);
    const menos = $('[data-qty="-1"]', form);

    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-qty]");
      if (!b) return;
      qty = Math.min(20, Math.max(1, qty + Number(b.dataset.qty)));
      out.textContent = qty;
      menos.disabled = qty <= 1;
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      addToCart(p.id, qty, (form.grabado?.value || "").trim());
      closeSheet(productDialog);
    });
    $$("[data-thumb]", pd).forEach((t) =>
      t.addEventListener("click", () => {
        const main = $(".pd-main img", pd);
        main.classList.add("is-swapping");
        setTimeout(() => {
          main.removeAttribute("srcset");
          main.src = t.dataset.thumb;
          main.classList.remove("is-swapping");
        }, motionOK ? 160 : 0);
        $$("[data-thumb]", pd).forEach((x) => x.setAttribute("aria-current", String(x === t)));
      })
    );

    openSheet(productDialog);
    productDialog.querySelector(".sheet-panel").scrollTop = 0;
  }

  /* =========================================================
     Carrito
     ========================================================= */
  let cart = store.get("tm-cart", []).filter((i) => byId(i.id) && i.qty > 0);
  const cliente = store.get("tm-cliente", { nombre: "", celular: "" });
  let pedidoEnviado = false;
  let ultimoLink = "";

  const cartDialog = $("[data-cart-dialog]");
  const cartBody = $("[data-cart-body]");
  const cartForm = $("[data-cart-form]");
  const cartTotal = $("[data-cart-total]");
  const cartCount = $("[data-cart-count]");
  const cartBtn = $(".cart-btn");
  const cartMini = $("[data-cart-mini]");

  const keyOf = (id, grabado) => `${id}|${grabado || ""}`;
  const total = () => cart.reduce((s, i) => s + byId(i.id).precio * i.qty, 0);
  const unidades = () => cart.reduce((s, i) => s + i.qty, 0);
  const guardar = () => store.set("tm-cart", cart);

  function addToCart(id, qty = 1, grabado = "", sourceBtn = null) {
    pedidoEnviado = false;
    const key = keyOf(id, grabado);
    const existente = cart.find((i) => keyOf(i.id, i.grabado) === key);
    if (existente) existente.qty = Math.min(20, existente.qty + qty);
    else cart.push({ id, qty, grabado });
    guardar();
    renderCart();
    bump();
    toast(`Agregaste ${byId(id).nombre}`);
    if (sourceBtn) {
      const original = sourceBtn.innerHTML;
      sourceBtn.classList.add("is-added");
      sourceBtn.innerHTML = '<svg class="ic ic-check" aria-hidden="true"><use href="#i-check"></use></svg> Agregado';
      setTimeout(() => {
        sourceBtn.classList.remove("is-added");
        sourceBtn.innerHTML = original;
      }, 1400);
    }
  }

  function bump() {
    if (!motionOK) return;
    cartCount.classList.remove("is-bump");
    void cartCount.offsetWidth;
    cartCount.classList.add("is-bump");
  }

  function renderCart() {
    const n = unidades();
    cartCount.textContent = n > 99 ? "99+" : n;
    cartCount.hidden = n === 0;
    cartMini.textContent = precio(total());
    cartBtn.setAttribute("aria-label", `Abrir carrito, ${n} ${n === 1 ? "producto" : "productos"}`);

    if (pedidoEnviado) {
      cartForm.hidden = true;
      cartBody.innerHTML = `
        <div class="cart-sent">
          <span class="empty-icon"><svg class="ic ic-whatsapp-logo" aria-hidden="true"><use href="#if-whatsapp-logo"></use></svg></span>
          <h3>¡Listo! Te abrimos WhatsApp</h3>
          <p>Si no se abrió, tocá el botón de abajo. Tu pedido sigue guardado acá.</p>
          <a class="btn btn-primary" href="${escapeHTML(ultimoLink)}" target="_blank" rel="noopener">Abrir WhatsApp</a>
          <button class="btn btn-ghost" type="button" data-clear>Vaciar carrito</button>
          <button class="ci-remove" type="button" data-edit>Volver al pedido</button>
        </div>`;
      return;
    }

    if (!cart.length) {
      cartForm.hidden = true;
      cartBody.innerHTML = `
        <div class="cart-empty">
          <span class="empty-icon"><svg class="ic ic-handbag" aria-hidden="true"><use href="#i-handbag"></use></svg></span>
          <h3>Tu carrito está vacío</h3>
          <p>Sumá un mate, un bolso o un kit y armamos tu pedido.</p>
          <button class="btn btn-primary" type="button" data-browse>Ver productos</button>
        </div>`;
      return;
    }

    cartForm.hidden = false;
    cartTotal.textContent = precio(total());
    cartBody.innerHTML = `<ul aria-label="Productos en el carrito">${cart
      .map((i, idx) => {
        const p = byId(i.id);
        return `
          <li class="cart-item">
            <img src="${chica(p.imagenes[0])}" alt="" width="72" height="90" decoding="async">
            <div class="ci-info">
              <p class="ci-name">${escapeHTML(p.nombre)}</p>
              ${i.grabado ? `<p class="ci-engrave">Grabado: “${escapeHTML(i.grabado)}”</p>` : ""}
              <p class="ci-unit">${precio(p.precio)} c/u</p>
              <button class="ci-remove" type="button" data-remove="${idx}">Quitar</button>
            </div>
            <div class="ci-side">
              <p class="ci-price">${precio(p.precio * i.qty)}</p>
              <div class="stepper" role="group" aria-label="Cantidad de ${escapeHTML(p.nombre)}">
                <button type="button" data-step="${idx}" data-delta="-1" aria-label="Restar uno" ${i.qty <= 1 ? "disabled" : ""}><svg class="ic ic-minus" aria-hidden="true"><use href="#i-minus"></use></svg></button>
                <output>${i.qty}</output>
                <button type="button" data-step="${idx}" data-delta="1" aria-label="Sumar uno" ${i.qty >= 20 ? "disabled" : ""}><svg class="ic ic-plus" aria-hidden="true"><use href="#i-plus"></use></svg></button>
              </div>
            </div>
          </li>`;
      })
      .join("")}</ul>`;
  }

  // Los cambios de cantidad no re-animan la lista
  function renderCartQuiet() {
    renderCart();
    $$(".cart-item", cartBody).forEach((li) => (li.style.animation = "none"));
  }

  cartBody.addEventListener("click", (e) => {
    const step = e.target.closest("[data-step]");
    const remove = e.target.closest("[data-remove]");
    if (step) {
      const item = cart[Number(step.dataset.step)];
      item.qty = Math.min(20, Math.max(1, item.qty + Number(step.dataset.delta)));
      guardar();
      renderCartQuiet();
      bump();
      const again = cartBody.querySelector(`[data-step="${step.dataset.step}"][data-delta="${step.dataset.delta}"]`);
      (again && !again.disabled ? again : cartBody.querySelector(`[data-step="${step.dataset.step}"]:not(:disabled)`))?.focus();
    } else if (remove) {
      cart.splice(Number(remove.dataset.remove), 1);
      guardar();
      renderCartQuiet();
      (cartBody.querySelector("[data-remove]") || cartBody.querySelector("button"))?.focus();
    } else if (e.target.closest("[data-browse]")) {
      closeSheet(cartDialog);
      setTimeout(() => scrollToTarget($("#productos")), 280);
    } else if (e.target.closest("[data-clear]")) {
      cart = [];
      pedidoEnviado = false;
      guardar();
      renderCart();
    } else if (e.target.closest("[data-edit]")) {
      pedidoEnviado = false;
      renderCart();
    }
  });

  /* Formulario y WhatsApp */
  const fNombre = cartForm.nombre;
  const fCelular = cartForm.celular;
  fNombre.value = cliente.nombre || "";
  fCelular.value = cliente.celular || "";

  function setError(input, msg) {
    const err = document.getElementById(input.getAttribute("aria-describedby"));
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    err.textContent = msg || "";
    err.hidden = !msg;
  }
  function validar() {
    const nombre = fNombre.value.trim();
    const digitos = fCelular.value.replace(/\D/g, "");
    let ok = true;
    if (nombre.length < 2) {
      setError(fNombre, "Escribí tu nombre para saber a quién le preparamos el pedido.");
      ok = false;
    } else setError(fNombre, "");
    if (digitos.length < 8 || digitos.length > 15) {
      setError(fCelular, "Revisá el celular: tiene que tener entre 8 y 15 números, con código de área.");
      ok = false;
    } else setError(fCelular, "");
    return ok;
  }
  [fNombre, fCelular].forEach((input) =>
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") validar();
    })
  );

  function armarMensaje(nombre, celular) {
    const lineas = ["¡Hola Tienda Mate! 🧉 Quiero hacer este pedido desde la web:", ""];
    cart.forEach((i) => {
      const p = byId(i.id);
      lineas.push(`• ${i.qty} x ${p.nombre}: ${precio(p.precio * i.qty)}`);
      if (i.grabado) lineas.push(`   Grabado: "${i.grabado}"`);
    });
    lineas.push("", `*Total: ${precio(total())}*`, "", `Nombre: ${nombre}`, `Celular: ${celular}`);
    return lineas.join("\n");
  }

  cartForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cart.length) return;
    if (!validar()) {
      cartForm.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const nombre = fNombre.value.trim();
    const celular = fCelular.value.trim();
    store.set("tm-cliente", { nombre, celular });
    ultimoLink = waLink(armarMensaje(nombre, celular));
    window.open(ultimoLink, "_blank", "noopener");
    pedidoEnviado = true;
    renderCart();
  });

  /* Toast */
  const toastEl = $("[data-toast]");
  const toastText = $("[data-toast-text]");
  let toastTimer;
  function toast(texto) {
    toastText.textContent = texto;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 3200);
  }
  toastEl.addEventListener("mouseenter", () => clearTimeout(toastTimer));
  toastEl.addEventListener("mouseleave", () => {
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 1600);
  });

  /* =========================================================
     Delegación global de acciones
     ========================================================= */
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    const open = e.target.closest("[data-open]");
    const cartOpen = e.target.closest("[data-cart-open]");
    const go = e.target.closest("[data-filter-go]");

    if (add) {
      addToCart(add.dataset.add, 1, "", add.classList.contains("btn") ? add : null);
      if (add.closest("[data-hotspot-card]")) setHotspot(false);
    } else if (open) {
      setHotspot(false);
      setHs(false);
      openProduct(open.dataset.open);
    } else if (go) {
      irACategoria(go.dataset.filterGo);
    } else if (cartOpen) {
      toastEl.classList.remove("is-visible");
      const abierto = [productDialog, menuDialog].find((d) => d.open);
      if (abierto) closeSheet(abierto);
      renderCart();
      setTimeout(() => openSheet(cartDialog), abierto ? 270 : 0);
    }
  });

  renderGrid();
  renderCart();
  observeReveals();
})();
