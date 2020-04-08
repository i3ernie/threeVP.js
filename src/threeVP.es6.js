/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

'use strict';
import * as three from "three/build/three.module.js";
import * as _ from "lodash-es/lodash";

import jquery from "jquery";
import async from "async/dist/async.mjs";
import ThreeBSP from "./vendor/threeCSG.es6.js";
import Backbone from "backbone-es6/src/ModuleRuntime.js";
import url from "../node_modules/url/url.js";
import dat from "dat.gui/build/dat.gui.module.js";
import Tween from "./vendor/tween.esm.js";

let obj = {
    "three"     : three, 
    "_"         : _,
    "$"         : jquery,
    "Backbone"  : Backbone,
    "async"     : async,
    "ThreeBSP"  : ThreeBSP,
    "url"       : url,
    "dat"       : dat,
    "Tween"     : Tween
    
};

export {three, _, jquery as $, async, Backbone, ThreeBSP}
export default obj;