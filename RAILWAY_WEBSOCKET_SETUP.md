# Railway WebSocket Setup Guide

## Overview
This guide explains how to configure WebSockets for the Beton-AI application on Railway.

## Backend Configuration

### 1. WebSocket Server Setup
The backend WebSocket server is already configured in `backend/src/services/websocketService.ts` and initialized in `backend/src/index.ts`.

Key features:
- WebSocket server runs on the same port as Express (3001)
- WebSocket path: `/ws`
- Supports real-time job progress updates
- Automatic client reconnection with exponential backoff

### 2. CORS Configuration
The backend CORS is configured to allow WebSocket connections from:
- Development: `http://localhost:3000`
- Railway production: `https://*.up.railway.app`

## Frontend Configuration

### 1. Environment Variables
Set these environment variables in your Railway frontend service:

```bash
NEXT_PUBLIC_WS_URL=wss://your-backend-service-name.up.railway.app/ws
```

**Important:** Use `wss://` (WebSocket Secure) for Railway production, not `ws://`.

### 2. Auto-Detection
The frontend automatically detects the environment:
- If `NEXT_PUBLIC_API_URL` contains `railway.app`, it converts `ws://` to `wss://`
- Falls back to `ws://localhost:3001/ws` for development

## Railway Deployment Steps

### 1. Backend Service
1. Ensure your backend Railway service is deployed and healthy
2. Note your backend service URL (e.g., `https://beton-ai-backend-production.up.railway.app`)

### 2. Frontend Service
1. Add the WebSocket environment variable:
   ```bash
   NEXT_PUBLIC_WS_URL=wss://beton-ai-backend-production.up.railway.app/ws
   ```
2. Redeploy the frontend service

### 3. Verification
1. Open browser dev tools → Network tab
2. Navigate to your frontend application
3. Start a bulk download job
4. Look for WebSocket connection in Network tab:
   - Should show `101 Switching Protocols` status
   - Connection type: `websocket`
   - URL: `wss://your-backend-domain/ws`

## Troubleshooting

### Common Issues

1. **WebSocket connection fails with 403/404**
   - Check that the backend service is deployed and healthy
   - Verify the WebSocket URL format: `wss://backend-domain/ws`

2. **Connection established but no messages**
   - Check backend logs for WebSocket authentication
   - Verify user ID is being passed correctly
   - Check that jobs are actually running (Redis connection working)

3. **Frequent disconnections**
   - Railway may terminate idle connections
   - Our implementation includes automatic reconnection
   - Check connection timeout settings

### Testing WebSocket Connection

You can test the WebSocket connection manually:

```javascript
// In browser console
const ws = new WebSocket('wss://your-backend-domain/ws');
ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({type: 'auth', userId: 'test-user-id'}));
};
ws.onmessage = (event) => {
  console.log('Message:', JSON.parse(event.data));
};
```

## Features Using WebSockets

1. **Bulk Download Progress**
   - Real-time job progress updates
   - Job completion notifications
   - Job failure alerts

2. **CSV Upload Progress**
   - Upload progress tracking
   - Processing status updates

3. **Connection Management**
   - Automatic reconnection
   - Multiple client support per user
   - Heartbeat/ping-pong for connection health

## Performance Notes

- Railway supports WebSockets natively
- No special load balancer configuration needed
- WebSocket connections are sticky to specific instances
- Consider horizontal scaling implications for multi-instance deployments 