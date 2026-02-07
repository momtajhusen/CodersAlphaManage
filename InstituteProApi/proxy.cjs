const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server with custom application logic
const proxy = httpProxy.createProxyServer({});

// Error handling
proxy.on('error', function (err, req, res) {
  console.error('Proxy Error:', err);
  if (res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Something went wrong. And we are reporting a custom error message.');
  }
});

// Create your custom server and just call `proxy.web()` to proxy the request to another target
const server = http.createServer(function(req, res) {
  // Log the request
  console.log(`Incoming request: ${req.method} ${req.url}`);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if ( req.method === 'OPTIONS' ) {
    res.writeHead(200);
    res.end();
    return;
  }

  // Forward to local PHP server
  // Note: We point to 127.0.0.1 which is reliable for PHP built-in server
  proxy.web(req, res, { target: 'http://127.0.0.1:8000' });
});

const PORT = 8085;
console.log(`Proxy server listening on 0.0.0.0:${PORT} -> Forwarding to 127.0.0.1:8000`);
server.listen(PORT, '0.0.0.0');
