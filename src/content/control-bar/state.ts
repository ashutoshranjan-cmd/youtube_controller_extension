import {
  YouTubePlaybackState,
  YouTubeTabInfo
} from '../../types/messages.js';

export type StateListener = () => void;

export class ControlBarStateStore {
  private state: YouTubePlaybackState | null = null;
  private tabs: YouTubeTabInfo[] = [];
  private isMinimized = false;
  private isClosedByUser = false;
  private isBarEnabled = true;
  private listeners: Set<StateListener> = new Set();
  private isDraggingProgress = false;
  private dragProgressRatio = 0;

  // Client-side smooth time interpolation
  private interpolatedTime = 0;
  private lastInterpolationTimestamp = 0;
  private rafId: number | null = null;

  constructor() {
    this.startClock();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public update(state: YouTubePlaybackState | null, tabs: YouTubeTabInfo[]): void {
    this.state = state;
    this.tabs = tabs;

    if (state) {
      this.interpolatedTime = state.currentTime;
      this.lastInterpolationTimestamp = performance.now();
    }

    this.notify();
  }

  public setBarEnabled(enabled: boolean): void {
    this.isBarEnabled = enabled;
    if (enabled) {
      this.isClosedByUser = false;
    }
    this.notify();
  }

  public getBarEnabled(): boolean {
    return this.isBarEnabled;
  }

  public getState(): YouTubePlaybackState | null {
    return this.state;
  }

  public getTabs(): YouTubeTabInfo[] {
    return this.tabs;
  }

  public isVisible(): boolean {
    return this.isBarEnabled && !this.isClosedByUser;
  }

  public getMinimized(): boolean {
    return this.isMinimized;
  }

  public setMinimized(minimized: boolean): void {
    this.isMinimized = minimized;
    this.notify();
  }

  public toggleMinimized(): void {
    this.setMinimized(!this.isMinimized);
  }

  public close(): void {
    this.isClosedByUser = true;
    this.notify();
    try {
      chrome.runtime.sendMessage({
        type: 'SET_BAR_VISIBILITY',
        payload: { enabled: false }
      }).catch(() => {});
    } catch {}
  }

  public startDragging(ratio: number): void {
    this.isDraggingProgress = true;
    this.dragProgressRatio = Math.max(0, Math.min(1, ratio));
    this.notify();
  }

  public updateDragging(ratio: number): void {
    if (this.isDraggingProgress) {
      this.dragProgressRatio = Math.max(0, Math.min(1, ratio));
      this.notify();
    }
  }

  public stopDragging(): number {
    this.isDraggingProgress = false;
    const duration = this.state?.duration || 0;
    const targetSeconds = this.dragProgressRatio * duration;
    this.interpolatedTime = targetSeconds;
    this.notify();
    return targetSeconds;
  }

  public isDragging(): boolean {
    return this.isDraggingProgress;
  }

  public getCurrentProgressRatio(): number {
    if (this.isDraggingProgress) {
      return this.dragProgressRatio;
    }
    const duration = this.state?.duration || 0;
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.min(1, this.interpolatedTime / duration));
  }

  public getCurrentTime(): number {
    if (this.isDraggingProgress) {
      const duration = this.state?.duration || 0;
      return this.dragProgressRatio * duration;
    }
    return this.interpolatedTime;
  }

  private startClock(): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    const tick = (now: number) => {
      if (this.state && this.state.isPlaying && !this.isDraggingProgress) {
        if (this.lastInterpolationTimestamp > 0) {
          const delta = (now - this.lastInterpolationTimestamp) / 1000;
          this.interpolatedTime = Math.min(
            this.interpolatedTime + delta,
            this.state.duration || Infinity
          );
        }
      }
      this.lastInterpolationTimestamp = now;
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
    this.listeners.clear();
  }

  public static formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${m}:${pad(s)}`;
  }
}
