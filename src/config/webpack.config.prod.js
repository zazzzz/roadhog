import webpack from 'webpack';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import Visualizer from 'webpack-visualizer-plugin';
import OfflinePlugin from 'offline-plugin';
import getEntry from '../utils/getEntry';
import getTheme from '../utils/getTheme';
import getCSSLoaders from '../utils/getCSSLoaders';
import addExtraBabelIncludes from '../utils/addExtraBabelIncludes';
import {
  getBabelOptions,
  baseSvgLoader,
  spriteSvgLoader,
  defaultDevtool,
  getResolve,
  getFirstRules,
  getCSSRules,
  getLastRules,
  getCommonPlugins,
  node,
} from './common';

export default function (args, appBuild, config, paths) {
  const { debug, analyze } = args;
  const NODE_ENV = debug ? 'development' : process.env.NODE_ENV;

  const {
    pwa = false,
    filename = '[name].js',
    publicPath = './',
    library = null,
    libraryTarget = 'var',
    devtool = debug ? defaultDevtool : false,
    chunkFilename = './[name].async.js',
    extractCssName = './[name].css',
  } = config;

  const babelOptions = getBabelOptions(config);
  const cssLoaders = getCSSLoaders(config);
  const theme = getTheme(process.cwd(), config);

  const output = {
    path: appBuild,
    filename,
    publicPath,
    libraryTarget,
    chunkFilename,
  };

  if (library) output.library = library;

  const finalWebpackConfig = {
    bail: true,
    devtool,
    entry: getEntry(config, paths.appDirectory, /* isBuild */true),
    output,
    ...getResolve(config, paths),
    module: {
      rules: [
        ...getFirstRules({ paths, babelOptions, config }),
        ...getCSSRules('production', { paths, cssLoaders, theme, config }),
        ...getLastRules({ paths, babelOptions }),
      ],
    },
    plugins: [
      // ref: https://zhuanlan.zhihu.com/p/27980441
      new webpack.optimize.ModuleConcatenationPlugin(),
      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: { discardComments: { removeAll: true } },
        canPrint: false,
      }),
      new ExtractTextPlugin(extractCssName),
      ...getCommonPlugins({
        config,
        paths,
        appBuild,
        NODE_ENV,
      }),
      ...(debug ? [] : [new webpack.optimize.UglifyJsPlugin({
        parallel: true,
        uglifyOptions: {
          compress: {
            screw_ie8: true, // React doesn't support IE8
            warnings: false,
            drop_console: true,
            pure_funcs: ['console.log'],
          },
          mangle: {
            screw_ie8: true,
          },
          output: {
            comments: false,
            screw_ie8: true,
            ascii_only: true,
          },
        },
      })]),
      ...(analyze ? [new Visualizer()] : []),
      ...(pwa ? [new OfflinePlugin({
        autoUpdate: pwa.autoUpdate || 1000 * 60 * 60 * 5,
        ServiceWorker: {
          minify: true,
        },
        AppCache: pwa.AppCache || false,
      })] : []),
    ],
    externals: config.externals,
    node,
  };

  if (config.svgSpriteLoaderDirs) {
    baseSvgLoader.exclude = config.svgSpriteLoaderDirs;
    spriteSvgLoader.include = config.svgSpriteLoaderDirs;
    finalWebpackConfig.module.rules.push(baseSvgLoader);
    finalWebpackConfig.module.rules.push(spriteSvgLoader);
  } else {
    finalWebpackConfig.module.rules.push(baseSvgLoader);
  }

  return addExtraBabelIncludes(finalWebpackConfig, paths, config.extraBabelIncludes, babelOptions);
}
