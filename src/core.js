/**
 * 
 * @param {type} THREE
 * @param {type} _
 * @param {type} $
 * @param {type} Backbone
 * @param {type} CMD
 * @returns {packL#5.packAnonym$1}
 */

define(["async", "json", "i18n", "es6", "base64", "vendor/base64", 
    "less", "lessc", "libs/normalize", "events", 
    "url", "three", "lodash", "jquery", "backbone", 
    "cmd", "globals", "tween", "dat-gui", "plugin", "stats", 
    "ThreeCSG", "vendor/require/normalize", 
    "vendor/polyfill/CustomEvent", "vendor/polyfill/Function"
], 
function( async, json, i18n, es6, base64, utilbase64, less, lessc, normalize, Events, URL, THREE, _, $, Backbone, CMD, GLOBALS, TWEEN, dat, Plugin, Stats ) {
    return {
        "_"         : _,
        "$"         : $,
        "async"     : async,
        "Backbone"  : Backbone,
        "CMD"       : CMD,
        "dat"       : dat,
        "Events"    : Events,
        "GLOBALS"   : GLOBALS,
        "Plugin"    : Plugin,
        "THREE"     : THREE,
        "TWEEN"     : TWEEN,
        "URL"       : URL,
        "Stats"     : Stats,
        "base64"    : utilbase64,
        "requirejs" : {
            "json" : json,
            "less" : less,
            "i18n" : i18n,
            "es6"  : es6
        }
     };
});
