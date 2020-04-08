/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(["lodash", "async", "cmd"], function( _, async, CMD ){
    let Dependencieloader = function( data ){
        this.jobs = [];
        this.data = data;
    };
    
    Object.assign( Dependencieloader.prototype, {
        add : function( fnc ){
            if ( typeof fnc !== "function" ) return;
            this.jobs.push( fnc );
        },
        
        load : function(){
            let scope = this;
            
            async.waterfall( this.jobs, function( err, res ){
                if ( err ) { console.log("Dependencieloader:", err ); }
                else { CMD.trigger( "loadedAll", scope.data ); }
            });
        }
    });
    
    return Dependencieloader;
});
