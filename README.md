# GameLink

Project I wanted to try that's inspired by Discord

## Project Structure

```
fullstack-app/
├── frontend/
│   ├── index.html      # Main page
│   ├── style.css       # Styling
│   └── app.js          # Client-side logic
├── backend/
│   ├── server.js       # Express server
│   ├── routes/
│   │   └── api.js      # API endpoints
│   └── package.json
├── package.json
└── .gitignore
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Open your browser** at [http://localhost:3000](http://localhost:3000)

## Features

- 🟢 Real-time server status
- 💬 Send and receive messages via REST API
- 🎨 Modern dark-mode UI
- ⚡ Auto-reload backend with `--watch`

## Tech Stack

| Layer       | Technology     |
|-------------|----------------|
| Frontend    | HTML / CSS / JS |
| Backend     | Node.js + Express |
| Language    | JavaScript      |
