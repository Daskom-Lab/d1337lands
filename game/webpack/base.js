const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const parsedEnv = require("dotenv").config({ path: path.resolve(__dirname, "../.env") }).parsed;
const localEnv = JSON.stringify({
  "HOST": parsedEnv.HOST,
  "WEBSOCKET_PORT": parsedEnv.WEBSOCKET_PORT
})

module.exports = {
  mode: "development",
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: [/\.vert$/, /\.frag$/],
        use: "raw-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg|xml)$/i,
        use: "file-loader"
      }
    ]
  },
  output: {
    clean: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      CANVAS_RENDERER: JSON.stringify(true),
      WEBGL_RENDERER: JSON.stringify(true),
      "PROCESS.ENV": localEnv,
    }),
    new HtmlWebpackPlugin({
      template: "./index.html"
    })
  ]
};
