# Local Network Pastebin

A lightweight, secure, and beautifully designed web application that allows you to seamlessly copy, paste, and share text snippets across all devices connected to your local network. No cloud storage, no complex setup—just fast and private local syncing.

## Running the Application

### Starting the Server
1. Open a terminal or Command Prompt.
2. Navigate to the project folder: `cd d:\Personal\Pastebin`
3. Start the server using Node: `npm start` (or `node server.js`)
4. The server will run in the background as long as the terminal is open.

### Stopping the Server
- To stop the server while it's running in the terminal, simply press **`Ctrl + C`** on your keyboard.
- It will safely terminate the process and stop hosting the Pastebin.

## Accessing the Application
Once the server is running, you can view and use the Pastebin across any device on your local network by navigating to:
**http://192.168.1.205:3000** 
*(Note: Replace `192.168.1.205` with your machine's new IPv4 address if your router re-assigns it)*

## Changes Made
- **[NEW]** `package.json` & `server.js` (Express.js backend with local JSON file storage)
- **[NEW]** `public/index.html` (Semantic HTML layout)
- **[NEW]** `public/style.css` (Bespoke glassmorphism design with a dark mode color palette)
- **[NEW]** `public/script.js` (Fetch API interactions for loading and creating pastes)

## Design Features
We followed strict instructions to provide a premium design using Vanilla CSS:
- Smooth animated background blobs
- Glassmorphed cards and panels
- Clean layout using the Inter font family
- Built-in one-click copy to clipboard
