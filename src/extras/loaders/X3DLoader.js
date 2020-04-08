/**
* @author:			macrocom by Richard Herrmann
* @last modified:	2015-06-17
*/
define(["jquery", "three"], function( $, THREE ){

THREE.X3DLoader = function () {

    // some constants
    const DIFFUSE = 0 ;
    const SPECULAR = 1 ;

    const CYLINDER = 2;
    const TRIANGLE = 3 ;

    const NOEXIST = -1 ;     // in parseIndexedFaceSet

    // options: public properties, may be used to communicate with the renderer too
    var options = {
        backgroundColor: 0x111111,      // color:       may be used by the renderer to setClearColor( THREE.Color )
        bump: false,                    // boolean:     apply bump (experimental)
        creaseAngleThreshold: 0.1,      // float >0:    IFS > face normals > Threshold -> smooth
        defaultMaterial: SPECULAR,      // integer:     allowed values DIFFUSE, SPECULAR
        precision: 16,                  // integer:     set precision (number of segments) in Graphic primitives (sphere, cylinder, cone..)
        solid: false,                   // boolean:     apply bump (experimental)
        statistics: false,               // boolean:     apply bump (experimental)
        textureMapping: CYLINDER,       // integer:     allowed values CYLINDER
        faceNormals: true,              // boolean:     apply textures
        verbose: false,                 // boolean:     console output maximal
        vertexNormals: false,           // boolean:     in IndexedFaceSet -> geometry : automatic normals calculation smooth
        useTextures: true,              // boolean:     in IndexedFaceSet -> geometry : automatic normals calculation smooth
        x3dUnit: 1.0                    // float >0:    overall scale
    };


    var $x3D = null;
    var readyCallbackFunc = null;

   // different lists for later usage, naming according to x3d field names
    var geoFields = [ 'IndexedFaceSet', 'Box', 'Cone', 'Cylinder', 'Sphere' ];
    var matFields = [ 'Material', 'ImageTexture', 'TextureTransform', 'Appearance' ];
    var grpFields = [ 'Transform', 'Group', 'Scene' ];

    // lists of THREE.js objects
    var geometry;
    var geometries = [];

    var material;
    var materials = [];

    var imageTexture;
    var imageTextures = [];


    var textureTransform;
    var textureTransforms = [];

    var appearance ;
    var appearances = [];

    var appearanceToTextureTransformIndex = [];

    var shape ;
    var shapes = [];

    var transform;
    var transforms = [];

    var group;
    var groups = [];

    var scene;
    var scenes = [];

    var DEFines = []; // list of DEFs for x3d fields

    // the root node
    var rootNodeName;
    var mainScene = new THREE.Object3D();
    mainScene.name = generateUniqueDEF( "scene" );

    var result = {     // finally here we store the scene
        scene: new THREE.Object3D()
    };


    // local root directory for relative position of e.g. textures or other source files
	var baseUrl;



    // loader to fetch data
    function load ( url, readyCallback, progressCallback ) {
        var length = 0;

		if ( document.implementation && document.implementation.createDocument ) {
            require(["text!"+url], function(responseText){
                var $responseXML = $(responseText);
                readyCallbackFunc = readyCallback;
                parse( $responseXML, readyCallback, url );
            });

		} else {
			alert( "Don't know how to parse XML!" );
		}
	}

    // parser public method
	// purpose: generate scenegraph from
	// doc: document to parse
	// callBack: function call when parsed
	// url: full path to data
	function parse( $doc, callBack, url ) {

        $x3D = $doc;
        callBack = callBack || readyCallbackFunc;

        generateBaseUrl( url ) ;
        // check for inline later

        // get all DEFines and check for plausibility
        initializeLists(); // defines , material

        // parse geometry primitives
        parseBackground();              // <Background ..
        parseIndexedFaceSet();          // <IndexedFaceSet ..
        parseBox();                     // <Box ..
        parseCone();                    // <Cone ..
        parseCylinder();                // <Cylinder ..
        parseSphere();                  // <Sphere ..

        // parsing for static nodes and static aspects of group nodes and generate lists of corresponding THREE.js nodes
        parseAllMaterials();            // <Material, <ImageTexture, <Appearance ..
        // parse grouping nodes
        parseShape();                   // <Shape ..
        parseScene();                   // <Scene ..
        parseGroup();                   // <Group ..
        parseTransform();               // <Transform ..

        // present all information collected so far
        if (options.statistics) getStatistics();

        // traverse scene,                                 currently assuming scene.length = 1;
        var elements = $x3D.find( 'scene' ); // root entry point

        var $rootNode = $(elements[ 0 ]);                   // at least one <Scene node
        rootNodeName = $rootNode.prop('tagName').toLowerCase() ;              // give it a name
        var counter = 0;                                // number of steps in the hierarchy, just for emergency stop

        // traverse and build scene graph
        buildSceneGraph( $rootNode, mainScene, counter ) ;
        // scene completed

        // unit conversion
        mainScene.scale.multiplyScalar( options.x3dUnit );

        // add to the main scene to result object
        result.scene.add( mainScene );

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


    /**
     * buildSceneGraph
     * @param $me              a node list, starting with the root node <X3D
     * @param scene           an empty THREE Object3D which will be filled with the full scene
     * @param counter         an iterator just for statistical purpose and to avoid dead locks, may be omitted in the final version
     *
     *
     * purpose:
     * in the previous steps the scene has bee reduced to only few relevant nodes
     * 1. Shape node : contains all geometries, materials and texture and has no additional relevant children
     * 2. Transform nodes: containing all transformations such as rotation, scale, translate and a list of shapes and groups
     * 3. Group nodes : contains a list of shapes, transforms and other groups
     * 4. Scene nodes: meta nodes containing larger structures like a full bedroom etc.
     *
     *
     * naming:
     * since we perform a mapping from
     * X3D(nodes) -> THREE(objects)
     * we use the naming scheme
     * node -> object
     *
     * This is a simplified approach assuming:
     * all geometries and materials are canonically included in a shape node. (We cleared this )
     * the master node is the up most <X3D> node, which may include <Scene, <Transform, <Group and <Shape as relevant nodes only
     *
     */
    function buildSceneGraph( $me, scene, counter ) {

        // before anything else is done, check for  termination:
        // Step 1: A crude check for emergency termination
        if( counter >100000 ) {
            console.warn( "counter: 100000 exceeded, emergency termination" );
            scene.add( getObject( $me ) );
            return;
        }

        //console.log("I am:", $me.prop('tagName').toLowerCase() + " I have:", $me.children().length + " children.");
        //console.log("is relevant ", isRelevant( $me ));
        // Step 2: check conditions for standard termination
        // a.) position == root
        // b.) no relevant children


        if( $me.prop('tagName').toLowerCase() == rootNodeName.toLowerCase()  && $me.children().length == 0 ) {
            scene.add( getObject( $me ) );
            return;
        }

        // OK, no termination yet, so start actions

        // hierarchy convention naming
        // parent      above
        // me          (my current position in the hierarchy)
        // child       below


        var $child = $($me.children()[0]);
        var $parent;

        if( options.verbose )
           $.each($me.children(), function(i,el){
               console.log( "N"+i  , $(el).prop("tagName") );
           });

        // Step 3: check conditions for dead end and conforming actions
        // a.) its a relevant node
        // b.) no relevant children
        if( isRelevant( $me ) && $me.children().length == 0 ){
            counter++;
        //    console.log( "case 3: dead end reached. number of ends so far:  " + counter );

            var childObject = getObject( $me ) ;
            var parentObject =  getObject( $me.parent() ) ;

            // cloning with USE must happen in time
            var attribute = $me.attr( 'USE' );
            // <Group DEF='g_new' USE='g_old'>
            if( attribute != null  && $me.prop('tagName').toLowerCase() == 'group' ) {
                var index = isNameInList( $me.attr( 'USE' ), groups );
                parentObject.add( groups[ index ].clone() );
            }
            else
                parentObject.add( childObject ); // standard action: add the pre-prepared object to the parent THREE-object

            $parent = $me.parent();
            $me.remove();                     // kill the obsolete node

            buildSceneGraph ( $parent, scene, counter );
        }

        // Step 4: check conditions for irrelevant child node
        // a.) there are child nodes
        // b.) the child node is irrelevant
        if( $me.children().length > 0 && !isRelevant( $child ) ){ // not relevant kill
        //    console.log('case 4');
            counter++;
            $child.remove();
            buildSceneGraph ( $me, scene, counter );
        }

        // Step 5: check conditions for relevant child node
        // a.) there are child nodes
        // b.) the child node is relevant -> step down
        if($me.children().length > 0 && isRelevant( $child )){
           // console.log("case 5: first child is relevant: step down to " + $child.attr('DEF'));
            counter++;
            buildSceneGraph ( $child, scene, counter );
        }

    }
    /**
     * checkUse  :  check for USE and clone object to the objects list
     * @param node
     * @param objs
     * @returns {boolean}     USE is used/ not used token
     */
    function checkUse ( node , objs ) {
        var attribute;
        var index ;
        // check for USE

        attribute = $(node).attr( 'USE' );
        if( attribute == null ) return false;

        index = isNameInList( attribute, objs );
        if ( index == null ) {
            console.warn( "USE " + attribute + " required, but no DEF found" );
            return true;
        }
        // clone and add to list
        var obj = objs[ index ].clone();
        obj.name =  $(node).attr( 'DEF' );
        objs.push( obj );

        // console.log( " checkuse:: name: >>" + obj.name + "<< cloned from " + objs[ index].name + " to list" );
        return true;
    }
    /**
     * checkValidityOfAttribute  parsing and crude error check for attributes in x3d
     *
     * @param attribute          original textstring e.g. ' 1.0 1.0 1.0'
     * @param token              attribute type      e.g. 'size'
     * @returns property         error checked parameter e.g. {1.0,1.0,1.0}
     */
    function checkValidityOfAttribute( attribute, token ){
        var parts;     // contains the list of parsed strings
        var property ; // return value
        var i;
        var pointList = [];


        if( !attribute ) return ( null ) ; // attribute not found, use default as defined in parse<Primitive>

        attribute = attribute.replace( "\t", " " );  // replace <TAB> by <SPACE>
        attribute = attribute.trim();  // kill leading and trailing  <SPACE>
        parts = attribute.split( " " );

        switch ( token ){   // check all valid X3D attributes

            //  single float
            case 'radius':          // Sphere
            case 'height':          // Cone
            case 'bottomRadius':    // Cone
            case 'ambientIntensity':    // Material
            case 'shininess':    // Material
            case 'transparency':    // Material
            case 'creaseAngle':    // IFS
            case 'rotation2':    // IFS
                if ( parts.length != 1 ) {
                    console.warn('Invalid scalar format detected for ' + token );
                    property = null;
                    break;
                }
                parts[0] = eval(parts[0]);
                property = parseFloat( parts[0] );
                break;

            // color
            case 'diffuseColor':
            case 'specularColor':
            case 'emissiveColor':
            case 'skyColor':
                if ( parts.length != 3 ) {
                    console.warn( 'Invalid vector format detected for ' + token );
                    property = null;
                    break;
                }
                property = new THREE.Color( parseFloat( parts[ 0 ] ), parseFloat( parts[ 1 ] ), parseFloat( parts[ 2 ] ) );
                break;


            // 3 float
            case 'scale':
            case 'size':
            case 'translation':
                if ( parts.length != 3 ) {
                    console.warn( 'Invalid vector format detected for ' + token );
                    property = null;
                    break;
                }
                property = new THREE.Vector3( parseFloat( parts[ 0 ] ), parseFloat( parts[ 1 ] ), parseFloat( parts[ 2 ] ) );
                break;

            // 2 float
            case 'center2':
            case 'scale2':
            case 'translation2':
                if ( parts.length != 2 ) {
                    console.warn( 'Invalid vector format detected for ' + token );
                    property = null;
                    break;
                }
                property = new THREE.Vector2( parseFloat( parts[ 0 ] ), parseFloat( parts[ 1 ] ) );
                break;



            case 'point2':

                if ( parts.length  % 2  != 0 ) {
                    console.log(parts);
                    console.warn( 'Invalid vector format detected for ' + token + " parts.length = " + parts.length );
                    property = null;
                    break;
                }
                for ( i = 0; i < parts.length ; i+=2)
                    pointList.push( new THREE.Vector2( parseFloat( parts[ i ] ), parseFloat( parts[ i + 1 ] ) ) );

                property = pointList;
                break;

            case 'point3':

                if ( parts.length  % 3  != 0 ) {
                    console.log(parts);
                    console.warn( 'Invalid vector format detected for ' + token + " parts.length = " + parts.length );
                    property = null;
                    break;
                }
                for ( i = 0; i < parts.length ; i+=3)
                    pointList.push( new THREE.Vector3( parseFloat( parts[ i ] ), parseFloat( parts[ i + 1 ] ), parseFloat( parts[ i + 2 ] ) ) );

                property = pointList;
                break;

            case 'coordIndex':
                var indexes;
                var faceList = [];

                parts = attribute.split( " -1" );  // contains the indices for a single n-face

                var skip = 0;

                for ( i = 0; i< parts.length; i++ ) {
                    parts[i]= parts[i].trim();
                    indexes = parts[i].split(" ");

                    skip = 0;
                    // Face3 only works with triangles, but IndexedFaceSet allows polygons with more then three vertices, build them of triangles
                    while ( indexes.length >= 3 && skip < ( indexes.length - 2 ) ) {
                        //console.log( "face3 " + indexes[ 0 ] + " " + indexes[ skip + 1 ] + " " +   indexes[ skip + 2 ] );
                        var face = new THREE.Face3(
                            indexes[ 0 ],
                            indexes[ skip + 1 ],
                            indexes[ skip + 2 ],
                            null // normal, will be added later
                        );
                        skip++;
                        faceList.push(face);
                    }
                }
                property = faceList;
                break;


            // quaternion
            case 'rotation':
                if (parts.length != 4) {
                    console.warn( 'Invalid quaternion format detected for ' + token );
                    break;
                }
                parts[3] = eval(parts[3]); // mutig, mutig
                property = new THREE.Vector4(parseFloat(parts[0]) , parseFloat( parts[1])  , parseFloat( parts[2] ) , parseFloat( parts[3]));
                break;


            // bool

            case 'bottom':
            case 'side':
            case 'solid':
            case 'ccw':             // IndexedFaceSet
            case 'colorPerVertex':  // IndexedFaceSet
            case 'normalPerVertex': // IndexedFaceSet
                if (parts.length != 1) {
                    console.warn('Invalid bool format detected for ' + token);
                    break;
                }
                property = parts[0] === 'TRUE' ;
                break;

            // string
            case 'url':
                parts[0] =  parts[0].replace('"',"");
                parts[0] =  parts[0].replace('"',"");
                property = parts[0] ;
                break;

            // not a valid x3d token or not implemented yet
            default:
                property = null;
                console.warn( ">>" + attribute + "<< is not conform with x3d or is not implemented yet" );
                break;

        }
        //console.log("checkValOfAttributes >>" + token + "<<" + property );
        return property;

    }
    // generate the base URL to find e.g. the textures
    function generateBaseUrl( url ){
        if ( url !== undefined ) {
            var parts = url.split( '/' );
            parts.pop();
            baseUrl = ( parts.length < 1 ? '.' : parts.join( '/' ) ) + '/';
        }
    }
    /**
     * getDefines - for a given token e.g. 'Box' the corresponding 'DEF = property' is read added to the definesList
     * @param token
     */
    function getDEFines( token ) {
        var $elements = $x3D.find( token );
        var $element = $elements[ 0 ];
        var property ;

        if (!$element) {
        } else {
            for ( var i = 0; i < $elements.length; i++ ){
                $element = $($elements[i]);
        //        property = elements[ i ].getAttribute( 'DEF' );
                property = $element.attr( 'DEF' );
                if( property ) {
                    DEFines.push( property );
                    if( options.verbose ) console.log( "getDefines:: " + token + ".name=" + property );
                }
            }
        }
    }
    /**
     * generateCanonicalShape, used in parse<Geometry> methods
     * the standard node for geometry objects is
     * AAA:
     *
     * <Shape>
     *      <geometry
     *      <Appearance
     *          <Material
     *
     * but there may be only
     * <geometry tags in the x3d-file.
     * In this case, we have to bring the node into the canonical form AAA:
     *
     * * @param obj : geometry node, which has to be tested
     */
    function generateCanonicalShape( obj ){
        var $obj = $(obj);
        var $parent = $(obj).parent();

        //if( parent != null && parent.nodeName != 'Shape' )
        if( $parent != null && $parent.prop('tagName').toLowerCase() != 'shape' ) {
             if( options.verbose ) console.log( $parent.prop('tagName').toLowerCase() + " is the parent of " + $(obj).prop('tagName').toLowerCase() + ": build cononical node" );

            // build the shape node and replace the rudimentary geometry
            var $shpNode = $( '<Shape></Shape>' );
            $shpNode.attr( "DEF", generateUniqueDEF( 'Shape' ) );

            var $appNode = $( '<Appearance></Appearance>' );
            $appNode.attr( "DEF", generateUniqueDEF( 'Appearance' ) );

            var $matNode = $( '<Material></Material>' );
            $matNode.attr( "DEF", generateUniqueDEF( 'Material' ) );


            var $objNode = $obj.clone();
            $matNode.attr( "DEF", materials[ 0 ].name );  // default material

            $appNode.append( $matNode );

            $shpNode.append( $objNode );
            $shpNode.append( $appNode );

            $obj.replaceWith( $shpNode );

            if( options.verbose ) console.log('new node ', $shpNode);
        }
    }
    /**
     * generateValidDef : a valid unique DEF
     * @param prefix
     * @returns {*}
     */
    function generateUniqueDEF( prefix ) {
        var counter = DEFines.length;
        var validDef = prefix + "_" + counter; // try a possible name

        while( isInList( validDef, DEFines ) )
            validDef = prefix +  "_" + ++counter; // count up until we find a new name

        return validDef;
    }
    /**
     * getObject - for a given node return the corresponding Object
     *
     * @param node
     * @returns {*}
     */
    function getObject( node ) {
        var index;

        var token = node.prop('tagName').toLowerCase();

        switch ( token ) {   // check all valid X3D attributes
            case 'transform':
                index = isNameInList( node.attr( 'DEF' ), transforms );
                if( index >= 0 ) return( transforms[index] );
                break;
            case 'group':
                index = isNameInList( node.attr( 'DEF' ), groups );
                if( index >= 0 ) return( groups[index] );
                break;
            case 'shape':
                index = isNameInList( node.attr( 'DEF' ), shapes );
                if( index >= 0 ) return( shapes[index]);
                break;
            case 'scene':
                index = isNameInList( node.attr( 'DEF' ), scenes );
                if( index>=0 ) return( scenes[index] );
                break;
        }

        return null; // not found

    }
    /**
     * getStatistics - a collection of informations on the scene
     *
     */
    function getStatistics(){
        var counterFaces = 0;
        var counterVertices = 0;

        console.log( "Statistics" );
        console.log( shapes.length + "  <Shape> nodes");
        console.log( shapes[0]);

        for ( var i = 0; i < geometries.length; i++ ){
            counterFaces += geometries[i].faces.length;
            counterVertices += geometries[i].vertices.length;
        }
        console.log( counterVertices + "  vertices");
        console.log( counterFaces + "  faces");

        console.log( materials.length + "  <Material> nodes");
        console.log( imageTextures.length + "  <ImageTexture> nodes");
        console.log( textureTransforms.length + "  <TextureTransforms> nodes");


        console.log( transforms.length + "  <Transform> nodes");
        console.log( groups.length + "  <Group> nodes");
        console.log( scenes.length + "  <Scene> nodes");


    }
    /**
     *  initializeLists - generates a list of DEFs in the original x3D tree
     */
    function initializeLists() {
        var k;
        // first make a list of reserved names
        // we assume full integrity of the x3D source file
        // therefore we assume, that all given DEFs are unique

        // materials ++
        for ( k = 0; k < matFields.length; k++ )
            getDEFines( matFields[k] );
        // geometries ++
        for ( k = 0; k < geoFields.length; k++ )
            getDEFines( geoFields[k] );
        // mesh
        getDEFines( 'Shape' );
        // groups ++
        for ( k = 0; k < grpFields.length; k++ )
            getDEFines( grpFields[k] );

        // now give a name to every unnamed field node

        // materials ++
        for ( k = 0; k< matFields.length; k++ )
            setDefines( matFields[k] );
        // geometries ++
        for ( k = 0; k < geoFields.length; k++ )
            setDefines( geoFields[k] );
        // mesh
        setDefines( 'Shape' );
        // groups ++
        setDefinesTransform();
        setDefines( "Group" );
        setDefines( "Scene" );

        setDefaultMaterial() ;  // set the standard for void material

        if( options.verbose ) console.log( "defines listing:" + DEFines );
    }
    function isInList( name, names ) {
        for ( var i = 0; i <  names.length; i++ ){
            if ( name == names[ i ] ) return i;
        }
        return null;
    }
    function isNameInList( name, list ) {
        for ( var i = 0; i <  list.length; i++ ){
            if ( name.toLowerCase() == list[ i ].name.toLowerCase() ) return i;
        }
        return null;
    }
    /**
     * isRelevant - returns true, if the nodename is a member of relevant node names
     * @param node
     * @returns {boolean}
     */
    function isRelevant( node ) {
        if(node != null) {
            if ( node.prop('tagName').toLowerCase() == 'scene' ) return true;
            if ( node.prop('tagName').toLowerCase() == 'group' ) return true;
            if ( node.prop('tagName').toLowerCase() == 'transform' ) return true;
            if ( node.prop('tagName').toLowerCase() == 'shape' ) return true;
        }
        return false; // not found
    }
    /**
     * parseNodes  :
     */
    function parseAllMaterials(){
        parseMaterial();
        parseImageTexture();
        parseTextureTransform();
        parseAppearance();
    }
    function parseAppearance() {
        var token = "Appearance";
        var elements = $x3D.find( token );
        var element = elements[0];
        var index;


        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {
                /*
                 Appearance : X3DAppearanceNode {
                 SFNode [in,out] fillProperties   NULL [FillProperties]
                 SFNode [in,out] lineProperties   NULL [LineProperties]
                 SFNode [in,out] material         NULL [X3DMaterialNode]
                 SFNode [in,out] metadata         NULL [X3DMetadataObject]
                 MFNode [in,out] shaders          []   [X3DShaderNode]
                 SFNode [in,out] texture          NULL [X3DTextureNode]
                 SFNode [in,out] textureTransform NULL [X3DTextureTransformNode]
                 }
                 */

                if( !checkUse( elements[i], appearances ) ) {

                    for ( var j = 0; j < elements[i].children.length; j++ ) {
                        var $child = $(elements[i].children[j]);

                        if ('Material'.toLowerCase() === $child.prop('tagName').toLowerCase() )   {
                            index = isNameInList($child.attr('DEF'), materials);
                            if( options.verbose ) console.log("material found: " + $child.attr('DEF'), "index = ", index) ;
                            appearance = materials[index];
                        }

                        if ('ImageTexture'.toLowerCase() === $child.prop('tagName').toLowerCase() && options.useTextures) {
                            index = isNameInList($child.attr('DEF'), imageTextures);
                            if (options.verbose) console.log("imageTexture found: " + $child.attr('DEF'), "index = ", index);
                            appearance.map = imageTextures[index];

                            if (options.bump) {
                                appearance.bumpMap = imageTextures[0]; // just for fun
                                appearance.bumpScale = 0.1; // just for fun
                            }

                        }

                        if ('TextureTransform'.toLowerCase() === $child.prop('tagName').toLowerCase() && options.useTextures) {
                            index = isNameInList($child.attr('DEF'), textureTransforms);
                            appearanceToTextureTransformIndex.push( new THREE.Vector2(appearances.length, index) ); // connect appearance index and texture transform  index

                            if (options.verbose)
                                console.log("texture transform found: " + child.getAttribute('DEF'), "index = ", index);
                        }

                    }

                    // give a name and check
                    pushObjectAndNodeDEFToList( appearance, appearances, elements[i], token );
                    if( options.verbose ) console.log(token +  " name: >>" + appearance.name + "<< added to list");
                }
            }
        }   // end if(element)
    }
    function parseBackground() {
        var attribute;
        var token = "Background";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        // attributes
        var skyColor;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Box : X3DGeometryNode {
                 SFNode  [in,out] metadata NULL  [X3DMetadataObject]
                 SFVec3f []       size     2 2 2 (0,∞)
                 SFBool  []       solid    TRUE
                 }*/

                if( !checkUse( elements[i], geometries ) ) {
                    element = $(elements[i]);
                    attribute = 'skyColor';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    skyColor = ( value != null ) ? value : new THREE.Color( 0.0, 0.0, 0.0 ); // set value or default

                    options.backgroundColor = skyColor ;

                    if( options.verbose )
                        console.log( token + "(" + skyColor.r + "," + skyColor.g + "," + skyColor.b + ")  added to options" );
                }
            }
        }   // end if(element)
    }
    function parseBox() {
        var attribute;
        var token = "Box";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        // attributes
        var size3;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Box : X3DGeometryNode {
                 SFNode  [in,out] metadata NULL  [X3DMetadataObject]
                 SFVec3f []       size     2 2 2 (0,∞)
                 SFBool  []       solid    TRUE
                 }*/

                if(!checkUse( elements[i], geometries ) ) {
                    element = $(elements[i]);

                    attribute = 'size';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    size3 = ( value != null ) ? value : new THREE.Vector3( 2.0, 2.0, 2.0 ); // set value or default
                    console.log(attribute, ' ', value);

                    geometry = new THREE.BoxGeometry( size3.x, size3.y, size3.z );

                    // give a name and check
                    pushObjectAndNodeDEFToList( geometry, geometries, elements[i], token );
                    if( options.verbose )
                        console.log( token + "(" + size3.x + "," + size3.y + "," + size3.z + ") name: >>" + geometry.name + "<< added to list" );

                    generateCanonicalShape(elements[i]);

                }
            }
        }   // end if(element)
    }
    function parseCone() {
        var attribute;
        var token = "Cone";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        // attributes
        var bottom;
        var bottomRadius;
        var height;
        var side;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Cone : X3DGeometryNode {
                 SFNode  [in,out] metadata     NULL [X3DMetadataObject]
                 SFBool  []       bottom       TRUE
                 SFFloat []       bottomRadius 1    (0,∞)
                 SFFloat []       height       2    (0,∞)
                 SFBool  []       side         TRUE
                 SFBool  []       solid        TRUE
                 }
                 */
                if( !checkUse( elements[i], geometries ) ) {
                    element = $(elements[i]);

                    attribute = 'bottom';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    bottom =  (value != null)? value : true; // set value or default

                    attribute = 'bottomRadius';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    bottomRadius =  (value != null)? value : 1.0; // set value or default

                    attribute = 'height';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    height =  (value != null)? value : 2.0; // set value or default

                    attribute = 'side';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    side =  (value != null)? value : true; // set value or default

                    // no ConeGeometry in THREE, so use Cylinder instead
                    // THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
                    geometry = new THREE.CylinderGeometry( 0, bottomRadius, height, options.precision, options.precision, !bottom );

                    // give a name
                    pushObjectAndNodeDEFToList( geometry, geometries, elements[i],token );

                    generateCanonicalShape(elements[i]);

                    // write info
                    if( options.verbose ) console.log( token + "(" + bottomRadius + "," + height + ") name:>>" + geometry.name + "<< added to list" );
                }
            }
        }   // end if(element)
    }
    function parseCylinder() {
        var attribute;
        var token = "Cylinder";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        // attributes
        var bottom;
        var height;
        var radius;
        var side;
        var top;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Cylinder : X3DGeometryNode {
                 SFNode  [in,out] metadata NULL [X3DMetadataObject]
                 SFBool  []       bottom   TRUE
                 SFFloat []       height   2    (0,∞)
                 SFFloat []       radius   1    (0,∞)
                 SFBool  []       side     TRUE
                 SFBool  []       solid    TRUE
                 SFBool  []       top      TRUE
                 }*/
                if( !checkUse( elements[i], geometries ) ) {

                    element = $(elements[i]);

                    attribute = 'bottom';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    bottom = ( value != null ) ? value : true; // set value or default

                    attribute = 'height';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    height = ( value != null ) ? value : 2.0; // set value or default

                    attribute = 'radius';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    radius = ( value != null ) ? value : 1.0; // set value or default

                    attribute = 'side';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    side = ( value != null ) ? value : true; // set value or default

                    attribute = 'top';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    top = ( value != null ) ? value : true; // set value or default


                    // THREE.CylinderGeometry(radiusTop, radiusBottom, height, radiusSegments, heightSegments, openEnded, thetaStart, thetaLength)
                    geometry = new THREE.CylinderGeometry( radius, radius, height, options.precision, options.precision, (!bottom && !top) );

                    // give a name
                    pushObjectAndNodeDEFToList( geometry, geometries, elements[i], token );

                    // write info
                    if( options.verbose ) console.log( token + "(" + radius + "," + height + ") name:>>" + geometry.name + "<< added to list" );

                    generateCanonicalShape(elements[i]);

                }
            }
        }   // end if(element)
    }
    function parseGroup() {
        var token = "Group";
        var elements = $x3D.find( token );
        var element = elements[0];

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Group : X3DGroupingNode {
                 MFNode  [in]     addChildren             [X3DChildNode]
                 MFNode  [in]     removeChildren          [X3DChildNode]
                 MFNode  [in,out] children       []       [X3DChildNode]
                 SFNode  [in,out] metadata       NULL     [X3DMetadataObject]
                 SFVec3f []       bboxCenter     0 0 0    (-∞,∞)
                 SFVec3f []       bboxSize       -1 -1 -1 [0,∞) or −1 −1 −1
                 }
                 */

                if(!checkUse( elements[i], groups ) ) {

                    // actually a container, which will be filled by children through the traverse
                    group = new THREE.Object3D();

                    // give a name and check
                    pushObjectAndNodeDEFToList( group, groups, elements[i], token );

                    if( options.verbose )
                        console.log( token  + "  : >>" + group.name + "<< added to list" );
                }
            }
        }   // end if(element)
    }
    function parseImageTexture() {
        var attribute;
        var token = "ImageTexture";
        var elements = $x3D.find( token );
        var element = elements[ 0 ];
        var value;

        var url;
        var repeatS;
        var repeatT;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {
                /*
                 ImageTexture : X3DTexture2DNode, X3DUrlObject {
                 SFNode   [in,out] metadata          NULL [X3DMetadataObject]
                 MFString [in,out] url               []   [URI]
                 SFBool   []       repeatS           TRUE
                 SFBool   []       repeatT           TRUE
                 SFNode   []       textureProperties NULL [TextureProperties]
                 }
                 */
                if(!checkUse( elements[i], imageTextures) ) {
                    element = $(elements[i]);
                    attribute = 'url';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    url = ( value != null ) ? value : ''; // set value or default
                    attribute = 'repeatS';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    repeatS = ( value != null ) ? value : true; // set value or default
                    attribute = 'repeatT';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    repeatT = ( value != null ) ? value : true; // set value or default


//                  e.g.   './models/x3d/earth-topo.png'
                    //  use baseUrl to determine relative link
                    var link = ((( url.indexOf( "http://" ) > -1 ) || ( url.indexOf( "https://" ) > -1 ) ) ?  url :  baseUrl + url );

                    imageTexture = THREE.ImageUtils.loadTexture( link , undefined, null, null );
                    imageTexture.wrapS = (repeatS ?  THREE.RepeatWrapping : THREE.ClampToEdgeWrapping ) ;
                    imageTexture.wrapT = (repeatT ?  THREE.RepeatWrapping : THREE.ClampToEdgeWrapping ) ;

                    imageTexture.repeat.set( 0.9999, 0.9999 ) ;

                    // give a name
                    pushObjectAndNodeDEFToList( imageTexture, imageTextures, elements[i], token );

                    // write info
                    if( options.verbose ) console.log( token + "(" + ") name:>>" + imageTexture.name + "<< added to list" );
                }
            }
        }   // end if(element)
    }
    function parseIndexedFaceSet() {
        var attribute;
        var token = "IndexedFaceSet";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        var j, k;
        var prop;

        // attributes
        var ccw;
        var colorPerVertex;
        var coordIndex;
        var creaseAngle;
        var normalPerVertex;

        if (!element) {
        } else {
            for (var i = 0; i < elements.length; i++) {

                /*
                 IndexedFaceSet : X3DComposedGeometryNode {
                 MFInt32 [in]     set_colorIndex
                 MFInt32 [in]     set_coordIndex
                 MFInt32 [in]     set_normalIndex
                 MFInt32 [in]     set_texCoordIndex
                 MFNode  [in,out] attrib            []   [X3DVertexAttributeNode]
                 SFNode  [in,out] color             NULL [X3DColorNode]
                 SFNode  [in,out] coord             NULL [X3DCoordinateNode]
                 SFNode  [in,out] fogCoord          []   [FogCoordinate]
                 SFNode  [in,out] metadata          NULL [X3DMetadataObject]
                 SFNode  [in,out] normal            NULL [X3DNormalNode]
                 SFNode  [in,out] texCoord          NULL [X3DTextureCoordinateNode]
                 SFBool  []       ccw               TRUE
                 MFInt32 []       colorIndex        []   [0,∞) or -1
                 SFBool  []       colorPerVertex    TRUE
                 SFBool  []       convex            TRUE
                 MFInt32 []       coordIndex        []   [0,∞) or -1
                 SFFloat []       creaseAngle       0    [0,∞)
                 MFInt32 []       normalIndex       []   [0,∞) or -1
                 SFBool  []       normalPerVertex   TRUE
                 SFBool  []       solid             TRUE
                 MFInt32 []       texCoordIndex     []   [-1,∞)
                 }
                 */

                if(!checkUse( elements[i], geometries) ) {
                    element = $(elements[i]);

                    attribute = 'ccw';

                    value = checkValidityOfAttribute(element.attr(attribute), attribute);
                    ccw = ( value != null ) ? value : true; // set value or default

                    attribute = 'creaseAngle';
                    value = checkValidityOfAttribute(element.attr(attribute), attribute);
                    creaseAngle = ( value != null ) ? value : NOEXIST; // set value or default


                    attribute = 'colorPerVertex';
                    value = checkValidityOfAttribute(element.attr(attribute), attribute);
                    colorPerVertex = ( value != null ) ? value : true; // set value or default

                    attribute = 'normalPerVertex';
                    value = checkValidityOfAttribute(element.attr(attribute), attribute);
                    normalPerVertex = ( value != null ) ? value : true; // set value or default



                    geometry = new THREE.Geometry();


                    attribute = 'coordIndex';
                    value = checkValidityOfAttribute(element.attr(attribute), attribute);


                    for (j = 0; j < value.length; j++)
                        geometry.faces.push(value[j]);

                    var counterTexture = NOEXIST;

                    for (j = 0; j < element.children().length; j++) {
                        var $child = $(element.children()[j]);

                        // add vertices
                        if ('Coordinate'.toLowerCase() === $child.prop('tagName').toLowerCase()  ) {
                            attribute = 'point';
                            prop = checkValidityOfAttribute($child.attr(attribute), 'point3');
                            for ( k = 0; k < prop.length; k++ )
                                geometry.vertices.push( prop[ k ] );
                        }

                        // add UVs
                        if ('TextureCoordinate'.toLowerCase() === $child.prop('tagName').toLowerCase() ) {
                            counterTexture = j;
                            attribute = 'point';
                            prop = checkValidityOfAttribute($child.attr(attribute), 'point2');

                            geometry.faceVertexUvs[ 0 ] = [];
                            for ( k = 0; k < geometry.faces.length; k++ ) {
                                var face = geometry.faces;
                                geometry.faceVertexUvs[ 0 ].push( [ prop[ face[ k ].a ], prop[ face[ k ].b ], prop[ face[ k ].c ] ] );
                                if( options.verbose ){
                                    console.log( face.a, face.b, face.c );
                                    console.log( prop[ face[k].a ], prop[ face[k].b ], prop[ face[k].c ] );
                                }
                            }
                        }
                    } // all children traversed

                    if ( (counterTexture === NOEXIST) && options.useTextures ){
                        if( options.verbose ) console.log("assigning automatic uvs");
                        var texMan = new THREE.TextureManipulations();
                        if(options.textureMapping == TRIANGLE) texMan.assignUVsTriangles(geometry);
                        if(options.textureMapping == CYLINDER) texMan.assignUVsCylindrical(geometry);

                    }

                    // creaseAngle = NOEXIST , use settings from options.
                    // creaseAngle <= threshold ->  flat shading
                    // creaseAngle >  threshold ->  smooth shading

                    if (creaseAngle == NOEXIST) {  // make your own choice from options
                        if (options.faceNormals)  geometry.computeFaceNormals();
                        if (options.faceNormals && options.vertexNormals)  geometry.computeVertexNormals(); // averages the faceNormals, therefore computeFaceNormals must have been calculated first

                        if (!options.faceNormals && options.vertexNormals) {// averages the faceNormals, therefore computeFaceNormals must have been calculated first
                            geometry.computeFaceNormals();
                            geometry.computeVertexNormals();
                        }
                    } else {  // given in x3d dataset
                        if( creaseAngle <= options.creaseAngleThreshold )   // flat
                            geometry.computeFaceNormals();
                        if( creaseAngle > options.creaseAngleThreshold ){ // smooth
                            geometry.computeFaceNormals();
                            geometry.computeVertexNormals();
                        }

                    }
                    geometry.computeBoundingSphere(); // vital for performance
                    geometry.computeBoundingBox();



                    // give a name
                    pushObjectAndNodeDEFToList( geometry, geometries, element[i], token );

                    // write info
                    if( options.verbose ) console.log( token + " name:>>" + geometry.name + "<< added to list" );

                    generateCanonicalShape(element[i]);

                }
            }
        }   // end if(element)
    }
    function parseMaterial() {
        var attribute;
        var token = "Material";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        // attributes
        var diffuseColor;
        var specularColor;
        var emissiveColor;
        var ambientIntensity;
        var shininess;
        var transparency;
        var appearanceCounter = 0 ; // check if all materials are childnodes of the appearance node

        if (!element) {
        } else {
            for (var i = 0; i < elements.length; i++) {
                /*
                 Material : X3DMaterialNode {
                 SFFloat [in,out] ambientIntensity 0.2         [0,1]
                 SFColor [in,out] diffuseColor     0.8 0.8 0.8 [0,1]
                 SFColor [in,out] emissiveColor    0 0 0       [0,1]
                 SFNode  [in,out] metadata         NULL        [X3DMetadataObject]
                 SFFloat [in,out] shininess        0.2         [0,1]
                 SFColor [in,out] specularColor    0 0 0       [0,1]
                 SFFloat [in,out] transparency     0           [0,1]
                 }
                   */
                if(!checkUse( elements[i], materials) ) {
                    element = $(elements[i]);

                    attribute = 'ambientIntensity';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    ambientIntensity = ( value != null ) ? value : 0.2; // set value or default
                    attribute = 'shininess';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    shininess = ( value != null ) ? value : 0.2; // set value or default
                    attribute = 'transparency';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    transparency = ( value != null ) ? value : 0.0; // set value or default

                    attribute = 'diffuseColor';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    diffuseColor = ( value != null ) ? value : new THREE.Color( 0.8, 0.8, 0.8 ); // set value or default
                    attribute = 'specularColor';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    specularColor = ( value != null ) ? value : new THREE.Color( 0.0, 0.0, 0.0 ); // set value or default
                    attribute = 'emissiveColor';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    emissiveColor = ( value != null ) ? value : new THREE.Color( 0.0, 0.0, 0.0 ); // set value or default

                    material = new THREE.MeshPhongMaterial({
                        color: diffuseColor,
                        specular: specularColor
                    });
                    material.emissive = emissiveColor;
                    material.shininess = 15.0 * shininess;

                    if ( transparency > 0 ) {
                        material.opacity = Math.abs( 1.0 - transparency );
                        material.transparent = true;
                    }

                    if( options.solid ) material.side = THREE.DoubleSide;
                    if( element.parent().prop('tagName').toLowerCase() != 'appearance' ) appearanceCounter++; // material should be a child of the Appearance node
                //    if( elements[i].parentNode.nodeName != 'Appearance' ) appearanceCounter++; // material should be a child of the Appearance node
                    // give a name
                    pushObjectAndNodeDEFToList( material, materials, elements[i], token );
                }
            }
        }   // end if(element)

        if (appearanceCounter > 0) console.warn("not all <Material nodes are children of <Appearance, representation may fail ");

    }
    function parseScene() {
        var token = "Scene";
        var elements = $x3D.find( token );
        var element = $(elements[0]);

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Group : X3DGroupingNode {
                 MFNode  [in]     addChildren             [X3DChildNode]
                 MFNode  [in]     removeChildren          [X3DChildNode]
                 MFNode  [in,out] children       []       [X3DChildNode]
                 SFNode  [in,out] metadata       NULL     [X3DMetadataObject]
                 SFVec3f []       bboxCenter     0 0 0    (-∞,∞)
                 SFVec3f []       bboxSize       -1 -1 -1 [0,∞) or −1 −1 −1
                 }
                 */

                if(!checkUse( elements[i], scenes ) ) {

                    // actually a container, which will be filled by children through the traverse
                    scene = new THREE.Object3D();

                    // give a name and check
                    pushObjectAndNodeDEFToList( scene, scenes, elements[i], token );

                    if( options.verbose )
                        console.log( token  + "  : >>" + scene.name + "<< added to list" );
                }
            }
        }   // end if(element)
    }
    function parseShape() {

        var token = "Shape";
        var elements = $x3D.find( token );
        var element = elements[0];
        var indexGeo ;
        var indexApp;
        var indexTex;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Shape : X3DShapeNode {
                 SFNode  [in,out] appearance NULL     [X3DAppearanceNode]
                 SFNode  [in,out] geometry   NULL     [X3DGeometryNode]
                 SFNode  [in,out] metadata   NULL     [X3DMetadataObject]
                 SFVec3f []       bboxCenter 0 0 0    (-∞,∞)
                 SFVec3f []       bboxSize   -1 -1 -1 [0,∞) or −1 −1 −1
                 }
                 */

                if( !checkUse( elements[i], shapes ) ) {
                    indexGeo = NOEXIST ;
                    indexApp = NOEXIST;
                    indexTex = NOEXIST;

                    for ( var j = 0; j < elements[i].children.length; j++ ) {

                        var $child = $(elements[i].children[j]);
                        // any geometry node is ok
                        for ( var k = 0; k < geoFields.length; k++ ) {
                            if ( geoFields[k].toLowerCase()  === $child.prop('tagName').toLowerCase() ) {
                                indexGeo = isNameInList($child.attr('DEF'), geometries);
                                if( options.verbose ) console.log("geometry " + geoFields[k] + "  found: " + $child.attr('DEF'));
                            }
                        }

                        if ( 'Appearance'.toLowerCase() === $child.prop('tagName').toLowerCase() ){
                            indexApp = isNameInList($child.attr('DEF'), appearances);
                            if( options.verbose ) console.log("material found: " + $child.attr('DEF'), "index = ", indexApp) ;
                        }
                    }

                    if ( ( indexApp != NOEXIST ) && ( indexGeo != NOEXIST ) && options.useTextures ){
                        // UVs are existing, make transforms,if possible

                        // get texture transform
                        for ( k = 0; k < appearanceToTextureTransformIndex.length; k++ )
                            if ( appearanceToTextureTransformIndex[k].x == indexApp ) indexTex = appearanceToTextureTransformIndex[k].y ;

                        if( indexTex != NOEXIST ){
                            textureTransform = textureTransforms[ indexTex ];
                            geometry = geometries[ indexGeo ];
                            textureTransform.assignUVsCanonical( geometry );
                        }
                    }

                    shape = new THREE.Mesh( geometries[ indexGeo ], appearances[ indexApp ] );

                    // give a name and check
                    pushObjectAndNodeDEFToList( shape, shapes, elements[i], token );
                    if( options.verbose ) console.log( token +  " name: >>" + shape.name  + "<< added to list" );
                }
            }
        }   // end if(element)
    }
    function parseSphere() {
        var attribute;
        var token = "Sphere";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        // attributes
        var radius;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {
                /*
                 Sphere : X3DGeometryNode {
                 SFNode  [in,out] metadata NULL [X3DMetadataObject]
                 SFFloat []       radius   1    (0,∞)
                 SFBool  []       solid    TRUE
                 }}
                 */
                if( !checkUse( elements[i], geometries ) ) {
                    element = $(elements[i]);
                    attribute = 'radius';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    radius = ( value != null ) ? value : 1.0; // set value or default


                    geometry = new THREE.SphereGeometry( radius, options.precision, options.precision );

                    // give a name
                    pushObjectAndNodeDEFToList( geometry, geometries, elements[i], token );

                    // write info
                    if( options.verbose ) console.log( token + "(" + radius + ") name:>>" + geometry.name + "<< added to list" );

                    generateCanonicalShape(elements[i]);

                }
            }
        }   // end if(element)
    }
    function parseTextureTransform() {
        var attribute;
        var token = "TextureTransform";
        var elements = $x3D.find( token );
        var element = elements[0];
        var value;

        var center2;
        var rot2;
        var scale2 ;
        var trans2;


        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 TextureTransform : X3DGroupingNode {
                 SFVec3f    [in,out] center           0 0 0    (-∞,∞)
                 SFRotation [in,out] rotation         0 0 1 0  [-1,1] or (-∞,∞)
                 SFVec3f    [in,out] scale            1 1 1    (-∞, ∞)
                 SFVec3f    [in,out] translation      0 0 0    (-∞,∞)
                 }
                 */

                if(!checkUse( elements[i], textureTransforms ) ) {
                    element = $(elements[i]);
                    attribute = 'center';
                    value = checkValidityOfAttribute( element.attr( attribute ), 'center2' );
                    center2 = ( value != null ) ? value : new THREE.Vector2( 0.0, 0.0 ); // set value or default

                    attribute = 'rotation';
                    value = checkValidityOfAttribute( element.attr( attribute ), 'rotation2' );
                    rot2 = ( value != null ) ? value : 0.0 ; // set value or default

                    attribute = 'scale';
                    value = checkValidityOfAttribute( element.attr( attribute ), 'scale2' );
                    scale2 = ( value != null ) ? value : new THREE.Vector2( 1.0, 1.0 ); // set value or default

                    attribute = 'translation';
                    value = checkValidityOfAttribute( element.attr( attribute ), 'translation2' );
                    trans2 = ( value != null ) ? value : new THREE.Vector2( 0.0, 0.0 ); // set value or default



                    // actually a container for transform data

                    textureTransform = new THREE.TextureManipulations();
                    textureTransform.center.set(center2.x, center2.y);
                    textureTransform.rotate = rot2;
                    textureTransform.translate.set(trans2.x, trans2.y);
                    textureTransform.scale.set( scale2.x, scale2.y );
                    if( options.verbose ) {
                        console.log("here comes my transform ");
                        console.log(textureTransform);
                    }

                    // give a name and check
                    pushObjectAndNodeDEFToList( textureTransform, textureTransforms, elements[i], token );
                    if( options.verbose ){
                        console.log( token  + "  : >>" + textureTransform.name + "<< added to list" );
                        console.log( textureTransform );
                    }


                }
            }
        }   // end if(element)
    }
    function parseTransform() {
        var attribute;
        var token = "Transform";
        var elements = $x3D.find( token );
        var element = elements[ 0 ];
        var value;

        var trans;
        var rot;
        var scal ;


        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ) {

                /*
                 Transform : X3DGroupingNode {
                 MFNode     [in]     addChildren               [X3DChildNode]
                 MFNode     [in]     removeChildren            [X3DChildNode]
                 SFVec3f    [in,out] center           0 0 0    (-∞,∞)
                 MFNode     [in,out] children         []       [X3DChildNode]
                 SFNode     [in,out] metadata         NULL     [X3DMetadataObject]
                 SFRotation [in,out] rotation         0 0 1 0  [-1,1] or (-∞,∞)
                 SFVec3f    [in,out] scale            1 1 1    (-∞, ∞)
                 SFRotation [in,out] scaleOrientation 0 0 1 0  [-1,1] or (-∞,∞)
                 SFVec3f    [in,out] translation      0 0 0    (-∞,∞)
                 SFVec3f    []       bboxCenter       0 0 0    (-∞,∞)
                 SFVec3f    []       bboxSize         -1 -1 -1 [0,∞) or −1 −1 −1
                 }
                 */


                if(!checkUse( elements[i], transforms ) ) {
                    element = $(elements[i]);
                    attribute = 'translation';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    trans = ( value != null ) ? value : new THREE.Vector3( 0.0, 0.0, 0.0 ); // set value or default

                    attribute = 'scale';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    scal = ( value != null ) ? value : new THREE.Vector3( 1.0, 1.0, 1.0 ); // set value or default

                    attribute = 'rotation';
                    value = checkValidityOfAttribute( element.attr( attribute ), attribute );
                    rot = ( value != null ) ? value : new THREE.Vector4( 0, 0, 0 , 1.0 ); // set value or default

                    // actually a container, which will be filled by children through the traverse
                    transform = new THREE.Object3D();

                    transform.position.set( trans.x, trans.y, trans.z ) ;
                    transform.scale.set( scal.x, scal.y, scal.z ) ;
                    transform.quaternion.setFromAxisAngle( new THREE.Vector3( rot.x, rot.y, rot.z ), rot.w );

                    // give a name and check
                    pushObjectAndNodeDEFToList( transform, transforms, elements[i], token );
                    if( options.verbose )
                        console.log( token  + "  : >>" + transform.name + "<< added to list" );
                }
            }
        }   // end if(element)
    }
    function pushObjectAndNodeDEFToList( obj, objs, node, token ) {
        // give a name and push

        obj.name =  $(node).attr( 'DEF' );
        objs.push( obj );

        if( options.verbose )
        {
            console.log(token +  "name: >>" + obj.name + "<< added to list");
            console.log("parent NodeName = " + $(node).parent().prop('tagName'));
        }
        return true;
    }
    /**
     * setDefaultMaterial  :    generate an entry in the materials list, containing the default material
     */
    function setDefaultMaterial() {
        var diffuseColor;
        var specularColor;

        diffuseColor =  new THREE.Color( 0.8, 0.8, 0.8 ); // set value or default
        specularColor = new THREE.Color( 0.2, 0.2, 0.2 ); // set value or default

        if ( options.defaultMaterial == SPECULAR )
            material = new THREE.MeshPhongMaterial( {
                color: diffuseColor,
                specular: specularColor
            } );

        if ( options.defaultMaterial == DIFFUSE )
            material = new THREE.MeshLambertMaterial( {
                color: diffuseColor
            } );

        // give a name
        material.name =  generateUniqueDEF( 'material_default' ) ;
        materials.push( material );
    }
    /**
     * setDefines - for a given token e.g. 'Box' the corresponding 'DEF = property' is set and added to the definesList
     * @param token
     */
    function setDefines( token ) {
        var elements = $x3D.find( token );
        var element = elements[ 0 ];
        var property ;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ){
                element = $(elements[i]);
                //property = elements[i].getAttribute( 'DEF' ); // check for DEF
                property = element.attr( 'DEF' );
                if( !property ) {  // not defined yet
                    property = generateUniqueDEF( token ); // generate a new unique name
                    element.attr( 'DEF', property );  // write attribute
                    DEFines.push( property );
                    if( options.verbose ) console.log( "setDefines:: " + token + ".name=" + property );
                }
            }
        }
    }
    /**
     * setDefinesTransform - 'DEF = property' is set and added to the definesList
     * special treatment since name reflects
     * Transform_s scale
     * Transform_r rotation
     * Transform_t translation
     * or mixture
     * easily detect the corresponding Transformation
     */
    function setDefinesTransform() {
        var token = "Transform";
        var elements = $x3D.find( token );
        var element = elements[ 0 ];
        var property ;
        var name ;

        if ( !element ) {
        } else {
            for ( var i = 0; i < elements.length; i++ ){
                name = token + "_" ;
                property = elements[i].getAttribute( 'DEF' ); // check for DEF
                if( !property ) {  // not defined yet
                    property = elements[i].getAttribute( 'scale' ); // check for DEF
                    if( property ) name += "s" ;
                    property = elements[i].getAttribute( 'translation' ); // check for DEF
                    if( property ) name += "t" ;
                    property = elements[i].getAttribute( 'rotation' ); // check for DEF
                    if( property ) name += "r" ;
                    property = generateUniqueDEF( name ); // generate a new unique name
                    elements[i].setAttribute( 'DEF', property );
                    DEFines.push( property );
                    if( options.verbose )
                        console.log( "setDefines:: " + token + ".name=" + property );
                }
            }
        }
    }

    return {
		load: load,
		parse: parse,
		//geometries : geometries,
		//materials : materials,
		options: options
	   };
};
});