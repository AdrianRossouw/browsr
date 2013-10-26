var config   = require('./config.json');
var fs       = require('fs');
var _        = require('underscore');
var dbConfig = require('../config.json');
var util    = require('../util');

config.couchapp.db = util.dbUrl(dbConfig.couchdb);
config.template.dbName = dbConfig.couchdb.db;


module.exports = function (grunt) {
    grunt.option('color', false);

    var override = grunt.option('config');
    if (override && grunt.file.exists(override)) {
        config = grunt.file.readJSON(override);
    }

    // Project configuration.
    grunt.initConfig({
        watch: {
            all: {
                files: ['src/js/*.js', 'src/views/*.jade', 'src/css/*.css'],
                tasks: ['default'],
                options: {livereload: true}
            }
        },
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['src/js/app.js', 'app.js', 'Gruntfile.js'],
            options:{
                curly:true,
                eqeqeq:true,
                immed:true,
                newcap:true,
                noarg:true,
                sub:true,
                boss:true,
                browser: true,
                eqnull:true
            },
            globals:{
                angular: false

            }
        },
        shell: {
            install: {
                command: 'node install.js'
            },
            update: {
                command: 'node.io jobs/update.js'
            }
        },
        copy: {
            dist: {
                expand: true, flatten: true, filter: 'isFile',
                src: ['bower_components/bootstrap/dist/fonts/*'],
                dest: 'attachments/fonts/'
            },
            img: {
                expand: true, flatten: true, filter: 'isFile',
                src: ['img/*'],
                dest: 'attachments/img/'
            }
        },
        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            vendor: {
                // the files to concatenate, in order
                src: [
                    "bower_components/underscore/underscore.js",
                    "bower_components/jquery/jquery.js",
                    "bower_components/jquery-bridget/jquery.bridget.js",
                    "bower_components/get-style-property/get-style-property.js",
                    "bower_components/get-size/get-size.js",
                    "bower_components/eventEmitter/EventEmitter.js",
                    "bower_components/eventie/eventie.js",
                    "bower_components/doc-ready/doc-ready.js",
                    "bower_components/matches-selector/matches-selector.js",
                    "bower_components/outlayer/item.js",
                    "bower_components/outlayer/outlayer.js",
                    "bower_components/masonry/masonry.js",
                    "bower_components/imagesloaded/imagesloaded.js",
                    "bower_components/magnific-popup/dist/jquery.magnific-popup.js",
                    "bower_components/angular/angular.min.js",
                    "bower_components/angular-route/angular-route.js",
                    "bower_components/angular-touch/angular-touch.js",
                    "bower_components/angular-cookies/angular-cookies.js",
                    "bower_components/bootstrap/dist/js/bootstrap.js",
                    "bower_components/hammerjs/dist/jquery.hammer.js",
                    "bower_components/angular-hammer/angular-hammer.js",
                    "bower_components/angular-masonry/angular-masonry.js",
                    "bower_components/angular-bootstrap/ui-bootstrap-tpls.js",
                    "bower_components/CornerCouch/angular-cornercouch.js",
                    "bower_components/elastic.js/dist/elastic.js",
                    "bower_components/elastic.js/dist/elastic-angular-client.js",
                    "bower_components/nginfinitescroll/build/ng-infinite-scroll.js",
                ],
                // the location of the resulting JS file
                dest: 'attachments/js/vendor.js'
            },
            app: {
                src: ['src/js/*.js'],
                dest: 'attachments/js/app.js'
            }
        },
        uglify: {
            options: {},
            build: {
                files: {
                    'attachments/js/vendor.min.js': ['attachments/js/vendor.js'],
                    'attachments/js/app.min.js': ['attachments/js/app.js']
                }
            }
        },
        cssmin: {
            minify: {
                files: {
                    'attachments/css/style.css': [
                        'bower_components/magnific-popup/dist/magnific-popup.css',
                        'bower_components/bootstrap/dist/css/bootstrap.css',
                        'src/css/*.css'
                    ]
                }
            }
        },
        jade: {
            html: {
                options: {
                    data: config.template
                },
                files: [
                    {
                        src: ['src/views/index.jade'],
                        dest: 'attachments/index.html'
                    },
                    {
                        expand: true,     // Enable dynamic expansion.
                        flatten: true,
                        src: ['src/views/*.jade'], // Actual pattern(s) to match.
                        dest: 'attachments/views/',   // Destination path prefix.
                        ext: '.html',   // Dest filepaths will have this extension.
                    }
                ]
            }
        },
        rmcouchdb: {
            app: config.couchapp
        },
        mkcouchdb: {
            app: config.couchapp
        },
        couchapp: {
            app: config.couchapp
        }
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-couchapp');
    grunt.loadNpmTasks('grunt-shell');

    // Default task(s).
    grunt.registerTask('default', [
        'jshint',
        'concat',
        'copy',
        'uglify',
        'cssmin',
        'jade',
        'mkcouchdb',
        'couchapp'
    ]);

    grunt.registerTask('install', [
        'default',
        'shell:install',
        'shell:update'
    ]);

    grunt.registerTask('update', [
        'default',
        'shell:update'
    ]);

};
