module.exports = function(grunt) {
	
	//var path = require('path');

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: {
				esversion: 6
			},
			all: ['Gruntfile.js', 'src/*.js']
		},
		concat: {
			dist: {
				src: ['src/<%= pkg.name %>.js'],
				dest: 'build/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'src/<%= pkg.name %>.js',
				dest: 'build/<%= pkg.name %>.min.js'
			}
		},
		webfont: {
			icons: {
				src: 'icons/*.svg',
				dest: 'build/fonts',
				options: {
					/*rename: function(name){
						return path.basename(name, '.svg').replace(/\./g, '-');
					},*/
					font: 'VideoJSSnapshot',
					stylesheet: 'scss',
					types: 'woff',
					embed: true,
					htmlDemo: false,
					template: 'webfont-template/sass-extend.css'
				}
			}
		},
		sass: {
			dist: {
				options: {
					loadPath: 'build/fonts',
					style: 'compressed',
					sourcemap: 'none'
				},
				files: {
					'build/videojs-snapshot.min.css': 'src/main.scss'
				}
			},
			debug: {
				options: {
					loadPath: 'build/fonts',
					/*style: 'compressed',*/
					sourcemap: 'none'
				},
				files: {
					'build/videojs-snapshot.css': 'src/main.scss'
				}
			}
		}
	});

	//load plugins that provide the tasks
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-webfont');
	grunt.loadNpmTasks('grunt-contrib-sass');

	//default tasks
	grunt.registerTask('default', ['jshint', 'concat', 'webfont', 'sass:debug']);
	grunt.registerTask('release', ['uglify', 'webfont', 'sass:dist']);
};
