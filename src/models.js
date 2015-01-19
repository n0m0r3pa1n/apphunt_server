var Mongoose = require('mongoose')
var Schema = Mongoose.Schema
var Co = require('co')
Timestamps = require('mongoose-timestamp')

Mongoose.plugin(function(schema) {

    schema.statics.findOneOrCreate = function findOneOrCreate(condition, doc) {
        var wrapper = Co.wrap(function* (self, condition, doc) {
            console.log("FindOne");
            var foundDoc = yield self.findOne(condition).exec();
            console.log("Doc:" + foundDoc)
            if (foundDoc) {
                return foundDoc
            } else {
                return yield self.create(doc)
            }
        })

        var self = this
        return wrapper(self, condition, doc)
    };
});

var userSchema = new Schema(
    {
        advertisingId: {type: String, index: true}
    }
)

var clientSchema = new Schema(
    {
        username: String,
        password: String,
        appSpiceId: {type: String, index: true},
        spiceCoins: Number
    }
)

var eventSchema = new Schema(
    {
        name: String,
        data: Schema.Types.Mixed
    }
)

userSchema.plugin(Timestamps)
clientSchema.plugin(Timestamps)
eventSchema.plugin(Timestamps)

module.exports.User = Mongoose.model('User', userSchema)
module.exports.Client = Mongoose.model('Client', clientSchema)
module.exports.Event = Mongoose.model('Event', eventSchema)

