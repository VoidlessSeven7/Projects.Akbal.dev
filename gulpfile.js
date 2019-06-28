// Gulp.js configuration

const
  // modules
  gulp = require('gulp'),
  newer = require('gulp-newer'),
  imagemin = require('gulp-imagemin'),
  htmlclean = require('gulp-htmlclean'),
  postcss = require('gulp-postcss'),
  assets = require('postcss-assets'),
  autoprefixer = require('autoprefixer'),
  cssnano = require('cssnano'),
  purgecss = require('@fullhuman/postcss-purgecss'),
  uglify = require('gulp-uglify'),

  browserSync = require('browser-sync').create(), // Added for MDBGulp
  rename = require('gulp-rename'), // Added for MDBGulp
  sass = require('gulp-sass'), // Added for MDBGulp
  fs = require('fs'), // Added for MDBGulp

  // Directories
  dirSource = './src/',
  dirDistribution = './dist/',
  dirDependencies = './MDBGulp/', // Added for MDBGulp

  cssAddonsPath = './MDBGulp/css/modules/', // Added for MDBGulp

  // CSS Processors settings
  processors = [
    autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }),
    cssnano()
  ],

  // Image processing settings
  imageSettings = [

    imagemin.gifsicle({
      interlaced: true
    }),
    imagemin.jpegtran({
      progressive: true
    }),
    imagemin.optipng({
      optimizationLevel: 5
    }),
    imagemin.svgo({
      plugins: [{
          removeViewBox: true
        },
        {
          cleanupIDs: false
        }
      ]
    })
  ];

let out = '';

// Image processing
function images() {

  out = dirDistribution + 'images/';

  return gulp.src(dirSource + 'images/**/*')
    .pipe(newer(out))
    .pipe(imagemin(imageSettings))
    .pipe(gulp.dest(out));

};
exports.images = images;

// SASS compiling
function sassCompile() {
  out = dirDistribution + 'css/';

  return gulp.src(dirDependencies + 'scss/*.scss')
    .pipe(newer(out))
    .pipe(sass({
      outputStyle: 'nested'
    }).on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out));

}
exports.sass = gulp.series(sassCompile);

// CSS compiling
function cssCompile() {
  out = dirDistribution + 'css/';

  return gulp.src(dirSource + 'css/*.css')
    .pipe(newer(out))
    .pipe(postcss(processors))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out));

}
exports.css = gulp.series(cssCompile);

// SASS Modules compiling
function sassCompileModules() {
  out = dirDistribution;

  return gulp.src(dirDependencies + 'scss/**/modules/**/*.scss')
    .pipe(newer(out))
    .pipe(sass({
      outputStyle: 'nested'
    }).on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(rename({
      suffix: '.min',
      dirname: cssAddonsPath
    }))
    .pipe(gulp.dest(out));

}
exports.cssmodules = gulp.series(sassCompileModules);






















// Build everything
exports.build = gulp.parallel(exports.sassCompile, exports.cssCompile, exports.images);