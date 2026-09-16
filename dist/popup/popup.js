// src/popup/popup.ts
var currentState = null;
var currentTabs = [];
var tabCount = document.getElementById("tabCount");
var tabSelectSection = document.getElementById("tabSelectSection");
var tabSelect = document.getElementById("tabSelect");
var popupThumb = document.getElementById("popupThumb");
var popupTitle = document.getElementById("popupTitle");
var popupChannel = document.getElementById("popupChannel");
var popupSeek = document.getElementById("popupSeek");
var popupCurrentTime = document.getElementById("popupCurrentTime");
var popupDuration = document.getElementById("popupDuration");
var popupPrev = document.getElementById("popupPrev");
var popupSkipBack = document.getElementById("popupSkipBack");
var popupPlayPause = document.getElementById("popupPlayPause");
var popupSkipFwd = document.getElementById("popupSkipFwd");
var popupNext = document.getElementById("popupNext");
var popupMute = document.getElementById("popupMute");
var popupVolume = document.getElementById("popupVolume");
var barToggle = document.getElementById("barToggle");
var barStatusText = document.getElementById("barStatusText");
popupSkipBack.addEventListener("click", () => sendCommand({ type: "SEEK_RELATIVE", payload: { delta: -10 } }));
popupSkipFwd.addEventListener("click", () => sendCommand({ type: "SEEK_RELATIVE", payload: { delta: 10 } }));
function updateBarStatus(enabled) {
  barToggle.checked = enabled;
  barStatusText.textContent = enabled ? "Visible on all tabs" : "Hidden from webpages";
}
barToggle.addEventListener("change", () => {
  const enabled = barToggle.checked;
  updateBarStatus(enabled);
  chrome.runtime.sendMessage({
    type: "SET_BAR_VISIBILITY",
    payload: { enabled }
  }).catch(() => {
  });
});
chrome.runtime.sendMessage({ type: "GET_BAR_VISIBILITY" }, (res) => {
  if (res && res.success && typeof res.data?.enabled === "boolean") {
    updateBarStatus(res.data.enabled);
  }
});
function formatTime(sec) {
  if (!isFinite(sec) || sec < 0)
    return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60 % 60);
  const h = Math.floor(sec / 3600);
  const pad = (n) => n < 10 ? `0${n}` : `${n}`;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
function updateUI() {
  tabCount.textContent = `${currentTabs.length} tab${currentTabs.length === 1 ? "" : "s"}`;
  if (currentTabs.length > 1) {
    tabSelectSection.style.display = "flex";
    tabSelect.innerHTML = "";
    for (const tab of currentTabs) {
      const opt = document.createElement("option");
      opt.value = String(tab.tabId);
      opt.textContent = `${tab.isPlaying ? "\u25B6 " : "\u23F8 "}${tab.title}`;
      opt.selected = tab.isTarget;
      tabSelect.appendChild(opt);
    }
  } else {
    tabSelectSection.style.display = "none";
  }
  if (!currentState) {
    popupTitle.textContent = currentTabs.length > 0 ? "YouTube connected (Ready)" : "No YouTube tabs open";
    popupChannel.textContent = currentTabs.length > 0 ? "Start playback in YouTube" : "Open YouTube to start controlling";
    popupThumb.style.display = "none";
    popupPlayPause.textContent = "\u25B6";
    popupCurrentTime.textContent = "0:00";
    popupDuration.textContent = "0:00";
    popupSeek.value = "0";
    popupPrev.disabled = true;
    popupNext.disabled = true;
    return;
  }
  popupTitle.textContent = currentState.title || "YouTube Video";
  popupChannel.textContent = currentState.channel || "";
  if (currentState.thumbnailUrl) {
    popupThumb.src = currentState.thumbnailUrl;
    popupThumb.style.display = "block";
  } else {
    popupThumb.style.display = "none";
  }
  popupPlayPause.textContent = currentState.isPlaying ? "\u275A\u275A" : "\u25B6";
  popupCurrentTime.textContent = formatTime(currentState.currentTime);
  popupDuration.textContent = currentState.isLive ? "LIVE" : formatTime(currentState.duration);
  if (currentState.duration > 0 && !currentState.isLive) {
    popupSeek.value = String(Math.round(currentState.currentTime / currentState.duration * 100));
  } else {
    popupSeek.value = "0";
  }
  popupPrev.disabled = !currentState.hasPrevious;
  popupNext.disabled = !currentState.hasNext;
  popupVolume.value = String(currentState.isMuted ? 0 : currentState.volume);
  popupMute.textContent = currentState.isMuted || currentState.volume === 0 ? "\u{1F507}" : "\u{1F50A}";
}
function sendCommand(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {
  });
}
popupPlayPause.addEventListener("click", () => sendCommand({ type: "TOGGLE_PLAY" }));
popupNext.addEventListener("click", () => sendCommand({ type: "NEXT" }));
popupPrev.addEventListener("click", () => sendCommand({ type: "PREVIOUS" }));
popupMute.addEventListener("click", () => sendCommand({ type: "TOGGLE_MUTE" }));
popupVolume.addEventListener("input", () => {
  const vol = parseInt(popupVolume.value, 10);
  sendCommand({ type: "SET_VOLUME", payload: { volume: vol } });
});
popupSeek.addEventListener("change", () => {
  if (currentState && currentState.duration > 0) {
    const ratio = parseInt(popupSeek.value, 10) / 100;
    sendCommand({ type: "SEEK", payload: { time: ratio * currentState.duration } });
  }
});
tabSelect.addEventListener("change", () => {
  const tabId = parseInt(tabSelect.value, 10);
  sendCommand({ type: "SELECT_TARGET_TAB", payload: { tabId } });
});
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "STATE_UPDATE") {
    const payload = message.payload;
    if (payload) {
      currentState = payload.state;
      currentTabs = payload.tabs || [];
      updateUI();
    }
  }
});
chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
  if (chrome.runtime.lastError)
    return;
  if (response && response.success && response.data) {
    const { state, tabs } = response.data;
    currentState = state;
    currentTabs = tabs || [];
    updateUI();
  }
});
