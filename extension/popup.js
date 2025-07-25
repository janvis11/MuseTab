class WebWhispersPopup {
  constructor() {
    this.chatContainer = document.getElementById("chatContainer")
    this.userInput = document.getElementById("userInput")
    this.sendButton = document.getElementById("sendButton")
    this.status = document.getElementById("status")
    this.includeLinksToggle = document.getElementById("includeLinks")

    this.serverUrl = "http://localhost:3000"
    this.isLoading = false

    this.init()
  }

  init() {
    this.sendButton.addEventListener("click", () => this.handleSend())
    this.userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.handleSend()
      }
    })

    // Load chat history
    this.loadChatHistory()

    // Auto-focus input
    this.userInput.focus()
  }

  async handleSend() {
    const query = this.userInput.value.trim()
    if (!query || this.isLoading) return

    this.addMessage(query, "user")
    this.userInput.value = ""
    this.setLoading(true)

    try {
      // Get page content
      const pageContent = await this.getPageContent()

      // Send to backend
      const response = await this.queryBackend(query, pageContent)

      this.addMessage(response.answer, "assistant")
      this.setStatus("")
    } catch (error) {
      console.error("Error:", error)
      this.addMessage("Sorry, I encountered an error. Please make sure the backend server is running.", "assistant")
      this.setStatus("Error: Unable to connect to server", "error")
    } finally {
      this.setLoading(false)
    }
  }

  async getPageContent() {
    return new Promise((resolve) => {
      window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        window.chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "getContent",
            includeLinks: this.includeLinksToggle.checked,
          },
          (response) => {
            if (window.chrome.runtime.lastError) {
              console.error("Content script error:", window.chrome.runtime.lastError)
              resolve({ content: "", links: [] })
            } else {
              resolve(response || { content: "", links: [] })
            }
          },
        )
      })
    })
  }

  async queryBackend(query, pageContent) {
    const response = await fetch(`${this.serverUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        pageContent: pageContent.content,
        linkedPages: pageContent.links,
        includeLinks: this.includeLinksToggle.checked,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  addMessage(content, sender) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${sender}`

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"
    contentDiv.textContent = content

    messageDiv.appendChild(contentDiv)
    this.chatContainer.appendChild(messageDiv)

    // Scroll to bottom
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight

    // Save to storage
    this.saveChatHistory()
  }

  setLoading(loading) {
    this.isLoading = loading
    this.sendButton.disabled = loading

    if (loading) {
      this.setStatus("Analyzing page content...", "loading")
    }
  }

  setStatus(message, type = "") {
    this.status.textContent = message
    this.status.className = `status ${type}`

    if (type === "loading") {
      this.status.innerHTML = message + ' <span class="loading-dots"></span>'
    }
  }

  async saveChatHistory() {
    const messages = Array.from(this.chatContainer.querySelectorAll(".message")).map((msg) => ({
      content: msg.querySelector(".message-content").textContent,
      sender: msg.classList.contains("user") ? "user" : "assistant",
    }))

    await window.chrome.storage.local.set({ chatHistory: messages })
  }

  async loadChatHistory() {
    const result = await window.chrome.storage.local.get(["chatHistory"])
    const history = result.chatHistory || []

    // Clear welcome message if there's history
    if (history.length > 0) {
      this.chatContainer.innerHTML = ""
    }

    history.forEach((msg) => {
      if (msg.sender !== "welcome") {
        this.addMessageToDOM(msg.content, msg.sender)
      }
    })
  }

  addMessageToDOM(content, sender) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${sender}`

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"
    contentDiv.textContent = content

    messageDiv.appendChild(contentDiv)
    this.chatContainer.appendChild(messageDiv)
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new WebWhispersPopup()
})
