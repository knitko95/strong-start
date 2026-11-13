// Experiments share the existing development feedback outbox and Auth checks.
export default {
  async fetch(request) {
    const url=new URL(request.url);
    if(!(url.pathname==='/api/feedback'||/^\/api\/feedback\/[0-9a-f-]{36}$/i.test(url.pathname)))return new Response('Not found',{status:404});
    const origin=request.headers.get('Origin');
    if(origin && origin!==url.origin)return new Response('Forbidden',{status:403});
    url.protocol='https:';url.host='dev.strongstart.app';
    const forwarded=new Request(url,request);
    if(origin)forwarded.headers.set('Origin',url.origin);
    return fetch(forwarded,{redirect:'manual'});
  }
};
