// Options page script for ComfyUI Image Sender

let editingIndex = -1; // Track which workflow is being edited (-1 = new workflow)

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.sync.get(['comfyuiUrl', 'workflows']);

  console.log('Loaded settings:', settings);
  console.log('Workflows count:', settings.workflows ? settings.workflows.length : 0);

  // Check storage quota
  if (chrome.storage.sync.getBytesInUse) {
    const bytesInUse = await chrome.storage.sync.getBytesInUse(['workflows']);
    console.log('Storage bytes in use for workflows:', bytesInUse, '/ 102400 (100KB quota)');
  }

  if (settings.comfyuiUrl) {
    document.getElementById('comfyuiUrl').value = settings.comfyuiUrl;
  }

  // Load and display workflows
  renderWorkflows(settings.workflows || []);

  // Save URL button handler
  document.getElementById('saveUrlBtn').addEventListener('click', async () => {
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
    await chrome.storage.sync.set({ comfyuiUrl });
    showStatus('Server URL saved successfully!', 'success');
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

  // Add workflow button handler
  document.getElementById('addWorkflowBtn').addEventListener('click', async () => {
    console.log('Add New Workflow clicked');
    editingIndex = -1;

    // Clear all form fields
    document.getElementById('formTitle').textContent = 'Add New Workflow';
    document.getElementById('workflowName').value = '';
    document.getElementById('workflowData').value = '';
    document.getElementById('imageNodeId').value = '';

    // Show form
    document.getElementById('workflowForm').classList.remove('hidden');
    document.getElementById('workflowName').focus();

    // Log current storage state
    const currentSettings = await chrome.storage.sync.get(['workflows']);
    console.log('Current workflows in storage when adding new:', currentSettings.workflows);
  });

  // Cancel workflow button handler
  document.getElementById('cancelWorkflowBtn').addEventListener('click', () => {
    document.getElementById('workflowForm').classList.add('hidden');
    editingIndex = -1;
  });

  // Save workflow button handler
  document.getElementById('saveWorkflowBtn').addEventListener('click', async () => {
    const name = document.getElementById('workflowName').value.trim();
    const workflowData = document.getElementById('workflowData').value.trim();
    const imageNodeId = document.getElementById('imageNodeId').value.trim();

    if (!name) {
      showStatus('Please enter a workflow name', 'error');
      return;
    }

    if (!workflowData) {
      showStatus('Please enter workflow JSON data', 'error');
      return;
    }

    // Validate workflow JSON
    try {
      JSON.parse(workflowData);
    } catch (e) {
      showStatus('Invalid workflow JSON: ' + e.message, 'error');
      return;
    }

    // Get current workflows
    const settings = await chrome.storage.sync.get(['workflows']);
    const workflows = settings.workflows || [];
    console.log('Current workflows from storage before save:', workflows.length, workflows);

    const workflow = {
      name: name,
      workflowData: workflowData,
      imageNodeId: imageNodeId || null
    };

    if (editingIndex === -1) {
      // Adding new workflow
      console.log('Adding new workflow:', workflow.name);
      workflows.push(workflow);
      console.log('Workflows array after push:', workflows.length, 'workflows');
    } else {
      // Editing existing workflow
      console.log('Editing workflow at index:', editingIndex);
      workflows[editingIndex] = workflow;
    }

    // Check approximate size
    const workflowsStr = JSON.stringify(workflows);
    const approxBytes = new Blob([workflowsStr]).size;
    console.log('Approximate workflow data size:', approxBytes, 'bytes');

    if (approxBytes > 102400) {
      showStatus('Warning: Workflow data is very large (>100KB). Consider using chrome.storage.local instead.', 'error');
      return;
    }

    // Save to storage
    try {
      await chrome.storage.sync.set({ workflows });
      console.log('Workflows saved to storage:', workflows.length, 'workflows');

      // Verify save by reading back
      const verify = await chrome.storage.sync.get(['workflows']);
      console.log('Verified workflows from storage:', verify.workflows);

      // Hide form and reset
      document.getElementById('workflowForm').classList.add('hidden');
      editingIndex = -1;

      // Clear form fields
      document.getElementById('workflowName').value = '';
      document.getElementById('workflowData').value = '';
      document.getElementById('imageNodeId').value = '';

      // Re-render workflows with fresh data from storage
      renderWorkflows(verify.workflows || []);

      showStatus('Workflow saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving workflow:', error);
      showStatus('Failed to save workflow: ' + error.message, 'error');
    }
  });
});

function renderWorkflows(workflows) {
  const workflowList = document.getElementById('workflowList');
  workflowList.innerHTML = '';

  if (workflows.length === 0) {
    workflowList.innerHTML = '<p style="color: #666; font-style: italic;">No workflows configured. Click "Add New Workflow" to get started.</p>';
    return;
  }

  workflows.forEach((workflow, index) => {
    const workflowItem = document.createElement('div');
    workflowItem.className = 'workflow-item';

    const workflowInfo = document.createElement('div');
    workflowInfo.className = 'workflow-item-info';

    const workflowName = document.createElement('div');
    workflowName.className = 'workflow-item-name';
    workflowName.textContent = workflow.name;

    const workflowDetails = document.createElement('div');
    workflowDetails.className = 'workflow-item-details';
    const nodeInfo = workflow.imageNodeId ? `Node ID: ${workflow.imageNodeId}` : 'Auto-detect LoadImage node';
    workflowDetails.textContent = nodeInfo;

    workflowInfo.appendChild(workflowName);
    workflowInfo.appendChild(workflowDetails);

    const workflowActions = document.createElement('div');
    workflowActions.className = 'workflow-item-actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'secondary small';
    editBtn.addEventListener('click', () => editWorkflow(index));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'danger small';
    deleteBtn.addEventListener('click', () => deleteWorkflow(index));

    workflowActions.appendChild(editBtn);
    workflowActions.appendChild(deleteBtn);

    workflowItem.appendChild(workflowInfo);
    workflowItem.appendChild(workflowActions);

    workflowList.appendChild(workflowItem);
  });
}

async function editWorkflow(index) {
  editingIndex = index;

  // Fetch fresh data from storage
  const settings = await chrome.storage.sync.get(['workflows']);
  const workflows = settings.workflows || [];
  const workflow = workflows[index];

  if (!workflow) {
    showStatus('Workflow not found', 'error');
    return;
  }

  document.getElementById('formTitle').textContent = 'Edit Workflow';
  document.getElementById('workflowName').value = workflow.name;
  document.getElementById('imageNodeId').value = workflow.imageNodeId || '';

  // Pretty print the JSON
  try {
    const formatted = JSON.stringify(JSON.parse(workflow.workflowData), null, 2);
    document.getElementById('workflowData').value = formatted;
  } catch (e) {
    document.getElementById('workflowData').value = workflow.workflowData;
  }

  document.getElementById('workflowForm').classList.remove('hidden');
  document.getElementById('workflowName').focus();
}

async function deleteWorkflow(index) {
  if (!confirm('Are you sure you want to delete this workflow?')) {
    return;
  }

  const settings = await chrome.storage.sync.get(['workflows']);
  const workflows = settings.workflows || [];

  workflows.splice(index, 1);

  try {
    await chrome.storage.sync.set({ workflows });
    console.log('Workflow deleted, remaining:', workflows.length);

    // Verify deletion by reading back
    const verify = await chrome.storage.sync.get(['workflows']);
    console.log('Verified workflows after deletion:', verify.workflows);

    // Re-render with fresh data
    renderWorkflows(verify.workflows || []);
    showStatus('Workflow deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting workflow:', error);
    showStatus('Failed to delete workflow: ' + error.message, 'error');
  }
}

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
