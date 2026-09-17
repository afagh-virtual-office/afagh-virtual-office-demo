try {
  await import('./migrate.mjs');
  console.log('Communication OS migrations: PASS');
} catch (error) {
  console.error(`Communication OS migrations: BLOCKED:${error?.message || 'UNKNOWN'}`);
  process.exitCode = 1;
  process.exit();
}

const publicPort = Number(process.env.PORT || 8787);
const gatewayPort = publicPort + 1;
process.env.PORT = String(gatewayPort);
process.env.COMMUNICATION_GATEWAY_PORT = String(gatewayPort);
await import('./gateway.mjs');
process.env.PORT = String(publicPort);
await import('./golden-entry.mjs');
