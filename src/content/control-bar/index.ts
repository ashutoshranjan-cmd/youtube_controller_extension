import { ControlBarStateStore } from './state.js';
import { ControlBarUI } from './ui.js';
import { CommandMessage, StateUpdatePayload } from '../../types/messages.js';

// Avoid duplicate injection
if (!(window as any).__YT_GLOBAL_CONTROL_BAR_INJECTED__) {
  (window as any).__YT_GLOBAL_CONTROL_BAR_INJECTED__ = true;

  const store = new ControlBarStateStore();
  new ControlBarUI(store);

  // Listen for broadcast state updates and visibility changes from background worker
  chrome.runtime.onMessage.addListener((message: CommandMessage) => {
    if (message.type === 'STATE_UPDATE') {
      const payload = message.payload as StateUpdatePayload;
      if (payload) {
        store.update(payload.state, payload.tabs || []);
      }
    } else if (message.type === 'BAR_VISIBILITY_CHANGED') {
      const enabled = message.payload?.enabled;
      if (typeof enabled === 'boolean') {
        store.setBarEnabled(enabled);
      }
    }
  });

  // Request initial visibility preference & state on page load
  try {
    chrome.runtime.sendMessage({ type: 'GET_BAR_VISIBILITY' }, (res) => {
      if (chrome.runtime.lastError) return;
      if (res && res.success && typeof res.data?.enabled === 'boolean') {
        store.setBarEnabled(res.data.enabled);
      }
    });

    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.success && response.data) {
        const { state, tabs } = response.data as StateUpdatePayload;
        store.update(state, tabs || []);
      }
    });
  } catch {
    // Background not ready
  }
}

