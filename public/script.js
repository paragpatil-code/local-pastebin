document.addEventListener('DOMContentLoaded', () => {
    const pasteInput = document.getElementById('paste-input');
    const saveBtn = document.getElementById('save-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveStatus = document.getElementById('save-status');
    const pastesContainer = document.getElementById('pastes-container');
    const uploadFileBtn = document.getElementById('upload-file-btn');
    const fileInput = document.getElementById('file-input');

    const API_URL = '/api/pastes';
    let editingPasteId = null;

    // Fetch and display initial pastes
    fetchPastes();

    // Event listeners
    saveBtn.addEventListener('click', savePaste);
    cancelEditBtn.addEventListener('click', cancelEdit);
    
    uploadFileBtn.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', uploadFile);

    // Allow saving by pressing Ctrl+Enter or Cmd+Enter
    pasteInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            savePaste();
        }
    });

    async function fetchPastes() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const pastes = await response.json();
            renderPastes(pastes);
        } catch (error) {
            console.error('Error fetching pastes:', error);
            pastesContainer.innerHTML = '<div class="empty-state">Failed to load pastes.</div>';
        }
    }

    async function savePaste() {
        const content = pasteInput.value;
        if (!content || !content.trim()) return;

        saveBtn.disabled = true;
        saveBtn.textContent = editingPasteId ? 'Updating...' : 'Saving...';

        try {
            const method = editingPasteId ? 'PUT' : 'POST';
            const url = editingPasteId ? `${API_URL}/${editingPasteId}` : API_URL;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) throw new Error('Failed to save paste');
            
            showStatus(editingPasteId ? 'Updated successfully!' : 'Saved successfully!');
            
            // Revert state
            cancelEdit();
            
            // Refresh list
            fetchPastes();
        } catch (error) {
            console.error('Error saving paste:', error);
            showStatus('Failed to save. Try again.', true);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = editingPasteId ? 'Update Paste' : 'Save Paste';
        }
    }

    async function uploadFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        uploadFileBtn.disabled = true;
        uploadFileBtn.textContent = 'Uploading...';

        try {
            const response = await fetch('/api/files', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Failed to upload file');
            
            showStatus('File uploaded successfully!');
            fetchPastes();
        } catch (error) {
            console.error('Error uploading file:', error);
            showStatus('Failed to upload file.', true);
        } finally {
            uploadFileBtn.disabled = false;
            uploadFileBtn.textContent = 'Upload File';
            fileInput.value = ''; // reset input
        }
    }

    function renderPastes(pastes) {
        pastesContainer.innerHTML = '';
        
        if (pastes.length === 0) {
            pastesContainer.innerHTML = `
                <div class="empty-state">
                    No pastes found. Create one above!
                </div>
            `;
            return;
        }

        pastes.forEach(paste => {
            const date = new Date(paste.createdAt);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateString = date.toLocaleDateString();

            const item = document.createElement('div');
            item.className = 'paste-item';
            
            if (paste.type === 'file') {
                const fileSize = formatBytes(paste.file.size);
                item.innerHTML = `
                    <div class="paste-header">
                        <span class="paste-time" title="${date.toLocaleString()}">${dateString} at ${timeString}</span>
                        <div class="paste-actions">
                            <button class="delete-btn" data-id="${paste.id}">Delete</button>
                        </div>
                    </div>
                    <div class="file-card">
                        <div class="file-icon">📄</div>
                        <div class="file-info">
                            <div><strong>${escapeHTML(paste.file.originalname)}</strong></div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <a href="/uploads/${paste.file.filename}" class="download-btn" download="${escapeHTML(paste.file.originalname)}" target="_blank">Download File</a>
                    </div>
                `;
            } else {
                item.innerHTML = `
                    <div class="paste-header">
                        <span class="paste-time" title="${date.toLocaleString()}">${dateString} at ${timeString}</span>
                        <div class="paste-actions">
                            <button class="edit-btn" data-id="${paste.id}" data-content="${encodeURIComponent(paste.content)}">Edit</button>
                            <button class="copy-btn" data-content="${encodeURIComponent(paste.content)}">Copy</button>
                            <button class="delete-btn" data-id="${paste.id}">Delete</button>
                        </div>
                    </div>
                    <div class="paste-content">${escapeHTML(paste.content)}</div>
                `;
            }

            pastesContainer.appendChild(item);
        });

        // Add edit listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const encodedContent = e.target.getAttribute('data-content');
                const content = decodeURIComponent(encodedContent);
                startEdit(id, content);
            });
        });

        // Add copy listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const encodedContent = e.target.getAttribute('data-content');
                const content = decodeURIComponent(encodedContent);
                copyToClipboard(content, e.target);
            });
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this paste?')) {
                    await deletePaste(id);
                }
            });
        });
    }

    function startEdit(id, content) {
        editingPasteId = id;
        pasteInput.value = content;
        saveBtn.textContent = 'Update Paste';
        cancelEditBtn.style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        pasteInput.focus();
    }

    function cancelEdit() {
        editingPasteId = null;
        pasteInput.value = '';
        saveBtn.textContent = 'Save Paste';
        cancelEditBtn.style.display = 'none';
    }

    async function deletePaste(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete paste');
            fetchPastes();
            showStatus('Paste deleted');
        } catch (error) {
            console.error('Error deleting paste:', error);
            showStatus('Failed to delete', true);
        }
    }

    async function copyToClipboard(text, btnElement) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = btnElement.textContent;
            btnElement.textContent = 'Copied!';
            btnElement.style.background = 'var(--primary)';
            btnElement.style.color = 'white';
            
            setTimeout(() => {
                btnElement.textContent = originalText;
                btnElement.style.background = 'transparent';
                btnElement.style.color = 'var(--primary)';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            btnElement.textContent = 'Copied!';
            setTimeout(() => btnElement.textContent = 'Copy', 2000);
        }
    }

    function showStatus(message, isError = false) {
        saveStatus.textContent = message;
        saveStatus.style.color = isError ? '#ef4444' : '#4ade80';
        saveStatus.classList.add('show');
        
        setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 3000);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
});
