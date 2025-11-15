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
  if (namespace === 'local' && changes.servers) {
    updateContextMenus();
  }
});

async function updateContextMenus() {
  // Remove all existing context menus
  await chrome.contextMenus.removeAll();

  // Get servers from storage
  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];

  if (servers.length === 0) {
    // No servers configured, create a single menu item
    chrome.contextMenus.create({
      id: 'sendToComfyUI-noserver',
      title: 'Send to ComfyUI (no server configured)',
      contexts: ['image']
    });
    return;
  }

  // Create parent menu
  chrome.contextMenus.create({
    id: 'sendToComfyUI-parent',
    title: 'Send to ComfyUI',
    contexts: ['image']
  });

  // Create submenu for each server
  servers.forEach((server, serverIndex) => {
    const serverMenuId = `server-${serverIndex}`;

    if (server.workflows && server.workflows.length > 0) {
      // Server has workflows - create server submenu
      chrome.contextMenus.create({
        id: serverMenuId,
        parentId: 'sendToComfyUI-parent',
        title: server.name,
        contexts: ['image']
      });

      // Add workflows under this server
      server.workflows.forEach((workflow, workflowIndex) => {
        chrome.contextMenus.create({
          id: `server-${serverIndex}-workflow-${workflowIndex}`,
          parentId: serverMenuId,
          title: workflow.name,
          contexts: ['image']
        });
      });
    } else {
      // Server has no workflows - create direct upload option
      chrome.contextMenus.create({
        id: `${serverMenuId}-noworkflow`,
        parentId: 'sendToComfyUI-parent',
        title: `${server.name} (upload only)`,
        contexts: ['image']
      });
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const menuItemId = info.menuItemId;

  // Get settings from storage
  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];

  if (servers.length === 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'ComfyUI Not Configured',
      message: 'Please configure at least one ComfyUI server in the extension settings.'
    });
    return;
  }

  let selectedServer = null;
  let selectedWorkflow = null;

  // Handle "no server" case
  if (menuItemId === 'sendToComfyUI-noserver') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'No Server Configured',
      message: 'Please add a ComfyUI server in the extension settings.'
    });
    return;
  }

  // Parse menu item ID: server-X-workflow-Y or server-X-noworkflow
  if (menuItemId.includes('-workflow-')) {
    // Format: server-X-workflow-Y
    const parts = menuItemId.split('-');
    const serverIndex = parseInt(parts[1]);
    const workflowIndex = parseInt(parts[3]);

    selectedServer = servers[serverIndex];
    if (selectedServer && selectedServer.workflows) {
      selectedWorkflow = selectedServer.workflows[workflowIndex];
    }
  } else if (menuItemId.includes('-noworkflow')) {
    // Format: server-X-noworkflow
    const serverIndex = parseInt(menuItemId.split('-')[1]);
    selectedServer = servers[serverIndex];
    selectedWorkflow = { name: 'Upload only', workflowData: null, imageNodeId: null };
  }

  if (!selectedServer) {
    console.error('No server selected');
    return;
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
    await sendImageToComfyUI(blob, selectedServer.url, selectedWorkflow);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Success',
      message: `Image sent to ${selectedServer.name}: ${selectedWorkflow.name}`
    });
  } catch (error) {
    console.error('Error sending image to ComfyUI:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Error',
      message: `Failed to send image to ${selectedServer.name}: ${error.message}`
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
