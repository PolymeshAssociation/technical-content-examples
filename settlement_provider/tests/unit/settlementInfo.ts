import { describe } from "mocha"
import { expect } from "chai"
import {
    SettlementParty,
    SettlementInfo,
    FullSettlementInfo,
    IncompleteSettlementInfoError,
    WrongTypeSettlementError,
    DuplicatePartiesSettlementError
} from "../../src/settlementInfo"

describe("Settlement Party Unit Tests", () => {

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
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new SettlementInfo(bareInfo)

        expect(info.buyer.id).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": 12345,
            "token": "ACME",
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": "12345",
            "token": "ACME",
            "price": 33,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "quantity"
                && error.receivedType === "string")
    })

    it("cannot construct from same seller and buyer", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "1"
            },
            "quantity": "12345",
            "token": "ACME",
            "price": 33,
        }
        expect(() => new SettlementInfo(bareInfo)).to.throw(DuplicatePartiesSettlementError)
            .that.satisfies((error: DuplicatePartiesSettlementError) => error.partyId === "1")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new SettlementInfo(bareInfo)
        const back = info.toJSON()

        expect(back["buyer"]).to.deep.equal({ "id": "1" })
        expect(back["seller"]).to.deep.equal({ "id": "2" })
        expect(back["quantity"]).to.equal(12345)
        expect(back["token"]).to.equal("ACME")
        expect(back["price"]).to.equal(33)
    })

})

describe("FullSettlementInfo Unit Tests", () => {

    it("can construct from JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new FullSettlementInfo(bareInfo)

        expect(info.id).to.equal("3")
        expect(info.buyer.id).to.equal("1")
        expect(info.seller.id).to.equal("2")
        expect(info.quantity).to.equal(12345)
        expect(info.token).to.equal("ACME")
        expect(info.price).to.equal(33)
    })

    it("cannot construct from incomplete JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": 12345,
            "token": "ACME",
        }
        expect(() => new FullSettlementInfo(bareInfo)).to.throw(IncompleteSettlementInfoError)
            .that.satisfies((error: IncompleteSettlementInfoError) => error.field === "price")
    })

    it("cannot construct from wrong type in JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": "12345",
            "token": "ACME",
            "price": 33,
        }
        expect(() => new FullSettlementInfo(bareInfo)).to.throw(WrongTypeSettlementError)
            .that.satisfies((error: WrongTypeSettlementError) => error.field === "quantity"
                && error.receivedType === "string")
    })

    it("can convert to JSON", () => {
        const bareInfo: JSON = <JSON><unknown>{
            "id": "3",
            "buyer": {
                "id": "1"
            },
            "seller": {
                "id": "2"
            },
            "quantity": 12345,
            "token": "ACME",
            "price": 33,
        }
        const info = new FullSettlementInfo(bareInfo)
        const back = info.toJSON()

        expect(back["id"]).to.equal("3")
        expect(back["buyer"]).to.deep.equal({ "id": "1" })
        expect(back["seller"]).to.deep.equal({ "id": "2" })
        expect(back["quantity"]).to.equal(12345)
        expect(back["token"]).to.equal("ACME")
        expect(back["price"]).to.equal(33)
    })

})
