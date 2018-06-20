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
    'xmldom': 'window',
    '@trust/webcrypto': 'crypto'
  },
  devtool: 'source-map',
  plugins: [
    new MinifyPlugin({ deadcode: false })
  ]
}
