import { QueueItem } from '../../types/messages.js';

export class YouTubeQueueExtractor {
  /**
   * Extracts playlist items or Up-Next recommendations currently rendered in the DOM.
   */
  public extractQueue(): { items: QueueItem[]; available: boolean } {
    // 1. Try playlist items first (most accurate queue)
    const playlistItems = document.querySelectorAll<HTMLElement>(
      'ytd-playlist-panel-renderer ytd-playlist-panel-video-renderer'
    );

    if (playlistItems.length > 0) {
      const items: QueueItem[] = [];
      playlistItems.forEach((el, index) => {
        if (index > 25) return; // Cap at reasonable length to avoid bloat

        const anchor = el.querySelector<HTMLAnchorElement>('a#wc-endpoint');
        const titleEl = el.querySelector<HTMLElement>('#video-title');
        const channelEl = el.querySelector<HTMLElement>('#byline, .ytd-channel-name');
        const imgEl = el.querySelector<HTMLImageElement>('img');

        const title = titleEl?.textContent?.trim() || '';
        const href = anchor?.getAttribute('href') || '';
        if (!title || !href) return;

        const videoId = this.parseVideoIdFromHref(href);
        const isSelected = el.hasAttribute('selected') || el.classList.contains('selected');

        items.push({
          videoId: videoId || `item-${index}`,
          title,
          channel: channelEl?.textContent?.trim() || '',
          thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : (imgEl?.src || ''),
          url: this.ensureAbsoluteUrl(href),
          isCurrent: isSelected
        });
      });

      if (items.length > 0) {
        return { items, available: true };
      }
    }

    // 2. Try Up-Next / Related items
    const relatedItems = document.querySelectorAll<HTMLElement>(
      '#related ytd-compact-video-renderer, ytd-watch-next-secondary-results-renderer ytd-compact-video-renderer'
    );

    if (relatedItems.length > 0) {
      const items: QueueItem[] = [];
      relatedItems.forEach((el, index) => {
        if (index > 20) return;

        const anchor = el.querySelector<HTMLAnchorElement>('a#thumbnail');
        const titleEl = el.querySelector<HTMLElement>('#video-title');
        const channelEl = el.querySelector<HTMLElement>('ytd-channel-name #text, .ytd-channel-name');
        const timeEl = el.querySelector<HTMLElement>('ytd-thumbnail-overlay-time-status-renderer badge-shape');

        const title = titleEl?.textContent?.trim() || '';
        const href = anchor?.getAttribute('href') || '';
        if (!title || !href) return;

        const videoId = this.parseVideoIdFromHref(href);

        items.push({
          videoId: videoId || `rel-${index}`,
          title,
          channel: channelEl?.textContent?.trim() || '',
          thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '',
          durationText: timeEl?.textContent?.trim() || '',
          url: this.ensureAbsoluteUrl(href),
          isCurrent: false
        });
      });

      if (items.length > 0) {
        return { items, available: true };
      }
    }

    return { items: [], available: false };
  }

  /**
   * Plays a queue item by clicking its corresponding DOM anchor or navigating in-page.
   */
  public playItem(url: string, videoId?: string): boolean {
    if (!url && !videoId) return false;

    // 1. Try to find matching anchor in DOM to trigger native YouTube client-side transition
    if (videoId) {
      const anchor = document.querySelector<HTMLAnchorElement>(
        `a[href*="v=${videoId}"], a[href*="/watch?v=${videoId}"]`
      );
      if (anchor) {
        anchor.click();
        return true;
      }
    }

    // 2. Direct client-side navigation using YouTube custom navigation event or location
    const targetUrl = this.ensureAbsoluteUrl(url);
    try {
      window.location.href = targetUrl;
      return true;
    } catch {
      return false;
    }
  }

  private parseVideoIdFromHref(href: string): string | null {
    try {
      const url = new URL(href, 'https://www.youtube.com');
      return url.searchParams.get('v');
    } catch {
      const match = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }
  }

  private ensureAbsoluteUrl(href: string): string {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    return new URL(href, 'https://www.youtube.com').href;
  }
}

