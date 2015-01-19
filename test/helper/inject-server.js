global.Server = require('../../src')
Server.register(require('inject-then'), function (err) {
  if (err) throw err;
});
