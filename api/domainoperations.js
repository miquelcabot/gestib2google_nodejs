var domainauth = require('./domainauth');

function deleteDomainUsers(service, auth, xmlusers, domainusers, apply) {
    var cont = 0;
    console.log("Deleting domain users...")
    for (user in domainusers) {     // For every domain user
        if (!domainusers[user].suspended && !domainusers[user].withoutcode) {
            if (!(user in xmlusers)) {  // It doesn't exists in XML file
                console.log("SUSPEND --> "+domainusers[user]);
                cont++;
                if (apply) {
                    // Suspend domain user
                    // TODO: ...
                }
            }
        }
    }
    return cont;
}

function addDomainUsers(service, auth, xmlusers, domainusers, apply) {
    var contc = 0;
    var conta = 0;
    var contg = 0;
    console.log("Adding domain users...")
    for (user in xmlusers) {     // For every XML user
        if (!(user in domainusers)) {  // It doesn't exists in domain
            console.log("CREATE --> "+xmlusers[user]);
            contc++;
            if (apply) {
                // Suspend domain user
                // TODO: ...
            }
        } else if (domainusers[user].suspended) {
            console.log("ACTIVATE --> "+xmlusers[user]);
            conta++;
            if (apply) {
                // Suspend domain user
                // TODO: ...
            }
        }
    }
    return {
        created: contc,
        activated: conta,
        groupsmodified: contg
    }
}

function applyDomainChanges(xmlusers, domainusers, apply, callback) {
    domainauth.getDomainAuthorization(function(service, auth) {
        var contd = deleteDomainUsers(service, auth, xmlusers, domainusers, apply);
        var cont = addDomainUsers(service, auth, xmlusers, domainusers, apply);
        callback({
            deleted: contd, 
            created: cont.created, 
            activated: cont.activated, 
            groupsmodified: cont.groupsmodified
        });
    });
}

module.exports = {
    applyDomainChanges: applyDomainChanges
}