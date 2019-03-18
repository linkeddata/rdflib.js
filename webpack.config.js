const path = require('path')
const WrapperPlugin = require('wrapper-webpack-plugin');

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
    plugins: [
      new WrapperPlugin({
        // Ensure `solid` namespace exists for externals
        header: `if (typeof window !== 'undefined' && !window.solid)
                   window.solid = {};`
      })
    ],
    externals: {
      '@trust/webcrypto': 'crypto',
      'child_process': 'null',
      'node-fetch': 'fetch',
      'text-encoding': 'TextEncoder',
      'whatwg-url': 'window',
      'isomorphic-fetch': 'fetch',
      'fs': 'null',
      'solid-auth-client': {
        root: ['solid', 'auth'],
        commonjs: 'solid-auth-client',
        commonjs2: 'solid-auth-client',
      },
      'solid-auth-cli': 'null',
      'xmldom': 'window'
    },
    devtool: 'source-map'
  }
}
