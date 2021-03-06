'use strict';

var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    'w': 'watch'
  }
});
var log = require('npmlog');
var postcss = require('postcss');
var cssnext = require('postcss-cssnext');
var atImport = require('postcss-import');
var nested = require('postcss-nested');
var watch = require('watch');
var lint = require('./lint-css.js');
var mainInCss = 'src/style.css';
var mainOutCss = 'style.css';

function generateCss(inFile, outFile) {
  var startTime = new Date();
  var css = fs.readFileSync('src/style.css');
  var endTime;

  postcss()
    .use(atImport())
    .use(cssnext({
      browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']
    }))
    .use(nested)
    .process(css, { from: inFile, to: outFile, map: { inline: false }})
    .then(function handleResult(result) {
      var message = 'File %s parsed and %s generated in %sms';

      fs.writeFileSync(outFile, result.css);
      if (result.map) {
        fs.writeFileSync(outFile + '.map', result.map);
        message += ', source map written to %s';
      }

      endTime = new Date();
      log.info('css', message, inFile, outFile, endTime - startTime, outFile + '.map');
    })
    .catch(
      function handleErrors(err) {
        log.error(err.stack);
      }
    );
}

function lintAndGenerate() {
  lint(function onSuccessfulLint() {
    generateCss(mainInCss, mainOutCss);
  });
}

lintAndGenerate();

if (argv.w) {
  watch.watchTree(
    'src',
    {
      'ignoreDotFiles': true
    },
    function handleChanges(f) {
      if (typeof f === 'string') {
        lintAndGenerate();
      }
    }
  );
}
