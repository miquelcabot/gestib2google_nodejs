var express = require('express');
var path = require('path');
var fileUpload = require('express-fileupload');

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
  console.log(req.xmlfile)
  console.log(req.files)
  console.log(req.files.xmlfile)
  if (!req.files)
    return res.status(400).send('No files were uploaded.');
 
  console.log("A");
  // The name of the input field (i.e. "file") is used to retrieve the uploaded file
  var xmlfile = req.files.xmlfile;
 
  console.log(xmlfile);
  // Use the mv() method to place the file somewhere on your server
  /*sampleFile.mv('/somewhere/on/your/server/filename.jpg', function(err) {
    if (err)
      return res.status(500).send(err);
 
    res.send('File uploaded!');
  });*/
  res.send(xmlfile);
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