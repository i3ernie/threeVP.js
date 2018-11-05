/**
 * Created by Hessberger on 10.10.2014.
 */
define(["lodash"], function (_) {
    var ret = {};

    _.each(_.compact( _.map( window.location.search.slice(1).split('&'), function( item ){
        if( item )return item.split( '=' );
    })) , function( p ){
        ret[p[0]] = p[1];
    });

    return ret;
});