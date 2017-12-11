var fs = require('fs');
var parseString = require('xml2js').parseString;

var domainuser = require("./api/domainuser");
var domainread = require("./api/domainread");
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
domainread.readDomainUsers("iesemilidarder.com", function(domainusers) {
    // Test read xml file
    content = fs.readFileSync('exportacioDadesCentre.xml');
    parseString(content, function (err, result) {
        xmlusers = xmlfile.readXmlFile(result, "iesemilidarder.com");

        domainoperations.applyDomainChanges(xmlusers, domainusers, "iesemilidarder.com", false, function(counters) {
            console.log(counters.deleted + " users will be suspended");
            console.log(counters.created + " users will be created");
            console.log(counters.activated + " users will be activated");
            console.log(counters.groupsmodified + " users will change their group membership");
        });
    });
});
