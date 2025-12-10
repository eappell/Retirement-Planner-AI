const handler = require('../api/report');

// Mock request (IncomingMessage) and response
const makeMockReq = (body) => {
  const bodyStr = JSON.stringify(body);
  const req = {
    headers: { 'content-type': 'application/json' },
    body: undefined,
    on: (ev, handler) => {
      if (ev === 'data') {
        setTimeout(() => handler(Buffer.from(bodyStr)), 0);
      }
      if (ev === 'end') {
        setTimeout(handler, 0);
      }
    }
  };
  return req;
};

const makeMockRes = () => {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    status(code) { this.statusCode = code; return this; },
    setHeader(k,v) { this.headers[k] = v; },
    json(obj) { this.body = JSON.stringify(obj); console.log('RESPONSE', this.statusCode, this.headers, this.body); },
    send(s) { this.body = s; console.log('RESPONSE', this.statusCode, this.headers, this.body); }
  };
};

(async () => {
  const req = makeMockReq({ eventType: 'test', application: 'retirement-planner', metadata: { timestamp: new Date().toISOString() } });
  const res = makeMockRes();
  // Set a backend to forward to for testing (httpbin returns JSON)
  process.env.PORTAL_TRACK_URL = 'https://httpbin.org/post';
  try {
    await handler(req, res);
  } catch (e) {
    console.error('Handler threw', e);
  }
})();
