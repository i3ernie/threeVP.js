/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//import _ from './vendor/lodash/lodash.js'; 
//import THREE from './vendor/three/three';
//import Viewport from './Viewport';

require.config({
    "paths": {
        "core"      : "core",
        "vendor"    : "vendor",
        
        "lodash"    : "vendor/lodash/lodash",
        "jquery"    : "libs/jquery-private",
        "backbone"  : "vendor/backbone/backbone",
        
        "json"      : "vendor/require/json",
        "text"      : "vendor/require/text",
        "less"      : "vendor/require/less",
        "normalize" : "vendor/require/normalize",
        
        "three"     : "vendor/three/three",
        
        "Viewport"  : "core/viewport/Viewport",
        
        "cmd" : "core/Command"
    },
    "map": {
        "*": {
            "underscore": 'lodash'
        }
    }
});
