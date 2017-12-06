var domainuser = require("./domainuser");

function titleCase(str) {
    var res = ""
    var word = str.split(" ");
    for (var i = 0; i <word.length; i++) {
        res = res.concat(word[i].charAt(0).toUpperCase() + word[i].slice(1).toLowerCase()+" ");
    }
    
    return res.trim();
}

function getgroupemails(name, isstudent) {
    var name = name.toLowerCase();
    var email = [];
    var curs = name.match(/\d+/);   // We get the course from the numbers in the string
    var grup = name.slice(-1);      // We get the group name from the last char of the string
    if (name.includes("batx")) {
        email.push("bat"+curs+grup);
    } else if (name.includes("eso")) {
        email.push("eso"+curs+grup);
    } else if (name.includes("ifc21")) {
        if (grup=="a") {
            email.push("smx1");
        } else if (grup=="b") {
            email.push("sxm2");
        } else if ((grup=="c") && isstudent) {
            // Si és estudiant, feim que grup C de SMX sigui de 1r i 2n
            email.push("smx1");
            email.push("smx2");
        }
    } else if (name.includes("ifc31")) {
        if (grup=="a") {
            email.push("asix1");
        } else if (grup=="b") {
            email.push("asix2");
        } else if ((grup=="c") && isstudent) {
            // Si és estudiant, feim que grup C de ASIX sigui de 1r i 2n
            email.push("asix1");
            email.push("asix2");
        }
    }
    return email;
}

function readXmlGroups(xmlfile) {
    console.log("Loading XML groups...");
    var xmlgroups = {};
    
    for (i in xmlfile.CENTRE_EXPORT.CURSOS[0].CURS) {
        var curs = xmlfile.CENTRE_EXPORT.CURSOS[0].CURS[i].$;
        
        for (j in xmlfile.CENTRE_EXPORT.CURSOS[0].CURS[i].GRUP) {
            var grup = xmlfile.CENTRE_EXPORT.CURSOS[0].CURS[i].GRUP[j].$;
            
            xmlgroups[grup.codi] = {
                'emailsstudents': getgroupemails(curs.descripcio+" "+grup.nom, true),
                'emailsteachers': getgroupemails(curs.descripcio+" "+grup.nom, false),
                'name': curs.descripcio+" "+grup.nom
            }
        }
    }
    
    return xmlgroups;
}

function readXmlTimeTable(xmlfile, xmlgroups) {
    console.log("Loading XML timetable...");
    var xmltimetable = {};
    
    for (i in xmlfile.CENTRE_EXPORT.HORARIP[0].SESSIO) {
        var sessio = xmlfile.CENTRE_EXPORT.HORARIP[0].SESSIO[i].$;
        var emailsTeachers = [];
        
        var xmlgroup = xmlgroups[sessio.grup];
        if (xmlgroup!=null) {
            emailsTeachers = emailsTeachers.concat(xmlgroup["emailsteachers"]);
        }
        
        var timetable = xmltimetable[sessio.professor];
        if (timetable) {
            // Juntam correus anteriors i afegim els actuals, i eliminam dupllicats
            emailsTeachers = emailsTeachers.concat(timetable);
            xmltimetable[sessio.professor] = Array.from(new Set(emailsTeachers));
        } else {
            xmltimetable[sessio.professor] = emailsTeachers;
        }
    }
    
    return xmltimetable;
}

function readXmlUsers(xmlfile, xmlgroups, xmltimetable, domain) {
    console.log("Loading XML users...");
    var xmlusers = {};
    
    // Afegim els alumnes
    for (i in xmlfile.CENTRE_EXPORT.ALUMNES[0].ALUMNE) {
        var student = xmlfile.CENTRE_EXPORT.ALUMNES[0].ALUMNE[i].$;
        
        var emailsstudent = [];
        if (xmlgroups[student.grup]) {
            emailsstudent = xmlgroups[student.grup].emailsstudents;
        }
        
        xmlusers[student.codi] = new domainuser.DomainUser(
            domain, 
            student.codi,
            titleCase(student.nom), 
            titleCase(student.ap1+" "+student.ap2),
            titleCase(student.ap1), 
            titleCase(student.ap2), 
            null,           // domainemail
            false,          // suspended
            false,          // teacher 
            emailsstudent   // groups
        );
    }
    
    // Afegim els professors
    for (i in xmlfile.CENTRE_EXPORT.PROFESSORS[0].PROFESSOR) {
        var teacher = xmlfile.CENTRE_EXPORT.PROFESSORS[0].PROFESSOR[i].$;
        
        var emailsteacher = [];
        if (xmltimetable[teacher.codi]) {
            emailsteacher = xmltimetable[teacher.codi];
        }
        
        xmlusers[teacher.codi] = new domainuser.DomainUser(
            domain, 
            teacher.codi,
            titleCase(teacher.nom), 
            titleCase(teacher.ap1+" "+teacher.ap2),
            titleCase(teacher.ap1), 
            titleCase(teacher.ap2), 
            null,           // domainemail
            false,          // suspended
            true,           // teacher 
            emailsteacher   // groups
        );
    }
    return xmlusers;
}

function readXmlFile(xmlfile, domain) {
    var xmlgroups = readXmlGroups(xmlfile);
    var xmltimetable = readXmlTimeTable(xmlfile, xmlgroups);
    var xmlusers = readXmlUsers(xmlfile, xmlgroups, xmltimetable, domain);

    return xmlusers;
}

module.exports = {
    readXmlFile: readXmlFile
}