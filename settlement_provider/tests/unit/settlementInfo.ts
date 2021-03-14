import { describe } from "mocha"
import { expect } from "chai"
import {
    SettlementParty,
    SettlementInfo,
    FullSettlementInfo,
    IncompleteSettlementInfoError,
    WrongTypeSettlementError,
    DuplicatePartiesSettlementError,
    createByMatchingOrders,
    WrongOrderTypeError,
    IncompatibleOrderTypeError,
    ISettlementInfo,
    SettlementPartyJson,
    SettlementJson,
    FullSettlementJson,
    IFullSettlementInfo,
} from "../../src/settlementInfo"
import {
    OrderInfo,
    OrderJson,
    WrongNumericValueError,
    WrongZeroOrderError,
} from "../../src/orderInfo"

describe("SettlementParty Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
        }
        const info: SettlementParty = new SettlementParty(bareInfo)

        expect(info.id).to.equal("1")
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: SettlementPartyJson = <SettlementPartyJson><unknown>{
        }
        expect(() => new SettlementParty(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "id")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: SettlementPartyJson = <SettlementPartyJson><unknown>{
            id: 1,
        }
        expect(() => new SettlementParty(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "id"
                && error.receivedType === "number")
    })

    it("can convert to JSON", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
        }
        const info: SettlementPartyJson = new SettlementParty(bareInfo).toJSON()

        expect(info.id).to.equal("1")
    })

})

describe("SettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        const info: ISettlementInfo = new SettlementInfo(bareInfo)

        expect(info.buyer.id).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.quantity.toString(10)).to.equal("12345")
        expect(info.token).to.equal("ACME")
        expect(info.price.toString(10)).to.equal("33")
        expect(info.isPaid).to.be.false
        expect(info.isTransferred).to.be.false
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: SettlementJson = <SettlementJson><unknown>{
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: SettlementJson = <SettlementJson><unknown>{
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: 12345,
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "quantity"
                && error.receivedType === "number")
    })

    it("cannot construct from same seller and buyer id", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
            },
            seller: {
                id: "1",
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(DuplicatePartiesSettlementError)
            .that.satisfies((error: DuplicatePartiesSettlementError) => error.partyId === "1")
    })

    it("cannot construct from 0 quantity", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "0",
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(WrongZeroOrderError)
            .that.satisfies((error: WrongZeroOrderError) => error.field === "quantity")
    })

    it("cannot construct from non number quantity", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "ab",
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(WrongNumericValueError)
            .that.satisfies((error: WrongNumericValueError) => error.field === "quantity" && error.received === "ab")
    })

    it("cannot construct from 0 price", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            price: "0",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(WrongZeroOrderError)
            .that.satisfies((error: WrongZeroOrderError) => error.field === "price")
    })

    it("cannot construct from non number price", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            price: "ab",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(WrongNumericValueError)
            .that.satisfies((error: WrongNumericValueError) => error.field === "price" && error.received === "ab")
    })
    it("can convert to JSON", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        const back: SettlementJson = new SettlementInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})

describe("FullSettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: FullSettlementJson = {
            id: "3",
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            isPaid: true,
            isTransferred: false,
        }
        const info: IFullSettlementInfo = new FullSettlementInfo(bareInfo)

        expect(info.id).to.equal("3")
        expect(info.buyer.id).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.quantity.toString(10)).to.equal("12345")
        expect(info.token).to.equal("ACME")
        expect(info.price.toString(10)).to.equal("33")
        expect(info.isPaid).to.be.true
        expect(info.isTransferred).to.be.false
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: FullSettlementJson = <FullSettlementJson><unknown>{
            id: "3",
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            isPaid: true,
            isTransferred: false,
        }
        expect(() => new FullSettlementInfo(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: FullSettlementJson = <FullSettlementJson><unknown>{
            id: "3",
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: 12345,
            token: "ACME",
            price: "33",
            isPaid: true,
            isTransferred: false,
        }
        expect(() => new FullSettlementInfo(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "quantity"
                && error.receivedType === "number")
    })

    it("can convert to JSON", () => {
        const bareInfo: FullSettlementJson = {
            id: "3",
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            isPaid: true,
            isTransferred: false,
        }
        const back: FullSettlementJson = new FullSettlementInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})

describe("Matching orders Unit Tests", () => {

    it("cannot construct if isBuy are not correct", async () => {
        const buyOrder1: OrderInfo = new OrderInfo({
            isBuy: true,
            quantity: "10",
            token: "ACME",
            price: "33",
        })
        const buyOrder2: OrderInfo = new OrderInfo({
            isBuy: true,
            quantity: "15",
            token: "ACME",
            price: "40",
        })

        expect(() => createByMatchingOrders("1", buyOrder1, "2", buyOrder2)).to.throw(WrongOrderTypeError)
            .that.satisfies((error: WrongOrderTypeError) => error.expectedIsBuy === false)
    })

    it("cannot construct when tokens not matching", async () => {
        const buyOrder: OrderInfo = new OrderInfo({
            isBuy: true,
            quantity: "10",
            token: "ACME",
            price: "33",
        })
        const sellOrder: OrderInfo = new OrderInfo({
            isBuy: false,
            quantity: "15",
            token: "ECMN",
            price: "40",
        })

        expect(() => createByMatchingOrders("1", buyOrder, "2", sellOrder)).to.throw(IncompatibleOrderTypeError)
            .that.satisfies((error: IncompatibleOrderTypeError) => error.buyToken === "ACME" && error.sellToken === "ECMN")
    })

    it("cannot construct when same buyer and seller id", async () => {
        const buyOrder: OrderInfo = new OrderInfo({
            isBuy: true,
            quantity: "10",
            token: "ACME",
            price: "33",
        })
        const sellOrder: OrderInfo = new OrderInfo({
            isBuy: false,
            quantity: "15",
            token: "ACME",
            price: "40",
        })

        expect(() => createByMatchingOrders("1", buyOrder, "1", sellOrder)).to.throw(DuplicatePartiesSettlementError)
            .that.satisfies((error: DuplicatePartiesSettlementError) => error.partyId === "1")
    })

    it("creates settlement when got a match, and got correct data, seller has more", async () => {
        const buyOrder: OrderInfo = new OrderInfo({
            isBuy: true,
            quantity: "10",
            token: "ACME",
            price: "33",
        })
        const bareSellOrder: OrderJson = {
            isBuy: false,
            quantity: "15",
            token: "ACME",
            price: "35",
        }
        const sellOrder: OrderInfo = new OrderInfo(bareSellOrder)

        const settlement: ISettlementInfo = createByMatchingOrders("1", buyOrder, "2", sellOrder)

        expect(settlement.toJSON()).to.deep.equal({
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "10",
            token: "ACME",
            price: "34",
            isPaid: false,
            isTransferred: false,
        })
    })

    it("creates settlement when got a match, and got correct data, buyer has more", async () => {
        const buyOrder: OrderInfo = new OrderInfo({
            isBuy: true,
            quantity: "15",
            token: "ACME",
            price: "33",
        })
        const sellOrder: OrderInfo = new OrderInfo({
            isBuy: false,
            quantity: "10",
            token: "ACME",
            price: "35",
        })

        const settlement: ISettlementInfo = createByMatchingOrders("1", buyOrder, "2", sellOrder)

        expect(settlement.toJSON()).to.deep.equal({
            buyer: {
                id: "1",
            },
            seller: {
                id: "2",
            },
            quantity: "10",
            token: "ACME",
            price: "34",
            isPaid: false,
            isTransferred: false,
        })
    })

})
