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
  fs = require("fs"),

  browsersync = require('browser-sync').create(), // Added for MDBGulp
  rename = require('gulp-rename'), // Added for MDBGulp
  sass = require('gulp-sass'), // Added for MDBGulp
  concat = require('gulp-concat'), // Added for MDBGulp

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
exports.cssCompile = cssCompile;

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
exports.sassCompileModules = sassCompileModules;

// CSS minifying
function cssMinify() {
  out = dirDistribution + 'css/';

  return gulp
    .src(dirDistribution + 'css/*.css', '!' + dirDistribution + 'css/*.min.css', '!' + dirDistribution + 'css/bootstrap.css')
    .pipe(postcss(minifiers))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out))
    .pipe(browsersync.stream());

}
exports.cssMinify = cssMinify;

// SASS Modules minifying
function sassMinifyModules() {
  out = dirDistribution + 'css/modules/';

  return gulp
    .src(dirDistribution + 'css/modules/*.css', '!' + dirDistribution + 'css/modules/*.min.css')
    .pipe(postcss(minifiers))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out))
    .pipe(browsersync.stream());

}
exports.sassMinifyModules = sassMinifyModules;

// ----------- JavaScript ----------- //

function getJSModules() {
  delete require.cache[require.resolve(dirDependencies + 'js/modules.js')];
  return require(dirDependencies + 'js/modules.js');
}

function getLiteJSModules() {
  delete require.cache[require.resolve(dirDependencies + 'js/modules.lite.js')];
  return require(dirDependencies + 'js/modules.lite.js');
}

function jsBuild() {
  out = dirDistribution + 'js/';

  const plugins = getJSModules();

  return gulp
    .src(plugins.modules)
    .pipe(concat('mdb.js'))
    .pipe(gulp.dest(out));

}
exports.jsbuild = jsBuild;

function jsBuildLite() {
  out = dirDistribution + 'js/';

  const pluginsLite = getLiteJSModules();

  return gulp
    .src(pluginsLite.modules)
    .pipe(concat('mdb.lite.js'))
    .pipe(gulp.dest(out));

}
exports.jsbuildlite = jsBuildLite;

function jsBuildMinify() {
  out = dirDistribution + 'js/';

  return gulp
    .src(dirDistribution + 'js/mdb.js')
    //.pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out))
    .pipe(browsersync.stream());

}
exports.jsbuildminify = jsBuildMinify;

function jsBuildMinifyLite() {
  out = dirDistribution + 'js/';

  return gulp
    .src(dirDistribution + 'js/mdb.lite.js')
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(out))
    .pipe(browsersync.stream());

}
exports.jsbuildminify = jsBuildMinifyLite;

// ----------- Utilities ----------- //

// Replacer
function nada() {
  console.log('nada');
}

// Watch files
function watchFiles() {
  gulp.watch(dirSource + 'css/**/*', gulp.series(cssCompile, cssMinify)); // Check for source CSS
  gulp.watch(dirSource + 'js/**/*', nada); // Check for source JS
  gulp.watch(dirDependencies + 'scss/**/*.scss', gulp.series(sassCompile, cssMinify)); // Check for dependency SCSS
  gulp.watch(dirDependencies + 'js/**/*.js', gulp.series(jsBuild, jsBuildMinify)); // Check for dependency JS
  gulp.watch(
    [
      dirSource + 'html/**/*',
      dirSource + 'index.html' // Check for HTML
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

exports.build = gulp.series(clean, html, sassCompile, sassCompileModules, cssCompile, jsBuild, gulp.parallel(cssMinify, sassMinifyModules, images, jsBuildMinify));