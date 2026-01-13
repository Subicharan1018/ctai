# Construction Procurement AI Assistant - Setup Guide

This project is a modern AI-powered construction procurement assistant that uses NLP and RAG (Retrieval Augmented Generation) to analyze project requirements, estimate materials, find vendors, and generate project schedules.

## Project Structure

- `backend_api/`: Flask-based Python backend with AI search capabilities
- `frontend/`: React + Vite frontend for the user interface

## 🚀 Backend Setup

The backend handles the AI logic, search index, and API endpoints.

### Prerequisites
- Python 3.8 or higher
- Groq API Key (for AI analysis)

### Installation Steps

1. **Navigate to the backend directory:**
   ```bash
   cd backend_api
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate

   # On Windows
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install required dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   > **Note:** If `requirements.txt` is missing, install manually:
   > `pip install flask flask-cors python-dotenv pandas sentence-transformers faiss-cpu numpy requests`

4. **Set up Environment Variables:**
   - Create a `.env` file in the `backend_api` directory (if not exists)
   - Add your Groq API key:
     ```
     GROQ_API_KEY=your_api_key_here
     ```

5. **Run the Server:**
   ```bash
   python3 app.py
   ```
   The server will start on `http://localhost:5001`.
   
   > Initial startup may take a moment to load the AI models and build the search index. Watch for "Procurement System Initialized" in the console.

## 💻 Frontend Setup

The frontend provides a modern chat interface and data visualization.

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation Steps

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## 🔄 Using the Application

1. Ensure BOTH backend (`port 5001`) and frontend (`port 5173`) are running.
2. Open `http://localhost:5173` in your browser.
3. In the chat input, describe your project. Example:
   > "25 MegaWatt Data Center in Navi Mumbai, 2 Lakh sqft built up area, budget 100 Crores"
   
4. The AI will provide:
   - **Analysis**: Detailed project breakdown
   - **Materials**: Required construction materials prioritized by AI
   - **Budget**: Cost estimation
   - **Vendors**: Matched vendors from the database (e.g., specific to Navi Mumbai)
   - **Schedule**: A Gantt chart showing project phases

## 🛠️ Troubleshooting

- **Backend fails to start:** Check if port 5001 is already in use.
- **"Module not found" error:** Ensure you activated the virtual environment and ran `pip install -r requirements.txt`.
- **Frontend API errors:** Verify the backend is running and the CORS configuration in `app.py` allows `localhost:5173`.