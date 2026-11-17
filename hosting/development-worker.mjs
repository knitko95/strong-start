// Authoring bindings and routes exist only on the development Worker.
import feedback from './feedback-worker.mjs';
import {poseFetch} from './pose-review-worker.mjs';
export {FeedbackOutbox} from './feedback-worker.mjs';
export default {
 async fetch(request,env,ctx){
  const p=new URL(request.url).pathname;
  if(p.startsWith('/api/pose-review/')||p.startsWith('/workspace/'))return poseFetch(request,env);
  return feedback.fetch(request,env,ctx);
 }
};
