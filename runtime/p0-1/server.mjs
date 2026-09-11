const MODE = process.env.AFAGH_RUNTIME_MODE || 'demo';

if (MODE === 'production') {
  await import('./production.mjs');
} else {
  await import('./demo.mjs');
}
