import { promises as fsPromises } from "fs"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"
import * as nextConfig from "../../next.config.js"
import handleKycCustomerId from "../../pages/api/kycCustomer/[id]"
import { CustomerInfo, ICustomerInfo } from "../../src/customerInfo"
import { ICustomerDb, UnknownCustomerError } from "../../src/customerDb"
import customerDbFactory from "../../src/customerDbFactory"

describe("/api/kycCustomer/[id] Integration Tests", () => {
    const onTrustDid = "0x4b0be33fbd1d4ee719bd902e1ee5de6ad6faa1a2558f141488df53482b5c974e"
    const {
        serverRuntimeConfig: { polymesh: {
            accountMnemonic,
        }, },
        publicRuntimeConfig: { polymesh: {
            nodeUrl,
        }, },
    } = nextConfig
    let dbPath: string
    let customerDb: ICustomerDb
    let toRestore: RestoreFn

    beforeEach("mock env", async() => {
        dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
        toRestore = mockedEnv({
            "KYC_DB_PATH": dbPath,
            "POLY_NODE_URL": nodeUrl,
            "POLY_ACCOUNT_MNEMONIC": accountMnemonic,
        })
        customerDb = await customerDbFactory()
    })

    afterEach("restore env", async() => {
        toRestore()
        await fsPromises.unlink(dbPath)
    })

    describe("GET", () => {

        it("returns 404 on get unknown", async () => {
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "3",
                },
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "not found"})
        })

        it("returns the info on previously set info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "valid": false,
                "jurisdiction": "Ie",
                "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            }
            const customerInfo : ICustomerInfo = new CustomerInfo(bareInfo)
            await customerDb.setCustomerInfo("3", customerInfo)
            const { req, res } = createMocks({
                "method": "GET",
                "query": {
                    "id": "3",
                },
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal(bareInfo)
        })

    })

    describe("PUT", () => {

        it("returns 200 on set info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "valid": false,
                "jurisdiction": "Ie",
                "polymeshDid": onTrustDid,
            }
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": bareInfo,
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
            expect((await customerDb.getCustomerInfoById("4")).toJSON()).to.deep.equal(bareInfo)
        }).timeout(30000)

        it("returns 200 on set info missing valid", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "jurisdiction": "Ie",
                "polymeshDid": onTrustDid,
            }
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": bareInfo,
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
            expect((await customerDb.getCustomerInfoById("4")).toJSON()).to.deep.equal({
                ...bareInfo,
                "valid": false,
            })
        }).timeout(30000)

        it("returns 400 on set info with non-existent polymeshDid", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "jurisdiction": "Ie",
                "polymeshDid": "0x".padEnd(66, "0"),
            }
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": "4",
                },
                "body": bareInfo,
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "status": "non-existent Polymesh Did 0x0000000000000000000000000000000000000000000000000000000000000000"
            })

            await expect(customerDb.getCustomerInfoById("4")).to.be.eventually.rejected
                .that.satisfies((error: UnknownCustomerError) => error.id === "4")
        }).timeout(30000)

    })

    describe("PATCH", () => {

        it("returns 404 on patch unknown", async () => {
            const { req, res } = createMocks({
                "method": "PATCH",
                "query": {
                    "id": "3",
                },
                "body": {
                    "passport": "12346",
                    "valid": false,
                }
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(404)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "not found"})
        })

        it("returns 200 on patch existing info", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "valid": true,
                "jurisdiction": "Ie",
                "polymeshDid": onTrustDid,
            }
            const customerInfo : ICustomerInfo = new CustomerInfo(bareInfo)
            await customerDb.setCustomerInfo("3", customerInfo)
            const { req, res } = createMocks({
                "method": "PATCH",
                "query": {
                    "id": "3",
                },
                "body": {
                    "passport": "12346",
                    "valid": false,
                },
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(200)
            expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})

            expect((await customerDb.getCustomerInfoById("3")).toJSON()).to.deep.equal({
                ...bareInfo,
                "passport": "12346",
                "valid": false,
            })
        }).timeout(30000)

        it("returns 400 on patch existing info with non-existent polymeshDid", async () => {
            const bareInfo: JSON = <JSON><unknown>{
                "name": "John Doe",
                "country": "Gb",
                "passport": "12345",
                "valid": true,
                "jurisdiction": "Ie",
                "polymeshDid": null,
            }
            const customerInfo : ICustomerInfo = new CustomerInfo(bareInfo)
            await customerDb.setCustomerInfo("3", customerInfo)
            const { req, res } = createMocks({
                "method": "PATCH",
                "query": {
                    "id": "3",
                },
                "body": {
                    "polymeshDid": "0x".padEnd(66, "0"),
                },
            })

            await handleKycCustomerId(req, res)

            expect(res._getStatusCode()).to.equal(400)
            expect(JSON.parse(res._getData())).to.deep.equal({
                "status": "non-existent Polymesh Did 0x0000000000000000000000000000000000000000000000000000000000000000"
            })

            expect((await customerDb.getCustomerInfoById("3")).toJSON()).to.deep.equal(bareInfo)
        }).timeout(30000)

    })

})
