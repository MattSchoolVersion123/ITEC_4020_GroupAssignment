const assistantMessages = [
  "Welcome! This site presents our 4th-year ITEC project evaluating ChatGPT’s performance.",
  "Navigate through the sections above to explore the methodology, results, and background.",
  "Check out the Project page for accuracy metrics and response-time visualizations.",
  "Our backend is built with Node.js, Express, and MongoDB, connected to the ChatGPT API.",
  "WebSockets keep you updated with real-time evaluation progress and server activity."
];

let msgIndex = 0;

function updateAssistantMessage() {
  const el = document.getElementById("assistantText");
  if (!el) return;
  el.textContent = assistantMessages[msgIndex];
  msgIndex = (msgIndex + 1) % assistantMessages.length;
}


window.addEventListener("load", () => {
  updateAssistantMessage();                 
  setInterval(updateAssistantMessage, 5000); 
});
