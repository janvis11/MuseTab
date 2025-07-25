# 🧠MuseTab: GPT Web Assistant.

A powerful browser extension that allows users to interact with webpage content using AI. Ask questions about any webpage and get intelligent answers powered by OpenAI's GPT-4.

## Features✨

1. Dynamic Content Retrieval: Automatically scrapes visible text content from the current webpage

2. Linked Pages Analysis: Optionally includes content from linked pages (one level deep) for comprehensive understanding

3. AI-Powered Responses: Uses OpenAI GPT-4 to provide intelligent answers based on webpage content

4. Chat Interface: Clean, intuitive popup UI with chat-like interaction

5. Customizable Depth: Toggle to include or exclude linked pages in analysis

6. Persistent Chat History: Maintains conversation history during browser session


## Architecture🏗️

Frontend (Browser Extension)

1. Manifest V3 browser extension

2. Content Script for webpage content extraction

3. Popup Interface for user interaction

4. Background Script for extension management

Backend (Node.js Server)

1. Express.js REST API server

2. OpenAI GPT-4 integration

3. CORS enabled for extension communication

4. Environment variable configuration

## Tech Stack🛠️

-> Frontend: HTML, CSS, JavaScript (Vanilla)

-> Backend: Node.js, Express.js

-> AI: OpenAI GPT-4 API

-> Browser: Chrome Extension (Manifest V3)


## Future Enhancements🔮 

1. Support for other AI models (Claude, Gemini, etc.)

2. Better content extraction algorithms

3. User authentication and settings sync

4. Export chat conversations

5. Support for PDFs and other document types


