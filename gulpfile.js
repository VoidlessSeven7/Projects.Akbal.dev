// Gulp.js configuration

const
  // modules
  gulp = require('gulp'),
  imagemin = require('gulp-imagemin'),
  htmlclean = require('gulp-htmlclean'),
  postcss = require('gulp-postcss'),
  assets = require('postcss-assets'),
  autoprefixer = require('autoprefixer'),
  cssnano = require('cssnano'),
  purgecss = require('@fullhuman/postcss-purgecss'),
  uglify = require('gulp-uglify'),
  del = require("del"),

  browsersync = require('browser-sync').create(), // Added for MDBGulp
  rename = require('gulp-rename'), // Added for MDBGulp
  sass = require('gulp-sass'), // Added for MDBGulp
  concat = require('gulp-concat'), // Added for MDBGulp
  eslint = require('gulp-eslint'), // Added for MDBGulp

  // Directories
  dirSource = './src/',
  dirDistribution = './dist/',
  dirDependencies = './MDBGulp/', // Added for MDBGulp

  cssAddonsPath = './css/modules/', // Added for MDBGulp

  // CSS Processors settings
  processors = [
    autoprefixer({
      overrideBrowserslist: ['last 10 versions'],
      cascade: false
    })
  ],

  minifiers = [
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

// ----------- HTML minifying ----------- // 

// HTML Minifier
function html() {
  const out = dirDistribution;

  return gulp.src(dirSource + '**/*.html')
    .pipe(htmlclean())
    .pipe(gulp.dest(out));
}
exports.html = html;

// ----------- Image tampering ----------- // 

// Image processing
function images() {

  out = dirDistribution + 'images/';
  return gulp
    .src(dirSource + 'images/**/*')

    .pipe(imagemin(imageSettings))
    .pipe(gulp.dest(out));

};
exports.images = images;

// ----------- SASS and CSS ----------- // 

// SASS compiling
function sassCompile() {
  out = dirDistribution + 'css/';

  return gulp
    .src(dirDependencies + 'scss/*.scss')
    .pipe(sass({
      outputStyle: 'nested'
    }).on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(gulp.dest(out));

}
exports.sassCompile = sassCompile;

// CSS compiling
function cssCompile() {
  out = dirDistribution + 'css/';

  return gulp
    .src(dirSource + 'css/*.css')
    .pipe(postcss(processors))
    .pipe(gulp.dest(out));

}
exports.csscompile = cssCompile;

// SASS Modules compiling
function sassCompileModules() {
  out = dirDistribution;

  return gulp
    .src(dirDependencies + 'scss/**/modules/**/*.scss')
    .pipe(sass({
      outputStyle: 'nested'
    }).on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(rename({
      dirname: cssAddonsPath
    }))
    .pipe(gulp.dest(out));

}
exports.sasscompilemodules = sassCompileModules;

// CSS minifying
function cssMinify() {
  out = dirDistribution;

  return gulp
    .src([dirDistribution + '**/*.css', '!' + dirDistribution + '**/*.min.css'])
    .pipe(postcss(minifiers))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out))
    .pipe(browsersync.stream());

}
exports.cssminify = cssMinify;

// ----------- JavaScript ----------- //

function jsCompile() {
  out = dirDistribution + 'js/';

  return gulp
    .src([dirSource + "js/", dirSource + "vendor/*.js"])
    // .pipe(eslint())
    // .pipe(eslint.format())
    // .pipe(eslint.failAfterError())
    .pipe(gulp.dest(out));

}
exports.jscompile = jsCompile;

function jsMinify() {
  out = dirDistribution;

  return gulp
    .src([dirDistribution + "**/*.js", "!" + dirDistribution + "**/*.min.js"])
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out))
    .pipe(browsersync.stream());

}
exports.jsminify = jsMinify;

// ----------- MaterialDesignBootstrap JS ----------- //

function getJSModules() {
  delete require.cache[require.resolve(dirDependencies + 'js/modules.js')];
  return require(dirDependencies + 'js/modules.js');
}

function jsMDBBuild() {
  out = dirDistribution + 'js/';

  const plugins = getJSModules();

  return gulp
    .src(plugins.modules)
    .pipe(concat('mdb.js'))
    .pipe(gulp.dest(out));

}
exports.jsmdbbuild = jsMDBBuild;

// ----------- Utilities ----------- //

// Watch files
function watchFiles() {
  gulp.watch(dirDependencies + 'scss/**/*.scss', gulp.series(sassCompile, cssMinify)); // Check for MDB SCSS
  gulp.watch(dirDependencies + 'js/**/*.js', gulp.series(jsMDBBuild, jsMinify)); // Check for MDB JS

  gulp.watch(dirSource + '**/*.css', gulp.series(cssCompile, cssMinify)); // Check for source CSS
  gulp.watch(dirSource + '**/*.js', gulp.series(jsCompile, jsMinify)); // Check for source JS
  gulp.watch(
    [
      dirSource + '**/*.html' // Check for source HTML
    ],
    gulp.series(html, browserSyncReload)
  );
  gulp.watch(dirSource + 'images/**/*', images); // Check for Images
}

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: dirDistribution
    },
    port: 3000
  });
  done();
}

// Reload the browser
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Delete production directory
function clean() {
  return del([dirDistribution]);
}
exports.clean = clean;

// ----------- Utilities for developing ----------- // 
exports.watch = gulp.parallel(watchFiles, browserSync);

exports.build = gulp.series(clean, html, sassCompile, sassCompileModules, cssCompile, jsMDBBuild, jsCompile, gulp.parallel(cssMinify, jsMinify, images));