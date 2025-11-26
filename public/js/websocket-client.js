let socket;

function setupWebSocket() {
  const statusEl = document.getElementById("wsStatus");
  const messagesEl = document.getElementById("wsMessages");
  const sendBtn = document.getElementById("sendWsBtn");

  if (!statusEl || !messagesEl || !sendBtn) return;

  // Confirm port 
  socket = new WebSocket("ws://localhost:8080");

  socket.onopen = () => {
    statusEl.textContent = "WebSocket status: Connected";
  };

  socket.onclose = () => {
    statusEl.textContent = "WebSocket status: Disconnected";
  };

  socket.onerror = () => {
    statusEl.textContent =
      "WebSocket status: Error (check if the WebSocket server is running)";
  };

  socket.onmessage = (event) => {
    const p = document.createElement("p");
    p.textContent = "Server: " + event.data;
    messagesEl.appendChild(p);
  };

  sendBtn.addEventListener("click", () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("WebSocket is not connected yet.");
      return;
    }
    socket.send("Hello from frontend!");
  });
}

window.addEventListener("load", setupWebSocket);
