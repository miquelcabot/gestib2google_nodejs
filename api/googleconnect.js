var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var domainuser = require('./domainuser');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/admin-directory_v1-nodejs.json
var SCOPES = [
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.orgunit'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'admin-directory_v1-nodejs.json';

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {String} domain The name of the Google domain.
 * @param {function} callback The callback to call with the authorized client.
 */
function getDomainInformation(domain, callback) {
  // Load client secrets from a local file.
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Directory API.
    var credentials = JSON.parse(content);
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        getNewToken(oauth2Client, domain, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        getDomainUsers(oauth2Client, domain, callback);
      }
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized.
 * @param {String} domain The name of the Google domain.
 *     client.
 */
function getNewToken(oauth2Client, domain, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      getDomainUsers(oauth2Client, domain, callback);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function getDomainMembers(service, auth, domain, domaingroups, group, callback) {
  var groupname = group.email.replace("@"+domain, "");
  console.log('Loading members of "'+groupname+'" group...')
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
    for (var i = 0; i < groups.length-10; i++) {
      // We read the members of this group
      var group = groups[i];

      // We read the members of this group
      getDomainMembers(service, auth, domain, domaingroups, group, function() {
        membersok++;
        console.log(membersok+" of "+groups.length+" groups loaded");
        if (membersok>=groups.length-10) {
          callback(domaingroups);
        }
      });
    }
  });
}

function getDomainUsers(auth, domain, callback) {
  var service = google.admin('directory_v1');
  
  var domainusers = {};

  getDomainGroups(service, auth, domain, function(domaingroups) {
    console.log('Loading domain users...');

    service.users.list({
      auth: auth,
      customer: 'my_customer',
      maxResults: 500,
      orderBy: 'email'
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
  
      var userWithoutCode = 0;
      var users = response.users;
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
  
        var id;
        if (user.externalIds) {
          id = user.externalIds[0].value;
        } else {
          id = "WITHOUTCODE"+userWithoutCode;
        }
               
        var istutor = ("tutors" in domaingroups);  // Comprovam si és tutor
        var member = [];                // Afegim tots els grups del que és membre
        for (groupname in domaingroups) {         
          for (var j = 0; j<domaingroups[groupname].length; j++) {
            if (user.primaryEmail==domaingroups[groupname][j]) {
              member.push(groupname);
            }
          }
        }
  
        domainusers[i] = new domainuser.DomainUser(
          domain, 
          id,
          user.name.givenName, 
          user.name.familyName,
          null,               // surname 1
          null,               // surname 2
          user.primaryEmail,  // domainemail
          user.suspended,     // suspended
          user.orgUnitPath.toLowerCase().indexOf("professor")>=0,  // teacher 
          istutor,            // tutor  TODO: comprovar si és tutor
          member              // groups
        );
      }
      // Retornam domainusers
      callback(domainusers);
    });
  });
 
}

module.exports = {
  getDomainInformation: getDomainInformation
}