var dbUri = 'mongodb://localhost/appspice'
var clearDB = require('mocha-mongoose')(dbUri);

afterEach(function (done) {
    clearDB(function(err) {
        done()
    })
})

