# What is this about?

This is the server behind the AppHunt idea and [mobile app](https://play.google.com/store/apps/details?id=com.apphunt.app).
It can:

* Issue tokens
* Receive apps
* Edit/Delete/Reject/Approve apps
* Create user/app collections
* Search apps
* Mark events which happen on different user actions
* Send notifications to users
* Allow user login with different login types
* Make a dynamic top hunters ranking with data from Flurry and server
* Get different stats for users
* Websocket implementation allows users to receive events in real time
* Many many more...

# Technologies and Languages

NodeJS is the base. We use HapiJS as the REST library. Socket.IO for websockets. ES6 with Gulp-Babel to transform ES6 to ES5. Generators with the Co library to make yield statements on Promises and not having to work with then().

How to install
==============

Go to the project dir and run

    npm install
    
How to run
==========

    node --harmony
    
Development
==========

Run tests

    ./run_tests.sh

Do some changes 
Commit and push
