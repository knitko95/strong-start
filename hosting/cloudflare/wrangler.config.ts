// cf's static-site build adapter; cf remains the project CLI.
import {defineWranglerConfig} from 'wrangler/experimental-config';
export default defineWranglerConfig({assetsDirectory:'../../dist-production'});
