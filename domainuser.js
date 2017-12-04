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
  
  return name;
  
  /*
      tokens = remove_accents(name.lower()).split()
    names = []
    # Words with compound names and surnames
    especial_tokens = ['da', 'de', 'di', 'do', 'del', 'la', 'las', 'le', 'los', 'mac', 'mc', 'van', 'von', 'y', 'i', 'san', 'santa','al','el']
    for token in tokens: 
        if not token in especial_tokens:
            names.append(token)
    if len(names)>=1:       # If name exists (with name or surname)
        return (names[0])
    else:                   # If name not exists (without name or surname)
        return "_"
  */
}

function DomainUser(domain, id, name, surname, surname1, surname2, domainemail, suspended, teacher, groups) {
  this.domain = domain;
  this.id = id;
  this.name = name;
  this.surname1 = surname1;
  this.surname2 = surname2;
  this.surname = surname;
  this.domainemail = domainemail;
  this.suspended = suspended;
  this.teacher = teacher;
  this.groups = ["groups","A"];

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
}

// toString override added to prototype of DomainUser class
DomainUser.prototype.toString = function()
{
    return this.teacher?"TEACHER: ":"STUDENT: "+this.surname+", "+this.name+" ("+this.email()+") ["+this.groups+"]";
}

module.exports = {
  DomainUser: DomainUser
}