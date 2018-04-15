define(["./Loop"], function( Loop ){


//////////////////////////////////////////////////////////////////////////////////
//		PriorityLoop            					//
//////////////////////////////////////////////////////////////////////////////////

var PriorityLoop	= function(){
    this._fcts	= [];
};

PriorityLoop.prototype.add	= function( priority, fct ){
	this._fcts[priority]	= this._fcts[priority] || [];
	console.assert(this._fcts[priority].indexOf(fct) === -1);
	this._fcts[priority].push(fct);
	return fct;
};

PriorityLoop.prototype.remove	= function( priority, fct ){
	var index	= this._fcts[priority].indexOf(fct);
	console.assert(index !== -1);
	this._fcts[priority].splice(index, 1);
	this._fcts[priority].length === 0 && delete this._fcts[priority];
};

PriorityLoop.prototype.update	= function( delta ){
	// run all the hooks - from lower priority to higher - in order of registration
	for(var priority = 0; priority <= this._fcts.length; priority++){
		if( this._fcts[priority] === undefined )	continue;
		var callbacks	= this._fcts[priority].slice(0);
		for(var i = 0; i < callbacks.length; i++){
			callbacks[i](delta);
		}
	}
};

return PriorityLoop;

});
