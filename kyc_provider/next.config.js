const keys = JSON.parse(require("fs").readFileSync("./keys.json").toString())

module.exports = {
    serverRuntimeConfig: {
        // Will only be available on the server side
        kycDbPath: process.env.KYC_DB_PATH || "./dbStore/kycCustomers.db",
        polymesh: {
            accountMnemonic: process.env.POLY_ACCOUNT_MNEMONIC || keys["accountMnemonic"],
            middlewareLink: process.env.MIDDLEWARE_LINK || keys["middlewareLink"],
            middlewareKey: process.env.MIDDLEWARE_KEY || keys["middlewareKey"]
        }
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
        appName: "ezKyc",
        polymesh: {
            nodeUrl: process.env.POLY_NODE_URL
                || keys["rpcNetwork"]
                || "wss://alcyone-rpc.polymesh.live",
            // TODO choose where the middleware info goes. Server only or public (i.e. shared)?
            middlewareLink: process.env.MIDDLEWARE_LINK || keys["middlewareLink"],
            middlewareKey: process.env.MIDDLEWARE_KEY || keys["middlewareKey"],
        }
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
