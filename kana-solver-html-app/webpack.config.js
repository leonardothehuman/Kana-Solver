const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
//const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = {
  externals: {
    'os': 'commonjs2 os',
    'fs/promises': 'commonjs2 fs/promises',
    'fs': 'commonjs2 fs',
    'path': 'commonjs2 path',
    'yauzl': 'commonjs2 yauzl',
    'iconv-lite': 'commonjs2 iconv-lite',
    'node-disk-info': 'commonjs2 node-disk-info'
  },
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/package.nw'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        loader: 'svelte-loader',
        options: {
          preprocess:  require('svelte-preprocess')({}),
//          emitCss: true,
        }
      },
      {
        // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      // {
      //   test: /\.css$/,
      //   use: [
      //     MiniCssExtractPlugin.loader,
      //     {
      //       loader: 'css-loader',
      //       options: {
      //         esModule: false
      //       }
      //     }
      //   ]
      // },
      {
        test: /\.ts(x)?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.(woff|woff2|ttf)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte')
    },
    extensions: [
      '.mjs',
      '.js',
      '.svelte',
      '.tsx',
      '.ts'
    ],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: ({ htmlWebpackPlugin }) => '<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>' + htmlWebpackPlugin.options.title + '</title></head><body><div id=\"app\"></div></body></html>',
      filename: 'index.html',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'copySrc/**/*',
          //context: 'copySrc',
          //to: "[path]/[name][ext]",
          to({context, absoluteFilename}){
            var relative = path.relative(path.join(context, 'copysrc'), absoluteFilename);
            return relative;
          },
          force: true
        },
        {
          from: 'generatedCopySrc/**/*',
          //context: 'copySrc',
          //to: "[path]/[name][ext]",
          to({context, absoluteFilename}){
            var relative = path.relative(path.join(context, 'generatedCopySrc'), absoluteFilename);
            return relative;
          },
          force: true
        }
      ],
    }),
    //new MiniCssExtractPlugin()
  ]
};

module.exports = config;