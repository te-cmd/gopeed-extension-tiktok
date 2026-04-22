gopeed.events.onResolve(async (ctx) => {
  const url = ctx.req.url;

  if (!url.includes("tiktok.com")) return;

  try {
    const settings = gopeed.settings || {};
    const provider = settings.api_provider || "tikwm";

    gopeed.logger.info(`[TikTok] Provider: ${provider} | URL: ${url}`);

    let resolvedUrl = null;

    // --- Provider selection with fallback ---
    if (provider === "tikmate") {
      resolvedUrl = await resolveWithTikMate(url);
      if (!resolvedUrl) {
        gopeed.logger.warn("[TikTok] TikMate failed → falling back to TikWM");
        resolvedUrl = await resolveWithTikWM(url);
      }
    } else {
      resolvedUrl = await resolveWithTikWM(url);
      if (!resolvedUrl) {
        gopeed.logger.warn("[TikTok] TikWM failed → falling back to TikMate");
        resolvedUrl = await resolveWithTikMate(url);
      }
    }

    if (!resolvedUrl) {
      gopeed.logger.error("[TikTok] All providers failed");
      return;
    }

    // --- Filename ---
    const videoId = getVideoIdFromUrl(url);
    const finalFileName = `${videoId}.mp4`;

    gopeed.logger.info(`[TikTok] Final File: ${finalFileName}`);

    // --- FORCE FLAT DOWNLOAD + KEEP EXTENSION ---
    ctx.res = {
      name: finalFileName,

      type: "single",

      files: [
        {
          name: finalFileName,
          req: {
            url: resolvedUrl,
            extra: {
              header: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.tiktok.com/",
                "Accept": "video/mp4,*/*;q=0.9"
              }
            }
          }
        }
      ]
    };

  } catch (error) {
    gopeed.logger.error(`[TikTok] Critical Error: ${error.message}`);
  }
});


// --- TikWM (Primary) ---
async function resolveWithTikWM(videoUrl) {
  try {
    const resp = await fetch(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&hd=1`,
      { method: "GET" }
    );

    const data = JSON.parse(await resp.text());

    if (data.code === 0 && data.data) {
      return data.data.hdplay || data.data.play;
    }
  } catch (e) {
    gopeed.logger.error(`[TikWM] error: ${e.message}`);
  }
  return null;
}


// --- TikMate (Fallback) ---
async function resolveWithTikMate(videoUrl) {
  try {
    const resp = await fetch("https://api.tikmate.app/api/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: `url=${encodeURIComponent(videoUrl)}`
    });

    const data = JSON.parse(await resp.text());

    if (data.success && data.token && data.id) {
      return `https://tikmate.app/download/${data.token}/${data.id}.mp4`;
    }
  } catch (e) {
    gopeed.logger.error(`[TikMate] error: ${e.message}`);
  }

  return null;
}


// --- Helper: Extract Video ID ---
function getVideoIdFromUrl(url) {
  try {
    const cleanUrl = url.split("?")[0];
    const noSlash = cleanUrl.endsWith("/") ? cleanUrl.slice(0, -1) : cleanUrl;
    const parts = noSlash.split("/");
    const id = parts[parts.length - 1];

    if (!id || id.length > 20 || id.length < 3) {
      return `tiktok_${Date.now()}`;
    }

    return id;
  } catch {
    return `tiktok_${Date.now()}`;
  }
}
