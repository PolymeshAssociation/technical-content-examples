import getConfig from "next/config";
import { Polymesh } from "@polymeshassociation/polymesh-sdk";
import { HasFetchTimer } from "./types";

export async function getBasicPolyWalletApi(
  setStatus: (content: string) => void
): Promise<Polymesh> {
  setStatus("Getting your Polymesh Wallet");
  if (typeof (window || {})["api"] !== "undefined") {
    return (window || {})["api"];
  }
  // Move to top of the file when compilation error no longer present.
  const {
    web3AccountsSubscribe,
    web3Enable,
  } = require("@polkadot/extension-dapp");

  const {
    BrowserExtensionSigningManager,
  } = require("@polymathnetwork/browser-extension-signing-manager");

  const {
    publicRuntimeConfig: {
      appName,
      // TODO remove middlewareLink and middlewareKey if still undesirable
      polymesh: { middlewareLink, middlewareKey },
    },
  } = getConfig();

  const polkaDotExtensions = await web3Enable(appName);

  const polyWallets = polkaDotExtensions.filter(
    (injected) => injected.name === "polywallet"
  );
  if (polyWallets.length == 0) {
    setStatus("You need to install the Polymesh Wallet extension");
    throw new Error("No Polymesh Wallet");
  }

  const polyWallet = polyWallets[0];

  setStatus("Verifying network");

  const network = await polyWallet.network.get();

  polyWallet.network.subscribe(() => window.location.reload());

  web3AccountsSubscribe(() => window.location.reload());

  setStatus("Fetching your account");

  const myAccounts = await polyWallet.accounts.get();
  if (myAccounts.length == 0) {
    setStatus("You need to create an account in the Polymesh Wallet extension");
    return;
  }

  const browserExtensionSigningManager =
    await BrowserExtensionSigningManager.create({
      appName,
      extensionName: "polywallet",
    });

  setStatus("Building your API");
  const api: Polymesh = await Polymesh.connect({
    nodeUrl: network.wssUrl,
    signingManager: browserExtensionSigningManager,
    middleware: {
      link: middlewareLink,
      key: middlewareKey,
    },
  });
  (window || {})["polyWallet"] = polyWallet;
  (window || {})["api"] = api;
  return (window || {})["api"];
}

export function replaceFetchTimer(
  where: HasFetchTimer,
  todo: () => void
): NodeJS.Timeout {
  if (where.fetchTimer !== null) clearTimeout(where.fetchTimer);
  const timer: NodeJS.Timeout = setTimeout(todo, 1000);
  where.fetchTimer = timer;
  return timer;
}

export async function checkboxProcessor(e): Promise<boolean> {
  return Promise.resolve(e.target.checked);
}

export function returnUpdated(
  previous: object,
  path: (string | number)[],
  value: any,
  deep: boolean = false
) {
  if (path.length === 0) {
    if (deep && typeof value === "object" && !Array.isArray(value))
      return {
        ...previous,
        ...value,
      };
    return value;
  }
  if (typeof path[0] === "number" && Array.isArray(previous))
    return [
      ...previous.slice(0, path[0]),
      returnUpdated(previous[path[0]], path.slice(1), value, deep),
      ...previous.slice(path[0] + 1),
    ];
  return {
    ...previous,
    [path[0]]: returnUpdated(
      previous ? previous[path[0]] : previous,
      path.slice(1),
      value,
      deep
    ),
  };
}

export function returnUpdatedCreator(
  path: (string | number)[],
  value: any,
  deep: boolean = false
) {
  return (previous: object) => returnUpdated(previous, path, value, deep);
}

export function findValue(where: object, path: (string | number)[]): any {
  return path.reduce(
    (whereLeft: object, pathBit: string | number) => whereLeft[pathBit],
    where
  );
}

export function returnAddedArrayCreator(
  containerLocation: (string | number)[],
  dummy: any,
  deep: boolean = false
) {
  return (prevInfo) => {
    const container = findValue(prevInfo, containerLocation) || [];
    if (!Array.isArray(container)) throw new Error("Only works with arrays");
    const updatedContainer = [...container, dummy];
    return returnUpdated(prevInfo, containerLocation, updatedContainer, deep);
  };
}

export function returnRemovedArrayCreator(location: (string | number)[]) {
  return (prevInfo) => {
    const containerPath = location.slice(0, -1);
    const container = findValue(prevInfo, containerPath);
    if (!Array.isArray(container)) throw new Error("Only works with arrays");
    const lastPathBit = location[location.length - 1];
    if (typeof lastPathBit !== "number")
      throw new Error("Only works with an array index");
    const updatedContainer = [
      ...container.slice(0, lastPathBit),
      ...container.slice(lastPathBit + 1),
    ];
    return returnUpdated(prevInfo, containerPath, updatedContainer);
  };
}

export function presentLongHex(hex?: string): string {
  if (typeof hex === "undefined") return "undefined";
  if (hex === null) return "null";
  const first: string = hex.slice(0, 8);
  const last: string = hex.slice(-6);
  return `${first}...${last}`;
}
