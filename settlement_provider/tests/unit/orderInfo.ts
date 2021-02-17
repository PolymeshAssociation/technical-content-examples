import { describe } from "mocha"
import { expect } from "chai"
import { IncompleteInformationError, OrderInfo, WrongTypeError } from "../../src/orderInfo"
import { assert } from "console"

describe("OrderInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new OrderInfo(bareInfo)

        expect(info.isBuy).to.be.true
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
        }
        expect(() => new OrderInfo(bareInfo)).to.throw()
            .that.satisfies(error =>
                error instanceof IncompleteInformationError 
                && error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": "true",
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        expect(() => new OrderInfo(bareInfo)).to.throw()
            .that.satisfies(error =>
                error instanceof WrongTypeError
                && error.field === "isBuy"
                && error.receivedType === "string")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new OrderInfo(bareInfo)
        const back = info.toJSON()

        expect(back["isBuy"]).to.be.true
        expect(back["quantity"]).to.equal(12345)
        expect(back["token"]).to.equal("ACME")
        expect(back["price"]).to.equal(33)
    })

})