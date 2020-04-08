/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "X3DLoader", "lodash"], function( THREE, X3DLoader, _ ){ 
    
    var loader = new THREE.X3DLoader();
    loader.options.convertUpAxis = true;
    var options = {
        shadow : false,
        scale : 39.37,
        mirror : false,
        normalize : true,
        onLoad : function(){}
    };

    var enableShadow = function( dae )
    {
        dae.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    };

    var setName = function( dae )
    {
        dae.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                if ( dae.name && (!child.name || child.name == "") ) child.name = dae.name + "_child";
                child.geometry.computeFaceNormals();
                child.geometry.computeVertexNormals();
            }
        });
    };

    var ObjectX3D = function( file, opt )
    {
        if ( opt ) this.options = _.extend( {}, options, opt );

        THREE.Object3D.call( this );

        this.registerEvents();

        loader.load( file, function( collada )
        {
            var dae = collada.scene;
            if (this.options.name) { dae.name = this.options.name; }
            setName( dae );
            if ( this.options.shadow ) { enableShadow( dae ); }

            var scaleX = (this.options.mirror)? -this.options.scale : this.options.scale;
            //ToDo: wenn mirror dann noch UVs spiegel!!
            dae.scale.set( scaleX, this.options.scale, this.options.scale );

            this.add( dae );
            this.options.onLoad( this, dae );
        }.bind(this) );
    };

    //inherits from THREE.Object3D
    ObjectX3D.prototype = Object.create( THREE.Object3D.prototype );
    ObjectX3D.prototype.constructor = ObjectX3D;
    ObjectX3D.prototype.super = THREE.Object3D;

    ObjectX3D.prototype.registerEvents = function(){

    };

    return ObjectX3D;
});