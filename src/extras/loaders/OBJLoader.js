/* 
 * To change this license header, choose License Headers in Project Propertiecreates.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "vendor/three/loaders/OBJLoader", "lodash"], function( THREE, ThreeOBJLoader, _ ){
    const OBJLoader = function ( manager, logger )
    { 
        ThreeOBJLoader.call( this, manager, logger );
    };

    OBJLoader.prototype = Object.assign( Object.create( ThreeOBJLoader.prototype ), {
        constructor : ThreeOBJLoader,
        
        load : function( url, onLoad, onProgress, onError )
        {
            onLoad = onLoad || function(){};
            if( url === null || url === undefined || url === "" ) {
                onLoad( null );
            };
            var scope = this;

            var path = scope.path === undefined ? THREE.LoaderUtils.extractUrlBase( url ) : scope.path;

            require(["text!" + url], function ( responseText ) {
                var fnc = onLoad || function(){}; 
                fnc ( scope.parse( responseText, path ) );
            }, onError);
        }
        
    });

    return OBJLoader;
});

