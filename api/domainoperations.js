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

/*
            if not value.teacher:
                n = 0
                emailrepeated = True
                while emailrepeated:
                    for dkey, dvalue in domainusers.items():
                        if (dvalue.email[0:3] == value.email[0:3]):
                            if (dvalue.email[3:5].isdigit()):
                                if int(dvalue.email[3:5]) >= int(value.email[3:5]):
                                    n = int(dvalue.email[3:5])+1
                                    value.email = value.email[:3]+'{:02d}'.format(n)+GOOGLE_DOMAIN
                        else:
                            emailrepeated = False
*/

            // Afegim l'usuari que cream al diccionari de usuaris del domini

/*
            domainusers[value.id] = User(id        = value.id,
                                         name      = "",
                                         surname   = "",
                                         email     = value.email,
                                         suspended = False,
                                         teacher   = value.teacher
                                        )
*/


            console.log("CREATE --> "+xmluser.toString());
            contc++;
            if (apply) {
                // Create domain user
                // https://developers.google.com/admin-sdk/reseller/v1/codelab/end-to-end

/*
                try:
                    service.users().insert(
                        body={ 'primaryEmail': value.email, 
                               'name': { 'givenName': value.name, 'familyName': value.surname }, 
                               'orgUnitPath': '/Professorat' if value.teacher else '/Alumnat',
                               'externalIds': [{ 'type': 'organization', 'value': value.id }], 
                               'suspended': False,
                               'changePasswordAtNextLogin': True,
                               'password': DEFAULT_PASSWORD}
                        ).execute()

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
    /*
                for gr in creategroups:
                    # https://developers.google.com/admin-sdk/directory/v1/reference/members/insert
                    service.members().insert(
                            groupKey = gr+GOOGLE_DOMAIN,
                            body = {'email': domainuser.email}
                        ).execute()
                for gr in deletegroups:
                    # https://developers.google.com/admin-sdk/directory/v1/reference/members/delete
                    service.members().delete(
                            groupKey = gr+GOOGLE_DOMAIN,
                            memberKey = domainuser.email
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