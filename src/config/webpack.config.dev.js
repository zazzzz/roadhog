import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import webpack from 'webpack';
import WatchMissingNodeModulesPlugin from 'react-dev-utils/WatchMissingNodeModulesPlugin';
import DashboardPlugin from 'webpack-dashboard/plugin';
import SystemBellWebpackPlugin from 'system-bell-webpack-plugin';
import getPaths from './paths';
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

export default function (config, cwd) {
  const publicPath = '/';
  const {
    library = null,
    libraryTarget = 'var',
    devtool = defaultDevtool,
  } = config;

  const babelOptions = getBabelOptions(config);
  const cssLoaders = getCSSLoaders(config);
  const theme = getTheme(process.cwd(), config);
  const paths = getPaths(cwd);

  const output = {
    path: paths.appBuild,
    filename: '[name].js',
    publicPath,
    libraryTarget,
    chunkFilename: '[name].async.js',
  };

  if (library) output.library = library;

  const dllPlugins = config.dllPlugin ? [
    new webpack.DllReferencePlugin({
      context: paths.appSrc,
      manifest: require(paths.dllManifest),  // eslint-disable-line
    }),
  ] : [];

  const visualizerPlugins = config.visualizer ? [
    new DashboardPlugin(),
  ] : [];

  const finalWebpackConfig = {
    devtool,
    entry: getEntry(config, paths.appDirectory),
    output,
    ...getResolve(config, paths),
    module: {
      rules: [
        ...getFirstRules({ paths, babelOptions, config }),
        ...getCSSRules('development', { paths, cssLoaders, theme, config }),
        ...getLastRules({ paths, babelOptions }),
      ],
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new CaseSensitivePathsPlugin(),
      new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      new SystemBellWebpackPlugin(),
      ...visualizerPlugins,
      ...dllPlugins,
      ...getCommonPlugins({
        config,
        paths,
        appBuild: paths.appBuild,
        NODE_ENV: process.env.NODE_ENV,
      }),
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
