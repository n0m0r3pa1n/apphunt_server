var Mongoose = require('mongoose')
var Schema = Mongoose.Schema
var Co = require('co')
Timestamps = require('mongoose-timestamp')

Mongoose.plugin(function(schema) {

    schema.statics.findOneOrCreate = function findOneOrCreate(condition, doc) {
        var wrapper = Co.wrap(function* (self, condition, doc) {
            var foundDoc = yield self.findOne(condition).exec();
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
        name: String,
        email: {type: String, index: true, unique: true},
        profilePicture: String,
        advertisingId: { type: String, unique: true },
        loginType: String
    }
)


var appCategorySchema = new Schema(
    {
        name: {type: String, unique: true}
    }
)

var platforms = ["Android", "iOS"]

var appSchema = new Schema(
    {
        name: String,
        icon: String,
        url: String,
        shortUrl: String,
        description: String,
        package: {type: String, unique: true},
        createdBy: {type: Schema.Types.ObjectId, ref: 'User'},
        votes: [{type: Schema.Types.ObjectId, ref: 'Vote'}],
        categories: [{type: Schema.Types.ObjectId, ref: 'AppCategory'}],
        isFree: {type: Boolean, default: true},
        platform: {type: String, enum: platforms, default: platforms[0]}
    }
)

var voteSchema = new Schema(
    {
        user: {type: Schema.Types.ObjectId, ref: 'User'}
    }
)

appSchema.methods.getVotesCount = function () {
    return this.votes.count();
}

var notificationSchema = new Schema(
    {
        type: String,
        sendTime: Date,
        message: String
    }
)

var deviceSchema = new Schema({
    notificationsEnabled: { type:Boolean, default: true}
})

userSchema.plugin(Timestamps)
appSchema.plugin(Timestamps)
voteSchema.plugin(Timestamps)
notificationSchema.plugin(Timestamps)
appCategorySchema.plugin(Timestamps)

module.exports.User = Mongoose.model('User', userSchema)
module.exports.App = Mongoose.model('App', appSchema)
module.exports.Vote = Mongoose.model('Vote', voteSchema)
module.exports.Notification = Mongoose.model('Notification', notificationSchema)
module.exports.AppCategory = Mongoose.model('AppCategory', appCategorySchema)


