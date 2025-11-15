// Popup script for ComfyUI Image Sender

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.local.get(['servers']);
  const servers = settings.servers || [];

  // Display server count
  displayServerInfo(servers);

  // Options link handler
  document.getElementById('optionsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

function displayServerInfo(servers) {
  const countValue = document.getElementById('workflowCountValue');
  const workflowList = document.getElementById('workflowList');

  if (servers.length === 0) {
    countValue.textContent = 'No servers configured';
    workflowList.innerHTML = '<div style="margin-top: 8px; font-style: italic;">Click "Manage Workflows" to add servers</div>';
  } else {
    const totalWorkflows = servers.reduce((sum, server) => sum + (server.workflows?.length || 0), 0);
    countValue.textContent = `${servers.length} server${servers.length !== 1 ? 's' : ''}, ${totalWorkflows} workflow${totalWorkflows !== 1 ? 's' : ''}`;

    // Display servers and their workflow counts
    workflowList.innerHTML = '';
    servers.forEach(server => {
      const item = document.createElement('div');
      item.className = 'workflow-list-item';
      const workflowCount = server.workflows?.length || 0;
      item.textContent = `${server.name} (${workflowCount} workflow${workflowCount !== 1 ? 's' : ''})`;
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
