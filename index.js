var SourceMapSource       = require('webpack-core/lib/SourceMapSource'),
    RawSource             = require('webpack-core/lib/RawSource'),
    ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers'),
    codegen               = require('escodegen'),
    esprima               = require('esprima'),
    esmangle              = require('esmangle'),
    sourcemapToAst        = require('sourcemap-to-ast'),
    defaults              = require('lodash.defaults');

function ESMangleWebpackPlugin(options) {
  this.options = (typeof options === 'object') ? options : {};
}
module.exports = ESMangleWebpackPlugin;

ESMangleWebpackPlugin.prototype.apply = function apply(compiler) {

  var options = defaults(this.options, {
    test  : /\.js($|\?)/i,
    format: {
      renumber   : true,
      hexadecimal: true,
      escapeless : true,
      compact    : true,
      semicolons : false,
      parentheses: false
    }
  });

  compiler.plugin('compilation', function (compilation) {

    // ensure source-map is enabled in the build step
    if (options.sourceMap !== false) {
      compilation.plugin('build-module', function (module) {
        // to get detailed location info about errors
        module.useSourceMap = true;
      });
    }

    // overall processing
    compilation.plugin('optimize-chunk-assets', function (chunks, callback) {
      var files = [];

      chunks.forEach(function (chunk) {
        chunk.files
          .forEach(pushFile);
      });

      compilation.additionalChunkAssets
        .forEach(pushFile);

      files
        .filter(ModuleFilenameHelpers.matchObject.bind(undefined, options))
        .forEach(processFile);
      callback();

      function pushFile(file) {
        files.push(file);
      }

      function processFile(file) {
        var asset = compilation.assets[file];
        if (asset.__RemoveCommentsPlugin) {
          compilation.assets[file] = asset.__RemoveCommentsPlugin;
          return;
        }
        var inputSourceMap,
            input;
        if (options.sourceMap !== false) {
          if (asset.sourceAndMap) {
            var sourceAndMap = asset.sourceAndMap();
            inputSourceMap = sourceAndMap.map;
            input = sourceAndMap.source;
          } else {
            inputSourceMap = asset.map();
            input = asset.source();
          }
          inputSourceMap.sources
            .forEach(eachSource);
        } else {
          input = asset.source();
        }

        function eachSource(value, i, array) {
          array[i] = value
            .replace(/^.*\!(.*)$/, '$1')
            .replace(process.cwd(), '');
        }

        delete inputSourceMap.sourcesContent;

        // parse code to AST using esprima
        var ast = esprima.parse(input, {
          loc    : true,
          comment: true
        });

        // make sure the AST has the data from the original source map
        sourcemapToAst(ast, inputSourceMap);

        // update the AST
        var updated = esmangle.mangle(ast);

        // generate compressed code from the AST
        var pair = codegen.generate(updated, {
          sourceMap        : true,
          sourceMapWithCode: true,
          format           : options.format
        });
        var stream = pair.code;
        var map = pair.map.toString();

        asset.__RemoveCommentsPlugin = compilation.assets[file] = (map ?
          new SourceMapSource(stream, file, JSON.parse(map), input, inputSourceMap) :
          new RawSource(stream));
      }
    });

    // ensure the module loader knows we are minified
    compilation.plugin('normal-module-loader', function (context) {
      context.minimize = true;
    });
  });
};
