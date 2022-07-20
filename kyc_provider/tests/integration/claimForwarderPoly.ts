import { describe } from "mocha";
import { expect, use } from "chai";
import { Polymesh } from "@polymeshassociation/polymesh-sdk";
import * as nextConfig from "../../next.config.js";
import { CustomerInfo } from "../../src/customerInfo";
import { ClaimForwarderPoly } from "../../src/claimForwarderPoly";
import { LocalSigningManager } from "@polymathnetwork/local-signing-manager/index.js";
use(require("chai-as-promised"));

describe("ClaimForwarderPoly Integration Tests", () => {
  const {
    serverRuntimeConfig: {
      polymesh: { accountMnemonic, middlewareLink, middlewareKey },
    },
    publicRuntimeConfig: {
      polymesh: { nodeUrl },
    },
  } = nextConfig;

  beforeEach("prepare api", async () => {});

  it("getJurisdictionClaim throws if more than 1 identity returned", async () => {
    const localSigningManager = await LocalSigningManager.create({
      accounts: [
        {
          mnemonic: accountMnemonic,
        },
      ],
    });
    const api = await Polymesh.connect({
      nodeUrl,
      signingManager: localSigningManager,
      middleware: {
        link: middlewareLink,
        key: middlewareKey,
      },
    });
    const claimForwarder = new ClaimForwarderPoly(api);
    const alice = await api.getSigningIdentity();
    const bareInfo: JSON = <JSON>(<unknown>{
      name: "John Doe",
      country: "Gb",
      passport: "12345",
      valid: true,
      jurisdiction: "Ie",
      polymeshDid: alice.did,
    });
    const info = new CustomerInfo(bareInfo);

    await expect(claimForwarder.getJurisdictionClaim(info)).to.eventually.throw;
  }).timeout(30000);
});
