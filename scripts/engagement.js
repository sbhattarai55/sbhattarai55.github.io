/* =========================================================
   Engagement history page logic
   ========================================================= */

(function () {
  let allEvents = [];
  let citizens = {};

  function applyFilters() {
    const q = document.getElementById("filterQuery").value.toLowerCase();
    const type = document.getElementById("filterType").value;
    const channel = document.getElementById("filterChannel").value;
    return allEvents.filter(e =>
      (!q || e.description.toLowerCase().includes(q)) &&
      (!type || e.type === type) &&
      (!channel || e.channel === channel)
    );
  }

  function renderTable(rows) {
    return `
      <table class="data-table">
        <thead><tr><th>Date</th><th>Citizen</th><th>Type</th><th>Channel</th><th>Description</th><th>Points</th></tr></thead>
        <tbody>${rows.map(e => `<tr>
          <td>${e.date}</td>
          <td>${citizens[e.citizenId]?.name || e.citizenId}</td>
          <td><span class="badge">${e.type}</span></td>
          <td>${e.channel}</td>
          <td>${e.description}</td>
          <td>+${e.points}</td>
        </tr>`).join("")}</tbody>
      </table>`;
  }

  function renderTimeline(rows) {
    return `<div class="timeline" style="padding:16px;">${rows.map(e => `
      <div class="timeline__item">
        <div class="timeline__time">${e.date} · ${e.channel}</div>
        <div class="timeline__title">${citizens[e.citizenId]?.name || e.citizenId} — ${e.type}</div>
        <div class="timeline__desc">${e.description} · +${e.points} pts</div>
      </div>`).join("")}</div>`;
  }

  function refresh() {
    const rows = applyFilters();
    const view = document.getElementById("viewToggle").value;
    document.getElementById("eventsView").innerHTML = rows.length
      ? (view === "timeline" ? renderTimeline(rows) : renderTable(rows))
      : `<div class="empty-state">No events match your filters</div>`;

    document.getElementById("sumEvents").textContent = rows.length;
    document.getElementById("sumPoints").textContent = rows.reduce((a, e) => a + e.points, 0).toLocaleString();
    const counts = {};
    rows.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    document.getElementById("sumTop").textContent = top ? top[0] : "—";
  }

  document.addEventListener("DOMContentLoaded", async () => {
    allEvents = await window.Services.fetchEngagementHistory();
    const list = await window.Services.fetchCitizens();
    citizens = Object.fromEntries(list.map(c => [c.id, c]));
    refresh();
    ["filterQuery", "filterType", "filterChannel", "viewToggle"].forEach(id => {
      document.getElementById(id).addEventListener("input", refresh);
      document.getElementById(id).addEventListener("change", refresh);
    });
  });
})();
