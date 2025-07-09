module.exports = {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }] // 'automatic' for new JSX transform
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@components': './src/components', 
          '@context': './src/context',  
        }
      }
    ],
  ],
};