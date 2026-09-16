try {
  await import('./migrate.mjs');
  console.log('Communication OS migrations: PASS');
} catch (error) {
  console.error(`Communication OS migrations: BLOCKED:${error?.message || 'UNKNOWN'}`);
}

await import('./gateway.mjs');
