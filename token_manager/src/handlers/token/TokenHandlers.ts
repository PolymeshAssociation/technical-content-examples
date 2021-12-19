import {
    EventIdentifier,
    SecurityToken,
    SecurityTokenDetails,
    TokenIdentifier,
} from "@polymathnetwork/polymesh-sdk/types"
import { TokenInfoJson } from "../../types"

export type OnTokenIdentifierChanged = (identifier: TokenIdentifier) => void
export type OnTokenIdentifiersChanged = (identifiers: TokenIdentifier[]) => void
export type OnTokenInfoChanged = (token: TokenInfoJson) => void

export async function fetchTokenInfoJson(securityToken: SecurityToken): Promise<TokenInfoJson> {
    const [createdAt, details, currentFundingRound, tokenIdentifiers]: [EventIdentifier, SecurityTokenDetails, string, TokenIdentifier[]] = await Promise.all([
        securityToken.createdAt(),
        securityToken.details(),
        securityToken.currentFundingRound(),
        securityToken.getIdentifiers(),
    ])
    return {
        current: securityToken,
        createdAt: createdAt,
        details: details,
        currentFundingRound: currentFundingRound,
        tokenIdentifiers: tokenIdentifiers,
    }
}