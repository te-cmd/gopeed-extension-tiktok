# TikTok Downloader Extension for Gopeed

A Gopeed extension that enables downloading TikTok videos without watermarks using multiple API providers.

## Features

- Download TikTok videos without watermarks
- Multiple API providers for reliability
- Automatic filename generation with author and title
- Support for HD quality when available

## Supported API Providers

1. **TikWM** - Recommended provider with good quality and metadata
2. **Cobalt** - Fast and open-source option
3. **Lovit** - Backup provider for redundancy

## Installation

1. Copy the repository URL: https://github.com/Locon213/gopeed-extension-tiktok
2. Open Gopeed and navigate to the Extensions section
3. Paste the repository URL in the appropriate field to install the extension
4. Once installed, configure your preferred API provider in the settings
5. Paste TikTok URLs directly into Gopeed to download

## Configuration

The extension provides a setting to enter the API provider:

- Enter one of these values: `tikwm`, `cobalt`, or `lovit`
- **TikWM**: Recommended - Best quality and metadata
- **Cobalt**: Fast and open-source option
- **Lovit**: Backup provider for redundancy

## Technical Details

- Detects TikTok URLs automatically
- Resolves direct video links without watermarks
- Generates appropriate filenames based on video metadata
- Handles errors gracefully with logging

## Author

Locon213