/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor. 
 */
define(["three",
    "base64!objects/Floor/textures/hardwood2_diffuse.jpg", "base64!objects/Floor/textures/hardwood2_bump.jpg", "base64!objects/Floor/textures/hardwood2_roughness.jpg"], 
function( THREE, diffuse, bump, roughness )
{
    var options = {
        imagetype : 'data:image/jpeg;base64,'
    };
    
    var floorMat = new THREE.MeshStandardMaterial( {
            roughness: 0.8,
            color: 0xffffff,
            metalness: 0.2,
            bumpScale: 0.0005
    });
    
    var image_diffuse = new Image();
    image_diffuse.src = 'data:image/jpeg;base64,' + diffuse;
    var texture_diffuse = new THREE.Texture();
    texture_diffuse.image = image_diffuse;
    image_diffuse.onload = function() {
        texture_diffuse.wrapS = THREE.RepeatWrapping;
        texture_diffuse.wrapT = THREE.RepeatWrapping;
        texture_diffuse.anisotropy = 4;
        texture_diffuse.repeat.set( 10, 24 );
        texture_diffuse.needsUpdate = true;
        floorMat.map = texture_diffuse;
        floorMat.needsUpdate = true;
    };
    
    var image_bump = new Image();
    image_bump.src = 'data:image/jpeg;base64,' + bump;
    var texture_bump = new THREE.Texture();
    texture_bump.image = image_bump;
    image_bump.onload = function() {
        texture_bump.wrapS = THREE.RepeatWrapping;
        texture_bump.wrapT = THREE.RepeatWrapping;
        texture_bump.anisotropy = 4;
        texture_bump.repeat.set( 10, 24 );
        texture_bump.needsUpdate = true;
        floorMat.bumpMap = texture_bump;
        floorMat.needsUpdate = true;
    };
    
    var image_roughness = new Image();
    image_roughness.src = 'data:image/jpeg;base64,' + roughness;
    var texture_roughness = new THREE.Texture();
    texture_roughness.image = image_roughness;
    image_roughness.onload = function() {
        texture_roughness.wrapS = THREE.RepeatWrapping;
        texture_roughness.wrapT = THREE.RepeatWrapping;
        texture_roughness.anisotropy = 4;
        texture_roughness.repeat.set( 10, 24 );
        texture_roughness.needsUpdate = true;
        floorMat.roughnessMap = texture_roughness;
        floorMat.needsUpdate = true;
    };
    
    
    return floorMat;
});

