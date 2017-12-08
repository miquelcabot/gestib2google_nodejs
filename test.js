var fs = require('fs');
var parseString = require('xml2js').parseString;

var domainuser = require("./api/domainuser");
var googleconnect = require("./api/googleconnect");
var readxmlfile = require('./api/readxmlfile.js');

var a = new domainuser.DomainUser("iesemilidarder.com", 1, "Pep", 
    "Guardiola Sanç", "Guardiola", "Sanç", "", false, true, true, ["eso1","eso2"]);

console.log(a);
console.log(a.toString());
console.log(a.email());
console.log(a.user());
console.log(a.groupswithprefix());
console.log(a.groupswithprefixadded());

// Test read xml file
content = fs.readFileSync('exportacioDadesCentre.xml');
parseString(content, function (err, result) {
  xmlusers = readxmlfile.readXmlFile(result, "iesemilidarder.com");
  console.log(xmlusers);
});

googleconnect.getDomainInformation("iesemilidarder.com", function(domainusers) {
  for (user in domainusers) {
    console.log(domainusers[user].toString());
  }
});
