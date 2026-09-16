export type StateChangeCallback = () => void;

export class YouTubeSPAObserver {
  private boundVideo: HTMLVideoElement | null = null;
  private onStateChange: StateChangeCallback;
  private lastTimeUpdate = 0;
  private readonly THROTTLE_MS = 300;
  private mutationObserver: MutationObserver | null = null;

  constructor(onStateChange: StateChangeCallback) {
    this.onStateChange = onStateChange;
    this.init();
  }

  private init(): void {
    // 1. YouTube SPA custom lifecycle events
    window.addEventListener('yt-navigate-finish', this.handleNavigation);
    window.addEventListener('yt-page-data-updated', this.handlePageData);
    window.addEventListener('popstate', this.handleNavigation);

    // 2. Initial video binding
    this.bindVideo();

    // 3. Fallback lightweight observer in case video element is injected after script runs
    this.mutationObserver = new MutationObserver(() => {
      const currentVideo = document.querySelector('video.html5-main-video, video') as HTMLVideoElement | null;
      if (currentVideo && currentVideo !== this.boundVideo) {
        this.bindVideo();
      }
    });

    this.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  private handleNavigation = (): void => {
    // Re-bind video element and notify
    setTimeout(() => {
      this.bindVideo();
      this.onStateChange();
    }, 150);
  };

  private handlePageData = (): void => {
    this.onStateChange();
  };

  public bindVideo(): void {
    const video = (document.querySelector('video.html5-main-video') as HTMLVideoElement) ||
                  (document.querySelector('video') as HTMLVideoElement);

    if (video === this.boundVideo) return;

    if (this.boundVideo) {
      this.unbindVideo(this.boundVideo);
    }

    if (video) {
      this.boundVideo = video;
      video.addEventListener('play', this.handleVideoEvent);
      video.addEventListener('pause', this.handleVideoEvent);
      video.addEventListener('timeupdate', this.handleTimeUpdate);
      video.addEventListener('volumechange', this.handleVideoEvent);
      video.addEventListener('ended', this.handleVideoEvent);
      video.addEventListener('durationchange', this.handleVideoEvent);
      video.addEventListener('seeked', this.handleVideoEvent);
      this.onStateChange();
    }
  }

  private unbindVideo(video: HTMLVideoElement): void {
    video.removeEventListener('play', this.handleVideoEvent);
    video.removeEventListener('pause', this.handleVideoEvent);
    video.removeEventListener('timeupdate', this.handleTimeUpdate);
    video.removeEventListener('volumechange', this.handleVideoEvent);
    video.removeEventListener('ended', this.handleVideoEvent);
    video.removeEventListener('durationchange', this.handleVideoEvent);
    video.removeEventListener('seeked', this.handleVideoEvent);
  }

  private handleVideoEvent = (): void => {
    this.onStateChange();
  };

  private handleTimeUpdate = (): void => {
    const now = Date.now();
    if (now - this.lastTimeUpdate >= this.THROTTLE_MS) {
      this.lastTimeUpdate = now;
      this.onStateChange();
    }
  };

  public destroy(): void {
    window.removeEventListener('yt-navigate-finish', this.handleNavigation);
    window.removeEventListener('yt-page-data-updated', this.handlePageData);
    window.removeEventListener('popstate', this.handleNavigation);
    if (this.boundVideo) {
      this.unbindVideo(this.boundVideo);
      this.boundVideo = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}

