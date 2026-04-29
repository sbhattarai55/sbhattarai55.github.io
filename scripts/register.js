/* =========================================================
   Registration wizard — role-aware multi-step flow.
   Steps: 1) role  2) account  3) profile  4) review  → success
   ========================================================= */

(function () {
  const state = {
    step: 1,
    role: null,    // "citizen" | "agent" | "supervisor"
    account: {},   // name, email, password, phone
    profile: {},   // role-specific fields
    consents: {},  // terms, updates
  };

  const ROLE_COPY = {
    citizen: {
      step2Lede: "Use your personal email — we'll send you a verification link.",
      emailLabel: "Email",
      emailHint: "",
      step3Title: "Tell us about yourself",
      step3Lede: "We use this to personalize your dashboard and recommend programs near you.",
      successTitle: "You're all set!",
      successBody: "Your citizen account is active. Start earning loyalty points by engaging with city services.",
      successHref: "citizen-dashboard.html",
      successCta: "Open my dashboard",
    },
    agent: {
      step2Lede: "Use your government work email so we can verify your role.",
      emailLabel: "Work email",
      emailHint: "Must end in a recognized government domain (e.g. @city.gov).",
      step3Title: "Your work profile",
      step3Lede: "We'll route cases and metrics based on your department and channels.",
      successTitle: "Welcome aboard, agent!",
      successBody: "Your account is active. Open the agent dashboard to start handling citizen requests.",
      successHref: "agent-dashboard.html",
      successCta: "Open agent dashboard",
    },
    supervisor: {
      step2Lede: "Use your government work email so we can verify your role.",
      emailLabel: "Work email",
      emailHint: "Must end in a recognized government domain (e.g. @city.gov).",
      step3Title: "Your team & responsibilities",
      step3Lede: "These details determine the scope of your insights dashboard and approval queue.",
      successTitle: "Registration submitted",
      successBody: "Your supervisor account is pending director approval. You'll receive an email when activated. For now, you can preview the supervisor dashboard.",
      successHref: "insights.html",
      successCta: "Preview insights dashboard",
    },
  };

  // ---- DOM helpers ----
  const $ = (id) => document.getElementById(id);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function showStep(step) {
    state.step = step;
    qa("[data-step-panel]").forEach((p) => {
      p.classList.toggle("is-active", p.getAttribute("data-step-panel") === String(step));
    });
    qa(".reg-stepper__item").forEach((el) => {
      const n = Number(el.getAttribute("data-step"));
      el.classList.toggle("is-active", n === Number(step));
      el.classList.toggle("is-done", typeof step === "number" && n < step);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---- Step 1: role selection ----
  function setupRoleStep() {
    qa("[data-role]").forEach((btn) => {
      btn.addEventListener("click", () => {
        qa("[data-role]").forEach((b) => {
          b.classList.remove("is-selected");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-checked", "true");
        state.role = btn.getAttribute("data-role");
        $("step1Next").disabled = false;
      });
    });

    $("step1Next").addEventListener("click", () => {
      if (!state.role) return;
      applyRoleCopy();
      showStep(2);
    });
  }

  function applyRoleCopy() {
    const c = ROLE_COPY[state.role];
    $("step2Lede").textContent = c.step2Lede;
    $("regEmailLabel").textContent = c.emailLabel;
    $("regEmailHint").textContent = c.emailHint;
    $("step3Title").textContent = c.step3Title;
    $("step3Lede").textContent = c.step3Lede;

    // Show only the matching profile form
    $("citizenProfileForm").hidden = state.role !== "citizen";
    $("agentProfileForm").hidden = state.role !== "agent";
    $("supervisorProfileForm").hidden = state.role !== "supervisor";
  }

  // ---- Step 2: account form ----
  function passwordStrength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s; // 0..4
  }

  function setupAccountStep() {
    const pw = $("regPassword");
    const fill = $("pwMeterFill");
    pw.addEventListener("input", () => {
      const s = passwordStrength(pw.value);
      const pct = (s / 4) * 100;
      fill.style.width = pct + "%";
      fill.dataset.strength = String(s);
    });

    $("step2Next").addEventListener("click", () => {
      const errors = [];
      const name = $("regFullName").value.trim();
      const email = $("regEmail").value.trim();
      const password = pw.value;
      const confirm = $("regPasswordConfirm").value;
      const phone = $("regPhone").value.trim();

      if (!name) errors.push("Full name is required.");
      if (!/^\S+@\S+\.\S+$/.test(email)) errors.push("Enter a valid email address.");
      if (state.role !== "citizen" && !/@(city\.gov|gov|state\.us)$/i.test(email)) {
        errors.push("Government email required for agents and supervisors.");
      }
      if (passwordStrength(password) < 3) errors.push("Choose a stronger password (8+ chars, mixed case, number).");
      if (password !== confirm) errors.push("Passwords do not match.");

      if (errors.length) {
        window.Toast?.show(errors[0], "danger");
        return;
      }

      state.account = { name, email, password, phone };
      showStep(3);
    });
  }

  // ---- Step 3: role-specific profile ----
  function collectProfile() {
    if (state.role === "citizen") {
      const channel = (document.querySelector("input[name='citChannel']:checked") || {}).value || "Email";
      const interests = qa("input[name='citInterest']:checked").map((i) => i.value);
      return {
        address: $("citAddress").value.trim(),
        city: $("citCity").value.trim(),
        zip: $("citZip").value.trim(),
        channel, interests,
        accessibility: $("citAccessibility").checked,
      };
    }
    if (state.role === "agent") {
      const channels = qa("input[name='agChannel']:checked").map((i) => i.value);
      return {
        employeeId: $("agEmployeeId").value.trim(),
        department: $("agDepartment").value,
        supervisor: $("agSupervisor").value.trim(),
        channels,
        languages: $("agLanguages").value.trim(),
      };
    }
    return {
      employeeId: $("svEmployeeId").value.trim(),
      department: $("svDepartment").value,
      teamSize: $("svTeamSize").value,
      region: $("svRegion").value.trim(),
      director: $("svDirector").value.trim(),
    };
  }

  function validateProfile(p) {
    if (state.role === "citizen") {
      if (!p.address || !p.city || !p.zip) return "Please complete your address.";
      if (!/^\d{5}(-\d{4})?$/.test(p.zip)) return "Enter a valid ZIP code.";
    } else {
      if (!p.employeeId) return "Employee ID is required.";
      if (!p.department) return "Please select a department.";
      if (state.role === "agent" && !/^\S+@\S+\.\S+$/.test(p.supervisor)) return "Supervisor email is required.";
      if (state.role === "supervisor" && !/^\S+@\S+\.\S+$/.test(p.director)) return "Director email is required.";
    }
    return null;
  }

  function setupProfileStep() {
    $("step3Next").addEventListener("click", () => {
      const profile = collectProfile();
      const err = validateProfile(profile);
      if (err) { window.Toast?.show(err, "danger"); return; }
      state.profile = profile;
      renderReview();
      showStep(4);
    });
  }

  // ---- Step 4: review & submit ----
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function renderReview() {
    const a = state.account;
    const p = state.profile;
    const rows = [
      ["Role", state.role[0].toUpperCase() + state.role.slice(1)],
      ["Name", a.name],
      ["Email", a.email],
      ["Phone", a.phone || "—"],
    ];
    if (state.role === "citizen") {
      rows.push(["Address", `${p.address}, ${p.city} ${p.zip}`]);
      rows.push(["Preferred contact", p.channel]);
      rows.push(["Interests", p.interests.length ? p.interests.join(", ") : "—"]);
      if (p.accessibility) rows.push(["Accommodations", "Requested"]);
    } else if (state.role === "agent") {
      rows.push(["Employee ID", p.employeeId]);
      rows.push(["Department", p.department]);
      rows.push(["Supervisor", p.supervisor]);
      rows.push(["Channels", p.channels.join(", ") || "—"]);
      if (p.languages) rows.push(["Languages", p.languages]);
    } else {
      rows.push(["Employee ID", p.employeeId]);
      rows.push(["Department", p.department]);
      rows.push(["Team size", p.teamSize || "—"]);
      rows.push(["Region", p.region || "—"]);
      rows.push(["Director", p.director]);
    }

    $("reviewSummary").innerHTML = rows.map(([k, v]) => `
      <div class="review-row">
        <span class="review-row__label">${escapeHtml(k)}</span>
        <span class="review-row__value">${escapeHtml(v)}</span>
      </div>`).join("");
  }

  function setupReviewStep() {
    const cb = $("agreeTerms");
    cb.addEventListener("change", () => {
      $("submitRegistration").disabled = !cb.checked;
    });

    $("submitRegistration").addEventListener("click", async () => {
      $("submitRegistration").disabled = true;
      $("submitRegistration").textContent = "Creating account…";

      // TODO: POST /api/auth/register — for now simulate + auto sign-in
      try {
        await window.Services.register({
          role: state.role,
          account: state.account,
          profile: state.profile,
          consents: {
            terms: $("agreeTerms").checked,
            updates: $("agreeUpdates").checked,
          },
        });
        await window.Services.login(state.role);
        showSuccess();
      } catch (e) {
        window.Toast?.show("Sorry, something went wrong. Please try again.", "danger");
        $("submitRegistration").disabled = false;
        $("submitRegistration").textContent = "Create account";
      }
    });
  }

  function showSuccess() {
    const c = ROLE_COPY[state.role];
    $("successTitle").textContent = c.successTitle;
    $("successBody").textContent = c.successBody;
    const cta = $("successCta");
    cta.textContent = c.successCta;
    cta.setAttribute("href", c.successHref);
    showStep("success");
    qa(".reg-stepper__item").forEach((el) => el.classList.add("is-done"));
  }

  // ---- Back buttons ----
  function setupBack() {
    qa("[data-reg-back]").forEach((b) => {
      b.addEventListener("click", () => {
        if (state.step > 1) showStep(state.step - 1);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupRoleStep();
    setupAccountStep();
    setupProfileStep();
    setupReviewStep();
    setupBack();
  });
})();
