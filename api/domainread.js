var domainauth = require('./domainauth');
var domainuser = require('./domainuser');

function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
    end = new Date().getTime();
 }
}

function getDomainMembers(service, auth, domain, domaingroups, group, callback) {
  var groupname = group.email.replace("@"+domain, "");
  console.log('Loading domain members of "'+groupname+'" group...')
  var membersgroup = [];

  service.members.list({
    auth: auth,
    groupKey: group.id,
    maxResults: 100000
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    if (response.members) {
      var members = response.members;
      for (var i = 0; i < members.length; i++) {
        var member = members[i];
        membersgroup.push(member.email);
      }
    }

    domaingroups[groupname] = membersgroup;
    callback();
  });
}

function getDomainGroups(service, auth, domain, callback) {
  console.log('Loading domain groups...');
  var domaingroups = {};

  service.groups.list({
    auth: auth,
    customer: 'my_customer',
    maxResults: 100000
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    var groups = response.groups;
    var membersok = 0;
    for (var i = 0; i < groups.length; i++) {
      // We read the members of this group
      var group = groups[i];

      // Carregam nomes grups de alumnat, equip educatiu i tutors
      if (group.email.startsWith("alumnat.") || group.email.startsWith("ee.") || group.email.startsWith("tutors")) {
        // We read the members of this group
        getDomainMembers(service, auth, domain, domaingroups, group, function() {
          membersok++;
          if (membersok>=groups.length) {
            callback(domaingroups);
          }
        });
      } else {
        membersok++;
      }
    }
  });
}

function getAllDomainUsers(service, auth, users, nextPageToken, callback) {
  if (!users) {
    users = [];
  }

  service.users.list({
    auth: auth,
    customer: 'my_customer',
    maxResults: 500,
    pageToken: nextPageToken,
    orderBy: 'email'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    users = users.concat(response.users);
    if (response.nextPageToken) {
      getAllDomainUsers(service, auth, users, response.nextPageToken, callback);
    } else {
      callback(users);
    }
  });
}
  
function getDomainUsers(service, auth, domain, callback) {
  var domainusers = {};

  getDomainGroups(service, auth, domain, function(domaingroups) {
    console.log('Loading domain users...');
  
    getAllDomainUsers(service, auth, null, null, function(users) {  
     
      var userWithoutCode = 0;
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        
        var id;
        var withoutcode = false;
        if (user.externalIds && user.externalIds[0].value) {
          id = user.externalIds[0].value;
        } else {
          userWithoutCode++;
          id = "WITHOUTCODE"+userWithoutCode;
          withoutcode = true;
        }
               
        var member = [];                // Afegim tots els grups del que és membre
        for (groupname in domaingroups) {
          for (var j = 0; j<domaingroups[groupname].length; j++) {
            if (user.primaryEmail==domaingroups[groupname][j]) {
              member.push(groupname);
            }
          }
        }
        var istutor = (member.indexOf("tutors")>=0);  // Comprovam si és tutor
  
        domainusers[id] = new domainuser.DomainUser(
          domain, 
          id,
          user.name.givenName, 
          user.name.familyName,
          null,               // surname 1
          null,               // surname 2
          user.primaryEmail,  // domainemail
          user.suspended,     // suspended
          user.orgUnitPath.toLowerCase().indexOf("professor")>=0,  // teacher 
          istutor,            // tutor
          withoutcode,        // withoutcode
          member              // groups
        );
      }
      // Retornam domainusers
      callback(domainusers);
    });
  });
}

function readDomainUsers(domain, callback) {
  domainauth.getDomainAuthorization(function(service, auth) {
    getDomainUsers(service, auth, domain, callback);
  })
}

module.exports = {
  readDomainUsers: readDomainUsers
}