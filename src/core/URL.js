/**
 * Created by Hessberger on 10.10.2014.
 */
define(["lodash", "jquery"], function ( _, $ ) {
    var URL = {};

    _.each(_.compact( _.map( window.location.search.slice(1).split('&'), function( item ){
        if( item )return item.split( '=' );
    })) , function( p ){
        URL[p[0]] = p[1];
    });
    
    URL.currentScriptURL = function(){
        let $el = $("script[data-main]")[0];
        let main = $el.attr("data-main");
        let ret = main.substring( 0, main.indexOf( "js/" ));
        
        if ( ret === "/" ) { ret = ""; }
        
        return ret;
    };

    return URL;
});