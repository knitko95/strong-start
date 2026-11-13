import {bindings,defineConfig,exports} from 'cf/config';
import {sharedWorker} from '../shared-worker.ts';

// No custom domain, route, Git release trigger or production binding is
// installed by this configuration. Connect strongstart.app only after review.
export default defineConfig({
  accountId: '04a90695aab9e16508a12ea9d139c427',
  worker: {
    ...sharedWorker,
    name: 'strong-start',
    entrypoint:'../feedback-worker.mjs',
    assets:{...sharedWorker.assets,runWorkerFirst:['/api/feedback','/api/feedback/*']},
    placement:{mode:'smart',hint:'enam'},
    exports:{FeedbackOutbox:exports.durableObject({storage:'sqlite'})},
    env:{FEEDBACK_ENVIRONMENT:bindings.text('production'),GITHUB_FEEDBACK_TOKEN:bindings.secret()},
  }
});
