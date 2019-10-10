/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import resolve from 'rollup-plugin-node-resolve';

export default [/*{
  input: 'src/threeVP.js',
//  external: ['three.module.js'],
  output: [
    {
        file: 'dist/threeVP.js',
        exports : 'named',
        format: 'cjs'
    },
    {
        file: 'dist/threeVP.module.js',
        exports : 'named',
        format: 'es'
    },
    {
        file: 'dist/threeVP.amd.js',
        exports : 'named',
        format: 'amd'
    }
  ]
} , */{
  input : 'src/libs/async.es.js',
  output : [{
    file: 'dist/async.bundle.js',
    format: 'es'
  }],
  plugins: [ resolve() ]
}
];

