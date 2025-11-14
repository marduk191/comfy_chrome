// Popup script for ComfyUI Image Sender

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.sync.get(['comfyuiUrl']);

  if (settings.comfyuiUrl) {
    document.getElementById('comfyuiUrl').value = settings.comfyuiUrl;
  }

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
    await chrome.storage.sync.set({ comfyuiUrl });
    showStatus('Settings saved successfully!', 'success');
  });

  // Options link handler
  document.getElementById('optionsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}
