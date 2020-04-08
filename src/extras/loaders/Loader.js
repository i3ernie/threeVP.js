/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["lodash"], function( _ ){
    
    Loader = function( data, defaults, opts ){
        defaults = defaults || {};
        this.data = data || {};
        this.options = _.extend({}, defaults, opts);
    };
    
    Loader.prototype.load = function(){
        
    };
    
    Loader.prototype.done = function( sc, ret ){
        //var scope = sc || this; 
        var scope = this;
        var data = ret || scope.data;
    
        if ( scope.options.eventEmitter ) { scope.options.eventEmitter.trigger( scope.options.trigger, ret ); }
        if ( typeof scope.callback === "function" ) { scope.callback( null, data ); }
    };
    
    return Loader;
});

