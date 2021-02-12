import { ICustomerInfo } from "./customerInfo"
import {
    IClaimForwarder,
    ClaimsAddedResult, ClaimsRevokedResult,
    ClaimForwarderError, NoClaimForCustomerError, InvalidCustomerError, IncompleteCustomerError
} from "./claimForwarder"
import { Polymesh } from "@polymathnetwork/polymesh-sdk"
import { Identity, ScopeType, ClaimType, ClaimData } from "@polymathnetwork/polymesh-sdk/types"
import { TransactionQueue } from "@polymathnetwork/polymesh-sdk/internal"

export class ClaimsAddedResultPoly implements ClaimsAddedResult{
    constructor(
        public status: boolean,
        public blockHashes: string[]) {
    }

    toJSON(): JSON {
        return <JSON><unknown>{
            "blockHashes": this.blockHashes
        }
    }
}

export class ClaimsRevokedResultPoly implements ClaimsRevokedResult{
    constructor(public status: boolean) {
    }
}

export class TooManyIdentitiesCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo, public count: number) {
        super()
    }
}

export class TooManyClaimsCustomerError extends ClaimForwarderError {
    constructor (public customer: ICustomerInfo, public count: number) {
        super()
    }
}

export class ClaimForwarderPoly implements IClaimForwarder {

    constructor(public api: Polymesh) {
    }

    async getServiceProviderIdentity(): Promise<Identity> {
        return Promise.resolve(this.api.getCurrentIdentity())
    }

    async getJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimData> {
        const customerIdentity: Identity = this.api.getIdentity({ did: customer.polymeshDid })
        if (!(await this.api.isIdentityValid({ identity: customerIdentity }))) {
            throw new IncompleteCustomerError(customer)
        }

        const myId = await this.api.getCurrentIdentity() // TODO
        const issuedClaims = await this.api.claims.getIdentitiesWithClaims({
            targets: [customerIdentity],
            trustedClaimIssuers: [await this.api.getCurrentIdentity()],
            claimTypes: [ ClaimType.Jurisdiction ],
            includeExpired: false,
            start: 0,
            size: 20
        })
        if (issuedClaims.count == 0) {
            throw new NoClaimForCustomerError(customer)
        }
        if (issuedClaims.count > 1) {
            throw new TooManyIdentitiesCustomerError(customer, issuedClaims.count)
        }
        const claims: ClaimData[] = issuedClaims.data[0].claims
        if (claims.length == 0) {
            throw new NoClaimForCustomerError(customer)
        }
        if (claims.length > 1) {
            throw new TooManyClaimsCustomerError(customer, claims.length)
        }
        return claims[0]
    }

    async addJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimsAddedResult> {
        if (!customer.valid) {
            throw new InvalidCustomerError(customer)
        }
        const customerIdentity: Identity = this.api.getIdentity({ did: customer.polymeshDid })
        if (!(await this.api.isIdentityValid({ identity: customerIdentity }))) {
            throw new IncompleteCustomerError(customer)
        }

        let claim: ClaimData
        try {
            claim = await this.getJurisdictionClaim(customer)
            // Already has a claim, no need to add.
            return new ClaimsAddedResultPoly(true, [])
        } catch(e) {
            if (!(e instanceof NoClaimForCustomerError)) {
                // Need to revoke before adding
                throw e
            }
        }
        const queue: TransactionQueue<void> = await this.api.claims.addClaims({
            claims: [{
                target: customerIdentity,
                claim: {
                    type: ClaimType.Jurisdiction,
                    code: customer.jurisdiction,
                    scope: { // TODO Adam?
                        type: ScopeType.Identity,
                        value: customer.polymeshDid
                    }
                },
            }]
        })
        await queue.run()
        return new ClaimsAddedResultPoly(
            true,
            queue.transactions.map(tx => tx.blockHash!))
    }

    async revokeJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimsRevokedResult> {
        let claim: ClaimData
        try {
            claim = await this.getJurisdictionClaim(customer)
        } catch(e) {
            if (e instanceof NoClaimForCustomerError) {
                // Nothing to revoke, assume ok.
                return new ClaimsRevokedResultPoly(true)
            }
            throw e
        }
        const revokeQueue = await this.api.claims.revokeClaims({
            claims: [ claim ]
        })
        await revokeQueue.run()
        // revokeQueue.transactions.map(tx => tx.txHash) // TODO
    
        // TODO forward the queue so it can be monitored?

        return new ClaimsRevokedResultPoly(true)
    }

}