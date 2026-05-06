const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';
  const apiBase = process.env.COMPOSER_API_BASE || 'http://localhost:8090';

  return {
    entry: './src/index.jsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        // wingui 표면을 shim 으로 대체
        '@wingui/common/imports': path.resolve(__dirname, 'src/shim/wingui/common/imports.js'),
        '@wingui/view/common': path.resolve(__dirname, 'src/shim/wingui/view/common'),
        '@wingui/common': path.resolve(__dirname, 'src/shim/wingui/common'),
        '@wingui': path.resolve(__dirname, 'src/shim/wingui'),
        '@zionex/wingui-core/lang/i18n-func': path.resolve(__dirname, 'src/shim/zionex/i18n-func.js'),
        '@zionex/wingui-core/store/contentStore': path.resolve(__dirname, 'src/shim/zionex/contentStore.js'),
        '@zionex/wingui-core': path.resolve(__dirname, 'src/shim/zionex/wingui-core.js'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: { esmodules: true } }],
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
            },
          },
        },
        { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
        { test: /\.(png|jpg|jpeg|gif|svg)$/i, type: 'asset/resource' },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        templateParameters: { apiBase },
      }),
    ],
    devServer: {
      historyApiFallback: true,
      port: 5173,
      host: '0.0.0.0',
      hot: true,
      client: { overlay: { errors: true, warnings: false } },
      proxy: {
        '/composer': { target: apiBase, changeOrigin: true, secure: false },
        '/actuator': { target: apiBase, changeOrigin: true, secure: false },
      },
    },
    devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
  };
};
