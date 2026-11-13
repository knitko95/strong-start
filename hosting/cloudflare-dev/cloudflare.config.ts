import {bindings,defineConfig,exports} from 'cf/config';
import {sharedWorker} from '../shared-worker.ts';

export default defineConfig({
  accountId: '04a90695aab9e16508a12ea9d139c427',
  worker: {
    ...sharedWorker, name: 'strong-start-dev', entrypoint:'../feedback-worker.mjs',
    assets:{...sharedWorker.assets,runWorkerFirst:['/api/feedback','/api/feedback/*']},
    placement:{mode:'smart',hint:'aws:us-east-2'},
    exports:{FeedbackOutbox:exports.durableObject({storage:'sqlite'})},
    env:{FEEDBACK_ENVIRONMENT:bindings.text('development'),GITHUB_FEEDBACK_TOKEN:bindings.secret()}
  }
});
