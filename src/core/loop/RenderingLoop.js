define(["core/loop/Loop", "lodash"], function( Loop, _ ){
    
//////////////////////////////////////////////////////////////////////////////////
//		THREEx.RenderingLoop						//
//////////////////////////////////////////////////////////////////////////////////
var RenderingLoop	= function()
{
    Loop.call(this);

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
		this.update( deltaMsec/1000 );
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
