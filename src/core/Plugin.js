/**
 * Created by Hessberger on 11.05.2015.
 */
define([ "lodash" ], function( _ ){

    let Plugin = function( opt )
    {
        this.options = opt || { enabled : true };
        this._active = false;

        this.name = ( typeof opt.name === "string" )? opt.name : "Plugin";
        if ( _.isObject(opt) ) { 
            _.extend( this.options, opt ); 
        }
        if ( this.options.enabled === true) { 
            this.enable(); 
        }
    };
    
    Object.assign( Plugin.prototype, {
        initPlugin : function( done ){
            if ( typeof done === "function" ) done();
        },
        
        registerEvents : function() { },
    
        removeEvents : function() { },
    
        enable : function() {
            if ( this._active === true ) return;
            this._active = true;
            this.registerEvents();
        },
        disable : function() {
            if ( this._active === false ) return;
            this._active = false;
            this.removeEvents();
        },

        isActive : function() {
            return this._active;
        }
    });
    
    return Plugin;
});