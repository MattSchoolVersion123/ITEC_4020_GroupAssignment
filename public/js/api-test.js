function setupAddTest() {
  const btn = document.getElementById("testAddBtn");
  const resultEl = document.getElementById("addResult");

  if (!btn || !resultEl) return; 

  btn.addEventListener("click", async () => {
    try {
      // which port they used
      const res = await fetch("http://localhost:3000/api/add?a=2&b=3");
      const data = await res.json();
      resultEl.textContent = "Result from /api/add: " + JSON.stringify(data);
    } catch (err) {
      resultEl.textContent =
        "Error calling /api/add. Is the backend running? " + err.message;
    }
  });
}

window.addEventListener("load", setupAddTest);
