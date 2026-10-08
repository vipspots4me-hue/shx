const http = require("http");
const { exec } = require("child_process");

const PORT = process.env.PORT || 3000;

let logs = [];

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}`;

  console.log(line, flush = true);
  logs.push(line);

  if (logs.length > 500) {
    logs.shift();
  }
}

function runProcessTest() {
  log("========================================");
  log("Node.js process started");
  log("Node version:", process.version);
  log("Platform:", process.platform);
  log("Architecture:", process.arch);
  log("Working directory:", process.cwd());
  log("========================================");

  exec("echo Process test OK && node --version", (error, stdout, stderr) => {
    if (stdout) {
      stdout.trim().split("\n").forEach(line => log(line));
    }

    if (stderr) {
      stderr.trim().split("\n").forEach(line => log("[stderr]", line));
    }

    if (error) {
      log("[error]", error.message);
    }

    log("Process test finished");
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/logs") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    });

    res.end(logs.join("\n"));
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      ok: true,
      node: process.version,
      uptime: process.uptime()
    }));

    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8"
  });

  res.end(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Node.js Logs</title>
<style>
body {
  background: #111;
  color: #eee;
  font-family: monospace;
  padding: 20px;
}
pre {
  white-space: pre-wrap;
  background: #000;
  padding: 20px;
  border-radius: 8px;
}
</style>
</head>
<body>

<h2>Node.js Runtime Logs</h2>

<pre id="logs">Loading...</pre>

<script>
async function updateLogs() {
  try {
    const response = await fetch('/logs?t=' + Date.now());
    document.getElementById('logs').textContent =
      await response.text();
  } catch (e) {
    document.getElementById('logs').textContent =
      'Unable to read logs: ' + e;
  }
}

updateLogs();
setInterval(updateLogs, 2000);
</script>

</body>
</html>
  `);
});

server.listen(PORT, () => {
  log("HTTP server listening on port", String(PORT));
  log("Web log page: /");
  log("Raw logs: /logs");
  log("Health check: /health");
});

runProcessTest();
