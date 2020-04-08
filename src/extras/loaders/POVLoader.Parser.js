/**
 * @author:			macrocom by Richard Herrmann
 * @last modified:	2015-06-17
 */
define(["three"], function( THREE ){

THREE.POVLoader = function () {
    var pov = null;
    var readyCallbackFunc = null;

    // lists of THREE.js objects

    var groupOpen = false;
    var currentTextureName = '';
    //var mesh = 0;
    var counter = 0;
    var lines ;
    var res;
    var lastMaterialIndex = 0;

    var texture;

    var geometry;
    var geometries = [];

    var material;
    var materials = [];

    var reflectance = [];
    var reflectances = [];


    var camera;
    var cameras = [];
    var materialWithCameraNames = [];




    var light;
    var lights = [];

    var imageTextures = [];


    var textureTransforms = [];


    var shapes = [];

    var transforms = [];

    var group ;
    var groups = [];

    var scene;
    var scenes = [];

    var DEFines = []; // list of DEFs for x3d fields

    // the root node
    var mainScene = new THREE.Object3D();
    mainScene.name = generateUniqueDEF( "scene" );

    var result = {     // finally here we store the scene
        scene: new THREE.Object3D(),
        lights: [],
        cameras:[],
        geometries:[],
        materials:[],
        reflectances:[]
    };


    // local root directory for relative position of e.g. textures or other source files
    var baseUrl;

    // some constants
    const AMBIENT = 0 ;     // in setDefaultMaterial
    const DIFFUSE = 1 ;
    const SPECULAR = 2 ;


    // options: public properties, may be used to communicate with the renderer too

    var pigment = {
        name: '',                           // string:      name
        rgb: new THREE.Color(0.0,0.0,0.0),  // float:       ambient intensity
        transmit: 0.0,
        uv_mapping: false,                  // bool:       diffuse intensity
        url: ''                             // string:       diffuse intensity
    };

    var normal = {
        name: '',                           // string:      name
        bump_size: 0.5 ,                     // float:       bump intensity
        uv_mapping: false,                  // bool:        diffuse intensity
        url: ''                             // string:      diffuse intensity
    };

    var finish = {
        name: '',                       // string:      name
        ambient: 0.0,                   // float:       ambient intensity
        diffuse: 0.0,                   // float:       diffuse intensity
        specular: 0.0,                  // float:       diffuse intensity
        reflection: 0.0,                // float:       diffuse intensity
        brilliance: 0.0,                // float:       diffuse intensity
        metallic: 0.0                   // float:       diffuse intensity
    };

    // object contains information for tiling a texture
    var tile = {
        name: '',                       // string:      name
        size:{u:1000, v:1000},          // floats:      length and width of tile
        rotation:0.0,                   // float:       rotation angle
        offset:{x:0, y:0}          // floats:      translation
    };

    var options = {
        reflections: {boden: 0.95, front: 0.0},          // float>0:     boden reflections
        backgroundColor: 0x111111,      // color:       may be used by the renderer to setClearColor( THREE.Color )
        bump: true,                     // boolean:     apply bump
        bumpFactor: 1,                  // boolean:     apply bump
        castShadows: true,              // boolean:     meshes cast shadows
        castShadowsLight: true,         // boolean:     light cast shadows
        cameraResolution : 256,
        creaseAngleThreshold: 0.1,      // float >0:    IFS > face normals > Threshold -> smooth
        defaultMaterial: SPECULAR,      // integer:     allowed values AMBIENT, DIFFUSE, SPECULAR
        enableLights: false,             // boolean:     in IndexedFaceSet -> geometry : automatic normals calculation flat
        enableCameras: false,           // boolean:     in IndexedFaceSet -> geometry : automatic normals calculation flat
        faceNormals: false,             // boolean:     in IndexedFaceSet -> geometry : automatic normals calculation flat
        forcePosition: 0,               // integer:     in IndexedFaceSet -> geometry : automatic normals calculation flat
        lightIntensity: .75,           // float:       in IndexedFaceSet -> geometry : automatic normals calculation flat
        precision: 16,                  // integer:     set precision (number of segments) in Graphic primitives (sphere, cylinder, cone..)
        scale: 1.0,                     // float:       apply bump (experimental)
        showDeko: true,                 // boolean:     should deko be shown
        solid: false,                   // boolean:     apply bump (experimental)
        statistics: false,              // boolean:     show statistics
        thresholdReflection : 0.4,
        verbose: false,                  // boolean:     console output maximal
        vertexNormals: false,           // boolean:     in IndexedFaceSet -> geometry : automatic normals calculation smooth
        useTextures: true,              // boolean:     in IndexedFaceSet -> geometry : automatic normals calculation smooth
        povUnit: 1.0                    // float >0:    overall scale
    };

    // loader to fetch data
    function load ( url, readyCallback, progressCallback ) {
        var length = 0;
        if ( document.implementation && document.implementation.createDocument ) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if( request.readyState === 4 ) {
                    if( request.status === 0 || request.status === 200 ) {
                        if ( request.responseXML ) {
                            readyCallbackFunc = readyCallback;
                            parse( request.responseXML, undefined, url );
                        } else if ( request.responseText ) {
                            readyCallbackFunc = readyCallback;
                            parse( request.responseText, undefined, url );
                        } else {
                            console.error( "PovLoader: Empty or non-existing file (" + url + ")" );
                        }
                    }
                } else if ( request.readyState === 3 ) {
                    if ( progressCallback ) {
                        if ( length === 0 ) {
                            length = request.getResponseHeader( "Content-Length" );
                        }
                        progressCallback( { total: length, loaded: request.responseText.length } );
                    }
                }
            };
            request.open( "GET", url, true );
            request.send( null );
        } else {
            alert( "Don't know how to parse XML!" );
        }
    }

    // parser public method
    // purpose: generate scenegraph from
    // doc: document to parse
    // callBack: function call when parsed
    // url: full path to data
    function parse( doc, callBack, url ) {


        pov = doc;
        callBack = callBack || readyCallbackFunc;

        generateBaseUrl( url ) ;
        setDefaultMaterial();
        checkText(pov);

        if(options.statistics)  getStatistics();

        /*
         generateCamera(materials[52]);
         generateCamera(materials[48]);
         generateCamera(materials[38]);
         */
        // 229
        // 230

        for (i = 0; i < groups.length; i++){

            result.scene.add( groups[i] );

            if( groups[i].name.indexOf( 'Boden' ) > -1 && options.reflections.boden > 0 && options.reflections.boden < 1){
                reflectance = [];
                reflectance[0] = groups[i].children[0].geometry;
                reflectance[1] = groups[i].children[0].material;
                reflectance[2] = groups[i];
                reflectance[1].userData = { type: 'boden', opacity: options.reflections.boden, rotation: tile.rotation, size: tile.size };
                reflectances.push( reflectance );
            }

            if(options.reflections.front > 0 && options.reflections.front < 1){
                if( groups[i].children[0].material.name.indexOf( 'Textur42' ) > -1 ){
                    reflectance = [];
                    reflectance[0] = groups[i].children[0].geometry ;
                    reflectance[1] = groups[i].children[0].material ;
                    reflectance[1].userData = { type: 'front', opacity: options.reflections.front };
                    reflectance[2] = groups[i];
                    reflectances.push( reflectance );
                }
            }
        }

        // lights from scene
        for (var i = 0; i < lights.length; i++){
            lights[i].castShadow = options.castShadowsLight;
        }


        if(options.enableLights){
            for (var i = 0; i < lights.length; i++){
                result.scene.add(lights[i]);
            }
        }

        // publish lists
        result.lights = lights;
        result.cameras = cameras;
        result.geometries = geometries;
        result.materials = materials;
        result.reflectances = reflectances;

        result.scene.scale.multiplyScalar( options.povUnit );

        // good bye!
        if ( callBack ) {
            callBack( result );
        }
        return result;
    }

    //**************************************************************************************************
    // end of main method
    //**************************************************************************************************

    // function list

    function checkText ( text ) {

        lines = text.split( '\n' );
        for ( var i = 0; i < lines.length; i ++ ) {
            var line = lines[i];
            line = line.trim();
            var parts = line.split(" ");

            if (line.length === 0) {
                //   continue;   // empty line


            } else if (/^#declare /.test(line)) { // material definitions
                if (line.indexOf('= pigment') > -1) {
                    pigment.name = parts[1];
                    parsePigment(line);
                }   else if (line.indexOf('= finish') > -1) {
                    finish.name = parts[1];
                    parseFinish(line);
                }   else if (line.indexOf('= normal') > -1) {
                    normal.name = parts[1];
                    parseNormal(line);
                }   else if (line.indexOf('= texture') > -1) {
                    parseTexture(parts);
                }


            } else if (/^\/\/!#declare/.test(line)) { // our extensions
                console.log(line);
                if (line.indexOf('= textureTransform') > -1) {
                    tile.name = parts[1];
                    parseTile(line);
                }
            } else if (/^mesh /.test(line)) { // group starts
                generateNewGroup(lines[i - 1]);


            } else if (line.indexOf('//! tile_size') > -1) { // read tile info
                res = getAttributeTileSize(line);  // 3 floats will do
                if (res != null) {
                    tile.size.u = res[0];
                    tile.size.v = res[1];
                }

            } else if (line.indexOf('//! tile_rotation') > -1) { // read tile info
                var value = getAttributeFloat(line, 'tile_rotation');
                if (value != null) tile.rotation = value; // set value or default

            } else if (/^light_source /.test(line)) { // light sources
                light = new THREE.SpotLight(0xFFFFFF, options.lightIntensity);
                light.name = generateUniqueDEF('light');

                res = getAttributeColor(lines[i+1]);
                vert1 = new THREE.Vector3(-res[0], res[1], res[2]) ;
                vert1.multiplyScalar(options.scale);
                light.position.set(vert1.x,vert1.y,vert1.z);

                res = getAttributeColor(lines[i+5]);
                vert1 = new THREE.Vector3(-res[0], res[1], res[2]) ;
                vert1.multiplyScalar(options.scale);
                light.target.position.set(vert1.x,vert1.y,vert1.z);

                lights.push(light) ;

            } else if (/^smooth_triangle /.test(line)) { // material definitions
                var p = lines[i+6].split(' ');           // line with texture name
                if(currentTextureName == '') currentTextureName = p[6]; // if there is no texture name, give it the actual
                if(currentTextureName != p[6]){                         // texture name change
                    var name = geometry.name;
                    if (name == '') generateNewGroup(lines[i - 1]);
                    else generateNewGroup(name);
                }
                res = getAttribute2FloatsInLine(lines[i+1]);
                var vert1 = new THREE.Vector3(-res[0], res[1], res[2]) ;
                var norm1 = new THREE.Vector3(-res[3], res[4], res[5]) ;
                vert1.multiplyScalar(options.scale);
                geometry.vertices.push(vert1) ;

                res = getAttribute2FloatsInLine(lines[i+2]);
                var vert2 = new THREE.Vector3(-res[0], res[1], res[2]) ;
                var norm2 = new THREE.Vector3(-res[3], res[4], res[5]) ;
                vert2.multiplyScalar(options.scale);
                geometry.vertices.push(vert2) ;

                res = getAttribute2FloatsInLine(lines[i+3]);
                var vert3 = new THREE.Vector3(-res[0], res[1], res[2]) ;
                var norm3 = new THREE.Vector3(-res[3], res[4], res[5]) ;
                vert3.multiplyScalar(options.scale);
                geometry.vertices.push(vert3) ;

                var face = new THREE.Face3(counter, counter+1, counter+2);
                if(!options.faceNormals && !options.faceNormals) { //use normals from povray
                    face.vertexNormals[0] = norm1;
                    face.vertexNormals[1] = norm2;
                    face.vertexNormals[2] = norm3;
                }
                geometry.faces.push(face) ;
                var uvs = getAttribute3FloatsInLine(lines[i+5]);
                geometry.faceVertexUvs[0].push ([
                    new THREE.Vector2(  uvs[0],  uvs[1]  ),    // TL
                    new THREE.Vector2(  uvs[2],  uvs[3]  ),    // BL
                    new THREE.Vector2(  uvs[4],  uvs[5]  )     // TR
                ]);
                counter += 3;
            }
        }

        //mesh = new THREE.Mesh( geometry, materials[lastMaterialIndex] );
        if( groupOpen == true ) {
            material = materials[isNameInList(currentTextureName, materials)];
            mesh = new THREE.Mesh( geometry, material );
            if (options.castShadows && group.name.indexOf('no_shadow') == -1){
                mesh.castShadow = true;
            }
            if (options.castShadows)  mesh.receiveShadow = true;
            var index = isInList(material.name, materialWithCameraNames);
            // ToDo
            if (index != null){
                //generateCamera(mesh, material);
            }

            group.add(mesh);
            geometry.name = group.name;
            geometries.push(geometry);
            groups.push(group);
            groupOpen = false;
        }
    }
    function generateBaseUrl( url ){

        if ( url !== undefined ) {
            var parts = url.split( '/' );
            parts.pop();
            baseUrl = ( parts.length < 1 ? '.' : parts.join( '/' ) ) + '/';
        }
    }
    function generateNewGroup( lin ){

        if( groupOpen == true ) {  // closing old mesh
            lastMaterialIndex = isNameInList(currentTextureName, materials);
            if(options.faceNormals)
                geometry.computeFaceNormals();
            if(options.vertexNormals && options.faceNormals)
                geometry.computeVertexNormals();
            if(options.vertexNormals && !options.faceNormals){
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
            }

            geometry.name = group.name;
            geometries.push(geometry);
            material = materials[isNameInList(currentTextureName, materials)];
            mesh = new THREE.Mesh( geometry, material );

            var index = isInList(material.name, materialWithCameraNames);
            // ToDo
            if (index != null){
                //generateCamera(mesh, material);
            }

            if (options.castShadows && group.name.indexOf('no_shadow') == -1){
                mesh.castShadow = true;
            }

            if (options.castShadows)  mesh.receiveShadow = true;

            group.add(mesh);
            groups.push(group);
            groupOpen = false;
        }
        if( groupOpen == false) {  // opening new mesh
            currentTextureName = '';
            group = new THREE.Object3D();
            groupOpen = true;
            group.name = getAttributeMeshName(lin); // give a name
            geometry = new THREE.Geometry();
            counter = 0;
        }
    }
    function generateCamera( obj, mat ){

        //camera  = new THREEx.CubeCamera( obj );
        //camera.name = mat.name;
        //mat.envMap = camera.textureCube;
        //cameras.push(camera);
    }
    function generateUniqueDEF( prefix ) {
        var counter = DEFines.length-1;
        var validDef = prefix + "_" + counter; // try a possible name

        while( isInList( validDef, DEFines ) )
            validDef = prefix +  "_" + ++counter; // count up until we find a new name
        DEFines.push(validDef);
        return validDef;
    }
    function getAttributeFloat( line, token ) {
        line.replace(/,/g, ' ') ;
        line.replace('{', ' ') ;
        line.replace('}', ' ') ;
        var parts = line.split( " " );
        for (var i = 0; i < parts.length-1; i++ )
            if (parts[i] == token) return parseFloat(parts[i+1]);
        return null; // not found
    }
    function getAttributeColor( line ) {
        var start = line.indexOf('<');
        if (start == -1) return null;
        var stop = line.indexOf('>');
        if (stop == -1) return null;
        var len = stop - start;
        if (len == 0) return null;

        var str = line.substr(start + 1, len - 1);
        var parts = str.split( "," );
        if (parts.length == 3 ){
            return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
        }
        if (parts.length == 4 ){
            return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
        }
        return null; // not found
    }
    function getAttributeTileSize( line ) {
        var start = line.indexOf('<');
        if (start == -1) return null;
        var stop = line.indexOf('>');
        if (stop == -1) return null;
        var len = stop - start;
        if (len == 0) return null;

        var str = line.substr(start + 1, len - 1);
        var parts = str.split( "," );
        if (parts.length == 2 ){
            return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
        }
        return null; // not found
    }
    function getAttribute2FloatsInLine( line ) {
        var myLine = line;
        var res = [];
        for(var i=0; i<2; i++) {
            var start = myLine.indexOf('<');
            if (start == -1) return null;
            var stop = myLine.indexOf('>');
            if (stop == -1) return null;
            var len = stop - start;
            if (len == 0) return null;
            var str = myLine.substr(start + 1, len - 1);
            var parts = str.split(",");
            res.push(parts[0]);
            res.push(parts[1]);
            res.push(parts[2]);
            myLine = myLine.substr(stop+2);
        }
        return(res);
    }
    function getAttribute3FloatsInLine( line ) {
        var myLine = line;
        var res = [];
        for(var i=0; i<3; i++) {
            var start = myLine.indexOf('<');
            if (start == -1) return null;
            var stop = myLine.indexOf('>');
            if (stop == -1) return null;
            var len = stop - start;
            if (len == 0) return null;
            var str = myLine.substr(start + 1, len - 1);
            var parts = str.split(",");
            res.push(parts[0]);
            res.push(parts[1]);
            myLine = myLine.substr(stop+3);
        }
        return(res);
    }
    function getAttributeMeshName( line ) {
        var start = line.indexOf('//');
        if (start == -1) return 'noName';
        return(line.substr(3));

    }
    function getAttributeTextureUrl( line ) {
        var token = '';
        if(line.indexOf('.jpg') > -1) token = 'jpeg';
        if(line.indexOf('.png') > -1) token = 'png';
        if(line.indexOf('.gif') > -1) token = 'gif';
        if (token == '') return null;

        var start = line.indexOf(token);
        if (start == -1) return null;
        var stop = line.indexOf('}');
        if (stop == -1) return null;
        var len = stop - start;
        if (len == 0) return null;

        var str = line.substr(start , len);
        var parts = str.split( " " );
        parts[1]= parts[1].replace(/"/g,"");

        return parts[1];
    }
    function getAttributeBumpSize( line ) {

        var start = line.indexOf('bump_size');
        if (start == -1) return 0;

        var str = line.substr(start);
        var parts = str.split( " " );
        return parts[1];
    }
    function getStatistics(){
        var counterFaces = 0;
        var counterVertices = 0;

        console.log( "// begin Statistics" );
        console.log( shapes.length + "  <Shape> nodes");

        for ( i = 0; i < geometries.length; i++ ){
            counterFaces += geometries[i].faces.length;
            counterVertices += geometries[i].vertices.length;
            console.log(geometries[i]);
        }
        console.log( counterVertices + "  vertices");
        console.log( counterFaces + "  faces");

        console.log( materials.length + "  <Material> nodes");
        console.log( imageTextures.length + "  <ImageTexture> nodes");
        console.log( textureTransforms.length + "  <TextureTransforms> nodes");


        console.log( transforms.length + "  <Transform> nodes");
        console.log( groups.length + "  <Group> nodes");
        console.log( scenes.length + "  <Scene> nodes");

        console.log('list of group names:');

        for (var i = 0; i < groups.length; i++){
            if(groups[i].name.indexOf('noName') == -1) console.log(groups[i].name);
        }
        console.log( "//  end statistics");

    }
    function isInList( name, names ) {
        for ( var i = 0; i <  names.length; i++ ){
            if ( name == names[ i ] ) return i;
        }
        return null;
    }
    function isNameInList( name, list ) {
        for ( var i = 0; i <  list.length; i++ ){
            if ( name == list[ i ].name ) return i;
        }
        return -1;
    }

    function parseFinish( line ) {
        var value;

        value = getAttributeFloat(line, 'ambient');
        if (value != null) finish.ambient = value; // set value or default
        value = getAttributeFloat(line, 'diffuse');
        if (value != null) finish.diffuse = value; // set value or default
        value = getAttributeFloat(line, 'reflection');
        if (value != null) {
            finish.reflection = value; // set value or default
        }
        value = getAttributeFloat( line, 'specular' );
        if (value != null) finish.specular =  value ; // set value or default
        value = getAttributeFloat( line, 'brilliance' );
        if (value != null) finish.brilliance =  value ; // set value or default
        value = getAttributeFloat( line, 'metallic' );
        if (value != null) finish.metallic =  value ; // set value or default

        if (options.verbose) console.log(finish);
    }
    function parseNormal( line ) {
        var value;
        value = getAttributeTextureUrl( line) ;
        if (value != null) {
            normal.uv_mapping = true;
            normal.url = value;
            if(value.indexOf('.bmp')> -1 ) console.error('not a valid texture type .bmp ', value );
            normal.bump_size = getAttributeBumpSize(line);
        }
        else{
            normal.uv_mapping = false;
            normal.url = '';
            normal.bump_size = 0;
        }

        if (options.verbose) console.log(pigment);
    }
    function parsePigment( line ) {
        var value;
        value = getAttributeColor( line );
        if (value != null && value.length == 3 ) {
            pigment.rgb  =  new THREE.Color( value[0], value[1], value[2] );
        }
        if (value != null && value.length == 4 ) {
            pigment.rgb  =  new THREE.Color( value[0], value[1], value[2] );
            pigment.transmit  =  value[3];
        }

        value = getAttributeTextureUrl( line) ;

        if (value != null) {
            pigment.uv_mapping = true;
            pigment.url = value;
            if(line.indexOf('transmit')> -1 ){
                var parts = line.split( " " );
                if (parts[16] == 'all') {
                    pigment.transmit = 0.75;   // just to see a little bit
                }
                else{
                    pigment.transmit = 1-parts[16];
                    pigment.transmit =0.15;
                }
            }
            if(value.indexOf('.bmp')> -1 ) console.error('not a valid texture type .bmp ', value );
        }
        else{
            pigment.uv_mapping = false;
            pigment.url = '';

        }

        if (options.verbose) console.log(pigment);
    }
    function parseTile( line ) {
        var value;

        value = getAttributeFloat(line, 'rotation');
        if (value != null) tile.rotation = value; // set value or default

        var parts = line.split( " " );

        for (var i = 0; i < parts.length; i++){
            if( parts[i] == 'size') {
                tile.size.u = parseFloat( parts[i+2] );
                tile.size.v = parseFloat( parts[i+3] );
            }
            if( parts[i] == 'offset') {
                tile.offset.x = parseFloat( parts[i+2] );
                tile.offset.y = parseFloat( parts[i+3] );
            }
        }

        if (options.verbose) console.log(tile);
    }
    function parseTexture( parts ) {

        var factor = 1.0;
        var repeat = 0.999999;
        var link;

        var ambientColor = new THREE.Color(factor*finish.ambient * pigment.rgb.r, factor*finish.ambient * pigment.rgb.g, factor*finish.ambient * pigment.rgb.b );
        var diffuseColor = new THREE.Color(factor*finish.diffuse * pigment.rgb.r, factor*finish.diffuse * pigment.rgb.g, factor*finish.diffuse * pigment.rgb.b );
        var specularColor = new THREE.Color(factor*finish.specular * pigment.rgb.r, factor*finish.specular * pigment.rgb.g, factor*finish.specular * pigment.rgb.b );

        material = new THREE.MeshPhongMaterial({
            name :   parts[1],
            ambient: ambientColor,
            color: diffuseColor,
            specular: specularColor
        });

        if(finish.brilliance > 1)
            material.shininess = 30.0*finish.brilliance;  // shininess = 30 is the default for THREE js

        if( options.solid ) material.side = THREE.DoubleSide;

        if(pigment.transmit > 0 ){
            material.transparent = true;
            if(pigment.transmit > 1) pigment.transmit = 1;
            material.opacity = Math.abs( 1 - pigment.transmit );
            //if (material.opacity <= .25) {material.opacity = Math.sqrt(material.opacity + .03) }
            var b0 = 0.321;  // 1. Berndsche Konstante
            material.opacity = b0 +( 1 - b0 )* material.opacity;
            material.specular = new THREE.Color(1,1,1);
           // material.emissive = new THREE.Color(0.5,0.5,0.5);
        }

        if (pigment.uv_mapping){
            link =  baseUrl + pigment.url ;
            texture = THREE.ImageUtils.loadTexture( link );
            texture.wrapS =  THREE.RepeatWrapping ;
            texture.wrapT = THREE.RepeatWrapping  ;
            texture.repeat.set( repeat, repeat ) ;
            material.map = texture;
            material.specularMap = texture;
            material.diffuseMap =  texture;
            material = new THREE.MeshPhongMaterial({map: texture, specularMap: texture, diffuseMap: texture, name: parts[1] });
            //if(pigment.transmit > 0)  material.transparent = true;
            if(pigment.transmit > 0 ){
                material.transparent = true;
                material.depthWrite = false;
                if(pigment.transmit > 1) pigment.transmit = 1;
                material.opacity = Math.abs( 1 - pigment.transmit );
                //if (material.opacity <= .25) {material.opacity = Math.sqrt(material.opacity + .3) }
                var b0 = 0.321;  // 1. Berndsche Konstante
                material.opacity = b0 +( 1 - b0 )* material.opacity;
                material.specular = new THREE.Color(1,1,1);
            //    material.emissive = new THREE.Color(0.5,0.5,0.5);
            }
        }

        if (normal.uv_mapping && options.bump){
            link =  baseUrl + normal.url ;
            texture = THREE.ImageUtils.loadTexture( link );
            texture.wrapS =  THREE.RepeatWrapping ;
            texture.wrapT = THREE.RepeatWrapping  ;
            texture.repeat.set( repeat, repeat ) ;
            material.bumpMap = texture;
            material.bumpScale = 0.05*normal.bump_size*options.bumpFactor;
        }

        if (finish.reflection > options.thresholdReflection){
            materialWithCameraNames.push(material.name);
        }

        if (tile.name != ''){
            material.map.repeat.set(tile.size.u, tile.size.v);
            material.map.offset.set(tile.offset.x, tile.offset.y);
            material.bumpMap.repeat.set(tile.size.u, tile.size.v);
            material.bumpMap.offset.set(tile.offset.x, tile.offset.y);

            material.userData = {rotation: tile.rotation, size: tile.size, offset: tile.offset };


            material.userData += tile;
            setDefaultTile();
        }

        materials.push(material) ;

        pigment.transmit = 0;
        pigment.uv_mapping = false;
        normal.uv_mapping = false;
    }

    function setDefaultMaterial() {
        var ambientColor;
        var diffuseColor;
        var specularColor;

        ambientColor = new THREE.Color(  0.4, 0.0, 0.4 ); // set value or default
        diffuseColor =  new THREE.Color( 0.8, 0.8, 0.8 ); // set value or default
        specularColor = new THREE.Color( 1.0, 1.0, 1.0 ); // set value or default

        if ( options.defaultMaterial == SPECULAR )
            material = new THREE.MeshPhongMaterial( {
                ambient: ambientColor,
                color: diffuseColor,
                specular: specularColor
            } );

        if ( options.defaultMaterial == DIFFUSE )
            material = new THREE.MeshLambertMaterial( {
                ambient: ambientColor,
                color: diffuseColor
            } );

        if ( options.defaultMaterial == AMBIENT )
            material = new THREE.MeshBasicMaterial( {
                color: ambientColor
            } );

        if( options.solid ) material.side = THREE.DoubleSide;

        // give a name
        material.name =  generateUniqueDEF( 'material_default' ) ;
        materials.push( material );
    }

    function setDefaultTile() {
        // object contains information for tiling a texture
        tile.name = '';
        tile.size.u = 1000;
        tile.size.v = 1000;
        tile.rotation = 0.0;
        tile.offset.x = 0;
        tile.offset.y = 0;
    }

    return {
        load: load,
        parse: parse,
        geometries : geometries,
        materials : materials,
        reflectances : reflectances,
        lights: lights,
        cameras: cameras,
        options: options
    };
};
return THREE.POVLoader;

});