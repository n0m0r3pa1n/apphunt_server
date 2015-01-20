var email = "dummy@dummy.com"

function createAppWithMail(email) {
    var title = "Example App";
    var icon = "http://example.com/icon.png";
    var url = "http://example.com";
    var package = "com.example.test";


    var opts = {
        method: 'POST',
        url: '/apps',
        payload: {
            title: title,
            icon: icon,
            url: url,
            package: package,
            email: email
        }
    }

    return Server.injectThen(opts)
}

function createApp() {
    return createAppWithMail(email)
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

module.exports.createAppWithMail = createAppWithMail
module.exports.createApp = createApp
module.exports.createUser = createUser
module.exports.getUsers = getUsers
