/* ==========================================================================
   ReConecta — by HeaLine
   main.js — script único, compartilhado por todas as páginas.

   Organizado em três "camadas" de responsividade, como pedido:
   A) CAMADA DE CLIQUE      -> menus, sidebar, dropdowns, modais, chips, alertas
   B) CAMADA DE DIGITAÇÃO   -> busca com autocomplete, filtros ao vivo, validação de formulário
   C) CAMADA DE TELA        -> matchMedia, resize, orientação, touch vs. mouse

   Nenhum dado é salvo em localStorage/sessionStorage: tudo vive em memória
   durante a sessão, então um reload volta ao estado inicial.
   ========================================================================== */
(function () {
  "use strict";

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function normalize(str) {
    return (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove acentos p/ busca
  }

  document.addEventListener("DOMContentLoaded", function () {
    initIcons();
    initHeaderScroll();
    initMobileDrawer();
    initSidebar();
    initUserMenu();
    initChipGroups();
    initFilterableList("pro-list");
    initFilterableList("leitos-list");
    initFilterableList("contratos-list");
    initHeroAutocomplete();
    initContactForm();
    initAddSectorPanel();
    initAlerts();
    initTopbarActions();
    initRevealOnScroll();
    initCountUp();
    initResponsiveManager();
    initPageCharts();
    prefillFromQueryString();
  });

  /* ------------------------------------------------------------------ *
   * Ícones (lucide) — carregado via CDN em todas as páginas
   * ------------------------------------------------------------------ */
  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE — header com sombra ao rolar (site público)
   * ------------------------------------------------------------------ */
  function initHeaderScroll() {
    var header = $(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE — menu mobile do site público (drawer)
   * ------------------------------------------------------------------ */
  function initMobileDrawer() {
    var toggle = $(".nav-toggle");
    var drawer = $(".mobile-drawer");
    var scrim = $(".scrim");
    if (!toggle || !drawer) return;

    function open() {
      drawer.classList.add("is-open");
      scrim && scrim.classList.add("is-visible");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("no-scroll");
    }
    function close() {
      drawer.classList.remove("is-open");
      scrim && scrim.classList.remove("is-visible");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    }
    toggle.addEventListener("click", function () {
      var isOpen = drawer.classList.contains("is-open");
      isOpen ? close() : open();
    });
    scrim && scrim.addEventListener("click", close);
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    // se o usuário aumentar a janela além do breakpoint mobile, fecha o drawer sozinho
    window.addEventListener("resize", debounce(function () {
      if (window.innerWidth > 960) close();
    }, 150));
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE + C) TELA — sidebar do painel (colapsar / off-canvas mobile)
   * ------------------------------------------------------------------ */
  function initSidebar() {
    var app = $(".app");
    var collapseBtn = $(".sidebar-collapse-btn");
    var mobileToggle = $(".sidebar-mobile-toggle");
    var scrim = $(".sidebar-scrim");
    if (!app) return;

    collapseBtn && collapseBtn.addEventListener("click", function () {
      app.classList.toggle("is-sidebar-collapsed");
      var collapsed = app.classList.contains("is-sidebar-collapsed");
      collapseBtn.setAttribute("aria-expanded", String(!collapsed));
      if (window.ReConectaCharts) window.ReConectaCharts.resizeAll();
    });

    function openMobile() {
      app.classList.add("is-sidebar-mobile-open");
      scrim && scrim.classList.add("is-visible");
      document.body.classList.add("no-scroll");
    }
    function closeMobile() {
      app.classList.remove("is-sidebar-mobile-open");
      scrim && scrim.classList.remove("is-visible");
      document.body.classList.remove("no-scroll");
    }
    mobileToggle && mobileToggle.addEventListener("click", function () {
      app.classList.contains("is-sidebar-mobile-open") ? closeMobile() : openMobile();
    });
    scrim && scrim.addEventListener("click", closeMobile);
    $$(".sidebar-nav a").forEach(function (a) { a.addEventListener("click", closeMobile); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMobile(); });

    window.addEventListener("resize", debounce(function () {
      if (window.innerWidth > 860) closeMobile();
    }, 150));
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE — dropdown do usuário (sidebar do painel)
   * ------------------------------------------------------------------ */
  function initUserMenu() {
    var trigger = $(".sidebar-user");
    var menu = $(".user-menu");
    if (!trigger || !menu) return;

    function close() {
      menu.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && e.target !== trigger) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE — grupos de chip genéricos (fora de listas filtráveis,
   * ex.: chips que só alternam estado visual)
   * ------------------------------------------------------------------ */
  function initChipGroups() {
    $$(".chip-group[data-standalone]").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        $$(".chip", group).forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * B) DIGITAÇÃO + A) CLIQUE — listas filtráveis (Profissionais, Leitos,
   * Contratos). Contrato de dados combinado nas páginas HTML:
   *   [data-filter-scope="X"]   -> caixa com os controles de filtro
   *   [data-filter-items="X"]   -> container que envolve os itens
   *   item filho com [data-search] + data-* correspondentes às chaves
   *   controles com [data-filter-key="chave"] (select) ou
   *   .chip-group[data-filter-key="chave"] com .chip[data-value="..."]
   *   [data-filter-count="X"] e [data-filter-empty="X"] (opcionais)
   * ------------------------------------------------------------------ */
  function initFilterableList(scope) {
    var bar = $('[data-filter-scope="' + scope + '"]');
    var list = $('[data-filter-items="' + scope + '"]');
    if (!bar || !list) return;

    var searchInput = $('[data-role="list-search"]', bar);
    var selectControls = $$('select[data-filter-key]', bar);
    var chipGroups = $$('.chip-group[data-filter-key]', bar);
    var items = $$('[data-search]', list);
    var countEl = document.querySelector('[data-filter-count="' + scope + '"]');
    var emptyEl = document.querySelector('[data-filter-empty="' + scope + '"]');

    function currentFilters() {
      var f = {};
      selectControls.forEach(function (c) { f[c.dataset.filterKey] = c.value; });
      chipGroups.forEach(function (g) {
        var active = $(".chip.is-active", g);
        f[g.dataset.filterKey] = active ? active.dataset.value : "all";
      });
      return f;
    }

    function applyFilters() {
      var f = currentFilters();
      var q = normalize(searchInput ? searchInput.value : "").trim();
      var visible = 0;

      items.forEach(function (item) {
        var haystack = normalize(item.dataset.search);
        var matchesSearch = !q || haystack.indexOf(q) !== -1;
        var matchesFilters = Object.keys(f).every(function (key) {
          var val = f[key];
          return !val || val === "all" || item.dataset[key] === val;
        });
        var show = matchesSearch && matchesFilters;
        item.hidden = !show;
        if (show) visible++;
      });

      if (countEl) {
        countEl.innerHTML = "Mostrando <strong>" + visible + "</strong> de <strong>" + items.length + "</strong>";
      }
      if (emptyEl) emptyEl.hidden = visible !== 0;
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilters); // <- camada "digitar"
    }
    selectControls.forEach(function (c) { c.addEventListener("change", applyFilters); });
    chipGroups.forEach(function (g) {
      g.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        $$(".chip", g).forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        applyFilters(); // <- camada "clique"
      });
    });

    applyFilters();
    bar._reconectaApplyFilters = applyFilters; // exposto p/ prefillFromQueryString
  }

  /* ------------------------------------------------------------------ *
   * B) DIGITAÇÃO — busca de especialidade com autocomplete no hero
   * ------------------------------------------------------------------ */
  var ESPECIALIDADES = [
    { nome: "Cardiologia", desc: "Coração e circulação" },
    { nome: "Pediatria", desc: "Crianças e adolescentes" },
    { nome: "Ginecologia e Obstetrícia", desc: "Saúde da mulher e gestação" },
    { nome: "Ortopedia", desc: "Ossos, músculos e articulações" },
    { nome: "Clínica Geral", desc: "Atendimento geral" },
    { nome: "Dermatologia", desc: "Pele, cabelo e unhas" },
    { nome: "Neurologia", desc: "Cérebro e sistema nervoso" },
    { nome: "Psiquiatria", desc: "Saúde mental" },
    { nome: "Endocrinologia", desc: "Hormônios e metabolismo" },
    { nome: "Oftalmologia", desc: "Olhos e visão" },
    { nome: "Cirurgia Geral", desc: "Procedimentos cirúrgicos" },
    { nome: "Anestesiologia", desc: "Anestesia e cuidados peri-operatórios" }
  ];

  function initHeroAutocomplete() {
    var form = $(".quick-search form");
    var input = $(".quick-search input");
    var list = $(".autocomplete");
    if (!form || !input || !list) return;

    var activeIndex = -1;
    var currentMatches = [];

    function render(matches) {
      currentMatches = matches;
      activeIndex = -1;
      if (!matches.length) {
        list.innerHTML = '<div class="no-match">Nenhuma especialidade encontrada. Você ainda pode buscar por texto livre.</div>';
        list.classList.add("is-open");
        return;
      }
      list.innerHTML = matches.map(function (m, i) {
        return '<button type="button" role="option" data-index="' + i + '">' + m.nome + " <span>" + m.desc + "</span></button>";
      }).join("");
      list.classList.add("is-open");
    }

    function close() { list.classList.remove("is-open"); activeIndex = -1; }

    input.addEventListener("input", function () { // <- camada "digitar"
      var q = normalize(input.value).trim();
      if (!q) { close(); return; }
      var matches = ESPECIALIDADES.filter(function (e) { return normalize(e.nome).indexOf(q) !== -1; }).slice(0, 6);
      render(matches);
    });

    input.addEventListener("keydown", function (e) {
      var options = $$(".autocomplete button");
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, options.length - 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); }
      else if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); options[activeIndex].click(); return; }
      else if (e.key === "Escape") { close(); return; }
      else return;
      options.forEach(function (o, i) { o.classList.toggle("is-active", i === activeIndex); });
    });

    list.addEventListener("click", function (e) { // <- camada "clique"
      var btn = e.target.closest("button[data-index]");
      if (!btn) return;
      var m = currentMatches[Number(btn.dataset.index)];
      input.value = m.nome;
      close();
      window.location.href = "profissionais.html?especialidade=" + encodeURIComponent(m.nome);
    });

    document.addEventListener("click", function (e) { if (!form.contains(e.target)) close(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      window.location.href = "profissionais.html" + (v ? "?especialidade=" + encodeURIComponent(v) : "");
    });
  }

  // Se a página abrir com ?especialidade=... (vindo do hero), pré-preenche o filtro
  function prefillFromQueryString() {
    var params = new URLSearchParams(window.location.search);
    var especialidade = params.get("especialidade");
    if (especialidade) {
      var searchInput = $('[data-filter-scope="pro-list"] [data-role="list-search"]');
      if (searchInput) {
        searchInput.value = especialidade;
        var bar = $('[data-filter-scope="pro-list"]');
        bar && bar._reconectaApplyFilters && bar._reconectaApplyFilters();
      }
    }
    var tipo = params.get("tipo");
    if (tipo === "cadastro") {
      var subjectSelect = $("#contato-assunto");
      if (subjectSelect) subjectSelect.value = "cadastro";
    }
  }

  /* ------------------------------------------------------------------ *
   * B) DIGITAÇÃO — formulário de contato: validação ao vivo + contador
   * ------------------------------------------------------------------ */
  function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;

    var successBox = $(".form-success", form.closest(".form-card") || form);

    function fieldWrap(input) { return input.closest(".field"); }

    function setError(input, message) {
      var wrap = fieldWrap(input);
      wrap.classList.add("has-error");
      wrap.classList.remove("is-valid");
      var msg = $(".error-msg", wrap);
      if (msg) msg.textContent = message;
    }
    function clearError(input) {
      var wrap = fieldWrap(input);
      wrap.classList.remove("has-error");
      if (input.value.trim()) wrap.classList.add("is-valid");
    }

    function validateField(input) {
      var value = input.value.trim();
      if (input.hasAttribute("required") && !value) {
        setError(input, "Esse campo é obrigatório.");
        return false;
      }
      if (input.type === "email" && value) {
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!emailOk) { setError(input, "Digite um e-mail válido."); return false; }
      }
      if (input.type === "tel" && value) {
        var digits = value.replace(/\D/g, "");
        if (digits.length < 10) { setError(input, "Inclua o DDD e o número completo."); return false; }
      }
      clearError(input);
      return true;
    }

    $$("input, select, textarea", form).forEach(function (input) {
      input.addEventListener("input", function () { validateField(input); }); // <- "digitar"
      input.addEventListener("blur", function () { validateField(input); });
    });

    // contador de caracteres da mensagem
    var message = $("#contato-mensagem", form);
    var counter = $("#contato-mensagem-counter", form);
    var MAX = 500;
    if (message && counter) {
      message.addEventListener("input", function () {
        var len = message.value.length;
        counter.textContent = len + " / " + MAX;
        counter.classList.toggle("is-near-limit", len > MAX * 0.85 && len <= MAX);
        counter.classList.toggle("is-over-limit", len > MAX);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = $$("input, select, textarea", form);
      var allValid = inputs.map(validateField).every(Boolean);
      if (message && message.value.length > MAX) allValid = false;

      if (!allValid) {
        var firstInvalid = $(".has-error input, .has-error select, .has-error textarea", form);
        firstInvalid && firstInvalid.focus();
        return;
      }
      successBox && successBox.classList.add("is-visible");
      form.reset();
      $$(".field", form).forEach(function (f) { f.classList.remove("is-valid", "has-error"); });
      if (counter) counter.textContent = "0 / " + MAX;
      showToast("Mensagem enviada. Nosso time responde em até 1 dia útil.");
    });
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE — painel de "Adicionar novo setor" (Gestão de setores)
   * ------------------------------------------------------------------ */
  function initAddSectorPanel() {
    var toggle = $(".add-sector-toggle");
    var panel = $(".add-sector-panel");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.querySelector(".toggle-label").textContent = isOpen ? "Fechar formulário" : "Adicionar novo setor";
    });

    var form = $("#add-sector-form");
    form && form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameInput = $("#setor-nome", form);
      showToast((nameInput && nameInput.value ? nameInput.value : "Setor") + " cadastrado (demonstração).");
      form.reset();
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.querySelector(".toggle-label").textContent = "Adicionar novo setor";
    });
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE — alertas inteligentes: dispensar cartão + contadores + chips
   * ------------------------------------------------------------------ */
  function initAlerts() {
    var list = $(".alert-list");
    if (!list) return;

    function updateCounters() {
      ["critical", "warning", "info"].forEach(function (level) {
        var count = $$('.alert-card--' + level + ':not(.is-dismissed)', list).length;
        var target = $('[data-alert-count="' + level + '"]');
        if (target) target.textContent = count;
      });
      var totalVisible = $$(".alert-card:not(.is-dismissed)", list).length;
      var empty = $(".alerts-empty");
      if (empty) empty.classList.toggle("is-visible", totalVisible === 0);
    }

    list.addEventListener("click", function (e) {
      var btn = e.target.closest(".alert-dismiss");
      if (!btn) return;
      var card = btn.closest(".alert-card");
      card.classList.add("is-dismissed");
      card.addEventListener("transitionend", function handler() {
        card.removeEventListener("transitionend", handler);
        updateCounters();
      });
      setTimeout(updateCounters, 320); // salvaguarda caso transitionend não dispare
    });

    var chipGroup = $(".chip-group[data-filter-key='severity']");
    if (chipGroup) {
      chipGroup.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        $$(".chip", chipGroup).forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        var value = chip.dataset.value;
        $$(".alert-card", list).forEach(function (card) {
          var show = value === "all" || card.classList.contains("alert-card--" + value);
          card.hidden = !show;
        });
      });
    }

    updateCounters();
  }

  /* ------------------------------------------------------------------ *
   * A) CLIQUE — ações da topbar (exportar relatório, atualizar)
   * ------------------------------------------------------------------ */
  function initTopbarActions() {
    $$("[data-action='export-report']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showToast("Relatório exportado (demonstração).");
      });
    });
    $$("[data-action='refresh-data']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var icon = btn.querySelector("svg");
        if (icon) {
          icon.style.transition = "transform .6s ease";
          icon.style.transform = "rotate(360deg)";
          setTimeout(function () { icon.style.transform = ""; }, 620);
        }
        showToast("Dados atualizados (demonstração).");
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Toast simples
   * ------------------------------------------------------------------ */
  function showToast(message) {
    var stack = $(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span></span>';
    toast.querySelector("span").textContent = message;
    stack.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add("is-visible"); });
    setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () { toast.remove(); }, 250);
    }, 3200);
  }
  window.ReConectaToast = showToast;

  /* ------------------------------------------------------------------ *
   * Revelar ao rolar + contagem numérica dos KPIs
   * ------------------------------------------------------------------ */
  function initRevealOnScroll() {
    var els = $$(".reveal");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initCountUp() {
    var els = $$("[data-count-to]");
    if (!els.length) return;
    function animate(el) {
      var to = parseFloat(el.dataset.countTo);
      var suffix = el.dataset.suffix || "";
      var prefix = el.dataset.prefix || "";
      var duration = 900;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(to * eased);
        el.textContent = prefix + value.toLocaleString("pt-BR") + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { els.forEach(animate); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ *
   * C) TELA — matchMedia, resize, orientação, touch
   * ------------------------------------------------------------------ */
  function initResponsiveManager() {
    var html = document.documentElement;
    var isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    html.classList.toggle("is-touch", isTouch);
    html.classList.toggle("is-pointer", !isTouch);

    var breakpoints = [
      { name: "mobile", query: "(max-width: 640px)" },
      { name: "tablet", query: "(min-width: 641px) and (max-width: 1024px)" },
      { name: "desktop", query: "(min-width: 1025px)" }
    ];

    function applyBreakpointClasses() {
      breakpoints.forEach(function (bp) {
        html.classList.toggle("device-" + bp.name, window.matchMedia(bp.query).matches);
      });
    }
    applyBreakpointClasses();

    breakpoints.forEach(function (bp) {
      var mq = window.matchMedia(bp.query);
      var handler = function () { applyBreakpointClasses(); };
      if (mq.addEventListener) mq.addEventListener("change", handler);
      else if (mq.addListener) mq.addListener(handler); // fallback navegadores antigos
    });

    html.classList.toggle("is-landscape", window.matchMedia("(orientation: landscape)").matches);
    window.addEventListener("orientationchange", function () {
      setTimeout(function () {
        html.classList.toggle("is-landscape", window.matchMedia("(orientation: landscape)").matches);
        if (window.ReConectaCharts) window.ReConectaCharts.resizeAll();
      }, 120);
    });

    window.addEventListener("resize", debounce(function () {
      if (window.ReConectaCharts) window.ReConectaCharts.resizeAll();
    }, 180));
  }

  /* ------------------------------------------------------------------ *
   * Gráficos por página (Chart.js) — só roda se a lib estiver carregada
   * e se existir <body data-page="..."> correspondente
   * ------------------------------------------------------------------ */
  function initPageCharts() {
    if (typeof window.Chart === "undefined") return;

    Chart.defaults.font.family = "Inter, sans-serif";
    Chart.defaults.color = "#64748b";
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;

    var registry = [];
    function track(chart) { registry.push(chart); return chart; }

    var palette = {
      blue: "#2563eb", blueSoft: "rgba(37,99,235,.12)",
      teal: "#0d9488", tealSoft: "rgba(13,148,136,.14)",
      amber: "#d97706", amberSoft: "rgba(217,119,6,.14)",
      red: "#c81e3a", redSoft: "rgba(200,30,58,.12)",
      grid: "#eef2f7"
    };

    function baseLine(ctx, labels, datasets) {
      return track(new Chart(ctx, {
        type: "line",
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: { legend: { display: datasets.length > 1, position: "bottom" } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: palette.grid }, ticks: { callback: function (v) { return v; } } }
          }
        }
      }));
    }

    function baseBar(ctx, labels, datasets, horizontal) {
      return track(new Chart(ctx, {
        type: "bar",
        data: { labels: labels, datasets: datasets },
        options: {
          indexAxis: horizontal ? "y" : "x",
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: datasets.length > 1, position: "bottom" } },
          scales: {
            x: { grid: { display: horizontal }, stacked: false },
            y: { grid: { display: !horizontal, color: palette.grid } }
          }
        }
      }));
    }

    function baseDoughnut(ctx, labels, data, colors) {
      return track(new Chart(ctx, {
        type: "doughnut",
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: "#fff" }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: "68%",
          plugins: { legend: { display: false } }
        }
      }));
    }

    var page = document.body.dataset.page;

    if (page === "operacao") {
      var elA = $("#chartAtendimentosHora");
      if (elA) baseBar(elA, ["7h","8h","9h","10h","11h","12h","13h","14h","15h","16h","17h","18h","19h","20h"],
        [{ data: [22,34,41,38,45,52,49,44,39,47,55,50,36,24], backgroundColor: palette.blue, borderRadius: 6, maxBarThickness: 22 }]);

      var elB = $("#chartDistribuicaoEspecialidade");
      if (elB) baseDoughnut(elB, ["Emergência","Clínica médica","Cirurgia","Pediatria","Ortopedia"], [32,24,18,15,11],
        [palette.red, palette.blue, palette.teal, palette.amber, "#7c3aed"]);
    }

    if (page === "financeiro") {
      var elC = $("#chartComposicaoCustos");
      if (elC) baseDoughnut(elC, ["Equipe assistencial","Materiais e insumos","Medicamentos","Estrutura e manutenção","Outros"], [38,27,19,11,5],
        [palette.blue, palette.teal, palette.amber, "#7c3aed", "#94a3b8"]);

      var elD = $("#chartMargem30");
      if (elD) baseLine(elD, Array.from({length:30}, function(_,i){ return "D" + (i+1); }),
        [{ label: "Margem (%)", data: [21,22,23,21,24,25,23,26,27,25,24,26,28,27,26,25,27,29,28,27,26,28,30,29,27,26,28,29,26,26],
           borderColor: palette.teal, backgroundColor: palette.tealSoft, fill: true, tension: .35, pointRadius: 0 }]);
    }

    if (page === "executivo") {
      var elE = $("#chartMargemMensal");
      if (elE) baseBar(elE, ["Fev","Mar","Abr","Mai","Jun","Jul"],
        [{ data: [21,22,24,23,25,26], backgroundColor: palette.blue, borderRadius: 6, maxBarThickness: 34 }]);

      var elF = $("#chartRentabilidadeSetor");
      if (elF) baseBar(elF, ["UTI","Emergência","Centro cirúrgico","Clínica médica","Pediatria","Ortopedia"],
        [{ data: [-8,-4,18,22,15,11], backgroundColor: function(context){
            var v = context.raw; return v < 0 ? palette.red : palette.teal;
          }, borderRadius: 6 }], true);

      var elG = $("#chartReceitaCusto");
      if (elG) baseLine(elG, Array.from({length:30}, function(_,i){ return "D" + (i+1); }),
        [
          { label: "Receita", data: [140,142,150,148,155,160,158,162,165,163,168,170,166,172,175,173,178,182,180,178,183,186,184,182,187,190,188,186,191,193],
            borderColor: palette.teal, backgroundColor: "transparent", tension: .35, pointRadius: 0 },
          { label: "Custo", data: [110,112,115,113,118,120,119,122,124,123,126,128,125,129,131,130,133,136,134,133,137,139,138,136,140,142,141,139,143,145],
            borderColor: palette.red, backgroundColor: "transparent", tension: .35, pointRadius: 0 }
        ]);
    }

    if (page === "predicao") {
      var elH = $("#chartProjecaoMargem");
      if (elH) baseLine(elH, ["Hoje","+1","+2","+3","+4","+5","+6","+7"],
        [{ label: "Margem projetada (%)", data: [26,25,24,23,24,22,21,20],
           borderColor: palette.teal, backgroundColor: palette.tealSoft, fill: true, tension: .35, pointRadius: 3 }]);
    }

    window.ReConectaCharts = {
      resizeAll: function () { registry.forEach(function (c) { c.resize(); }); }
    };
  }
})();