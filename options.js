// Options page script for ComfyUI Image Sender - Multi-Server

let currentServerIndex = -1; // -1 = new server
let currentWorkflowIndex = -1; // -1 = new workflow

document.addEventListener('DOMContentLoaded', async () => {
  // Load servers from storage
  await loadAndRenderServers();

  // Add Server button
  document.getElementById('addServerBtn').addEventListener('click', () => {
    currentServerIndex = -1;
    showServerModal('Add Server');
  });

  // Server Modal buttons
  document.getElementById('saveServerBtn').addEventListener('click', saveServer);
  document.getElementById('testServerBtn').addEventListener('click', testServer);
  document.getElementById('cancelServerBtn').addEventListener('click', hideServerModal);

  // Workflow Modal buttons
  document.getElementById('saveWorkflowBtn').addEventListener('click', saveWorkflow);
  document.getElementById('cancelWorkflowBtn').addEventListener('click', hideWorkflowModal);
});

async function loadAndRenderServers() {
  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];
  console.log('Loaded servers:', servers);
  renderServers(servers);
}

function renderServers(servers) {
  const serverList = document.getElementById('serverList');
  serverList.innerHTML = '';

  if (servers.length === 0) {
    serverList.innerHTML = '<p style="color: #999; font-style: italic; text-align: center; padding: 40px;">No servers configured. Click "Add New Server" to get started.</p>';
    return;
  }

  servers.forEach((server, serverIndex) => {
    const serverCard = document.createElement('div');
    serverCard.className = 'server-card';

    // Server header
    const serverHeader = document.createElement('div');
    serverHeader.className = 'server-header';

    const serverInfo = document.createElement('div');
    serverInfo.className = 'server-info';

    const serverName = document.createElement('div');
    serverName.className = 'server-name';
    serverName.textContent = server.name;

    const serverUrl = document.createElement('div');
    serverUrl.className = 'server-url';
    serverUrl.textContent = server.url;

    serverInfo.appendChild(serverName);
    serverInfo.appendChild(serverUrl);

    const serverActions = document.createElement('div');
    serverActions.className = 'server-actions';

    const editServerBtn = document.createElement('button');
    editServerBtn.textContent = 'Edit';
    editServerBtn.className = 'secondary small';
    editServerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editServer(serverIndex);
    });

    const deleteServerBtn = document.createElement('button');
    deleteServerBtn.textContent = 'Delete';
    deleteServerBtn.className = 'danger small';
    deleteServerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteServer(serverIndex);
    });

    serverActions.appendChild(editServerBtn);
    serverActions.appendChild(deleteServerBtn);

    serverHeader.appendChild(serverInfo);
    serverHeader.appendChild(serverActions);

    // Server content (workflows)
    const serverContent = document.createElement('div');
    serverContent.className = 'server-content expanded'; // Always expanded for now
    serverContent.id = `server-content-${serverIndex}`;

    const workflowsHeader = document.createElement('h3');
    workflowsHeader.textContent = 'Workflows';

    const addWorkflowBtn = document.createElement('button');
    addWorkflowBtn.textContent = '+ Add Workflow';
    addWorkflowBtn.className = 'small';
    addWorkflowBtn.style.marginLeft = '10px';
    addWorkflowBtn.addEventListener('click', () => {
      currentServerIndex = serverIndex;
      currentWorkflowIndex = -1;
      showWorkflowModal('Add Workflow');
    });

    workflowsHeader.appendChild(addWorkflowBtn);
    serverContent.appendChild(workflowsHeader);

    // Render workflows
    if (server.workflows && server.workflows.length > 0) {
      server.workflows.forEach((workflow, workflowIndex) => {
        const workflowItem = document.createElement('div');
        workflowItem.className = 'workflow-item';

        const workflowInfo = document.createElement('div');

        const workflowName = document.createElement('div');
        workflowName.className = 'workflow-name';
        workflowName.textContent = workflow.name;

        const workflowDetails = document.createElement('div');
        workflowDetails.className = 'workflow-details';
        const nodeInfo = workflow.imageNodeId ? `Node ID: ${workflow.imageNodeId}` : 'Auto-detect LoadImage node';
        workflowDetails.textContent = nodeInfo;

        workflowInfo.appendChild(workflowName);
        workflowInfo.appendChild(workflowDetails);

        const workflowActions = document.createElement('div');
        workflowActions.className = 'workflow-actions';

        const editWorkflowBtn = document.createElement('button');
        editWorkflowBtn.textContent = 'Edit';
        editWorkflowBtn.className = 'secondary small';
        editWorkflowBtn.addEventListener('click', () => {
          editWorkflow(serverIndex, workflowIndex);
        });

        const deleteWorkflowBtn = document.createElement('button');
        deleteWorkflowBtn.textContent = 'Delete';
        deleteWorkflowBtn.className = 'danger small';
        deleteWorkflowBtn.addEventListener('click', () => {
          deleteWorkflow(serverIndex, workflowIndex);
        });

        workflowActions.appendChild(editWorkflowBtn);
        workflowActions.appendChild(deleteWorkflowBtn);

        workflowItem.appendChild(workflowInfo);
        workflowItem.appendChild(workflowActions);

        serverContent.appendChild(workflowItem);
      });
    } else {
      const noWorkflows = document.createElement('div');
      noWorkflows.className = 'no-workflows';
      noWorkflows.textContent = 'No workflows configured for this server';
      serverContent.appendChild(noWorkflows);
    }

    serverCard.appendChild(serverHeader);
    serverCard.appendChild(serverContent);
    serverList.appendChild(serverCard);
  });
}

// Server Modal Functions
function showServerModal(title, server = null) {
  document.getElementById('serverModalTitle').textContent = title;
  document.getElementById('serverName').value = server ? server.name : '';
  document.getElementById('serverUrl').value = server ? server.url : '';
  document.getElementById('serverModal').classList.add('show');
}

function hideServerModal() {
  document.getElementById('serverModal').classList.remove('show');
  currentServerIndex = -1;
}

async function saveServer() {
  const name = document.getElementById('serverName').value.trim();
  const url = document.getElementById('serverUrl').value.trim();

  if (!name) {
    showStatus('Please enter a server name', 'error');
    return;
  }

  if (!url) {
    showStatus('Please enter a server URL', 'error');
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];

  if (currentServerIndex === -1) {
    // Adding new server
    servers.push({ name, url, workflows: [] });
  } else {
    // Editing existing server
    servers[currentServerIndex].name = name;
    servers[currentServerIndex].url = url;
  }

  try {
    await chrome.storage.local.set({ servers });
    console.log('Servers saved:', servers);

    hideServerModal();
    await loadAndRenderServers();
    showStatus('Server saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving server:', error);
    showStatus('Failed to save server: ' + error.message, 'error');
  }
}

async function testServer() {
  const url = document.getElementById('serverUrl').value.trim();

  if (!url) {
    showStatus('Please enter a server URL first', 'error');
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    showStatus('Please enter a valid URL', 'error');
    return;
  }

  showStatus('Testing connection...', 'success');

  try {
    const serverUrl = url.replace(/\/$/, '');
    const response = await fetch(`${serverUrl}/system_stats`, { method: 'GET' });

    if (response.ok) {
      const data = await response.json();
      showStatus(`Connection successful! ComfyUI is running.`, 'success');
    } else {
      showStatus(`Connection failed: ${response.status} ${response.statusText}`, 'error');
    }
  } catch (error) {
    showStatus(`Connection failed: ${error.message}`, 'error');
  }
}

async function editServer(serverIndex) {
  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];
  const server = servers[serverIndex];

  if (!server) {
    showStatus('Server not found', 'error');
    return;
  }

  currentServerIndex = serverIndex;
  showServerModal('Edit Server', server);
}

async function deleteServer(serverIndex) {
  if (!confirm('Are you sure you want to delete this server and all its workflows?')) {
    return;
  }

  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];

  servers.splice(serverIndex, 1);

  try {
    await chrome.storage.local.set({ servers });
    console.log('Server deleted, remaining:', servers);

    await loadAndRenderServers();
    showStatus('Server deleted successfully!', 'success');
  } catch (error) {
    console.error('Error deleting server:', error);
    showStatus('Failed to delete server: ' + error.message, 'error');
  }
}

// Workflow Modal Functions
function showWorkflowModal(title, workflow = null) {
  document.getElementById('workflowModalTitle').textContent = title;
  document.getElementById('workflowName').value = workflow ? workflow.name : '';
  document.getElementById('imageNodeId').value = workflow ? (workflow.imageNodeId || '') : '';

  if (workflow && workflow.workflowData) {
    try {
      const formatted = JSON.stringify(JSON.parse(workflow.workflowData), null, 2);
      document.getElementById('workflowData').value = formatted;
    } catch (e) {
      document.getElementById('workflowData').value = workflow.workflowData;
    }
  } else {
    document.getElementById('workflowData').value = '';
  }

  document.getElementById('workflowModal').classList.add('show');
}

function hideWorkflowModal() {
  document.getElementById('workflowModal').classList.remove('show');
  currentWorkflowIndex = -1;
}

async function saveWorkflow() {
  if (currentServerIndex === -1) {
    showStatus('Error: No server selected', 'error');
    return;
  }

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

  // Validate JSON
  try {
    JSON.parse(workflowData);
  } catch (e) {
    showStatus('Invalid workflow JSON: ' + e.message, 'error');
    return;
  }

  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];

  if (!servers[currentServerIndex]) {
    showStatus('Server not found', 'error');
    return;
  }

  const workflow = { name, workflowData, imageNodeId: imageNodeId || null };

  if (!servers[currentServerIndex].workflows) {
    servers[currentServerIndex].workflows = [];
  }

  if (currentWorkflowIndex === -1) {
    // Adding new workflow
    servers[currentServerIndex].workflows.push(workflow);
  } else {
    // Editing existing workflow
    servers[currentServerIndex].workflows[currentWorkflowIndex] = workflow;
  }

  try {
    await chrome.storage.local.set({ servers });
    console.log('Workflow saved for server', currentServerIndex);

    hideWorkflowModal();
    await loadAndRenderServers();
    showStatus('Workflow saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving workflow:', error);
    showStatus('Failed to save workflow: ' + error.message, 'error');
  }
}

async function editWorkflow(serverIndex, workflowIndex) {
  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];
  const workflow = servers[serverIndex]?.workflows?.[workflowIndex];

  if (!workflow) {
    showStatus('Workflow not found', 'error');
    return;
  }

  currentServerIndex = serverIndex;
  currentWorkflowIndex = workflowIndex;
  showWorkflowModal('Edit Workflow', workflow);
}

async function deleteWorkflow(serverIndex, workflowIndex) {
  if (!confirm('Are you sure you want to delete this workflow?')) {
    return;
  }

  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];

  if (servers[serverIndex] && servers[serverIndex].workflows) {
    servers[serverIndex].workflows.splice(workflowIndex, 1);

    try {
      await chrome.storage.local.set({ servers });
      console.log('Workflow deleted');

      await loadAndRenderServers();
      showStatus('Workflow deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      showStatus('Failed to delete workflow: ' + error.message, 'error');
    }
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
