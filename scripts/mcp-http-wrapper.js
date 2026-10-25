/**
 * MCP HTTP Wrapper for Cloudflare Tunnel
 * Exposes Ruflo's stdio MCP server via HTTP for tunneling
 * 
 * Usage:
 *   node scripts/mcp-http-wrapper.js
 *   # Then: cloudflared tunnel --url http://localhost:3001
 */

import express from 'express';
import { spawn } from 'child_process';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: '*/*' }));

const HTTP_PORT = process.env.MCP_HTTP_PORT || 3001;
const MCP_COMMAND = process.env.MCP_COMMAND || 'npx';
const MCP_ARGS = (process.env.MCP_ARGS || 'ruflo mcp start').split(' ');

let mcpProcess = null;
const pendingRequests = new Map();
let requestId = 0;

// Start MCP subprocess
function startMCP() {
  console.log(`[MCP Wrapper] Starting: ${MCP_COMMAND} ${MCP_ARGS.join(' ')}`);
  
  mcpProcess = spawn(MCP_COMMAND, MCP_ARGS, {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  // Handle stdout - MCP responses
  let buffer = '';
  mcpProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          handleMCPResponse(response);
        } catch (e) {
          console.error('[MCP Wrapper] Parse error:', line.substring(0, 200));
        }
      }
    }
  });

  mcpProcess.on('exit', (code) => {
    console.log(`[MCP Wrapper] Process exited with code ${code}`);
    // Reject pending requests
    for (const [id, { reject }] of pendingRequests) {
      reject(new Error('MCP process exited'));
    }
    pendingRequests.clear();
    
    // Restart after 2s
    setTimeout(startMCP, 2000);
  });

  mcpProcess.on('error', (err) => {
    console.error('[MCP Wrapper] Spawn error:', err);
  });
}

// Handle MCP response - match to pending request
function handleMCPResponse(response) {
  const id = response.id || response.requestId;
  if (id && pendingRequests.has(id)) {
    const { resolve } = pendingRequests.get(id);
    pendingRequests.delete(id);
    resolve(response);
  }
}

// Send request to MCP stdin
function sendToMCP(request) {
  return new Promise((resolve, reject) => {
    if (!mcpProcess || mcpProcess.killed) {
      reject(new Error('MCP process not running'));
      return;
    }
    
    const id = request.id || `req-${++requestId}`;
    const message = { ...request, id };
    
    pendingRequests.set(id, { resolve, reject, timestamp: Date.now() });
    
    try {
      mcpProcess.stdin.write(JSON.stringify(message) + '\n');
    } catch (e) {
      pendingRequests.delete(id);
      reject(e);
    }
    
    // Timeout after 60s
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('MCP request timeout'));
      }
    }, 60000);
  });
}

// REST endpoint for MCP calls
app.post('/mcp', async (req, res) => {
  try {
    const request = req.body;
    const response = await sendToMCP(request);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message, jsonrpc: '2.0', id: req.body?.id });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: mcpProcess && !mcpProcess.killed ? 'running' : 'starting',
    pid: mcpProcess?.pid,
    pendingRequests: pendingRequests.size
  });
});

// SSE endpoint for streaming (optional)
app.get('/mcp/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  // Send periodic heartbeat
  const interval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);
  
  req.on('close', () => clearInterval(interval));
});

// WebSocket for bidirectional MCP (better for stdio)
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/mcp/ws' });

wss.on('connection', (ws) => {
  console.log('[MCP Wrapper] WebSocket client connected');
  
  ws.on('message', async (data) => {
    try {
      const request = JSON.parse(data.toString());
      const response = await sendToMCP(request);
      ws.send(JSON.stringify(response));
    } catch (err) {
      ws.send(JSON.stringify({ error: err.message, jsonrpc: '2.0', id: request?.id }));
    }
  });
  
  ws.on('close', () => console.log('[MCP Wrapper] WebSocket client disconnected'));
});

server.listen(HTTP_PORT, () => {
  console.log(`[MCP Wrapper] HTTP server listening on port ${HTTP_PORT}`);
  console.log(`[MCP Wrapper] REST endpoint: http://localhost:${HTTP_PORT}/mcp`);
  console.log(`[MCP Wrapper] WebSocket: ws://localhost:${HTTP_PORT}/mcp/ws`);
  console.log(`[MCP Wrapper] Health: http://localhost:${HTTP_PORT}/health`);
  startMCP();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[MCP Wrapper] Shutting down...');
  if (mcpProcess) mcpProcess.kill();
  server.close(() => process.exit(0));
});