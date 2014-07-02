module.exports = function(grunt) {
 // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dev: {
		options: {
			beautify: false,
			sourceMap: true,
			sourceMapIncludeSources:true,
			sourceMapName: 'mftracking/widget/sourcemap.map'
		  },
        files:{
			'mftracking/widget/mftracking.js':[
											'mftracking/widget/src/mftracking.js'
											]
		}
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['uglify']);

};
