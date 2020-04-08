/**
 * 
 * @param {type} async
 * @param {type} json
 * @param {type} i18n
 * @param {type} es6
 * @param {type} base64
 * @param {type} utilbase64
 * @param {type} less
 * @param {type} lessc
 * @param {type} normalize
 * @param {type} Events
 * @param {type} URL
 * @param {type} THREE
 * @param {type} _
 * @param {type} $
 * @param {type} Backbone
 * @param {type} CMD
 * @param {type} GLOBALS
 * @param {type} TWEEN
 * @param {type} dat
 * @param {type} Plugin
 * @param {type} Stats
 * @returns {coreL#12.coreAnonym$1}
 */

define(["async", "json", "i18n", "es6", "base64", "cjs", "vendor/base64", "cjs!Url",
    /*"less", "lessc", "libs/normalize", */
    "events", 
    "url", "three", "lodash", "jquery", "backbone", 
    "cmd", "globals", "tween", "dat-gui", "plugin", "stats", 
    "ThreeCSG", "vendor/require/normalize", 
    "vendor/polyfill/CustomEvent", "vendor/polyfill/Function"
], 
function( 
    async, json, i18n, es6, base64, cjs, utilbase64, Url,
    /*'less, lessc, normalize,*/ 
    Events, 
    URL, THREE, _, $, Backbone, 
    CMD, GLOBALS, TWEEN, dat, Plugin, Stats,
    ThreeCSG ) {
        $.noConflict( true );
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
        "ThreeCSG"  : ThreeCSG,
        "URL"       : URL,
        "Url"       : Url,
        "Stats"     : Stats,
        "base64"    : utilbase64,
        "requirejs" : {
            "json" : json,
        //    "less" : less,
            "i18n" : i18n,
            "es6"  : es6
        }
     };
});
