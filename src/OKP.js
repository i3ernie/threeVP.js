/**
 * 
 * @param {type} async
 * @param {type} json
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

define(["async", "text", "json", "base64", "img64",/*"es6", */"cjs", "vendor/base64", //"cjs!Url",
    "less",/* "lessc", "libs/normalize", */
    "events", 
    "url", "three", "lodash", "jquery", "backbone", "marionette",
    "cmd", "globals", "tween", "dat-gui", "plugin", "stats", 
    "md5",
    "simplebar",
    "ThreeCSG", 
    
    "ColladaLoader", "OBJLoader", "MTLLoader", "OBJMTLLoader", "X3DLoader", 
    "UniversalLoader", "GLTFLoader", "POVLoader", "JSONLoader", "DDSLoader", "UTF8Loader",
    
    "OrbitControls", "TrackballControls",

    "NURBSSurface","NURBSUtils","NURBSCurve",

    "ObjectDAE", "ObjectX3D", "ObjectOBJ", "ObjectOBJMTL", "objects/Reflector",

    "shaders/CopyShader", "shaders/FXAAShader", 

    "threex/loop", "threex/domevents", "threex/volumetricspotlightmaterial",

    "Draggable", "Interactive",
    "postprocessing/EffectComposer", "postprocessing/RenderPass", "postprocessing/OutlinePass", "postprocessing/ShaderPass",

    "effects/VREffect",
    
    "vendor/require/normalize", 
    "vendor/polyfill/CustomEvent", "vendor/polyfill/Function",
    "fontawesome"
], 
function( 
    async, text, json, base64, img64, /*es6,*/cjs, utilbase64, //Url,
    less, /* lessc, normalize,*/ 
    Events, 
    URL, THREE, _, $, Backbone, Marionette,
    CMD, GLOBALS, TWEEN, dat, Plugin, Stats,
    md5,
    simplebar,
    ThreeCSG,
    
    ColladaLoader, OBJLoader, MTLLoader, OBJMTLLoader, X3DLoader, 
    UniversalLoader, GLTFLoader, POVLoader, JSONLoader, DDSLoader, UTF8Loader,
    
    OrbitControls, TrackballControls,

    NURBSSurface, NURBSUtils, NURBSCurve,

    ObjectDAE, ObjectX3D, ObjectOBJ, ObjectOBJMTL, Reflector,

    CopyShader, FXAAShader,

    Loop, Domevents, Volumetricspotlightmaterial,

    Draggable, Interactive,
    EffectComposer, RenderPass, OutlinePass, ShaderPass,

    VREffect
    ) {      
        
    return {
        "_"         : _,
        "$"         : $,
        "async"     : async,
        "Backbone"  : Backbone,
        "Marionette" : Marionette,
        "CMD"       : CMD,
        "dat"       : dat,
        "Events"    : Events,
        "GLOBALS"   : GLOBALS,
        "Plugin"    : Plugin,
        "THREE"     : THREE,
        "TWEEN"     : TWEEN,
        "ThreeCSG"  : ThreeCSG,
        "URL"       : URL,
        //"Url"       : Url,
        "Stats"     : Stats,
        "base64"    : utilbase64,
        "simplebar" : simplebar,
        "md5" : md5,
        
        "requirejs" : {
            "json" : json,
            "cjs"  : cjs,
            "text" : text,
            "base64" : base64,
            "img64" : img64,
            "less" : less
        
        },
        
        "loader" : {
            "ColladaLoader"   : ColladaLoader,
            "OBJLoader"       : OBJLoader,
            "GLTFLoader"      : GLTFLoader,
            "POVLoader"       : POVLoader,
            "MTLLoader"       : MTLLoader,
            "OBJMTLLoader"    : OBJMTLLoader,
            "X3DLoader"       : X3DLoader,
            "UniversalLoader" : UniversalLoader,
            "JSONLoader"    : JSONLoader,
            "DDSLoader"     : DDSLoader,
            "UTF8Loader"    : UTF8Loader
        },

        "controls" : {
            "OrbitControls" : OrbitControls,
            "TrackballControls" : TrackballControls
        },

        "curves" : {
            "NURBSSurface" : NURBSSurface,
            "NURBSUtils" : NURBSUtils,
            "NURBSCurve" : NURBSCurve
        },

        "shader" : {
            "CopyShader" : CopyShader, 
            "FXAAShader" : FXAAShader
        },
        "threex" : {
            "Loop" : Loop, 
            "Domevents" : Domevents, 
            "Volumetricspotlightmaterial" : Volumetricspotlightmaterial
        },

        "objects" : {
            "ObjectDAE"       : ObjectDAE,
            "ObjectX3D"       : ObjectX3D,
            "ObjectOBJ"       : ObjectOBJ,
            "ObjectOBJMTL"    : ObjectOBJMTL,
            "Reflector"       : Reflector,
        },        
        
        "Draggable"       : Draggable,
        "Interactive"     : Interactive,

        "postprocessing" : {
            "EffectComposer"   : EffectComposer,
            "RenderPass"       : RenderPass,
            "OutlinePass"      : OutlinePass,
            "ShaderPass"       : ShaderPass
        },
        "effects" : {
            "VREffect" : VREffect
        }
        
     };
});

(function(){

    //lecasy features
    require(["OKP"], function( OKP ){
        OKP.$.noConflict( true );
        _.md5 = OKP.md5;
        OKP.THREE.JSONLoader = OKP.loader.JSONLoader;
        console.log( "THREE.js revision: ", OKP.THREE.REVISION );
        console.log( ' define("OKP", function( OKP ){});  =>  ', OKP );
    });

})();
