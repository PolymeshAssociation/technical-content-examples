import { describe } from "mocha"
import { expect } from "chai"
import {
    PortfolioLike,
} from "@polymathnetwork/polymesh-sdk/types"
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
    DuplicatePolymeshDidSettlementError,
    PublishedSettlementInfo,
    ISettlementInfo,
    SettlementPartyJson,
    SettlementJson,
    PublishedSettlementJson,
    FullSettlementJson,
    IFullSettlementInfo,
} from "../../src/settlementInfo"
import {
    OrderInfo,
    InvalidPolymeshDidError,
    OrderJson,
    WrongNumericValueError,
    WrongZeroOrderError,
} from "../../src/orderInfo"
import { BigNumber } from "@polymathnetwork/polymesh-sdk"

describe("SettlementParty Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        const info: SettlementParty = new SettlementParty(bareInfo)

        expect(info.id).to.equal("1")
        expect(info.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.portfolioId.toString(10)).to.equal("1")
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: SettlementPartyJson = <SettlementPartyJson><unknown>{
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        expect(() => new SettlementParty(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "id")
    })

    it("cannot construct from wrong polymeshDid JSON", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc",
            portfolioId: "1",
        }
        expect(() => new SettlementParty(bareInfo)).to.throw(InvalidPolymeshDidError)
            .that.satisfies((error: InvalidPolymeshDidError) => error.polymeshDid === "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc")
    })

    it("can construct from JSON missing portfolioId", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: null,
        }
        const info: SettlementParty = new SettlementParty(bareInfo)

        expect(info.id).to.equal("1")
        expect(info.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.portfolioId).to.be.null
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: SettlementPartyJson = <SettlementPartyJson><unknown>{
            id: 1,
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        expect(() => new SettlementParty(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "id"
                && error.receivedType === "number")
    })

    it("can convert to JSON", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        const info: SettlementPartyJson = new SettlementParty(bareInfo).toJSON()

        expect(info.id).to.equal("1")
        expect(info.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.portfolioId).to.equal("1")
    })

    it("can convert to numbered PortfolioLike", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        }
        const info: SettlementParty = new SettlementParty(bareInfo)
        const portfolioLike: PortfolioLike = info.toPortfolioLike()

        expect(portfolioLike).to.deep.equal({
            identity: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            id: new BigNumber("1")
        })
    })

    it("can convert to default PortfolioLike", () => {
        const bareInfo: SettlementPartyJson = {
            id: "1",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: null,
        }
        const info: SettlementParty = new SettlementParty(bareInfo)
        const portfolioLike: PortfolioLike = info.toPortfolioLike()

        expect(portfolioLike).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
    })

})

describe("SettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        const info: ISettlementInfo = new SettlementInfo(bareInfo)

        expect(info.buyer.id).to.equal("1")
        expect(info.buyer.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.buyer.portfolioId.toString(10)).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.seller.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2")
        expect(info.seller.portfolioId).to.be.null
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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

    it("cannot construct from same seller and buyer polymeshDid", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(DuplicatePolymeshDidSettlementError)
            .that.satisfies((error: DuplicatePolymeshDidSettlementError) => error.polymeshDid === "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
    })

    it("cannot construct from non number quantity", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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

    it("cannot construct from non number quantity", () => {
        const bareInfo: SettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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

describe("PublishedSettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: PublishedSettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            instructionId: "445",
            isPaid: false,
            isTransferred: false,
        }
        const info: PublishedSettlementInfo = new PublishedSettlementInfo(bareInfo)

        expect(info.buyer.id).to.equal("1")
        expect(info.buyer.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.buyer.portfolioId.toString(10)).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.seller.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2")
        expect(info.seller.portfolioId).to.be.null
        expect(info.quantity.toString(10)).to.equal("12345")
        expect(info.token).to.equal("ACME")
        expect(info.price.toString(10)).to.equal("33")
        expect(info.instructionId.toString(10)).to.equal("445")
        expect(info.isPaid).to.be.false
        expect(info.isTransferred).to.be.false
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: PublishedSettlementJson = <PublishedSettlementJson><unknown>{
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            instructionId: "445",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new PublishedSettlementInfo(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: PublishedSettlementJson = <PublishedSettlementJson><unknown>{
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: 12345,
            token: "ACME",
            price: "33",
            instructionId: "445",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new PublishedSettlementInfo(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "quantity"
                && error.receivedType === "number")
    })

    it("cannot construct from bad number for instructionId in JSON", () => {
        const bareInfo: PublishedSettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            instructionId: "ab",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new PublishedSettlementInfo(bareInfo)).to.throw(WrongNumericValueError)
            .that.satisfies((error: WrongNumericValueError) => error.field === "instructionId"
                && error.received === "ab")
    })

    it("cannot construct from same seller and buyer id", () => {
        const bareInfo: PublishedSettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            instructionId: "445",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(DuplicatePartiesSettlementError)
            .that.satisfies((error: DuplicatePartiesSettlementError) => error.partyId === "1")
    })

    it("cannot construct from same seller and buyer polymeshDid", () => {
        const bareInfo: PublishedSettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            instructionId: "445",
            isPaid: false,
            isTransferred: false,
        }
        expect(() => new PublishedSettlementInfo(bareInfo)).to.throw(DuplicatePolymeshDidSettlementError)
            .that.satisfies((error: DuplicatePolymeshDidSettlementError) => error.polymeshDid === "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
    })

    it("can convert to JSON", () => {
        const bareInfo: PublishedSettlementJson = {
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            instructionId: "445",
            isPaid: false,
            isTransferred: false,
        }
        const back: PublishedSettlementJson = new PublishedSettlementInfo(bareInfo).toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})

describe("FullSettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: FullSettlementJson = {
            id: "3",
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            instructionId: "445",
            isPaid: true,
            isTransferred: false,
        }
        const info: IFullSettlementInfo = new FullSettlementInfo(bareInfo)

        expect(info.id).to.equal("3")
        expect(info.buyer.id).to.equal("1")
        expect(info.buyer.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd")
        expect(info.buyer.portfolioId.toString(10)).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.seller.polymeshDid).to.equal("0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2")
        expect(info.seller.portfolioId).to.be.null
        expect(info.quantity.toString(10)).to.equal("12345")
        expect(info.token).to.equal("ACME")
        expect(info.price.toString(10)).to.equal("33")
        expect(info.instructionId.toString(10)).to.equal("445")
        expect(info.isPaid).to.be.true
        expect(info.isTransferred).to.be.false
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: FullSettlementJson = <FullSettlementJson><unknown>{
            id: "3",
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            instructionId: "445",
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: 12345,
            token: "ACME",
            price: "33",
            instructionId: "445",
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
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "12345",
            token: "ACME",
            price: "33",
            instructionId: "445",
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
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        })
        const buyOrder2: OrderInfo = new OrderInfo({
            isBuy: true,
            quantity: "15",
            token: "ACME",
            price: "40",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
            portfolioId: null,
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
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        })
        const sellOrder: OrderInfo = new OrderInfo({
            isBuy: false,
            quantity: "15",
            token: "ECMN",
            price: "40",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
            portfolioId: null,
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
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        })
        const sellOrder: OrderInfo = new OrderInfo({
            isBuy: false,
            quantity: "15",
            token: "ACME",
            price: "40",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
            portfolioId: null,
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
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        })
        const bareSellOrder: OrderJson = {
            isBuy: false,
            quantity: "15",
            token: "ACME",
            price: "35",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
            portfolioId: null,
        }
        const sellOrder: OrderInfo = new OrderInfo(bareSellOrder)

        const settlement: ISettlementInfo = createByMatchingOrders("1", buyOrder, "2", sellOrder)

        expect(settlement.toJSON()).to.deep.equal({
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
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
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
            portfolioId: "1",
        })
        const sellOrder: OrderInfo = new OrderInfo({
            isBuy: false,
            quantity: "10",
            token: "ACME",
            price: "35",
            polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
            portfolioId: null,
        })

        const settlement: ISettlementInfo = createByMatchingOrders("1", buyOrder, "2", sellOrder)

        expect(settlement.toJSON()).to.deep.equal({
            buyer: {
                id: "1",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abcd",
                portfolioId: "1",
            },
            seller: {
                id: "2",
                polymeshDid: "0x01234567890abcdef0123456789abcdef01234567890abcdef0123456789abc2",
                portfolioId: null,
            },
            quantity: "10",
            token: "ACME",
            price: "34",
            isPaid: false,
            isTransferred: false,
        })
    })

})
