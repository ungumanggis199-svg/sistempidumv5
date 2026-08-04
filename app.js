/*
 * SIAP PIDUM Kejaksaan Negeri Muna
 * Frontend statis untuk Vercel + backend Google Apps Script.
 */
(() => {
  "use strict";

  const CONFIG = window.APP_CONFIG;
  const ADMIN_FORM_SCHEMAS = window.SIAP_ADMIN_FORM_SCHEMAS || {};
  const STORAGE_KEY = "siap_pidum_session_v1";

  const STATUS = Object.freeze({
    SPDP_DITERIMA: { label: "SPDP Diterima", tone: "blue" },
    VERIFIKASI_SPDP: { label: "Verifikasi SPDP", tone: "amber" },
    P16_DITERBITKAN: { label: "P-16 Diterbitkan", tone: "blue" },
    KOORDINASI: { label: "Koordinasi", tone: "amber" },
    MENUNGGU_BERKAS_TAHAP_I: { label: "Menunggu Berkas Tahap I", tone: "amber" },
    BERKAS_TAHAP_I_DITERIMA: { label: "Berkas Tahap I Diterima", tone: "blue" },
    PENELITIAN_BERKAS: { label: "Penelitian Berkas", tone: "blue" },
    P19_PENGEMBALIAN_BERKAS: { label: "P-19 / Berkas Dikembalikan", tone: "red" },
    PENYIDIKAN_TAMBAHAN: { label: "Penyidikan Tambahan", tone: "amber" },
    P21_LENGKAP: { label: "P-21 / Lengkap", tone: "green" },
    MENUNGGU_TAHAP_II: { label: "Menunggu Tahap II", tone: "amber" },
    TAHAP_II: { label: "Tahap II", tone: "green" },
    PENUNTUTAN: { label: "Penuntutan", tone: "blue" },
    DILIMPAHKAN_KE_PN: { label: "Dilimpahkan ke PN", tone: "green" },
    SIDANG: { label: "Persidangan", tone: "blue" },
    SELESAI: { label: "Selesai", tone: "green" },
    SPDP_DIKEMBALIKAN: { label: "SPDP Dikembalikan", tone: "red" },
    DIHENTIKAN: { label: "Dihentikan", tone: "gray" }
  });

  const DASHBOARD_STAGES = Object.freeze([
    { label: "SPDP masuk", statuses: ["SPDP_DITERIMA", "VERIFIKASI_SPDP"] },
    { label: "P-16 terbit", statuses: ["P16_DITERBITKAN", "KOORDINASI", "MENUNGGU_BERKAS_TAHAP_I"] },
    { label: "Tahap I", statuses: ["BERKAS_TAHAP_I_DITERIMA"] },
    { label: "Pra-tuntutan", statuses: ["PENELITIAN_BERKAS", "P19_PENGEMBALIAN_BERKAS", "PENYIDIKAN_TAMBAHAN"] },
    { label: "P-21 lengkap", statuses: ["P21_LENGKAP", "MENUNGGU_TAHAP_II"] },
    { label: "Tahap II", statuses: ["TAHAP_II"] },
    { label: "Susun dakwaan", statuses: ["PENUNTUTAN"] },
    { label: "Ke pengadilan", statuses: ["DILIMPAHKAN_KE_PN", "SIDANG", "SELESAI"] }
  ]);

  const WORKFLOW_STAGES = [
    { code: "P-1A", title: "Penerimaan dan verifikasi SPDP", detail: "Catat penerimaan SPDP, Sprindik, kesetaraan instansi, dan selisih waktu penyampaian." },
    { code: "P-16", title: "Penunjukan Penuntut Umum", detail: "Pimpinan menunjuk tim Penuntut Umum untuk mengikuti perkembangan penyidikan." },
    { code: "3 hari", title: "Koordinasi awal", detail: "Penyidik dan Penuntut Umum berkoordinasi paling lama tiga hari sejak SPDP diterima." },
    { code: "30 hari", title: "Pemantauan berkas Tahap I", detail: "Apabila berkas belum dikirim, sistem menandai pengingat perkembangan penyidikan secara bertahap." },
    { code: "P-1B", title: "Penerimaan berkas Tahap I", detail: "Berkas diterima dan penelitian dilanjutkan menggunakan check list hasil penyidikan." },
    { code: "P-24", title: "Nota pendapat hasil penelitian", detail: "Jaksa menilai kelengkapan formil dan materil serta menentukan sikap terhadap hasil penyidikan." },
    { code: "P-19", title: "Berkas belum lengkap", detail: "Petunjuk dilampirkan pada pengembalian berkas; penyidikan tambahan dipantau selama 14 hari." },
    { code: "P-21", title: "Berkas lengkap", detail: "Penyidik diminta menyerahkan tersangka dan barang bukti dalam jangka waktu 14 hari." },
    { code: "Tahap II", title: "Tersangka dan barang bukti", detail: "Pemeriksaan tersangka, audit fisik barang bukti, bantuan hukum, dan nota pendapat penerimaan." },
    { code: "P-29", title: "Surat dakwaan", detail: "Rencana dakwaan disempurnakan untuk pelimpahan perkara ke Pengadilan Negeri." },
    { code: "PN", title: "Pelimpahan dan persidangan", detail: "Catat nomor perkara, jadwal sidang, agenda, saksi, tuntutan, putusan, dan tindak lanjut." }
  ];

  const ADMINISTRATION_STAGES = Object.freeze([
    {
      code: "P-1A",
      title: "Penerimaan dan verifikasi SPDP",
      detail: "Mencatat penerimaan SPDP dan hasil verifikasi awal.",
      status: "VERIFIKASI_SPDP",
      prerequisites: []
    },
    {
      code: "P-16",
      title: "Penunjukan Penuntut Umum",
      detail: "Mencatat surat perintah penunjukan Penuntut Umum.",
      status: "P16_DITERBITKAN",
      prerequisites: ["P-1A"]
    },
    {
      code: "P-1B",
      title: "Penerimaan berkas Tahap I",
      detail: "Mencatat tanda terima berkas perkara hasil penyidikan.",
      status: "BERKAS_TAHAP_I_DITERIMA",
      prerequisites: ["P-16"]
    },
    {
      code: "P-24",
      title: "Nota pendapat hasil penelitian",
      detail: "Mencatat hasil penelitian formil dan materil berkas perkara.",
      status: "PENELITIAN_BERKAS",
      prerequisites: ["P-1B"]
    },
    {
      code: "P-19",
      title: "Berkas belum lengkap",
      detail: "Mencatat petunjuk yang harus dilengkapi oleh penyidik.",
      status: "P19_PENGEMBALIAN_BERKAS",
      prerequisites: ["P-24"]
    },
    {
      code: "P-21",
      title: "Berkas lengkap",
      detail: "Mencatat pemberitahuan bahwa hasil penyidikan sudah lengkap.",
      status: "P21_LENGKAP",
      prerequisites: ["P-24"]
    },
    {
      code: "P-29",
      title: "Surat dakwaan",
      detail: "Mencatat surat dakwaan setelah berkas dinyatakan lengkap.",
      status: "PENUNTUTAN",
      prerequisites: ["P-21"]
    }
  ]);

  const REMINDER_ADMIN_TYPES = Object.freeze([
    { code: "P-16", label: "P-16 — Penunjukan Penuntut Umum", defaultDays: 7, base: "received" },
    { code: "P-18", label: "P-18 — Pengantar pengembalian berkas", defaultDays: null, base: "received" },
    { code: "P-19", label: "P-19 — Petunjuk berkas belum lengkap", defaultDays: 7, base: "received" },
    { code: "P-21", label: "P-21 — Berkas lengkap", defaultDays: 7, base: "received" },
    { code: "P-29", label: "P-29 — Surat dakwaan", defaultDays: null, base: "received" },
    { code: "T-6", label: "T-6 — Pengeluaran tahanan", defaultDays: 0, base: "detention" },
    { code: "T-7", label: "T-7 — Perpanjangan penahanan", defaultDays: 0, base: "detention" }
  ]);

  const REMINDER_PROGRESS_STAGES = Object.freeze([
    { code: "P-16", label: "Penunjukan Penuntut Umum" },
    { code: "P-18", label: "Pengantar pengembalian berkas" },
    { code: "P-19", label: "Petunjuk berkas belum lengkap" },
    { code: "P-21", label: "Pemberitahuan berkas lengkap" },
    { code: "P-29", label: "Surat dakwaan" },
    { code: "T-6", label: "Pengeluaran tahanan" },
    { code: "T-7", label: "Perpanjangan penahanan" }
  ]);

  const state = {
    session: null,
    cases: [],
    activePage: "dashboard",
    selectedFile: null,
    selectedAdministrationFile: null,
    connected: false,
    search: "",
    statusFilter: "ALL",
    deadlineFilter: "ALL",
    stageFilter: "ALL",
    administrationBuilder: { caseId: "", type: "" },
    reminders: [],
    prosecutors: [],
    reminderMeta: { fonnteConfigured: false, triggerInstalled: false, triggerHour: 8, timezone: "Asia/Makassar" },
    remindersLoaded: false,
    reminderBuilder: { caseId: "", type: "P-16", reminderId: "" },
    reminderFilter: "ALL"
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindGlobalEvents();
    setCurrentDate();
    restoreSession();
  }

  function cacheElements() {
    els.loginView = document.getElementById("login-view");
    els.appView = document.getElementById("app-view");
    els.loginForm = document.getElementById("login-form");
    els.loginSubmit = document.getElementById("login-submit");
    els.togglePassword = document.getElementById("toggle-password");
    els.loginPassword = document.getElementById("login-password");
    els.sidebar = document.getElementById("sidebar");
    els.sidebarMenu = document.getElementById("sidebar-menu");
    els.sidebarName = document.getElementById("sidebar-user-name");
    els.sidebarRole = document.getElementById("sidebar-user-role");
    els.sidebarAvatar = document.getElementById("sidebar-avatar");
    els.logoutButton = document.getElementById("logout-button");
    els.pageTitle = document.getElementById("page-title");
    els.pageEyebrow = document.getElementById("page-eyebrow");
    els.pageContent = document.getElementById("page-content");
    els.currentDate = document.getElementById("current-date");
    els.connectionIndicator = document.getElementById("connection-indicator");
    els.mobileMenuButton = document.getElementById("mobile-menu-button");
    els.topbarName = document.getElementById("topbar-user-name");
    els.topbarRole = document.getElementById("topbar-user-role");
    els.topbarAvatar = document.getElementById("topbar-avatar");
    els.toastRoot = document.getElementById("toast-root");
    els.modalRoot = document.getElementById("modal-root");
  }

  function bindGlobalEvents() {
    document.querySelectorAll('input[name="role"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        document.querySelectorAll(".role-option").forEach((item) => item.classList.remove("active"));
        radio.closest(".role-option").classList.add("active");
      });
    });

    els.togglePassword.addEventListener("click", () => {
      const isPassword = els.loginPassword.type === "password";
      els.loginPassword.type = isPassword ? "text" : "password";
      els.togglePassword.setAttribute("aria-label", isPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    });

    els.loginForm.addEventListener("submit", handleLogin);
    els.logoutButton.addEventListener("click", logout);
    els.mobileMenuButton.addEventListener("click", () => els.sidebar.classList.toggle("open"));

    document.addEventListener("click", (event) => {
      if (window.innerWidth <= 920 && els.sidebar.classList.contains("open")) {
        const clickedInsideSidebar = els.sidebar.contains(event.target);
        const clickedMenuButton = els.mobileMenuButton.contains(event.target);
        if (!clickedInsideSidebar && !clickedMenuButton) els.sidebar.classList.remove("open");
      }
    });
  }

  async function restoreSession() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      showLogin();
      checkConnection();
      return;
    }

    try {
      state.session = JSON.parse(raw);
      if (!state.session?.token || !state.session?.user) throw new Error("Sesi tidak lengkap");
      const result = await gasRequest("me", {}, { silent: true });
      state.session.user = result.user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.session));
      await enterApp();
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      state.session = null;
      showLogin();
      checkConnection();
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const form = new FormData(els.loginForm);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const role = String(form.get("role") || "");

    if (!username || !password || !role) {
      toast("warning", "Data belum lengkap", "Masukkan peran, nama pengguna, dan kata sandi.");
      return;
    }

    setButtonLoading(els.loginSubmit, true);
    try {
      const result = await gasRequest("login", { username, password, role });
      state.session = { token: result.token, user: result.user };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.session));
      els.loginForm.reset();
      document.querySelector('input[name="role"][value="jaksa"]').checked = true;
      document.querySelectorAll(".role-option").forEach((item) => item.classList.toggle("active", item.dataset.roleCard === "jaksa"));
      await enterApp();
      toast("success", "Berhasil masuk", `Selamat datang, ${result.user.fullName}.`);
    } catch (error) {
      toast("error", "Gagal masuk", error.message || "Nama pengguna atau kata sandi tidak sesuai.");
    } finally {
      setButtonLoading(els.loginSubmit, false);
    }
  }

  async function enterApp() {
    els.loginView.hidden = true;
    els.appView.hidden = false;
    hydrateUserPanel();
    renderSidebar();
    setConnection(true);

    if (state.session.user.role === "jaksa") {
      state.activePage = "dashboard";
      await loadCases();
    } else {
      state.activePage = "submit-spdp";
      renderActivePage();
    }
  }

  function showLogin() {
    els.appView.hidden = true;
    els.loginView.hidden = false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    state.session = null;
    state.cases = [];
    state.selectedFile = null;
    state.selectedAdministrationFile = null;
    state.reminders = [];
    state.prosecutors = [];
    state.remindersLoaded = false;
    state.reminderBuilder = { caseId: "", type: "P-16", reminderId: "" };
    els.modalRoot.innerHTML = "";
    showLogin();
    toast("info", "Sesi diakhiri", "Anda telah keluar dari aplikasi.");
  }

  function hydrateUserPanel() {
    const user = state.session.user;
    const displayName = user.fullName || user.username;
    const avatarText = initials(displayName);
    els.sidebarName.textContent = displayName;
    els.sidebarRole.textContent = user.role;
    els.sidebarAvatar.textContent = avatarText;
    if (els.topbarName) els.topbarName.textContent = displayName;
    if (els.topbarRole) els.topbarRole.textContent = user.role === "jaksa" ? "Jaksa / Administrator" : "Penyidik";
    if (els.topbarAvatar) els.topbarAvatar.textContent = avatarText;
  }

  function renderSidebar() {
    const isJaksa = state.session.user.role === "jaksa";
    const urgentCount = isJaksa ? state.cases.filter((item) => ["warning", "overdue"].includes(getDeadlineState(item).state)).length : 0;
    const reminderUrgentCount = isJaksa ? state.reminders.filter((item) => {
      const deadline = getReminderDeadlineState(item);
      return String(item.status || "ACTIVE") === "ACTIVE" && ["warning", "overdue"].includes(deadline.state);
    }).length : 0;

    const items = isJaksa
      ? [
          { section: "UTAMA" },
          { id: "dashboard", icon: "▦", label: "Dashboard" },
          { id: "cases", icon: "▤", label: "Daftar Perkara" },
          { id: "deadlines", icon: "◷", label: "Tenggat Waktu", badge: urgentCount || "" },
          { section: "ADMINISTRASI" },
          { id: "reminders", icon: "♢", label: "Reminder WhatsApp", badge: reminderUrgentCount || "" },
          { id: "administration-builder", icon: "▣", label: "Buat Administrasi" },
          { id: "documents", icon: "▧", label: "Dokumen SPDP" },
          { id: "investigators", icon: "♙", label: "Penyidik" },
          { id: "workflow", icon: "↳", label: "Alur Perkara" },
          { id: "settings", icon: "⚙", label: "Pengaturan" }
        ]
      : [
          { section: "PENGIRIMAN" },
          { id: "submit-spdp", icon: "＋", label: "Form SPDP" }
        ];

    els.sidebarMenu.innerHTML = items.map((item) => {
      if (item.section) return `<div class="sidebar-section-label">${escapeHtml(item.section)}</div>`;
      return `
        <button type="button" class="sidebar-item ${state.activePage === item.id ? "active" : ""}" data-page="${item.id}">
          <span class="sidebar-item-icon">${item.icon}</span>
          <span>${escapeHtml(item.label)}</span>
          ${item.badge !== undefined && item.badge !== "" ? `<span class="sidebar-badge">${item.badge}</span>` : ""}
        </button>`;
    }).join("");

    els.sidebarMenu.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activePage = button.dataset.page;
        renderSidebar();
        renderActivePage();
        els.sidebar.classList.remove("open");
      });
    });
  }

  async function loadCases({ quiet = false } = {}) {
    if (!quiet) renderLoadingPage("Memuat data perkara");
    try {
      const result = await gasRequest("listCases");
      state.cases = Array.isArray(result.cases) ? result.cases : [];
      setConnection(true);
      renderSidebar();
      renderActivePage();
    } catch (error) {
      setConnection(false);
      renderErrorPage("Data perkara tidak dapat dimuat", error.message);
    }
  }

  function renderActivePage() {
    const page = state.activePage;
    const pages = {
      dashboard: ["Dashboard", "RINGKASAN", renderDashboard],
      cases: ["Daftar Perkara", "PENGELOLAAN", renderCasesPage],
      deadlines: ["Tenggat Waktu", "PENGAWASAN", renderDeadlinesPage],
      documents: ["Dokumen SPDP", "ARSIP DIGITAL", renderDocumentsPage],
      investigators: ["Data Penyidik", "MITRA KERJA", renderInvestigatorsPage],
      workflow: ["Alur Administrasi", "PEDOMAN KERJA", renderWorkflowPage],
      reminders: ["Reminder WhatsApp", "PENGAWASAN ADMINISTRASI", renderRemindersPage],
      "administration-builder": ["Buat Administrasi", "FORM OTOMATIS", renderAdministrationBuilderPage],
      settings: ["Pengaturan", "KONFIGURASI", renderSettingsPage],
      "submit-spdp": ["Pengiriman SPDP", "FORM PENYIDIK", renderInvestigatorForm]
    };

    const current = pages[page] || pages.dashboard;
    els.pageTitle.textContent = current[0];
    els.pageEyebrow.textContent = current[1];
    current[2]();
  }

  function renderLoadingPage(label) {
    els.pageTitle.textContent = label;
    els.pageContent.innerHTML = `
      <div class="panel loading-panel">
        <div class="skeleton loading-line w40"></div>
        <div class="skeleton loading-line w90"></div>
        <div class="skeleton loading-line w65"></div>
        <div class="skeleton" style="height:130px"></div>
      </div>`;
  }

  function renderErrorPage(title, message) {
    els.pageContent.innerHTML = `
      <div class="panel">
        <div class="empty-state">
          <div class="empty-state-icon">!</div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(message || "Terjadi kesalahan.")}</p>
          <button id="retry-load" class="primary-button" style="margin-top:18px" type="button">Coba lagi</button>
        </div>
      </div>`;
    document.getElementById("retry-load")?.addEventListener("click", () => loadCases());
  }

  function renderDashboard() {
    renderPidumDashboard({ showKpi: true, page: "dashboard" });
  }

  function renderCasesPage() {
    renderPidumDashboard({ showKpi: false, page: "cases" });
  }

  function renderPidumDashboard({ showKpi = true, page = "dashboard" } = {}) {
    const filtered = filterDashboardCases(state.cases);
    const activeCases = state.cases.filter((item) => !["SELESAI", "DIHENTIKAN", "SPDP_DIKEMBALIKAN"].includes(item.status));
    const overdue = state.cases.filter((item) => getDeadlineState(item).state === "overdue").length;
    const dueSoon = state.cases.filter((item) => getDeadlineState(item).state === "warning").length;
    const tahapIPlus = state.cases.filter((item) => dashboardStageIndex(item.status) >= 2).length;

    els.pageContent.innerHTML = `
      <section class="pidum-dashboard-reference">
        ${showKpi ? `
          <div class="pidum-kpi-grid">
            ${renderPidumKpiCard("clipboard", "Perkara aktif", activeCases.length, "berjalan saat ini")}
            ${renderPidumKpiCard("alert", "Lewat tenggat", overdue, "perlu tindakan segera")}
            ${renderPidumKpiCard("clock", "Jatuh tempo ≤3 hari", dueSoon, "pantau minggu ini")}
            ${renderPidumKpiCard("gavel", "Tahap I ke atas", tahapIPlus, "sudah masuk proses pemberkasan")}
          </div>` : ""}

        <div class="pidum-dashboard-toolbar">
          <label class="pidum-dashboard-search" for="dashboard-case-search">
            ${dashboardIcon("search")}
            <input id="dashboard-case-search" type="search" autocomplete="off" value="${escapeAttr(state.search)}" placeholder="Cari nomor register atau nama tersangka" />
          </label>

          <select id="dashboard-stage-filter" class="pidum-dashboard-select" aria-label="Filter tahapan perkara">
            <option value="ALL" ${state.stageFilter === "ALL" ? "selected" : ""}>Semua tahap</option>
            ${DASHBOARD_STAGES.map((stage, index) => `<option value="${index}" ${String(state.stageFilter) === String(index) ? "selected" : ""}>${escapeHtml(stage.label)}</option>`).join("")}
          </select>

          <button id="dashboard-create-administration" class="pidum-dashboard-primary" type="button">
            ${dashboardIcon("plus")}
            Buat administrasi
          </button>

          <button id="dashboard-refresh" class="pidum-dashboard-refresh" type="button" aria-label="Segarkan data" title="Segarkan data">
            ${dashboardIcon("refresh")}
          </button>
        </div>

        <div class="pidum-case-list-card">
          <div class="pidum-case-list-summary">
            <div>
              <h2>Daftar perkara</h2>
              <p>${filtered.length} dari ${state.cases.length} perkara ditampilkan.</p>
            </div>
            <span class="pidum-case-list-updated">Data terhubung ke Google Spreadsheet</span>
          </div>
          ${renderDashboardCaseList(filtered)}
        </div>

        <div class="pidum-dashboard-footnote">
          ${dashboardIcon("file")}
          <span>Status, tahapan, dan tenggat diperbarui dari administrasi perkara yang tersimpan.</span>
        </div>
      </section>`;

    const rerender = () => page === "cases" ? renderCasesPage() : renderDashboard();
    document.getElementById("dashboard-case-search")?.addEventListener("input", debounce((event) => {
      state.search = event.target.value;
      rerender();
    }, 180));
    document.getElementById("dashboard-stage-filter")?.addEventListener("change", (event) => {
      state.stageFilter = event.target.value;
      rerender();
    });
    document.getElementById("dashboard-create-administration")?.addEventListener("click", () => navigate("administration-builder"));
    document.getElementById("dashboard-refresh")?.addEventListener("click", () => loadCases());
    bindCaseTableActions();
  }

  function filterDashboardCases(cases) {
    const query = state.search.trim().toLowerCase();
    return [...cases]
      .filter((item) => {
        const haystack = [
          item.caseId,
          item.suspectName,
          item.allegedArticle,
          item.spdpNumber,
          item.investigatorName,
          item.investigatorInstitution,
          item.prosecutorName
        ].join(" ").toLowerCase();
        const matchesQuery = !query || haystack.includes(query);
        const matchesStage = state.stageFilter === "ALL" || String(dashboardStageIndex(item.status)) === String(state.stageFilter);
        return matchesQuery && matchesStage;
      })
      .sort(sortByUpdatedDesc);
  }

  function dashboardStageIndex(status) {
    const index = DASHBOARD_STAGES.findIndex((stage) => stage.statuses.includes(String(status || "")));
    return index < 0 ? 0 : index;
  }

  function renderDashboardStagePips(status) {
    const current = dashboardStageIndex(status);
    return `
      <div class="pidum-stage-pips" aria-label="Tahap: ${escapeAttr(DASHBOARD_STAGES[current].label)}">
        ${DASHBOARD_STAGES.map((stage, index) => `<span title="${escapeAttr(stage.label)}" class="${index <= current ? "complete" : ""} ${index === current ? "current" : ""}"></span>`).join("")}
      </div>
      <span class="pidum-stage-label">${escapeHtml(DASHBOARD_STAGES[current].label)}</span>`;
  }

  function renderDashboardCaseList(cases) {
    if (!cases.length) {
      return `<div class="pidum-case-empty">${dashboardIcon("file")}<strong>Tidak ada perkara yang cocok</strong><span>Ubah kata pencarian atau filter tahapan.</span></div>`;
    }

    return `
      <div class="pidum-case-grid pidum-case-grid-head" role="row">
        <span>Register</span>
        <span>Tersangka &amp; pasal</span>
        <span>Tahapan alur</span>
        <span>Jaksa &amp; penyidik</span>
        <span>Tenggat waktu</span>
        <span aria-label="Aksi"></span>
      </div>
      <div class="pidum-case-grid-body">
        ${cases.map((item) => {
          const deadline = getDeadlineState(item);
          const prosecutor = item.prosecutorName || "Belum ditunjuk";
          const deadlineCopy = !item.deadlineDate
            ? "Belum ditentukan"
            : deadline.state === "overdue"
              ? `${item.deadlineType || "Tenggat"} · lewat ${Math.abs(deadline.days)} hari`
              : `${item.deadlineType || "Tenggat"} · ${deadline.label}`;
          const deadlineIcon = deadline.state === "overdue" ? "alert" : deadline.state === "warning" ? "clock" : "check";
          return `
            <article class="pidum-case-grid pidum-case-grid-row" role="row">
              <div class="pidum-case-register">
                <strong>${escapeHtml(item.caseId || "-")}</strong>
                <span>SPDP ${escapeHtml(item.spdpNumber || "-")}</span>
              </div>
              <div class="pidum-case-suspect">
                <strong>${escapeHtml(item.suspectName || "-")}</strong>
                <span>${escapeHtml(item.allegedArticle || "Pasal belum diisi")}</span>
              </div>
              <div class="pidum-case-stage">
                ${renderDashboardStagePips(item.status)}
              </div>
              <div class="pidum-case-officers">
                <strong>${escapeHtml(prosecutor)}</strong>
                <span>${dashboardIcon("users")} ${escapeHtml(item.investigatorInstitution || item.investigatorName || "Penyidik belum diisi")}</span>
              </div>
              <div class="pidum-case-deadline">
                <span class="pidum-deadline-pill ${escapeAttr(deadline.state)}">${dashboardIcon(deadlineIcon)} ${escapeHtml(deadlineCopy)}</span>
                ${item.deadlineDate ? `<small>${formatDate(item.deadlineDate)}</small>` : ""}
              </div>
              <div class="pidum-case-action">
                <button class="pidum-detail-button" data-case-id="${escapeAttr(item.caseId)}" type="button">Detail</button>
              </div>
            </article>`;
        }).join("")}
      </div>`;
  }

  function renderPidumKpiCard(icon, label, value, sub) {
    return `
      <article class="pidum-kpi-card">
        <div class="pidum-kpi-card-top"><span>${escapeHtml(label)}</span>${dashboardIcon(icon)}</div>
        <strong>${Number(value || 0).toLocaleString("id-ID")}</strong>
        <small>${escapeHtml(sub || "")}</small>
      </article>`;
  }

  function dashboardIcon(name) {
    const paths = {
      search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
      plus: '<path d="M12 5v14M5 12h14"></path>',
      refresh: '<path d="M20 6v5h-5"></path><path d="M4 18v-5h5"></path><path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 11"></path><path d="M5.5 15A7 7 0 0 0 17.8 17.8L20 13"></path>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
      clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"></path>',
      alert: '<path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4M12 17h.01"></path>',
      clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
      gavel: '<path d="m14 13-5-5M16 11l4-4-3-3-4 4M8 9l-4 4 3 3 4-4M6 20h12"></path>',
      check: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16 9"></path>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6M8 13h8M8 17h6"></path>'
    };
    return `<svg class="pidum-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  }

  function renderDeadlinesPage() {
    // Semua perkara aktif tetap ditampilkan. Versi sebelumnya hanya memasukkan
    // perkara yang sudah mempunyai deadlineDate dan menyembunyikan perkara aman
    // ketika ada satu perkara yang mendesak.
    const items = [...state.cases].sort(compareDeadlinePriority);
    const withDeadline = items.filter((item) => Boolean(item.deadlineDate));
    const withoutDeadline = items.filter((item) => !item.deadlineDate).length;

    els.pageContent.innerHTML = `
      <div class="stats-grid">
        ${statCard("!", withDeadline.filter((item) => getDeadlineState(item).state === "overdue").length, "Terlambat", "danger")}
        ${statCard("◷", withDeadline.filter((item) => getDeadlineState(item).state === "warning").length, "≤ 3 hari", "warning")}
        ${statCard("✓", withDeadline.filter((item) => getDeadlineState(item).state === "safe").length, "Masih aman", "")}
        ${statCard("▤", items.length, "Semua perkara aktif", "blue")}
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Prioritas tindak lanjut</h3>
            <p>Perkara terlambat dan mendekati tenggat ditempatkan paling atas.${withoutDeadline ? ` ${withoutDeadline} perkara belum memiliki tanggal tenggat tetapi tetap ditampilkan.` : ""}</p>
          </div>
          <button id="deadline-refresh" class="table-action" type="button">Segarkan</button>
        </div>
        ${renderCaseTable(items)}
      </div>`;

    document.getElementById("deadline-refresh")?.addEventListener("click", () => loadCases());
    bindCaseTableActions();
  }

  function compareDeadlinePriority(a, b) {
    const priority = { overdue: 0, warning: 1, safe: 2, none: 3 };
    const aState = a.deadlineDate ? getDeadlineState(a).state : "none";
    const bState = b.deadlineDate ? getDeadlineState(b).state : "none";
    const rankDiff = priority[aState] - priority[bState];
    if (rankDiff !== 0) return rankDiff;

    if (a.deadlineDate && b.deadlineDate) {
      const dateDiff = dateValue(a.deadlineDate) - dateValue(b.deadlineDate);
      if (dateDiff !== 0) return dateDiff;
    }
    return dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt);
  }

  function renderDocumentsPage() {
    const documents = state.cases
      .filter((item) => item.spdpFileUrl)
      .sort(sortByUpdatedDesc);

    els.pageContent.innerHTML = `
      <div class="panel">
        <div class="panel-header"><div><h3>Arsip dokumen SPDP</h3><p>Dokumen yang diunggah penyidik dan tersimpan di Google Drive.</p></div></div>
        <div class="panel-body">
          ${documents.length ? `<div class="document-grid">${documents.map((item) => `
            <article class="document-card">
              <div class="document-icon">PDF</div>
              <div>
                <strong>${escapeHtml(item.spdpFileName || `SPDP ${item.caseId}`)}</strong>
                <small>${escapeHtml(item.caseId)} · ${escapeHtml(item.suspectName || "Tanpa nama tersangka")}<br />Diunggah ${formatDateTime(item.createdAt)}</small>
                <a class="document-link" href="${escapeAttr(item.spdpFileUrl)}" target="_blank" rel="noopener noreferrer">Buka di Google Drive →</a>
              </div>
            </article>`).join("")}</div>` : emptyState("▧", "Belum ada dokumen", "Dokumen SPDP akan tampil setelah penyidik mengirimkan form.")}
        </div>
      </div>`;
  }

  function renderInvestigatorsPage() {
    const map = new Map();
    state.cases.forEach((item) => {
      const key = item.investigatorNipNrp || item.investigatorName || "unknown";
      if (!map.has(key)) {
        map.set(key, {
          name: item.investigatorName || "Tidak diketahui",
          nip: item.investigatorNipNrp || "-",
          rank: item.investigatorRank || "-",
          position: item.investigatorPosition || "-",
          institution: item.investigatorInstitution || "-",
          count: 0,
          lastSubmit: item.createdAt
        });
      }
      const record = map.get(key);
      record.count += 1;
      if (dateValue(item.createdAt) > dateValue(record.lastSubmit)) record.lastSubmit = item.createdAt;
    });
    const investigators = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));

    els.pageContent.innerHTML = `
      <div class="panel">
        <div class="panel-header"><div><h3>Penyidik pengirim SPDP</h3><p>Rekap otomatis dari data perkara yang masuk.</p></div></div>
        <div class="panel-body">
          ${investigators.length ? `<div class="investigator-grid">${investigators.map((item) => `
            <article class="investigator-card">
              <div class="investigator-card-top">
                <div class="avatar">${escapeHtml(initials(item.name))}</div>
                <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.institution)}</small></div>
              </div>
              <div style="margin-top:13px;color:var(--gray-600);font-size:12px;line-height:1.65">
                ${escapeHtml(item.rank)} · ${escapeHtml(item.nip)}<br />${escapeHtml(item.position)}
              </div>
              <div class="investigator-stats"><span>${item.count} perkara</span><span>${formatDate(item.lastSubmit)}</span></div>
            </article>`).join("")}</div>` : emptyState("♙", "Belum ada data penyidik", "Data akan terbentuk dari form SPDP yang dikirim.")}
        </div>
      </div>`;
  }

  function renderWorkflowPage() {
    els.pageContent.innerHTML = `
      <div class="form-intro">
        <h2>Alur administrasi perkara</h2>
        <p>Ringkasan tahapan operasional yang diimplementasikan pada aplikasi. Tahap pelimpahan dan persidangan disediakan sebagai pengembangan lanjutan setelah Tahap II.</p>
      </div>
      <div class="panel">
        <div class="panel-header"><div><h3>SPDP hingga persidangan</h3><p>Setiap tahapan dapat dipilih sebagai status perkara pada halaman detail.</p></div></div>
        <div class="panel-body">
          <div class="timeline">
            ${WORKFLOW_STAGES.map((stage) => `
              <div class="timeline-item">
                <div class="timeline-track"><div class="timeline-node"></div><div class="timeline-line"></div></div>
                <div class="timeline-content"><strong>${escapeHtml(stage.code)} — ${escapeHtml(stage.title)}</strong><small>${escapeHtml(stage.detail)}</small></div>
              </div>`).join("")}
          </div>
        </div>
      </div>`;
  }

  function renderSettingsPage() {
    els.pageContent.innerHTML = `
      <div class="settings-grid">
        <section class="settings-card">
          <h3>Google Apps Script</h3>
          <p>Backend untuk autentikasi, penyimpanan data perkara, log aktivitas, dan unggah dokumen.</p>
          <a class="integration-link" href="${escapeAttr(CONFIG.APPS_SCRIPT_URL)}" target="_blank" rel="noopener noreferrer">${escapeHtml(CONFIG.APPS_SCRIPT_URL)}</a>
        </section>
        <section class="settings-card">
          <h3>Google Spreadsheet</h3>
          <p>Basis data operasional sederhana yang berisi tabel Users, Cases, Documents, dan ActivityLog.</p>
          <a class="integration-link" href="${escapeAttr(CONFIG.SHEET_URL)}" target="_blank" rel="noopener noreferrer">Buka Google Spreadsheet</a>
        </section>
        <section class="settings-card">
          <h3>Google Drive</h3>
          <p>Folder induk arsip SPDP. Backend membuat subfolder berdasarkan ID perkara.</p>
          <a class="integration-link" href="${escapeAttr(CONFIG.DRIVE_FOLDER_URL)}" target="_blank" rel="noopener noreferrer">Buka folder Google Drive</a>
        </section>
        <section class="settings-card">
          <h3>Keamanan akun</h3>
          <p>Kata sandi disimpan dalam bentuk hash. Ubah akun awal melalui fungsi <code>addUser()</code> atau <code>resetPassword()</code> di Apps Script.</p>
          <button id="settings-logout" class="danger-button" type="button">Keluar dari aplikasi</button>
        </section>
      </div>`;
    document.getElementById("settings-logout")?.addEventListener("click", logout);
  }

  function renderInvestigatorForm() {
    els.pageContent.innerHTML = `
      <div class="form-shell">
        <div class="form-intro">
          <h2>Form pengiriman SPDP</h2>
          <p>Isi data penyidik, data perkara, identitas tersangka, barang bukti, lalu unggah dokumen SPDP dalam format PDF atau DOCX.</p>
        </div>

        <form id="spdp-form" novalidate>
          ${formSection("01", "Identitas Penyidik", "Data petugas yang menyampaikan SPDP.", `
            <div class="form-grid">
              ${field("Nama", "investigatorName", "text", true, state.session.user.fullName || "")}
              ${field("Pangkat/Gol", "investigatorRank", "text", true)}
              ${field("NIP/NRP", "investigatorNipNrp", "text", true)}
              ${field("Jabatan", "investigatorPosition", "text", true)}
              ${field("Instansi/Unit Penyidik", "investigatorInstitution", "text", true, "", "Contoh: Polres Muna / Satreskrim")}
              ${field("Nomor kontak", "investigatorPhone", "tel", false)}
            </div>`)}

          ${formSection("02", "Data SPDP dan Perkara", "Data dasar untuk verifikasi penerimaan.", `
            <div class="form-grid three">
              ${field("Nomor SPDP", "spdpNumber", "text", true)}
              ${field("Tanggal SPDP", "spdpDate", "date", true)}
              ${field("Tanggal diterima Kejaksaan", "receivedDate", "date", true, todayISO())}
              ${field("Nomor Sprindik", "sprindikNumber", "text", true)}
              ${field("Tanggal Sprindik", "sprindikDate", "date", true)}
              ${field("Pasal yang disangkakan", "allegedArticle", "text", true)}
              <div class="form-field full-span">
                <label for="caseSummary">Uraian singkat perkara <span class="required">*</span></label>
                <textarea id="caseSummary" name="caseSummary" required placeholder="Tuliskan kronologis singkat, waktu, tempat, dan dugaan tindak pidana."></textarea>
              </div>
            </div>`)}

          ${formSection("03", "Identitas Tersangka", "Identitas sesuai dokumen penyidikan.", `
            <div class="form-grid three">
              ${field("Nama lengkap", "suspectName", "text", true)}
              ${field("Nomor Identitas", "suspectIdentityNumber", "text", true)}
              ${field("Tempat lahir", "birthPlace", "text", true)}
              ${field("Tanggal lahir", "birthDate", "date", true)}
              ${field("Umur", "age", "number", false, "", "Tahun")}
              ${selectField("Jenis Kelamin", "gender", ["Laki-laki", "Perempuan"], true)}
              ${field("Kebangsaan/Kewarganegaraan", "nationality", "text", true, "Indonesia")}
              ${field("Agama", "religion", "text", true)}
              ${field("Pekerjaan", "occupation", "text", true)}
              ${field("Pendidikan", "education", "text", true)}
              <div class="form-field full-span">
                <label for="address">Tempat tinggal <span class="required">*</span></label>
                <textarea id="address" name="address" required placeholder="Alamat lengkap tersangka."></textarea>
              </div>
            </div>`)}

          ${formSection("04", "Barang Bukti", "Daftar awal barang bukti yang berkaitan dengan perkara.", `
            <div class="form-grid">
              <div class="form-field full-span">
                <label for="evidence">Barang Bukti <span class="required">*</span></label>
                <textarea id="evidence" name="evidence" required placeholder="Contoh: 1 unit sepeda motor..., 1 buah telepon seluler..., dokumen..., dan seterusnya."></textarea>
              </div>
            </div>`)}

          ${formSection("05", "Unggah Dokumen SPDP", "Dokumen disimpan pada folder Google Drive perkara.", `
            <div id="upload-zone" class="upload-zone">
              <input id="spdp-file" name="spdpFile" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
              <div class="upload-icon">⇧</div>
              <h4>Pilih atau tarik dokumen SPDP ke sini</h4>
              <p>Format yang diterima: PDF atau DOCX. Antarmuka tidak menetapkan batas ukuran, tetapi unggahan tetap tunduk pada kuota dan batas eksekusi Google Apps Script/Google Drive.</p>
              <button id="choose-file-button" class="secondary-button" type="button" style="margin-top:14px">Pilih dokumen</button>
              <div id="selected-file-card"></div>
              <div class="progress-bar"><span id="file-progress"></span></div>
            </div>`)}

          <div class="form-submit-row">
            <button id="reset-spdp-form" class="ghost-button" type="reset">Kosongkan form</button>
            <button id="submit-spdp-form" class="primary-button" type="submit">
              <span class="button-label">Kirim SPDP</span>
              <span class="button-spinner" hidden></span>
            </button>
          </div>
        </form>
      </div>`;

    bindInvestigatorForm();
  }

  function bindInvestigatorForm() {
    const form = document.getElementById("spdp-form");
    const fileInput = document.getElementById("spdp-file");
    const uploadZone = document.getElementById("upload-zone");
    const chooseButton = document.getElementById("choose-file-button");
    const birthDate = document.getElementById("birthDate");
    const age = document.getElementById("age");

    chooseButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => setSelectedFile(fileInput.files?.[0] || null));
    birthDate.addEventListener("change", () => {
      const calculated = calculateAge(birthDate.value);
      if (calculated >= 0) age.value = calculated;
    });

    ["dragenter", "dragover"].forEach((name) => uploadZone.addEventListener(name, (event) => {
      event.preventDefault();
      uploadZone.classList.add("dragover");
    }));
    ["dragleave", "drop"].forEach((name) => uploadZone.addEventListener(name, (event) => {
      event.preventDefault();
      uploadZone.classList.remove("dragover");
    }));
    uploadZone.addEventListener("drop", (event) => {
      const file = event.dataTransfer.files?.[0];
      if (file) setSelectedFile(file);
    });

    form.addEventListener("reset", () => {
      state.selectedFile = null;
      setTimeout(() => {
        document.getElementById("selected-file-card").innerHTML = "";
        document.getElementById("file-progress").style.width = "0";
      }, 0);
    });
    form.addEventListener("submit", handleSpdpSubmit);
  }

  function setSelectedFile(file) {
    if (!file) {
      state.selectedFile = null;
      document.getElementById("selected-file-card").innerHTML = "";
      return;
    }
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(extension)) {
      toast("warning", "Format tidak didukung", "Gunakan dokumen PDF atau DOCX.");
      return;
    }
    state.selectedFile = file;
    document.getElementById("selected-file-card").innerHTML = `
      <div class="upload-file-card">
        <div class="upload-file-meta"><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)} · ${escapeHtml(file.type || extension.toUpperCase())}</small></div>
        <button id="remove-selected-file" class="table-action" type="button">Hapus</button>
      </div>`;
    document.getElementById("remove-selected-file").addEventListener("click", () => {
      state.selectedFile = null;
      document.getElementById("spdp-file").value = "";
      document.getElementById("selected-file-card").innerHTML = "";
      document.getElementById("file-progress").style.width = "0";
    });
  }

  async function handleSpdpSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!state.selectedFile) {
      toast("warning", "Dokumen SPDP belum dipilih", "Unggah satu dokumen PDF atau DOCX.");
      return;
    }

    const submitButton = document.getElementById("submit-spdp-form");
    setButtonLoading(submitButton, true);
    try {
      const fileData = await readFileBase64(state.selectedFile, (progress) => {
        document.getElementById("file-progress").style.width = `${Math.min(progress, 70)}%`;
      });
      document.getElementById("file-progress").style.width = "80%";

      const formData = new FormData(form);
      const payload = {};
      formData.forEach((value, key) => {
        if (key !== "spdpFile") payload[key] = typeof value === "string" ? value.trim() : value;
      });
      payload.spdpFile = {
        name: state.selectedFile.name,
        mimeType: state.selectedFile.type || mimeFromName(state.selectedFile.name),
        dataBase64: fileData
      };

      const result = await gasRequest("submitCase", payload);
      document.getElementById("file-progress").style.width = "100%";
      toast("success", "SPDP berhasil dikirim", `Nomor register perkara: ${result.caseId}.`);
      form.reset();
      state.selectedFile = null;
      setTimeout(() => { document.getElementById("file-progress").style.width = "0"; }, 700);
      showSubmissionReceipt(result);
    } catch (error) {
      document.getElementById("file-progress").style.width = "0";
      toast("error", "Pengiriman gagal", error.message || "Data belum berhasil disimpan.");
    } finally {
      setButtonLoading(submitButton, false);
    }
  }

  function showSubmissionReceipt(result) {
    els.modalRoot.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Bukti pengiriman">
        <div class="modal-card" style="max-width:560px">
          <div class="modal-header"><h2>SPDP berhasil diterima</h2><button class="modal-close" data-close-modal type="button">×</button></div>
          <div class="modal-body">
            <div class="empty-state" style="padding:20px 10px">
              <div class="empty-state-icon" style="background:var(--green-100);color:var(--green-800)">✓</div>
              <h3>${escapeHtml(result.caseId)}</h3>
              <p>Simpan nomor register perkara ini sebagai referensi administrasi.</p>
            </div>
            ${result.fileUrl ? `<a class="integration-link" href="${escapeAttr(result.fileUrl)}" target="_blank" rel="noopener noreferrer">Buka dokumen SPDP di Google Drive</a>` : ""}
          </div>
          <div class="modal-footer"><button class="primary-button" data-close-modal type="button">Tutup</button></div>
        </div>
      </div>`;
    bindModalClose();
  }

  function renderCaseTable(cases, options = {}) {
    if (!cases.length) return `<div class="panel-body">${emptyState("▤", "Belum ada perkara", "Data perkara belum tersedia atau tidak sesuai filter.")}</div>`;
    return `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nomor register perkara</th><th>Tersangka</th><th>Penyidik</th><th>Status</th><th>Tenggat</th><th>Pembaruan</th><th></th></tr></thead>
          <tbody>
            ${cases.map((item) => {
              const status = getStatus(item.status);
              const deadline = getDeadlineState(item);
              return `<tr>
                <td><div class="case-primary">${escapeHtml(item.caseId)}</div><div class="case-secondary">SPDP ${escapeHtml(item.spdpNumber || "-")}</div></td>
                <td><div class="case-primary">${escapeHtml(item.suspectName || "-")}</div><div class="case-secondary">${escapeHtml(item.allegedArticle || "Pasal belum diisi")}</div></td>
                <td><div>${escapeHtml(item.investigatorName || "-")}</div><div class="case-secondary">${escapeHtml(item.investigatorInstitution || "-")}</div></td>
                <td><span class="status-badge ${status.tone}">${escapeHtml(status.label)}</span></td>
                <td>${item.deadlineDate ? `<span class="deadline-badge ${deadline.state}">${escapeHtml(deadline.label)}</span><div class="case-secondary">${formatDate(item.deadlineDate)}</div>` : `<span class="case-secondary">Belum ditentukan</span>`}</td>
                <td>${formatDateTime(item.updatedAt || item.createdAt)}</td>
                <td><button class="table-action" data-case-id="${escapeAttr(item.caseId)}" type="button">Detail</button></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`;
  }

  function bindCaseTableActions() {
    els.pageContent.querySelectorAll("[data-case-id]").forEach((button) => {
      button.addEventListener("click", () => openCaseModal(button.dataset.caseId));
    });
  }

  function openCaseModal(caseId) {
    const item = state.cases.find((entry) => entry.caseId === caseId);
    if (!item) return;
    const status = getStatus(item.status);
    const lateFlag = String(item.spdpLate).toLowerCase() === "true" || Number(item.spdpDelayDays) > 7;

    state.selectedAdministrationFile = null;
    els.modalRoot.innerHTML = `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Detail perkara ${escapeAttr(item.caseId)}">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <div class="case-secondary">Nomor register perkara</div>
              <h2>${escapeHtml(item.caseId)}</h2>
              <div class="case-secondary">SPDP ${escapeHtml(item.spdpNumber || "-")}</div>
            </div>
            <button class="modal-close" data-close-modal type="button">×</button>
          </div>
          <div class="modal-body">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
              <span class="status-badge ${status.tone}">${escapeHtml(status.label)}</span>
              ${lateFlag ? `<span class="status-badge red">SPDP > 7 hari (${escapeHtml(String(item.spdpDelayDays || "?"))} hari)</span>` : `<span class="status-badge green">Verifikasi waktu SPDP aman</span>`}
            </div>

            <div class="detail-grid">
              ${detail("Nama tersangka", item.suspectName)}
              ${detail("Nomor identitas", item.suspectIdentityNumber)}
              ${detail("Tempat/Tanggal lahir", `${item.birthPlace || "-"}, ${formatDate(item.birthDate)}`)}
              ${detail("Jenis kelamin", item.gender)}
              ${detail("Kewarganegaraan", item.nationality)}
              ${detail("Pekerjaan", item.occupation)}
              ${detail("Alamat", item.address, true)}
              ${detail("Pasal", item.allegedArticle, true)}
              ${detail("Uraian perkara", item.caseSummary, true)}
              ${detail("Barang bukti", item.evidence, true)}
            </div>

            <h3 class="modal-section-title">Data penyidik dan SPDP</h3>
            <div class="detail-grid">
              ${detail("Penyidik", item.investigatorName)}
              ${detail("Pangkat / NRP", `${item.investigatorRank || "-"} / ${item.investigatorNipNrp || "-"}`)}
              ${detail("Jabatan", item.investigatorPosition)}
              ${detail("Instansi", item.investigatorInstitution)}
              ${detail("Sprindik", `${item.sprindikNumber || "-"} · ${formatDate(item.sprindikDate)}`)}
              ${detail("SPDP diterima", `${formatDate(item.receivedDate)} · selisih ${item.spdpDelayDays ?? "-"} hari`)}
              ${item.spdpFileUrl ? `<div class="detail-item full-span"><span>Dokumen SPDP</span><a class="document-link" href="${escapeAttr(item.spdpFileUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.spdpFileName || "Buka dokumen")}</a></div>` : ""}
            </div>

            <h3 class="modal-section-title">Informasi administrasi yang belum dibuat</h3>
            ${renderAdministrationPanel(item)}
          </div>
          <div class="modal-footer">
            <button class="primary-button" data-close-modal type="button">Tutup</button>
          </div>
        </div>
      </div>`;

    bindModalClose();
    els.modalRoot.querySelectorAll("[data-create-administration]").forEach((button) => {
      button.addEventListener("click", () => openAdministrationModal(caseId, button.dataset.createAdministration));
    });
  }

  function renderAdministrationPanel(item) {
    const administrations = Array.isArray(item.administrations) ? item.administrations : [];
    const completedMap = new Map(administrations.map((record) => [String(record.type || "").toUpperCase(), record]));
    const completedCount = ADMINISTRATION_STAGES.filter((stage) => completedMap.has(stage.code)).length;
    const p19ResolvedByP21 = completedMap.has("P-21") && !completedMap.has("P-19");
    const resolvedCount = completedCount + (p19ResolvedByP21 ? 1 : 0);
    const percentage = Math.round((resolvedCount / ADMINISTRATION_STAGES.length) * 100);

    return `
      <section class="administration-panel">
        <div class="administration-summary">
          <div>
            <strong>${resolvedCount} dari ${ADMINISTRATION_STAGES.length} tahapan administrasi telah diselesaikan</strong>
            <small>Status perkara diperbarui otomatis setelah administrasi disimpan.</small>
          </div>
          <span>${percentage}%</span>
        </div>
        <div class="administration-progress" aria-label="Progres administrasi ${percentage}%">
          <span style="width:${percentage}%"></span>
        </div>
        <div class="administration-list">
          ${ADMINISTRATION_STAGES.map((stage) => {
            const record = completedMap.get(stage.code);
            const missing = stage.prerequisites.filter((code) => !completedMap.has(code));
            const blockedByP21 = stage.code === "P-19" && completedMap.has("P-21");
            const locked = !record && (missing.length > 0 || blockedByP21);
            const lockMessage = blockedByP21
              ? "Tidak tersedia karena P-21 sudah dibuat."
              : missing.length
                ? `Buat ${missing.join(", ")} terlebih dahulu.`
                : "";

            return `
              <article class="administration-card ${record ? "completed" : locked ? "locked" : "pending"}">
                <div class="administration-code">${escapeHtml(stage.code)}</div>
                <div class="administration-content">
                  <div class="administration-title-row">
                    <div>
                      <strong>${escapeHtml(stage.title)}</strong>
                      <p>${escapeHtml(stage.detail)}</p>
                    </div>
                    <span class="status-badge ${record ? "green" : locked ? "gray" : "amber"}">
                      ${record ? "Sudah dibuat" : blockedByP21 ? "Tidak diperlukan" : locked ? "Menunggu" : "Belum dibuat"}
                    </span>
                  </div>
                  ${record ? `
                    <div class="administration-meta">
                      <span><b>Nomor:</b> ${escapeHtml(record.documentNumber || "-")}</span>
                      <span><b>Tanggal:</b> ${formatDate(record.documentDate)}</span>
                      <span><b>Penanggung jawab:</b> ${escapeHtml(record.responsibleOfficer || "-")}</span>
                    </div>
                    ${record.notes ? `<p class="administration-notes">${escapeHtml(record.notes)}</p>` : ""}
                    ${record.fileUrl ? `<a class="document-link" href="${escapeAttr(record.fileUrl)}" target="_blank" rel="noopener noreferrer">Buka lampiran administrasi →</a>` : ""}
                  ` : `
                    <div class="administration-action-row">
                      <small>${escapeHtml(lockMessage || "Administrasi siap dibuat.")}</small>
                      ${blockedByP21 ? "" : `
                        <button
                          class="${locked ? "ghost-button" : "primary-button"} administration-create-button"
                          data-create-administration="${escapeAttr(stage.code)}"
                          type="button"
                          ${locked ? "disabled" : ""}
                        >Buat</button>
                      `}
                    </div>
                  `}
                </div>
              </article>`;
          }).join("")}
        </div>
      </section>`;
  }

  function openAdministrationModal(caseId, type) {
    const item = state.cases.find((entry) => entry.caseId === caseId);
    const stage = ADMINISTRATION_STAGES.find((entry) => entry.code === type);
    if (!item || !stage) return;

    closeModal();
    state.administrationBuilder.caseId = caseId;
    state.administrationBuilder.type = type;
    navigate("administration-builder");
  }

  function renderAdministrationBuilderPage() {
    if (!state.cases.length) {
      els.pageContent.innerHTML = `<div class="panel">${emptyState("▧", "Belum ada data perkara", "Kirim dan verifikasi SPDP terlebih dahulu sebelum membuat administrasi.")}</div>`;
      return;
    }

    const selectedCase = state.cases.find((item) => item.caseId === state.administrationBuilder.caseId) || null;
    const selectedStage = ADMINISTRATION_STAGES.find((stage) => stage.code === state.administrationBuilder.type) || null;
    const selectedSchema = selectedStage ? ADMIN_FORM_SCHEMAS[selectedStage.code] : null;

    els.pageContent.innerHTML = `
      <section class="administration-builder-shell">
        <div class="panel builder-controls-panel">
          <div class="panel-heading">
            <div>
              <h2>Pembuatan Administrasi Otomatis</h2>
              <p>Pilih nama tersangka. Data perkara dan administrasi sebelumnya akan dimasukkan ke form secara otomatis.</p>
            </div>
          </div>
          <div class="builder-controls">
            <div class="form-field">
              <label for="builder-case-select">Nama tersangka <span class="required">*</span></label>
              <select id="builder-case-select">
                <option value="">Pilih nama tersangka...</option>
                ${[...state.cases].sort((a, b) => String(a.suspectName || "").localeCompare(String(b.suspectName || ""), "id")).map((item) => `
                  <option value="${escapeAttr(item.caseId)}" ${selectedCase?.caseId === item.caseId ? "selected" : ""}>
                    ${escapeHtml(item.suspectName || "Nama belum tersedia")} — ${escapeHtml(item.caseId)}
                  </option>`).join("")}
              </select>
              <small class="form-hint">Nomor register ditampilkan untuk membedakan tersangka dengan nama yang sama.</small>
            </div>
            <div class="form-field">
              <label for="builder-type-select">Jenis administrasi <span class="required">*</span></label>
              <select id="builder-type-select" ${selectedCase ? "" : "disabled"}>
                <option value="">Pilih administrasi...</option>
                ${selectedCase ? renderAdministrationTypeOptions(selectedCase, selectedStage?.code || "") : ""}
              </select>
              <small class="form-hint">Tahapan yang belum memenuhi prasyarat akan terkunci.</small>
            </div>
          </div>
        </div>

        ${selectedCase ? renderBuilderCaseSnapshot(selectedCase) : `
          <div class="panel builder-placeholder">${emptyState("⌄", "Pilih nama tersangka", "Form akan ditampilkan setelah perkara dipilih dari dropdown.")}</div>`}

        ${selectedCase && selectedStage ? (
          selectedSchema
            ? renderDynamicAdministrationForm(selectedCase, selectedStage, selectedSchema)
            : `<div class="panel">${emptyState("!", "Skema form tidak tersedia", `Skema ${selectedStage.code} belum ditemukan pada administration-forms.js.`)}</div>`
        ) : ""}
      </section>`;

    document.getElementById("builder-case-select")?.addEventListener("change", (event) => {
      state.administrationBuilder.caseId = event.target.value;
      state.administrationBuilder.type = "";
      state.selectedAdministrationFile = null;
      renderAdministrationBuilderPage();
    });

    document.getElementById("builder-type-select")?.addEventListener("change", (event) => {
      state.administrationBuilder.type = event.target.value;
      state.selectedAdministrationFile = null;
      renderAdministrationBuilderPage();
    });

    bindDynamicAdministrationForm(selectedCase, selectedStage);
  }

  function renderAdministrationTypeOptions(item, selectedType) {
    return ADMINISTRATION_STAGES.map((stage) => {
      const availability = getAdministrationAvailability(item, stage);
      const suffix = availability.completed
        ? " — sudah dibuat"
        : availability.locked
          ? ` — terkunci: ${availability.message}`
          : " — siap dibuat";
      return `<option value="${escapeAttr(stage.code)}" ${selectedType === stage.code ? "selected" : ""} ${availability.completed || availability.locked ? "disabled" : ""}>${escapeHtml(stage.code + " — " + stage.title + suffix)}</option>`;
    }).join("");
  }

  function getAdministrationAvailability(item, stage) {
    const administrations = Array.isArray(item.administrations) ? item.administrations : [];
    const completed = new Set(administrations.map((record) => String(record.type || "").toUpperCase()));
    if (completed.has(stage.code)) return { completed: true, locked: false, message: "Sudah dibuat" };
    if (stage.code === "P-19" && completed.has("P-21")) {
      return { completed: false, locked: true, message: "P-21 sudah dibuat" };
    }
    const missing = stage.prerequisites.filter((code) => !completed.has(code));
    return {
      completed: false,
      locked: missing.length > 0,
      message: missing.length ? `buat ${missing.join(", ")} terlebih dahulu` : ""
    };
  }

  function renderBuilderCaseSnapshot(item) {
    const administrations = Array.isArray(item.administrations) ? item.administrations : [];
    const completedCodes = administrations.map((record) => String(record.type || "").toUpperCase());
    const p19ResolvedByP21 = completedCodes.includes("P-21") && !completedCodes.includes("P-19");
    const resolved = completedCodes.length + (p19ResolvedByP21 ? 1 : 0);
    const percentage = Math.min(100, Math.round((resolved / ADMINISTRATION_STAGES.length) * 100));

    return `
      <div class="panel builder-case-card">
        <div class="builder-case-heading">
          <div>
            <span class="case-secondary">Perkara terpilih</span>
            <h3>${escapeHtml(item.suspectName || "Nama tersangka belum tersedia")}</h3>
            <p>${escapeHtml(item.caseId)} · SPDP ${escapeHtml(item.spdpNumber || "-")}</p>
          </div>
          <span class="status-badge ${getStatus(item.status).tone}">${escapeHtml(getStatus(item.status).label)}</span>
        </div>
        <div class="detail-grid builder-case-details">
          ${detail("Penyidik", item.investigatorName)}
          ${detail("Instansi", item.investigatorInstitution)}
          ${detail("Pasal disangkakan", item.allegedArticle, true)}
        </div>
        <div class="administration-summary compact">
          <div><strong>${resolved} dari ${ADMINISTRATION_STAGES.length} tahapan selesai</strong><small>Data form lama tetap dapat dipakai sebagai sumber isian otomatis.</small></div>
          <span>${percentage}%</span>
        </div>
        <div class="administration-progress"><span style="width:${percentage}%"></span></div>
      </div>`;
  }

  function renderDynamicAdministrationForm(item, stage, schema) {
    const availability = getAdministrationAvailability(item, stage);
    if (availability.completed || availability.locked) {
      return `<div class="panel">${emptyState("!", availability.completed ? `${stage.code} sudah dibuat` : `${stage.code} belum dapat dibuat`, availability.message || "Pilih administrasi lain.")}</div>`;
    }

    let sortOrder = 0;
    const sections = schema.sections.map((section, sectionIndex) => `
      <section class="admin-form-section">
        <div class="admin-form-section-heading">
          <span>${sectionIndex + 1}</span>
          <div><h3>${escapeHtml(section.title)}</h3>${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}</div>
        </div>
        <div class="form-grid admin-dynamic-grid">
          ${section.fields.map((definition) => {
            sortOrder += 1;
            return renderAdministrationField(definition, item, sortOrder);
          }).join("")}
        </div>
      </section>`).join("");

    return `
      <div class="panel builder-form-panel">
        <div class="administration-form-intro builder-form-intro">
          <span class="administration-code">${escapeHtml(stage.code)}</span>
          <div>
            <strong>${escapeHtml(schema.title || stage.title)}</strong>
            <p>${escapeHtml(schema.subtitle || stage.detail)} · Acuan format: ${escapeHtml(schema.referencePages || "Lampiran B-310")}. Setelah disimpan, status menjadi ${escapeHtml(getStatus(stage.status).label)}.</p>
          </div>
        </div>
        <form id="administration-create-form" class="builder-form" novalidate>
          <input type="hidden" name="caseId" value="${escapeAttr(item.caseId)}" />
          <input type="hidden" name="type" value="${escapeAttr(stage.code)}" />
          ${sections}
          <section class="admin-form-section">
            <div class="admin-form-section-heading"><span>${schema.sections.length + 1}</span><div><h3>Lampiran dan catatan sistem</h3><p>Lampiran bersifat opsional. Seluruh isian form disimpan sebagai data terstruktur di Google Spreadsheet.</p></div></div>
            <div class="form-grid admin-dynamic-grid">
              <div class="form-field full-span">
                <label for="administration-system-notes">Catatan internal <span class="optional-label">(opsional)</span></label>
                <textarea id="administration-system-notes" name="systemNotes" placeholder="Catatan internal yang tidak dicetak pada format administrasi."></textarea>
              </div>
              <div class="form-field full-span">
                <label for="administration-file">Lampiran PDF/DOCX <span class="optional-label">(opsional)</span></label>
                <div class="administration-file-box">
                  <input id="administration-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                  <button id="choose-administration-file" class="secondary-button" type="button">Pilih lampiran</button>
                  <div id="administration-file-name" class="case-secondary">Belum ada lampiran dipilih.</div>
                </div>
              </div>
            </div>
          </section>
          <div class="builder-form-actions">
            <button id="builder-reset-form" class="ghost-button" type="button">Muat ulang data otomatis</button>
            <button id="save-administration" class="primary-button" type="submit">
              <span class="button-label">Simpan ${escapeHtml(stage.code)} dan perbarui status</span>
              <span class="button-spinner" hidden></span>
            </button>
          </div>
        </form>
      </div>`;
  }

  function renderAdministrationField(definition, item, sortOrder) {
    const resolved = resolveAdministrationFieldValue(definition, item);
    const hasAutoValue = Boolean(definition.source && String(resolved.value ?? "").trim() !== "");
    const lockedAuto = hasAutoValue && !definition.editableAuto;
    const classes = ["form-field", definition.full ? "full-span" : "", definition.source ? "auto-populated-field" : ""].filter(Boolean).join(" ");
    const required = definition.required ? "required" : "";
    const readonly = lockedAuto && definition.type !== "select" ? "readonly" : "";
    const disabled = lockedAuto && definition.type === "select" ? "disabled" : "";
    const value = resolved.value ?? definition.defaultValue ?? "";
    const sourceText = definition.source
      ? hasAutoValue
        ? `Terisi otomatis dari ${definition.sourceLabel || "data sistem"}${definition.editableAuto ? " · dapat disunting" : ""}`
        : `Data otomatis belum tersedia · lengkapi secara manual`
      : "Diisi administrator";

    let control;
    if (definition.type === "textarea") {
      control = `<textarea id="admin-field-${escapeAttr(definition.key)}" name="field__${escapeAttr(definition.key)}" data-admin-field data-field-key="${escapeAttr(definition.key)}" data-field-label="${escapeAttr(definition.label)}" data-field-source="${escapeAttr(definition.source || "manual")}" data-sort-order="${sortOrder}" placeholder="${escapeAttr(definition.placeholder || "")}" ${required} ${readonly}>${escapeHtml(value)}</textarea>`;
    } else if (definition.type === "select") {
      const options = Array.isArray(definition.options) ? definition.options : [];
      control = `<select id="admin-field-${escapeAttr(definition.key)}" name="field__${escapeAttr(definition.key)}" data-admin-field data-field-key="${escapeAttr(definition.key)}" data-field-label="${escapeAttr(definition.label)}" data-field-source="${escapeAttr(definition.source || "manual")}" data-sort-order="${sortOrder}" ${required} ${disabled}><option value="">Pilih...</option>${options.map((option) => `<option value="${escapeAttr(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`;
    } else {
      const normalizedValue = definition.type === "date" ? toDateInputValue(value) : value;
      control = `<input id="admin-field-${escapeAttr(definition.key)}" name="field__${escapeAttr(definition.key)}" type="${escapeAttr(definition.type || "text")}" value="${escapeAttr(normalizedValue)}" data-admin-field data-field-key="${escapeAttr(definition.key)}" data-field-label="${escapeAttr(definition.label)}" data-field-source="${escapeAttr(definition.source || "manual")}" data-sort-order="${sortOrder}" placeholder="${escapeAttr(definition.placeholder || "")}" ${required} ${readonly} />`;
    }

    return `<div class="${classes}">
      <label for="admin-field-${escapeAttr(definition.key)}">${escapeHtml(definition.label)} ${definition.required ? '<span class="required">*</span>' : ""}</label>
      ${control}
      <small class="admin-field-source ${definition.source ? (hasAutoValue ? "resolved" : "missing") : "manual"}">${definition.source ? '<span class="auto-field-badge">AUTO</span>' : '<span class="manual-field-badge">MANUAL</span>'} ${escapeHtml(sourceText)}</small>
    </div>`;
  }

  function resolveAdministrationFieldValue(definition, item) {
    if (!definition.source) return { value: definition.defaultValue || "", source: "manual" };
    const sources = String(definition.source).split("|").map((source) => source.trim()).filter(Boolean);
    for (const source of sources) {
      const value = resolveAdministrationSource(source, item);
      if (value !== undefined && value !== null && String(value).trim() !== "") return { value, source };
    }
    return { value: definition.defaultValue || "", source: sources[0] || "manual" };
  }

  function resolveAdministrationSource(source, item) {
    if (source === "today") return todayISO();
    if (source === "user:fullName") return state.session?.user?.fullName || state.session?.user?.username || "";
    if (source.startsWith("case:")) return getNestedValue(item, source.slice(5));
    if (source.startsWith("computed:")) return resolveComputedAdministrationValue(source.slice(9), item);
    if (source.startsWith("admin:")) {
      const parts = source.split(":");
      const type = parts[1];
      const record = (Array.isArray(item.administrations) ? item.administrations : []).find((administration) => String(administration.type || "").toUpperCase() === type.toUpperCase());
      if (!record) return "";
      if (parts[2] === "field") return record.formData?.[parts.slice(3).join(":")] || "";
      return record[parts.slice(2).join(":")] || "";
    }
    return "";
  }

  function resolveComputedAdministrationValue(key, item) {
    const values = {
      investigatorRankNrp: [item.investigatorRank, item.investigatorNipNrp].filter(Boolean).join(" / "),
      delayCategory: Number(item.spdpDelayDays || 0) > 7 ? "> 7 Hari" : "< 7 Hari",
      suspectIdentity: [item.suspectName, item.suspectIdentityNumber].filter(Boolean).join(" / "),
      investigatorRecipient: [item.investigatorPosition, item.investigatorName, item.investigatorInstitution].filter(Boolean).join(" — ")
    };
    return values[key] || "";
  }

  function getNestedValue(object, path) {
    return String(path || "").split(".").reduce((value, key) => value == null ? "" : value[key], object);
  }

  function toDateInputValue(value) {
    if (!value) return "";
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function bindDynamicAdministrationForm(item, stage) {
    if (!item || !stage || !document.getElementById("administration-create-form")) return;
    document.getElementById("choose-administration-file")?.addEventListener("click", () => document.getElementById("administration-file")?.click());
    document.getElementById("administration-file")?.addEventListener("change", (event) => setAdministrationFile(event.target.files?.[0] || null));
    document.getElementById("builder-reset-form")?.addEventListener("click", () => {
      state.selectedAdministrationFile = null;
      renderAdministrationBuilderPage();
      toast("info", "Data dimuat ulang", "Isian otomatis dikembalikan ke data perkara terbaru.");
    });
    document.getElementById("administration-create-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      createAdministrationFromBuilder(item.caseId, stage.code);
    });
  }

  function setAdministrationFile(file) {
    const label = document.getElementById("administration-file-name");
    if (!file) {
      state.selectedAdministrationFile = null;
      if (label) label.textContent = "Belum ada lampiran dipilih.";
      return;
    }
    const extension = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(extension)) {
      state.selectedAdministrationFile = null;
      const input = document.getElementById("administration-file");
      if (input) input.value = "";
      if (label) label.textContent = "Belum ada lampiran dipilih.";
      toast("warning", "Format tidak didukung", "Lampiran administrasi harus PDF atau DOCX.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      state.selectedAdministrationFile = null;
      const input = document.getElementById("administration-file");
      if (input) input.value = "";
      toast("warning", "Lampiran terlalu besar", "Ukuran lampiran maksimal 10 MB.");
      return;
    }
    state.selectedAdministrationFile = file;
    if (label) label.textContent = `${file.name} · ${formatBytes(file.size)}`;
  }

  async function createAdministrationFromBuilder(caseId, type) {
    const form = document.getElementById("administration-create-form");
    const button = document.getElementById("save-administration");
    if (!form?.reportValidity()) {
      toast("warning", "Form belum lengkap", "Lengkapi seluruh kolom bertanda wajib sebelum menyimpan.");
      return;
    }

    const fields = [...form.querySelectorAll("[data-admin-field]")].map((element) => ({
      key: element.dataset.fieldKey,
      label: element.dataset.fieldLabel,
      value: String(element.value || "").trim(),
      source: element.dataset.fieldSource || "manual",
      sortOrder: Number(element.dataset.sortOrder || 0)
    }));
    const formData = Object.fromEntries(fields.map((fieldItem) => [fieldItem.key, fieldItem.value]));
    const payload = {
      caseId,
      type,
      documentNumber: formData.documentNumber || "",
      documentDate: formData.documentDate || todayISO(),
      responsibleOfficer: formData.responsibleOfficer || state.session.user.fullName || state.session.user.username,
      notes: String(form.elements.systemNotes?.value || "").trim(),
      formFields: fields
    };

    setButtonLoading(button, true);
    try {
      if (state.selectedAdministrationFile) {
        const fileData = await readFileBase64(state.selectedAdministrationFile);
        payload.administrationFile = {
          name: state.selectedAdministrationFile.name,
          mimeType: state.selectedAdministrationFile.type || mimeFromName(state.selectedAdministrationFile.name),
          dataBase64: fileData
        };
      }

      const result = await gasRequest("createAdministration", payload);
      const index = state.cases.findIndex((caseItem) => caseItem.caseId === caseId);
      if (index >= 0) state.cases[index] = result.case;
      state.selectedAdministrationFile = null;
      state.administrationBuilder.type = "";

      toast("success", `${type} berhasil dibuat`, `Data form tersimpan dan status perkara menjadi ${getStatus(result.case.status).label}.`);
      renderSidebar();
      renderAdministrationBuilderPage();
    } catch (error) {
      toast("error", "Administrasi gagal dibuat", error.message || "Data administrasi belum berhasil disimpan.");
    } finally {
      setButtonLoading(button, false);
    }
  }

  async function renderRemindersPage() {
    if (!state.remindersLoaded) {
      els.pageContent.innerHTML = `
        <div class="panel loading-panel">
          <div class="skeleton loading-line w40"></div>
          <div class="skeleton loading-line w90"></div>
          <div class="skeleton" style="height:210px"></div>
        </div>`;
      try {
        await loadReminderData();
        renderSidebar();
        return renderRemindersPage();
      } catch (error) {
        return renderReminderLoadError(error);
      }
    }

    const selectedCase = findReminderCaseSource(state.reminderBuilder.caseId);
    const selectedType = state.reminderBuilder.type || "P-16";
    const existing = selectedCase ? findReminderForSelection(selectedCase.caseId, selectedType) : null;
    state.reminderBuilder.reminderId = existing?.reminderId || "";

    const active = state.reminders.filter((item) => String(item.status || "ACTIVE") === "ACTIVE");
    const dueSoon = active.filter((item) => getReminderDeadlineState(item).state === "warning").length;
    const overdue = active.filter((item) => getReminderDeadlineState(item).state === "overdue").length;
    const completed = state.reminders.filter((item) => String(item.status) === "COMPLETED").length;

    els.pageContent.innerHTML = `
      <section class="reminder-shell">
        <div class="reminder-hero">
          <div>
            <p class="eyebrow green">NOTIFIKASI WHATSAPP</p>
            <h2>Reminder administrasi perkara</h2>
            <p>Pilih SPDP yang sudah masuk atau pilih SPDP baru untuk mengisi data secara manual. Sistem mengirim WhatsApp otomatis pada H-3, H-1, dan Hari H.</p>
          </div>
          <div class="reminder-system-status">
            <span class="${state.reminderMeta.fonnteConfigured ? "online" : "offline"}"></span>
            <div>
              <strong>${state.reminderMeta.fonnteConfigured ? "Fonnte siap" : "Token Fonnte belum diatur"}</strong>
              <small>${state.reminderMeta.triggerInstalled ? `Trigger harian aktif sekitar pukul ${String(state.reminderMeta.triggerHour || 8).padStart(2, "0")}.00 WITA` : "Trigger otomatis belum terpasang"}</small>
            </div>
          </div>
        </div>

        <div class="stats-grid reminder-stats-grid">
          ${statCard("♢", active.length, "Reminder aktif", "blue")}
          ${statCard("◷", dueSoon, "Jatuh tempo ≤ 3 hari", "warning")}
          ${statCard("!", overdue, "Lewat deadline", "danger")}
          ${statCard("✓", completed, "Administrasi selesai", "")}
        </div>

        <div class="reminder-layout">
          <section class="panel reminder-form-panel">
            <div class="panel-header">
              <div>
                <h3>${existing ? `Edit reminder ${escapeHtml(selectedType)}` : "Tambah reminder baru"}</h3>
                <p>Memilih perkara dan jenis administrasi yang sudah pernah disimpan akan membuka data untuk diedit.</p>
              </div>
              ${existing ? `<span class="status-badge blue">Mode edit</span>` : ""}
            </div>
            <div class="panel-body">
              ${renderReminderForm(selectedCase, selectedType, existing)}
            </div>
          </section>

          <section class="panel reminder-progress-panel">
            <div class="panel-header">
              <div><h3>Progres administrasi</h3><p>Urutan P-16 sampai T-7 untuk perkara yang dipilih.</p></div>
            </div>
            <div class="panel-body">
              ${renderReminderProgress(selectedCase)}
            </div>
          </section>
        </div>

        <section class="panel reminder-list-panel">
          <div class="panel-header">
            <div>
              <h3>Daftar reminder</h3>
              <p>Riwayat pengaturan reminder dan status pengiriman WhatsApp.</p>
            </div>
            <div class="panel-actions reminder-list-actions">
              <select id="reminder-list-filter" class="compact-select">
                <option value="ALL" ${state.reminderFilter === "ALL" ? "selected" : ""}>Semua status</option>
                <option value="ACTIVE" ${state.reminderFilter === "ACTIVE" ? "selected" : ""}>Aktif</option>
                <option value="DUE" ${state.reminderFilter === "DUE" ? "selected" : ""}>Mendekati/lewat deadline</option>
                <option value="COMPLETED" ${state.reminderFilter === "COMPLETED" ? "selected" : ""}>Selesai</option>
              </select>
              <button id="reminder-refresh" class="table-action" type="button">Segarkan</button>
            </div>
          </div>
          ${renderReminderTable()}
        </section>
      </section>`;

    bindReminderPage(selectedCase, selectedType, existing);
  }

  async function loadReminderData() {
    const [reminderResult, prosecutorResult] = await Promise.all([
      gasRequest("listReminders"),
      gasRequest("listProsecutors")
    ]);
    state.reminders = Array.isArray(reminderResult.reminders) ? reminderResult.reminders : [];
    state.prosecutors = Array.isArray(prosecutorResult.prosecutors) ? prosecutorResult.prosecutors : [];
    state.reminderMeta = {
      fonnteConfigured: Boolean(reminderResult.fonnteConfigured),
      triggerInstalled: Boolean(reminderResult.triggerInstalled),
      triggerHour: Number(reminderResult.triggerHour || 8),
      timezone: reminderResult.timezone || "Asia/Makassar"
    };
    state.remindersLoaded = true;
    setConnection(true);
  }

  function renderReminderLoadError(error) {
    els.pageContent.innerHTML = `
      <div class="panel">
        <div class="empty-state">
          <div class="empty-state-icon">!</div>
          <h3>Modul reminder belum siap</h3>
          <p>${escapeHtml(error?.message || "Data reminder tidak dapat dimuat.")}</p>
          <button id="retry-reminder-load" class="primary-button" style="margin-top:18px" type="button">Coba lagi</button>
        </div>
      </div>`;
    document.getElementById("retry-reminder-load")?.addEventListener("click", () => {
      state.remindersLoaded = false;
      renderRemindersPage();
    });
  }

  function renderReminderForm(selectedCase, selectedType, existing) {
    const sources = getReminderCaseSources();
    const caseOptions = sources.map((item) => `
      <option value="${escapeAttr(item.caseId)}" ${selectedCase?.caseId === item.caseId ? "selected" : ""}>
        ${escapeHtml(item.spdpNumber || item.caseId)} — ${escapeHtml(item.suspectName || "Tanpa nama")}${item.reminderOnly ? " (reminder)" : ` (${escapeHtml(item.caseId)})`}
      </option>`).join("");
    const typeOptions = REMINDER_ADMIN_TYPES.map((item) => `
      <option value="${escapeAttr(item.code)}" ${selectedType === item.code ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("");

    if (!selectedCase) {
      return `
        <div class="form-field">
          <label for="reminder-case-select">Pilih SPDP/perkara <span class="required">*</span></label>
          <select id="reminder-case-select" required>
            <option value="">Pilih SPDP/perkara...</option>
            <option value="__NEW_SPDP__">＋ SPDP baru — isi data secara manual</option>
            ${caseOptions}
          </select>
          <small class="form-hint">Pilih SPDP baru untuk membuat reminder sebelum data perkara tersedia pada sheet Cases.</small>
        </div>
        <div class="reminder-form-placeholder">
          <span>♢</span><strong>Pilih perkara atau SPDP baru</strong><p>Data perkara lama terisi otomatis. Untuk SPDP baru, field dasar dapat diisi manual.</p>
        </div>`;
    }

    const rule = REMINDER_ADMIN_TYPES.find((item) => item.code === selectedType) || REMINDER_ADMIN_TYPES[0];
    const isNewSpdp = selectedCase.caseId === "__NEW_SPDP__";
    const source = existing || (isNewSpdp ? {} : selectedCase);
    const deadlineDays = existing
      ? String(existing.deadlineDays ?? "")
      : rule.defaultDays === null ? "" : String(rule.defaultDays);
    const isDetention = ["T-6", "T-7"].includes(selectedType);
    const preview = calculateReminderDeadlinePreview(
      selectedType,
      normalizeDateInput(source.receivedDate || selectedCase.receivedDate),
      normalizeDateInput(source.detentionEndDate),
      deadlineDays
    );

    const prosecutorOptions = state.prosecutors.map((item) => {
      const selected = String(existing?.prosecutorId || "") === String(item.id);
      return `<option value="${escapeAttr(item.id)}" ${selected ? "selected" : ""} ${item.phoneValid ? "" : "disabled"}>${escapeHtml(item.name)}</option>`;
    }).join("");

    return `
      <form id="reminder-form" novalidate>
        <input type="hidden" name="reminderId" value="${escapeAttr(existing?.reminderId || "")}" />
        <input type="hidden" name="caseId" value="${escapeAttr(isNewSpdp ? "" : selectedCase.caseId)}" />
        <input type="hidden" name="isNewSpdp" value="${isNewSpdp ? "1" : "0"}" />

        <div class="reminder-selector-grid">
          <div class="form-field">
            <label for="reminder-case-select">Pilih SPDP/perkara <span class="required">*</span></label>
            <select id="reminder-case-select" required>
              <option value="">Pilih SPDP/perkara...</option>
              <option value="__NEW_SPDP__" ${isNewSpdp ? "selected" : ""}>＋ SPDP baru — isi data secara manual</option>
              ${caseOptions}
            </select>
          </div>
          <div class="form-field">
            <label for="reminder-administration-type">Jenis Administrasi <span class="required">*</span></label>
            <select id="reminder-administration-type" name="administrationType" required>${typeOptions}</select>
            <small class="form-hint">Pilih administrasi yang sama untuk membuka dan mengedit reminder lama.</small>
          </div>
        </div>

        <div class="reminder-form-grid">
          ${reminderInput("Nomor SPDP", "spdpNumber", "text", source.spdpNumber || selectedCase.spdpNumber, true)}
          ${reminderInput("Tanggal SPDP", "spdpDate", "date", normalizeDateInput(source.spdpDate || selectedCase.spdpDate), true)}
          ${reminderInput("Nomor Sprindik", "sprindikNumber", "text", source.sprindikNumber || selectedCase.sprindikNumber, true)}
          ${reminderInput("Tanggal Sprindik", "sprindikDate", "date", normalizeDateInput(source.sprindikDate || selectedCase.sprindikDate), true)}
          ${reminderInput("Akhir masa penahanan", "detentionEndDate", "date", normalizeDateInput(source.detentionEndDate), isDetention, isDetention ? "Wajib untuk T-6 dan T-7." : "Opsional; isi jika perkara menggunakan penahanan.")}
          ${reminderInput("Tanggal SPDP diterima Kejaksaan", "receivedDate", "date", normalizeDateInput(source.receivedDate || selectedCase.receivedDate), true)}
          ${reminderInput("Nama Tersangka", "suspectName", "text", source.suspectName || selectedCase.suspectName, true)}
          <div class="form-field">
            <label for="reminder-deadline-days">${isDetention ? "Deadline (hari sebelum akhir masa penahanan)" : "Deadline (hari setelah SPDP diterima)"} <span class="required">*</span></label>
            <input id="reminder-deadline-days" name="deadlineDays" type="number" min="0" max="3650" step="1" value="${escapeAttr(deadlineDays)}" required />
            <small class="form-hint">${isDetention ? "Isi 0 untuk tepat pada akhir masa penahanan. Nilai 3 berarti deadline ditetapkan 3 hari sebelumnya." : "P-16, P-19, dan P-21 otomatis diisi 7 hari; nilainya tetap dapat disesuaikan."}</small>
          </div>
          ${selectedType === "T-7" ? `
            <div class="form-field">
              <label for="reminder-detention-category">Kategori T-7 <span class="required">*</span></label>
              <select id="reminder-detention-category" name="detentionCategory" required>
                <option value="">Pilih kategori...</option>
                <option value="ANAK" ${String(existing?.detentionCategory || "") === "ANAK" ? "selected" : ""}>Tahanan Anak</option>
                <option value="DEWASA" ${String(existing?.detentionCategory || "") === "DEWASA" ? "selected" : ""}>Tahanan Dewasa</option>
              </select>
            </div>` : ""}
          <div class="form-field">
            <label for="reminder-prosecutor">Jaksa Penanggung Jawab <span class="required">*</span></label>
            <select id="reminder-prosecutor" name="prosecutorId" required>
              <option value="">Pilih Jaksa dari sheet List Jaksa...</option>
              ${prosecutorOptions}
            </select>
            <small class="form-hint">Dropdown hanya menampilkan nama. Nomor WhatsApp tetap dibaca dari sheet List Jaksa.</small>
          </div>
          <div class="form-field full-span">
            <label for="reminder-notes">Catatan reminder</label>
            <textarea id="reminder-notes" name="notes" placeholder="Tambahkan catatan tindak lanjut bila diperlukan.">${escapeHtml(existing?.notes || "")}</textarea>
          </div>
        </div>

        <div id="reminder-deadline-preview" class="reminder-deadline-preview ${preview ? "ready" : ""}">
          <span>◷</span>
          <div><strong>${preview ? `Deadline: ${escapeHtml(formatDate(preview))}` : "Deadline belum dapat dihitung"}</strong><small>WhatsApp otomatis dikirim pada H-3, H-1, dan Hari H selama status reminder masih aktif.</small></div>
        </div>

        <div class="reminder-form-actions">
          <button id="reminder-reset-builder" class="ghost-button" type="button">Buat reminder lain</button>
          <button id="reminder-save-button" class="primary-button" type="submit">
            <span class="button-label">${existing ? "Perbarui reminder" : "Simpan reminder"}</span>
            <span class="button-spinner" hidden></span>
          </button>
        </div>
      </form>`;
  }

  function reminderInput(label, name, type, value, required, hint = "") {
    return `<div class="form-field ${name === "suspectName" ? "full-span" : ""}">
      <label for="reminder-${escapeAttr(name)}">${escapeHtml(label)} ${required ? '<span class="required">*</span>' : ""}</label>
      <input id="reminder-${escapeAttr(name)}" name="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value || "")}" ${required ? "required" : ""} />
      ${hint ? `<small class="form-hint">${escapeHtml(hint)}</small>` : ""}
    </div>`;
  }

  function getReminderCaseSources() {
    const sources = new Map();
    [...state.cases].sort(sortByUpdatedDesc).forEach((item) => {
      if (item?.caseId) sources.set(String(item.caseId), item);
    });

    // SPDP yang dibuat langsung dari menu reminder tetap muncul kembali
    // agar administrasi berikutnya dapat memakai referensi yang sama.
    [...state.reminders]
      .sort((a, b) => dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt))
      .forEach((item) => {
        const id = String(item.caseId || "");
        if (!id || sources.has(id)) return;
        sources.set(id, {
          caseId: id,
          spdpNumber: item.spdpNumber || "",
          spdpDate: item.spdpDate || "",
          sprindikNumber: item.sprindikNumber || "",
          sprindikDate: item.sprindikDate || "",
          receivedDate: item.receivedDate || "",
          detentionEndDate: item.detentionEndDate || "",
          suspectName: item.suspectName || "",
          administrations: [],
          reminderOnly: true,
          updatedAt: item.updatedAt || item.createdAt || ""
        });
      });

    return [...sources.values()].sort((a, b) => dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt));
  }

  function findReminderCaseSource(caseId) {
    if (!caseId) return null;
    if (caseId === "__NEW_SPDP__") {
      return {
        caseId: "__NEW_SPDP__",
        spdpNumber: "",
        spdpDate: "",
        sprindikNumber: "",
        sprindikDate: "",
        receivedDate: "",
        detentionEndDate: "",
        suspectName: "",
        administrations: [],
        reminderOnly: true,
        isNewSpdp: true
      };
    }
    return getReminderCaseSources().find((item) => String(item.caseId) === String(caseId)) || null;
  }

  function renderReminderProgress(selectedCase) {
    if (!selectedCase || selectedCase.caseId === "__NEW_SPDP__") {
      return `<div class="reminder-progress-empty"><span>↳</span><strong>${selectedCase ? "SPDP baru belum disimpan" : "Belum ada perkara dipilih"}</strong><small>${selectedCase ? "Progres akan terbentuk setelah reminder pertama disimpan." : "Progres akan muncul setelah memilih SPDP."}</small></div>`;
    }
    const caseReminders = state.reminders.filter((item) => item.caseId === selectedCase.caseId);
    const completedDocuments = new Set((selectedCase.administrations || []).map((item) => String(item.type || "").toUpperCase()));
    const statuses = REMINDER_PROGRESS_STAGES.map((stage) => {
      const reminder = caseReminders.find((item) => item.administrationType === stage.code);
      const done = completedDocuments.has(stage.code) || reminder?.status === "COMPLETED";
      const active = reminder?.status === "ACTIVE";
      return { ...stage, reminder, done, active };
    });
    const completedCount = statuses.filter((item) => item.done).length;
    const percentage = Math.round((completedCount / REMINDER_PROGRESS_STAGES.length) * 100);

    return `
      <div class="reminder-progress-summary">
        <div><strong>${escapeHtml(selectedCase.suspectName || selectedCase.caseId)}</strong><small>SPDP ${escapeHtml(selectedCase.spdpNumber || "-")}</small></div>
        <span>${completedCount}/${REMINDER_PROGRESS_STAGES.length}</span>
      </div>
      <div class="administration-progress"><span style="width:${percentage}%"></span></div>
      <div class="reminder-stage-list">
        ${statuses.map((item, index) => {
          const stateClass = item.done ? "complete" : item.active ? "active" : "pending";
          const statusText = item.done ? "Selesai" : item.active
            ? `Reminder aktif · ${formatDate(item.reminder.deadlineDate)}`
            : "Belum dibuat";
          return `<div class="reminder-stage-item ${stateClass}">
            <div class="reminder-stage-track"><span>${item.done ? "✓" : index + 1}</span><i></i></div>
            <div><strong>${escapeHtml(item.code)} — ${escapeHtml(item.label)}</strong><small>${escapeHtml(statusText)}</small></div>
          </div>`;
        }).join("")}
      </div>
      <p class="reminder-progress-note">P-19 dan P-21 mengikuti hasil penelitian berkas. P-18, T-6, dan T-7 dapat ditandai selesai dari daftar reminder.</p>`;
  }

  function renderReminderTable() {
    let items = [...state.reminders];
    if (state.reminderFilter === "ACTIVE") items = items.filter((item) => item.status === "ACTIVE");
    if (state.reminderFilter === "COMPLETED") items = items.filter((item) => item.status === "COMPLETED");
    if (state.reminderFilter === "DUE") items = items.filter((item) => item.status === "ACTIVE" && ["warning", "overdue"].includes(getReminderDeadlineState(item).state));
    items.sort((a, b) => dateValue(a.deadlineDate) - dateValue(b.deadlineDate));

    if (!items.length) return emptyState("♢", "Belum ada reminder", "Simpan reminder baru untuk mulai mengirim notifikasi WhatsApp.");

    return `<div class="table-wrap"><table class="reminder-table">
      <thead><tr><th>SPDP / Tersangka</th><th>Administrasi</th><th>Jaksa</th><th>Deadline</th><th>Pengiriman</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>${items.map((item) => {
        const deadline = getReminderDeadlineState(item);
        const statusTone = item.status === "COMPLETED" ? "green" : item.status === "CANCELLED" ? "gray" : deadline.state === "overdue" ? "red" : deadline.state === "warning" ? "amber" : "blue";
        const typeLabel = item.administrationType === "T-7" && item.detentionCategory
          ? `${item.administrationType} · ${item.detentionCategory === "ANAK" ? "Tahanan Anak" : "Tahanan Dewasa"}`
          : item.administrationType;
        return `<tr>
          <td><div class="case-primary">${escapeHtml(item.spdpNumber || item.caseId)}</div><div class="case-secondary">${escapeHtml(item.suspectName || "-")} · ${escapeHtml(item.caseId || "-")}</div></td>
          <td><span class="status-badge blue">${escapeHtml(typeLabel)}</span><div class="case-secondary">${Number(item.deadlineDays || 0)} hari</div></td>
          <td><div class="case-primary">${escapeHtml(item.prosecutorName || "-")}</div><div class="case-secondary">${maskPhone(item.prosecutorPhone)}</div></td>
          <td><span class="deadline-badge ${deadline.state}">${escapeHtml(deadline.label)}</span><div class="case-secondary">${formatDate(item.deadlineDate)}</div></td>
          <td>${renderReminderSendPills(item)}<div class="case-secondary">${escapeHtml(reminderLastSendLabel(item.lastSendStatus))}</div></td>
          <td><span class="status-badge ${statusTone}">${escapeHtml(reminderStatusLabel(item.status))}</span></td>
          <td><div class="reminder-row-actions">
            <button class="table-action" data-reminder-edit="${escapeAttr(item.reminderId)}" type="button">Edit</button>
            <button class="table-action" data-reminder-send="${escapeAttr(item.reminderId)}" type="button">Kirim sekarang</button>
            <button class="table-action" data-reminder-status="${escapeAttr(item.reminderId)}" data-next-status="${item.status === "COMPLETED" ? "ACTIVE" : "COMPLETED"}" type="button">${item.status === "COMPLETED" ? "Aktifkan" : "Tandai selesai"}</button>
          </div></td>
        </tr>`;
      }).join("")}</tbody>
    </table></div>`;
  }

  function renderReminderSendPills(item) {
    return `<div class="reminder-send-pills">
      <span class="${item.sentH3At ? "sent" : ""}" title="${item.sentH3At ? formatDateTime(item.sentH3At) : "Belum dikirim"}">H-3</span>
      <span class="${item.sentH1At ? "sent" : ""}" title="${item.sentH1At ? formatDateTime(item.sentH1At) : "Belum dikirim"}">H-1</span>
      <span class="${item.sentH0At ? "sent" : ""}" title="${item.sentH0At ? formatDateTime(item.sentH0At) : "Belum dikirim"}">H</span>
    </div>`;
  }

  function bindReminderPage(selectedCase, selectedType, existing) {
    document.getElementById("reminder-case-select")?.addEventListener("change", (event) => {
      state.reminderBuilder.caseId = event.target.value;
      state.reminderBuilder.reminderId = "";
      renderRemindersPage();
    });
    document.getElementById("reminder-administration-type")?.addEventListener("change", (event) => {
      state.reminderBuilder.type = event.target.value;
      state.reminderBuilder.reminderId = "";
      renderRemindersPage();
    });
    document.getElementById("reminder-form")?.addEventListener("submit", handleReminderSubmit);
    document.getElementById("reminder-reset-builder")?.addEventListener("click", () => {
      state.reminderBuilder = { caseId: "", type: "P-16", reminderId: "" };
      renderRemindersPage();
    });
    ["reminder-receivedDate", "reminder-detentionEndDate", "reminder-deadline-days"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", updateReminderDeadlinePreview);
      document.getElementById(id)?.addEventListener("change", updateReminderDeadlinePreview);
    });
    document.getElementById("reminder-list-filter")?.addEventListener("change", (event) => {
      state.reminderFilter = event.target.value;
      renderRemindersPage();
    });
    document.getElementById("reminder-refresh")?.addEventListener("click", async () => {
      state.remindersLoaded = false;
      await renderRemindersPage();
    });

    document.querySelectorAll("[data-reminder-edit]").forEach((button) => button.addEventListener("click", () => {
      const reminder = state.reminders.find((item) => item.reminderId === button.dataset.reminderEdit);
      if (!reminder) return;
      state.reminderBuilder = { caseId: reminder.caseId, type: reminder.administrationType, reminderId: reminder.reminderId };
      window.scrollTo({ top: 0, behavior: "smooth" });
      renderRemindersPage();
    }));

    document.querySelectorAll("[data-reminder-send]").forEach((button) => button.addEventListener("click", async () => {
      const reminder = state.reminders.find((item) => item.reminderId === button.dataset.reminderSend);
      if (!reminder) return;
      if (!window.confirm(`Kirim reminder ${reminder.administrationType} sekarang kepada ${reminder.prosecutorName}?`)) return;
      button.disabled = true;
      try {
        await gasRequest("sendReminderNow", { reminderId: reminder.reminderId });
        toast("success", "WhatsApp masuk antrean", `Reminder dikirim kepada ${reminder.prosecutorName}.`);
        await loadReminderData();
        renderSidebar();
        renderRemindersPage();
      } catch (error) {
        toast("error", "Pengiriman gagal", error.message);
      } finally {
        button.disabled = false;
      }
    }));

    document.querySelectorAll("[data-reminder-status]").forEach((button) => button.addEventListener("click", async () => {
      const nextStatus = button.dataset.nextStatus;
      button.disabled = true;
      try {
        await gasRequest("updateReminderStatus", { reminderId: button.dataset.reminderStatus, status: nextStatus });
        toast("success", "Status diperbarui", nextStatus === "COMPLETED" ? "Administrasi ditandai selesai." : "Reminder diaktifkan kembali.");
        await loadReminderData();
        renderSidebar();
        renderRemindersPage();
      } catch (error) {
        toast("error", "Status gagal diperbarui", error.message);
      } finally {
        button.disabled = false;
      }
    }));
  }

  async function handleReminderSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = document.getElementById("reminder-save-button");
    setButtonLoading(button, true);
    try {
      const data = new FormData(form);
      const payload = {};
      data.forEach((value, key) => { payload[key] = String(value || "").trim(); });
      const result = await gasRequest("saveReminder", payload);
      state.reminderBuilder = {
        caseId: result.reminder.caseId,
        type: result.reminder.administrationType,
        reminderId: result.reminder.reminderId
      };
      toast("success", "Reminder tersimpan", `${result.reminder.administrationType} · deadline ${formatDate(result.reminder.deadlineDate)}.`);
      await loadReminderData();
      renderSidebar();
      renderRemindersPage();
    } catch (error) {
      toast("error", "Reminder gagal disimpan", error.message || "Periksa kembali data reminder.");
    } finally {
      setButtonLoading(button, false);
    }
  }

  function updateReminderDeadlinePreview() {
    const type = document.getElementById("reminder-administration-type")?.value || state.reminderBuilder.type;
    const received = document.getElementById("reminder-receivedDate")?.value || "";
    const detention = document.getElementById("reminder-detentionEndDate")?.value || "";
    const days = document.getElementById("reminder-deadline-days")?.value || "";
    const date = calculateReminderDeadlinePreview(type, received, detention, days);
    const node = document.getElementById("reminder-deadline-preview");
    if (!node) return;
    node.classList.toggle("ready", Boolean(date));
    node.querySelector("strong").textContent = date ? `Deadline: ${formatDate(date)}` : "Deadline belum dapat dihitung";
  }

  function calculateReminderDeadlinePreview(type, receivedDate, detentionEndDate, daysValue) {
    if (daysValue === "" || daysValue === null || daysValue === undefined) return "";
    const days = Number(daysValue);
    if (!Number.isInteger(days) || days < 0) return "";
    const base = ["T-6", "T-7"].includes(type) ? detentionEndDate : receivedDate;
    if (!base) return "";
    return addDays(base, ["T-6", "T-7"].includes(type) ? -days : days);
  }

  function findReminderForSelection(caseId, type) {
    return state.reminders.find((item) => item.caseId === caseId && item.administrationType === type) || null;
  }

  function getReminderDeadlineState(item) {
    const days = Number.isFinite(Number(item.daysRemaining))
      ? Number(item.daysRemaining)
      : item.deadlineDate ? Math.ceil((parseLocalDate(item.deadlineDate) - startOfDay(new Date())) / 86400000) : null;
    if (days === null) return { state: "safe", label: "Belum ditentukan", days: null };
    if (days < 0) return { state: "overdue", label: `Lewat ${Math.abs(days)} hari`, days };
    if (days <= 3) return { state: "warning", label: days === 0 ? "Hari ini" : `${days} hari lagi`, days };
    return { state: "safe", label: `${days} hari lagi`, days };
  }

  function reminderStatusLabel(status) {
    return status === "COMPLETED" ? "Selesai" : status === "CANCELLED" ? "Dibatalkan" : "Aktif";
  }

  function reminderLastSendLabel(status) {
    const labels = {
      H3_SUCCESS: "H-3 berhasil dikirim",
      H1_SUCCESS: "H-1 berhasil dikirim",
      H0_SUCCESS: "Hari H berhasil dikirim",
      MANUAL_SUCCESS: "Pengiriman manual berhasil",
      H3_FAILED: "Pengiriman H-3 gagal",
      H1_FAILED: "Pengiriman H-1 gagal",
      H0_FAILED: "Pengiriman Hari H gagal",
      ADMINISTRATION_CREATED: "Selesai otomatis dari administrasi"
    };
    return labels[status] || "Belum ada pengiriman";
  }

  function maskPhone(value) {
    const number = String(value || "");
    if (number.length < 7) return number || "-";
    return `${number.slice(0, 4)}••••${number.slice(-3)}`;
  }

  function renderDeadlineList(cases) {
    if (!cases.length) return emptyState("◷", "Belum ada tenggat", "Tentukan tanggal tenggat pada detail perkara.");
    return `<div class="deadline-list">${cases.map((item) => {
      const deadline = getDeadlineState(item);
      return `<button type="button" class="deadline-item ${deadline.state}" data-case-id="${escapeAttr(item.caseId)}" style="width:100%;background:white;text-align:left">
        <span class="deadline-dot"></span>
        <span><strong>${escapeHtml(item.suspectName || item.caseId)}</strong><small>${escapeHtml(getStatus(item.status).label)} · ${formatDate(item.deadlineDate)} · ${escapeHtml(deadline.label)}</small></span>
      </button>`;
    }).join("")}</div>`;
  }

  function bindModalClose() {
    els.modalRoot.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
    els.modalRoot.querySelector(".modal-backdrop")?.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-backdrop")) closeModal();
    });
  }

  function closeModal() { state.selectedAdministrationFile = null; els.modalRoot.innerHTML = ""; }

  function navigate(page) {
    state.activePage = page;
    renderSidebar();
    renderActivePage();
  }

  async function checkConnection() {
    try {
      await gasRequest("health", {}, { auth: false, silent: true, timeout: 20000 });
      setConnection(true);
    } catch {
      setConnection(false);
    }
  }

  function setConnection(online) {
    state.connected = online;
    els.connectionIndicator.classList.toggle("online", online);
    els.connectionIndicator.classList.toggle("offline", !online);
    els.connectionIndicator.querySelector("small").textContent = online ? "Backend terhubung" : "Backend tidak terhubung";
  }

  async function gasRequest(action, payload = {}, options = {}) {
    if (CONFIG.DEMO_MODE) return demoRequest(action, payload);
    if (!CONFIG.APPS_SCRIPT_URL || !CONFIG.APPS_SCRIPT_URL.startsWith("https://script.google.com/")) {
      throw new Error("URL Google Apps Script belum dikonfigurasi.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || CONFIG.REQUEST_TIMEOUT_MS || 120000);
    const body = {
      action,
      payload,
      token: options.auth === false ? "" : (state.session?.token || "")
    };

    try {
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error("Respons backend tidak valid. Pastikan deployment Apps Script menggunakan versi kode terbaru."); }
      if (!response.ok || !data.success) throw new Error(data.message || `Permintaan gagal (${response.status}).`);
      return data.data || {};
    } catch (error) {
      if (error.name === "AbortError") throw new Error("Permintaan terlalu lama. Periksa koneksi atau ukuran dokumen.");
      if (!options.silent) setConnection(false);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function demoRequest(action, payload) {
    const demoCases = JSON.parse(localStorage.getItem("siap_pidum_demo_cases") || "[]");
    if (action === "health") return Promise.resolve({ status: "ok" });
    if (action === "login") {
      const valid = (payload.role === "jaksa" && payload.username === "jaksa" && payload.password === "Jaksa@123") ||
        (payload.role === "penyidik" && payload.username === "penyidik" && payload.password === "Penyidik@123");
      if (!valid) return Promise.reject(new Error("Akun demo tidak sesuai."));
      return Promise.resolve({ token: "demo-token", user: { username: payload.username, role: payload.role, fullName: payload.role === "jaksa" ? "Jaksa Demo" : "Penyidik Demo" } });
    }
    if (action === "me") return Promise.resolve({ user: state.session.user });
    if (action === "listCases") return Promise.resolve({
      cases: demoCases.map((item) => ({
        ...item,
        administrations: Array.isArray(item.administrations) ? item.administrations : [],
        administrationProgress: {
          completed: Array.isArray(item.administrations) ? item.administrations.length : 0,
          total: ADMINISTRATION_STAGES.length
        }
      }))
    });
    if (action === "submitCase") {
      const now = new Date().toISOString();
      const item = {
        ...payload,
        spdpFile: undefined,
        caseId: `DEMO-${Date.now()}`,
        status: "SPDP_DITERIMA",
        createdAt: now,
        updatedAt: now,
        deadlineDate: addDays(payload.receivedDate, 3),
        administrations: [],
        administrationProgress: { completed: 0, total: ADMINISTRATION_STAGES.length }
      };
      demoCases.push(item);
      localStorage.setItem("siap_pidum_demo_cases", JSON.stringify(demoCases));
      return Promise.resolve({ caseId: item.caseId });
    }
    if (action === "createAdministration") {
      const index = demoCases.findIndex((item) => item.caseId === payload.caseId);
      if (index < 0) return Promise.reject(new Error("Perkara tidak ditemukan."));

      const stage = ADMINISTRATION_STAGES.find((item) => item.code === payload.type);
      if (!stage) return Promise.reject(new Error("Jenis administrasi tidak valid."));

      const administrations = Array.isArray(demoCases[index].administrations) ? demoCases[index].administrations : [];
      if (administrations.some((item) => item.type === payload.type)) {
        return Promise.reject(new Error(`${payload.type} sudah dibuat untuk perkara ini.`));
      }

      const completed = new Set(administrations.map((item) => item.type));
      const missing = stage.prerequisites.filter((code) => !completed.has(code));
      if (missing.length) return Promise.reject(new Error(`Administrasi ${missing.join(", ")} harus dibuat terlebih dahulu.`));
      if (payload.type === "P-19" && completed.has("P-21")) {
        return Promise.reject(new Error("P-19 tidak dapat dibuat karena P-21 sudah diterbitkan."));
      }

      const now = new Date().toISOString();
      const record = {
        administrationId: `ADM-${Date.now()}`,
        caseId: payload.caseId,
        type: payload.type,
        title: stage.title,
        documentNumber: payload.documentNumber,
        documentDate: payload.documentDate,
        responsibleOfficer: payload.responsibleOfficer,
        notes: payload.notes || "",
        suspectName: demoCases[index].suspectName || "",
        schemaVersion: "B310-2026-v1",
        fieldCount: Array.isArray(payload.formFields) ? payload.formFields.length : 0,
        formFields: Array.isArray(payload.formFields) ? payload.formFields : [],
        formData: Object.fromEntries((Array.isArray(payload.formFields) ? payload.formFields : []).map((fieldItem) => [fieldItem.key, fieldItem.value])),
        fileName: payload.administrationFile?.name || "",
        fileUrl: "",
        createdBy: state.session.user.username,
        createdByName: state.session.user.fullName,
        createdAt: now,
        updatedAt: now
      };
      administrations.push(record);

      let deadlineDate = "";
      let deadlineType = "";
      if (payload.type === "P-1A") {
        deadlineDate = demoCases[index].deadlineDate || addDays(payload.documentDate, 3);
        deadlineType = demoCases[index].deadlineType || "Koordinasi awal paling lama 3 hari";
      } else if (payload.type === "P-16") {
        deadlineDate = addDays(payload.documentDate, 3);
        deadlineType = "Koordinasi awal paling lama 3 hari";
      } else if (payload.type === "P-19") {
        deadlineDate = addDays(payload.documentDate, 14);
        deadlineType = "Penyidikan tambahan setelah P-19";
      } else if (payload.type === "P-21") {
        deadlineDate = addDays(payload.documentDate, 14);
        deadlineType = "Penyerahan tersangka dan barang bukti";
      }

      demoCases[index] = {
        ...demoCases[index],
        status: stage.status,
        statusUpdatedAt: now,
        updatedAt: now,
        prosecutorName: payload.type === "P-16" || !demoCases[index].prosecutorName
          ? payload.responsibleOfficer
          : demoCases[index].prosecutorName,
        deadlineDate,
        deadlineType,
        administrations,
        administrationProgress: { completed: administrations.length, total: ADMINISTRATION_STAGES.length }
      };

      localStorage.setItem("siap_pidum_demo_cases", JSON.stringify(demoCases));
      return Promise.resolve({ case: demoCases[index], administration: record });
    }
    if (action === "updateCase") {
      const index = demoCases.findIndex((item) => item.caseId === payload.caseId);
      if (index < 0) return Promise.reject(new Error("Perkara tidak ditemukan."));
      demoCases[index] = { ...demoCases[index], ...payload.updates, updatedAt: new Date().toISOString() };
      localStorage.setItem("siap_pidum_demo_cases", JSON.stringify(demoCases));
      return Promise.resolve({ case: demoCases[index] });
    }
    return Promise.reject(new Error("Aksi demo tidak tersedia."));
  }

  function filterCases(cases) {
    const q = state.search.trim().toLowerCase();
    return cases.filter((item) => {
      const haystack = [item.caseId, item.suspectName, item.investigatorName, item.investigatorInstitution, item.spdpNumber, item.allegedArticle].join(" ").toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      const matchesStatus = state.statusFilter === "ALL" || item.status === state.statusFilter;
      const matchesDeadline = state.deadlineFilter === "ALL" || getDeadlineState(item).state === state.deadlineFilter;
      return matchesSearch && matchesStatus && matchesDeadline;
    });
  }

  function getStatus(value) { return STATUS[value] || { label: value || "Belum ditentukan", tone: "gray" }; }

  function getDeadlineState(item) {
    if (!item.deadlineDate) return { state: "safe", label: "Belum ditentukan", days: null };
    const deadline = parseLocalDate(item.deadlineDate);
    const today = startOfDay(new Date());
    const diff = Math.ceil((deadline - today) / 86400000);
    if (diff < 0) return { state: "overdue", label: `${Math.abs(diff)} hari terlambat`, days: diff };
    if (diff <= 3) return { state: "warning", label: diff === 0 ? "Hari ini" : `${diff} hari lagi`, days: diff };
    return { state: "safe", label: `${diff} hari lagi`, days: diff };
  }

  function formSection(number, title, description, body) {
    return `<section class="form-section"><div class="form-section-header"><span class="form-section-number">${number}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div></div><div class="form-section-body">${body}</div></section>`;
  }

  function field(label, name, type = "text", required = false, value = "", hint = "") {
    return `<div class="form-field"><label for="${escapeAttr(name)}">${escapeHtml(label)} ${required ? '<span class="required">*</span>' : ""}</label><input id="${escapeAttr(name)}" name="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value || "")}" ${required ? "required" : ""} />${hint ? `<small class="form-hint">${escapeHtml(hint)}</small>` : ""}</div>`;
  }

  function selectField(label, name, options, required = false, selected = "") {
    const normalized = options.map((item) => typeof item === "string" ? { value: item, label: item } : item);
    return `<div class="form-field"><label for="${escapeAttr(name)}">${escapeHtml(label)} ${required ? '<span class="required">*</span>' : ""}</label><select id="${escapeAttr(name)}" name="${escapeAttr(name)}" ${required ? "required" : ""}><option value="">Pilih...</option>${normalized.map((item) => `<option value="${escapeAttr(item.value)}" ${String(selected) === String(item.value) ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>`;
  }

  function detail(label, value, full = false) {
    return `<div class="detail-item ${full ? "full-span" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
  }

  function statCard(icon, value, label, tone) {
    return `<article class="stat-card ${tone}"><div class="stat-card-top"><div class="stat-icon">${icon}</div></div><div class="stat-value">${Number(value || 0).toLocaleString("id-ID")}</div><div class="stat-label">${escapeHtml(label)}</div></article>`;
  }

  function emptyState(icon, title, message) {
    return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`;
  }

  function setButtonLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    const label = button.querySelector(".button-label");
    const spinner = button.querySelector(".button-spinner");
    if (spinner) spinner.hidden = !loading;
    if (label) label.style.opacity = loading ? ".7" : "1";
  }

  function readFileBase64(file, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Dokumen gagal dibaca."));
      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 70));
      };
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.includes(",") ? result.split(",")[1] : result);
      };
      reader.readAsDataURL(file);
    });
  }

  function toast(type, title, message) {
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.innerHTML = `<span>${type === "success" ? "✓" : type === "error" ? "!" : "◆"}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message || "")}</p></div>`;
    els.toastRoot.appendChild(node);
    setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(-6px)";
      setTimeout(() => node.remove(), 220);
    }, 4400);
  }

  function setCurrentDate() {
    els.currentDate.textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function escapeAttr(value) { return escapeHtml(value); }
  function initials(value) { return String(value || "U").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }
  function firstName(value) { return String(value || "Pengguna").trim().split(/\s+/)[0]; }
  function todayISO() { return `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`; }
  function parseLocalDate(value) {
    if (!value) return new Date(0);
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(value);
  }
  function dateValue(value) { const date = value ? new Date(value) : new Date(0); return Number.isNaN(date.getTime()) ? 0 : date.getTime(); }
  function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
  function formatDate(value) {
    if (!value) return "-";
    const date = parseLocalDate(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  }
  function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }
  function normalizeDateInput(value) {
    if (!value) return "";
    const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : "";
  }
  function normalizeDateTimeInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function calculateAge(dateString) {
    if (!dateString) return -1;
    const birth = parseLocalDate(dateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age;
  }
  function addDays(dateString, days) {
    const date = parseLocalDate(dateString);
    date.setDate(date.getDate() + days);
    const pad = (number) => String(number).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function formatBytes(bytes) {
    if (!Number(bytes)) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / (1024 ** index)).toFixed(index ? 2 : 0)} ${units[index]}`;
  }
  function mimeFromName(name) {
    return String(name).toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  function sortByUpdatedDesc(a, b) { return dateValue(b.updatedAt || b.createdAt) - dateValue(a.updatedAt || a.createdAt); }
  function debounce(fn, wait) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
  }
})();
