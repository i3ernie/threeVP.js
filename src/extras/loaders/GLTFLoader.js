/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "vendor/three/loaders/GLTFLoader", "lodash"], function( THREE, THREEGLTFLoader, _ ){
    var GLTFLoader = function ( manager, logger )
    { 
        THREEGLTFLoader.call( this, manager, logger );
    };

    GLTFLoader.prototype = _.create( THREEGLTFLoader.prototype, {
        constructor : GLTFLoader,
        
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

    return GLTFLoader;
});

