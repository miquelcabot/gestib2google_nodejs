function getgroupemails(name, isstudent) {
    var name = name.toLowerCase();
    var email = [];

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

    console.log(xmlgroups);
    return xmlgroups;
}

function readXmlFile(xmlfile) {
    var xmlgroups = readXmlGroups(xmlfile);
}

module.exports = {
    readXmlFile: readXmlFile
  }