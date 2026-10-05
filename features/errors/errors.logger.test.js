'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { registerErrorLogging } = require('./errors.logger');

const captureErrors = async (callback) => {
  const originalConsoleError = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);

  try {
    await callback();
  } finally {
    console.error = originalConsoleError;
  }

  return calls;
};

const createServer = () => {
  const extensions = [];
  return {
    ext: (event, handler) => extensions.push({ event, handler }),
    extensions
  };
};

test('journalise lisiblement le statut et la cause d une exception Boom', async () => {
  const server = createServer();
  registerErrorLogging(server);

  const calls = await captureErrors(async () => {
    const result = server.extensions[0].handler({
      info: { id: 'request-1' },
      method: 'get',
      path: '/boom',
      response: Object.assign(new Error('getaddrinfo ENOTFOUND bdd'), {
        isBoom: true,
        code: 'ENOTFOUND',
        output: { statusCode: 500 }
      })
    }, { continue: Symbol('continue') });
    assert.equal(typeof result, 'symbol');
  });

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0][0],
    'Erreur HTTP 500 GET /boom (requête request-1) [ENOTFOUND]: getaddrinfo ENOTFOUND bdd'
  );
  assert.match(calls[0][1].message, /ENOTFOUND bdd/);
});

test('journalise le contexte d une réponse 500 construite par une route', async () => {
  const server = createServer();
  registerErrorLogging(server);

  const calls = await captureErrors(async () => {
    const result = server.extensions[0].handler({
      info: { id: 'request-2' },
      method: 'get',
      path: '/failure',
      response: { statusCode: 500 }
    }, { continue: Symbol('continue') });
    assert.equal(typeof result, 'symbol');
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'Réponse HTTP 500 GET /failure (requête request-2)');
  assert.deepEqual(calls[0][1], {
    requestId: 'request-2',
    method: 'GET',
    path: '/failure',
    statusCode: 500
  });
});
