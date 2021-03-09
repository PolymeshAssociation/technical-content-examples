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
} from "../../src/settlementInfo"
import {
    OrderInfo,
} from "../../src/orderInfo"

describe("SettlementParty Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "1",
        }
        const info = new SettlementParty(bareInfo)

        expect(info.id).to.equal("1")
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
        }
        expect(() => new SettlementParty(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "id")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": 1,
        }
        expect(() => new SettlementParty(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "id"
                && error.receivedType === "number")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "1",
        }
        const info = new SettlementParty(bareInfo)
        const back = info.toJSON()

        expect(back["id"]).to.equal("1")
    })

})

describe("SettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
            "isPaid": false,
            "isTransferred": false,
        }
        const info = new SettlementInfo(bareInfo)

        expect(info.buyer.id).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
        expect(info.isPaid).to.be.false
        expect(info.isTransferred).to.be.false
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 12345,
            "token": "ACME",
            "isPaid": false,
            "isTransferred": false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": "12345",
            "token": "ACME",
            "price": 33,
            "isPaid": false,
            "isTransferred": false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "quantity"
                && error.receivedType === "string")
    })

    it("cannot construct from same seller and buyer id", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "1",
            },
            "quantity": "12345",
            "token": "ACME",
            "price": 33,
            "isPaid": false,
            "isTransferred": false,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(DuplicatePartiesSettlementError)
            .that.satisfies((error: DuplicatePartiesSettlementError) => error.partyId === "1")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
            "isPaid": false,
            "isTransferred": false,
        }
        const info = new SettlementInfo(bareInfo)
        const back = info.toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})

describe("FullSettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
            "isPaid": true,
            "isTransferred": false,
        }
        const info = new FullSettlementInfo(bareInfo)

        expect(info.id).to.equal("3")
        expect(info.buyer.id).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
        expect(info.isPaid).to.be.true
        expect(info.isTransferred).to.be.false
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 12345,
            "token": "ACME",
            "isPaid": true,
            "isTransferred": false,
        }
        expect(() => new FullSettlementInfo(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": "12345",
            "token": "ACME",
            "price": 33,
            "isPaid": true,
            "isTransferred": false,
        }
        expect(() => new FullSettlementInfo(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "quantity"
                && error.receivedType === "string")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
            "isPaid": true,
            "isTransferred": false,
        }
        const info = new FullSettlementInfo(bareInfo)
        const back = info.toJSON()

        expect(back).to.deep.equal(bareInfo)
    })

})

describe("Matching orders Unit Tests", () => {

    it("cannot construct if isBuy are not correct", async () => {
        const buyOrder1: OrderInfo = new OrderInfo({
            "isBuy": true,
            "quantity": 10,
            "token": "ACME",
            "price": 33,
        } as unknown as JSON)
        const buyOrder2: OrderInfo = new OrderInfo({
            "isBuy": true,
            "quantity": 15,
            "token": "ACME",
            "price": 40,
        } as unknown as JSON)

        expect(() => createByMatchingOrders("1", buyOrder1, "2", buyOrder2)).to.throw(WrongOrderTypeError)
            .that.satisfies((error: WrongOrderTypeError) => error.expectedIsBuy === false)
    })

    it("cannot construct when tokens not matching", async () => {
        const buyOrder: OrderInfo = new OrderInfo({
            "isBuy": true,
            "quantity": 10,
            "token": "ACME",
            "price": 33,
        } as unknown as JSON)
        const sellOrder: OrderInfo = new OrderInfo({
            "isBuy": false,
            "quantity": 15,
            "token": "ECMN",
            "price": 40,
        } as unknown as JSON)

        expect(() => createByMatchingOrders("1", buyOrder, "2", sellOrder)).to.throw(IncompatibleOrderTypeError)
            .that.satisfies((error: IncompatibleOrderTypeError) => error.buyToken === "ACME" && error.sellToken === "ECMN")
    })

    it("cannot construct when same buyer and seller id", async () => {
        const buyOrder: OrderInfo = new OrderInfo({
            "isBuy": true,
            "quantity": 10,
            "token": "ACME",
            "price": 33,
        } as unknown as JSON)
        const sellOrder: OrderInfo = new OrderInfo({
            "isBuy": false,
            "quantity": 15,
            "token": "ACME",
            "price": 40,
        } as unknown as JSON)

        expect(() => createByMatchingOrders("1", buyOrder, "1", sellOrder)).to.throw(DuplicatePartiesSettlementError)
            .that.satisfies((error: DuplicatePartiesSettlementError) => error.partyId === "1")
    })

    it("creates settlement when got a match, and got correct data, seller has more", async () => {
        const buyOrder: OrderInfo = new OrderInfo(<JSON><unknown>{
            "isBuy": true,
            "quantity": 10,
            "token": "ACME",
            "price": 33,
        })
        const bareSellOrder: JSON = <JSON><unknown>{
            "isBuy": false,
            "quantity": 15,
            "token": "ACME",
            "price": 35,
        }
        const sellOrder: OrderInfo = new OrderInfo(bareSellOrder)

        const settlement: ISettlementInfo = createByMatchingOrders("1", buyOrder, "2", sellOrder)

        expect(settlement.toJSON()).to.deep.equal({
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 10,
            "token": "ACME",
            "price": 34,
            "isPaid": false,
            "isTransferred": false,
        })
    })

    it("creates settlement when got a match, and got correct data, buyer has more", async () => {
        const buyOrder: OrderInfo = new OrderInfo(<JSON><unknown>{
            "isBuy": true,
            "quantity": 15,
            "token": "ACME",
            "price": 33,
        })
        const sellOrder: OrderInfo = new OrderInfo(<JSON><unknown>{
            "isBuy": false,
            "quantity": 10,
            "token": "ACME",
            "price": 35,
        })

        const settlement: ISettlementInfo = createByMatchingOrders("1", buyOrder, "2", sellOrder)

        expect(settlement.toJSON()).to.deep.equal({
            "buyer": {
                "id": "1",
            },
            "seller": {
                "id": "2",
            },
            "quantity": 10,
            "token": "ACME",
            "price": 34,
            "isPaid": false,
            "isTransferred": false,
        })
    })

})