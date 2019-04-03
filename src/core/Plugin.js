/**
 * Created by Hessberger on 11.05.2015.
 */
define([ "lodash", "async" ], function( _, async ){

    let defaults = {
        enabled : true,
        name : "Plugin"
    };

    let Plugin = function( opt )
    {
        this.options = _.extend({}, defaults, opt );
        this._active = false;

        this.name = this.options.name;

        if ( this.options.enabled === true) { 
            this.enable(); 
        }
    };
    
    Object.assign( Plugin.prototype, {

        initPlugin : function( app, done ){
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

    Plugin.initPlugins = function( app, clbk ){
        let a = [];
        _.each( app.plugins, function( plg, k ){
                a.push( function( done ){ plg.initPlugin( app, done ); } );
        });
        async.parallel(a, function( err, res ){
                if ( err ) { console.error( err ); return; }
                clbk( null, app.plugins );
        });
    };
    
    return Plugin;
});