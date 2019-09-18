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
var fs = require('fs');
const rollup  = require('rollup');

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

gulp.task('init', ( done ) => {
    
    var fnc = function( src, dest, req, name, mod )
    {
        var end = '';
        
        fs.readFile( './node_modules/'+src, 'utf8', ( err, content ) => {
            if ( err ) { console.log( err ); return; }
            if ( typeof mod === "string" ) { end = "\n return " + mod + ';';  }
            var ret = ( typeof req === "string" )? 'define('+req+', function('+name+'){\n' + content + end + "\n});" : content;
            fs.writeFile(dest, ret, 'utf8', ( err ) => {
                if ( err ) { console.log( "ERROR: ", err ); }
            });
        });
    };
    
    var modules = require("./modules.json");
    
    _.each(modules, ( el ) =>{
        fnc(el.src, el.dest, el.req , el.name, el.mod);
    });    
    done();
    
});

gulp.task("build", ( done ) => {
    "use strict";
    var ret = plugins.requirejs(
        _.extend({}, requireconfig,
            {
                "name"      : "Viewport",
                "exclude"   : ["three", "lodash", "backbone", "jquery", "cmd", "json", "text"],
                "out"       : "Viewport.js",
                "generateSourceMaps": true
            })
    ).on("error", console.log)
    .pipe( gulp.dest( dirs.dist ) );

    plugins.requirejs(
        _.extend({}, requireconfig,
            {
                "name"      : "Viewport",
                "exclude"   : ["three", "lodash", "backbone", "jquery", "cmd", "json", "text"],
                "out"       : "Viewport.min.js"
            })
        ).on("error", console.log)
    .pipe( plugins.uglify() )
    .pipe( gulp.dest( dirs.dist ) );
    
    plugins.requirejs(
        _.extend({}, requireconfig,
            {
                "name"      : "vendor/require/require",
                "exclude"   : [],
                "out"       : "core.js",
                "include" : ["underscore", "core"]
            })
        ).on("error", console.log)
    .pipe( gulp.dest( dirs.dist ) );
    
    plugins.requirejs(
        _.extend({}, requireconfig,
            {
                "name"      : "vendor/require/require",
                "exclude"   : [],
                "out"       : "core.min.js",
                "include" : ["underscore", "core"]
            })
        ).on("error", console.log)
    .pipe( plugins.uglify() )
    .pipe( gulp.dest( dirs.dist ) );

    return ret;
});

gulp.task('packThreeVPModule', function( done ){
 
    rollupBuild( {
        input: 'src/threeVP.js'
    }, {
        file: 'dist/threeVP.module.js',
        exports : 'named',
        format: 'es'
    }, done );
});

gulp.task('packThreeVPUMD', function( done ){
 
    rollupBuild( {
        input: 'src/threeVP.js'
    }, {
        file: 'dist/threeVP.umd.js',
        exports : 'named',
        name: 'threeVP',
        format: 'umd'
    }, done );
});

gulp.task('packThreeVPAMD', function( done ){
 
    rollupBuild( {
        input: 'src/threeVP.js'
    }, {
        file: 'dist/threeVP.amd.js',
        exports : 'named',
     
        format: 'amd'
    }, done );
});
