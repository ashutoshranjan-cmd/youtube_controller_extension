export interface VideoMetadata {
  videoId: string | null;
  title: string;
  channel: string;
  thumbnailUrl: string;
  isLive: boolean;
}

export class YouTubeMetadataExtractor {
  public getVideoId(): string | null {
    try {
      const url = new URL(window.location.href);
      const v = url.searchParams.get('v');
      if (v) return v;

      // Handle shorts: /shorts/{id}
      const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
    } catch {
      // Fallback regex
      const match = window.location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  public getTitle(): string {
    // 1. YouTube desktop watch metadata title
    const watchMeta = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    if (watchMeta && watchMeta.textContent?.trim()) {
      return watchMeta.textContent.trim();
    }

    // 2. Legacy watch title
    const legacyTitle = document.querySelector('#title h1 yt-formatted-string, ytd-video-primary-info-renderer h1');
    if (legacyTitle && legacyTitle.textContent?.trim()) {
      return legacyTitle.textContent.trim();
    }

    // 3. Meta title tag
    const metaTitle = document.querySelector('meta[name="title"]')?.getAttribute('content');
    if (metaTitle?.trim()) {
      return metaTitle.trim();
    }

    // 4. OpenGraph title
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle?.trim()) {
      return ogTitle.trim();
    }

    // 5. Document title clean-up
    if (document.title) {
      const cleaned = document.title.replace(/^\([0-9]+\)\s*/, '').replace(/ - YouTube$/, '').trim();
      if (cleaned && cleaned !== 'YouTube') {
        return cleaned;
      }
    }

    return 'YouTube Video';
  }

  public getChannel(): string {
    // 1. Channel name inside watch page metadata
    const channelAnchor = document.querySelector(
      'ytd-watch-metadata #channel-name a, #owner #channel-name a, ytd-channel-name yt-formatted-string a'
    );
    if (channelAnchor && channelAnchor.textContent?.trim()) {
      return channelAnchor.textContent.trim();
    }

    // 2. Meta itemprop author
    const metaAuthor = document.querySelector('span[itemprop="author"] link[itemprop="name"]')?.getAttribute('content');
    if (metaAuthor?.trim()) {
      return metaAuthor.trim();
    }

    // 3. Channel link in compact renderer
    const genericChannel = document.querySelector('#upload-info #channel-name')?.textContent?.trim();
    if (genericChannel) {
      return genericChannel;
    }

    return '';
  }

  public getThumbnailUrl(videoId: string | null): string {
    if (videoId) {
      return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    }

    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImage && ogImage.startsWith('https://')) {
      return ogImage;
    }

    return '';
  }

  public isLiveStream(video: HTMLVideoElement | null): boolean {
    if (!video) return false;
    if (!isFinite(video.duration) || video.duration === Infinity) return true;
    return !!document.querySelector('.ytp-live, .ytp-live-badge[disabled=""]');
  }

  public extract(video: HTMLVideoElement | null): VideoMetadata {
    const videoId = this.getVideoId();
    return {
      videoId,
      title: this.getTitle(),
      channel: this.getChannel(),
      thumbnailUrl: this.getThumbnailUrl(videoId),
      isLive: this.isLiveStream(video)
    };
  }
}

