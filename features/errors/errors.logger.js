'use strict';

const logServerError = (request, response) => {
  const statusCode = response?.statusCode ?? response?.output?.statusCode;

  if (!Number.isInteger(statusCode) || statusCode < 500) {
    return;
  }

  const context = {
    requestId: request.info.id,
    method: request.method.toUpperCase(),
    path: request.path,
    statusCode
  };

  if (response.isBoom) {
    const errorCode = response.code ? ` [${response.code}]` : '';
    console.error(
      `Erreur HTTP ${statusCode} ${context.method} ${context.path} (requête ${context.requestId})${errorCode}: ${response.message}`,
      response
    );
    return;
  }

  console.error(`Réponse HTTP ${statusCode} ${context.method} ${context.path} (requête ${context.requestId})`, context);
};

const registerErrorLogging = (server) => {
  server.ext('onPreResponse', (request, h) => {
    logServerError(request, request.response);
    return h.continue;
  });
};

module.exports = { registerErrorLogging };
