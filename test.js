var domainuser = require("./domainuser");
var googleconnect = require("./googleconnect");

var a = new domainuser.DomainUser("iesemilidarder.com", 1, "Pep", 
    "Guardiola Sanç", "Guardiola", "Sanç", "", false, true, ["eso1","eso2"]);

console.log(a);
console.log(a.toString());
console.log(a.email());
console.log(a.user());
console.log(a.groupswithprefix());
console.log(a.groupswithprefixadded());


googleconnect.getDomainUsers("iesemilidarder.com");