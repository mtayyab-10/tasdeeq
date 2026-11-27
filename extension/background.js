// ══════════════════════════════════════════════
// TASDEEQ BROWSER EXTENSION — SERVICE WORKER
// ══════════════════════════════════════════════

chrome.runtime.onInstalled.addListener(() => {
  console.log("Tasdeeq Pre-Submission Quality Gate extension installed.");
});

// Listener for tab updates or potential badge updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "VERIFY_API") {
    fetch(message.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload),
    })
      .then(async (res) => {
        const data = await res.json();
        sendResponse({ ok: res.ok, status: res.status, data });
      })
      .catch((err) => {
        sendResponse({ ok: false, error: err.message });
      });
    return true; // Keep message channel open for async response
  }

  if (message.action === "SET_BADGE") {
    if (sender.tab && sender.tab.id) {
      const text = message.count > 0 ? String(message.count) : "";
      chrome.action.setBadgeText({ tabId: sender.tab.id, text });
      chrome.action.setBadgeBackgroundColor({
        tabId: sender.tab.id,
        color: message.isBlocked ? "#f7574f" : "#f7a94f",
      });
    }
    sendResponse({ success: true });
    return true;
  }
});
