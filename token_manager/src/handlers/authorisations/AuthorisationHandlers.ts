import { AuthorizationRequest } from "@polymathnetwork/polymesh-sdk/internal";
import { Authorization } from "@polymathnetwork/polymesh-sdk/types";

export type OnAuthorisationChanged = (authorisation: Authorization) => void
export type OnAuthorisationRequestChanged = (request: AuthorizationRequest) => void

