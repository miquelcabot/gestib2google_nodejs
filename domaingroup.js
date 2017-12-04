function DomainGroup(name, members) {
    this.name = name;
    this.members = members;
}

// toString override added to prototype of DomainGroup class
DomainGroup.prototype.toString = function()
{
    return (this.name+" ["+this.members+"]";
}

module.exports = {
    DomainGroup: DomainGroup
}