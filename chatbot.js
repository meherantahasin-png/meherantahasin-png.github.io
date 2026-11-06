document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://ask-meheran-ai.meherantahasin.workers.dev/";

  const history = [];
  let isSending = false;

  // Automatically update copyright year.
  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  // Add a floating launcher on About and Contact pages.
  const currentPage = window.location.pathname.split("/").pop();
  const isHomePage = currentPage === "" || currentPage === "index.html";

  if (!isHomePage) {
    const launcher = document.createElement("button");
    launcher.className = "chat-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open Ask Meheran AI");
    launcher.setAttribute("data-chat-open", "");
    launcher.textContent = "✦";
    document.body.appendChild(launcher);
  }

  // Create the chat interface.
  const panel = document.createElement("section");
  panel.className = "chat-panel";
  panel.setAttribute("aria-label", "Ask Meheran AI");
  panel.setAttribute("aria-hidden", "true");

  panel.innerHTML = `
    <div class="chat-header">
      <div>
        <div class="chat-header-title">✦ Ask Meheran AI</div>
        <div class="chat-header-subtitle">Your guide to learning about Meheran</div>
      </div>
      <button class="chat-close" type="button" aria-label="Close chat">×</button>
    </div>

    <div class="chat-messages" aria-live="polite">
      <div class="chat-message bot">
        Hi! I'm Meheran's AI assistant. Ask me anything about his
        background, education, interests, or website.
      </div>
    </div>

    <div class="chat-status" aria-live="polite">
      AI assistant
    </div>

    <form class="chat-form">
      <input
        class="chat-input"
        type="text"
        placeholder="Ask something..."
        autocomplete="off"
        aria-label="Your message"
        maxlength="1000"
        required
      >
      <button class="chat-send" type="submit" aria-label="Send message">
        ↑
      </button>
    </form>
  `;

  document.body.appendChild(panel);

  const messagesContainer = panel.querySelector(".chat-messages");
  const input = panel.querySelector(".chat-input");
  const form = panel.querySelector(".chat-form");
  const sendButton = panel.querySelector(".chat-send");
  const status = panel.querySelector(".chat-status");
  const closeButton = panel.querySelector(".chat-close");

  // Open the chat from any button carrying data-chat-open.
  document.querySelectorAll("[data-chat-open]").forEach(button => {
    button.addEventListener("click", () => {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      input.focus();
    });
  });

  function closeChat() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  closeButton.addEventListener("click", closeChat);

  // Close with Escape.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.classList.contains("open")) {
      closeChat();
    }
  });

  function addMessage(text, sender) {
    const message = document.createElement("div");

    message.className = `chat-message ${sender}`;
    message.textContent = text;

    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return message;
  }

  async function sendMessage(text) {
    if (isSending || !text.trim()) return;

    isSending = true;
    sendButton.disabled = true;
    input.disabled = true;
    status.textContent = "Thinking...";

    addMessage(text, "user");

    history.push({
      role: "user",
      content: text
    });

    const loadingMessage = addMessage("Thinking...", "bot");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: history.slice(-10)
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("Invalid response from AI service");
      }

      loadingMessage.textContent = data.reply;

      history.push({
        role: "assistant",
        content: data.reply
      });

      status.textContent = "AI assistant";
    } catch (error) {
      console.error("AI assistant error:", error);

      loadingMessage.textContent =
        "Sorry, I couldn't connect right now. Please try again in a moment.";

      status.textContent = "Connection unavailable";
    } finally {
      isSending = false;
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const text = input.value.trim();

    if (!text || isSending) return;

    input.value = "";
    sendMessage(text);
  });
});
