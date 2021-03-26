import { ICustomerInfo } from "./customerInfo"
import {
    ClaimForwarderError,
    ClaimsAddedResult,
    ClaimsRevokedResult,
    IClaimForwarder,
    IncompleteCustomerError,
    JurisdictionClaim,
    NoClaimForCustomerError,
    NonExistentCustomerPolymeshIdError,
    NonExistentKycIdentityError,
} from "./claimForwarder"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import {
    ClaimData,
    ClaimType,
    Identity,
    IdentityWithClaims,
    ResultSet,
    ScopeType,
} from "@polymathnetwork/polymesh-sdk/types"
import {
    CurrentIdentity,
    TransactionQueue,
} from "@polymathnetwork/polymesh-sdk/internal"

export interface ClaimsAddedResultPoly extends ClaimsAddedResult {
    blockHashes: string[]
}

export class TooManyIdentitiesCustomerError extends ClaimForwarderError {
    constructor(public customer: ICustomerInfo, public count: number) {
        super()
    }
}

export class TooManyClaimsCustomerError extends ClaimForwarderError {
    constructor(public customer: ICustomerInfo, public count: number) {
        super()
    }
}

export class ClaimForwarderPoly implements IClaimForwarder {

    constructor(public api: Polymesh) {
    }

    async getServiceProviderIdentity(): Promise<Identity> {
        const providerId: CurrentIdentity = await this.api.getCurrentIdentity()
        if (providerId === null) {
            throw new NonExistentKycIdentityError(this.api.getAccount().address)
        }
        return providerId
    }

    async hasValidIdentity(customer: ICustomerInfo): Promise<boolean> {
        return customer.polymeshDid !== null &&
            this.api.isIdentityValid({ "identity": customer.polymeshDid })
    }

    async getJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimData<JurisdictionClaim>> {
        if (customer.polymeshDid === null) {
            throw new IncompleteCustomerError(customer)
        }
        if (!(await this.hasValidIdentity(customer))) {
            throw new NonExistentCustomerPolymeshIdError(customer)
        }

        const myId: CurrentIdentity = await this.api.getCurrentIdentity() // TODO
        const issuedClaims: ResultSet<IdentityWithClaims> = await this.api.claims.getIdentitiesWithClaims({
            targets: [customer.polymeshDid],
            trustedClaimIssuers: [await this.api.getCurrentIdentity()],
            claimTypes: [ClaimType.Jurisdiction],
            includeExpired: false,
            start: 0,
            size: 20,
        })
        if (issuedClaims.count == 0) {
            throw new NoClaimForCustomerError(customer)
        } else if (issuedClaims.count > 1) {
            throw new TooManyIdentitiesCustomerError(customer, issuedClaims.count)
        }
        const claims: ClaimData[] = issuedClaims.data[0].claims
        if (claims.length == 0) {
            throw new NoClaimForCustomerError(customer)
        } else if (claims.length > 1) {
            throw new TooManyClaimsCustomerError(customer, claims.length)
        }
        return claims[0] as ClaimData<JurisdictionClaim>
    }

    async addJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimsAddedResultPoly> {
        let claim: ClaimData<JurisdictionClaim>
        try {
            claim = await this.getJurisdictionClaim(customer)
            if (claim.claim.code === customer.country) {
                // Already has a correct claim, no need to add.
                return {
                    status: true,
                    blockHashes: [],
                }
            }
            // Let's revoke the claim with the wrong jurisdiction
            await this.revokeJurisdictionClaim(customer)
        } catch (e) {
            if (!(e instanceof NoClaimForCustomerError)) {
                // Need to revoke before adding
                throw e
            }
        }
        const queue: TransactionQueue<void> = await this.api.claims.addClaims({
            claims: [{
                target: customer.polymeshDid,
                claim: {
                    type: ClaimType.Jurisdiction,
                    code: customer.jurisdiction,
                    scope: {
                        type: ScopeType.Identity,
                        value: customer.polymeshDid,
                    },
                },
            }],
        })
        await queue.run()
        return {
            status: true,
            blockHashes: queue.transactions.map(tx => tx.blockHash!),
        }
    }

    async revokeJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimsRevokedResult> {
        let claim: ClaimData<JurisdictionClaim>
        try {
            claim = await this.getJurisdictionClaim(customer)
        } catch (e) {
            if (e instanceof NoClaimForCustomerError) {
                // Nothing to revoke, assume ok.
                return {
                    status: true,
                }
            }
            throw e
        }
        const revokeQueue: TransactionQueue<void> = await this.api.claims.revokeClaims({
            claims: [claim],
        })
        await revokeQueue.run()
        // revokeQueue.transactions.map(tx => tx.txHash) // TODO


        return {
            status: true,
        }
    }

}
