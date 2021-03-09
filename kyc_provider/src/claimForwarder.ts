import { Identity, ClaimData } from "@polymathnetwork/polymesh-sdk/types"
import { ICustomerInfo } from "./customerInfo"

export interface IClaimForwarder {
    getServiceProviderIdentity(): Promise<Identity>
    hasValidIdentity(customer: ICustomerInfo): Promise<boolean>
    getJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimData>
    addJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimsAddedResult>
    revokeJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimsRevokedResult>
}

export interface ClaimsAddedResult {
    status: boolean
    toJSON(): JSON
}

export interface ClaimsRevokedResult {
    status: boolean
}

export class ClaimForwarderError {
    constructor () {
        Error.apply(this, arguments)
    }
}

export class NonExistentKycIdentityError extends ClaimForwarderError {
    constructor (public address: string) {
        super()
    }
}

export class NoClaimForCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo) {
        super()
    }
}

export class InvalidCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo) {
        super()
    }
}

export class IncompleteCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo) {
        super()
    }
}

export class NonExistentCustomerPolymeshIdError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo) {
        super()
    }
}
