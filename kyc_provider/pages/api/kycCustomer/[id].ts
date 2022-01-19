import { NextApiRequest, NextApiResponse } from "next"
import { CustomerInfo, ICustomerInfo, InvalidCountryCodeError, InvalidPolymeshDidError } from "../../../src/customerInfo"
import { ICustomerDb, UnknownCustomerError } from "../../../src/customerDb"
import customerDbFactory from "../../../src/customerDbFactory"
import ClaimForwarderFactory from "../../../src/claimForwarderFactory"
import {
    ClaimsAddedResult,
    ClaimsRevokedResult,
    IClaimForwarder,
    NonExistentCustomerPolymeshIdError,
} from "../../../src/claimForwarder"
import { TooManyClaimsCustomerError } from "../../../src/claimForwarderPoly"

async function getCustomerInfoById(req: NextApiRequest): Promise<ICustomerInfo> {
    return await (await customerDbFactory()).getCustomerInfoById(<string>req.query.id)
}

async function setCustomerInfo(req: NextApiRequest): Promise<ClaimsAddedResult | null> {
    const id: string = <string>req.query.id
    const customerDb: ICustomerDb = await customerDbFactory()
    const customerInfo: ICustomerInfo = new CustomerInfo(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    let toReturn: ClaimsAddedResult | null = {
        status: true,
    }
    if (customerInfo.polymeshDid !== null && customerInfo.polymeshDid !== "") {
        const claimForwarder: IClaimForwarder = await ClaimForwarderFactory()
        if (customerInfo.valid) {
            toReturn = await claimForwarder.addJurisdictionClaim(customerInfo)
        } else if (!(await claimForwarder.hasValidIdentity(customerInfo))) {
            throw new NonExistentCustomerPolymeshIdError(customerInfo)
        }
    }
    await customerDb.setCustomerInfo(id, customerInfo)
    return toReturn
}

async function updateCustomerInfo(req: NextApiRequest): Promise<ClaimsAddedResult | ClaimsRevokedResult | null> {
    const id: string = <string>req.query.id
    const customerDb: ICustomerDb = await customerDbFactory()
    const customerInfo: ICustomerInfo = await customerDb.getCustomerInfoById(id)
    customerInfo.patch(typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body)
    let toReturn: ClaimsAddedResult | ClaimsRevokedResult = {
        status: true,
    }
    if (customerInfo.polymeshDid !== null) {
        const claimForwarder: IClaimForwarder = await ClaimForwarderFactory()
        if (customerInfo.valid) {
            toReturn = await claimForwarder.addJurisdictionClaim(customerInfo)
        } else if (!customerInfo.valid) {
            toReturn = await claimForwarder.revokeJurisdictionClaim(customerInfo)
        } else if (!(await claimForwarder.hasValidIdentity(customerInfo))) {
            throw new NonExistentCustomerPolymeshIdError(customerInfo)
        }
    }
    await customerDb.setCustomerInfo(id, customerInfo)
    return toReturn
}

export default async function (req: NextApiRequest, res: NextApiResponse<object | ICustomerInfo>): Promise<any> {
    try {
        switch (req.method) {
            case "GET":
                res.status(200).json(await getCustomerInfoById(req))
                break
            case "PUT":
                const resultSet: ClaimsAddedResult = await setCustomerInfo(req)
                res.status(200).json({
                    status: "ok",
                    result: resultSet,
                })
                break
            case "PATCH":
                const resultPatch: ClaimsAddedResult = await updateCustomerInfo(req)
                res.status(200).json({
                    status: "ok",
                    result: resultPatch,
                })
                break
            default:
                res.status(405).end()
        }
    } catch (e) {
        if (e instanceof UnknownCustomerError) {
            res.status(404).json({ status: "not found" })
        } else if (e instanceof InvalidCountryCodeError) {
            res.status(400).json({ status: `invalid country code ${e.countryCode}` })
        } else if (e instanceof InvalidPolymeshDidError) {
            res.status(400).json({ status: `invalid Polymesh Did ${e.polymeshDid}` })
        } else if (e instanceof NonExistentCustomerPolymeshIdError) {
            res.status(400).json({ status: `non-existent Polymesh Did ${e.customer.polymeshDid}` })
        } else if (e instanceof TooManyClaimsCustomerError) {
            res.status(400).json({ status: `too many claims, ${e.count}, for this customer Polymesh Did ${e.customer.polymeshDid}` })
        } else {
            res.status(500).json({ status: "internal error" })
        }
    }
}
