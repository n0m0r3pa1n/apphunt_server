var LATEST_APP_VERSION = require('../build/config/config').LATEST_APP_VERSION
describe("Version", function () {

    it("should get Android app latest version", function*() {
        var opts = {
            method: "GET",
            url: '/v1/app/version'
        }

        var result = (yield Server.injectThen(opts)).result
        result.versionCode.should.eq(LATEST_APP_VERSION)
    });
});