// Background service worker for ComfyUI Image Sender

// Initialize context menus on installation or startup
chrome.runtime.onInstalled.addListener(() => {
  updateContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  updateContextMenus();
});

// Listen for storage changes to update context menus
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.workflows) {
    updateContextMenus();
  }
});

async function updateContextMenus() {
  // Remove all existing context menus
  await chrome.contextMenus.removeAll();

  // Get workflows from storage
  const settings = await chrome.storage.sync.get(['workflows']);
  const workflows = settings.workflows || [];

  if (workflows.length === 0) {
    // No workflows configured, create a single menu item
    chrome.contextMenus.create({
      id: 'sendToComfyUI-noworkflow',
      title: 'Send to ComfyUI (no workflow)',
      contexts: ['image']
    });
  } else if (workflows.length === 1) {
    // Single workflow, create a direct menu item
    chrome.contextMenus.create({
      id: 'workflow-0',
      title: `Send to ComfyUI: ${workflows[0].name}`,
      contexts: ['image']
    });
  } else {
    // Multiple workflows, create parent menu with submenus
    chrome.contextMenus.create({
      id: 'sendToComfyUI-parent',
      title: 'Send to ComfyUI',
      contexts: ['image']
    });

    workflows.forEach((workflow, index) => {
      chrome.contextMenus.create({
        id: `workflow-${index}`,
        parentId: 'sendToComfyUI-parent',
        title: workflow.name,
        contexts: ['image']
      });
    });
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuItemId = info.menuItemId;

  // Get settings from storage
  const settings = await chrome.storage.sync.get(['comfyuiUrl', 'workflows']);

  if (!settings.comfyuiUrl) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ComfyUI Not Configured',
      message: 'Please configure your ComfyUI server URL in the extension settings.'
    });
    return;
  }

  const workflows = settings.workflows || [];
  let selectedWorkflow = null;

  // Handle "no workflow" case
  if (menuItemId === 'sendToComfyUI-noworkflow') {
    selectedWorkflow = { name: 'Upload only', workflowData: null, imageNodeId: null };
  } else if (menuItemId.startsWith('workflow-')) {
    // Extract workflow index from menu item ID
    const workflowIndex = parseInt(menuItemId.split('-')[1]);
    selectedWorkflow = workflows[workflowIndex];
  }

  if (!selectedWorkflow) {
    console.error('No workflow selected');
    return;
  }

  const imageUrl = info.srcUrl;

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Send to ComfyUI
    await sendImageToComfyUI(blob, settings.comfyuiUrl, selectedWorkflow);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Success',
      message: `Image sent to ComfyUI: ${selectedWorkflow.name}`
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
});

async function sendImageToComfyUI(imageBlob, comfyuiUrl, workflow) {
  const serverUrl = comfyuiUrl.replace(/\/$/, ''); // Remove trailing slash

  // Step 1: Upload the image
  const formData = new FormData();
  formData.append('image', imageBlob, 'image.png');
  formData.append('overwrite', 'true');

  const uploadResponse = await fetch(`${serverUrl}/upload/image`, {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  const uploadResult = await uploadResponse.json();
  const uploadedFileName = uploadResult.name;

  // Step 2: Queue the workflow with the uploaded image
  if (workflow.workflowData) {
    const workflowJson = JSON.parse(workflow.workflowData);

    // Find and update the LoadImage node
    const imageNodeId = workflow.imageNodeId || findLoadImageNode(workflowJson);

    if (imageNodeId && workflowJson[imageNodeId]) {
      workflowJson[imageNodeId].inputs.image = uploadedFileName;

      // Randomize all seed values in the workflow
      randomizeSeeds(workflowJson);

      // Generate a random client_id
      const clientId = generateClientId();

      const promptPayload = {
        prompt: workflowJson,
        client_id: clientId
      };

      const queueResponse = await fetch(`${serverUrl}/prompt`, {
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
