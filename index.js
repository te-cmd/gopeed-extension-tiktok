// TikTok Downloader Extension for Gopeed
// Author: Locon213

gopeed.events.onResolve(async (ctx) => {
  // Check if the URL is a TikTok link
  if (!ctx.req.url.includes('tiktok.com')) {
    return;
  }

  try {
    // Get the selected API provider from settings
    const apiProvider = ctx.settings.api_provider || 'tikwm';
    
    let resolvedUrl = null;
    let fileName = null;

    switch (apiProvider) {
      case 'tikwm':
        ({ resolvedUrl, fileName } = await resolveWithTikWM(ctx.req.url));
        break;
      case 'cobalt':
        ({ resolvedUrl, fileName } = await resolveWithCobalt(ctx.req.url));
        break;
      case 'lovit':
        ({ resolvedUrl, fileName } = await resolveWithLovit(ctx.req.url));
        break;
      default:
        throw new Error(`Unknown API provider: ${apiProvider}`);
    }

    if (resolvedUrl) {
      // Sanitize filename
      fileName = sanitizeFileName(fileName);
      
      // Set the response with the resolved URL and filename
      ctx.res = {
        name: fileName,
        files: [{
          req: {
            url: resolvedUrl
          }
        }]
      };
    } else {
      throw new Error(`Failed to resolve TikTok video URL using ${apiProvider} provider`);
    }
  } catch (error) {
    gopeed.logger.error(`Error resolving TikTok URL: ${error.message}`);
    throw error;
  }
});

// TikWM API implementation
async function resolveWithTikWM(videoUrl) {
  try {
    const response = await gopeed.fetch({
      url: `https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}&hd=1`,
      method: 'GET',
      headers: {
        'Referer': 'https://www.tikwm.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const data = response.data;
    
    if (data.code !== 0) {
      throw new Error(`TikWM API returned error: ${data.msg || 'Unknown error'}`);
    }

    // Prefer HD version if available
    const videoUrl = data.data.hdplay || data.data.play;
    
    if (!videoUrl) {
      throw new Error('No video URL found in TikWM response');
    }

    // Generate filename from author nickname and title
    const authorNickname = data.data.author?.nickname || 'TikTok';
    const title = data.data.title ? data.data.title.substring(0, 50) : 'video'; // Limit title length
    
    const fileName = `${sanitizeFileName(authorNickname)} - ${sanitizeFileName(title)}.mp4`;
    
    return { resolvedUrl: videoUrl, fileName };
  } catch (error) {
    gopeed.logger.error(`Error with TikWM API: ${error.message}`);
    throw error;
  }
}

// Cobalt API implementation
async function resolveWithCobalt(videoUrl) {
  try {
    const response = await gopeed.fetch({
      url: 'https://api.cobalt.tools/api/json',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      data: JSON.stringify({
        url: videoUrl,
        vCodec: 'h264',
        isNoTTWatermark: true
      })
    });

    const data = response.data;
    
    if (!data.url) {
      throw new Error('No video URL found in Cobalt response');
    }

    // Generate a generic filename since Cobalt might not return metadata
    const timestamp = new Date().getTime();
    const fileName = `TikTok_Cobalt_${timestamp}.mp4`;
    
    return { resolvedUrl: data.url, fileName };
  } catch (error) {
    gopeed.logger.error(`Error with Cobalt API: ${error.message}`);
    throw error;
  }
}

// Lovit API implementation
async function resolveWithLovit(videoUrl) {
  try {
    const response = await gopeed.fetch({
      url: 'https://lovetik.com/api/ajax/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      data: `query=${encodeURIComponent(videoUrl)}`
    });

    const data = response.data;
    
    if (data.status !== 'ok') {
      throw new Error(`Lovit API returned error: ${data.msg || 'Unknown error'}`);
    }

    // Find the no-watermark video link
    let videoUrl = null;
    if (data.links && Array.isArray(data.links)) {
      for (const link of data.links) {
        if (link.type === 'nowatermark') {
          videoUrl = link.a;
          break;
        }
      }
    }

    if (!videoUrl) {
      throw new Error('No watermark-free video URL found in Lovit response');
    }

    // Generate filename from author and description
    const author = data.author ? data.author.replace(/\s+/g, '_') : 'TikTok';
    const desc = data.desc ? data.desc.substring(0, 50).replace(/\s+/g, '_') : 'video'; // Limit description length
    
    const fileName = `${sanitizeFileName(author)} - ${sanitizeFileName(desc)}.mp4`;
    
    return { resolvedUrl: videoUrl, fileName };
  } catch (error) {
    gopeed.logger.error(`Error with Lovit API: ${error.message}`);
    throw error;
  }
}

// Helper function to sanitize filenames by removing special characters
function sanitizeFileName(fileName) {
  if (!fileName) return 'TikTok_Video';

  // Replace special characters that might cause issues in filenames
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid filename characters with underscore
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .trim();                        // Remove leading/trailing whitespace
}