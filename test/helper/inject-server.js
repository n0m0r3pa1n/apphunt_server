global.Server = require('../../build')
Server.register(require('inject-then'), function (err) {
  if (err) throw err;
});
