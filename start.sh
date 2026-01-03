#!/bin/bash

# Function to kill all child processes when the script exits
trap 'kill 0' EXIT

echo "🚀 Starting Churner App..."

# Start Backend
echo "🐍 Starting Backend (FastAPI)..."
(cd backend && source venv/bin/activate && python -m app.main) &

# Wait a moment for backend to initialize
sleep 2

# Start Frontend
echo "⚛️  Starting Frontend (Next.js)..."
(cd frontend && npm run dev) &

# Wait for both processes to finish (or until Ctrl+C)
wait