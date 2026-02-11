#!/bin/bash

# Kill processes on ports 3000 and 5173 before starting dev server

echo "Checking for processes on port 3000..."
PID_3000=$(lsof -ti:3000)
if [ ! -z "$PID_3000" ]; then
  echo "Killing process on port 3000 (PID: $PID_3000)"
  kill -9 $PID_3000 2>/dev/null
else
  echo "Port 3000 is free"
fi

echo "Checking for processes on port 5173..."
PID_5173=$(lsof -ti:5173)
if [ ! -z "$PID_5173" ]; then
  echo "Killing process on port 5173 (PID: $PID_5173)"
  kill -9 $PID_5173 2>/dev/null
else
  echo "Port 5173 is free"
fi

echo "Ports cleared, starting dev servers..."
