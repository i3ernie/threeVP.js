/**
 * 
 * @param {type} THREE
 * @param {type} _
 * @param {type} $
 * @param {type} Backbone
 * @param {type} CMD
 * @returns {packL#5.packAnonym$1}
 */

define(["json", "less", "three", "lodash", "jquery", "backbone", "cmd", "globals", "tween", "dat-gui", "plugin", "stats", "async", "ThreeCSG"], 
function( json, less, THREE, _, $, Backbone, CMD, GLOBALS, TWEEN, dat, Plugin, Stats, async ) {
    return {
        THREE       : THREE,
        _           : _,
        $           : $,
        Backbone    : Backbone,
        CMD         : CMD,
        GLOBALS     : GLOBALS,
        dat         : dat,
        TWEEN       : TWEEN,
        Plugin      : Plugin,
        Stats       : Stats,
        async       : async
     };
});
