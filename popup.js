// Popup script for ComfyUI Image Sender

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.local.get(['comfyuiUrl', 'workflows']);

  if (settings.comfyuiUrl) {
    document.getElementById('comfyuiUrl').value = settings.comfyuiUrl;
  }

  // Display workflow count
  displayWorkflowCount(settings.workflows || []);

  // Save button handler
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const comfyuiUrl = document.getElementById('comfyuiUrl').value.trim();

    if (!comfyuiUrl) {
      showStatus('Please enter a ComfyUI server URL', 'error');
      return;
    }

    // Validate URL format
    try {
      new URL(comfyuiUrl);
    } catch (e) {
      showStatus('Please enter a valid URL', 'error');
      return;
    }

    // Save to storage
    await chrome.storage.local.set({ comfyuiUrl });
    showStatus('Settings saved successfully!', 'success');
  });

  // Options link handler
  document.getElementById('optionsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

function displayWorkflowCount(workflows) {
  const countValue = document.getElementById('workflowCountValue');
  const workflowList = document.getElementById('workflowList');

  if (workflows.length === 0) {
    countValue.textContent = 'No workflows configured';
    workflowList.innerHTML = '<div style="margin-top: 8px; font-style: italic;">Click "Manage Workflows" to add workflows</div>';
  } else {
    countValue.textContent = `${workflows.length} workflow${workflows.length !== 1 ? 's' : ''} configured`;

    // Display workflow names
    workflowList.innerHTML = '';
    workflows.forEach(workflow => {
      const item = document.createElement('div');
      item.className = 'workflow-list-item';
      item.textContent = workflow.name;
      workflowList.appendChild(item);
    });
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}
