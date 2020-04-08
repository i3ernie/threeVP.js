/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "vendor/three/loaders/STLLoader", "lodash"], function( THREE, ThreeSTLLoader, _ ){
    var STLLoader = function ( manager, logger )
    { 
        ThreeSTLLoader.call( this, manager, logger );
    };

    STLLoader.prototype = _.create( ThreeSTLLoader.prototype, {
        constructor : STLLoader,
        
        load : function(url, onLoad, onProgress, onError)
        {
            onLoad = onLoad || function(){};
            if( url === null || url === undefined || url === "" ) {
                onLoad( null );
            };
            var scope = this;

            var path = scope.path === undefined ? THREE.LoaderUtils.extractUrlBase( url ) : scope.path;

            require(["text!" + url], function ( responseText ) {
                var fnc = onLoad || function(){};
                try{
                    fnc ( scope.parse( responseText, path ) );
                }
                catch( e ){
                    onError ( e );
                }
                
            }, onError);
        }
        
    });

    return STLLoader;
});

