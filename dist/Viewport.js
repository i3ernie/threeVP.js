define('core/loop/Loop',["lodash"], function( _ ){
    
//////////////////////////////////////////////////////////////////////////////////
//		Loop                            				//
//////////////////////////////////////////////////////////////////////////////////

    var Loop = function(){
        this._fcts = [];
    };

    /**
     * 
     * @param {function} fct
     * @returns {function}
     */
    Loop.prototype.add	= function( fct ){
        this._fcts.push( fct );
        return fct;
    };

    /**
     * 
     * @param {function} fct
     * @returns {undefined}
     */
    Loop.prototype.remove = function( fct ){
        var index	= this._fcts.indexOf( fct );
        if( index === -1 )	return;
        this._fcts.splice( index,1 );
    };

    /**
     * 
     * @param {type} delta
     * @returns {undefined}
     */
    Loop.prototype.update = function( delta, now ){
        _.each(this._fcts, function( fct ){
            fct( delta, now );
        });
    };

return Loop;

});
define('core/loop/RenderingLoop',["core/loop/Loop", "lodash"], function( Loop, _ ){
    
//////////////////////////////////////////////////////////////////////////////////
//		THREEx.RenderingLoop						//
//////////////////////////////////////////////////////////////////////////////////
var RenderingLoop	= function()
{
    Loop.call( this );

    this.maxDelta	= 0.2;
    var requestId	= null;
    var lastTimeMsec= null;
	
    var onRequestAnimationFrame	= function( nowMsec ){
		// keep looping
		requestId	= requestAnimationFrame( onRequestAnimationFrame );

		// measure time - never notify more than this.maxDelta
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
		var deltaMsec	= Math.min(this.maxDelta*1000, nowMsec - lastTimeMsec);
		lastTimeMsec	= nowMsec;
		// call each update function
		this.update( deltaMsec/1000, nowMsec/1000 );
    }.bind(this);


    //////////////////////////////////////////////////////////////////////////////////
    //		start/stop/isRunning functions					//
    //////////////////////////////////////////////////////////////////////////////////
    
    /**
     * 
     * @returns {undefined}
     */
    this.start = function(){
            console.assert(this.isRunning() === false);
            requestId	= requestAnimationFrame(onRequestAnimationFrame);
    };
    
    /**
     * 
     * @returns {Boolean}
     */
    this.isRunning	= function(){
            return requestId ? true : false;
    };
    
    /**
     * 
     * @returns {undefined}
     */
    this.stop	= function(){
            if( requestId === null )	return;
            cancelAnimationFrame( requestId );
            requestId	= null;
    };
};

RenderingLoop.prototype = _.create( Loop.prototype, {
    constructor : RenderingLoop
});

return RenderingLoop;

});

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define('core/PointerRay',["three"], function( THREE ){
    
    var raycaster = new THREE.Raycaster();
    var mouseCoords = new THREE.Vector2();
    
    var PointerRay = function( VP ){
        
        this.getRay = function( event ){
             mouseCoords.set(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1
            );
            raycaster.setFromCamera( mouseCoords, VP.camera );
            return raycaster.ray;
        };
        
       
    };
    
    return PointerRay;
});


define('core/Domevents',["three"], function( THREE ){

// This THREEx helper makes it easy to handle the mouse events in your 3D scene
//
// * CHANGES NEEDED
//   * handle drag/drop
//   * notify events not object3D - like DOM
//     * so single object with property
//   * DONE bubling implement bubling/capturing
//   * DONE implement event.stopPropagation()
//   * DONE implement event.type = "click" and co
//   * DONE implement event.target
//
// # Lets get started
//
// First you include it in your page
//
// ```<script src='threex.domevent.js'></script>```
//
// # use the object oriented api
//
// You bind an event like this
//
// ```mesh.on('click', function(object3d){ ... })```
//
// To unbind an event, just do
//
// ```mesh.off('click', function(object3d){ ... })```
//
// As an alternative, there is another naming closer DOM events.
// Pick the one you like, they are doing the same thing
//
// ```mesh.addEventListener('click', function(object3d){ ... })```
// ```mesh.removeEventListener('click', function(object3d){ ... })```
//
// # Supported Events
//
// Always in a effort to stay close to usual pratices, the events name are the same as in DOM.
// The semantic is the same too.
// Currently, the available events are
// [click, dblclick, mouseup, mousedown](http://www.quirksmode.org/dom/events/click.html),
// [mouseover and mouse out](http://www.quirksmode.org/dom/events/mouseover.html).
//
//
// First, you instanciate the object
//
// ```var domEvent = new DomEvent();```
//
// Then you bind an event like this
//
// ```domEvent.bind(mesh, 'click', function(object3d){ object3d.scale.x *= 2; });```
//
// To unbind an event, just do
//
// ```domEvent.unbind(mesh, 'click', callback);```
//
//
// # Code

//

	/** @namespace */
let TOUCH_MS = 200;
let TOUCH_TIMER;
let onlongtouch;
let touchduration = 500;
let TOUCH_BEGIN, TOUCH_LATEST = 0;
let TOUCH_POSX, TOUCH_POSY;

// # Constructor
let DomEvents = function( camera, domElement )
{
	this._camera		= camera || null;
	this._domElement 	= domElement || document;
	this._ray 			= new THREE.Raycaster();
	this._selected		= null;
	this._boundObjs		= {};
	// Bind dom event for mouse and touch
	let _this			= this;
	this.firstClick 	= false;
	this.delay = 300;

	this._$onClick		= function(){ _this._onClick.apply(_this, arguments); 	};
	this._$onDblClick	= function(){ _this._onDblClick.apply(_this, arguments);	};
	this._$onMouseMove	= function(){ _this._onMouseMove.apply(_this, arguments);	};
	this._$onMouseDown	= function(){ _this._onMouseDown.apply(_this, arguments);	};
	this._$onMouseUp	= function(){ _this._onMouseUp.apply(_this, arguments);		};
	this._$onTouchMove	= function(){ _this._onTouchMove.apply(_this, arguments);	};
	this._$onTouchStart	= function(){ _this._onTouchStart.apply(_this, arguments);	};
	this._$onTouchEnd	= function(){ _this._onTouchEnd.apply(_this, arguments);	};
	this._$onContextmenu	= function(){ _this._onContextmenu.apply(_this, arguments);	};

	this._domElement.addEventListener( 'click'	, this._$onClick	, false );
	this._domElement.addEventListener( 'dblclick'	, this._$onDblClick	, false );
	this._domElement.addEventListener( 'mousemove'	, this._$onMouseMove	, false );
	this._domElement.addEventListener( 'mousedown'	, this._$onMouseDown	, false );
	this._domElement.addEventListener( 'mouseup'	, this._$onMouseUp	, false );
	this._domElement.addEventListener( 'touchmove'	, this._$onTouchMove	, false );
	this._domElement.addEventListener( 'touchstart'	, this._$onTouchStart	, false );
	this._domElement.addEventListener( 'touchend'	, this._$onTouchEnd	, false );
	this._domElement.addEventListener( 'contextmenu', this._$onContextmenu	, false );
};

DomEvents.eventNames	= [
	"click",
	"dblclick",
	"mouseover",
	"mouseout",
	"mousemove",
	"mousedown",
	"mouseup",
	"contextmenu",
	"touchstart",
	"touchend"
];
DomEvents.hasEvent = function( eventName ){
	return DomEvents.eventNames.indexOf( eventName ) !== -1;
};

Object.assign( DomEvents.prototype,  {

	// # Destructor
	destroy	: function()
	{
		// unBind dom event for mouse and touch
		this._domElement.removeEventListener( 'click'		, this._$onClick	, false );
		this._domElement.removeEventListener( 'dblclick'	, this._$onDblClick	, false );
		this._domElement.removeEventListener( 'mousemove'	, this._$onMouseMove	, false );
		this._domElement.removeEventListener( 'mousedown'	, this._$onMouseDown	, false );
		this._domElement.removeEventListener( 'mouseup'		, this._$onMouseUp	, false );
		this._domElement.removeEventListener( 'touchmove'	, this._$onTouchMove	, false );
		this._domElement.removeEventListener( 'touchstart'	, this._$onTouchStart	, false );
		this._domElement.removeEventListener( 'touchend'	, this._$onTouchEnd	, false );
		this._domElement.removeEventListener( 'contextmenu'	, this._$onContextmenu	, false );
	},


	_getRelativeMouseXY	: function( domEvent ){
		let element = domEvent.target || domEvent.srcElement;

		if (element.nodeType === 3) {
			element = element.parentNode; // Safari fix -- see http://www.quirksmode.org/js/events_properties.html
		}

		//get the real position of an element relative to the page starting point (0, 0)
		//credits go to brainjam on answering http://stackoverflow.com/questions/5755312/getting-mouse-position-relative-to-content-area-of-an-element
		let elPosition	= { x : 0 , y : 0};
		let tmpElement	= element;
		//store padding
		let style	= getComputedStyle(tmpElement, null);
		elPosition.y += parseInt(style.getPropertyValue("padding-top"), 10);
		elPosition.x += parseInt(style.getPropertyValue("padding-left"), 10);

		//add positions
		do {
			elPosition.x	+= tmpElement.offsetLeft;
			elPosition.y	+= tmpElement.offsetTop;
			style		= getComputedStyle(tmpElement, null);

			elPosition.x	+= parseInt(style.getPropertyValue("border-left-width"), 10);
			elPosition.y	+= parseInt(style.getPropertyValue("border-top-width"), 10);
		} while(tmpElement = tmpElement.offsetParent);

		let elDimension	= {
			width	: (element === window) ? window.innerWidth	: element.offsetWidth,
			height	: (element === window) ? window.innerHeight	: element.offsetHeight
		};

		if ( domEvent.type === "touchend" || domEvent.type === "touchstart" ){
			return {
				x : +((domEvent.changedTouches[ 0 ].pageX - elPosition.x) / elDimension.width ) * 2 - 1,
				y : -((domEvent.changedTouches[ 0 ].pageY - elPosition.y) / elDimension.height) * 2 + 1
			};
		}
		else{
			return {
				x : +((domEvent.pageX - elPosition.x) / elDimension.width ) * 2 - 1,
				y : -((domEvent.pageY - elPosition.y) / elDimension.height) * 2 + 1
			};
		}
	},


	/********************************************************************************/
	/*		domevent context						*/
	/********************************************************************************/

	// handle domevent context in object3d instance

	_objectCtxInit	: function( object3d ){
		object3d._3xDomEvent = {};
	},
	_objectCtxDeinit : function( object3d ){
		delete object3d._3xDomEvent;
	},
	_objectCtxIsInit : function( object3d ){
		return !!object3d._3xDomEvent;
	},
	_objectCtxGet : function( object3d ){
		return object3d._3xDomEvent;
	},
	/********************************************************************************/
	/*										*/
	/********************************************************************************/


	/**
	 * Getter/Setter for camera
	 */
	camera : function( value )
	{
		if( value )	this._camera = value;
		return this._camera;
	},

	addEventListener : function( object3d, eventName, callback, useCapture ){
		if ( typeof eventName == "object" ) {
			for ( let i = 0; i<eventName.length; i++){
				this.bind(object3d, eventName[i], callback, useCapture);
			}
			return;
		}

		this.bind(object3d, eventName, callback, useCapture);
	},

	bind : function( object3d, eventName, callback, useCapture )
	{
		if ( !DomEvents.hasEvent( eventName ) ) {
			console.warn( "not available events: "+eventName, object3d );
			return;
		}

		if( !this._objectCtxIsInit( object3d ) )	this._objectCtxInit( object3d );
		let objectCtx = this._objectCtxGet( object3d );
		if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

		objectCtx[eventName+'Handlers'].push({
			callback	: callback,
			useCapture	: useCapture
		});

		// add this object in this._boundObjs
		if( this._boundObjs[eventName] === undefined ){
			this._boundObjs[eventName]	= [];
		}
		this._boundObjs[eventName].push( object3d );
	},

	removeEventListener	: function( object3d, eventName, callback, useCapture ){
		if ( eventName === null || eventName === undefined ){
			eventName = DomEvents.eventNames;
			return;
		}
		if ( typeof eventName == "object"){
			for ( let i = 0; i<eventName.length; i++){
				this.unbind(object3d, eventName[i], callback, useCapture);
			}
			return;
		}
		this.unbind (object3d, eventName, callback, useCapture);
	},

	unbind : function( object3d, eventName, callback, useCapture )
	{
		if ( typeof eventName !== "string" ) {
			console.error( "ERROR: DomEvents:unbind eventName must be a string" );
			return;
		}

		console.assert( DomEvents.hasEvent( eventName ), "not available events:"+eventName );

		let boundObjs = this._boundObjs[eventName];
		if (boundObjs == undefined) {
			return;
		}

		if( !this._objectCtxIsInit(object3d) )	{
                    this._objectCtxInit(object3d);
                }

		let objectCtx	= this._objectCtxGet(object3d);
		if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

		let handlers	= objectCtx[eventName+'Handlers'];
                
		if (typeof callback !== "function") {   // kill all events of this type
			delete objectCtx[eventName+'Handlers'];
			let index = boundObjs.indexOf( object3d );
			if (index > -1) boundObjs.splice( index, 1 );
			return;
		}

		for( let i = 0; i < handlers.length; i++ ){
			let handler = handlers[i];
			if( callback !== handler.callback )	continue;
			if( useCapture !== handler.useCapture )	continue;
			handlers.splice( i, 1 );
			break;
		}

		// from this object from this._boundObjs
		let index = boundObjs.indexOf( object3d );
		if ( index !== -1 ) {
			return;
		}

		boundObjs.splice( index, 1 );
		this.clean();

	},

	clean : function( )
	{
		let a;
		let eventName;
		let boundObjs;

		for( let i = 0; i < DomEvents.eventNames.length; i++ ) {
			eventName = DomEvents.eventNames[i];
			boundObjs = this._boundObjs[eventName];
			a = [];

			if (boundObjs){
				for ( let i = 0, l = boundObjs.length; i < l; i ++ ) {

					if ( boundObjs[i].geometry ) { a.push(boundObjs[i]); }

				}
				this._boundObjs[eventName] = a;
			}
		}
	},

	_bound	: function( eventName, object3d )
	{
		let objectCtx = this._objectCtxGet( object3d );
		if( !objectCtx ) return false;
		return !!objectCtx[eventName+'Handlers'];
	},


	/********************************************************************************/
	/*		onMove								*/
	/********************************************************************************/

	// # handle mousemove kind of events

	_onMove	: function( eventName, mouseX, mouseY, origDomEvent )
	{
		//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
		// get objects bound to this event
		let boundObjs	= this._boundObjs[eventName];
		if( boundObjs === undefined || boundObjs.length === 0 )	return;

		// compute the intersection
		let vector = new THREE.Vector3( mouseX, mouseY, 0.5 );
		this._ray.setFromCamera( vector, this._camera );

		let intersects = null;
		try {
			intersects  = this._ray.intersectObjects( boundObjs );
		} catch( e ){
			this.clean();
			this._onMove( eventName, mouseX, mouseY, origDomEvent );
			return;
		}

		let oldSelected	= this._selected;
		let notifyOver, notifyOut, notifyMove;
		let intersect;
		let newSelected;

		if( intersects.length > 0 ){
			intersect	= intersects[ 0 ];
			newSelected	= intersect.object;

			this._selected	= newSelected;
			// if newSelected bound mousemove, notify it
			notifyMove	= this._bound('mousemove', newSelected);

			if( oldSelected !== newSelected ){
				// if newSelected bound mouseenter, notify it
				notifyOver	= this._bound('mouseover', newSelected);
				// if there is a oldSelect and oldSelected bound mouseleave, notify it
				notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
			}
		}else{
			// if there is a oldSelect and oldSelected bound mouseleave, notify it
			notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
			this._selected	= null;
		}

		// notify mouseMove - done at the end with a copy of the list to allow callback to remove handlers
		notifyMove && this._notify('mousemove', newSelected, origDomEvent, intersect);
		// notify mouseEnter - done at the end with a copy of the list to allow callback to remove handlers
		notifyOver && this._notify('mouseover', newSelected, origDomEvent, intersect);
		// notify mouseLeave - done at the end with a copy of the list to allow callback to remove handlers
		notifyOut  && this._notify('mouseout' , oldSelected, origDomEvent, intersect);
	},


	/********************************************************************************/
	/*		onEvent								*/
	/********************************************************************************/

	// # handle click kind of events

	_onEvent	: function( eventName, mouseX, mouseY, origDomEvent )
	{
	//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
		// get objects bound to this event
		let boundObjs	= this._boundObjs[eventName];
		if( boundObjs === undefined || boundObjs.length === 0 )	return;
		// compute the intersection
		let vector	= new THREE.Vector3( mouseX, mouseY, 0.5 );
		this._ray.setFromCamera( vector, this._camera );

		let intersects = null;
		try {
			intersects  = this._ray.intersectObjects( boundObjs );
		} catch( e ){
			this.clean();
			this._onMove( eventName, mouseX, mouseY, origDomEvent );
			return;
		}

		//console.log("RHinter ",eventName, " ", intersects );


		// if there are no intersections, return now
		if( intersects.length === 0 ) {
			return;
		}
		// init some vairables
		let intersect	= intersects[0];
		let object3d	= intersect.object;
		let objectCtx	= this._objectCtxGet(object3d);
		if( !objectCtx )	return;

		// notify handlers
		if ( !object3d.geometry ){
			return;
		}

		this._notify(eventName, object3d, origDomEvent, intersect);
	},

	_notify	: function( eventName, object3d, origDomEvent, intersect )
	{
		let objectCtx	= this._objectCtxGet( object3d );
		let handlers	= objectCtx ? objectCtx[eventName+'Handlers'] : null;

		// parameter check
		console.assert(arguments.length === 4);

		// do bubbling
		if( !objectCtx || !handlers || handlers.length === 0 ){
			object3d.parent && this._notify( eventName, object3d.parent, origDomEvent, intersect );
			return;
		}

		// notify all handlers
		handlers = objectCtx[eventName+'Handlers'];
		let toPropagate	= true;

		for( let i = 0; i < handlers.length; i++ ){
			let handler	= handlers[i];
			if ( typeof handler.callback === "function") {
				handler.callback({
					type: eventName,
					target: object3d,
					origDomEvent: origDomEvent,
					intersect: intersect,
					stopPropagation: function () {
						toPropagate = false;
					}
				});
			}
			else if ( typeof handler.callback === "string" && typeof object3d.dispatchEvent === "function" ) {
				object3d.dispatchEvent( handler.callback, {
					type: eventName,
					target: object3d,
					origDomEvent: origDomEvent,
					intersect: intersect,
					stopPropagation: function () {
						toPropagate = false;
					}
				});
			}
			if( !toPropagate ) continue;
			// do bubbling
			if( handler.useCapture === false ){
				object3d.parent && this._notify( eventName, object3d.parent, origDomEvent, intersect );
			}
		}
	},

	/********************************************************************************/
	/*		handle mouse events						*/
	/********************************************************************************/
	// # handle mouse events

	_onMouseDown	: function( event ){
		return this._onMouseEvent('mousedown', event);
	},
	_onMouseUp	: function( event ){
		return this._onMouseEvent('mouseup'	, event);
	},

	_onMouseEvent	: function( eventName, domEvent )
	{
		let mouseCoords = this._getRelativeMouseXY( domEvent );
		this._onEvent(eventName, mouseCoords.x, mouseCoords.y, domEvent);
		//console.log("RH", eventName, mouseCoords.x, mouseCoords.y, domEvent);
	},

	_onMouseMove	: function( domEvent )
	{
		let mouseCoords = this._getRelativeMouseXY( domEvent );
		this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
		this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
		this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
	},

	_onClick		: function( event )
	{
		// TODO handle touch ?
		this._onMouseEvent('click'	, event);
	},

	_onDblClick		: function( event )
	{
		// TODO handle touch ?
		this._onMouseEvent('dblclick'	, event);
	},

	_onContextmenu	: function( event )
	{
		//TODO don't have a clue about how this should work with touch..
		this._onMouseEvent('contextmenu'	, event);
	},


	/********************************************************************************/
	/*		handle touch events						*/
	/********************************************************************************/
	// # handle touch events

	_onTouchStart	: function( event ){

		TOUCH_BEGIN = new Date().getTime();

		TOUCH_POSX = event.touches[0].clientX;
		TOUCH_POSY = event.touches[0].clientY;

		TOUCH_TIMER = setTimeout(onlongtouch, touchduration);

		return this._onTouchEvent('mousedown', event);
	},

	_onTouchEnd	: function(event){
		const TOUCH_END = new Date().getTime();
		const time = TOUCH_END - TOUCH_BEGIN;
		const timesince = TOUCH_END - TOUCH_LATEST;
		let evt;

		if (event.touches.length > 1) {
			return;
		}

		if (TOUCH_TIMER) {
			clearTimeout(TOUCH_TIMER);
		}

		if( timesince < 500 && timesince > 0 ){
			evt = new MouseEvent("dblclick", {
				bubbles: true,
				cancelable: true,
				view: window,
				clientX: TOUCH_POSX,
				clientY: TOUCH_POSY,
				offsetX: TOUCH_POSX,
				offsetY: TOUCH_POSY,
				pageX: TOUCH_POSX,
				pageY: TOUCH_POSY
			});
			event.target.dispatchEvent(evt);
			TOUCH_LATEST = new Date().getTime();
			return this._onMouseEvent('mouseup', event);
		} else {

			if (time <= TOUCH_MS) {
				evt = new MouseEvent("click", {
					bubbles: true,
					cancelable: true,
					view: window,
					clientX: TOUCH_POSX,
					clientY: TOUCH_POSY,
					offsetX: TOUCH_POSX,
					offsetY: TOUCH_POSY,
					pageX: TOUCH_POSX,
					pageY: TOUCH_POSY
				});
				event.target.dispatchEvent(evt);
				TOUCH_LATEST = new Date().getTime();
				return this._onMouseEvent('mouseup', event);
			}
			else {
				TOUCH_LATEST = new Date().getTime();
				return this._onTouchEvent('mouseup', event);
			}
		}
	},

	_onTouchMove : function(domEvent)
	{
		if( domEvent.touches.length !== 1 )	return undefined;

		domEvent.preventDefault();
		let mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
		let mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;

		this._onMove('mousemove', mouseX, mouseY, domEvent);
		this._onMove('mouseover', mouseX, mouseY, domEvent);
		this._onMove('mouseout' , mouseX, mouseY, domEvent);
	},

	_onTouchEvent : function(eventName, domEvent)
	{
		if( domEvent.touches.length !== 1 )	return undefined;

		domEvent.preventDefault();

		let mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
		let mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
		this._onEvent(eventName, mouseX, mouseY, domEvent);
	}

});


	onlongtouch = function() {
		//console.log("longtouch");
	};

return DomEvents;

});

define("json!core/viewport/model.json", function(){ return {
    "defaults" :{
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
}
;});

define('vendor/three/controls/OrbitControls',["three"], function(THREE){
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author ScieCode / http://github.com/sciecode
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

THREE.OrbitControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new THREE.Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.05;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.panSpeed = 1.0;
	this.screenSpacePanning = false; // if true, pan in screen-space
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set to false to disable use of the keys
	this.enableKeys = true;

	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	this.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

	// Touch fingers
	this.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	this.saveState = function () {

		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function () {

		var offset = new THREE.Vector3();

		// so camera.up is the orbit axis
		var quat = new THREE.Quaternion().setFromUnitVectors( object.up, new THREE.Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().inverse();

		var lastPosition = new THREE.Vector3();
		var lastQuaternion = new THREE.Quaternion();

		return function update() {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			if ( scope.enableDamping ) {

				spherical.theta += sphericalDelta.theta * scope.dampingFactor;
				spherical.phi += sphericalDelta.phi * scope.dampingFactor;

			} else {

				spherical.theta += sphericalDelta.theta;
				spherical.phi += sphericalDelta.phi;

			}

			// restrict theta to be between desired limits
			spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location

			if ( scope.enableDamping === true ) {

				scope.target.addScaledVector( panOffset, scope.dampingFactor );

			} else {

				scope.target.add( panOffset );

			}

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

				panOffset.multiplyScalar( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

				panOffset.set( 0, 0, 0 );

			}

			scale = 1;

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function () {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
		scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		window.removeEventListener( 'keydown', onKeyDown, false );

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = {
		NONE: - 1,
		ROTATE: 0,
		DOLLY: 1,
		PAN: 2,
		TOUCH_ROTATE: 3,
		TOUCH_PAN: 4,
		TOUCH_DOLLY_PAN: 5,
		TOUCH_DOLLY_ROTATE: 6
	};

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new THREE.Spherical();
	var sphericalDelta = new THREE.Spherical();

	var scale = 1;
	var panOffset = new THREE.Vector3();
	var zoomChanged = false;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();

	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function () {

		var v = new THREE.Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function () {

		var v = new THREE.Vector3();

		return function panUp( distance, objectMatrix ) {

			if ( scope.screenSpacePanning === true ) {

				v.setFromMatrixColumn( objectMatrix, 1 );

			} else {

				v.setFromMatrixColumn( objectMatrix, 0 );
				v.crossVectors( scope.object.up, v );

			}

			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function () {

		var offset = new THREE.Vector3();

		return function pan( deltaX, deltaY ) {

			var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

			if ( scope.object.isPerspectiveCamera ) {

				// perspective
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we use only clientHeight here so aspect ratio does not distort speed
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object.isOrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;

			}

		};

	}();

	function dollyIn( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	function dollyOut( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		rotateEnd.set( event.clientX, event.clientY );

		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyIn( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyOut( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseUp( /*event*/ ) {

		// no-op

	}

	function handleMouseWheel( event ) {

		if ( event.deltaY < 0 ) {

			dollyOut( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyIn( getZoomScale() );

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		var needsUpdate = false;

		switch ( event.keyCode ) {

			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				needsUpdate = true;
				break;

			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				needsUpdate = true;
				break;

			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				needsUpdate = true;
				break;

			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				needsUpdate = true;
				break;

		}

		if ( needsUpdate ) {

			// prevent the browser from scrolling on cursor keys
			event.preventDefault();

			scope.update();

		}


	}

	function handleTouchStartRotate( event ) {

		if ( event.touches.length == 1 ) {

			rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			rotateStart.set( x, y );

		}

	}

	function handleTouchStartPan( event ) {

		if ( event.touches.length == 1 ) {

			panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			panStart.set( x, y );

		}

	}

	function handleTouchStartDolly( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchStartDollyPan( event ) {

		if ( scope.enableZoom ) handleTouchStartDolly( event );

		if ( scope.enablePan ) handleTouchStartPan( event );

	}

	function handleTouchStartDollyRotate( event ) {

		if ( scope.enableZoom ) handleTouchStartDolly( event );

		if ( scope.enableRotate ) handleTouchStartRotate( event );

	}

	function handleTouchMoveRotate( event ) {

		if ( event.touches.length == 1 ) {

			rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			rotateEnd.set( x, y );

		}

		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

	}

	function handleTouchMovePan( event ) {

		if ( event.touches.length == 1 ) {

			panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			panEnd.set( x, y );

		}

		panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

	}

	function handleTouchMoveDolly( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );

		dollyIn( dollyDelta.y );

		dollyStart.copy( dollyEnd );

	}

	function handleTouchMoveDollyPan( event ) {

		if ( scope.enableZoom ) handleTouchMoveDolly( event );

		if ( scope.enablePan ) handleTouchMovePan( event );

	}

	function handleTouchMoveDollyRotate( event ) {

		if ( scope.enableZoom ) handleTouchMoveDolly( event );

		if ( scope.enableRotate ) handleTouchMoveRotate( event );

	}

	function handleTouchEnd( /*event*/ ) {

		// no-op

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onMouseDown( event ) {

		if ( scope.enabled === false ) return;

		// Prevent the browser from scrolling.

		event.preventDefault();

		// Manually set the focus since calling preventDefault above
		// prevents the browser from setting it automatically.

		scope.domElement.focus ? scope.domElement.focus() : window.focus();

		switch ( event.button ) {

			case 0:

				switch ( scope.mouseButtons.LEFT ) {

					case THREE.MOUSE.ROTATE:

						if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

							if ( scope.enablePan === false ) return;

							handleMouseDownPan( event );

							state = STATE.PAN;

						} else {

							if ( scope.enableRotate === false ) return;

							handleMouseDownRotate( event );

							state = STATE.ROTATE;

						}

						break;

					case THREE.MOUSE.PAN:

						if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

							if ( scope.enableRotate === false ) return;

							handleMouseDownRotate( event );

							state = STATE.ROTATE;

						} else {

							if ( scope.enablePan === false ) return;

							handleMouseDownPan( event );

							state = STATE.PAN;

						}

						break;

					default:

						state = STATE.NONE;

				}

				break;


			case 1:

				switch ( scope.mouseButtons.MIDDLE ) {

					case THREE.MOUSE.DOLLY:

						if ( scope.enableZoom === false ) return;

						handleMouseDownDolly( event );

						state = STATE.DOLLY;

						break;


					default:

						state = STATE.NONE;

				}

				break;

			case 2:

				switch ( scope.mouseButtons.RIGHT ) {

					case THREE.MOUSE.ROTATE:

						if ( scope.enableRotate === false ) return;

						handleMouseDownRotate( event );

						state = STATE.ROTATE;

						break;

					case THREE.MOUSE.PAN:

						if ( scope.enablePan === false ) return;

						handleMouseDownPan( event );

						state = STATE.PAN;

						break;

					default:

						state = STATE.NONE;

				}

				break;

		}

		if ( state !== STATE.NONE ) {

			document.addEventListener( 'mousemove', onMouseMove, false );
			document.addEventListener( 'mouseup', onMouseUp, false );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( state ) {

			case STATE.ROTATE:

				if ( scope.enableRotate === false ) return;

				handleMouseMoveRotate( event );

				break;

			case STATE.DOLLY:

				if ( scope.enableZoom === false ) return;

				handleMouseMoveDolly( event );

				break;

			case STATE.PAN:

				if ( scope.enablePan === false ) return;

				handleMouseMovePan( event );

				break;

		}

	}

	function onMouseUp( event ) {

		if ( scope.enabled === false ) return;

		handleMouseUp( event );

		document.removeEventListener( 'mousemove', onMouseMove, false );
		document.removeEventListener( 'mouseup', onMouseUp, false );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();
		event.stopPropagation();

		scope.dispatchEvent( startEvent );

		handleMouseWheel( event );

		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( event.touches.length ) {

			case 1:

				switch ( scope.touches.ONE ) {

					case THREE.TOUCH.ROTATE:

						if ( scope.enableRotate === false ) return;

						handleTouchStartRotate( event );

						state = STATE.TOUCH_ROTATE;

						break;

					case THREE.TOUCH.PAN:

						if ( scope.enablePan === false ) return;

						handleTouchStartPan( event );

						state = STATE.TOUCH_PAN;

						break;

					default:

						state = STATE.NONE;

				}

				break;

			case 2:

				switch ( scope.touches.TWO ) {

					case THREE.TOUCH.DOLLY_PAN:

						if ( scope.enableZoom === false && scope.enablePan === false ) return;

						handleTouchStartDollyPan( event );

						state = STATE.TOUCH_DOLLY_PAN;

						break;

					case THREE.TOUCH.DOLLY_ROTATE:

						if ( scope.enableZoom === false && scope.enableRotate === false ) return;

						handleTouchStartDollyRotate( event );

						state = STATE.TOUCH_DOLLY_ROTATE;

						break;

					default:

						state = STATE.NONE;

				}

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( state ) {

			case STATE.TOUCH_ROTATE:

				if ( scope.enableRotate === false ) return;

				handleTouchMoveRotate( event );

				scope.update();

				break;

			case STATE.TOUCH_PAN:

				if ( scope.enablePan === false ) return;

				handleTouchMovePan( event );

				scope.update();

				break;

			case STATE.TOUCH_DOLLY_PAN:

				if ( scope.enableZoom === false && scope.enablePan === false ) return;

				handleTouchMoveDollyPan( event );

				scope.update();

				break;

			case STATE.TOUCH_DOLLY_ROTATE:

				if ( scope.enableZoom === false && scope.enableRotate === false ) return;

				handleTouchMoveDollyRotate( event );

				scope.update();

				break;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		handleTouchEnd( event );

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );

	scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
	scope.domElement.addEventListener( 'wheel', onMouseWheel, false );

	scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
	scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
	scope.domElement.addEventListener( 'touchmove', onTouchMove, false );

	window.addEventListener( 'keydown', onKeyDown, false );

	// force an update at start

	this.update();

};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;


// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
// This is very similar to OrbitControls, another set of touch behavior
//
//    Orbit - right mouse, or left mouse + ctrl/meta/shiftKey / touch: two-finger rotate
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - left mouse, or arrow keys / touch: one-finger move

THREE.MapControls = function ( object, domElement ) {

	THREE.OrbitControls.call( this, object, domElement );

	this.mouseButtons.LEFT = THREE.MOUSE.PAN;
	this.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;

	this.touches.ONE = THREE.TOUCH.PAN;
	this.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

};

THREE.MapControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.MapControls.prototype.constructor = THREE.MapControls;

 return THREE.OrbitControls;
});
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

define('Viewport',["three", "lodash", "backbone", "cmd", 
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

