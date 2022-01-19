import { BigNumber } from "@polymathnetwork/polymesh-sdk"
import { Distributions } from "@polymathnetwork/polymesh-sdk/api/entities/SecurityToken/CorporateActions/Distributions"
import { ConfigureDividendDistributionParams } from "@polymathnetwork/polymesh-sdk/api/procedures/configureDividendDistribution"
import { TransactionQueue } from "@polymathnetwork/polymesh-sdk/internal"
import { DividendDistribution, DividendDistributionDetails } from "@polymathnetwork/polymesh-sdk/types"
import { Component } from "react"
import { OnCheckpointPicked } from "../../handlers/checkpoints/CheckpointHandlers"
import { OnDividendDistributionCreated } from "../../handlers/distribution/DividendDistributionHandlers"
import {
    CheckpointInfoJson,
    DividendDistributionInfoJson,
    isNumberedPortfolio,
    PortfolioInfoJson,
    TokenInfoJson,
} from "../../types"
import { showRequestCycle, ShowRequestCycler } from "../../ui-helpers"
import { CheckpointView } from "../checkpoints/CheckpointView"
import { getCorporateActionInfoJsonViewInner } from "../corporateActions/CorporateActionView"
import { DateTimeEntryView } from "../elements/DateTimeEntry"
import { PortfolioInfoJsonView } from "../portfolios/PortfolioInfoJsonView"
import { PortfolioView } from "../portfolios/PortfolioView"
import { CollapsibleFieldsetView } from "../presentation/CollapsibleFieldsetView"
import { DistributionParticipantsView } from "./ParticipantView"

export interface DividendDistributionViewProps {
    distribution: DividendDistribution
    myDid: string
}

export const getDividendDistributionViewInner = (props: DividendDistributionViewProps): JSX.Element[] => {
    const {
        distribution: {
            origin,
            currency,
            perShare,
            maxAmount,
            expiryDate,
            paymentDate,
        },
        myDid,
    } = props
    return [
        <li key="origin">
            Origin:&nbsp;
            <PortfolioView
                portfolio={origin}
                myDid={myDid}
            />
        </li>,
        <li key="currency">
            Currency:&nbsp;{currency}
        </li>,
        <li key="perShare">
            Per share:&nbsp;{perShare.toString(10)}
        </li>,
        <li key="maxAmount">
            Max amount:&nbsp;{maxAmount.toString(10)}
        </li>,
        <li key="expiryDate">
            Expiry date:&nbsp;{expiryDate?.toISOString() ?? "null"}
        </li>,
        <li key="paymentDate">
            Payment date:&nbsp;{paymentDate.toISOString()}
        </li>,
    ]
}

export class DividendDistributionView extends Component<DividendDistributionViewProps> {
    render() {
        return <ul>
            {getDividendDistributionViewInner(this.props)}
        </ul>
    }
}

export interface DividendDistributionDetailsViewProps {
    details: DividendDistributionDetails
}

export class DividendDistributionDetailsView extends Component<DividendDistributionDetailsViewProps> {
    render() {
        const {
            details: {
                remainingFunds,
                fundsReclaimed,
            },
        } = this.props
        return <ul>
            <li key="remainingFunds">
                Remaining funds:&nbsp;{remainingFunds.toString(10)}
            </li>
            <li key="fundsReclaimed">
                Funds reclaimed:&nbsp;
                <input
                    type="checkbox"
                    checked={fundsReclaimed} />
            </li>
        </ul>
    }
}

export interface DividendDistributionInfoJsonViewProps {
    action: DividendDistributionInfoJson
    myDid: string
    pickedCheckpoint: CheckpointInfoJson
    isWrongStyle: any
    canManipulate: boolean
    onCheckpointPicked: OnCheckpointPicked
}

export const getDividendDistributionInfoJsonViewInner = (props: DividendDistributionInfoJsonViewProps): JSX.Element[] => {
    const {
        action: {
            current,
            origin,
            exists,
            details,
            participants,
        },
        myDid,
        isWrongStyle,
        canManipulate,
    } = props
    return [
        ...getCorporateActionInfoJsonViewInner(props),
        ...getDividendDistributionViewInner({ distribution: current, myDid: myDid }),
        < li key="origin" >
            Origin:&nbsp;
            <PortfolioInfoJsonView
                portfolio={origin}
                myDid={myDid}
                isWrongStyle={isWrongStyle}
                onPortfolioInfoChanged={() => { }}
                canManipulate={canManipulate}
            />
        </li >,
        <li key="exists">
            Exists:&nbsp;
            <input
                type="checkbox"
                checked={exists} />
        </li>,
        <li key="details">
            Details:&nbsp;
            <DividendDistributionDetailsView
                details={details}
            />
        </li>,
        <li key="participants">
            Participants:&nbsp;
            <DistributionParticipantsView
                participants={participants}
                myDid={myDid}
            />
        </li>,
    ]
}

export class DividendDistributionInfoJsonView extends Component<DividendDistributionInfoJsonViewProps> {
    render() {
        return <ul>
            {getDividendDistributionInfoJsonViewInner(this.props)}
        </ul>
    }
}

export interface DividendDistributionInfoJsonsViewProps {
    actions: DividendDistributionInfoJson[]
    myDid: string
    pickedCheckpoint: CheckpointInfoJson
    isWrongStyle: any
    canManipulate: boolean
    onCheckpointPicked: OnCheckpointPicked
}

export class DividendDistributionInfoJsonsView extends Component<DividendDistributionInfoJsonsViewProps> {
    render() {
        const {
            actions,
            myDid,
            pickedCheckpoint,
            isWrongStyle,
            canManipulate,
            onCheckpointPicked,
        } = this.props
        if (actions.length === 0) return <div>There are no dividend distributions</div>
        return <ul>{
            actions.map((action: DividendDistributionInfoJson, index: number) => <li key={index}>
                Dividend distribution {index}:&nbsp;
                <DividendDistributionInfoJsonView
                    action={action}
                    myDid={myDid}
                    pickedCheckpoint={pickedCheckpoint}
                    isWrongStyle={isWrongStyle}
                    canManipulate={canManipulate}
                    onCheckpointPicked={onCheckpointPicked}
                />
            </li>)
        }</ul>
    }
}

interface DividendDistributionCreateViewState {
    declarationDate: Date | null
    description: string
    currency: string
    perShare: BigNumber
    maxAmount: BigNumber
    paymentDate: Date
    expiryDate: Date | null
}

export interface DividendDistributionCreateViewProps {
    distributions: Distributions
    myDid: string
    pickedCheckpoint: CheckpointInfoJson | null
    pickedPortfolio: PortfolioInfoJson | null
    cardStyle: any
    isWrongStyle: any
    canManipulate: boolean
    onDividendDistributionCreated: OnDividendDistributionCreated
}

export class DividendDistributionCreateView extends Component<DividendDistributionCreateViewProps, DividendDistributionCreateViewState> {
    constructor(props: DividendDistributionCreateViewProps) {
        super(props)
        this.state = {
            declarationDate: null,
            description: "",
            currency: "",
            perShare: new BigNumber("0"),
            maxAmount: new BigNumber("0"),
            paymentDate: new Date(),
            expiryDate: null,
        }
    }

    onDeclarationDateChanged = (newDeclarationDate: Date | null) => this.setState({
        declarationDate: newDeclarationDate,
    })
    onDescriptionChanged = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        description: e.target.value,
    })
    onCurrencyChanged = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        currency: e.target.value,
    })
    onPerShareChanged = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        perShare: new BigNumber(e.target.value),
    })
    onMaxAmountChanged = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        maxAmount: new BigNumber(e.target.value),
    })
    onPaymentDateChanged = (newPaymentDate: Date) => this.setState({
        paymentDate: newPaymentDate,
    })
    onExpiryDateChanged = (newExpiryDate: Date | null) => this.setState({
        expiryDate: newExpiryDate,
    })
    getCreationParams = (): ConfigureDividendDistributionParams => ({
        ...this.state,
        declarationDate: this.state.declarationDate ?? undefined,
        originPortfolio: typeof this.props.pickedPortfolio === "undefined" || this.props.pickedPortfolio === null
            ? undefined
            : isNumberedPortfolio(this.props.pickedPortfolio.original)
                ? this.props.pickedPortfolio.original
                : undefined,
        checkpoint: this.props.pickedCheckpoint?.checkpoint ?? undefined,
        expiryDate: this.state.expiryDate ?? undefined,
    })
    onCreateDividendDistribution = async () => {
        const cycler: ShowRequestCycler = showRequestCycle("Creating dividend distribution")
        const queue: TransactionQueue<DividendDistribution, DividendDistribution> = await this.props.distributions.configureDividendDistribution(this.getCreationParams())
        cycler.running()
        const distribution: DividendDistribution = await queue.run()
        cycler.hasRun()
        this.props.onDividendDistributionCreated(distribution)
    }

    render() {
        const {
            declarationDate,
            description,
            currency,
            perShare,
            maxAmount,
            paymentDate,
            expiryDate,
        } = this.state
        const {
            myDid,
            pickedCheckpoint,
            pickedPortfolio,
            cardStyle,
            isWrongStyle,
            canManipulate,
        } = this.props
        const canCreate: boolean = canManipulate && pickedCheckpoint != null
        return <CollapsibleFieldsetView
            className={cardStyle}
            collapsed={false}
            legend="Create new">

            <ul>
                <li key="declarationDate">
                    Declaration date:&nbsp;
                    <DateTimeEntryView
                        dateTime={declarationDate}
                        isOptional={true}
                        isWrongStyle={isWrongStyle}
                        canManipulate={canManipulate}
                        onValidDateChanged={this.onDeclarationDateChanged}
                    />
                </li>
                <li key="checkpoint">
                    Checkpoint:&nbsp;Pick from the list of checkpoints&nbsp;
                    {(function () {
                        if (typeof pickedCheckpoint === "undefined" || pickedCheckpoint === null)
                            return <div>No picked checkpoint</div>
                        return <CheckpointView
                            checkpointInfo={pickedCheckpoint}
                            canManipulate={false}
                        />
                    })()}
                </li>
                <li key="description">
                    Description:&nbsp;
                    <input
                        value={description}
                        placeholder="Quarterly dividend"
                        onChange={this.onDescriptionChanged}
                        disabled={!canManipulate}
                    />
                </li>
                <li key="originPortfolio">
                    Origin portfolio:&nbsp;Pick from the list of portfolios&nbsp;
                    {(function () {
                        if (typeof pickedPortfolio === "undefined"
                            || pickedPortfolio === null
                            || !isNumberedPortfolio(pickedPortfolio.original))
                            return <div>Your default portfolio</div>
                        return <PortfolioInfoJsonView
                            portfolio={pickedPortfolio}
                            myDid={myDid}
                            isWrongStyle={isWrongStyle}
                            canManipulate={false}
                            onPortfolioInfoChanged={() => { }} />
                    })()}
                </li>
                <li key="currency">
                    Currency:&nbsp;
                    <input
                        value={currency}
                        placeholder="USD"
                        disabled={!canManipulate}
                        onChange={this.onCurrencyChanged} />
                </li>
                <li key="perShare">
                    Per share:&nbsp;
                    <input
                        value={perShare.toString(10)}
                        placeholder="1"
                        disabled={!canManipulate}
                        onChange={this.onPerShareChanged} />
                </li>
                <li key="maxAmount">
                    Max amount:&nbsp;
                    <input
                        value={maxAmount.toString(10)}
                        placeholder="1"
                        disabled={!canManipulate}
                        onChange={this.onMaxAmountChanged} />
                </li>
                <li key="paymentDate">
                    Payment date:&nbsp;
                    <DateTimeEntryView
                        dateTime={paymentDate}
                        isOptional={false}
                        isWrongStyle={isWrongStyle}
                        canManipulate={canManipulate}
                        onValidDateChanged={this.onPaymentDateChanged}
                    />
                </li>
                <li key="expiryDate">
                    Expiry date:&nbsp;
                    <DateTimeEntryView
                        dateTime={expiryDate}
                        isOptional={true}
                        isWrongStyle={isWrongStyle}
                        canManipulate={canManipulate}
                        onValidDateChanged={this.onExpiryDateChanged}
                    />
                </li>
            </ul>

            <div className="submit">
                <button
                    className="submit create-dividend-distribution"
                    onClick={this.onCreateDividendDistribution}
                    disabled={!canCreate}>
                    Create 1 now
                </button>
            </div>

        </CollapsibleFieldsetView>
    }
}

export interface DividendDistributionManagerViewProps {
    distributions: DividendDistributionInfoJson[]
    token: TokenInfoJson
    myDid: string
    pickedCheckpoint: CheckpointInfoJson
    pickedPortfolio: PortfolioInfoJson
    cardStyle: any
    isWrongStyle: any
    onCheckpointPicked: OnCheckpointPicked
    onDividendDistributionCreated: OnDividendDistributionCreated
}

export class DividendDistributionManagerView extends Component<DividendDistributionManagerViewProps> {
    render() {
        const {
            distributions,
            token,
            myDid,
            pickedCheckpoint,
            pickedPortfolio,
            cardStyle,
            isWrongStyle,
            onCheckpointPicked,
            onDividendDistributionCreated,
        } = this.props
        return <CollapsibleFieldsetView
            legend={`Dividend distributions for: ${token.current?.ticker}`}
            collapsed={true}
            className={cardStyle}>

            <DividendDistributionCreateView
                distributions={token?.current?.corporateActions?.distributions}
                myDid={myDid}
                cardStyle={cardStyle}
                isWrongStyle={isWrongStyle}
                onDividendDistributionCreated={onDividendDistributionCreated}
                pickedCheckpoint={pickedCheckpoint}
                pickedPortfolio={pickedPortfolio}
                canManipulate={token?.current !== null} />

            <CollapsibleFieldsetView
                legend="Loaded dividend distributions"
                collapsed={false}
                className={cardStyle}>

                <DividendDistributionInfoJsonsView
                    actions={distributions}
                    pickedCheckpoint={pickedCheckpoint}
                    isWrongStyle={isWrongStyle}
                    myDid={myDid}
                    canManipulate={true}
                    onCheckpointPicked={onCheckpointPicked}
                />

            </CollapsibleFieldsetView>

        </CollapsibleFieldsetView>
    }
}