#!/usr/bin/env bash
#
#
# Script to import apphunt server db to localhost
#
echo "Importing DB to localhost"
mongodump -h ds031531.mongolab.com:31531 -d heroku_app33343837 -u NaughtySpirit -p fmi123 -o ~/Desktop
mongorestore -h localhost:27017 -d apphunt ~/Desktop/heroku_app33343837
rm -r ~/Desktop/heroku_app33343837
echo "Finished"
exit 0