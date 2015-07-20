var Mongoose = require('mongoose')
var dbURI = 'mongodb://localhost/apphunt'

Mongoose.connect(dbURI)

var Co = require('co')
var App = require('../models').App
var DevsHunter = require('../handlers/utils/devs_hunter_handler')

Co(function* () {
    let apps = yield App.find({$or: [{screenshots: []}, {screenshots: undefined}]}).exec()
    for(let app of apps) {
        let parsedApp = yield DevsHunter.getAndroidApp(app.package)
        if(parsedApp == null) {
            continue;
        }
        app.screenshots = parsedApp.screenshots
        yield app.save()
    }
})
