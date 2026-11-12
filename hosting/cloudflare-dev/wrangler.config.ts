// Same cf static-site adapter as production, with isolated development output.
import {defineWranglerConfig} from 'wrangler/experimental-config';
export default defineWranglerConfig({assetsDirectory:'../../dist'});
