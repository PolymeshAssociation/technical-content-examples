import { DefaultPortfolio, SecurityToken } from "@polymathnetwork/polymesh-sdk/internal"
import { NumberedPortfolio, Permissions, SectionPermissions, TransactionPermissions, TxGroup, } from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { OnPermissionsChanged } from "../../handlers/permissions/PermissionsHandlers"
import { SectionPermissionsPortfolioView, SectionPermissionsSecurityTokenView } from "./SectionPermissionView"
import { TransactionPermissionsView, TxGroupsView } from "./TransactionPermissionView"

export interface PermissionsViewProps {
    permissions: Permissions
    myDid: string
    canManipulate: boolean
    onPermissionsChanged: OnPermissionsChanged
}

export class PermissionsView extends Component<PermissionsViewProps> {

    onSectionPermissionsSecurityTokenChanged = (permissions: SectionPermissions<SecurityToken>) => this.props.onPermissionsChanged({
        ...this.props.permissions,
        tokens: permissions,
    })
    onTransactionPermissionsChanged = (permissions: TransactionPermissions) => this.props.onPermissionsChanged({
        ...this.props.permissions,
        transactions: permissions,
    })
    onTxGroupsChanged = (groups: TxGroup[]) => this.props.onPermissionsChanged({
        ...this.props.permissions,
        transactionGroups: groups,
    })
    onSectionPermissionsPortfolioChanged = (permissions: SectionPermissions<DefaultPortfolio | NumberedPortfolio>) => this.props.onPermissionsChanged({
        ...this.props.permissions,
        portfolios: permissions,
    })


    render() {
        const {
            permissions: {
                portfolios, tokens, transactionGroups, transactions
            },
            myDid,
            canManipulate,
        } = this.props
        return <ul>
            <li key="tokens">
                Tokens:&nbsp;
                <SectionPermissionsSecurityTokenView
                    permissions={tokens}
                    canManipulate={canManipulate}
                    onSectionPermissionsChanged={this.onSectionPermissionsSecurityTokenChanged}
                />
            </li>
            <li key="transactions">
                Transactions:&nbsp;
                <TransactionPermissionsView
                    transactions={transactions}
                    onTransactionPermissionsChanged={this.onTransactionPermissionsChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="transactions">
                Transaction groups:&nbsp;
                <TxGroupsView
                    txGroups={transactionGroups}
                    onTxGroupsChanged={this.onTxGroupsChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="tokens">
                Portfolios:&nbsp;
                <SectionPermissionsPortfolioView
                    permissions={portfolios}
                    myDid={myDid}
                    canManipulate={canManipulate}
                    onSectionPermissionsChanged={this.onSectionPermissionsPortfolioChanged}
                />
            </li>
        </ul>
    }
}