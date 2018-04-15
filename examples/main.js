/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//import _ from './vendor/lodash/lodash.js'; 
//import THREE from './vendor/three/three';
//import Viewport from './Viewport';

require.config({
     baseUrl:"../src",
    
    "paths": {
        "core"      : "core",
        "vendor"    : "vendor",
        "libs"      : "libs",
        
        
        "Viewport"  : "../dist/Viewport",
        "pack"      : "../dist/core"
    },
    
    "map": {
        "*": {
            "underscore": 'lodash'
        }
    }
});

    require(['./app.js'], function( app )
    {
        app.init();
        app.start();
    });


