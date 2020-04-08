/**
 * Created by bernie on 05.12.15.
 */
define(["lodash", "cmd"], function ( _, CMD )
{
    var events = ["mousedown", "mouseup"];
    
    var mouseDown = function( ev ){ 
        CMD.trigger("startTracking", ev); 
    };
    var mouseUp = function( ev ){ 
        CMD.trigger("stopTracking", ev); 
    };
    
    
    var Draggable = {
        
        DomEvents : null,
        
        userEvents : events,
        
        init : function( VP ){
            this.DomEvents = VP.DomEvents;
        },
        
        makeDraggable : function( el, opt ) {
            if ( this.DomEvents === null ) {
                console.log( "Draggable.VP is null, you must set aktive VP" );
                return;
            }
            var scope = el || this;
            
            el.track = function( pos ){
                //scope.position.addVectors( pos );
                //console.log( pos );
                scope.position.x = pos.x;
                scope.position.z = pos.z;
            };
            
            this.DomEvents.addEventListener( scope, events[0], mouseDown );
            this.DomEvents.addEventListener( scope, events[1], mouseUp );
        },

        onMouseDown : CMD.startTracking
    };

    return Draggable;
});