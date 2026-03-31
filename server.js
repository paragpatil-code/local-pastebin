const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'pastes.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Get all pastes
app.get('/api/pastes', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read pastes' });
    }
});

// Create a new paste
app.post('/api/pastes', (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const newPaste = {
            id: Date.now().toString(),
            content,
            createdAt: new Date().toISOString()
        };
        data.unshift(newPaste); // Add to the beginning
        
        // Keep only top 100 pastes to prevent huge files
        const trimmedData = data.slice(0, 100);
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(trimmedData, null, 2));
        res.status(201).json(newPaste);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create paste' });
    }
});

// Delete a paste
app.delete('/api/pastes/:id', (req, res) => {
    try {
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const { id } = req.params;
        const initialLength = data.length;
        data = data.filter(paste => paste.id !== id);
        
        if (data.length === initialLength) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete paste' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pastebin server running on port ${PORT}`);
    console.log(`Accessible on your local network at http://<YOUR_LOCAL_IP>:${PORT}`);
});
