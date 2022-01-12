import { Account, Identity } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { isAccount, isIdentity } from "../../types";
import { LongView } from "../LongHexView";

export interface IdentityViewProps {
    value: string | Identity
    /**
     * Look-up table to replace well-known values.
     */
    lut: { [key: string]: string } | undefined | null
}

const defaultIdentityCutoffs = {
    left: 8,
    right: 6,
}

export class IdentityView extends Component<IdentityViewProps> {
    render() {
        const { value, lut } = this.props
        const { left, right } = defaultIdentityCutoffs
        return <LongView
            value={isIdentity(value) ? value.did : value}
            left={left}
            right={right}
            lut={lut}
        />
    }
}

export interface IdentitiesViewProps {
    values: (string | Identity)[] | null | undefined
    /**
     * Look-up table to replace well-known values.
     */
    lut: { [key: string]: string } | undefined | null
}

export class IdentitiesView extends Component<IdentitiesViewProps> {
    render() {
        const { values, lut } = this.props
        if (!values || values.length === 0) return <div>There are no identities</div>
        return <ol>{
            values.map((value: Identity, index: number) => <li key={index}>
                <IdentityView
                    value={value}
                    lut={lut}
                />
            </li>)
        }</ol>
    }
}

export interface AccountViewProps {
    value: string | Account
    /**
     * Look-up table to replace well-known values.
     */
    lut: { [key: string]: string } | undefined | null
}

const defaultAccountCutoffs = {
    left: 8,
    right: 6,
}

export class AccountView extends Component<AccountViewProps> {
    render() {
        const { value, lut } = this.props
        const { left, right } = defaultAccountCutoffs
        return <LongView
            value={isAccount(value) ? value.address : value}
            left={left}
            right={right}
            lut={lut}
        />
    }
}
