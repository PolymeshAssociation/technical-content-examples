import { promises as fsPromises } from "fs"
import mockedEnv, { RestoreFn } from "mocked-env"
import { expect } from "chai"
import { createMocks } from "node-mocks-http"

const dbPath = `${__dirname}/dbStore_${Math.random() * 1000000}`
const toRestore: RestoreFn = mockedEnv({
    "KYC_DB_PATH": dbPath
})
import handleKycCustomerId from "../../pages/api/kycCustomer/[id]"

after("restore env", async() => {
    toRestore()
    await fsPromises.unlink(dbPath)
})

let customerId = 0;

beforeEach("increase customerId", () => {
    customerId++
})

describe('/api/kycuser/[id] GET Integration Tests', () => {
 
    it('returns 404 on get unknown', async () => {
        const { req, res } = createMocks({
            "method": "GET",
            "query": {
                "id": customerId.toString(),
            }
        })

        await handleKycCustomerId(req, res)

        expect(res._getStatusCode()).to.equal(404)
        expect(JSON.parse(res._getData())).to.deep.equal({"status": "not found"})
    })
 
    it('returns the info on previously set info', async () => {
        {
            const { req, res } = createMocks({
                "method": "PUT",
                "query": {
                    "id": customerId.toString(),
                },
                "body": {
                    "name": "John Doe",
                    "country": "UK",
                    "passport": "12345",
                    "valid": true
                }
            })
            await handleKycCustomerId(req, res)
        }
        const { req, res } = createMocks({
            "method": "GET",
            "query": {
                "id": customerId.toString(),
            }
        })

        await handleKycCustomerId(req, res)

        expect(res._getStatusCode()).to.equal(200)
        expect(JSON.parse(res._getData())).to.deep.equal({
            "name": "John Doe",
            "country": "UK",
            "passport": "12345",
            "valid": true
        })
    })

})

describe('/api/kycuser/[id] PUT Integration Tests', () => {
 
    it('returns 200 on set info', async () => {
        const { req, res } = createMocks({
            "method": "PUT",
            "query": {
                "id": customerId.toString(),
            },
            "body": {
                "name": "John Doe",
                "country": "UK",
                "passport": "12345",
                "valid": true
            }
        })

        await handleKycCustomerId(req, res)

        expect(res._getStatusCode()).to.equal(200)
        expect(JSON.parse(res._getData())).to.deep.equal({"status": "ok"})
    })

})