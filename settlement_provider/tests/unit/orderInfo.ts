import { describe } from "mocha"
import { expect } from "chai"
import {
    AssignedOrderInfo,
    AssignedOrderJson,
    IAssignedOrderInfo,
    IncompleteOrderInfoError,
    IOrderInfo,
    OrderInfo,
    OrderJson,
    WrongNumericValueError,
    WrongTypeOrderError,
    WrongZeroOrderError
} from "../../src/orderInfo"

describe("OrderInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
        }

        const info: IOrderInfo = new OrderInfo(bareInfo)

        expect(info.isBuy).to.be.true
        expect(info.quantity.toString(10)).to.equal("12345")
        expect(info.token).to.equal("ACME")
        expect(info.price.toString(10)).to.equal("33")
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: OrderJson = <OrderJson><unknown>{
            isBuy: true,
            quantity: "12345",
            token: "ACME",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(IncompleteOrderInfoError)
            .that.satisfies((error: IncompleteOrderInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: OrderJson = <OrderJson><unknown>{
            isBuy: "true",
            quantity: "12345",
            token: "ACME",
            price: "33",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(WrongTypeOrderError)
            .that.satisfies((error: WrongTypeOrderError) => error.field === "isBuy"
                && error.receivedType === "string")
    })

    it("cannot construct from zero quantity", () => {
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "0",
            token: "ACME",
            price: "33",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(WrongZeroOrderError)
            .that.satisfies((error: WrongZeroOrderError) => error.field === "quantity")
    })

    it("cannot construct from bad quantity number", () => {
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "ab",
            token: "ACME",
            price: "33",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(WrongNumericValueError)
            .that.satisfies((error: WrongNumericValueError) => error.field === "quantity" && error.received === "ab")
    })

    it("cannot construct from zero price", () => {
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "0",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(WrongZeroOrderError)
            .that.satisfies((error: WrongZeroOrderError) => error.field === "price")
    })

    it("cannot construct from bad price number", () => {
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "ab",
        }

        expect(() => new OrderInfo(bareInfo)).to.throw(WrongNumericValueError)
            .that.satisfies((error: WrongNumericValueError) => error.field === "price" && error.received === "ab")
    })

    it("can convert to JSON", () => {
        const bareInfo: OrderJson = {
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
        }

        const back: OrderJson = new OrderInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})

describe("AssignedOrderInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: AssignedOrderJson = {
            id: "2",
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
        }

        const info: IAssignedOrderInfo = new AssignedOrderInfo(bareInfo)

        expect(info.id).to.equal("2")
        expect(info.isBuy).to.be.true
        expect(info.quantity.toString(10)).to.equal("12345")
        expect(info.token).to.equal("ACME")
        expect(info.price.toString(10)).to.equal("33")
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: AssignedOrderJson = <AssignedOrderJson><unknown>{
            id: "2",
            isBuy: true,
            quantity: "12345",
            token: "ACME",
        }

        expect(() => new AssignedOrderInfo(bareInfo)).to.throw(IncompleteOrderInfoError)
            .that.satisfies((error: IncompleteOrderInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: AssignedOrderJson = <AssignedOrderJson><unknown>{
            id: 2,
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
        }

        expect(() => new AssignedOrderInfo(bareInfo)).to.throw(WrongTypeOrderError)
            .that.satisfies((error: WrongTypeOrderError) => error.field === "id"
                && error.receivedType === "number")
    })

    it("can convert to JSON", () => {
        const bareInfo: AssignedOrderJson = {
            id: "2",
            isBuy: true,
            quantity: "12345",
            token: "ACME",
            price: "33",
        }

        const back: AssignedOrderJson = new AssignedOrderInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})
