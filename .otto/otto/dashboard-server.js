#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse args
const args = process.argv.slice(2);
const getArg = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const sessionId = getArg('session', '');
const port = parseInt(getArg('port', '3456'), 10);

if (isNaN(port) || port < 1 || port > 65535) {
  console.error('Invalid port number');
  process.exit(1);
}

if (!sessionId || sessionId.startsWith('--')) {
  console.error('Usage: node dashboard-server.js --session <session_id> [--port 3456]');
  process.exit(1);
}

const kitDir = path.resolve(__dirname, '..');
const sessionDir = path.join(__dirname, 'sessions', sessionId);
const statePath = path.join(sessionDir, 'state.json');
const dashboardPath = path.join(__dirname, 'dashboard.html');

if (!fs.existsSync(sessionDir)) {
  console.error(`Session directory not found: ${sessionDir}`);
  process.exit(1);
}

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (res, data, code = 200) => { res.writeHead(code, { ...cors, 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
const readJson = (p) => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Failed to read ${p}: ${err.message}`);
    }
    return null;
  }
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname === '/') {
    try {
      const html = fs.readFileSync(dashboardPath, 'utf8');
      res.writeHead(200, { ...cors, 'Content-Type': 'text/html' });
      res.end(html);
    } catch { res.writeHead(404, cors); res.end('Dashboard not found'); }
    return;
  }

  if (url.pathname === '/api/state') {
    const state = readJson(statePath);
    return state ? json(res, state) : json(res, { error: 'State not found' }, 404);
  }

  if (url.pathname === '/api/tasks') {
    const state = readJson(statePath);
    if (!state?.product_spec_id) return json(res, { error: 'No spec_id in state' }, 404);
    const tasksPath = path.join(kitDir, 'tasks', `${state.product_spec_id}.json`);
    const tasks = readJson(tasksPath);
    return tasks ? json(res, tasks) : json(res, { error: 'Tasks not found' }, 404);
  }

  if (url.pathname === '/api/events') {
    res.writeHead(200, { ...cors, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    let lastStateMtime = 0;
    let lastTasksMtime = 0;
    let tasksPath = null;

    const check = () => {
      try {
        // Check state.json
        const stateStat = fs.statSync(statePath);
        if (stateStat.mtimeMs > lastStateMtime) {
          lastStateMtime = stateStat.mtimeMs;
          const state = readJson(statePath);
          if (state) {
            send({ type: 'state', data: state });
            // Update tasks path if we have spec_id
            if (state.product_spec_id) {
              tasksPath = path.join(kitDir, 'tasks', `${state.product_spec_id}.json`);
            }
          }
        }

        // Check tasks file
        if (tasksPath) {
          try {
            const tasksStat = fs.statSync(tasksPath);
            if (tasksStat.mtimeMs > lastTasksMtime) {
              lastTasksMtime = tasksStat.mtimeMs;
              const tasks = readJson(tasksPath);
              if (tasks) send({ type: 'tasks', data: tasks });
            }
          } catch {} // Tasks file may not exist yet
        }
      } catch (err) {
        console.error('SSE check error:', err.message);
      }
    };

    check(); // Send initial state
    const interval = setInterval(check, 1000);
    const heartbeatInterval = setInterval(() => res.write(': heartbeat\n\n'), 30000);
    req.on('close', () => {
      clearInterval(interval);
      clearInterval(heartbeatInterval);
    });
    return;
  }

  res.writeHead(404, cors);
  res.end('Not found');
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Dashboard server running at http://127.0.0.1:${port}`);
  console.log(`Session: ${sessionId}`);
});
