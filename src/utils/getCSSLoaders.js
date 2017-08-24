
export default function getCSSLoaders(config, env) {
  const own = [];
  const nodeModules = [];

  const baseCSSOptions = {
    importLoaders: 1,
    sourceMap: !config.disableCSSSourceMap,
    minimize: env === 'production',
  };

  if (config.disableCSSModules) {
    own.push({
      loader: 'css',
      options: baseCSSOptions,
    });
  } else {
    own.push({
      loader: 'css',
      options: {
        ...baseCSSOptions,
        modules: true,
        localIdentName: '[local]___[hash:base64:5]',
      },
    });
  }
  nodeModules.push({
    loader: 'css',
    options: baseCSSOptions,
  });

  const postcssLoader = {
    loader: 'postcss',
  };

  own.push(postcssLoader);
  nodeModules.push(postcssLoader);

  return {
    own,
    nodeModules,
  };
}
