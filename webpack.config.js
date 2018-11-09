const path = require('path')
const MinifyPlugin = require('babel-minify-webpack-plugin')
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
    optimization: {
      minimizer: [
        new MinifyPlugin({ deadcode: false }),
      ]
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
