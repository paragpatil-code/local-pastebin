const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'pastes.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Initialize uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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
            type: 'text',
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

// Upload new files
app.post('/api/files', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        const newPaste = {
            id: Date.now().toString() + '-' + Math.round(Math.random() * 1E4),
            type: 'file_group',
            files: req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
            })),
            createdAt: new Date().toISOString()
        };

        data.unshift(newPaste);
        
        // Keep only top 100 pastes
        const trimmedData = data.slice(0, 100);
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(trimmedData, null, 2));
        res.status(201).json(newPaste);
    } catch (error) {
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// Update a paste
app.put('/api/pastes/:id', (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const { id } = req.params;
        const pasteIndex = data.findIndex(paste => paste.id === id);
        
        if (pasteIndex === -1) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        
        data[pasteIndex].content = content;
        data[pasteIndex].updatedAt = new Date().toISOString();
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json(data[pasteIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update paste' });
    }
});

// Delete a paste
app.delete('/api/pastes/:id', (req, res) => {
    try {
        let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        const { id } = req.params;
        
        const pasteToDelete = data.find(paste => paste.id === id);
        if (!pasteToDelete) {
            return res.status(404).json({ error: 'Paste not found' });
        }
        
        data = data.filter(paste => paste.id !== id);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        // If it was a file, delete the file from the uploads directory
        if (pasteToDelete.type === 'file' && pasteToDelete.file && pasteToDelete.file.filename) {
            const filePath = path.join(UPLOADS_DIR, pasteToDelete.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } else if (pasteToDelete.type === 'file_group' && pasteToDelete.files) {
            pasteToDelete.files.forEach(f => {
                const filePath = path.join(UPLOADS_DIR, f.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete paste' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pastebin server running on port ${PORT}`);
    console.log(`Accessible on your local network at http://<YOUR_LOCAL_IP>:${PORT}`);
});
