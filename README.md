# PicGo Integration Plugin for Obsidian

This plugin allows you to upload images in your Obsidian documents to image hosting services via PicGo HTTP API, and automatically replace the image URLs with the returned URLs.

## Features

- Automatically detect all images in the current document
- Upload images to image hosting services via PicGo HTTP API
- Replace original image URLs with the URLs returned by PicGo
- Support for domain blacklist to exclude specific domains from uploading
- Support for both local images and internet images

## Installation

1. Make sure you have PicGo installed and running with HTTP API enabled
2. Download this plugin folder to your Obsidian vault's `.obsidian/plugins` directory
3. Enable the plugin in Obsidian settings

## Configuration

1. **PicGo Server**: Set your PicGo HTTP API endpoint (default: `http://127.0.0.1:36677/upload`)
2. **Domain Blacklist**: Add domains that you don't want to upload images from (one domain per line)

## Usage

1. Configure your PicGo server URL in the plugin settings
2. (Optional) Add domains to the blacklist if needed
3. Open a document with images
4. Run the command "PicGo Integration: Upload all images in current document"
5. The plugin will automatically upload local images and internet images to your image hosting service and replace the URLs

## Requirements

- Obsidian v0.9.7 or higher
- PicGo with HTTP API enabled

## API Format

The plugin sends requests to PicGo in the following JSON format:

```json
{
  "list": ["image_url_here"]
}
```

## Support

- Local file paths (relative or absolute)
- Internet image URLs (http:// or https://)
- Markdown format images: `![alt](url)`
- HTML format images: `<img src="url" />`

## Notes

- Images from localhost will not be uploaded
- Images from file:// protocol will not be uploaded
- Images from blacklisted domains will not be uploaded