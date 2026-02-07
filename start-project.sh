#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Institute Management System...${NC}"

# Function to kill processes on exit
cleanup() {
    echo -e "${RED}\n🛑 Stopping all services...${NC}"
    kill $LARAVEL_PID 2>/dev/null
    kill $PROXY_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup SIGINT

# 1. Start Laravel Backend
echo -e "${GREEN}1. Starting Laravel Backend (Port 8000)...${NC}"
cd InstituteProApi
php artisan serve --host=127.0.0.1 --port=8000 > /dev/null 2>&1 &
LARAVEL_PID=$!
echo "   ✅ Laravel running (PID: $LARAVEL_PID)"

# 2. Start Node Proxy
echo -e "${GREEN}2. Starting Network Proxy (Port 8085)...${NC}"
# Install proxy dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "   📦 Installing proxy dependencies..."
    npm install http-proxy > /dev/null 2>&1
fi

node proxy.cjs > /dev/null 2>&1 &
PROXY_PID=$!
echo "   ✅ Proxy running (PID: $PROXY_PID)"

# 3. Start Expo App
echo -e "${GREEN}3. Starting Mobile App...${NC}"
echo -e "${BLUE}📱 Scan the QR code below with Expo Go${NC}"
cd ../InstituteProApp
npx expo start -c

# Keep script running to maintain background processes
wait
