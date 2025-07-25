// Declare chrome variable before using it
const chrome = window.chrome

class ContentScraper {
  constructor() {
    this.maxLinksToProcess = 5 // Limit to prevent overwhelming requests
  }

  // Listen for messages from popup
  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "getContent") {
        this.getPageContent(request.includeLinks)
          .then((content) => sendResponse(content))
          .catch((error) => {
            console.error("Content scraping error:", error)
            sendResponse({ content: "", links: [] })
          })
        return true // Keep message channel open for async response
      }
    })
  }

  async getPageContent(includeLinks = false) {
    const content = this.extractMainContent()
    let linkedContent = []

    if (includeLinks) {
      linkedContent = await this.getLinkedPagesContent()
    }

    return {
      content: content,
      links: linkedContent,
      url: window.location.href,
      title: document.title,
    }
  }

  extractMainContent() {
    // Remove script and style elements
    const elementsToRemove = document.querySelectorAll(
      "script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar",
    )
    const tempDoc = document.cloneNode(true)

    elementsToRemove.forEach((el) => {
      const tempEl = tempDoc.querySelector(el.tagName.toLowerCase())
      if (tempEl) tempEl.remove()
    })

    // Try to find main content area
    let mainContent = ""

    // Look for main content selectors
    const contentSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".main-content",
      ".content",
      ".post-content",
      ".entry-content",
      "#content",
      "#main",
    ]

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        mainContent = this.extractTextFromElement(element)
        if (mainContent.length > 100) break
      }
    }

    // Fallback to body if no main content found
    if (mainContent.length < 100) {
      mainContent = this.extractTextFromElement(document.body)
    }

    // Clean up the content
    return this.cleanText(mainContent)
  }

  extractTextFromElement(element) {
    // Clone element to avoid modifying original
    const clone = element.cloneNode(true)

    // Remove unwanted elements
    const unwanted = clone.querySelectorAll("script, style, nav, header, footer, aside, .advertisement, .ads")
    unwanted.forEach((el) => el.remove())

    return clone.innerText || clone.textContent || ""
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .trim()
      .substring(0, 8000) // Limit content length
  }

  async getLinkedPagesContent() {
    const links = this.extractLinks()
    const linkedContent = []

    // Process only a limited number of links
    const linksToProcess = links.slice(0, this.maxLinksToProcess)

    for (const link of linksToProcess) {
      try {
        const content = await this.fetchLinkContent(link)
        if (content) {
          linkedContent.push({
            url: link,
            content: content.substring(0, 2000), // Limit linked content
          })
        }
      } catch (error) {
        console.error(`Error fetching ${link}:`, error)
      }
    }

    return linkedContent
  }

  extractLinks() {
    const links = []
    const linkElements = document.querySelectorAll("a[href]")

    linkElements.forEach((link) => {
      const href = link.href

      // Only include same-domain links and filter out common non-content links
      if (
        href &&
        href.startsWith(window.location.origin) &&
        !href.includes("#") &&
        !href.includes("javascript:") &&
        !href.includes("mailto:") &&
        !href.includes("tel:") &&
        !href.match(/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx)$/i)
      ) {
        links.push(href)
      }
    })

    // Remove duplicates and current page
    return [...new Set(links)].filter((link) => link !== window.location.href)
  }

  async fetchLinkContent(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) return null

      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // Extract text content from the fetched page
      const body = doc.body
      if (!body) return null

      return this.extractTextFromElement(body)
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error)
      return null
    }
  }
}

// Initialize content scraper
const contentScraper = new ContentScraper()
contentScraper.init()
