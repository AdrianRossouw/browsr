#!/bin/sh
DB="http://127.0.0.1:9200/pvt2"
RIVER="http://127.0.0.1:9200/_river/pvt2"
curl -s -XDELETE $RIVER >> /dev/null
curl -s -XDELETE $DB >> /dev/null
curl -s -XPUT -d @mapping.json $DB
curl -s -XPUT -d @river.json $RIVER/_meta
