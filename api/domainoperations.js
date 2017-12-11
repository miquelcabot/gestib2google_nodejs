var domainauth = require('./domainauth');
var domainuser = require("./domainuser");

function deleteDomainUsers(service, auth, xmlusers, domainusers, apply) {
    var cont = 0;
    console.log("Deleting domain users...")
    for (user in domainusers) {     // For every domain user
        var domain_user = domainusers[user];
        if (!domain_user.suspended && !domain_user.withoutcode) {
            if (!(user in xmlusers)) {  // It doesn't exists in XML file
                console.log("SUSPEND --> "+domain_user.toString());
                cont++;
                if (apply) {
                    // Suspend domain user
                    service.users.update({
                        userKey: domain_user.email, 
                        body: {suspended: true}
                    }, function(err, response) {
                        if (err) {
                            console.log('The API returned an error: ' + err);
                            return;
                        }
                    });
                    // Remove from all groups
                    groupswithdomain = domain_user.groupswithdomain();
                    for (i in groupswithdomain) {
                        service.members.delete({
                            groupKey: groupswithdomain[i], 
                            memberKey: domain_user.email
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

function addDomainUsers(service, auth, xmlusers, domainusers, domain, apply) {
    var contc = 0;
    var conta = 0;
    var contg = 0;
    console.log("Adding domain users...")
    for (user in xmlusers) {     // For every XML user
        var xmluser = xmlusers[user];
        if (!(user in domainusers)) {  // It doesn't exists in domain
            // Email pot ser repetit, comprovar-ho!!
            if (!xmluser.teacher) {
                for (d_user in domainusers) {
                    // Si hi ha un usuari del domini amb les 3 primeres lletres iguals
                    if (domainusers[d_user].email().startsWith(xmluser.email().substring(0,3))) {
                        var n_email_dom = parseInt(domainusers[d_user].email().substring(3,5));
                        var n_email_xml = parseInt(xmluser.email().substring(3,5));
                        if (n_email_dom>=n_email_xml) {
                            var n_email = n_email_dom+1;
                            xmluser.domainemail = xmluser.email().substring(0,3)+domainuser.pad(n_email,2)+"@"+domain;
                        }
                    }
                }
            }
            // Afegim l'usuari que cream al diccionari de usuaris del domini
            domainusers[xmluser.id] = new domainuser.DomainUser(
                domain, 
                xmluser.id,
                xmluser.name, 
                xmluser.surname1, 
                xmluser.surname2,
                xmluser.surname,
                xmluser.email(), // domainemail
                xmluser.suspended,   // suspended
                xmluser.teacher,     // teacher 
                xmluser.tutor,       // tutor
                xmluser.withoutcode, // withoutcode
                xmluser.groups       // groups
            );

            console.log("CREATE --> "+xmluser.toString());
            contc++;
            if (apply) {
                // Create domain user
                // https://developers.google.com/admin-sdk/reseller/v1/codelab/end-to-end
                service.users.insert({
                    primaryEmail: xmluser.email(), 
                    body = { 
                        primaryEmail: xmluser.email(), 
                        name: { givenName: xmluser.name, familyName: xmluser.surname }, 
                        orgUnitPath: (xmluser.teacher?'/Professorat':'/Alumnat'),
                        externalIds: [{ type: 'organization', value: xmluser.id }], 
                        suspended: false,
                        changePasswordAtNextLogin: true,
                        password: "12345678"}   //Default password
                }, function(err, response) {
                    if (err) {
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                });
/*
                

                    # Insert all "ee." or "alumnat." groups
                    for gr in value.setprefixtogroups:
                        # https://developers.google.com/admin-sdk/directory/v1/reference/members/insert
                        service.members().insert(
                                groupKey = gr+GOOGLE_DOMAIN,
                                body = {'email': value.email}
                            ).execute()
                    # TODO Insert "tutors" group
                except:
                    print("Error creating user")
*/
            }
        } else {
            var domain_user = domainusers[user];
            if (domain_user.suspended) {
                console.log("ACTIVATE --> "+xmluser.toString());
                conta++;
                if (apply) {
                    // Suspend domain user
                    service.users.update({
                        userKey: domain_user.email, 
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
                function(x) {return domain_user.groupswithprefix().indexOf(x) < 0 });
            var deletegroups = domain_user.groupswithprefix().filter(
                function(x) {return xmluser.groupswithprefixadded().indexOf(x) < 0 });
            if (((creategroups.length>0) || (deletegroups.length>0))
                        && (!domain_user.suspended)) {
                console.log("CREATE GROUPS --> "+domain_user.surname+", "+domain_user.name+
                    " ("+domain_user.email()+") ["+creategroups+"]");
                contg++;
                if (apply) {
                    // Actualitzam els grups de l'usuari
    /*
                for gr in creategroups:
                    # https://developers.google.com/admin-sdk/directory/v1/reference/members/insert
                    service.members().insert(
                            groupKey = gr+GOOGLE_DOMAIN,
                            body = {'email': domain_user.email}
                        ).execute()
                for gr in deletegroups:
                    # https://developers.google.com/admin-sdk/directory/v1/reference/members/delete
                    service.members().delete(
                            groupKey = gr+GOOGLE_DOMAIN,
                            memberKey = domain_user.email
                        ).execute()
    */
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

function applyDomainChanges(xmlusers, domainusers, domain, apply, callback) {
    domainauth.getDomainAuthorization(function(service, auth) {
        var contd = deleteDomainUsers(service, auth, xmlusers, domainusers, apply);
        var cont = addDomainUsers(service, auth, xmlusers, domainusers, domain, apply);
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