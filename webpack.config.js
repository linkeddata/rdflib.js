const path = require('path')
const MinifyPlugin = require('babel-minify-webpack-plugin')

module.exports = {
  entry: [
    './src/index.js'
  ],
  output: {
    path: path.join(__dirname, '/dist/'),
    filename: 'rdflib.min.js',
    library: '$rdf',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  externals: {
    'node-fetch': 'fetch',
    'xmldom': 'window'
  },
  devtool: 'source-map',
  plugins: [
    new MinifyPlugin({ deadcode: false })
  ],
  node: {
    fs: 'empty'
  }
}

// TEMPORARY: handle https://github.com/webpack/webpack/issues/6131
if (!(process.version.startsWith("v8")))
  delete module.exports.devtool
