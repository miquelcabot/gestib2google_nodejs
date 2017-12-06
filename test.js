var domainuser = require("./domainuser");
var googleconnect = require("./googleconnect");
var fs = require('fs');
var parseString = require('xml2js').parseString;
var readxmlfile = require('./readxmlfile.js');

var a = new domainuser.DomainUser("iesemilidarder.com", 1, "Pep", 
    "Guardiola Sanç", "Guardiola", "Sanç", "", false, true, true, ["eso1","eso2"]);

console.log(a);
console.log(a.toString());
console.log(a.email());
console.log(a.user());
console.log(a.groupswithprefix());
console.log(a.groupswithprefixadded());



//googleconnect.getDomainUsers("iesemilidarder.com");

// Test read xml file
content = fs.readFileSync('exportacioDadesCentre.xml');
parseString(content, function (err, result) {
  xmlusers = readxmlfile.readXmlFile(result, "iesemilidarder.com");
  console.log(xmlusers);
});
