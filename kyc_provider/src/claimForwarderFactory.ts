import getConfig from "next/config";
import { IClaimForwarder } from "./claimForwarder";
import { ClaimForwarderPoly } from "./claimForwarderPoly";
import { Polymesh } from "@polymeshassociation/polymesh-sdk";
import { LocalSigningManager } from "@polymathnetwork/local-signing-manager";

export default async function (): Promise<IClaimForwarder> {
  const {
    serverRuntimeConfig: {
      polymesh: { accountMnemonic, middlewareLink, middlewareKey },
    },
    publicRuntimeConfig: {
      polymesh: { nodeUrl },
    },
  } = getConfig() || {
    serverRuntimeConfig: {
      polymesh: {
        accountMnemonic: process.env.POLY_ACCOUNT_MNEMONIC,
        middlewareLink: process.env.MIDDLEWARE_LINK,
        middlewareKey: process.env.MIDDLEWARE_KEY,
      },
    },
    publicRuntimeConfig: {
      polymesh: {
        nodeUrl: process.env.POLY_NODE_URL,
      },
    },
  };
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
  return new ClaimForwarderPoly(api);
}
