/**
 * Created by bernie on 27.10.15.
 */

/**
 * 
 * @param {type} THREE
 * @param {type} _
 * @param {type} Backbone
 * @param {type} CMD
 * @param {type} Loop
 * @param {type} PointerRay
 * @param {type} Domevents
 * @param {type} model
 * @returns {ViewportL#8.Viewport}
 */

define(["three", "lodash", "backbone", "cmd", 
    "core/loop/RenderingLoop", "core/PointerRay", "core/Domevents", "json!core/viewport/model.json",
    "vendor/three/controls/OrbitControls"],
    function (THREE, _, Backbone, CMD, Loop, PointerRay, Domevents, model)
{
    var defaults = {
        $vp             : window,
        antialias       : "default", //none, default, fxaa, smaa
        renderer        : "standard", //"deferred", "standard"
        postprocessing  : false,
        shadowMap       : true,
        clearColor      : 'lightgrey',
        alpha           : true,
        opacity         : 0.5,
        camFov          : 45
    };

   var Model = Backbone.Model.extend({
       defaults : _.extend({}, model.defaults, {
           $vp : window
       }),
       bounds : model.bounds
   });
    
    var initRenderer = function( VP ){ 
        var renderer = null;
        var antialias = (VP.options.antialias === "default")? true : false;

        if ( VP.options.renderer === "deferred") {
            renderer = new THREE.WebGLDeferredRenderer({
                antialias: VP.options.antialias,
                tonemapping: THREE.FilmicOperator,
                brightness: 2.5,
                scale: 1.0,
                width: VP.options.$vp.innerWidth,
                height: VP.options.$vp.innerHeight
            });
        }
        else {
            renderer	= new THREE.WebGLRenderer({
                alpha : true,
                antialias	: antialias
            });    
            renderer.setSize( VP.options.$vp.innerWidth, VP.options.$vp.innerHeight );
            renderer.shadowMap.enabled = VP.options.shadowMap;
            renderer.shadowMapSoft = true;
            renderer.setClearColor(new THREE.Color( VP.options.clearColor ), VP.options.opacity);
        }
        return renderer;
    };

    

    var initScene = function( VP ){
        return VP.options.scene || new THREE.Scene();
    };
    
    var initCamera = function( VP ){
        var cam = VP.options.camera || new THREE.PerspectiveCamera(VP.options.camFov, VP.options.$vp.innerWidth / VP.options.$vp.innerHeight, 1, 20000);
        return cam;
    };

    var initLoop = function( VP ){
        VP.loop  = new Loop();
        
        if ( VP.options.postprocessing ) {
            VP.loop.add( function()
            {

                // Render depth into depthRenderTarget
                VP.scene.overrideMaterial = VP.depthMaterial;
                VP.renderer.render( VP.scene, VP.camera, VP.depthRenderTarget, true );
                // Render renderPass and SSAO shaderPass
                VP.scene.overrideMaterial = null;

                VP.composer.render();
            } );
        }
        else {
            if ( VP.options.effect ) {
                VP.loop.add( function()
                {
                    VP.effect.render( VP.scene, VP.camera );
                } );
            } else {
                VP.loop.add( function()
                {
                    VP.renderer.render( VP.scene, VP.camera );
                } );
            }
        }
    };

    /**
     * 
     * @param {type} obj
     * @returns {ViewportL#14.Viewport}
     */
    var Viewport = function( obj )
    {
        //var CMD = this.CMD = obj.CMD;
        CMD.createControl( "VP" );
        CMD.createControl( "Scene" );
        CMD.createControl( "Camera" );
        
        this.options = _.extend({}, defaults, obj );
        
        this.model = new Model();
        this.clock = new THREE.Clock();
       
        this.model.on("change:camControl" , function(){ this.control.enabled = this.model.attributes.camControl; }, this);
        
        CMD.VP.on("disableControl", this.disableControl, this);
        CMD.VP.on("enableControl", this.enableControl, this);
        
        this.renderer   = initRenderer( this );
        CMD.trigger("rendererInitalized", this);
        
        this.scene      = initScene( this );
        CMD.trigger("sceneInitalized", this);
        
        this.camera	= initCamera( this );
        CMD.trigger("cameraInitalized", this);

        if ( this.options.effect && THREE[this.options.effect] ) {
            effect = new THREE[this.options.effect]( this.renderer );
        } else
        {
            this.options.effect = false;
        }


        this.scene.add( this.camera );

        if ( defaults.$vp === window || this.options.$vp[0] === window ) {
            document.body.appendChild( this.renderer.domElement );
        }
        else {
            this.options.$vp.append( this.renderer.domElement );
        }

        //render loop
        initLoop( this );

        //loop
        this.scene.addEventListener( 'update', function()
        {
        }.bind(this));

        this.DomEvents = new Domevents( this.camera, this.renderer.domElement );
        this.control = this.options.control || new THREE.OrbitControls( this.camera, document );
        
         if ( this.options.postprocessing) {
            //initPostProcessing( this ); 
        }
        this.raycaster = new PointerRay( this );

        CMD.trigger( "viewportInitalized", this );
    };
    
    Viewport.prototype.init = function() {
        CMD.VP.trigger( "initalized", this );
    };
    
    Viewport.prototype.start = function(){
        this.DomEvents.addEventListener( this.scene, "click", this.onClick.bind(this) );
        this.clock.getDelta();
        this.loop.start();
        CMD.VP.trigger("started", this);
    };
    
    Viewport.prototype.stop = function(){
        //this.DomEvents.addEventListener( this.scene, "click", this.onClick.bind(this) );
        this.loop.stop();
        
        CMD.VP.trigger("started", this);
    };
 
    Viewport.prototype.disableControl = function(){
        this.control.enabled = false;
    };
    Viewport.prototype.enableControl = function(){
        this.control.enabled = true;
    };
    
    Viewport.prototype.onClick = function( ev ){
        
    };

    return Viewport;

});
