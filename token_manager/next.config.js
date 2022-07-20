const keys = JSON.parse(require("fs").readFileSync("./keys.json").toString());

module.exports = {
  serverRuntimeConfig: {
    // Will only be available on the server side
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    appName: "tokenManager",
    // TODO choose where the middleware info goes. Server only or public (i.e. shared)?
    polymesh: {
      middlewareLink: process.env.MIDDLEWARE_LINK || keys["middlewareLink"],
      middlewareKey: process.env.MIDDLEWARE_KEY || keys["middlewareKey"],
    },
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Note: we provide webpack above so you should not `require` it
    // Perform customizations to webpack config
    // config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//))

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });
    // Since webpack 5 WebAssembly is not enabled by default and flagged as experimental feature.
    // We need to enable one of the WebAssembly experiments via 'experiments.asyncWebAssembly: true'
    config.experiments = {
      asyncWebAssembly: true,
    };

    // Important: return the modified config
    return config;
  },
};
