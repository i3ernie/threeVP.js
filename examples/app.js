/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(['three', "cmd", 'Viewport', "less!style/main.less"], function( THREE, CMD, Viewport ){
    
    return {
        init : function(){
            this.VP = new Viewport( );  
        },
        
        start : function(){
            var VP = this.VP;
            
            var geo = new THREE.BoxGeometry(1, 1, 1);
            var mesh = new THREE.Mesh( geo );
            
            VP.scene.add( mesh );
            VP.camera.position.z = 10;
            
            VP.start();

        }
    };
        
});
