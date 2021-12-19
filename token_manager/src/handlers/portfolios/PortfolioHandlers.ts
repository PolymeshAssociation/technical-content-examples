import { Identity } from "@polymathnetwork/polymesh-sdk/internal";
import { DefaultPortfolio, EventIdentifier, NumberedPortfolio } from "@polymathnetwork/polymesh-sdk/types";
import { isNumberedPortfolio, PortfolioInfoJson } from "../../types";

export async function fetchPortfolioInfoJson(portfolio: DefaultPortfolio | NumberedPortfolio): Promise<PortfolioInfoJson> {
    const fetched: [EventIdentifier, boolean, Identity, string] = await Promise.all([
        isNumberedPortfolio(portfolio) ? portfolio.createdAt() : null,
        portfolio.exists(),
        portfolio.getCustodian(),
        isNumberedPortfolio(portfolio) ? portfolio.getName() : null,
    ])
    return {
        original: portfolio,
        createdAt: fetched[0],
        exists: fetched[1],
        custodian: fetched[2].did,
        name: fetched[3],
    }
}

export async function fetchPortfolioInfoJsons(portfolios: (DefaultPortfolio | NumberedPortfolio)[]): Promise<PortfolioInfoJson[]> {
    return Promise.all(portfolios.map(fetchPortfolioInfoJson))
}

export interface NewPortfolioParams {
    name: string
}

export type OnPortfolioInfoChanged = (changed: PortfolioInfoJson) => void
export type OnPortfolioInfosChanged = (portfolio: PortfolioInfoJson[]) => void
