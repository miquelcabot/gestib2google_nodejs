var domainauth = require('./domainauth');

function deleteDomainUsers(service, auth, xmlusers, domainusers, apply) {
    var cont = 0;
    console.log("Deleting domain users...")
    for (user in domainusers) {     // For every domain user
        var domainuser = domainusers[user];
        if (!domainuser.suspended && !domainuser.withoutcode) {
            if (!(user in xmlusers)) {  // It doesn't exists in XML file
                console.log("SUSPEND --> "+domainuser.toString());
                cont++;
                if (apply) {
                    // Suspend domain user
                    service.users.update({
                        userKey: domainuser.email, 
                        body: {suspended: true}
                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                    });
                    // Remove from all groups
                    groupswithdomain = domainuser.groupswithdomain();
                    for (var i = 0; i < groupswithdomain.length; i++) {
                        service.members.delete({
                            groupKey: groupswithdomain[i], 
                            memberKey: domainuser.email
                        }, function(err, response) {
                            if (err) {
                                console.log('The API returned an error: ' + err);
                                return;
                            }
                        });
                    }
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
        var xmluser = xmlusers[user];
        if (!(user in domainusers)) {  // It doesn't exists in domain
            // Email pot ser repetit, comprovar-ho!!



            // Afegim l'usuari que cream al diccionari de usuaris del domini




            console.log("CREATE --> "+xmluser.toString());
            contc++;
            if (apply) {
                // Create domain user
                // https://developers.google.com/admin-sdk/reseller/v1/codelab/end-to-end



            }
        } else {
            var domainuser = domainusers[user];
            if (domainuser.suspended) {
                console.log("ACTIVATE --> "+xmluser.toString());
                conta++;
                if (apply) {
                    // Suspend domain user
                    service.users.update({
                        userKey: domainuser.email, 
                        body: {suspended: true}
                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                    });
                }
            }
            // Tant si estava actiu com no, existeix, i per tant, actualitzar 
            // els grups "ee.", "alumnat." i  "tutors"
            // TODO: Insert and delete "tutors" group
            var creategroups = xmluser.groupswithprefixadded().filter(
                function(x) {return domainuser.groupswithprefix().indexOf(x) < 0 });
            var deletegroups = domainuser.groupswithprefix().filter(
                function(x) {return xmluser.groupswithprefixadded().indexOf(x) < 0 });
            if (((creategroups.length>0) || (deletegroups.length>0))
                        && (!domainuser.suspended)) {
                console.log("CREATE GROUPS --> "+domainuser.surname+", "+domainuser.name+
                    " ("+domainuser.email()+") ["+creategroups+"]");
                contg++;
                if (apply) {
                    // Actualitzam els grups de l'usuari
    
    
    
                }
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