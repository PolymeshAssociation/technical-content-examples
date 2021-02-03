module.exports = {
    serverRuntimeConfig: {
        // Will only be available on the server side
        kycDbPath: process.env.KYC_DB_PATH || "./dbStore/kycCustomers.db"
    },
    publicRuntimeConfig: {
        // Will be available on both server and client
    },
}