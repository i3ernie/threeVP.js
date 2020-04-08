/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(["three", "STLLoader", "ColladaLoader", "OBJLoader", "MTLLoader"], function( THREE, STLLoader, ColladaLoader, OBJLoader, MTLLoader ) {

    var UniversalLoader = function(){
        
    };

    UniversalLoader.prototype.load = function( urls, onLoad, onError ){
	
        // handle arguments polymorphism
	if( typeof(urls) === 'string' )	urls	= [urls];

	// load stl
	if( urls[0].match(/\.stl$/i) && urls.length === 1 ){
		this.loader	= new STLLoader();
		this.loader.addEventListener('load', function( event ){
			var geometry	= event.content;
			var material	= new THREE.MeshPhongMaterial();
			var object3d	= new THREE.Mesh( geometry, material );
			onLoad(object3d);
		});
		this.loader.load(urls[0]);
                
		return;
                
	}else if( urls[0].match(/\.dae$/i) && urls.length === 1 ){
		this.loader = new ColladaLoader();
		this.loader.options.convertUpAxis = true;
		this.loader.load(urls[0], function( collada ){
                    // console.dir(arguments)
                    var object3d = collada.scene;
                    onLoad( object3d );
		}, null, onError);
		return;
                
	}else if( urls[0].match(/\.js$/i) && urls.length === 1 ){
		this.loader = new THREE.JSONLoader();
		this.loader.load(urls[0], function(geometry, materials){
			if( materials.length > 1 ){
				var material	= new THREE.MeshFaceMaterial(materials);
			}else{
				var material	= materials[0];
			}
			var object3d	= new THREE.Mesh(geometry, material);
			onLoad(object3d);
		});
		return;
                
	}else if( urls[0].match(/\.obj$/i) && urls.length === 1 ){
		this.loader = new OBJLoader();
		this.loader.load(urls[0], function(object3d){
			onLoad(object3d);
		});
		return;
        }else if( urls[0].match(/\.mtl$/i) && urls.length === 1 ){
		this.loader	= new MTLLoader();
		this.loader.load(urls[1], urls[0], function( material ){
			onLoad( material );
		});
		return;
                        
	}else if( urls.length === 2 && urls[0].match(/\.mtl$/i) && urls[1].match(/\.obj$/i) ){
            _loadOBJMTL( [urls[1], urls[0]], onLoad, onError );
            return;
                
	}else if( urls.length === 2 && urls[0].match(/\.obj$/i) && urls[1].match(/\.mtl$/i) ){
            _loadOBJMTL( urls, onLoad, onError );
            return;
                
	}else	console.assert( false );
    };
    
    var _loadOBJMTL = function( urls, onLoad, onError ){
        
        var mtlLoader = new MTLLoader();
            //mtlLoader.setPath( 'models/obj/male02/' );
        
        mtlLoader.load( urls[1], function( materials ) {
            materials.preload();
            var objLoader = new OBJLoader();
            objLoader.setMaterials( materials );
            //objLoader.setPath( 'models/obj/male02/' );
            objLoader.load( urls[0], function ( object3d ) {

                onLoad( object3d );
            }, null, onError );
        });
        
    };
    
    return UniversalLoader;
});
