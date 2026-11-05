(() => {
  const API_URL = "https://ask-meheran-ai.meherantahasin.workers.dev";

  const style = document.createElement("style");
  style.textContent = `
    #ask-launcher {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 99999;
      width: 62px;
      height: 62px;
      border: 1px solid #e0c59c;
      border-radius: 50%;
      background: #c7a77a;
      color: #111;
      font-size: 25px;
      cursor: pointer;
      box-shadow: 0 5px 25px #0008;
      transition: transform .3s;
    }

    #ask-launcher:hover { transform: scale(1.06); }

    #ask-window {
      position: fixed;
      right: 22px;
      bottom: 98px;
      z-index: 99999;
      width: 360px;
      max-width: calc(100vw - 28px);
      height: 490px;
      max-height: calc(100dvh - 125px);
      background: #111318;
      color: #f5f0e8;
      border: 1px solid #444;
      border-radius: 16px;
      box-shadow: 0 10px 40px #0009;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }

    #ask-window[hidden] { display: none !important; }

    #ask-header {
      background: #202127;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #38383e;
    }

    #ask-heading {
      color: #c7a77a;
      font-size: 17px;
      font-weight: bold;
    }

    #ask-subheading {
      color: #aaa;
      font-size: 11px;
      margin-top: 4px;
    }

    #ask-close {
      border: none;
      background: transparent;
      color: white;
      font-size: 25px;
      cursor: pointer;
    }

    #ask-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ask-message {
      padding: 11px 13px;
      border-radius: 12px;
      max-width: 85%;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.5;
      font-size: 14px;
    }

    .ask-bot { background: #25252b; align-self: flex-start; }
    .ask-user { background: #806747; color: white; align-self: flex-end; }

    #ask-form {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #38383e;
    }

    #ask-input {
      flex: 1;
      min-width: 0;
      background: #202127;
      border: 1px solid #444;
      color: white;
      padding: 12px;
      border-radius: 9px;
      font-size: 14px;
      outline: none;
    }

    #ask-input:focus { border-color: #c7a77a; }

    #ask-send {
      background: #c7a77a;
      color: #111;
      border: none;
      padding: 0 15px;
      border-radius: 9px;
      font-weight: bold;
      cursor: pointer;
    }

    #ask-send:disabled { opacity: .5; cursor: not-allowed; }

    @media (max-width: 480px) {
      #ask-window {
        right: 12px;
        bottom: 88px;
        width: calc(100vw - 24px);
        height: min(490px, calc(100dvh - 110px));
      }

      #ask-launcher { right: 16px; bottom: 16px; }
    }
  `;

  document.head.appendChild(style);

  document.body.insertAdjacentHTML("beforeend", `
    <button id="ask-launcher" type="button"
      aria-label="Open Ask Meheran" aria-expanded="false">
      ✦
    </button>

    <div id="ask-window" hidden>
      <div id="ask-header">
        <div>
          <div id="ask-heading">Ask Meheran</div>
          <div id="ask-subheading">AI assistant · Available anytime</div>
        </div>
        <button id="ask-close" type="button"
          aria-label="Close chat">×</button>
      </div>

      <div id="ask-messages" aria-live="polite">
        <div class="ask-message ask-bot">
          Hello! I'm Ask Meheran. Ask me something about Meheran or anything else.
        </div>
      </div>

      <form id="ask-form">
        <input id="ask-input" type="text"
          placeholder="Ask me anything..." maxlength="2000"
          autocomplete="off" required>
        <button id="ask-send" type="submit">Send</button>
      </form>
    </div>
  `);

  const launcher = document.getElementById("ask-launcher");
  const panel = document.getElementById("ask-window");
  const close = document.getElementById("ask-close");
  const form = document.getElementById("ask-form");
  const input = document.getElementById("ask-input");
  const send = document.getElementById("ask-send");
  const messagesBox = document.getElementById("ask-messages");

  const history = [];

  function openChat() {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  }

  function closeChat() {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
  }

  launcher.addEventListener("click", () => {
    panel.hidden ? openChat() : closeChat();
  });

  close.addEventListener("click", closeChat);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      closeChat();
      launcher.focus();
    }
  });

  function addMessage(text, type) {
    const message = document.createElement("div");
    message.className = "ask-message " +
      (type === "user" ? "ask-user" : "ask-bot");
    message.textContent = text;
    messagesBox.appendChild(message);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    return message;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const question = input.value.trim();
    if (!question || send.disabled) return;

    addMessage(question, "user");
    history.push({ role: "user", content: question });

    input.value = "";
    send.disabled = true;
    send.textContent = "...";

    const loading = addMessage("Thinking...", "bot");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-10) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }

      if (!data.reply) {
        throw new Error("Empty AI response.");
      }

      loading.textContent = data.reply;
      history.push({ role: "assistant", content: data.reply });

    } catch (error) {
      loading.textContent =
        "Sorry, something went wrong. Please try again.";
      console.error("Ask Meheran:", error);

    } finally {
      send.disabled = false;
      send.textContent = "Send";
      input.focus();
    }
  });
})();
