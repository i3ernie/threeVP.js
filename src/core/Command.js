/**
 * Created by bernie on 29.10.15.
 */
define(["lodash", "backbone"], function( _, Backbone )
{
    let CMD = {};
    _.extend( CMD, Backbone.Events, {
        
        createControl : function( nameCtr ){
            this[nameCtr] = {};
            _.extend( this[nameCtr], Backbone.Events );
        }
    });
    
    return CMD;
});