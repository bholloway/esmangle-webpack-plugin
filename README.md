# ESMangle Webpack Plugin

[![NPM](https://nodei.co/npm/esmangle-webpack-plugin.png)](http://github.com/bholloway/esmangle-webpack-plugin)

A minifier for Webpack based on [ESMangle](https://github.com/estools/esmangle).

Almost as effective as the [Uglify plugin](http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin) whilst significantly **faster**.

Use this plugin **all the time** so that you are developing the same code that you will deploy. Avoid surprises in production, particularly with **Angular** based projects.

## Usage

```javascript
var ESMangleWebpackPlugin = require('esmangle-webpack-plugin');
{
  plugins : [
    new ESMangleWebpackPlugin()
  ]
}
```

It is possible to pass `options` to the constructor, but this is normally not required. By default the plugin will produce a compressed output for all `.js` files.

## How it works

Esprima parses the code into an Abstract Syntax Tree (AST). This is passed to **esmangle** which renames variables but does not compress the code. The AST is rendered back to Javascript by applying **escodegen** with `options.format`.

The default constructor is equivalent to the following.

```javascript
new ESMangleWebpackPlugin({
	test  : /\.js($|\?)/i,
	format: {
		renumber   : true,
		hexadecimal: true,
		escapeless : true,
		compact    : true,
		semicolons : false,
		parentheses: false
	}
})
```
