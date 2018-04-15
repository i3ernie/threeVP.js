define(["lodash"], function( _ ){
    
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
    Loop.prototype.update = function( delta ){
        _.each(this._fcts, function( fct ){
            fct( delta );
        });
    };

return Loop;

});