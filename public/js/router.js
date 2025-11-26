const routes = ["home", "about", "education", "experience", "project"];

function showPage(pageId) {
  routes.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    section.style.display = (id === pageId) ? "block" : "none";
  });
}

function handleRouteChange() {
  const hash = window.location.hash || "#home";
  const pageId = hash.replace("#", "");
  if (!routes.includes(pageId)) {
    showPage("home");
  } else {
    showPage(pageId);
  }
}

window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("load", handleRouteChange);
