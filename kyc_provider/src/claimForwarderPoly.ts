import { ICustomerInfo } from "./customerInfo";
import {
  IClaimForwarder,
  ClaimsAddedResult,
  ClaimsRevokedResult,
  ClaimForwarderError,
  NoClaimForCustomerError,
  InvalidCustomerError,
  IncompleteCustomerError,
  InvalidServiceProvidedIdentityError,
} from "./claimForwarder";
import { Polymesh } from "@polymeshassociation/polymesh-sdk";
import {
  Identity,
  ScopeType,
  ClaimType,
  ClaimData,
} from "@polymeshassociation/polymesh-sdk/types";
import { TransactionQueue } from "@polymeshassociation/polymesh-sdk/internal";
import { BigNumber } from "@polymeshassociation/polymesh-sdk";
export class ClaimsAddedResultPoly implements ClaimsAddedResult {
  constructor(public status: boolean, public blockHashes: string[]) {}

  toJSON(): JSON {
    return <JSON>(<unknown>{
      blockHashes: this.blockHashes,
    });
  }
}

export class ClaimsRevokedResultPoly implements ClaimsRevokedResult {
  constructor(public status: boolean) {}
}

export class TooManyIdentitiesCustomerError extends ClaimForwarderError {
  constructor(public customer: ICustomerInfo, public count: number) {
    super();
  }
}

export class TooManyClaimsCustomerError extends ClaimForwarderError {
  constructor(public customer: ICustomerInfo, public count: number) {
    super();
  }
}

export class ClaimForwarderPoly implements IClaimForwarder {
  constructor(public api: Polymesh) {}

  async getServiceProviderIdentity(): Promise<Identity> {
    const signingIdentity = await this.api.getSigningIdentity();
    if (!signingIdentity) {
      throw new InvalidServiceProvidedIdentityError();
    }
    return signingIdentity;
  }

  async getJurisdictionClaim(customer: ICustomerInfo): Promise<ClaimData> {
    const customerIdentity: Identity = await this.api.identities.getIdentity({
      did: customer.polymeshDid,
    });
    if (
      !(await this.api.identities.isIdentityValid({
        identity: customerIdentity,
      }))
    ) {
      throw new IncompleteCustomerError(customer);
    }

    const myId = await this.api.getSigningIdentity(); // TODO
    const issuedClaims = await this.api.claims.getIdentitiesWithClaims({
      targets: [customerIdentity],
      trustedClaimIssuers: [await this.api.getSigningIdentity()],
      claimTypes: [ClaimType.Jurisdiction],
      includeExpired: false,
      start: new BigNumber(0),
      size: new BigNumber(20),
    });
    if (issuedClaims.data.length == 0) {
      throw new NoClaimForCustomerError(customer);
    }
    if (issuedClaims.data.length > 1) {
      throw new TooManyIdentitiesCustomerError(
        customer,
        issuedClaims.data.length
      );
    }
    const claims: ClaimData[] = issuedClaims.data[0].claims;
    if (claims.length == 0) {
      throw new NoClaimForCustomerError(customer);
    }
    if (claims.length > 1) {
      throw new TooManyClaimsCustomerError(customer, claims.length);
    }
    return claims[0];
  }

  async addJurisdictionClaim(
    customer: ICustomerInfo
  ): Promise<ClaimsAddedResult> {
    if (!customer.valid) {
      throw new InvalidCustomerError(customer);
    }
    const customerIdentity: Identity = await this.api.identities.getIdentity({
      did: customer.polymeshDid,
    });
    if (
      !(await this.api.identities.isIdentityValid({
        identity: customerIdentity,
      }))
    ) {
      throw new IncompleteCustomerError(customer);
    }

    let claim: ClaimData;
    try {
      claim = await this.getJurisdictionClaim(customer);
      // Already has a claim, no need to add.
      return new ClaimsAddedResultPoly(true, []);
    } catch (e) {
      if (!(e instanceof NoClaimForCustomerError)) {
        // Need to revoke before adding
        throw e;
      }
    }
    const queue: TransactionQueue<void> = await this.api.claims.addClaims({
      claims: [
        {
          target: customerIdentity,
          claim: {
            type: ClaimType.Jurisdiction,
            code: customer.jurisdiction,
            scope: {
              // TODO Adam?
              type: ScopeType.Identity,
              value: customer.polymeshDid,
            },
          },
        },
      ],
    });
    await queue.run();
    return new ClaimsAddedResultPoly(
      true,
      queue.transactions.map((tx) => tx.blockHash!)
    );
  }

  async revokeJurisdictionClaim(
    customer: ICustomerInfo
  ): Promise<ClaimsRevokedResult> {
    let claim: ClaimData;
    try {
      claim = await this.getJurisdictionClaim(customer);
    } catch (e) {
      if (e instanceof NoClaimForCustomerError) {
        // Nothing to revoke, assume ok.
        return new ClaimsRevokedResultPoly(true);
      }
      throw e;
    }
    const revokeQueue = await this.api.claims.revokeClaims({
      claims: [claim],
    });
    await revokeQueue.run();
    // revokeQueue.transactions.map(tx => tx.txHash) // TODO

    // TODO forward the queue so it can be monitored?

    return new ClaimsRevokedResultPoly(true);
  }
}
