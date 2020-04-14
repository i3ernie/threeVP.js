/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
const fs = require('fs');
const _ = require('lodash');
const modules = require("../modules.json");

const init_modules = function( done ){
    
    var fnc = function( src, dest, req, name, mod )
    {
        var end = '';
        
        fs.readFile( './node_modules/'+src, 'utf8', ( err, content ) => {
            if ( err ) { console.log( err ); return; }
            if ( typeof mod === "string" ) { end = "\n return " + mod + ';';  }
            var ret = ( typeof req === "string" )? 'define('+req+', function('+name+'){\n' + content + end + "\n});" : content;
            fs.writeFile(dest, ret, 'utf8', ( err ) => {
                if ( err ) { console.log( "ERROR: ", err ); }
            });
        });
    };
    
    _.each(modules, ( el ) =>{ 
        fnc(el.src, el.dest, el.req , el.name, el.mod);
    });    
    done();
};

module.exports = init_modules;
