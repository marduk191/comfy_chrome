# ComfyUI Image Sender - Chrome Extension

A Chrome extension that allows you to right-click on any image in your browser and send it directly to a ComfyUI workflow.

## Features

- **Right-click context menu**: Send images to ComfyUI with a simple right-click
- **Automatic workflow integration**: Automatically finds and updates LoadImage nodes in your workflow
- **Random seed generation**: Automatically randomizes all seed values for unique results every time
- **Custom workflow support**: Configure any ComfyUI workflow in API format
- **Easy configuration**: Simple popup interface for basic settings
- **Advanced options**: Detailed settings page for workflow customization
- **Connection testing**: Built-in tool to verify ComfyUI connectivity
- **Notifications**: Visual feedback on successful uploads or errors

## Installation

### Option 1: Load as Unpacked Extension (Development Mode)

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked"
5. Select the `comfy_chrome` folder
6. The extension should now appear in your extensions list

### Option 2: Create Icons (Optional)

The extension includes placeholder icons. For better visuals, you can create custom icons:
- See [CREATE_ICONS.md](CREATE_ICONS.md) for instructions on generating proper icons from the provided SVG

## Configuration

### Basic Setup

1. Click the extension icon in your Chrome toolbar
2. Enter your ComfyUI server URL (e.g., `http://127.0.0.1:8188`)
3. Click "Save Settings"

### Advanced Workflow Configuration

1. Click the extension icon and then "Advanced Settings" (or right-click the extension icon and select "Options")
2. Enter your ComfyUI server URL
3. In ComfyUI:
   - Load or create the workflow you want to use
   - Click **"Save (API Format)"** to export your workflow as JSON
   - Copy the entire JSON content
4. Paste the workflow JSON into the "Workflow JSON (API Format)" field
5. (Optional) If you have multiple LoadImage nodes, specify which one to use in the "Image Node ID" field
6. Click "Save Settings"
7. Use the "Test Connection" button to verify connectivity to your ComfyUI server

## Usage

### Sending an Image to ComfyUI

1. Navigate to any webpage with images
2. Right-click on an image
3. Select "Send to ComfyUI" from the context menu
4. The extension will:
   - Download the image
   - Upload it to your ComfyUI server
   - Queue your configured workflow with the image
   - Show a notification when complete

### Workflow Behavior

- If no workflow is configured, the extension will only upload the image to ComfyUI
- If a workflow is configured, the extension will:
  - Upload the image
  - Find the LoadImage node in your workflow (automatically or using your specified node ID)
  - Update the node with the uploaded image filename
  - Randomize all seed values in the workflow (generates new random seeds for every execution)
  - Queue the workflow for execution

## How to Get Workflow JSON

1. Open ComfyUI in your browser
2. Load or create your desired workflow
3. Click the "Save (API Format)" button in ComfyUI
4. This will download a JSON file
5. Open the JSON file and copy its contents
6. Paste into the extension's "Workflow JSON (API Format)" field

## Troubleshooting

### Extension shows "ComfyUI Not Configured"
- Make sure you've entered the ComfyUI server URL in the extension settings
- Verify the URL is correct and includes the protocol (http:// or https://)

### "Connection failed" error
- Ensure ComfyUI is running and accessible at the configured URL
- Check if you can access ComfyUI directly in your browser
- Verify there are no firewall or CORS issues
- Use the "Test Connection" button in Advanced Settings to diagnose

### Image uploads but workflow doesn't run
- Make sure you've configured a workflow in the Advanced Settings
- Verify the workflow JSON is valid (it should be in API format from ComfyUI)
- Check the browser console for any errors
- Ensure your workflow has at least one LoadImage node

### Workflow runs with wrong image
- Specify the exact LoadImage node ID in Advanced Settings
- Make sure the node ID matches a LoadImage node in your workflow JSON

## File Structure

```
comfy_chrome/
├── manifest.json           # Extension configuration
├── background.js           # Service worker handling context menu and API calls
├── popup.html             # Quick settings popup UI
├── popup.js               # Popup logic
├── options.html           # Advanced settings page UI
├── options.js             # Options page logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
├── CREATE_ICONS.md        # Icon creation instructions
└── README.md             # This file
```

## Development

### Requirements
- Google Chrome or Chromium-based browser
- ComfyUI running on an accessible server

### Testing
1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## API Compatibility

This extension uses the following ComfyUI API endpoints:
- `POST /upload/image` - Upload images
- `POST /prompt` - Queue workflows
- `GET /system_stats` - Test connectivity (optional)

## Privacy & Security

- This extension only communicates with the ComfyUI server URL you configure
- Images are sent directly from your browser to your ComfyUI server
- No data is sent to third-party servers
- All settings are stored locally in your browser using Chrome's storage API

## License

MIT License - Feel free to modify and distribute

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Changelog

### Version 1.0.0
- Initial release
- Right-click context menu for images
- Configurable ComfyUI server URL
- Workflow JSON support
- Automatic LoadImage node detection
- Automatic random seed generation for all nodes
- Connection testing
- Browser notifications
