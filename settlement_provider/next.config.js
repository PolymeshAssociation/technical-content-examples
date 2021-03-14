module.exports = {
    serverRuntimeConfig: {
        // Will only be available on the server side
        exchangeDbPath: process.env.EXCHANGE_DB_PATH || "./dbStore/exchange.db",
        settlementDbPath: process.env.SETTLEMENT_DB_PATH || "./dbStore/settlement.db",
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
        appName: "nextDaqSettle",
    },
}