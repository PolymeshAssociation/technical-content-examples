import {
    DefaultPortfolio,
    NumberedPortfolio,
    PermissionType,
    SectionPermissions,
    SecurityToken,
} from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { PortfoliosView } from "../portfolios/PortfolioView"
import { OnSectionPermissionsChanged } from "../../handlers/permissions/SectionPermissionsHandler"
import { EnumSelectView } from "../EnumView"

export interface ShortSecurityTokenViewProps {
    values: SecurityToken[]
}

export class ShortSecurityTokenView extends Component<ShortSecurityTokenViewProps> {

    render() {
        const { values } = this.props
        if (values.length === 0) return <div>No security tokens</div>
        return values.map((token: SecurityToken, index: number) => <li key={index}>
            {token.ticker}
        </li>)
    }
}

export interface SectionPermissionsSecurityTokenViewProps {
    permissions: SectionPermissions<SecurityToken> | null
    canManipulate: boolean
    onSectionPermissionsChanged: OnSectionPermissionsChanged<SecurityToken>
}

export class SectionPermissionsSecurityTokenView extends Component<SectionPermissionsSecurityTokenViewProps> {

    onPermissionTypeChanged = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type: PermissionType = PermissionType[e.target.value]
        this.props.onSectionPermissionsChanged({
            ...this.props.permissions,
            type: type,
        })
    }

    render() {
        const { permissions, canManipulate } = this.props
        if (permissions === null) return <div>null</div>
        const { values, type } = permissions
        return <ul>
            <li key="type">
                Type:&nbsp;
                <EnumSelectView<PermissionType>
                    theEnum={PermissionType}
                    defaultValue={type}
                    onChange={this.onPermissionTypeChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="values">
                Values:&nbsp;
                <ShortSecurityTokenView
                    values={values}
                />
            </li>
        </ul>
    }
}

export interface SectionPermissionsPortfolioViewProps {
    permissions: SectionPermissions<DefaultPortfolio | NumberedPortfolio> | null
    myDid: string
    canManipulate: boolean
    onSectionPermissionsChanged: OnSectionPermissionsChanged<DefaultPortfolio | NumberedPortfolio>
}

export class SectionPermissionsPortfolioView extends Component<SectionPermissionsPortfolioViewProps> {

    onPermissionTypeChanged = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type: PermissionType = PermissionType[e.target.value]
        this.props.onSectionPermissionsChanged({
            ...this.props.permissions,
            type: type,
        })
    }

    render() {
        const { permissions, myDid, canManipulate } = this.props
        if (permissions === null) return <div>null</div>
        const { values, type } = permissions
        return <ul>
            <li key="type">
                Type:&nbsp;
                <EnumSelectView<PermissionType>
                    theEnum={PermissionType}
                    defaultValue={type}
                    onChange={this.onPermissionTypeChanged}
                    canManipulate={canManipulate}
                />
            </li>
            <li key="values">
                Values:&nbsp;
                <PortfoliosView
                    portfolios={values}
                    myDid={myDid}
                />
            </li>
        </ul>
    }
}
