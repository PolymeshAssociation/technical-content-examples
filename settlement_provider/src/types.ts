import { Polymesh } from "@polymathnetwork/polymesh-sdk";
import { DefaultPortfolio, Identity, NumberedPortfolio, Signer } from "@polymathnetwork/polymesh-sdk/types";

export type PolymeshCreator = () => Promise<Polymesh>

export const isNumberedPortfolio = (portfolio: DefaultPortfolio | NumberedPortfolio): portfolio is NumberedPortfolio => typeof (portfolio as NumberedPortfolio).id !== "undefined"
export const isIdentityNotAccount = (signer: Signer): signer is Identity => typeof (signer as Identity).did !== "undefined"
