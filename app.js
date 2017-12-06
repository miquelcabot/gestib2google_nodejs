var express = require('express');
var path = require('path');
var fileUpload = require('express-fileupload');
var parseString = require('xml2js').parseString;

var readxmlfile = require('./api/readxmlfile.js');

var app = express();
app.use(fileUpload());

const HTDOCS_FOLDER = 'public';

// Define the port to run on
app.set('port', process.env.PORT || 8080);

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
  
  var xmlfile = req.files.xmlfile;

  parseString(xmlfile.data, function (err, result) {
    xmlusers = readxmlfile.readXmlFile(result, req.body.domain);
    res
      .status(200)
      .send(xmlusers);
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
