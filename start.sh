#!/bin/bash

# Terminate both child servers when receiving exit signal (CTRL+C)
cleanup() {
    echo -e "\n\n[ClauseIQ] Shutting down development servers..."
    kill "$BACKEND_PID" 2>/dev/null
    kill "$FRONTEND_PID" 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

echo "=========================================="
echo "      Starting ClauseIQ Dev Stack"
echo "=========================================="

# 1. Start FastAPI Backend Server
echo "[Backend] Starting server on http://127.0.0.1:8000..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait 1.5 seconds for backend to start before firing frontend
sleep 1.5

# 2. Start Vite React Frontend Server
echo "[Frontend] Starting Vite server on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "------------------------------------------"
echo "ClauseIQ stack is active!"
echo "Press CTRL+C in this window to shut down both."
echo "=========================================="

# Keep script running and wait for background PIDs
wait
