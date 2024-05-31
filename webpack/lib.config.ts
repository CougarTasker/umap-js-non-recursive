import * as path from 'path';

export default {
  mode: 'production',
  module: {
    rules: [
      {
        test: /(\.ts$|\.js$)/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  entry: {
    lib: path.resolve(__dirname, '../src/lib.ts'),
  },
  output: {
    library: 'UMAP',
    filename: 'umap-js.js',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, '../lib'),
    globalObject: 'this'
  },
  optimization: { minimize: false },
};
