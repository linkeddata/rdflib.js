const path = require('path')
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const TerserPlugin = require('terser-webpack-plugin')

module.exports = (env, args) => {
  return {
    mode: 'production',
    entry: [
      './src/index.ts'
    ],
    target: "web",
    output: {
      path: path.join(__dirname, '/dist/'),
      filename: 'rdflib.min.js',
      library: '$rdf',
      libraryTarget: 'umd'
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.(js|ts)$/,
          loader: "source-map-loader"
        }
      ]
    },
    resolve: { extensions: ['.js', '.ts'] },
    optimization: {
      minimizer: [
        // Escape non-ASCII characters in the minified output so the bundle
        // still parses when served without a charset declaration and the
        // browser falls back to e.g. windows-1252 (#422).
        new TerserPlugin({
          terserOptions: {
            format: { ascii_only: true }
          }
        })
      ]
    },
    externals: {
      '@trust/webcrypto': 'crypto',
      '@xmldom/xmldom': 'window',
      'child_process': 'null',
      'node-fetch': 'fetch',
      'text-encoding': 'TextEncoder',
      'whatwg-url': 'window',
      'isomorphic-fetch': 'fetch',
      'fs': 'null',
    },
    plugins: [
      new NodePolyfillPlugin()
    ],
    devtool: 'source-map'
  }
}
