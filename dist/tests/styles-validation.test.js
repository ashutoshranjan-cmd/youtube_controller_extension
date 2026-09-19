// tests/styles-validation.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";

// src/content/control-bar/styles.ts
var CONTROL_BAR_STYLES = `
:host {
  all: initial !important;
  display: block !important;
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483647 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  font-size: 13px !important;
  line-height: 1.4 !important;
  box-sizing: border-box !important;
  pointer-events: none !important;
  user-select: none !important;
  -webkit-font-smoothing: antialiased !important;
}

/* Minimized Floating Circular Pill Mode */
:host(.pill-mode) {
  /* :host covers viewport with pointer-events: none */
}

:host(.controller-hidden) {
  display: none !important;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

svg {
  box-sizing: content-box;
  flex-shrink: 0;
}

/* Global Dark Theme Variables (Inherited across all Shadow DOM elements) */
:host,
.bar-container,
.yt-search-backdrop,
.video-preview-window {
  --yt-bg: #12131a;
  --yt-border: rgba(255, 255, 255, 0.16);
  --yt-text: #ffffff;
  --yt-text-secondary: #aaaaaa;
  --yt-hover-bg: rgba(255, 255, 255, 0.12);
  --yt-active-bg: rgba(255, 255, 255, 0.2);
  --yt-progress-track: rgba(255, 255, 255, 0.25);
  --yt-panel-bg: #181922;
  --yt-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
  --yt-card-bg: rgba(255, 255, 255, 0.08);
  color: #ffffff !important;
}

/* Light Theme Variables */
:host(.theme-light),
.bar-container.theme-light,
.yt-search-backdrop.theme-light,
.video-preview-window.theme-light,
.theme-light {
  --yt-bg: #ffffff;
  --yt-border: rgba(0, 0, 0, 0.14);
  --yt-text: #111114;
  --yt-text-secondary: #5f6368;
  --yt-hover-bg: rgba(0, 0, 0, 0.08);
  --yt-active-bg: rgba(0, 0, 0, 0.15);
  --yt-progress-track: rgba(0, 0, 0, 0.16);
  --yt-panel-bg: #f9f9fb;
  --yt-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  --yt-card-bg: rgba(0, 0, 0, 0.05);
  color: #111114 !important;
}

/* Main Floating Dock */
.bar-container {
  pointer-events: auto !important;
  position: fixed !important;
  bottom: 18px !important;
  bottom: 22px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background: var(--yt-bg);
  border: 1px solid var(--yt-border);
  border-radius: 20px;
  box-shadow: var(--yt-shadow);
  color: var(--yt-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 20px;
  gap: 16px;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  width: min(96vw, 1400px) !important;
  height: 72px !important;
  padding: 0 22px !important;
  border-radius: 9999px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 14px !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
  
  background: var(--yt-bg) !important;
  border: 1px solid var(--yt-border) !important;
  box-shadow: var(--yt-shadow) !important;
  color: var(--yt-text) !important;
  isolation: isolate !important;
  contain: layout style paint !important;
  overflow: hidden !important;
}

/* Light Mode High-Contrast Overrides */
.bar-container.theme-light .video-title {
  color: #0f172a !important;
  text-shadow: none !important;
}

.bar-container.theme-light .channel-name {
  color: #475569 !important;
  text-shadow: none !important;
}

.bar-container.theme-light .icon-btn {
  color: #1e293b !important;
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.09) !important;
}

.bar-container.theme-light .icon-btn:hover {
  color: #000000 !important;
  background: rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(0, 0, 0, 0.22) !important;
}

.bar-container.theme-light .like-btn {
  color: #1e293b !important;
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.09) !important;
}

.bar-container.theme-light .like-btn:hover {
  color: #000000 !important;
  background: rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(0, 0, 0, 0.22) !important;
}

.bar-container.theme-light .like-btn.liked {
  color: #ff0033 !important;
  background: rgba(255, 0, 51, 0.1) !important;
  border-color: rgba(255, 0, 51, 0.35) !important;
}

.bar-container.theme-light .time-row {
  color: #334155 !important;
}

.bar-container.theme-light .progress-track {
  background: rgba(0, 0, 0, 0.12) !important;
}

.bar-container.theme-light .volume-slider {
  background: rgba(0, 0, 0, 0.12) !important;
}

.bar-container.theme-light .volume-slider::-webkit-slider-thumb {
  background: #1e293b !important;
}

.bar-container.theme-light .vol-step-btn {
  color: #334155 !important;
}

.bar-container.theme-light .vol-step-btn:hover {
  color: #000000 !important;
}

.bar-container.theme-light .bar-divider {
  background: rgba(0, 0, 0, 0.16) !important;
}

.bar-container.theme-light .hd-badge-btn {
  color: #0f172a !important;
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1.2px solid rgba(0, 0, 0, 0.18) !important;
}

.bar-container.theme-light .hd-badge-btn:hover {
  background: rgba(0, 0, 0, 0.12) !important;
  border-color: rgba(0, 0, 0, 0.3) !important;
}

.bar-container.hidden {
  display: none !important;
}

/* Circular Floating YouTube Pill (when minimized in bottom-left corner) */
.floating-pill {
  position: fixed !important;
  left: 24px !important;
  right: auto !important;
  bottom: 24px !important;
  display: none;
  pointer-events: auto !important;
  width: 54px;
  height: 54px;
  background: rgba(16, 18, 27, 0.85) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.28) !important;
  width: 52px;
  height: 52px;
  background: var(--yt-bg) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.32) !important;
  border-radius: 50%;
  box-shadow: var(--yt-shadow);
  box-shadow: var(--yt-shadow);
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.floating-pill:hover {
  transform: scale(1.12);
  box-shadow: 0 0 28px rgba(255, 0, 51, 0.8), 0 14px 40px rgba(0, 0, 0, 0.8) !important;
  border-color: #ff0033 !important;
}

.floating-pill svg {
  width: 28px;
  height: 20px;
  display: block;
}

.floating-pill-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #00d26a;
  border: 2px solid #111;
  display: none;
}

.floating-pill.playing .floating-pill-dot {
  display: block;
  animation: pulseDot 1.5s infinite;
}

/* Close / Cut button on Pill hover */
.pill-cut-btn {
  position: absolute !important;
  top: -5px !important;
  right: -5px !important;
  width: 22px !important;
  height: 22px !important;
  border-radius: 50% !important;
  background: #ff0033 !important;
  border: 2px solid #ffffff !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  outline: none !important;
  opacity: 0 !important;
  transform: scale(0.5) !important;
  pointer-events: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7) !important;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.15s ease !important;
  z-index: 10 !important;
  padding: 0 !important;
}

.pill-cut-btn svg {
  width: 12px !important;
  height: 12px !important;
  fill: #ffffff !important;
  display: block !important;
}

.floating-pill:hover .pill-cut-btn {
  opacity: 1 !important;
  transform: scale(1) !important;
  pointer-events: auto !important;
}

.pill-cut-btn:hover {
  background: #ff1a4a !important;
  transform: scale(1.18) rotate(90deg) !important;
  box-shadow: 0 0 14px rgba(255, 0, 51, 0.95), 0 2px 10px rgba(0, 0, 0, 0.8) !important;
}

@keyframes pulseDot {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}

:host(.pill-mode) .bar-container {
  display: none !important;
}

:host(.pill-mode) .floating-pill {
  display: flex !important;
  animation: pillBounceIn 450ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pillBounceIn {
  0% { transform: scale(0.72); }
  55% { transform: scale(1.16); }
  78% { transform: scale(0.94); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  :host(.pill-mode) .floating-pill { animation: none; }
}

/* Left Section: Cover, Title, Channel & Like */
.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  max-width: 280px;
  min-width: 200px;
  max-width: 270px;
  flex-shrink: 0;
}

.thumbnail-wrap {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  flex-shrink: 0;
  position: relative;
  border: 1px solid var(--yt-border);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.thumbnail-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-wrap.empty {
  display: none;
}

.track-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.video-title {
  font-weight: 700;
  font-size: 13.5px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--yt-text);
  letter-spacing: -0.1px;
  color: #ffffff !important;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.channel-name {
  font-size: 11px;
  color: var(--yt-text-secondary);
  font-size: 10.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.68) !important;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

/* YouTube Like / Thumbs Up Button */
/* YouTube Like / Heart Button */
.like-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  cursor: pointer;
  width: 32px;
  height: 32px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease, transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.like-btn:hover {
  color: var(--yt-text);
  background: var(--yt-hover-bg);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.35);
  transform: scale(1.12);
}

.like-btn.liked {
  color: #3ea6ff;
  color: #ff2d55;
  background: rgba(255, 45, 85, 0.18);
  border-color: rgba(255, 45, 85, 0.45);
  box-shadow: 0 0 14px rgba(255, 45, 85, 0.6);
}

.like-btn svg {
  width: 18px;
  height: 18px;
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.like-btn.pop-anim, .preview-like-btn.pop-anim {
  animation: ytThumbPop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes ytThumbPop {
  0% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.38) rotate(-18deg);
  }
  50% {
    transform: scale(0.88) rotate(8deg);
  }
  75% {
    transform: scale(1.15) rotate(-3deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.like-btn svg {
  width: 19px;
  height: 19px;
  fill: currentColor;
}

/* Floating Confirmation Toast */
.dock-toast {
  position: absolute;
  bottom: calc(100% + 14px);
  left: 50%;
  transform: translateX(-50%) translateY(8px) scale(0.95);
  background: #18181b;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 1000;
  white-space: nowrap;
}

.dock-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

.theme-light .dock-toast {
  background: rgba(255, 255, 255, 0.94);
  color: #0f0f0f;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15);
}

/* Center Section: Controls & Seek Bar */
.center-section {
  display: flex;
  align-items: center;
  gap: 16px;
  gap: 18px;
  flex: 1;
  max-width: 560px;
  max-width: 580px;
  justify-content: center;
}

.buttons-group {
  display: flex;
  align-items: center;
  gap: 6px;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease, transform 0.1s ease;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  position: relative;
}

.icon-btn:hover {
  color: var(--yt-text);
  background: var(--yt-hover-bg);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.35);
  transform: scale(1.08);
}

.icon-btn:active {
  transform: scale(0.95);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.icon-btn.shuffle-btn.active,
.icon-btn.loop-btn.active {
  background: rgba(255, 45, 85, 0.22);
  border-color: #ff2d55;
  color: #ff2d55;
  box-shadow: 0 0 12px rgba(255, 45, 85, 0.5);
}

/* Explicit 10s Skip Buttons */
.skip-10-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.skip-10-btn svg {
  width: 22px;
  height: 22px;
}

/* Glowing Red Play/Pause Button */
/* 3D Jewel Red Play/Pause Button */
.icon-btn.play-pause-btn {
  width: 44px;
  height: 44px;
  background: #ff0033;
  color: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 0, 51, 0.6);
  margin: 0 4px;
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  border-radius: 50% !important;
  background: radial-gradient(circle at 36% 28%, #ff5277 0%, #ff0844 45%, #b30026 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  box-shadow: 
    0 0 28px 4px rgba(255, 0, 68, 0.8),
    0 6px 18px rgba(179, 0, 38, 0.55),
    inset 0 2.5px 3px rgba(255, 255, 255, 0.85),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5) !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 4px !important;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease !important;
}

.icon-btn.play-pause-btn:hover {
  background: #ff1a47;
  transform: scale(1.1);
  box-shadow: 0 0 28px rgba(255, 0, 51, 0.85);
  transform: scale(1.1) !important;
  box-shadow: 
    0 0 38px 6px rgba(255, 0, 68, 0.95),
    0 8px 22px rgba(179, 0, 38, 0.7),
    inset 0 2.5px 3px rgba(255, 255, 255, 0.95),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5) !important;
}

.icon-btn.play-pause-btn:active {
  transform: scale(0.96) !important;
}

.icon-btn.play-pause-btn svg {
  width: 20px;
  height: 20px;
  fill: #ffffff;
  width: 20px !important;
  height: 20px !important;
  fill: #ffffff !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35)) !important;
}

/* Track Change Spinner */
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: none;
}

.icon-btn.loading .btn-icon {
  display: none !important;
}

.icon-btn.loading .btn-spinner {
  display: block !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Seek Bar with High-Contrast Timestamps Underneath */
.seek-container {
  display: flex;
  flex-direction: column;
  gap: 3px;
  justify-content: center;
  gap: 4px;
  flex: 1;
  min-width: 160px;
  max-width: 250px;
  position: relative;
}

.progress-container {
  position: relative;
  width: 100%;
  height: 14px;
  height: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  touch-action: none;
}

.progress-track {
  width: 100%;
  height: 4.5px;
  background: var(--yt-progress-track);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 9999px;
  position: relative;
  transition: height 0.12s ease;
}

.progress-container:hover .progress-track,
.progress-container.dragging .progress-track {
  height: 6.5px;
  height: 6px;
}

.progress-fill {
  height: 100%;
  background: #ff0033;
  border-radius: 3px;
  background: linear-gradient(90deg, #ff2d55, #ff456e);
  border-radius: 9999px;
  box-shadow: 0 0 8px rgba(255, 45, 85, 0.6);
  width: 0%;
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  left: 0%;
  width: 13px;
  height: 13px;
  width: 12px;
  height: 12px;
  background: #ffffff;
  border: 2px solid #ff0033;
  border: 1.5px solid #ff2d55;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.95), 0 2px 5px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  transition: transform 0.1s ease;
}

.time-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--yt-text-secondary);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-variant-numeric: tabular-nums;
  padding: 0 1px;
  letter-spacing: 0.2px;
}

.progress-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.92);
  color: #fff;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  pointer-events: none;
  display: none;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 100;
}

.progress-container:hover .progress-tooltip {
  display: block;
}

/* LIVE Indicator */
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ff0033;
  font-weight: 800;
  font-size: 10px;
  letter-spacing: 0.5px;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff0033;
  box-shadow: 0 0 6px #ff0033;
  animation: liveP 1.2s infinite;
}

@keyframes liveP {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

/* Right Tools: Volume, HD, PiP, Queue, Settings, Collapse */
.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.volume-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  gap: 5px;
}

.vol-step-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
}

.vol-step-btn:hover {
  color: var(--yt-text);
  color: #ffffff;
}

.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 58px;
  height: 4px;
  background: var(--yt-progress-track);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 9999px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.5);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 1px 3px rgba(0, 0, 0, 0.4);
}

/* Vertical Divider */
.bar-divider {
  width: 1.5px;
  height: 26px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 1px;
  margin: 0 4px;
  flex-shrink: 0;
}

/* Interactive HD / Resolution Badge Button */
.hd-badge-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--yt-border);
  color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.07);
  border: 1.2px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 9999px;
  letter-spacing: 0.8px;
  cursor: pointer;
  transition: all 0.15s ease;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  line-height: 1;
}

.hd-badge-btn:hover {
  background: var(--yt-hover-bg);
  color: var(--yt-text);
  border-color: var(--yt-text-secondary);
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.45);
  transform: scale(1.06);
}

.hd-badge-btn.active-hd {
  background: rgba(62, 166, 255, 0.16);
  background: rgba(62, 166, 255, 0.22);
  border-color: #3ea6ff;
  color: #3ea6ff;
  box-shadow: 0 0 10px rgba(62, 166, 255, 0.3);
  box-shadow: 0 0 12px rgba(62, 166, 255, 0.5);
}

/* Playback Quality Selector Popover */
.quality-popover {
  position: absolute;
  bottom: calc(100% + 14px);
  right: 65px;
  width: 220px;
  background: var(--yt-panel-bg);
  border: 1px solid var(--yt-border);
  border-radius: 14px;
  box-shadow: var(--yt-shadow);
  padding: 8px 0;
  display: none;
  flex-direction: column;
  z-index: 1000;
  animation: popoverFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.quality-popover.open {
  display: flex;
}

.quality-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 14px 10px 14px;
  border-bottom: 1px solid var(--yt-border);
  margin-bottom: 4px;
}

.quality-header-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--yt-text-secondary);
  border: 1px solid var(--yt-border);
  padding: 2px 5px;
}

.quality-current-tag {
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.12);
  color: var(--yt-text);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  cursor: default;
}

.quality-options-list {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow-y: auto;
}

.quality-option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--yt-text);
  transition: background 0.12s ease;
}

.quality-option-item:hover {
  background: var(--yt-hover-bg);
}

.quality-option-item.selected {
  color: #3ea6ff;
  font-weight: 700;
}

.quality-option-check {
  font-size: 13px;
  color: #3ea6ff;
  display: none;
}

.quality-option-item.selected .quality-option-check {
  display: inline-block;
}

.quality-option-hd-badge {
  font-size: 9px;
  font-weight: 800;
  background: #ff0033;
  color: #ffffff;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 6px;
}

/* Settings Popover Card */
.settings-popover {
  position: absolute;
  bottom: calc(100% + 14px);
  right: 0;
  width: 330px;
  background: var(--yt-panel-bg);
  border: 1px solid var(--yt-border);
  border-radius: 18px;
  box-shadow: var(--yt-shadow);
  padding: 16px;
  display: none;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
  color: var(--yt-text);
}

.settings-popover.open {
  display: flex;
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--yt-border);
}

.popover-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  color: var(--yt-text);
}

.popover-brand svg {
  width: 24px;
  height: 17px;
  display: block;
}

.popover-close-btn {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.popover-close-btn svg {
  width: 14px;
  height: 14px;
  fill: #ffffff !important;
}

.popover-close-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 0 12px rgba(255, 0, 51, 0.85);
}

.popover-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popover-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--yt-card-bg);
  border: 1px solid var(--yt-border);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.popover-card:hover {
  background: var(--yt-hover-bg);
}

.popover-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.popover-card-icon {
  font-size: 18px;
}

.popover-card-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popover-card-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--yt-text);
}

.popover-card-sub {
  font-size: 10.5px;
  color: var(--yt-text-secondary);
}

.popover-chevron {
  font-size: 16px;
  color: var(--yt-text-secondary);
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #ff0033;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* Sub-panel (Keyboard & Appearance) */
.sub-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  color: var(--yt-text);
  padding: 4px 0;
}

.sub-panel-back-btn {
  background: none;
  border: none;
  color: var(--yt-text);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  padding: 0;
}

.shortcuts-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
}

.shortcut-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--yt-card-bg);
  border-radius: 6px;
}

.shortcut-key {
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  font-family: monospace;
}

.theme-options-row {
  display: flex;
  gap: 8px;
}

.theme-pill-btn {
  flex: 1;
  background: var(--yt-card-bg);
  border: 1px solid var(--yt-border);
  color: var(--yt-text);
  padding: 8px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease;
}

.theme-pill-btn:hover {
  background: var(--yt-hover-bg);
}

.theme-pill-btn.active {
  background: #ff0033;
  color: #fff;
  border-color: #ff0033;
}

.popover-footer {
  text-align: center;
  font-size: 10.5px;
  color: var(--yt-text-secondary);
  padding-top: 4px;
}

/* Floating Queue Popover */
.queue-panel {
  position: absolute;
  bottom: calc(100% + 14px);
  right: 40px;
  width: 360px;
  max-height: 380px;
  background: var(--yt-panel-bg);
  border: 1px solid var(--yt-border);
  border-radius: 16px;
  box-shadow: var(--yt-shadow);
  display: none;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  color: var(--yt-text);
}

.queue-panel.open {
  display: flex;
}

.queue-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--yt-border);
  font-weight: 700;
  font-size: 13px;
}

.close-queue-btn {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  cursor: pointer;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.close-queue-btn svg {
  width: 14px;
  height: 14px;
  fill: #ffffff !important;
}

.close-queue-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 0 12px rgba(255, 0, 51, 0.85);
}

.queue-list {
  overflow-y: auto;
  max-height: 320px;
  display: flex;
  flex-direction: column;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.12s ease;
  border-bottom: 1px solid var(--yt-border);
}

.queue-item:hover {
  background: var(--yt-hover-bg);
}

.queue-thumb {
  width: 48px;
  height: 32px;
  border-radius: 4px;
  background: #000;
  flex-shrink: 0;
  overflow: hidden;
}

.queue-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.queue-details {
  flex: 1;
  min-width: 0;
}

.queue-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--yt-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-channel {
  font-size: 10px;
  color: var(--yt-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-empty-msg {
  padding: 24px;
  text-align: center;
  color: var(--yt-text-secondary);
  font-size: 12px;
}

/* ==========================================================================
   Floating Video Preview (with Smart Auto-Vanishing Controls on Hover)
   Floating Video Preview (Draggable, with Complete Video Controls)
   ========================================================================== */
.video-preview-window {
  position: fixed;
  bottom: 84px;
  right: 24px;
  pointer-events: auto !important;
  width: 350px;
  height: 200px;
  border-radius: 14px;
  width: 360px;
  height: 210px;
  border-radius: 16px;
  overflow: hidden;
  background: #000000;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.78), 0 0 0 1px rgba(255, 255, 255, 0.16);
  z-index: 2147483644;
  display: none;
  animation: popoverFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  touch-action: none;
}

.video-preview-window.open {
  display: block;
}

.video-preview-window.is-dragging {
  cursor: grabbing !important;
  transition: none !important;
  box-shadow: 0 26px 65px rgba(0, 0, 0, 0.95), 0 0 0 2px rgba(255, 0, 51, 0.6) !important;
  transform: scale(1.02);
}

.preview-media-wrap {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

.preview-media-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-video-frame {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  display: block;
  pointer-events: none;
  z-index: 1;
}

.preview-hit-shield {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: auto;
  background: transparent;
  cursor: pointer;
}

/* Preview controls appear only while the pointer is over the window. */
.preview-controls-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.78) 0%,
    rgba(0, 0, 0, 0.2) 40%,
    rgba(0, 0, 0, 0.88) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;
  z-index: 10;
}

.video-preview-window:hover .preview-controls-overlay,
.video-preview-window:focus-within .preview-controls-overlay,
.video-preview-window.is-hovered .preview-controls-overlay {
  opacity: 1;
  pointer-events: auto;
}

.preview-top-bar {
  display: flex;
  gap: 8px;
  min-width: 0;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: grab;
  padding-bottom: 2px;
}

.video-preview-window.is-dragging .preview-top-bar {
  cursor: grabbing !important;
}

.preview-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.preview-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-drag-grip {
  width: 13px;
  height: 13px;
  fill: rgba(255, 255, 255, 0.65);
  flex-shrink: 0;
}

.preview-top-bar:hover .preview-drag-grip {
  fill: #ffffff;
}

.preview-brand svg {
  width: 18px;
  height: 13px;
  flex-shrink: 0;
}

.preview-top-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.preview-icon-action-btn {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  color: #ffffff !important;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.preview-icon-action-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.1);
}

.preview-icon-action-btn svg {
  width: 13px;
  height: 13px;
  fill: #ffffff !important;
}

.preview-close-btn {
  background: rgba(0, 0, 0, 0.65) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.35) !important;
  color: #ffffff !important;
  width: 26px;
  height: 26px;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.preview-close-btn svg {
  width: 14px;
  height: 14px;
  width: 13px;
  height: 13px;
  fill: #ffffff !important;
}

.preview-close-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 0 12px rgba(255, 0, 51, 0.85);
}

.preview-center-controls {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  gap: 20px;
  gap: 12px;
}

.preview-icon-btn {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  width: 36px;
  height: 36px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease, transform 0.12s ease;
  transition: background 0.15s ease, transform 0.12s ease, border-color 0.15s ease;
}

.preview-icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.15);
  border-color: rgba(255, 255, 255, 0.45);
  transform: scale(1.12);
}

.preview-icon-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.preview-icon-btn svg {
  width: 17px;
  height: 17px;
  fill: currentColor;
}

.preview-prev-track,
.preview-next-track {
  display: flex;
}

.preview-play-btn {
  width: 44px;
  height: 44px;
  background: #ff0033;
  box-shadow: 0 0 16px rgba(255, 0, 51, 0.6);
  border-color: #ff0033;
  box-shadow: 0 0 16px rgba(255, 0, 51, 0.65);
}

.preview-play-btn:hover {
  background: #cc0029;
  border-color: #cc0029;
  transform: scale(1.12);
  box-shadow: 0 0 20px rgba(255, 0, 51, 0.85);
}

.preview-bottom-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.preview-progress-track {
  width: 100%;
  height: 3px;
  height: 4px;
  background: rgba(255, 255, 255, 0.28);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  transition: height 0.12s ease;
}

.preview-progress-track:hover {
  height: 5px;
  height: 6px;
}

.preview-progress-fill {
  height: 100%;
  background: #ff0033;
  border-radius: 2px;
  width: 0%;
}

.preview-bottom-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #e0e0e0;
  font-weight: 500;
}

.preview-meta-left {
  display: flex;
  align-items: center;
}

.preview-meta-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-vol-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-vol-btn {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  opacity: 0.85;
  transition: opacity 0.15s ease;
}

.preview-vol-btn:hover {
  opacity: 1;
}

.preview-vol-btn svg {
  width: 14px;
  height: 14px;
  fill: #ffffff;
}

.preview-vol-slider {
  width: 44px;
  height: 3px;
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  accent-color: #ff0033;
}

.preview-vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  cursor: pointer;
}

.preview-open-yt {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.15s ease, color 0.15s ease;
  font-size: 10.5px;
}

.preview-open-yt:hover {
  opacity: 1;
  color: #3ea6ff;
}

/* ==========================================================================
   YouTube Search Modal & Results Overlay
   ========================================================================== */
.yt-search-backdrop {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: auto !important;
  background: rgba(0, 0, 0, 0.75);
  z-index: 2147483646;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.yt-search-backdrop.open {
  display: flex !important;
}

.yt-search-modal {
  width: min(92vw, 640px);
  max-height: min(85vh, 660px);
  margin: auto;
  background: rgba(18, 19, 26, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 22px;
  box-shadow: var(--yt-shadow);
  background: #181922 !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 20px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #ffffff !important;
  animation: modalCenterPop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.yt-search-backdrop.theme-light {
  background: rgba(0, 0, 0, 0.45);
}

.yt-search-backdrop.theme-light .yt-search-modal {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: var(--yt-shadow);
  color: #111114;
  background: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.15) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25) !important;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-modal-title {
  color: #111114;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-modal-header,
.yt-search-backdrop.theme-light .search-input-section {
  border-color: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.1) !important;
}

.yt-search-backdrop.theme-light .search-cut-btn {
  background: rgba(0, 0, 0, 0.07) !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
  background: rgba(0, 0, 0, 0.08) !important;
  border-color: rgba(0, 0, 0, 0.18) !important;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-cut-btn svg {
  fill: #111114 !important;
}

.yt-search-backdrop.theme-light .search-cut-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
}

.yt-search-backdrop.theme-light .search-cut-btn:hover svg {
  fill: #ffffff !important;
}

.yt-search-backdrop.theme-light .search-input-box {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.18) !important;
}

.yt-search-backdrop.theme-light .search-icon-inside {
  fill: #55555e !important;
}

.yt-search-backdrop.theme-light .search-text-input {
  color: #111114;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-text-input::placeholder {
  color: #777780 !important;
}

.yt-search-backdrop.theme-light .search-clear-btn {
  color: #55555e !important;
}

.yt-search-backdrop.theme-light .search-status-msg {
  color: #55555e !important;
}

.yt-search-backdrop.theme-light .search-card-title {
  color: #111114;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-card-sub {
  color: #55555e !important;
}

.yt-search-backdrop.theme-light .search-result-card:hover {
  background: rgba(0, 0, 0, 0.06) !important;
}

.yt-search-backdrop.theme-light .search-chip {
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #33333e !important;
}

.yt-search-backdrop.theme-light .search-chip:hover {
  background: rgba(0, 0, 0, 0.1) !important;
  border-color: rgba(0, 0, 0, 0.22) !important;
  color: #000000 !important;
}

.yt-search-backdrop.theme-light .search-filter-bar {
  border-color: rgba(0, 0, 0, 0.08) !important;
}

.yt-search-backdrop.theme-light .search-filter-btn {
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  color: #44444e !important;
}

.yt-search-backdrop.theme-light .search-filter-btn:hover {
  background: rgba(0, 0, 0, 0.09) !important;
  color: #000000 !important;
}

.yt-search-backdrop.theme-light .search-filter-btn.active {
  background: #065fd4 !important;
  border-color: #065fd4 !important;
  color: #ffffff !important;
}

.yt-search-backdrop.theme-light .search-channel-card {
  background: rgba(0, 0, 0, 0.03) !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.yt-search-backdrop.theme-light .search-channel-avatar {
  border-color: rgba(0, 0, 0, 0.15) !important;
}

.yt-search-backdrop.theme-light .search-channel-visit-btn {
  background: rgba(0, 0, 0, 0.07) !important;
  border: 1px solid rgba(0, 0, 0, 0.15) !important;
  color: #111114 !important;
}

.yt-search-backdrop.theme-light .search-channel-visit-btn:hover {
  background: #cc0000 !important;
  border-color: #cc0000 !important;
  color: #ffffff !important;
}

@keyframes modalCenterPop {
  0% { transform: scale(0.92); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.search-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid var(--yt-border);
}

.search-modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--yt-text);
  color: #ffffff !important;
}

.search-modal-title svg {
  width: 24px;
  height: 17px;
  flex-shrink: 0;
}

.search-cut-btn {
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.28) !important;
  color: #ffffff !important;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.search-cut-btn svg {
  width: 18px;
  height: 18px;
  fill: #ffffff !important;
}

.search-cut-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
  transform: scale(1.14) rotate(90deg);
  box-shadow: 0 0 16px rgba(255, 0, 51, 0.85);
}

.search-input-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--yt-border);
}

.search-input-box {
  display: flex;
  align-items: center;
  background: var(--yt-card-bg);
  border: 1px solid var(--yt-border);
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1.5px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 24px;
  padding: 0 16px;
  height: 44px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.search-input-box:focus-within {
  border-color: #3ea6ff;
  box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.25);
  border-color: #3ea6ff !important;
  box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.3) !important;
}

.search-icon-inside {
  width: 18px;
  height: 18px;
  fill: var(--yt-text-secondary);
  fill: #aaaaaa !important;
  margin-right: 10px;
  flex-shrink: 0;
}

.search-text-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--yt-text);
  color: #ffffff !important;
  font-size: 14px;
  font-family: inherit;
}

.search-text-input::placeholder {
  color: var(--yt-text-secondary);
  color: #888894 !important;
}

.search-clear-btn {
  background: none;
  border: none;
  color: var(--yt-text-secondary);
  color: #aaaaaa !important;
  cursor: pointer;
  font-size: 14px;
  display: none;
  padding: 4px;
}

.search-clear-btn:hover {
  color: var(--yt-text);
  color: #ffffff !important;
}

.search-results-list {
  overflow-y: auto;
  padding: 8px 12px;
  max-height: 440px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  gap: 6px;
}

.search-status-msg {
  padding: 32px 20px;
  text-align: center;
  color: var(--yt-text-secondary);
  color: #aaaaaa !important;
  font-size: 13px;
}

.search-result-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.12s ease, transform 0.08s ease;
  background: transparent;
  transition: background 0.15s ease, transform 0.08s ease;
}

.search-result-card:hover {
  background: var(--yt-hover-bg);
  background: rgba(255, 255, 255, 0.1) !important;
  transform: translateX(2px);
}

.search-card-thumb {
  width: 96px;
  height: 54px;
  border-radius: 6px;
  border-radius: 8px;
  background: #000;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.search-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.search-duration-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.85);
  color: #ffffff;
  background: rgba(0, 0, 0, 0.88);
  color: #ffffff !important;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}

.search-card-meta {
  flex: 1;
  min-width: 0;
}

.search-card-title {
  font-size: 13.5px;
  font-size: 14px;
  font-weight: 600;
  color: var(--yt-text);
  margin-bottom: 3px;
  line-height: 1.3;
  color: #ffffff !important;
  margin-bottom: 4px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-card-sub {
  font-size: 11.5px;
  color: var(--yt-text-secondary);
  font-size: 12px;
  color: #aaaaaa !important;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.3;
}

.search-recommendation-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.search-chip {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  color: #dddddd !important;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  outline: none;
}

.search-chip:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.32);
  color: #ffffff !important;
  transform: translateY(-1px);
}

.search-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.search-filter-btn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  color: #cccccc !important;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  outline: none;
}

.search-filter-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff !important;
}

.search-filter-btn.active {
  background: #3ea6ff !important;
  border-color: #3ea6ff !important;
  color: #000000 !important;
  font-weight: 700;
}

.search-channel-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 14px;
  border-radius: 14px;
}

.search-channel-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.22);
  flex-shrink: 0;
}

.search-channel-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.search-badge-channel {
  background: rgba(255, 0, 51, 0.2);
  border: 1px solid rgba(255, 0, 51, 0.4);
  color: #ff4e6b !important;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: middle;
  letter-spacing: 0.5px;
}

.search-badge-playlist {
  background: rgba(62, 166, 255, 0.2);
  border: 1px solid rgba(62, 166, 255, 0.4);
  color: #3ea6ff !important;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: middle;
  letter-spacing: 0.5px;
}

.search-channel-visit-btn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 16px;
  color: #ffffff !important;
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  outline: none;
}

.search-channel-visit-btn:hover {
  background: #ff0033 !important;
  border-color: #ff0033 !important;
  color: #ffffff !important;
}

/* ==========================================================================
   Comprehensive Responsive Adjustments (Desktop, Tablet, Mobile)
   ========================================================================== */
@media (max-width: 1040px) {
  .bar-container {
    width: 96% !important;
    padding: 0 14px;
    gap: 12px;
  }
  .left-section {
    min-width: 180px;
    max-width: 230px;
  }
  .volume-slider {
    width: 44px;
  }
}

@media (max-width: 860px) {
  .bar-container {
    height: 64px;
    padding: 0 12px;
    gap: 10px;
  }
  .left-section {
    min-width: 140px;
    max-width: 180px;
  }
  .vol-step-btn {
    display: none !important;
  }
  .hd-badge-btn {
    display: none !important;
  }
  .seek-container {
    min-width: 130px;
  }
}

@media (max-width: 680px) {
  .bar-container {
    height: 58px;
    padding: 0 10px;
    gap: 8px;
    border-radius: 16px;
    bottom: 12px !important;
    width: 97% !important;
  }
  .left-section {
    min-width: 100px;
    max-width: 130px;
  }
  .channel-name {
    display: none !important;
  }
  .volume-wrap {
    display: none !important;
  }
  .preview-toggle-btn {
    display: none !important;
  }
  .queue-btn {
    display: none !important;
  }
  .skip-10-btn {
    display: none !important;
  }
  .time-row {
    font-size: 10px;
  }
  .yt-search-modal {
    width: 95vw;
    max-height: 90vh;
    border-radius: 18px;
  }
  .search-card-thumb {
    width: 76px;
    height: 44px;
  }
  .search-card-title {
    font-size: 12.5px;
  }
}

@media (max-width: 480px) {
  .bar-container {
    gap: 6px;
    padding: 0 8px;
  }
  .thumbnail-wrap {
    width: 36px;
    height: 36px;
  }
  .like-btn {
    display: none !important;
  }
  .buttons-group {
    gap: 4px;
  }
  .icon-btn.play-pause-btn {
    width: 38px;
    height: 38px;
  }
  .search-input-box {
    height: 40px;
    padding: 0 12px;
  }
  .floating-pill {
    left: 14px !important;
    bottom: 14px !important;
    width: 48px;
    height: 48px;
  }
  .floating-pill svg {
    width: 24px;
    height: 18px;
  }
}

/* Stable, accessible queue and search controls */
.queue-panel { max-height: min(480px, calc(100vh - 120px)); width: min(390px, calc(100vw - 32px)); }
.queue-header, .queue-tools, .queue-summary { flex-shrink: 0; }
.queue-tools { display: flex; gap: 8px; padding: 12px 14px 6px; }
.queue-filter { min-width: 0; flex: 1; }
.queue-filter, .queue-current-btn, .search-sort {
  font: inherit; color: var(--yt-text); background: var(--yt-bg);
  border: 1px solid var(--yt-border); border-radius: 8px; padding: 7px 9px;
}
.queue-current-btn { cursor: pointer; font-size: 11px; }
.queue-current-btn:disabled { opacity: 0.45; cursor: default; }
.queue-summary { padding: 0 14px 8px; color: var(--yt-text-secondary); font-size: 11px; }
.queue-list { min-height: 0; overscroll-behavior: contain; scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: #666 transparent; }
.queue-item { flex-shrink: 0; width: 100%; background: transparent; color: var(--yt-text); font: inherit; text-align: left; border: 0; border-bottom: 1px solid var(--yt-border); }
.queue-item.current { background: var(--yt-hover-bg); box-shadow: inset 3px 0 #ff0033; }
.queue-duration { flex-shrink: 0; font-size: 10px; color: var(--yt-text-secondary); }
.queue-item.current .queue-duration { color: #ff456e; }
.queue-item:focus-visible, .search-result-card:focus-visible, .queue-filter:focus-visible,
.queue-current-btn:focus-visible, .search-chip:focus-visible, .search-sort:focus-visible {
  outline: 2px solid #5aa9ff; outline-offset: -2px;
}
.search-tools, .search-recents { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 20px; color: var(--yt-text-secondary); font-size: 11px; flex-shrink: 0; }
.search-tools { justify-content: space-between; border-bottom: 1px solid var(--yt-border); }
.search-recents:empty { display: none; }
.search-recents .search-chip { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.search-tools label { display: flex; align-items: center; gap: 6px; }
.search-results-list { min-height: 0; overscroll-behavior: contain; scrollbar-gutter: stable; }
.search-status-msg .search-chip { display: block; margin: 12px auto 0; }

.preview-like-btn.liked svg { fill: #ff2d55 !important; }
.like-btn.unlike-anim, .preview-like-btn.unlike-anim { animation: ytUnlike 0.25s ease-out; }
@keyframes ytUnlike { 50% { transform: scale(0.8) rotate(8deg); } }
.like-btn.pop-anim::after, .preview-like-btn.pop-anim::after {
  content: ''; position: absolute; inset: -4px; border: 2px solid #ff456e;
  width: auto; height: auto; max-width: 48px; max-height: 48px;
  border-radius: 50%; pointer-events: none; animation: ytLikeRing 0.45s ease-out forwards;
}
.preview-like-btn { position: relative; overflow: hidden; isolation: isolate; }
@keyframes ytLikeRing { from { opacity: 0.9; transform: scale(0.7); } to { opacity: 0; transform: scale(1.5); } }
@media (prefers-reduced-motion: reduce) {
  .like-btn.pop-anim, .preview-like-btn.pop-anim, .like-btn.unlike-anim, .preview-like-btn.unlike-anim { animation: none; }
  .like-btn.pop-anim::after, .preview-like-btn.pop-anim::after { display: none; }
}

.preview-resize-handle {
  position: absolute; right: 0; bottom: 0; width: 18px; height: 18px;
  padding: 0; border: 0; background: #18181b; color: #fff;
  font-size: 13px; line-height: 18px; cursor: nwse-resize; touch-action: none;
  opacity: 0; pointer-events: none; z-index: 2;
  position: absolute; right: 0; bottom: 0; width: 20px; height: 20px;
  padding: 0; border: 0; background: rgba(24, 24, 27, 0.95); color: #fff;
  font-size: 13px; line-height: 20px; text-align: center; cursor: nwse-resize; touch-action: none;
  opacity: 0; pointer-events: none; z-index: 30; border-top-left-radius: 4px;
  transition: opacity 0.2s ease, background 0.15s ease;
}
.video-preview-window:hover .preview-resize-handle,
.video-preview-window:focus-within .preview-resize-handle,
.video-preview-window.is-hovered .preview-resize-handle,
.video-preview-window.is-resizing .preview-resize-handle,
.preview-resize-handle:focus-visible { opacity: 1; pointer-events: auto; }
.preview-resize-handle:focus-visible { outline: 2px solid #5aa9ff; outline-offset: -2px; }
.preview-bottom-meta { padding-right: 10px; }
.preview-resize-handle:hover { background: #ff0033; color: #fff; }
.video-preview-window.is-resizing {
  user-select: none !important;
  cursor: nwse-resize !important;
}
.video-preview-window.is-resizing .preview-controls-overlay {
  opacity: 1 !important;
  pointer-events: auto !important;
}
.preview-bottom-meta { padding-right: 14px; }

/* Both endpoints stay mounted while the dock extends/retracts like a tape. */
:host(.tape-transition) .bar-container {
  display: flex !important;
  transition: none !important;
  pointer-events: none !important;
  will-change: translate, clip-path;
}
:host(.tape-transition) .floating-pill {
  animation: none;
  display: flex !important;
  transform: none !important;
  transition: none !important;
  pointer-events: none !important;
  z-index: 1;
}
`;

// tests/styles-validation.test.ts
describe("CSS Syntax and Style Validation", () => {
  it("should have perfectly balanced braces in CONTROL_BAR_STYLES", () => {
    let openBraces = 0;
    const lines = CONTROL_BAR_STYLES.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const ch of line) {
        if (ch === "{")
          openBraces++;
        if (ch === "}")
          openBraces--;
      }
      assert.ok(openBraces >= 0, `Unmatched closing brace found around line ${i + 1}`);
    }
    assert.strictEqual(openBraces, 0, `There are ${openBraces} unclosed braces in CONTROL_BAR_STYLES`);
  });
  it("should contain all required core class rules", () => {
    const requiredRules = [
      ".bar-container",
      ".floating-pill",
      ".like-btn",
      ".hd-badge-btn",
      ".video-preview-window",
      ".yt-search-backdrop",
      ".search-cut-btn",
      ".pill-cut-btn",
      ".queue-panel",
      ".quality-popover",
      ".settings-popover",
      ".dock-toast",
      ".search-recommendation-chips",
      ".search-chip",
      ".search-filter-bar",
      ".search-filter-btn",
      ".search-channel-card",
      ".preview-drag-grip",
      ".preview-vol-slider",
      ".preview-prev-track",
      ".preview-next-track",
      ".preview-resize-handle",
      ".preview-hit-shield",
      ".preview-video-frame"
    ];
    for (const rule of requiredRules) {
      assert.ok(
        CONTROL_BAR_STYLES.includes(rule),
        `CONTROL_BAR_STYLES should define rule: ${rule}`
      );
    }
  });
  it("should have proper z-index layering for preview controls, resize handle, and hit shield", () => {
    assert.ok(
      CONTROL_BAR_STYLES.includes("z-index: 30"),
      "CONTROL_BAR_STYLES should give preview-resize-handle z-index: 30"
    );
    assert.ok(
      CONTROL_BAR_STYLES.includes("z-index: 10"),
      "CONTROL_BAR_STYLES should give preview-controls-overlay z-index: 10"
    );
    assert.ok(
      CONTROL_BAR_STYLES.includes(".video-preview-window.is-resizing"),
      "CONTROL_BAR_STYLES should define is-resizing state rules"
    );
    assert.ok(
      CONTROL_BAR_STYLES.includes("cursor: nwse-resize"),
      "CONTROL_BAR_STYLES should specify nwse-resize cursor for resizing"
    );
  });
});
