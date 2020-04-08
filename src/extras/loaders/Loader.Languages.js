/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["lodash", "./Loader", "i18n"], function( _, Loader )
{
    let defaults = { 
        path : { 
            conf : "conf/", 
            locale : "locale/"
        },
        typeprefix : "i18n" 
    };
    
    let _setLocale = function( obj )
        { 
            let aFiles = [];
            let s = _.size( obj );

            _.each( obj, ( files, k ) => {
                this.Locale[k] = {};
                aFiles = [];
                _.each( files, ( file ) => {
                    aFiles.push( this.options.typeprefix+"!"+ this.options.path.locale+file );
                });
                require( aFiles, function(){
                    s--;
                    for ( let i=0; i<arguments.length; i++ )
                    {
                        _.extend( this.Locale[k], arguments[i] );
                    }
                    if ( s === 0) this.done( this );
                }.bind(this));
            });
    };
    
    let LangLoader = function( data, opt )
    {
        let scope = this;
        
        this.Locale = {};
        Loader.call( this, data, defaults, opt );	
        this.load = function(){ scope._load.apply( scope, arguments ); };
    };
        
    LangLoader.prototype = _.create( Loader.prototype, {
        constructor : LangLoader,

        _load : function( callback )
        {
            let scope = this;
            let aFiles = [];
            var oFiles = {};
            var a = _.isString( this.data.files.locale )? [this.data.files.locale] : this.data.files.locale;

            this.callback = callback;
            
            _.each(a, function( file ) {
                aFiles.push("json!" + scope.options.path.conf+file);
            });

            require( aFiles, function()
            {
                oFiles = arguments[0];

                if ( arguments.length > 1 ) {
                    for ( var i =1; i<arguments.length; i++ ){
                        _.each( arguments[i], function( v, k ){
                            if ( oFiles[k] ) {oFiles[k] = _.union(oFiles[k],v); }
                            else {oFiles[k] = v;}
                        });
                    }
                }

                _setLocale.call( this, oFiles );

            }.bind(this));
        }
    });
        
    return LangLoader;
});

