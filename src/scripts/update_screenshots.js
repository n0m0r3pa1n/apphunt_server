var Mongoose = require('mongoose')
//var dbURI = 'mongodb://localhost/apphunt'
// Dev DB URI
//var dbURI = 'mongodb://NaSp:fmi123@ds031877.mongolab.com:31877/heroku_948fv92g'
// Prod DB URI
var dbURI = 'mongodb://NaughtySpirit:fmi123@ds031531.mongolab.com:31531/heroku_app33343837'

Mongoose.connect(dbURI)

var Co = require('co')
var App = require('../models').App
var DevsHunter = require('../handlers/utils/devs_hunter_handler')

Co(function* () {
    let apps = yield App.find({$or: [{screenshots: []}, {screenshots: undefined}]}).exec()
    let size = apps.length
    console.log("Updating " + apps.length)
    let i = 0
    for(let app of apps) {
        i++;
        let parsedApp = yield DevsHunter.getAndroidApp(app.package)
        if(parsedApp == null) {
            console.log("Null " + i)
            continue;
        }
        console.log("Update " + i + " of " + size)
        app.screenshots = parsedApp.screenshots
        yield app.save()
    }
})
