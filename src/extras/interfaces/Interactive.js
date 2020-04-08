/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(["three", "lodash"], function( THREE, _ ){
    
    var events = ["mousedown", "mouseup", "click"];
    
    var Interactive = {
        
        DomEvents : null,
        
        init : function( VP ){
            this.DomEvents = VP.DomEvents;
        },
        
        makeInteractive : function( el ) {
            var _eventsMap = {
                mousedown : el._onMousedown,
                mouseup : el._onMouseup,
                dblclick : el._onDblclick,
                click : el._onClick
            };
            var scope = this;
            
            
            scope.DomEvents.on( el, "click", this.onClick );
            _.each( events, function( ev ){
                scope.DomEvents.addEventListener( el, ev, el._eventsMap[ev] );
            });
            this.DomActive = true;
        },
        
        onClick : function(){},
        onMousedown : function(){}
    };
    
    return Interactive;
});
