module.exports = {
    serverRuntimeConfig: {
        // Will only be available on the server side
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
        appName: "tokenManager",
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Note: we provide webpack above so you should not `require` it
        // Perform customizations to webpack config
        // config.plugins.push(new webpack.IgnorePlugin(/\/__tests__\//))

        config.module.rules.push({
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
        })

        // Important: return the modified config
        return config
    },
}
