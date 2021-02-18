import { describe } from "mocha"
import { expect } from "chai"
import {
    AssignedOrderInfo,
    IncompleteOrderInfoError,
    OrderInfo,
    WrongTypeOrderError,
    WrongZeroOrderError
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
        expect(() => new OrderInfo(bareInfo)).to.throw(IncompleteOrderInfoError)
            .that.satisfies((error: IncompleteOrderInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": "true",
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        expect(() => new OrderInfo(bareInfo)).to.throw(WrongTypeOrderError)
            .that.satisfies((error: WrongTypeOrderError) => error.field === "isBuy"
                && error.receivedType === "string")
    })

    it("cannot construct from empty quantity", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 0,
            "token": "ACME",
            "price": 33,
        }
        expect(() => new OrderInfo(bareInfo)).to.throw(WrongZeroOrderError)
            .that.satisfies((error: WrongZeroOrderError) => error.field === "quantity")
    })

    it("cannot construct from empty price", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 0,
        }
        expect(() => new OrderInfo(bareInfo)).to.throw(WrongZeroOrderError)
            .that.satisfies((error: WrongZeroOrderError) => error.field === "price")
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
        expect(() => new AssignedOrderInfo(bareInfo)).to.throw(IncompleteOrderInfoError)
            .that.satisfies((error: IncompleteOrderInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": 2,
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        expect(() => new AssignedOrderInfo(bareInfo)).to.throw(WrongTypeOrderError)
            .that.satisfies((error: WrongTypeOrderError) => error.field === "id"
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