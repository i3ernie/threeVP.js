/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(["three", "module", "lodash", "./material"], function( THREE, module, _, material )
{
    var options = {
        shadow : true,
        material : material,
        size : [ 20, 20 ]
    };    

    var Floor = function( opt )
    {
        this.options = _.extend({}, options, opt);

        var geometry = new THREE.PlaneBufferGeometry( this.options.size[0], this.options.size[1] );
        THREE.Mesh.call(this, geometry, this.options.material );

        this.rotation.x = -Math.PI / 2.0;

        if ( this.options.shadow == true ) { this.receiveShadow = true; }
    };

    //inherits from Mesh
    Floor.prototype = Object.create( THREE.Mesh.prototype );
    Floor.prototype.constructor = Floor;
    Floor.prototype.super = THREE.Mesh;

    return Floor;
});

