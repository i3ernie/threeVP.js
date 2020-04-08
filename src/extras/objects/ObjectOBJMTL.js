/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "lodash", "OBJMTLLoader"], function( THREE, _, OBJMTLLoader )
{
    var defaults = {
        shadow : false,
        scale : 1,
        onLoad : function(){}
    };

    var enableShadow = function( obj )
    {
        obj.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    };

    var ObjectOBJ = function( file, mtlfile, opt )
    {
        var loader = new OBJMTLLoader();

        this.options = _.extend( {}, defaults, opt );

        THREE.Object3D.call( this );

        this.registerEvents();

        loader.load( file, mtlfile, function( obj ){
            if ( this.options.shadow ) { enableShadow( obj ); }
            obj.scale.set( this.options.scale, this.options.scale, this.options.scale );
            this.add( obj );
            this.options.onLoad( this, obj );
        }.bind(this) );
    };
    
    //inherits from THREE.Object3D
    ObjectOBJ.prototype = Object.create( THREE.Object3D.prototype );
    ObjectOBJ.prototype.constructor = ObjectOBJ;
    ObjectOBJ.prototype.super = THREE.Object3D;

    ObjectOBJ.prototype.registerEvents = function(){
        
    };
    
    return ObjectOBJ;
});

