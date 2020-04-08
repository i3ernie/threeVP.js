/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "lodash", "ColladaLoader"], function( THREE, _, ColladaLoader )
{
    var defaults = {
        shadow : false,
        scale : 39.37,
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
        var counter = 0;
        dae.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.name = dae.name + counter;
                counter++;
            }
        });
    };

    var counterClockwiseFaceOrder = function( dae )
    {
        dae.traverse( function ( el ) {
            if ( el instanceof THREE.Mesh ) {
                _.each( el.geometry.faces, function( face ){
                    var temp = face.a;
                    face.a = face.c;
                    face.c = temp;
                });
            }
        });

    };

    var ObjectDAE = function( file, opt )
    {
        var loader = new ColladaLoader();
        loader.options.convertUpAxis = true;

        this.options = _.extend( {}, defaults, opt );

        THREE.Object3D.call( this );

        this.registerEvents();

        loader.load( file, function( collada )
        {
            var dae = collada.scene;
            dae.name = this.options.name || file;
            setName(dae);
            if ( this.options.shadow ) enableShadow( dae );

            var scaleX = (this.options.mirror)? -this.options.scale : this.options.scale;
            dae.scale.set( scaleX, this.options.scale, this.options.scale );

            if( this.options.mirror ) counterClockwiseFaceOrder( dae );

            this.add( dae );
            this.options.onLoad( this, dae );
        }.bind(this) );
    };

    //inherits from THREE.Object3D
    ObjectDAE.prototype = Object.create( THREE.Object3D.prototype );
    ObjectDAE.prototype.constructor = ObjectDAE;
    
    ObjectDAE.prototype.registerEvents = function(){
        
    };
    
    return ObjectDAE;
});

