/* =========================================================
   Cases page logic — list + selected case detail
   ========================================================= */

(function () {
  let cases = [];
  let citizens = {};

  function statusBadge(s) {
    const map = { "Resolved": "success", "Open": "warn", "Escalated": "danger", "In review": "info" };
    return `<span class="badge badge--${map[s] || "info"}">${s}</span>`;
  }

  function priorityBadge(p) {
    const map = { Low: "info", Medium: "warn", High: "danger" };
    return `<span class="badge badge--${map[p]}">${p}</span>`;
  }

  function renderList() {
    const filter = document.getElementById("statusFilter").value;
    const rows = filter ? cases.filter(c => c.status === filter) : cases;
    document.getElementById("caseRows").innerHTML = rows.map(c => `
      <tr data-case="${c.id}" style="cursor:pointer;">
        <td><strong>${c.id}</strong></td>
        <td>${c.title}</td>
        <td>${citizens[c.citizenId]?.name || c.citizenId}</td>
        <td>${priorityBadge(c.priority)}</td>
        <td>${statusBadge(c.status)}</td>
        <td><small>${c.opened}</small></td>
      </tr>`).join("");
  }

  function renderDetail(id) {
    const c = cases.find(x => x.id === id);
    if (!c) return;
    const citizen = citizens[c.citizenId];
    const isCitizen = window.Services?.isCitizen && window.Services.isCitizen();

    document.getElementById("caseTitle").textContent = `${c.id} — ${c.title}`;

    if (isCitizen) {
      // Citizen-facing read-only view with comment + withdraw
      document.getElementById("caseDetail").innerHTML = `
        <div class="grid grid-2 mb-4">
          <div><strong>Status</strong><br/>${statusBadge(c.status)}</div>
          <div><strong>Priority</strong><br/>${priorityBadge(c.priority)}</div>
        </div>
        <div><strong>Opened:</strong> ${c.opened}</div>
        <div class="mt-2"><strong>Assigned to:</strong> ${c.assignedTo || "Unassigned"}</div>
        <div class="form-field mt-4">
          <label>Add a comment for the agent</label>
          <textarea id="caseComment" placeholder="Provide more details or follow up…"></textarea>
        </div>
        <div class="btn-group mt-4">
          <button class="btn btn--primary" id="caseAddComment">Send comment</button>
          ${c.status !== "Resolved" ? `<button class="btn btn--ghost" id="caseWithdraw">Withdraw request</button>` : ""}
        </div>
      `;
      document.getElementById("caseAddComment").addEventListener("click", async () => {
        const note = document.getElementById("caseComment").value.trim();
        if (!note) { window.Toast?.show("Please enter a comment first.", "warn"); return; }
        await window.Services.updateCase(c.id, { note, by: "citizen" });
        document.getElementById("caseComment").value = "";
        window.Toast?.show("Comment sent to agent.");
      });
      const withdraw = document.getElementById("caseWithdraw");
      if (withdraw) withdraw.addEventListener("click", async () => {
        await window.Services.updateCase(c.id, { status: "Resolved", note: "Withdrawn by citizen" });
        c.status = "Resolved";
        window.Toast?.show("Request withdrawn.", "info");
        renderList(); renderDetail(c.id);
      });
    } else {
      document.getElementById("caseDetail").innerHTML = `
      <div class="grid grid-2 mb-4">
        <div><strong>Status</strong><br/>
          <select class="mt-2" id="caseStatus">
            ${["Open","In review","Escalated","Resolved"].map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <div><strong>Priority</strong><br/>
          <select class="mt-2" id="casePriority">
            ${["Low","Medium","High"].map(p => `<option ${p === c.priority ? "selected" : ""}>${p}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="form-field">
        <label>Notes</label>
        <textarea id="caseNotes" placeholder="Add a note about this case…"></textarea>
      </div>

      <div class="btn-group mt-4">
        <button class="btn btn--ghost" id="caseSave">Save changes</button>
        <button class="btn btn--danger" id="caseEscalate">Escalate</button>
        <button class="btn btn--primary" id="caseResolve">Mark resolved</button>
      </div>
    `;

    document.getElementById("caseSave").addEventListener("click", async () => {
      const patch = {
        status: document.getElementById("caseStatus").value,
        priority: document.getElementById("casePriority").value,
        note: document.getElementById("caseNotes").value,
      };
      await window.Services.updateCase(c.id, patch);
      Object.assign(c, { status: patch.status, priority: patch.priority });
      window.Toast?.show(`Case ${c.id} updated.`);
      renderList();
    });
    document.getElementById("caseEscalate").addEventListener("click", async () => {
      await window.Services.updateCase(c.id, { status: "Escalated" });
      c.status = "Escalated";
      window.Toast?.show(`Case ${c.id} escalated to supervisor.`, "warn");
      renderList(); renderDetail(c.id);
    });
    document.getElementById("caseResolve").addEventListener("click", async () => {
      await window.Services.updateCase(c.id, { status: "Resolved" });
      c.status = "Resolved";
      await window.Services.logResolution({ citizenId: c.citizenId, notes: document.getElementById("caseNotes").value });
      window.Toast?.show(`Case ${c.id} resolved.`, "success");
      renderList(); renderDetail(c.id);
    });
    } // end agent branch

    document.getElementById("caseCitizen").innerHTML = citizen ? `
      <div class="flex items-center gap-3 mb-3">
        <span class="avatar">${citizen.name.split(" ").map(s=>s[0]).slice(0,2).join("")}</span>
        <div>
          <strong>${isCitizen ? citizen.name : `<a href="citizen-profile.html?id=${citizen.id}">${citizen.name}</a>`}</strong><br/>
          <small class="text-muted">${citizen.id} · ${citizen.tier} tier</small>
        </div>
      </div>
      <div><strong>Email:</strong> ${citizen.email}</div>
      <div class="mt-2"><strong>Phone:</strong> ${citizen.phone}</div>
      <div class="mt-2"><strong>Points:</strong> ${citizen.points.toLocaleString()}</div>
    ` : `<div class="empty-state">Citizen not found</div>`;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    cases = await window.Services.fetchCases();
    const list = await window.Services.fetchCitizens();
    citizens = Object.fromEntries(list.map(c => [c.id, c]));
    renderList();

    document.getElementById("statusFilter").addEventListener("change", renderList);

    document.getElementById("caseRows").addEventListener("click", (e) => {
      const row = e.target.closest("[data-case]");
      if (row) renderDetail(row.getAttribute("data-case"));
    });
  });
})();
