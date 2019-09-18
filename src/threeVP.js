/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

'use strict';
import * as three from "./vendor/three/three.module";
import * as _ from "../node_modules/lodash-es/lodash";
import * as jq from "./vendor/jquery/jquery.module";

let $ = jq.default;

let obj = {
    three : three, 
    _ : _,
    $ : $
};

export {three, _, $}
export default obj;