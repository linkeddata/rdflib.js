const path = require('path')
const WrapperPlugin = require('wrapper-webpack-plugin');

module.exports = (env, args) => {
  return {
    mode: 'production',
    entry: [
      './src/index.ts'
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
    externals: {
      '@trust/webcrypto': 'crypto',
      'child_process': 'null',
      'node-fetch': 'fetch',
      'text-encoding': 'TextEncoder',
      'whatwg-url': 'window',
      'isomorphic-fetch': 'fetch',
      'fs': 'null',
      'xmldom': 'window'
    },
    devtool: 'source-map'
  }
}
