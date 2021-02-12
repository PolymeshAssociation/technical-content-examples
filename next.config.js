const keys = JSON.parse(require("fs").readFileSync("./keys.json").toString())

module.exports = {
    serverRuntimeConfig: {
        // Will only be available on the server side
        kycDbPath: process.env.KYC_DB_PATH || "./dbStore/kycCustomers.db",
        polymesh: {
            accountMnemonic: process.env.POLY_ACCOUNT_URI || keys["accountMnemonic"],
            middlewareLink: process.env.MIDDLEWARE_LINK || keys["middlewareLink"],
            middlewareKey: process.env.MIDDLEWARE_KEY || keys["middlewareKey"]
        }
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
        polymesh: {
            nodeUrl: process.env.POLY_NODE_URL || "wss://pme.polymath.network"
        }
    }
}
