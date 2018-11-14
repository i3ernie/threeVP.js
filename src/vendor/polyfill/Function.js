/**
 * Created by Hessberger on 10.04.2015.
 */
Function.prototype.inheritsFrom = function( parentClassOrObject ){
    if ( parentClassOrObject.constructor === Function )
    {
        //Normal Inheritance
        this.prototype = Object.create(parentClassOrObject.prototype);
        this.prototype.constructor = this;

        this.prototype.parentProto = parentClassOrObject.prototype;
        this.prototype.super = parentClassOrObject;
    }
    else
    {
        //Pure Virtual Inheritance
        this.prototype = parentClassOrObject;
        this.prototype.constructor = this;
        this.prototype.parentProto = parentClassOrObject;
    }
    return this;
};
Function.prototype.implementsFrom = function (item)
{
    var instance = ( item.constructor === Function )? new item : item;

    for (var key in instance) {
        this.prototype[key] = instance[key];
    }
};