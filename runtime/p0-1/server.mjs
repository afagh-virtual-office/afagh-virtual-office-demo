const MODE = process.env.AFAGH_RUNTIME_MODE || 'demo';

if (MODE === 'production') {
  // Render currently starts `server.mjs` directly. Keep migration and
  // production startup in one fail-closed entrypoint so the deployed
  // service cannot become healthy against an uninitialized database.
  await import('./migrate.mjs');
  await import('./production.mjs');
} else {
  await import('./demo.mjs');
}
