#!/usr/bin/env node
/*
 * Bunch of actions to enable when you want to prepare your NextDaq exchange setup.
 */
export {}
import * as prompts from "prompts"
import * as colors from "colors"
import { BigNumber, Polymesh } from "@polymathnetwork/polymesh-sdk"
import { TransactionQueue } from "@polymathnetwork/polymesh-sdk/internal"
import {
    AccountBalance,
    CurrentIdentity,
    DefaultPortfolio,
    Identity,
    Instruction,
    KnownTokenType,
    NumberedPortfolio,
    Portfolio,
    PortfolioBalance,
    SecurityToken,
    TickerReservation,
    TokenType,
    Venue,
    VenueDetails,
    VenueType,
} from "@polymathnetwork/polymesh-sdk/types"
import * as nextConfig from "../next.config.js"
import { SettlementEnginePoly } from "../src/settlementEnginePoly"
import { ISettlementEngine } from "../src/settlementEngine"

const {
    serverRuntimeConfig: { polymesh: {
        accountMnemonic,
        middlewareLink,
        middlewareKey
    } },
    publicRuntimeConfig: { polymesh: {
        nodeUrl,
        venueId,
        usdToken,
    } }
} = nextConfig

// There are a lot of warnings, so we need to make visible the important parts.
const logVisible = function(text): void {
    console.log(colors.inverse(text))
}

const getApi = async function(): Promise<Polymesh> {
    return Polymesh.connect({
        nodeUrl,
        accountMnemonic,
        middleware: {
            link: middlewareLink,
            key: middlewareKey
        }
    })
}

const getVenueInfo = async function(venue: Venue): Promise<string> {
    const details: VenueDetails = await venue.details()
    return `id: ${venue.id.toString(10)}, type: ${details.type}, description: ${details.description}`
}

logVisible(`Network: ${nodeUrl}, preset venue id: ${venueId}, USD token: ${usdToken}`)
getApi()
    .then(async(api: Polymesh) => {
        // Identity
        const me: CurrentIdentity = await api.getCurrentIdentity()
        if (me === null) throw new Error("You do not have an account open. Go to https://dashboard.polymesh.live/")
        const balance: AccountBalance = await api.getAccount().getBalance()
        logVisible(`Your account is ${me.did}, you have ${balance.free} free POLYX and ${balance.locked} locked ones`)

        // Preset venue
        const myVenues: Venue[] = await me.getVenues()
        const engine: ISettlementEngine = new SettlementEnginePoly(() => Promise.resolve(api), venueId, usdToken)
        let presetVenue: Venue = await engine.getVenue()
            .catch((e) => null)
        if (presetVenue !== null) {
            logVisible(`Your preset venue: ${await getVenueInfo(presetVenue)}`)
        } else {
            if (myVenues.length === 0) logVisible("You do not have any venues at all")
            else {
                logVisible("You do not have any preset venues. Here are the venues you already have:")
                const venueInfos: string[] = await Promise.all(myVenues.map(getVenueInfo))
                venueInfos.forEach(logVisible)
            }
            const { createOrNot } = await prompts({
                type: "text",
                name: "createOrNot",
                message: "Create 1 Exchange venue now? y/n"
            })
            if (createOrNot !== "y") throw new Error(`Not creating a venue`)
            const { details } = await prompts({
                type: "text",
                name: "details",
                message: "What details to add?"
            })
            const myVenueQueue: TransactionQueue<Venue> = await me.createVenue({
                details: details,
                type: VenueType.Exchange
            })
            presetVenue = await myVenueQueue.run()
            logVisible(`Venue created. Save its id, ${presetVenue.id.toString(10)}, in the config`)
        }

        // USD Token
        let usdSecurity: SecurityToken = await api.getSecurityToken({ ticker: usdToken })
            .catch((e) => null)
        if (usdSecurity !== null) {
            const { owner } = await usdSecurity.details()
            if (owner.did === me.did) logVisible(`${usdToken} is owned by you`)
            else logVisible(`${usdToken} exists, it is owned by other did: ${owner.did}`)
        } else {
            logVisible(`${usdToken} does not exist`)
            let usdReservation: TickerReservation = await api.getTickerReservation({ ticker: usdToken })
                .catch((e) => null)
            if (usdReservation !== null) {
                const { owner } = await usdReservation.details()
                if (owner.did === me.did) logVisible(`${usdToken} is reserved by you`)
                else throw new Error(`${usdToken} is reserved by other did: ${owner.did}`)
            } else {
                const { reserveOrNot } = await prompts({
                    type: "text",
                    name: "reserveOrNot",
                    message: `Reserve the security token ${usdToken}? y/n`
                })
                if (reserveOrNot !== "y") throw new Error(`Not reserving ${usdToken}`)
                const reserveQueue: TransactionQueue<TickerReservation> = await api.reserveTicker({ ticker: usdToken })
                usdReservation = await reserveQueue.run()
                logVisible(`${usdToken} is now reserved by you`)
            }
            const { createOrNot, totalSupply } = await prompts([
                {
                    type: "text",
                    name: "createOrNot",
                    message: `Create the security token ${usdToken}? y/n`
                },
                {
                    type: (prev) => prev === "y" ? "number" : null,
                    name: "totalSupply",
                    message: `With what total supply?`
                }
            ])
            if (createOrNot !== "y") throw new Error(`Not creating ${usdToken}`)
            logVisible(`supply ${totalSupply}`)
            const createQueue: TransactionQueue<SecurityToken> = await usdReservation.createToken({
                name: usdToken,
                totalSupply: new BigNumber(totalSupply),
                isDivisible: false,
                tokenType: KnownTokenType.Commodity,
            })
            usdSecurity = await createQueue.run()
            logVisible(`${usdToken} is now created by you`)
        }

        // Your balance
        const myDefaultPortolio: DefaultPortfolio = await me.portfolios.getPortfolio()
        const myUsdBalance: PortfolioBalance = (await myDefaultPortolio.getTokenBalances({ tokens: [ usdToken] }))[0]
        logVisible(`You have ${myUsdBalance.total.toString(10)} ${usdToken}, of which ${myUsdBalance.locked.toString(10)} are locked`)

        // USD for participants
        usdSecurity
        let looping: boolean = true
        const allFundings = []
        while(looping) {
            const { fundOthers, otherDid } = await prompts([
                {
                    type: "text",
                    name: "fundOthers",
                    message: `Send ${usdToken} to others? y/n`
                },
                {
                    type: (prev) => prev === "y" ? "text" : null,
                    name: "otherDid",
                    message: "Which account Did?"
                }
            ])
            if (fundOthers !== "y") {
                looping = false
                continue
            }
            const recipient: Identity = api.getIdentity({ did: otherDid })
            const [ { amountToSend }, portfolioInfos ] = await Promise.all([
                prompts({
                    type: "number",
                    name: "amountToSend",
                    message: "By what amount?"
                }),
                (await Promise.all((await recipient.portfolios.getPortfolios()).map(async(portfolio: Portfolio) => {
                        if ((<NumberedPortfolio>portfolio).id) return (<NumberedPortfolio>portfolio).getName()
                            .then((name: string) => `${(<NumberedPortfolio>portfolio).id} - ${name}`)
                        return "default"
                    })))
                    .filter(id => id !== "default")
            ])
            logVisible("Recipient portfolios:")
            portfolioInfos.forEach(logVisible)
            const { otherPortfolioId } = await prompts({
                type: "number",
                name: "otherPortfolioId",
                message: `In which portfolio (default: default portfolio)`
            })
            const instructionQueue: TransactionQueue<Instruction> = await presetVenue.addInstruction({
                legs: [{
                    from: me.did,
                    to: typeof otherPortfolioId === "undefined"
                        ? recipient
                        : {
                            identity: recipient,
                            id: otherPortfolioId
                        },
                    amount: new BigNumber(amountToSend),
                    token: usdToken
                }]
            })
            allFundings.push(instructionQueue.run())
        }
        const instructions: Instruction[] = await Promise.all(allFundings)
        instructions.forEach((instruction: Instruction) => {
            logVisible(`instruction ${instruction.id} mined`)
        })

        const pendingInstructions: Instruction[] = await presetVenue.getPendingInstructions()
        const pendingIds: string = pendingInstructions.map((instruction: Instruction) => instruction.id.toString(10))
            .join(", ")
        logVisible(`You have ${pendingInstructions.length} pending instructions: ${[pendingIds]}`)
    })
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
