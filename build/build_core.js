/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

const _ = require('lodash');

const pkg = require('../package.json');
const dirs = pkg.directories;

const requireconfig = require("../config_onpla.json");


const task_core = function( done ){
    plugins.requirejs(
        _.extend({}, requireconfig,
            {
                "name"      : "vendor/require/require",
                "exclude"   : [],
                "out"       : "core.js",
                "include" : ["underscore", "core"]
            })
        ).on("error", console.error)
    .pipe( gulp.dest( dirs.dist ) )
    .on('end', function(){

        plugins.requirejs(
            _.extend({}, requireconfig,
                {
                    "name"      : "vendor/require/require",
                    "exclude"   : [],
                    "out"       : "core.min.js",
                    "include" : ["underscore", "core"]
                })
            ).on("error", console.error)
    // .pipe( plugins.uglify() )
        .pipe( gulp.dest( dirs.dist ) )
        .on('end', function(){
            console.log("made: " + dirs.dist + "/core.js" );
            done();
        });

        
    });
};

module.exports = task_core;