/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define( function(){
    return {
        "defaults" : {
            "antialias"     : "default", 
            "renderer"      : "standard", 
            "postprocessing" : false,
            "shadowMap"     : true,

            "clearColor"    : "lightgrey",
            "alpha"         : true,
            "opacity"       : 0.5,

            "camFov"        : 45,
            "camControl"    : true
        },
        "bounds" : {
            "antialias" : { "list" : ["none", "default", "fxaa", "smaa"], "type" : "array" },
            "renderer" : { "list" : ["deferred", "standard"], "type" : "array" },
            "camControl" : { "type" : "boolean"}
        }
    };
});

