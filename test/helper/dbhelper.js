var email = "dummy@dummy.com"

function createApp(userId) {
    var name = "Example App";
    var icon = "http://example.com/icon.png";
    var url = "http://example.com";
    var package = "com.example.test";


    var opts = {
        method: 'POST',
        url: '/apps',
        payload: {
            name: name,
            icon: icon,
            url: url,
            package: package,
            userId: userId
        }
    }

    return Server.injectThen(opts)
}

function createUser() {
    var name = "dummy"

    var opts = {
        method: 'POST',
        url: '/users',
        payload: {
            name: name,
            email: email
        }
    }

    return Server.injectThen(opts)
}

function getUsers() {
    var opts = {
        method: 'GET',
        url: '/users'
    }

    return Server.injectThen(opts)
}

module.exports.createApp = createApp
module.exports.createUser = createUser
module.exports.getUsers = getUsers
module.exports.EMAIL = email
