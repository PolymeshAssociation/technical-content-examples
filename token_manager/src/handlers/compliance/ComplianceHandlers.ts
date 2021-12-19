import { Identity } from "@polymathnetwork/polymesh-sdk/types"

export type IdentityGetter = (did: string) => Promise<Identity>
