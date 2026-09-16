"use strict";
(() => {
  // src/content/youtube/player.ts
  var YouTubePlayerController = class {
    getVideoElement() {
      return document.querySelector("video.html5-main-video") || document.querySelector("video") || null;
    }
    play() {
      const video = this.getVideoElement();
      if (video) {
        video.play().catch(() => {
        });
        return true;
      }
      return false;
    }
    pause() {
      const video = this.getVideoElement();
      if (video) {
        video.pause();
        return true;
      }
      return false;
    }
    togglePlay() {
      const video = this.getVideoElement();
      if (video) {
        if (video.paused || video.ended) {
          video.play().catch(() => {
          });
        } else {
          video.pause();
        }
        return true;
      }
      return false;
    }
    seek(seconds) {
      const video = this.getVideoElement();
      if (video && isFinite(video.duration) && video.duration > 0) {
        const target = Math.max(0, Math.min(seconds, video.duration));
        video.currentTime = target;
        return true;
      }
      return false;
    }
    seekRelative(deltaSeconds) {
      const video = this.getVideoElement();
      if (video && isFinite(video.duration) && video.duration > 0) {
        const target = Math.max(0, Math.min(video.currentTime + deltaSeconds, video.duration));
        video.currentTime = target;
        return true;
      }
      return false;
    }
    setVolume(percent) {
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
    stepVolume(stepDelta) {
      const video = this.getVideoElement();
      if (video) {
        const currentPct = Math.round(video.volume * 100);
        return this.setVolume(currentPct + stepDelta);
      }
      return false;
    }
    toggleMute() {
      const video = this.getVideoElement();
      if (video) {
        video.muted = !video.muted;
        return true;
      }
      return false;
    }
    async togglePiP() {
      const video = this.getVideoElement();
      if (!video)
        return false;
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
          await video.requestPictureInPicture();
        }
        return true;
      } catch {
        const miniBtn = document.querySelector(".ytp-miniplayer-button");
        if (miniBtn) {
          miniBtn.click();
          return true;
        }
        return false;
      }
    }
    getLikeButton() {
      return document.querySelector("like-button-view-model button") || document.querySelector("#segmented-like-button button") || document.querySelector("ytd-segmented-like-dislike-button-renderer like-button-view-model button") || document.querySelector("ytd-segmented-like-dislike-button-renderer button") || document.querySelector("ytd-like-button-renderer button") || document.querySelector('button[aria-label*="like this video" i]') || document.querySelector('button[aria-label*="I like this" i]') || document.querySelector("#top-level-buttons-computed ytd-toggle-button-renderer:first-child button") || null;
    }
    toggleLike() {
      const likeBtn = this.getLikeButton();
      if (likeBtn) {
        likeBtn.click();
        return true;
      }
      return false;
    }
    isLiked() {
      const likeBtn = this.getLikeButton();
      if (likeBtn) {
        const ariaPressed = likeBtn.getAttribute("aria-pressed") === "true";
        const ariaLabel = (likeBtn.getAttribute("aria-label") || "").toLowerCase();
        const parentPressed = likeBtn.closest('[aria-pressed="true"]') !== null;
        const isUnlike = ariaLabel.includes("unlike") || ariaLabel.includes("remove like");
        const hasActiveClass = likeBtn.classList.contains("style-default-active") || likeBtn.closest(".style-default-active") !== null;
        return ariaPressed || parentPressed || isUnlike || hasActiveClass;
      }
      return false;
    }
    toggleLoop() {
      const video = this.getVideoElement();
      if (video) {
        video.loop = !video.loop;
        return true;
      }
      return false;
    }
    next() {
      const nextBtn = document.querySelector(".ytp-next-button, a.ytp-next-button");
      if (nextBtn && nextBtn.getAttribute("aria-disabled") !== "true" && nextBtn.style.display !== "none") {
        nextBtn.click();
        return true;
      }
      this.dispatchKeyboardShortcut("KeyN", "N", true);
      return true;
    }
    previous() {
      const video = this.getVideoElement();
      if (video && video.currentTime > 3) {
        video.currentTime = 0;
        return true;
      }
      const prevBtn = document.querySelector(".ytp-prev-button, a.ytp-prev-button");
      if (prevBtn && prevBtn.getAttribute("aria-disabled") !== "true" && prevBtn.style.display !== "none") {
        prevBtn.click();
        return true;
      }
      this.dispatchKeyboardShortcut("KeyP", "P", true);
      return true;
    }
    hasNext() {
      const nextBtn = document.querySelector(".ytp-next-button, a.ytp-next-button");
      return !!nextBtn && nextBtn.getAttribute("aria-disabled") !== "true";
    }
    hasPrevious() {
      const prevBtn = document.querySelector(".ytp-prev-button, a.ytp-prev-button");
      const video = this.getVideoElement();
      return !!prevBtn && prevBtn.getAttribute("aria-disabled") !== "true" || !!video && video.currentTime > 3;
    }
    dispatchKeyboardShortcut(code, key, shiftKey = false) {
      const target = document.querySelector(".html5-video-player") || document.body;
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        code,
        key,
        shiftKey,
        keyCode: code === "KeyN" ? 78 : 80,
        which: code === "KeyN" ? 78 : 80
      });
      target.dispatchEvent(event);
    }
    setQuality(quality) {
      window.postMessage(
        {
          source: "YT_ISOLATED_WORLD_QUALITY",
          type: "SET_QUALITY",
          quality
        },
        "*"
      );
      return true;
    }
  };

  // src/content/youtube/metadata.ts
  var YouTubeMetadataExtractor = class {
    getVideoId() {
      try {
        const url = new URL(window.location.href);
        const v = url.searchParams.get("v");
        if (v)
          return v;
        const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
        if (shortsMatch && shortsMatch[1])
          return shortsMatch[1];
      } catch {
        const match = window.location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match && match[1])
          return match[1];
      }
      return null;
    }
    getTitle() {
      const watchMeta = document.querySelector("h1.ytd-watch-metadata yt-formatted-string");
      if (watchMeta && watchMeta.textContent?.trim()) {
        return watchMeta.textContent.trim();
      }
      const legacyTitle = document.querySelector("#title h1 yt-formatted-string, ytd-video-primary-info-renderer h1");
      if (legacyTitle && legacyTitle.textContent?.trim()) {
        return legacyTitle.textContent.trim();
      }
      const metaTitle = document.querySelector('meta[name="title"]')?.getAttribute("content");
      if (metaTitle?.trim()) {
        return metaTitle.trim();
      }
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
      if (ogTitle?.trim()) {
        return ogTitle.trim();
      }
      if (document.title) {
        const cleaned = document.title.replace(/^\([0-9]+\)\s*/, "").replace(/ - YouTube$/, "").trim();
        if (cleaned && cleaned !== "YouTube") {
          return cleaned;
        }
      }
      return "YouTube Video";
    }
    getChannel() {
      const channelAnchor = document.querySelector(
        "ytd-watch-metadata #channel-name a, #owner #channel-name a, ytd-channel-name yt-formatted-string a"
      );
      if (channelAnchor && channelAnchor.textContent?.trim()) {
        return channelAnchor.textContent.trim();
      }
      const metaAuthor = document.querySelector('span[itemprop="author"] link[itemprop="name"]')?.getAttribute("content");
      if (metaAuthor?.trim()) {
        return metaAuthor.trim();
      }
      const genericChannel = document.querySelector("#upload-info #channel-name")?.textContent?.trim();
      if (genericChannel) {
        return genericChannel;
      }
      return "";
    }
    getThumbnailUrl(videoId) {
      if (videoId) {
        return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
      }
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
      if (ogImage && ogImage.startsWith("https://")) {
        return ogImage;
      }
      return "";
    }
    isLiveStream(video) {
      if (!video)
        return false;
      if (!isFinite(video.duration) || video.duration === Infinity)
        return true;
      return !!document.querySelector('.ytp-live, .ytp-live-badge[disabled=""]');
    }
    extract(video) {
      const videoId = this.getVideoId();
      return {
        videoId,
        title: this.getTitle(),
        channel: this.getChannel(),
        thumbnailUrl: this.getThumbnailUrl(videoId),
        isLive: this.isLiveStream(video)
      };
    }
  };

  // src/content/youtube/queue.ts
  var YouTubeQueueExtractor = class {
    /**
     * Extracts playlist items or Up-Next recommendations currently rendered in the DOM.
     */
    extractQueue() {
      const playlistItems = document.querySelectorAll(
        "ytd-playlist-panel-renderer ytd-playlist-panel-video-renderer"
      );
      if (playlistItems.length > 0) {
        const items = [];
        playlistItems.forEach((el, index) => {
          if (index > 25)
            return;
          const anchor = el.querySelector("a#wc-endpoint");
          const titleEl = el.querySelector("#video-title");
          const channelEl = el.querySelector("#byline, .ytd-channel-name");
          const imgEl = el.querySelector("img");
          const title = titleEl?.textContent?.trim() || "";
          const href = anchor?.getAttribute("href") || "";
          if (!title || !href)
            return;
          const videoId = this.parseVideoIdFromHref(href);
          const isSelected = el.hasAttribute("selected") || el.classList.contains("selected");
          items.push({
            videoId: videoId || `item-${index}`,
            title,
            channel: channelEl?.textContent?.trim() || "",
            thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : imgEl?.src || "",
            url: this.ensureAbsoluteUrl(href),
            isCurrent: isSelected
          });
        });
        if (items.length > 0) {
          return { items, available: true };
        }
      }
      const relatedItems = document.querySelectorAll(
        "#related ytd-compact-video-renderer, ytd-watch-next-secondary-results-renderer ytd-compact-video-renderer"
      );
      if (relatedItems.length > 0) {
        const items = [];
        relatedItems.forEach((el, index) => {
          if (index > 20)
            return;
          const anchor = el.querySelector("a#thumbnail");
          const titleEl = el.querySelector("#video-title");
          const channelEl = el.querySelector("ytd-channel-name #text, .ytd-channel-name");
          const timeEl = el.querySelector("ytd-thumbnail-overlay-time-status-renderer badge-shape");
          const title = titleEl?.textContent?.trim() || "";
          const href = anchor?.getAttribute("href") || "";
          if (!title || !href)
            return;
          const videoId = this.parseVideoIdFromHref(href);
          items.push({
            videoId: videoId || `rel-${index}`,
            title,
            channel: channelEl?.textContent?.trim() || "",
            thumbnailUrl: videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : "",
            durationText: timeEl?.textContent?.trim() || "",
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
    playItem(url, videoId) {
      if (!url && !videoId)
        return false;
      if (videoId) {
        const anchor = document.querySelector(
          `a[href*="v=${videoId}"], a[href*="/watch?v=${videoId}"]`
        );
        if (anchor) {
          anchor.click();
          return true;
        }
      }
      const targetUrl = this.ensureAbsoluteUrl(url);
      try {
        window.location.href = targetUrl;
        return true;
      } catch {
        return false;
      }
    }
    parseVideoIdFromHref(href) {
      try {
        const url = new URL(href, "https://www.youtube.com");
        return url.searchParams.get("v");
      } catch {
        const match = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
      }
    }
    ensureAbsoluteUrl(href) {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        return href;
      }
      return new URL(href, "https://www.youtube.com").href;
    }
  };

  // src/content/youtube/spa-observer.ts
  var YouTubeSPAObserver = class {
    boundVideo = null;
    onStateChange;
    lastTimeUpdate = 0;
    THROTTLE_MS = 300;
    mutationObserver = null;
    constructor(onStateChange) {
      this.onStateChange = onStateChange;
      this.init();
    }
    init() {
      window.addEventListener("yt-navigate-finish", this.handleNavigation);
      window.addEventListener("yt-page-data-updated", this.handlePageData);
      window.addEventListener("popstate", this.handleNavigation);
      this.bindVideo();
      this.mutationObserver = new MutationObserver(() => {
        const currentVideo = document.querySelector("video.html5-main-video, video");
        if (currentVideo && currentVideo !== this.boundVideo) {
          this.bindVideo();
        }
      });
      this.mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    handleNavigation = () => {
      setTimeout(() => {
        this.bindVideo();
        this.onStateChange();
      }, 150);
    };
    handlePageData = () => {
      this.onStateChange();
    };
    bindVideo() {
      const video = document.querySelector("video.html5-main-video") || document.querySelector("video");
      if (video === this.boundVideo)
        return;
      if (this.boundVideo) {
        this.unbindVideo(this.boundVideo);
      }
      if (video) {
        this.boundVideo = video;
        video.addEventListener("play", this.handleVideoEvent);
        video.addEventListener("pause", this.handleVideoEvent);
        video.addEventListener("timeupdate", this.handleTimeUpdate);
        video.addEventListener("volumechange", this.handleVideoEvent);
        video.addEventListener("ended", this.handleVideoEvent);
        video.addEventListener("durationchange", this.handleVideoEvent);
        video.addEventListener("seeked", this.handleVideoEvent);
        this.onStateChange();
      }
    }
    unbindVideo(video) {
      video.removeEventListener("play", this.handleVideoEvent);
      video.removeEventListener("pause", this.handleVideoEvent);
      video.removeEventListener("timeupdate", this.handleTimeUpdate);
      video.removeEventListener("volumechange", this.handleVideoEvent);
      video.removeEventListener("ended", this.handleVideoEvent);
      video.removeEventListener("durationchange", this.handleVideoEvent);
      video.removeEventListener("seeked", this.handleVideoEvent);
    }
    handleVideoEvent = () => {
      this.onStateChange();
    };
    handleTimeUpdate = () => {
      const now = Date.now();
      if (now - this.lastTimeUpdate >= this.THROTTLE_MS) {
        this.lastTimeUpdate = now;
        this.onStateChange();
      }
    };
    destroy() {
      window.removeEventListener("yt-navigate-finish", this.handleNavigation);
      window.removeEventListener("yt-page-data-updated", this.handlePageData);
      window.removeEventListener("popstate", this.handleNavigation);
      if (this.boundVideo) {
        this.unbindVideo(this.boundVideo);
        this.boundVideo = null;
      }
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    }
  };

  // src/content/youtube/index.ts
  var player = new YouTubePlayerController();
  var metadataExtractor = new YouTubeMetadataExtractor();
  var queueExtractor = new YouTubeQueueExtractor();
  var currentQuality = "auto";
  var availableQualities = [
    { quality: "auto", label: "Auto", isHD: false },
    { quality: "hd1080", label: "1080p HD", isHD: true },
    { quality: "hd720", label: "720p HD", isHD: true },
    { quality: "large", label: "480p", isHD: false },
    { quality: "medium", label: "360p", isHD: false },
    { quality: "small", label: "240p", isHD: false }
  ];
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.source !== "YT_MAIN_WORLD_QUALITY") {
      return;
    }
    if (event.data.type === "QUALITY_UPDATE") {
      if (event.data.currentQuality) {
        currentQuality = event.data.currentQuality;
      }
      if (Array.isArray(event.data.availableQualities) && event.data.availableQualities.length > 0) {
        availableQualities = event.data.availableQualities;
      }
      sendStateUpdate();
    }
  });
  function getCurrentState() {
    const video = player.getVideoElement();
    const metadata = metadataExtractor.extract(video);
    const queueResult = queueExtractor.extractQueue();
    const currentTime = video ? video.currentTime : 0;
    const duration = video && isFinite(video.duration) ? video.duration : 0;
    const isPlaying = video ? !video.paused && !video.ended && video.readyState > 2 : false;
    const volume = video ? Math.round(video.volume * 100) : 100;
    const isMuted = video ? video.muted : false;
    return {
      tabId: -1,
      // Populated by background service worker based on sender.tab.id
      videoId: metadata.videoId,
      title: metadata.title,
      channel: metadata.channel,
      thumbnailUrl: metadata.thumbnailUrl,
      currentTime,
      duration,
      isPlaying,
      volume,
      isMuted,
      hasNext: player.hasNext() || queueResult.items.length > 0,
      hasPrevious: player.hasPrevious(),
      queue: queueResult.items,
      queueAvailable: queueResult.available,
      isLive: metadata.isLive,
      isLiked: player.isLiked(),
      currentQuality,
      availableQualities,
      lastUpdated: Date.now()
    };
  }
  function sendStateUpdate() {
    try {
      const state = getCurrentState();
      chrome.runtime.sendMessage({
        type: "STATE_UPDATE",
        payload: { state }
      }).catch(() => {
      });
    } catch {
    }
  }
  new YouTubeSPAObserver(() => {
    sendStateUpdate();
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const { type, payload } = message;
    switch (type) {
      case "GET_STATE": {
        const state = getCurrentState();
        sendResponse({ success: true, data: state });
        sendStateUpdate();
        return true;
      }
      case "TOGGLE_PLAY": {
        const success = player.togglePlay();
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "PLAY": {
        const success = player.play();
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "PAUSE": {
        const success = player.pause();
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "NEXT": {
        const success = player.next();
        setTimeout(sendStateUpdate, 150);
        sendResponse({ success });
        return true;
      }
      case "PREVIOUS": {
        const success = player.previous();
        setTimeout(sendStateUpdate, 150);
        sendResponse({ success });
        return true;
      }
      case "SEEK": {
        const time = payload?.time;
        const success = typeof time === "number" ? player.seek(time) : false;
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "SEEK_RELATIVE": {
        const delta = payload?.delta || 0;
        const success = player.seekRelative(delta);
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "SET_VOLUME": {
        const volume = payload?.volume;
        const success = typeof volume === "number" ? player.setVolume(volume) : false;
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "STEP_VOLUME": {
        const step = payload?.step || 0;
        const success = player.stepVolume(step);
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "TOGGLE_MUTE": {
        const success = player.toggleMute();
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "TOGGLE_PIP": {
        player.togglePiP().then((success) => {
          sendResponse({ success });
        });
        return true;
      }
      case "TOGGLE_LIKE": {
        const success = player.toggleLike();
        setTimeout(sendStateUpdate, 150);
        sendResponse({ success });
        return true;
      }
      case "SET_QUALITY": {
        const targetQuality = payload?.quality;
        const success = typeof targetQuality === "string" ? player.setQuality(targetQuality) : false;
        if (typeof targetQuality === "string") {
          currentQuality = targetQuality;
        }
        setTimeout(sendStateUpdate, 150);
        sendResponse({ success });
        return true;
      }
      case "TOGGLE_LOOP": {
        const success = player.toggleLoop();
        setTimeout(sendStateUpdate, 50);
        sendResponse({ success });
        return true;
      }
      case "PLAY_QUEUE_ITEM": {
        const { url, videoId } = payload || {};
        const success = queueExtractor.playItem(url, videoId);
        setTimeout(sendStateUpdate, 200);
        sendResponse({ success });
        return true;
      }
      default:
        sendResponse({ success: false, error: `Unknown command: ${type}` });
        return true;
    }
  });
  sendStateUpdate();
})();
