/**
 * Created by Hessberger on 11.05.2015.
 */
define([ "lodash" ], function( _ ){

    var Plugin = function( n, opt )
    {
        this.options = opt || { enabled : true };
        this._active = false;

        this.name = ( typeof n === "string" )? n : "Plugin";
        if ( _.isObject(opt) ) { 
            _.extend( this.options, opt ); 
        }
        if ( this.options.enabled === true) { 
            this.enable(); 
        }
    };
    
    Plugin.prototype.registerEvents = function() {
    };
    
    Plugin.prototype.removeEvents = function() {
    };
    
    Plugin.prototype.enable = function() {
        if ( this._active === true ) return;
        this._active = true;
        this.registerEvents();
    };
    Plugin.prototype.disable = function() {
        if ( this._active === false ) return;
        this._active = false;
        this.removeEvents();
    };

    Plugin.prototype.isActive = function() {
        return this._active;
    };
    
    return Plugin;
});