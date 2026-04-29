/* =========================================================
   Supervisor insights page logic
   ========================================================= */

(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const i = await window.Services.fetchInsights();
    document.getElementById("iActive").textContent = i.activeCitizens.toLocaleString();
    document.getElementById("iSat").textContent = i.avgSatisfaction + " ★";
    document.getElementById("iRes").textContent = i.avgResolutionHours + "h";
    document.getElementById("iRep").textContent = Math.round(i.repeatParticipationRate * 100) + "%";

    document.getElementById("lowSatRows").innerHTML = i.lowSatisfactionAlerts.map(a => `
      <tr>
        <td><a href="citizen-profile.html?id=${a.citizenId}">${a.citizenId}</a></td>
        <td>${"★".repeat(a.lastScore)}<small class="text-muted"> ${a.lastScore}</small></td>
        <td>${a.channel}</td>
        <td class="row-actions"><button class="btn btn--sm btn--ghost-info">Reach out</button></td>
      </tr>`).join("");

    document.getElementById("agentPerfRows").innerHTML = i.agentPerformance.map(a => {
      const flag = a.avgRating < 4 || a.escalations >= 6;
      return `<tr>
        <td><strong>${a.agent}</strong></td>
        <td>${a.handled}</td>
        <td>${a.avgRating} ★</td>
        <td>${a.escalations}</td>
        <td>${flag
          ? `<span class="badge badge--warn">Training suggested</span>`
          : `<span class="badge badge--success">On track</span>`}</td>
      </tr>`;
    }).join("");
  });
})();
