import countries from "i18n-iso-countries";
import {
  AddInvestorUniquenessClaimParams,
  Asset,
  AssetDetails,
  CalendarUnit,
  CddClaim,
  CheckpointWithData,
  Claim,
  ClaimData,
  ClaimTarget,
  ClaimType,
  Condition,
  ConditionType,
  ConfigureDividendDistributionParams,
  CountryCode,
  CreateCheckpointScheduleParams,
  DefaultPortfolio,
  DistributionParticipant,
  DividendDistributionDetails,
  EventIdentifier,
  IdentityCondition,
  InvestorUniquenessClaim,
  KnownAssetType,
  ModifyCorporateActionsAgentParams,
  ModifyPrimaryIssuanceAgentParams,
  NumberedPortfolio,
  Requirement,
  Scope,
  ScopeType,
  TickerReservation,
  TickerReservationDetails,
  UnscopedClaim,
} from "@polymeshassociation/polymesh-sdk/types";
import {
  AuthorizationRequest,
  Checkpoint,
  CheckpointSchedule,
  CorporateAction,
  DividendDistribution,
  Identity,
} from "@polymeshassociation/polymesh-sdk/internal";
import { BigNumber } from "@polymeshassociation/polymesh-sdk";
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

export declare type CountryInfo = {
  value: string;
  label: string;
};

export function getCountryList(): CountryInfo[] {
  return Object.values(CountryCode)
    .sort()
    .map((code: string) => {
      return {
        value: code,
        label: countries.getName(code.toUpperCase(), "en") || code,
      };
    });
}

export type MyInfoJson = {
  ticker: string;
  myDid: string;
  myAddress: string;
  myTickers: string[];
  reservation: ReservationInfoJson;
  asset: AssetInfoJson;
  requirements: RequirementsInfoJson;
  authorizations: AuthorizationInfoJson;
  portfolios: PortfoliosInfoJson;
  attestations: AttestationsInfoJson;
  checkpoints: CheckpointsInfoJson;
  corporateActions: CorporateActionsInfoJson;
};

export type ReservationInfoJson = {
  fetchTimer: NodeJS.Timeout;
  current: TickerReservation;
  details: TickerReservationDetails;
};

export type AssetInfoJson = {
  current: Asset;
  createdAt: EventIdentifier;
  details: AssetDetails;
  piaBalance: {
    locked: string;
    total: string;
    toIssue: number;
    toRedeem: number;
  };
  ownershipTarget: string;
  piaChangeInfo: ModifyPrimaryIssuanceAgentParams;
};

export type RequirementsInfoJson = {
  current: Requirement[];
  arePaused: boolean;
  canManipulate: boolean;
  modified: boolean;
  settleSimulation: {
    sender: string;
    recipient: string;
    works: boolean | null;
  };
};

export type AuthorizationInfoJson = {
  current: AuthorizationRequest[];
};

export type PortfoliosInfoJson = {
  current: [DefaultPortfolio, ...NumberedPortfolio[]] | null;
  mine: [DefaultPortfolio, ...NumberedPortfolio[]];
  otherOwner: string;
  details: PortfolioInfoJson[];
  myDetails: PortfolioInfoJson[];
  newPortfolioName: string;
};

export type PortfolioInfoJson = {
  original: DefaultPortfolio | NumberedPortfolio;
  owner: string;
  id: string | null;
  name: string;
  custodian: string;
  newCustodian: string;
};

export type AttestationsInfoJson = {
  current: ClaimData<Claim>[];
  otherTarget: string;
  toAdd: {
    target: string;
    expiry: Date | null;
    claim: Claim;
  };
  uniquenessToAdd: AddInvestorUniquenessClaimParams;
};

export type CheckpointsInfoJson = {
  current: CheckpointWithData[];
  details: CheckpointInfoJson[];
  scheduledToAdd: CreateCheckpointScheduleParams;
  currentSchedules: CheckpointSchedule[];
  scheduleDetails: CheckpointScheduleDetailsInfoJson[];
};

export type CheckpointInfoJson = {
  checkpoint: Checkpoint;
  totalSupply: BigNumber;
  createdAt: Date;
  whoseBalance: string;
  balance: BigNumber;
};

export type CheckpointScheduleInfoJson = {
  schedule: CheckpointSchedule;
  createdCheckpoints: CheckpointInfoJson[];
  exists: boolean;
};

export type CheckpointScheduleDetailsInfoJson = CheckpointScheduleInfoJson & {
  remainingCheckpoints: BigNumber;
  nextCheckpointDate: Date;
};

export type CorporateActionsInfoJson = {
  distributions: DistributionsInfoJson;
  agent: Identity;
  newAgent: ModifyCorporateActionsAgentParams;
};

export type DistributionsInfoJson = {
  dividends: DividendDistributionInfoJson[];
  newDividend: ConfigureDividendDistributionParams;
};

export type CorporateActionInfoJson = {
  current: CorporateAction;
  exists: boolean;
  checkpoint: CheckpointInfoJson | null;
  checkpointSchedule: CheckpointScheduleInfoJson | null;
};

export type DividendDistributionInfoJson = Omit<
  CorporateActionInfoJson,
  "current"
> & {
  current: DividendDistribution;
  origin: PortfolioInfoJson;
  details: DividendDistributionDetails;
  participants: DistributionParticipant[];
};

export function getEmptyAssetDetails(): AssetDetails {
  return {
    assetType: KnownAssetType.EquityCommon,
    isDivisible: false,
    name: "",
    owner: null,
    totalSupply: new BigNumber("0"),
    primaryIssuanceAgents: [],
    fullAgents: [],
    requiresInvestorUniqueness: false,
  };
}

export function getEmptyRequirements(): RequirementsInfoJson {
  return {
    current: [] as Requirement[],
    arePaused: true as boolean,
    canManipulate: false as boolean,
    modified: false as boolean,
    settleSimulation: {
      sender: "" as string,
      recipient: "" as string,
      works: null as boolean | null,
    },
  };
}

export function getEmptyMyInfo(): MyInfoJson {
  return {
    ticker: "" as string,
    myDid: "" as string,
    myAddress: "" as string,
    myTickers: [] as string[],
    reservation: {
      fetchTimer: null as NodeJS.Timeout,
      current: null as TickerReservation,
      details: null as TickerReservationDetails,
    } as ReservationInfoJson,
    asset: {
      current: null as Asset,
      details: getEmptyAssetDetails() as AssetDetails,
      piaBalance: {
        locked: "" as string,
        total: "" as string,
        toIssue: 0 as number,
        toRedeem: 0 as number,
      },
      ownershipTarget: "" as string,
      piaChangeInfo: {
        target: "" as string | Identity,
        requestExpiry: null as Date | null,
      } as ModifyPrimaryIssuanceAgentParams,
      createdAt: null,
    } as AssetInfoJson,
    requirements: getEmptyRequirements() as RequirementsInfoJson,
    authorizations: {
      current: [] as AuthorizationRequest[],
    } as AuthorizationInfoJson,
    attestations: {
      current: [] as ClaimData<Claim>[],
      otherTarget: "" as string,
      toAdd: {
        target: "" as string,
        expiry: null as Date | null,
        claim: {
          type: ClaimType.NoData,
        } as Claim,
      } as ClaimTarget,
      uniquenessToAdd: {
        scope: {
          type: ScopeType.Ticker,
          value: "" as string,
        } as Scope,
        cddId: "" as string,
        proof: "" as string,
        scopeId: "" as string,
        expiry: null as Date | null,
      } as AddInvestorUniquenessClaimParams,
    } as AttestationsInfoJson,
    portfolios: {
      current: null as [DefaultPortfolio, ...NumberedPortfolio[]] | null,
      mine: [] as unknown as [DefaultPortfolio, ...NumberedPortfolio[]],
      otherOwner: "" as string,
      details: [] as PortfolioInfoJson[],
      myDetails: [] as PortfolioInfoJson[],
      newPortfolioName: "",
    },
    checkpoints: {
      current: [] as CheckpointWithData[],
      details: [] as CheckpointInfoJson[],
      scheduledToAdd: {
        start: new Date(),
        period: {
          amount: new BigNumber(3),
          unit: CalendarUnit.Month,
        },
        repetitions: new BigNumber(0),
      },
      currentSchedules: [] as CheckpointSchedule[],
      scheduleDetails: [] as CheckpointScheduleDetailsInfoJson[],
    },
    corporateActions: {
      distributions: {
        dividends: [] as DividendDistributionInfoJson[],
        newDividend: {
          declarationDate: new Date(),
          checkpoint: null as Checkpoint,
          description: "" as string,
          taxWithholdings: [],
          originPortfolio: null,
          currency: "",
          perShare: new BigNumber(0),
          maxAmount: new BigNumber(0),
          paymentDate: new Date(),
          expiryDate: null,
        },
      },
      agent: null as Identity,
      newAgent: {
        target: "" as string | Identity,
        requestExpiry: null as Date | null,
      } as ModifyCorporateActionsAgentParams,
    },
  };
}

export interface HasFetchTimer {
  fetchTimer: NodeJS.Timeout | null;
}

export const isClaimData = (
  claimData: ClaimData | ClaimTarget
): claimData is ClaimData =>
  typeof (claimData as ClaimData).issuedAt !== "undefined";
