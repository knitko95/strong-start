const target=process.argv[2];
if(!['dev1','dev2'].includes(target))throw new Error('Expected dev1 or dev2');
process.env.STRONG_START_PREVIEW=target;
await import('./build-dev.mjs');
