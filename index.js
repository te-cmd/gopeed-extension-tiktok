gopeed.events.onResolve(async (ctx) => {
  const url = ctx.req.url;

  if (!url.includes("tiktok.com")) return;

  try {
    const settings = gopeed.settings || {};
    const provider = settings.api_provider || "tikwm";

    gopeed.logger.info(`[TikTok] Provider: ${provider} | URL: ${url}`);

    let resolvedUrl = null;

    // Select provider
    if (provider === "tikmate") {
        resolvedUrl = await resolveWithTikMate(url);
    } else {
        // TikWM by default
        resolvedUrl = await resolveWithTikWM(url);
    }

    if (resolvedUrl) {
      // Generate filename from video ID
      const videoId = getVideoIdFromUrl(url);
      const finalFileName = `${videoId}.mp4`;

      gopeed.logger.info(`[TikTok] Final File: ${finalFileName}`);

      ctx.res = {
        name: finalFileName,
        files: [
          {
            name: finalFileName, // Filename for saving
            req: {
              url: resolvedUrl,
              extra: {
                header: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  "Referer": "https://www.tiktok.com/"
                }
              }
            }
          }
        ]
      };
    } else {
      gopeed.logger.warn(`[TikTok] Failed to resolve via ${provider}`);
    }

  } catch (error) {
    gopeed.logger.error(`[TikTok] Critical Error: ${error.message}`);
  }
});

// --- API 1: TikWM (Best) ---
async function resolveWithTikWM(videoUrl) {
  try {
    const resp = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&hd=1`, { method: 'GET' });
    const data = JSON.parse(await resp.text());
    if (data.code === 0 && data.data) {
      return data.data.hdplay || data.data.play;
    }
  } catch (e) {
    gopeed.logger.error(`TikWM error: ${e.message}`);
  }
  return null;
}

// --- API 2: TikMate (Backup) ---
async function resolveWithTikMate(videoUrl) {
  try {
    // TikMate API works via POST request
    const resp = await fetch("https://api.tikmate.app/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: `url=${encodeURIComponent(videoUrl)}`
    });
    const data = JSON.parse(await resp.text());
    // TikMate returns token and id, need to assemble the link
    if (data.success && data.token && data.id) {
        return `https://tikmate.app/download/${data.token}/${data.id}.mp4`;
    }
  } catch (e) {
      gopeed.logger.error(`TikMate error: ${e.message}`);
  }
  return null;
}

// --- Helper: Get ID ---
function getVideoIdFromUrl(url) {
    try {
        const cleanUrl = url.split("?")[0];
        const noSlash = cleanUrl.endsWith("/") ? cleanUrl.slice(0, -1) : cleanUrl;
        const parts = noSlash.split("/");
        const id = parts[parts.length - 1];
        if (!id || id.length > 20 || id.length < 3) return `tiktok_${Date.now()}`;
        return id;
    } catch (e) {
        return `tiktok_${Date.now()}`;
    }
}