echo "Importing dev DB to localhost"
mongodump -h ds031877.mongolab.com:31877 -d heroku_948fv92g -u NaSp -p fmi123 -o ~/Desktop
mongorestore -h localhost:27017 -d apphunt ~/Desktop/heroku_948fv92g
rm -r ~/Desktop/heroku_948fv92g
echo "Finished"
exit 0