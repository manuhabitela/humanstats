var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};
var folder = ".";
var distFolder = "./dist";

module.exports = function(grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    gruntConfig = {
        pkg: grunt.file.readJSON('package.json'),
        // we compile sass files with compass when they change
        // we livereload when html/css/js is changed
        watch: {
            sass: {
                files: ['scss/**/*.scss'],
                tasks: ['compass:dev', 'autoprefixer:dev']
            },
            livereload: {
                files: [
                    '*.html',
                    'css/*.css',
                    '/img/*.{png,jpg,jpeg}'
                ],
                options: {
                    livereload: true
                }
            },
            scripts: {
                files: ['shared/*.js', 'scripts/!(bundled).js'],
                tasks: ['browserify:dev'],
                options: {
                    livereload: true
                }
            }
        },

        browserify: {
            dev: {
                src: ['scripts/main.js'],
                dest: 'scripts/bundled.js',
                options: {
                  debug: true
                }
            }
        },

        compass: {
            dev: {
                options: {
                    httpPath: '/',
                    cssDir: "css",
                    sassDir: "scss",
                    imagesDir: "img",
                    fontsDir: "fonts",
                    outputStyle: 'expanded',
                    relativeAssets: true
                }
            }
        },

        autoprefixer: {
            options: {
                browsers: ['last 2 versions', 'ie 8', 'android 2.3', 'ff 17']
            },
            dev: {
                src: folder + "/css/style.css",
                dest: folder + "/css/style.css"
            },
            dist: {
                src: distFolder + "/style.css",
                dest: distFolder + "/style.css"
            }
        },

        connect: {
            livereload: {
                options: {
                    port: 9032,
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, '.')
                        ];
                    }
                }
            }
        },

        clean: {
            server: '.tmp'
        }
    };

    grunt.initConfig(gruntConfig);
    grunt.registerTask('server', [
        'clean:server',
        'connect:livereload',
        'watch'
    ]);
    grunt.registerTask('build', [
        'compass:dev',
        'autoprefixer:dev',
        'browserify:dev'
    ]);
};
