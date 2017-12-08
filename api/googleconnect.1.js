var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var domainuser = require('./domainuser');
var async = require("async");

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
 * Get the authorization client credentials.
 */
function getCredentials() {
  // Load client secrets from a local file.
  try {
    content = fs.readFileSync('client_secret.json');
    return JSON.parse(content);
  } catch(err) {
    console.log('Error loading client secret file: ' + err);
    throw err;
  }
}

/**
 * Create an OAuth2 client with the given credentials
 */
function authorize() {
  var credentials = getCredentials();

  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];

  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  try {
    token = fs.readFileSync(TOKEN_PATH);
    oauth2Client.credentials = JSON.parse(token);
    return oauth2Client;
  } catch (err) {
    newoauth2Client = getNewToken(oauth2Client);
    return newoauth2Client;
  }
}

/**
 * Get and store new token after prompting for user authorization
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 */
function getNewToken(oauth2Client) {
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
      return oauth2Client;
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

/**
 * Lists the first 10 users in the domain.
 */
function listUsers() {
  var service = google.admin('directory_v1');
  var auth = authorize();

  service.users.list({
    auth: auth,
    customer: 'my_customer',
    maxResults: 10,
    orderBy: 'email'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var users = response.users;
    if (users.length == 0) {
      console.log('No users in the domain.');
    } else {
      console.log('Users:');
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        console.log('%s (%s)', user.primaryEmail, user.name.fullName);
      }
    }
  });
}

function getDomainMembers(service, auth, domain, group) {

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
  });
  return membersgroup;
}

function getDomainGroups(service, auth, domain) {
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
    for (var i = 0; i < groups.length; i++) {
      // We read the members of this group
      var group = groups[i];
      // We read the members of this group
      var groupname = group.email.replace("@"+domain, "");
      console.log('Loading members of "'+groupname+'" group...');
      domaingroups[groupname] = getDomainMembers(service, auth, domain, group, domaingroups);
    }


/*    var groups = response.groups;
    for (var i = 0; i < groups.length; i++) {
      // We read the members of this group
      var group = groups[i];
      var groupname = group.email.replace("@"+domain, "");
      console.log('Loading members of "'+groupname+'" group...')

      service.members.list({
        auth: auth,
        groupKey: group.id,
        maxResults: 100000
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        var membersgroup = [];
        if (response.members) {
          var members = response.members;
          for (var j = 0; j < members.length; j++) {
            var member = members[j];
            membersgroup.push(member.email);
          }
          domaingroups[groupname] = membersgroup;
        }
      });
    }*/
  });
  return domaingroups;
}

function getDomainUsers(domain) {
  var service = google.admin('directory_v1');

  var auth = authorize();
  
  var domaingroups = getDomainGroups(service, auth, domain);
  console.log("a getDomainUsers : "+domaingroups);
  var domainusers = {};
 /* 
  console.log('Loading domain users...');

  service.users.list({
    auth: auth,
    customer: 'my_customer',
    maxResults: 5,
    orderBy: 'email'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var users = response.users;
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var member = [];
      for (groupname in domaingroups) {
        for (var j = 0; j<domaingroups[groupname].length; j++) {
          if (user.primaryEmail==domaingroups[groupname][j]) {
            member.push(groupname);
          }
        }
      }

      console.log('%s (%s)', user.primaryEmail, user.name.fullName);

      var id = "";*/

     /* domainusers[id] = new domainuser.DomainUser(
        domain, 
        id,
        user.name.givenName, 
        user.name.familyName,
        null,           // surname 1
        null,           // surname 2
        user.primaryEmail,   // domainemail
        user.suspended,          // suspended
        false,          // teacher 
        false,          // tutor
        emailsstudent   // groups
      );*/
  /*  }
  });*/

  return domainusers;
}

module.exports = {
  getDomainUsers: getDomainUsers
}