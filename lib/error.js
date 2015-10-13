'use strict';

module.exports = function KinerjaPayError(options, innerException) {
  var message = options;
  var code = options && options.code && options.code[0] || innerException.code;

  if (options && typeof options === 'object') {
    message = options.message[0];
  }

  var err = new Error('failed to process request:' + message || (innerException && innerException.message));
  err.code = code;
  err.innerException = innerException;

  return err;
};