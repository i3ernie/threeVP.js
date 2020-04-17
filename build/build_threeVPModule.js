const gulp = require('gulp');
const rollup  = require('rollup');
const alias  = require('@rollup/plugin-alias');

const packThreeVPModule = function( done ){
 
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
            rollup_amd(),
            rollup_legacy({
                "node_modules/url/url.js" : 'url'
            }),
            resolve()
            
        ]
    })
    .then(( bundle ) => {
        return bundle.write({
            file:"dist/threeVP.es.js",
            format: 'es', 
            name: 'threeVP',
            exports: 'named'
    })
        
    });
};

module.exports = packThreeVPModule;