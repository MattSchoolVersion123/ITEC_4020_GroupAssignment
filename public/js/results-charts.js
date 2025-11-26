
function fetchResults() {
  return fetch("http://localhost:3000/api/results")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch /api/results");
      return res.json();
    });
}


function transformResults(raw) {

  const domains = raw.map(resp => resp.domain);
  const accuracy = raw.map(resp => resp.accuracy/100);
  const avgTime = raw.map(resp => resp.totalTime);

  return { domains, accuracy, avgTime };
}

function renderAccuracyChart(domains, accuracy) {
  const canvas = document.getElementById("accuracyChart");
  if (!canvas) return; 

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: domains,
      datasets: [
        {
          label: "Accuracy (%)",
          data: accuracy.map((v) => v * 100), 
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Accuracy (%)" },
        },
      },
    },
  });
}

function renderTimeChart(domains, avgTime) {
  const canvas = document.getElementById("timeChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: domains,
      datasets: [
        {
          label: "Average Response Time (ms)",
          data: avgTime,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Time (ms)" },
        },
      },
    },
  });
}

function renderSummary(domains, accuracy, avgTime) {
  const container = document.getElementById("summaryDashboard");
  if (!container) return;

  container.innerHTML = ""; 

  if (!domains.length) {
    container.textContent = "No results available yet.";
    return;
  }


  let bestIdx = 0;
  let worstIdx = 0;
  for (let i = 1; i < domains.length; i++) {
    if (accuracy[i] > accuracy[bestIdx]) bestIdx = i;
    if (accuracy[i] < accuracy[worstIdx]) worstIdx = i;
  }

  const bestDom = domains[bestIdx];
  const worstDom = domains[worstIdx];

  const avgAccuracy =
    accuracy.reduce((sum, v) => sum + v, 0) / accuracy.length || 0;

  const avgResponseTime =
    avgTime.reduce((sum, v) => sum + v, 0) / (avgTime.length || 1);

  const summaryEl = document.createElement("div");
  summaryEl.innerHTML = `
    <p><strong>Overall Accuracy:</strong> ${(avgAccuracy * 100).toFixed(
      1
    )}%</p>
    <p><strong>Average Response Time:</strong> ${avgResponseTime.toFixed(
      0
    )} ms</p>
    <p><strong>Best Domain:</strong> ${bestDom} (${(accuracy[bestIdx] * 100).toFixed(
    1
  )}%)</p>
    <p><strong>Challenging Domain:</strong> ${worstDom} (${(
    accuracy[worstIdx] * 100
  ).toFixed(1)}%)</p>
  `;

  container.appendChild(summaryEl);
}

function initResultsCharts() {

  fetchResults()
    .then((raw) => {
      console.log("Raw /api/results:", raw);
      const { domains, accuracy, avgTime } = transformResults(raw);

      renderAccuracyChart(domains, accuracy);
      renderTimeChart(domains, avgTime);
      renderSummary(domains, accuracy, avgTime);
    })
    .catch((err) => {
      console.error(err);
      const container = document.getElementById("summaryDashboard");
      if (container) {
        container.textContent =
          "Failed to load results from the server. Check that groupProjServer.js is running.";
      }
    });
}


window.addEventListener("load", initResultsCharts);
