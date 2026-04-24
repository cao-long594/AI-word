const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const API_PREFIX = "/juejin-api";

module.exports = (_env, argv) => {
  const isProd = argv.mode === "production";
  const useWhistle = process.env.USE_WHISTLE === "true";

  const proxyConfig = useWhistle
    ? {
        target: "http://127.0.0.1:8899",
        pathRewrite: { "^/juejin-api": "https://api.juejin.cn" },
      }
    : {
        target: "https://api.juejin.cn",
        pathRewrite: { "^/juejin-api": "" },
      };

  return {
    entry: path.resolve(__dirname, "src/main.tsx"),
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProd ? "assets/[name].[contenthash:8].js" : "assets/[name].js",
      clean: true,
      publicPath: isProd ? "./" : "/",
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    devtool: isProd ? "source-map" : "eval-cheap-module-source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "public/index.html"),
        publicPath: isProd ? "./" : "/",
      }),
    ],
    devServer: {
      host: "127.0.0.1",
      port: "auto",
      hot: true,
      open: true,
      historyApiFallback: true,
      proxy: [
        {
          context: [API_PREFIX],
          ...proxyConfig,
          changeOrigin: true,
          secure: false,
          logLevel: "warn",
          headers: {
            origin: "https://juejin.cn",
            referer: "https://juejin.cn/",
          },
        },
      ],
    },
  };
};
