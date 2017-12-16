#!/usr/bin/env node

/** app.js  */

var express = require('express');
var path = require('path');
var fileUpload = require('express-fileupload');
var parseString = require('xml2js').parseString;

var xmlfile = require('./api/xmlfile.js');
var domainread = require('./api/domainread.js');
var domainoperations = require("./api/domainoperations");

var app = express();
app.use(fileUpload());

const HTDOCS_FOLDER = 'public';

// Define the port to run on
app.set('port', process.env.PORT || 9000);

// Add middleware to console log every request
app.use(function(req, res, next) {
  if (req.url.toLowerCase().endsWith(".html")) {
    console.log(req.method, req.url);
  }
  next(); 
});

// Set static directory before defining routes
app.use(express.static(path.join(__dirname, HTDOCS_FOLDER)));

app.post('/importgestib', function(req, res) {
  console.log("Received the XML file to import");
  if (!req.files.xmlfile)
    return res.status(400).send('No files were uploaded.');

  // Read XML file
  parseString(req.files.xmlfile.data, function (err, result) {
    xmlusers = xmlfile.readXmlFile(result, req.body.domain);

    // Read domain users
    domainread.readDomainUsers(req.body.domain, function(domainusers) {
        
        // Apply domain changes
        domainoperations.applyDomainChanges(xmlusers, domainusers, req.body.domain, req.body.apply, function(counters) {
            console.log(counters.deleted + " users will be suspended");
            console.log(counters.created + " users will be created");
            console.log(counters.activated + " users will be activated");
            console.log(counters.groupsmodified + " users will change their group membership");
    
            res
                .status(200)
                .send("<h1>GestIB to Google</h1>"+
                    "<h2>Changes</h2>"+
                    counters.deleted + " users will be suspended"+"<br>"+
                    counters.created + " users will be created"+"<br>"+
                    counters.activated + " users will be activated"+"<br>"+
                    counters.groupsmodified + " users will change their group membership"+"<br>");
        });


    });

  });
});

// Add some routing
app.get('/json', function(req, res) {
  console.log("GET the json");
  res
    .status(200)
    .json( {"jsonData" : true} );
});

app.get('/file', function(req, res) {
  console.log("GET the file");
  res
    .status(200)
    .sendFile(path.join(__dirname, 'app.js'));
});

// Listen for requests
var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log('Server running on port ' + port);
  console.log('Press CTRL+C to stop');
});
