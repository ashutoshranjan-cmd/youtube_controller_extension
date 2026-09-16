// YouTube Main World Controller
// This script runs in the page execution context (MAIN world) to communicate directly
// with YouTube's HTML5 Player API (document.getElementById('movie_player')).

function getMoviePlayer(): any {
  return document.getElementById('movie_player') || (document.querySelector('.html5-video-player') as any);
}

function mapQualityLabel(quality: string): { label: string; isHD: boolean } {
  switch (quality) {
    case 'highres':
      return { label: '4320p (8K)', isHD: true };
    case 'hd2880':
      return { label: '2880p (5K)', isHD: true };
    case 'hd2160':
      return { label: '2160p (4K)', isHD: true };
    case 'hd1440':
      return { label: '1440p (2K)', isHD: true };
    case 'hd1080':
      return { label: '1080p HD', isHD: true };
    case 'hd720':
      return { label: '720p HD', isHD: true };
    case 'large':
      return { label: '480p', isHD: false };
    case 'medium':
      return { label: '360p', isHD: false };
    case 'small':
      return { label: '240p', isHD: false };
    case 'tiny':
      return { label: '144p', isHD: false };
    case 'auto':
    default:
      return { label: 'Auto', isHD: false };
  }
}

function broadcastQuality(): void {
  try {
    const player = getMoviePlayer();
    if (!player) return;

    const currentRaw = typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : 'auto';
    const availableRaw: string[] = typeof player.getAvailableQualityLevels === 'function' ? player.getAvailableQualityLevels() : [];

    const availableQualities = availableRaw.map((q) => {
      const { label, isHD } = mapQualityLabel(q);
      return { quality: q, label, isHD };
    });

    window.postMessage(
      {
        source: 'YT_MAIN_WORLD_QUALITY',
        type: 'QUALITY_UPDATE',
        currentQuality: currentRaw,
        availableQualities
      },
      '*'
    );
  } catch {}
}

function setQuality(targetQuality: string): void {
  try {
    const player = getMoviePlayer();
    if (player) {
      if (typeof player.setPlaybackQualityRange === 'function') {
        player.setPlaybackQualityRange(targetQuality, targetQuality);
      }
      if (typeof player.setPlaybackQuality === 'function') {
        player.setPlaybackQuality(targetQuality);
      }
      setTimeout(broadcastQuality, 150);
      setTimeout(broadcastQuality, 600);
    }
  } catch {}
}

// Listen for messages from the content script (ISOLATED world)
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'YT_ISOLATED_WORLD_QUALITY') {
    return;
  }

  if (event.data.type === 'SET_QUALITY' && typeof event.data.quality === 'string') {
    setQuality(event.data.quality);
  } else if (event.data.type === 'GET_QUALITY') {
    broadcastQuality();
  }
});

// Periodic check to capture video quality switches or ad finishes
setInterval(broadcastQuality, 2000);
// Initial query
setTimeout(broadcastQuality, 1000);

