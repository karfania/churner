# Churner

A fullstack web app that aggregates and scores promotional bank account deals.

## Project Structure

- `frontend/`: Next.js application with Tailwind CSS.
- `backend/`: Python FastAPI application with scraping logic.

## Getting Started

### Prerequisites

- Node.js
- Python 3.8+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: You may need to create requirements.txt first or install manually: `pip install fastapi uvicorn beautifulsoup4 requests playwright pydantic`)*
4. Run the server:
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Features

- **Scraping**: Aggregates bank promotions (currently using mock data for reliability).
- **Scoring**: Calculates a "Churner Score" based on bonus amount, fees, requirements, and ROI.
- **UI**: Clean, modern interface inspired by Apple and Stripe.
