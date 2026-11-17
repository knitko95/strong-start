import {bindings,defineConfig,exports} from 'cf/config';
import {sharedWorker} from '../shared-worker.ts';

export default defineConfig({
  accountId: '04a90695aab9e16508a12ea9d139c427',
  worker: {
    ...sharedWorker, name: 'strong-start-dev', entrypoint:'../development-worker.mjs',compatibilityFlags:['nodejs_compat'],
    assets:{...sharedWorker.assets,runWorkerFirst:['/api/feedback','/api/feedback/*','/api/pose-review/*','/workspace/*']},
    exports:{FeedbackOutbox:exports.durableObject({storage:'sqlite'})},
    env:{POSE_DB:bindings.d1({id:'0d2d08e3-dff9-4662-ae2a-7b93865b765e'}),POSE_FILES:bindings.r2({name:'strong-start-pose-review-private-dev'}),FEEDBACK_ENVIRONMENT:bindings.text('development'),GITHUB_FEEDBACK_TOKEN:bindings.secret()}
  }
});
