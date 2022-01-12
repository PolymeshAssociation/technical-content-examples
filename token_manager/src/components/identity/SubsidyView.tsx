import { Subsidy } from "@polymathnetwork/polymesh-sdk/types";
import { Component } from "react";
import { AccountView } from "./IdentityView";

export interface SubsidyViewProps {
    subsidy: Subsidy
    myAddress: string
}

export class SubsidyView extends Component<SubsidyViewProps> {
    render() {
        const {
            subsidy: {
                beneficiary,
                subsidizer,
                allowance
            },
            myAddress
        } = this.props
        return <ul>
            <li key="beneficiary">
                Beneficiary:&nbsp;
                <AccountView
                    value={beneficiary}
                    lut={{ [myAddress]: "me" }}
                />
            </li>
            <li key="subsidizer">
                Subsidizer:&nbsp;
                <AccountView
                    value={subsidizer}
                    lut={{ [myAddress]: "me" }}
                />
            </li>
            <li key="allowance">
                Allowance:&nbsp;
                {allowance.toString(10)}
            </li>
        </ul>
    }
}