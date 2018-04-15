/**
 * Created by bernie on 29.10.15.
 */
define(["lodash", "backbone"], function( _, Backbone )
{
    var CMD = _.extend( this, Backbone.Events, {
        
        createControl : function( nameCtr ){
            this[nameCtr] = {};
            _.extend( this[nameCtr], Backbone.Events );
        }
    });
    
    return CMD;
});