/**
 * 
 * @param {type} THREE
 * @param {type} _
 * @param {type} $
 * @param {type} Backbone
 * @param {type} CMD
 * @returns {packL#5.packAnonym$1}
 */

define(["async", "json", "less", "lessc", "libs/normalize", "url", "three", "lodash", "jquery", "backbone", "cmd", "globals", "tween", "dat-gui", "plugin", "stats", "ThreeCSG", "vendor/require/normalize"], 
function( async, json, less, lessc, normalize, URL, THREE, _, $, Backbone, CMD, GLOBALS, TWEEN, dat, Plugin, Stats ) {
    return {
        "_"         : _,
        "$"         : $,
        "async"     : async,
        "Backbone"  : Backbone,
        "CMD"       : CMD,
        "dat"       : dat,
        "GLOBALS"   : GLOBALS,
        "Plugin"    : Plugin,
        "THREE"     : THREE,
        "TWEEN"     : TWEEN,
        "URL"       : URL,
        "Stats"     : Stats,
        "requirejs" : {
            "json" : json,
            "less" : less
        }
     };
});
