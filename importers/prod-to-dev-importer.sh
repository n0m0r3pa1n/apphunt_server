echo "Importing production DB to dev"
mongodump -h ds031531.mongolab.com:31531 -d heroku_app33343837 -u NaughtySpirit -p fmi123 -o ~/Desktop
mongo ds031877.mongolab.com:31877/heroku_948fv92g -u NaSp -p fmi123 -eval "db.dropDatabase()"
mongorestore -h ds031877.mongolab.com:31877 -d heroku_948fv92g -u NaSp -p fmi123 ~/Desktop/heroku_app33343837
rm -r ~/Desktop/heroku_app33343837
echo "Finished"
exit 0