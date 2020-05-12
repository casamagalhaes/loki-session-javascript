const path = require('path');

module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'loki-session-client.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'LokiSessionClient',
    libraryTarget: 'umd',
  },
};
