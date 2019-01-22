const path = require('path')
//const MinifyPlugin = require('babel-minify-webpack-plugin')
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
        // Fall back to window.fetch when solid-auth-client is not present,
        // so rdflib.js can still work outside of Solid
        header: `if (typeof window !== 'undefined') {
                   if (!window.solid)
                     window.solid = {}
                   if (!window.solid.auth)
                     window.solid.auth = { fetch: (a, b) => window.fetch(a, b) }
                 }`
      })
    ],
    optimization: {
      //minimizer: [
      //  new MinifyPlugin({ deadcode: false }),
      //]
    },
    externals: {
      'fs': 'null',
      'solid-auth-client': {
        root: ['solid', 'auth'],
        commonjs: 'solid-auth-client',
        commonjs2: 'solid-auth-client',
      },
      'xmldom': 'window'
    },
    devtool: 'source-map'
  }
}
