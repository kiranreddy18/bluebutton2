const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin  = require('copy-webpack-plugin');

module.exports = {
  entry: './src/main.ts',

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader', 'angular2-template-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.(html|cs)$/,
        use: ['raw-loader']
      },      
      {
        test: /\.(jpg|png)$/,
        loader: 'file'
      }
    ]
  },
  
  resolve: {
    extensions: ['.ts', '.js']
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body'
    }),
    new CopyWebpackPlugin([{
      from: 'assets/images',
      to: './assets/images'
    }])  
  ],

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: true
  },

  devServer: {
    historyApiFallback: true,
    inline: true,
    port: 8082
  }
};