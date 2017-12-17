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
            var creationstr = req.body.apply?" have been ":" will be ";
            console.log(counters.deleted + " users"+creationstr+"suspended");
            console.log(counters.created + " users"+creationstr+"created");
            console.log(counters.activated + " users"+creationstr+"activated");
            console.log(counters.groupsmodified + " users"+creationstr+"changed of their group membership");
    
            res
                .status(200)
                .send("<h1>GestIB to Google</h1>"+
                    "<h2>Changes</h2>"+
                    counters.deleted + " users"+creationstr+"suspended"+"<br>"+
                    counters.created + " users"+creationstr+"created"+"<br>"+
                    counters.activated + " users"+creationstr+"activated"+"<br>"+
                    counters.groupsmodified + " users"+creationstr+"changed of their group membership"+"<br>");
        });
    });
  });
});

// Add some routing
app.get('/usersgestib', function(req, res) {
  console.log("GET the users json");
  // Read domain users
  domainread.readDomainUsers("iesemilidarder.com", function(domainusers) {
    var jsonreturn = {
      users: []
    };
    for (u in domainusers) {
      if (!domainusers[u].suspended && !domainusers[u].withoutcode) {
        jsonreturn.users.push({
          surname: domainusers[u].surname,
          name: domainusers[u].name,
          email: domainusers[u].email(),
          type: domainusers[u].teacher?"TEACHER":"STUDENT",
          groups: domainusers[u].groupswithprefixsimple().join(", "),
        });
      }
    }

    res
      .status(200)
      .json( jsonreturn );
  });   
});

// Listen for requests
var server = app.listen(app.get('port'), function() {
  var port = server.address().port;
  console.log('Server running on port ' + port);
  console.log('Press CTRL+C to stop');
});
