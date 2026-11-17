// Compatible entry point for the expanded paged-history checks.
const suite=require('./test-paged-history.cjs');suite.run().catch(e=>{console.error(e);suite.server.close();process.exitCode=1;});
