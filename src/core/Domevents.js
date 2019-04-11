define(["three"], function( THREE ){

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