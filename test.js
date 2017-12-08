var fs = require('fs');
var parseString = require('xml2js').parseString;

var domainuser = require("./api/domainuser");
var domainconnect = require("./api/domainconnect");
var domainoperations = require("./api/domainoperations");
var xmlfile = require('./api/xmlfile.js');

var a = new domainuser.DomainUser("iesemilidarder.com", 1, "Pep", 
    "Guardiola Sanç", "Guardiola", "Sanç", "", false, true, true, false, ["eso1","eso2"]);

console.log(a);
console.log(a.toString());
console.log(a.email());
console.log(a.user());
console.log(a.groupswithprefix());
console.log(a.groupswithprefixadded());


// Test read user domains
domainconnect.getDomainInformation("iesemilidarder.com", function(domainusers) {
    // Test read xml file
    content = fs.readFileSync('exportacioDadesCentre.xml');
    parseString(content, function (err, result) {
        xmlusers = xmlfile.readXmlFile(result, "iesemilidarder.com");

        var d = domainoperations.deleteDomainUsers(xmlusers, domainusers, false);
        console.log(d + " users will be suspended");
        var counters = domainoperations.addDomainUsers(xmlusers, domainusers, false);
        console.log(counters.created + " users will be created");
        console.log(counters.activated + " users will be activated");
        console.log(counters.groupsmodified + " users will change their group membership");
    });
});
