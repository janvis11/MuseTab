// Background script for Web Whispers extension

// ❌ DO NOT redeclare 'chrome' — it is already available in the Chrome extension environment

// Triggered when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Web Whispers extension installed");
});

// Handle extension icon click (if needed)
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked on tab:", tab.url);
  // Add any additional logic here if required
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "backgroundTask") {
    console.log("Background task requested:", request);
    sendResponse({ success: true });
  }
  return true; // Keeps sendResponse valid for async
});

// Optional: React to tab updates (e.g., reload content when page finishes loading)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Tab finished loading:", tab.url);
    // You can inject scripts or send a message here if needed
  }
});
