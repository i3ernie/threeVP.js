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

const task_viewport = function( done ){
plugins.requirejs(
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
    done();
};

module.exports = task_viewport;
    
    
