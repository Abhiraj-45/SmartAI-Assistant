document.addEventListener("DOMContentLoaded", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.continuous = false;

  const chatBox = document.getElementById("chat-container");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");
  const darkModeToggle = document.getElementById("dark-mode-toggle");

  let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

  // Load previous messages
  chatHistory.forEach(({ sender, text }) => appendMessage(sender, text));

  // Voice input
  micButton?.addEventListener("click", () => {
    recognition.start();
  });

  recognition.onresult = function (event) {
    const voiceText = event.results[0][0].transcript;
    userInput.value = voiceText;
    sendMessage();
  };

  // Send message
  sendButton?.addEventListener("click", sendMessage);

  // Dark mode toggle
  darkModeToggle?.addEventListener("click", toggleDarkMode);

  // Send message to backend or handle special cases
  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage("You", message);
    userInput.value = "";

    // Smart Replies
    if (message.startsWith("search for ")) {
      const query = message.replace("search for ", "").trim();
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
      return;
    }

    if (message.includes("remind me")) {
      const reminder = message.replace(/.*remind me to/i, "").trim();
      appendMessage("SmartAI Assistant", "⏰ Sure! I’ll remind you in 10 minutes.");
      setTimeout(() => {
        appendMessage("SmartAI Assistant", `⏰ Reminder: ${reminder}`);
        speak(`Reminder: ${reminder}`);
        alert(`⏰ Reminder: ${reminder}`);
      }, 10 * 60 * 1000);
      return;
    }

    if (message.includes("play") && message.includes("music")) {
      window.open("https://www.youtube.com/results?search_query=play+music", "_blank");
      return;
    }

    if (message.includes("time")) {
      const now = new Date();
      const time = now.toLocaleTimeString();
      appendMessage("SmartAI Assistant", `🕒 The current time is ${time}`);
      speak(`The current time is ${time}`);
      return;
    }

    if (message.includes("date")) {
      const today = new Date();
      const date = today.toDateString();
      appendMessage("SmartAI Assistant", `📅 Today's date is ${date}`);
      speak(`Today's date is ${date}`);
      return;
    }

    // Send to Flask backend
    try {
      const response = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      appendMessage("SmartAI Assistant", data.reply || "Sorry, I couldn't understand.");
      speak(data.reply);
    } catch (error) {
      appendMessage("SmartAI Assistant", "⚠️ Error connecting to the server.");
      console.error("Fetch Error:", error);
    }
  }

  // Add message to chat box and save in localStorage
  function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    msg.className = "bg-gray-700 text-white p-2 rounded my-1";
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;

    chatHistory.push({ sender, text });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }

  // Toggle dark/light theme
  function toggleDarkMode() {
    document.body.classList.toggle("bg-gray-900");
    document.body.classList.toggle("bg-white");
    document.body.classList.toggle("text-black");
  }

  // Speak assistant reply aloud
  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  }
});