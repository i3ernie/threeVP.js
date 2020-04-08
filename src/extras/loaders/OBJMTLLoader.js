define(["lodash", "OBJLoader", "MTLLoader", "url"], function( _, OBJLoader, MTLLoader, URL ) {
    
    let defaults = {
        rootPath : ""
    };
    
    let OBJMTLLoader = function ( opts )
    {
        this.parser = {
            mtl: new MTLLoader( ),
            obj: new OBJLoader( )
        };
        
        this.options = _.extend( {}, defaults, opts );
        
        this.parser.mtl.crossOrigin = "anonymous";
        this.options.rootPath = URL.currentScriptURL();
    };

    OBJMTLLoader.prototype.load = function( url, mtl, onReady, onError )
    {
        let callback = onReady || function(){};
        onError = onError || function( err ){
            console.error( "ERROR: OBJMTLLoader.require()", err );
        };
        
        if( url === null || url === undefined || url === "" ||
            mtl === null || mtl === undefined || mtl === "") {
            console.error("ERROR OBJMTLLoader: url and mtl needed");
            callBack( null );
        }

        var mtlLoader = this.parser.mtl;
        let path = this.options.rootPath + mtl.substring( 0, mtl.lastIndexOf("/") ) + "/";
        mtlLoader.setPath( path );
        mtlLoader.setResourcePath( path );
        
        let objLoader = this.parser.obj;
        objLoader.setPath( url.substring(0, url.lastIndexOf("/")) + "/" );

        require(["text!" + mtl], function ( responseText ) {
            try {
            
                let materials = mtlLoader.parse( responseText );
                materials.preload();

                require(["text!" + url], function ( responseText ) {
                    objLoader.setMaterials( materials );
                    var obj = objLoader.parse( responseText );
                    callback( obj );
                }.bind(this), onError);
                
            } catch( e ){
                console.error("EROR: OBJMTLLoader()", e );
                callback( null );
            }

        }.bind(this), onError);
    };

    return OBJMTLLoader;
});
