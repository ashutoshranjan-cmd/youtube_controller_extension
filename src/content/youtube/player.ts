export class YouTubePlayerController {
  public getVideoElement(): HTMLVideoElement | null {
    return (
      (document.querySelector('video.html5-main-video') as HTMLVideoElement) ||
      (document.querySelector('video') as HTMLVideoElement) ||
      null
    );
  }

  public play(): boolean {
    const video = this.getVideoElement();
    if (video) {
      video.play().catch(() => {});
      return true;
    }
    return false;
  }

  public pause(): boolean {
    const video = this.getVideoElement();
    if (video) {
      video.pause();
      return true;
    }
    return false;
  }

  public togglePlay(): boolean {
    const video = this.getVideoElement();
    if (video) {
      if (video.paused || video.ended) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      return true;
    }
    return false;
  }

  public seek(seconds: number): boolean {
    const video = this.getVideoElement();
    if (video && isFinite(video.duration) && video.duration > 0) {
      const target = Math.max(0, Math.min(seconds, video.duration));
      video.currentTime = target;
      return true;
    }
    return false;
  }

  public seekRelative(deltaSeconds: number): boolean {
    const video = this.getVideoElement();
    if (video && isFinite(video.duration) && video.duration > 0) {
      const target = Math.max(0, Math.min(video.currentTime + deltaSeconds, video.duration));
      video.currentTime = target;
      return true;
    }
    return false;
  }

  public setVolume(percent: number): boolean {
    const video = this.getVideoElement();
    if (video) {
      const normalized = Math.max(0, Math.min(100, percent)) / 100;
      video.volume = normalized;
      if (video.muted && normalized > 0) {
        video.muted = false;
      }
      return true;
    }
    return false;
  }

  public stepVolume(stepDelta: number): boolean {
    const video = this.getVideoElement();
    if (video) {
      const currentPct = Math.round(video.volume * 100);
      return this.setVolume(currentPct + stepDelta);
    }
    return false;
  }

  public toggleMute(): boolean {
    const video = this.getVideoElement();
    if (video) {
      video.muted = !video.muted;
      return true;
    }
    return false;
  }

  public async togglePiP(): Promise<boolean> {
    const video = this.getVideoElement();
    if (!video) return false;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
      return true;
    } catch {
      // Fallback: click YouTube native miniplayer button
      const miniBtn = document.querySelector<HTMLElement>('.ytp-miniplayer-button');
      if (miniBtn) {
        miniBtn.click();
        return true;
      }
      return false;
    }
  }

  private getLikeButton(): HTMLElement | null {
    return (
      document.querySelector<HTMLElement>('like-button-view-model button') ||
      document.querySelector<HTMLElement>('#segmented-like-button button') ||
      document.querySelector<HTMLElement>('ytd-segmented-like-dislike-button-renderer like-button-view-model button') ||
      document.querySelector<HTMLElement>('ytd-segmented-like-dislike-button-renderer button') ||
      document.querySelector<HTMLElement>('ytd-like-button-renderer button') ||
      document.querySelector<HTMLElement>('button[aria-label*="like this video" i]') ||
      document.querySelector<HTMLElement>('button[aria-label*="I like this" i]') ||
      document.querySelector<HTMLElement>('#top-level-buttons-computed ytd-toggle-button-renderer:first-child button') ||
      null
    );
  }

  public toggleLike(): boolean {
    const likeBtn = this.getLikeButton();
    if (likeBtn) {
      likeBtn.click();
      return true;
    }
    return false;
  }

  public isLiked(): boolean {
    const likeBtn = this.getLikeButton();
    if (likeBtn) {
      const ariaPressed = likeBtn.getAttribute('aria-pressed') === 'true';
      const ariaLabel = (likeBtn.getAttribute('aria-label') || '').toLowerCase();
      const parentPressed = likeBtn.closest('[aria-pressed="true"]') !== null;
      const isUnlike = ariaLabel.includes('unlike') || ariaLabel.includes('remove like');
      const hasActiveClass = likeBtn.classList.contains('style-default-active') ||
                             likeBtn.closest('.style-default-active') !== null;
      return ariaPressed || parentPressed || isUnlike || hasActiveClass;
    }
    return false;
  }

  public toggleLoop(): boolean {
    const video = this.getVideoElement();
    if (video) {
      video.loop = !video.loop;
      return true;
    }
    return false;
  }

  public next(): boolean {
    // 1. Try clicking YouTube native next button
    const nextBtn = document.querySelector<HTMLElement>('.ytp-next-button, a.ytp-next-button');
    if (nextBtn && nextBtn.getAttribute('aria-disabled') !== 'true' && nextBtn.style.display !== 'none') {
      nextBtn.click();
      return true;
    }

    // 2. Try dispatching YouTube native shortcut Shift + N
    this.dispatchKeyboardShortcut('KeyN', 'N', true);
    return true;
  }

  public previous(): boolean {
    const video = this.getVideoElement();
    // If we are more than 3 seconds in, restart the video
    if (video && video.currentTime > 3) {
      video.currentTime = 0;
      return true;
    }

    // Otherwise click previous button
    const prevBtn = document.querySelector<HTMLElement>('.ytp-prev-button, a.ytp-prev-button');
    if (prevBtn && prevBtn.getAttribute('aria-disabled') !== 'true' && prevBtn.style.display !== 'none') {
      prevBtn.click();
      return true;
    }

    // Fallback: YouTube native shortcut Shift + P
    this.dispatchKeyboardShortcut('KeyP', 'P', true);
    return true;
  }

  public hasNext(): boolean {
    const nextBtn = document.querySelector<HTMLElement>('.ytp-next-button, a.ytp-next-button');
    return !!nextBtn && nextBtn.getAttribute('aria-disabled') !== 'true';
  }

  public hasPrevious(): boolean {
    const prevBtn = document.querySelector<HTMLElement>('.ytp-prev-button, a.ytp-prev-button');
    const video = this.getVideoElement();
    return (!!prevBtn && prevBtn.getAttribute('aria-disabled') !== 'true') || (!!video && video.currentTime > 3);
  }

  private dispatchKeyboardShortcut(code: string, key: string, shiftKey = false): void {
    const target = document.querySelector('.html5-video-player') || document.body;
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code,
      key,
      shiftKey,
      keyCode: code === 'KeyN' ? 78 : 80,
      which: code === 'KeyN' ? 78 : 80
    });
    target.dispatchEvent(event);
  }

  public setQuality(quality: string): boolean {
    window.postMessage(
      {
        source: 'YT_ISOLATED_WORLD_QUALITY',
        type: 'SET_QUALITY',
        quality
      },
      '*'
    );
    return true;
  }
}

