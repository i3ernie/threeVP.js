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

const task_onpla = function( done ){
plugins.requirejs(
        _.extend({}, requireconfig,
            {
                "name"      : "vendor/require/require",
                "exclude"   : [],
                "out"       : "require.js",
                "include" : ["underscore", "OKP"]
            })
        ).on( "error", console.log )
    .pipe( gulp.dest( dirs.dist ) );
    
    done();
};

module.exports = task_onpla;
    
    
