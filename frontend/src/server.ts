// frontend/src/server.ts
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';

// Required for proxying API requests in SSR development mode (if needed)
// You might need to install this: npm install --save-dev http-proxy-middleware
// import { createProxyMiddleware } from 'http-proxy-middleware'; // Uncomment if using explicit proxy here

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

// --- IMPORTANT: Add API check *before* static/Angular handlers ---
app.use('/api', (req, res, next) => {
  // This middleware effectively blocks the SSR server from handling /api requests.
  // In a local dev environment with `ng serve` and proxy.conf.json,
  // this request should ideally not even reach here if the proxy works correctly.
  // If it *does* reach here, it means something is wrong with the dev server proxy
  // or you are running the compiled SSR server directly without a separate backend process.
  // For production, you'd typically use Nginx/Apache to route /api to your backend.

  // Option A: Just send a 404 to indicate the SSR server doesn't handle API
  res.status(404).send('API endpoint not handled by SSR server.');

  // Option B: If running SSR server standalone *and* need it to proxy (less common for dev):
  // (Requires installing http-proxy-middleware)
  /*
  createProxyMiddleware({
      target: 'http://localhost:8080', // Your backend URL
      changeOrigin: true,
      logLevel: 'debug'
  })(req, res, next);
  */
});
// --- End API check ---


/**
 * Serve static files from /browser
 * This will now only run if the path DOES NOT start with /api
 */
app.get(
  '**', // This captures everything NOT starting with /api now
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html', // Serve index.html for non-API GET requests that aren't static files
  }),
);

/**
 * Handle Angular rendering for non-static, non-API GET requests.
 * This might be redundant if the express.static above serves index.html correctly.
 * Consider if you need both this and the static index serving. Often, only one is needed
 * depending on how you handle SPA routing fallback.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  // Check if it's an API route again just in case (belt-and-suspenders)
  if (originalUrl.startsWith('/api')) {
    return next(); // Let it fall through (should have been caught above)
  }

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `<span class="math-inline">\{protocol\}\://</span>{headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

// Server startup logic (remains the same)
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
