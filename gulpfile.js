/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')(); // Load all gulp plugins
                                              // automatically and attach
                                              // them to the `plugins` object
var _ = require('lodash');
const rollup  = require('rollup');
const resolve =require('rollup-plugin-node-resolve');
const alias  = require('@rollup/plugin-alias');

const cjs = require("rollup-plugin-cjs-es");

const rollup_amd = require( 'rollup-plugin-amd' );
const rollup_legacy = require( '@rollup/plugin-legacy');

const task_onpla = require('./build/build_onpla');
const task_core = require('./build/build_core');
const task_viewport = require('./build/build_viewport');
const init_modules = require('./build/init_modules');
const packThreeVPModule = require('./build/build_threeVPModule');
const task_threeVPUMD = require('./build/build_threeVPUMD');

var pkg = require('./package.json');
var dirs = pkg.directories;
var requireconfig = require("./config.json");

const rollupBuild = function ( inputOptions, outputOptions, done ) {
    // create a bundle
    rollup.rollup(inputOptions).then( function( bundle ){

        console.log( bundle.watchFiles ); // an array of file names this bundle depends on

        // generate code
        bundle.generate( outputOptions ).then( function( output ){

            // or write the bundle to disk
            bundle.write(outputOptions).then(function(){
                done();
            });
        });

    });
};

gulp.task('default', ( done ) => {
    // place code for your default task here
});

gulp.task('task_onpla', task_onpla);

gulp.task('init', ( done ) => {
    
    init_modules( done );   
    
});

gulp.task("build", ( done ) => {
    "use strict";
    task_onpla( ()=>{
        task_core( done );
    });
    
});

gulp.task('packThreeVPModule', packThreeVPModule );
gulp.task('buildCore', task_core );

gulp.task('packThreeVPUMD', task_threeVPUMD );

gulp.task('packThreeVPAMD', function( done ){
 
    rollupBuild( {
        input: 'src/threeVP.es6.js',
        plugins: [ resolve() ]
    }, {
        file: 'dist/threeVP.amd.js',
        exports : 'named',
     
        format: 'amd'
    }, done );
});

gulp.task('packAsyncModule', function( done ){
 
    return rollup.rollup({
        input: 'src/libs/async.es.js',
        plugins: [ 
            alias({
                resolve: ['.jsx', '.js'], 
                entries:[
                  {find:'underscore', replacement: './../../lodash-es/lodash.js'}, 
                  {find:'jquery', replacement: './../../../node_modules/jquery/src/jquery.js'}
                ]
            }),
            rollup_legacy({
                "url/url" : 'url'
            }),
            rollup_amd(),
            resolve() 
        ]
    })
    .then(( bundle ) => {
        return bundle.write({
            file:"dist/async.es.js",
            format: 'es', 
            name: 'async',
            exports: 'named'
    });
        
    });
});

gulp.task('make', function( done ){
    let file = process.env.npm_package_config_packs + ".json";
    const conf = require( "./" + file );
    console.log("make...", conf);
    done();
});
