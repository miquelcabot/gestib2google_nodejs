function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

/** Remove accents, ñ, ... */
function removeaccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
}
   
function normalizedname(name) {
  var tokens = removeaccents(name.toLowerCase()).split(" ");
  var names = [];
  // Words with compound names and surnames
  especial_tokens = ['da', 'de', 'di', 'do', 'del', 'la', 'las', 'le', 'los', 
    'mac', 'mc', 'van', 'von', 'y', 'i', 'san', 'santa','al','el'];
  
  for (var i = 0; i < tokens.length; i++) {
    token = tokens[i];
    if (especial_tokens.indexOf(token)<0) {  // If token not in especial_tokens
      names.push(token);
    }
  }

  if (names.length>=1) { // If name exists (with name or surname)
    return names[0];
  } else {               // If name not exists (without name or surname)
    return "_";
  }
}

function DomainUser(domain, id, name, surname, surname1, surname2, domainemail, 
    suspended, teacher, tutor, withoutcode, groups) {
  this.domain = domain;
  this.id = id;
  this.name = name;
  this.surname1 = surname1;
  this.surname2 = surname2;
  this.surname = surname;
  this.domainemail = domainemail;
  this.suspended = suspended;
  this.teacher = teacher;
  this.tutor = tutor;
  this.withoutcode = withoutcode;
  this.groups = groups;

  this.email = function() {
    if (this.domainemail) {
      return this.domainemail;
    } else if (this.teacher) {
      email = normalizedname(this.name.substring(0,1)) +
        normalizedname(this.surname1);
      return email+"@"+this.domain;
    } else {
      email = normalizedname(this.name.substring(0,1)) +
        normalizedname(this.surname1.substring(0,1)) +
        normalizedname(this.surname2.substring(0,1));
      return email+pad(0,2)+"@"+this.domain;
    }
  }
  
  this.user = function() {
    return this.email().replace("@"+this.domain, "");
  }

  this.groupswithdomain = function() {
    var gr = [];
    for (var i = 0; i < this.groups.length; i++) {
      group = this.groups[i];
      gr.push(group+"@"+this.domain);
    }
    return gr;
  }

  this.groupswithprefix = function() {
    var gr = [];
    for (var i = 0; i < this.groups.length; i++) {
      group = this.groups[i];
      if (group.startsWith("alumnat.") || group.startsWith("ee.") || group.startsWith("tutors")) {
        gr.push(group);
      }
    }
    return gr;
  }

  this.groupswithprefixsimple = function() {
    var gr = [];
    for (var i = 0; i < this.groups.length; i++) {
      group = this.groups[i];
      if (group.startsWith("alumnat.") || group.startsWith("ee.") || group.startsWith("tutors")) {
        gr.push(group.replace("alumnat.","").replace("ee.",""));
      }
    }
    return gr;
  }

  this.groupswithprefixadded = function() {
    var gr = [];
    for (var i = 0; i < this.groups.length; i++) {
      group = this.groups[i];
      if (this.teacher) {
        gr.push("ee."+group);
      } else {
        gr.push("alumnat."+group);
      }
    } 
    if (this.teacher && this.tutor) {
      gr.push("tutors");
    }
    return gr;
  }
}

// toString override added to prototype of DomainUser class
DomainUser.prototype.toString = function()
{
    return (this.teacher?"TEACHER: ":"STUDENT: ")+this.surname+", "+this.name+" ("+this.email()+") ["+this.groups+"]";
}

module.exports = {
  DomainUser: DomainUser,
  pad: pad
}