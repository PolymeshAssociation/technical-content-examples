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
}

export interface ClaimsRevokedResult {
    status: boolean
}

export class ClaimForwarderError extends Error {
    constructor (message?: string) {
        super(message)
        Error.apply(this, arguments)
    }
}

export class NonExistentKycIdentityError extends ClaimForwarderError {
    constructor (public address: string, message?: string) {
        super(message)
    }
}

export class NoClaimForCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo, message?: string) {
        super(message)
    }
}

export class InvalidCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo, message?: string) {
        super(message)
    }
}

export class IncompleteCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo, message?: string) {
        super(message)
    }
}

export class NonExistentCustomerPolymeshIdError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo, message?: string) {
        super(message)
    }
}
