const path = require('path')
const MinifyPlugin = require('babel-minify-webpack-plugin')

module.exports = (env, args) => {
  return {
    mode: 'production',
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
    optimization: {
      minimizer: [
        new MinifyPlugin({ deadcode: false }),
      ]
    },
    externals: {
      '@trust/webcrypto': 'crypto',
      'fs': 'null',
      'isomorphic-fetch': 'fetch',
      'node-fetch': 'fetch',
      'text-encoding': 'TextEncoder',
      'whatwg-url': 'window',
      'xhr2': 'XMLHttpRequest',
      'xmldom': 'window',
      'xmlhttprequest': 'XMLHttpRequest',
    },
    devtool: 'source-map'
  }
}
