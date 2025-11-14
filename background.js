// Background service worker for ComfyUI Image Sender

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sendToComfyUI',
    title: 'Send to ComfyUI',
    contexts: ['image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sendToComfyUI') {
    const imageUrl = info.srcUrl;

    // Get settings from storage
    const settings = await chrome.storage.sync.get([
      'comfyuiUrl',
      'workflowData',
      'imageNodeId'
    ]);

    if (!settings.comfyuiUrl) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'ComfyUI Not Configured',
        message: 'Please configure your ComfyUI server URL in the extension settings.'
      });
      return;
    }

    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Send to ComfyUI
      await sendImageToComfyUI(blob, settings);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Success',
        message: 'Image sent to ComfyUI successfully!'
      });
    } catch (error) {
      console.error('Error sending image to ComfyUI:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Error',
        message: `Failed to send image: ${error.message}`
      });
    }
  }
});

async function sendImageToComfyUI(imageBlob, settings) {
  const comfyuiUrl = settings.comfyuiUrl.replace(/\/$/, ''); // Remove trailing slash

  // Step 1: Upload the image
  const formData = new FormData();
  formData.append('image', imageBlob, 'image.png');
  formData.append('overwrite', 'true');

  const uploadResponse = await fetch(`${comfyuiUrl}/upload/image`, {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  const uploadResult = await uploadResponse.json();
  const uploadedFileName = uploadResult.name;

  // Step 2: Queue the workflow with the uploaded image
  if (settings.workflowData) {
    const workflow = JSON.parse(settings.workflowData);

    // Find and update the LoadImage node
    const imageNodeId = settings.imageNodeId || findLoadImageNode(workflow);

    if (imageNodeId && workflow[imageNodeId]) {
      workflow[imageNodeId].inputs.image = uploadedFileName;

      // Randomize all seed values in the workflow
      randomizeSeeds(workflow);

      // Generate a random client_id
      const clientId = generateClientId();

      const promptPayload = {
        prompt: workflow,
        client_id: clientId
      };

      const queueResponse = await fetch(`${comfyuiUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promptPayload)
      });

      if (!queueResponse.ok) {
        throw new Error(`Queue failed: ${queueResponse.statusText}`);
      }

      const queueResult = await queueResponse.json();
      console.log('Workflow queued:', queueResult);
    } else {
      console.warn('No LoadImage node found in workflow, image uploaded but workflow not queued');
    }
  }
}

function findLoadImageNode(workflow) {
  // Find the first LoadImage node in the workflow
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.class_type === 'LoadImage') {
      return nodeId;
    }
  }
  return null;
}

function generateClientId() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

function generateRandomSeed() {
  // Generate a random seed between 0 and 2^32 - 1 (max safe integer for most systems)
  return Math.floor(Math.random() * 4294967295);
}

function randomizeSeeds(workflow) {
  // Iterate through all nodes in the workflow
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (node.inputs && 'seed' in node.inputs) {
      // Generate a new random seed
      node.inputs.seed = generateRandomSeed();
      console.log(`Randomized seed for node ${nodeId} (${node.class_type}): ${node.inputs.seed}`);
    }
  }
}
