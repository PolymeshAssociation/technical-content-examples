import { describe } from "mocha"
import { expect } from "chai"
import {
    AssignedOrderInfo,
    IAssignedOrderInfo,
    IncompleteOrderInfoError,
    InvalidPolymeshDidError,
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
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
        }

        const info = new OrderInfo(bareInfo)

        expect(info.isBuy).to.be.true
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
        expect(info.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.portfolioId.toString(10)).to.equal("1")
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
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
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
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
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
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
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(WrongZeroOrderError)
            .that.satisfies((error: WrongZeroOrderError) => error.field === "price")
    })

    it("cannot construct from empty polymeshDid", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc",
            "portfolioId": "1",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(InvalidPolymeshDidError)
            .that.satisfies((error: InvalidPolymeshDidError) => error.polymeshDid === "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc")
    })

    it("can construct from empty portfolioId", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
        }

        const back: JSON = new OrderInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "isBuy": true,
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
        }

        const back: JSON = new OrderInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
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
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
        }

        const info: IAssignedOrderInfo = new AssignedOrderInfo(bareInfo)

        expect(info.id).to.equal("2")
        expect(info.isBuy).to.be.true
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
        expect(info.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.portfolioId.toString(10)).to.equal("1")
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
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
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
            "polymeshDid": "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            "portfolioId": "1",
        }

        const back: JSON = new AssignedOrderInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})
