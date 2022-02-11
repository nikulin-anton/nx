import { startDevServer } from '@cypress/webpack-dev-server';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { Configuration } from 'webpack';

function buildWebpackConfig({ tsConfigPath, compiler }): Configuration {
  return {
    target: 'web',
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx'],
      plugins: [new TsconfigPathsPlugin({ configFile: tsConfigPath }) as never],
    },
    mode: 'development',
    devtool: false,
    output: {
      publicPath: '/',
      chunkFilename: '[name].bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.(bmp|png|jpe?g|gif|webp|avif)$/,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10_000, // 10 kB
            },
          },
        },
        // {
        //   test: /\.css$|\.scss$|\.sass$|\.less$|\.styl$/,
        // TODO (caleb): style loaders
        // },
        compiler === 'swc'
          ? {
              test: /\.([jt])sx?$/,
              loader: 'swc-loader',
              exclude: /node_modules/,
              options: {
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    decorators: true,
                    tsx: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                    },
                  },
                  loose: true,
                },
              },
            }
          : {
              test: /\.(js|jsx|mjs|ts|tsx)$/,
              loader: 'babel-loader',
              options: {
                presets: ['@nrwl/react/babel'],
              },
            },
      ],
    },
  };
}

export function componentDevServer(
  tsConfigPath = 'tsconfig.spec.json',
  compiler: 'swc' | 'babel' = 'babel',
  extendWebpackConfig?: (config: Configuration) => Configuration
): (
  cypressDevServerConfig,
  devServerConfig
) => ReturnType<typeof startDevServer> {
  const NODE_ENV = 'test';

  if (!process.env.BABEL_ENV) {
    process.env.BABEL_ENV = NODE_ENV;
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = NODE_ENV;
  }

  let webpackConfig = buildWebpackConfig({ tsConfigPath, compiler });

  if (extendWebpackConfig) {
    webpackConfig = extendWebpackConfig(webpackConfig);
  }

  return (cypressDevServerConfig, devServerConfig) =>
    startDevServer({
      options: cypressDevServerConfig,
      // TODO(caleb): why does it want the config on the devServer property?
      //  when used that way it throws errors
      webpackConfig: webpackConfig as never,
    });
}
