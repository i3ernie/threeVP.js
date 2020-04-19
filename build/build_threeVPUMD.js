
const rollup  = require('rollup');
const alias  = require('@rollup/plugin-alias');
const rollup_legacy = require( '@rollup/plugin-legacy');
const rollup_amd = require( 'rollup-plugin-amd' );
const resolve =require('rollup-plugin-node-resolve');

const task_threeVPUMD = function( done ){
 
    return rollup.rollup({
        input: 'src/threeVP.es6.js',
        plugins: [ 
            alias({
                resolve: ['.jsx', '.js'], 
                entries:[
                  {find:'underscore', replacement: './../../lodash-es/lodash.js'},
                  {find:'jquery', replacement: 'node_modules/jquery/src/jquery.js'}
                ]
            }),
            rollup_legacy({
                "node_modules/url/url.js" : 'url',
                "node_modules/tween.js/src/Tween" : "Tween"
            }),
            rollup_amd(),
            resolve() 
        ]
    })
    .then(( bundle ) => {
        return bundle.write({
            file:"dist/threeVP.umd.js",
            format: 'umd', 
            name: 'threeVP',
            exports: 'named'
    })
        
    });

};

    module.exports = task_threeVPUMD;