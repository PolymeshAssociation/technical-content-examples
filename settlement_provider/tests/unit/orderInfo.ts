import { describe } from "mocha"
import { expect } from "chai"
import {
    AssignedOrderInfo,
    IncompleteInformationError,
    OrderInfo,
    WrongTypeError
} from "../../src/orderInfo"

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

describe("AssignedOrderInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "2",
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new AssignedOrderInfo(bareInfo)

        expect(info["id"]).to.equal("2")
        expect(info.isBuy).to.be.true
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "2",
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
        }
        expect(() => new AssignedOrderInfo(bareInfo)).to.throw()
            .that.satisfies(error =>
                error instanceof IncompleteInformationError 
                && error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": 2,
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        expect(() => new AssignedOrderInfo(bareInfo)).to.throw()
            .that.satisfies(error =>
                error instanceof WrongTypeError
                && error.field === "id"
                && error.receivedType === "number")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "2",
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new AssignedOrderInfo(bareInfo)
        const back = info.toJSON()

        expect(back["id"]).to.equal("2")
        expect(back["isBuy"]).to.be.true
        expect(back["quantity"]).to.equal(12345)
        expect(back["token"]).to.equal("ACME")
        expect(back["price"]).to.equal(33)
    })

})