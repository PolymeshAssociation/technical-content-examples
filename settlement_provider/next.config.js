const keys = JSON.parse(require("fs").readFileSync("./keys.json").toString())

module.exports = {
    serverRuntimeConfig: {
        // Will only be available on the server side
        exchangeDbPath: process.env.EXCHANGE_DB_PATH || "./dbStore/exchange.db",
        settlementDbPath: process.env.SETTLEMENT_DB_PATH || "./dbStore/settlement.db",
        polymesh: {
            accountMnemonic: process.env.POLY_ACCOUNT_MNEMONIC || keys["accountMnemonic"],
            middlewareLink: process.env.MIDDLEWARE_LINK || keys["middlewareLink"],
            middlewareKey: process.env.MIDDLEWARE_KEY || keys["middlewareKey"]
        },
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
        appName: "nextDaqSettle",
        polymesh: {
            nodeUrl: process.env.POLY_NODE_URL
                || keys["rpcNetwork"]
                || "wss://alcyone-rpc.polymesh.live",
            venueId: process.env.POLY_VENUE_ID || "90",
            usdToken: process.env.POLY_USD_TOKEN || "DEEPUSD2",
            // TODO choose where the middleware info goes. Server only or public (i.e. shared)?
            middlewareLink: process.env.MIDDLEWARE_LINK || keys["middlewareLink"],
            middlewareKey: process.env.MIDDLEWARE_KEY || keys["middlewareKey"],
        }
    },
}