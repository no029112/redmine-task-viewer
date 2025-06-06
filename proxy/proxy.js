const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3001; // พอร์ตของ Proxy Server

app.use(cors());
//curl -H "X-Redmine-API-Key: 927d2943f53b5a05d7abb4f7ad6dee71c7e17fe3" http://redminekpsl.ddns.net:8888/redmine/issues.json
const REDMINE_API_KEY = '927d2943f53b5a05d7abb4f7ad6dee71c7e17fe3'; 

// Add middleware to log all incoming requests
app.use((req, res, next) => {
    console.log(`\n[Incoming Request] ${req.method} ${req.url}`);
    next();
});

app.use('/redmine-api', createProxyMiddleware({
    target: 'http://redminekpsl.ddns.net:8888',
    changeOrigin: true,
    pathRewrite: {
        '^/redmine-api': '/redmine', // Rewrite /redmine-api to /redmine
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {
        // Log the request details
        console.log(`[Proxy] Original URL: ${req.url}`);
        console.log(`[Proxy] Target URL: ${proxyReq.path}`);
        console.log(`[Proxy] Method: ${req.method}`);
        console.log(`[Proxy] Headers:`, req.headers);
    },
    onProxyRes: function onProxyRes(proxyRes, req, res) {
        // Log the response status
        console.log(`[Proxy] Response Status: ${proxyRes.statusCode}`);
    },
    onError: function onError(err, req, res) {
        console.error('[Proxy] Error:', err);
        res.writeHead(500, {
            'Content-Type': 'text/plain',
        });
        res.end('Proxy Error: ' + err.message);
    },
    logLevel: 'debug',
}));

app.get('/s', (req, res) => {
    res.send('Hello World'); // this work
});

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
    console.log(`Your Redmine API will be accessible via http://localhost:${port}/redmine-api/issues.json`);
});