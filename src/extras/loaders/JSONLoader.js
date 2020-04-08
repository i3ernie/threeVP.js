/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "lodash", "ThreeJSONLoader"], function( THREE, _, ThreeJSONLoader ){
    const JSONLoader = function ()
    {
        ThreeJSONLoader.call( this );
    };

    JSONLoader.prototype = _.create( ThreeJSONLoader.prototype, {
        constructor : JSONLoader,
        
        load : function( url, onLoad, onProgress, onError )
        {
            var scope = this;
            var path = scope.path === undefined ? THREE.LoaderUtils.extractUrlBase( url ) : scope.path;
            onLoad = onLoad || function(){};
            
            if( url === null || url === undefined || url === "" ) {
                onLoad( null );
            };

            require(["text!" + url], function ( responseText ) {
                
                var fnc = onLoad || function(){};
                fnc ( scope.parse( responseText, path ) );
                
            }, onError);
        }
        
    });

    return JSONLoader;
});

