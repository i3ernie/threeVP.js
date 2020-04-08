/**
 * Created by bernie on 08.11.15.
 */
define(["three", "lodash"], function ( THREE, _ ) {
    
    var pointer_position = new THREE.Vector3( 0,0,0 );
    
    var options = {
         width      : 100, 
         height     : 100,
         opacity    : 0.0,
         dir        : "xz"
    };

    var IPlane = function( VP, opt )
    {
        var scope = this;
        
        this.options = {};
        _.extend( this.options, options, opt );

        this.camera = VP.camera;
        this.enabled = false;
        this.visible = false;
        
        var side = /*this.options.opacity < .01 ? THREE.BackSide :*/ THREE.FrontSide;

        THREE.Mesh.call( this,
            new THREE.PlaneGeometry( this.options.width, this.options.height ),
            new THREE.MeshBasicMaterial({ opacity: this.options.opacity, transparent: true, side : side })
        );

        this._handleMouseMove = function(){ scope.handleMouseMove.apply(scope, arguments); };

        this.DomEvents = VP.DomEvents;

        if (this.options.dir === "xz") this.rotation.x = Math.PI * -.5;
        if (this.options.dir === "yz") this.rotation.y = Math.PI * -.5;
    };

    IPlane.prototype = _.create( THREE.Mesh.prototype, {
        constructor : IPlane,

        startTracking : function( mouse_position ){
            this.enabled = true;
            this.DomEvents.addEventListener( this, 'mousemove', this._handleMouseMove );
            this.position.set( mouse_position.x, mouse_position.y, mouse_position.z );
        },

        handleMouseMove : function( ev )
        {
            if ( this.enabled )
            {
                pointer_position.copy( ev.intersect.point );
                this.dispatchEvent({ type: "tracking", origDomEvent : ev, pointer_position : pointer_position });
                this.position.copy( pointer_position );
            }
        },
        
        stopTracking : function() 
        {
            if ( this.enabled )
            {
                this.enabled = false;
                this.DomEvents.removeEventListener( this, 'mousemove', this._handleMouseMove );
                this.position.y = -10;
            }
        }
    });

    return IPlane;
});