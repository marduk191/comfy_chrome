// Options page script for ComfyUI Image Sender

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.sync.get([
    'comfyuiUrl',
    'workflowData',
    'imageNodeId'
  ]);

  if (settings.comfyuiUrl) {
    document.getElementById('comfyuiUrl').value = settings.comfyuiUrl;
  }

  if (settings.workflowData) {
    // Pretty print the JSON
    try {
      const formatted = JSON.stringify(JSON.parse(settings.workflowData), null, 2);
      document.getElementById('workflowData').value = formatted;
    } catch (e) {
      document.getElementById('workflowData').value = settings.workflowData;
    }
  }

  if (settings.imageNodeId) {
    document.getElementById('imageNodeId').value = settings.imageNodeId;
  }

  // Save button handler
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const comfyuiUrl = document.getElementById('comfyuiUrl').value.trim();
    const workflowData = document.getElementById('workflowData').value.trim();
    const imageNodeId = document.getElementById('imageNodeId').value.trim();

    // Validate URL
    if (!comfyuiUrl) {
      showStatus('Please enter a ComfyUI server URL', 'error');
      return;
    }

    try {
      new URL(comfyuiUrl);
    } catch (e) {
      showStatus('Please enter a valid URL', 'error');
      return;
    }

    // Validate workflow JSON if provided
    if (workflowData) {
      try {
        JSON.parse(workflowData);
      } catch (e) {
        showStatus('Invalid workflow JSON: ' + e.message, 'error');
        return;
      }
    }

    // Save to storage
    await chrome.storage.sync.set({
      comfyuiUrl,
      workflowData,
      imageNodeId
    });

    showStatus('Settings saved successfully!', 'success');
  });

  // Test connection button handler
  document.getElementById('testBtn').addEventListener('click', async () => {
    const comfyuiUrl = document.getElementById('comfyuiUrl').value.trim();

    if (!comfyuiUrl) {
      showStatus('Please enter a ComfyUI server URL first', 'error');
      return;
    }

    try {
      new URL(comfyuiUrl);
    } catch (e) {
      showStatus('Please enter a valid URL', 'error');
      return;
    }

    showStatus('Testing connection...', 'success');

    try {
      const url = comfyuiUrl.replace(/\/$/, '');
      const response = await fetch(`${url}/system_stats`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        showStatus(
          `Connection successful! ComfyUI is running. System: ${JSON.stringify(data.system || 'OK')}`,
          'success'
        );
      } else {
        showStatus(
          `Connection failed: ${response.status} ${response.statusText}`,
          'error'
        );
      }
    } catch (error) {
      showStatus(
        `Connection failed: ${error.message}. Make sure ComfyUI is running and accessible.`,
        'error'
      );
    }
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}
