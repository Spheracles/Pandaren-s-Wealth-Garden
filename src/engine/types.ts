/**
 * WEALTH GARDEN — domain model.
 * All money values are integer minor units ("cents") to avoid floating-point drift.
 * `base` is always the TWD-converted amount captured at record time.
 */
export type Cents = number;
export type CurrencyCode = string;
export type ISODate = string; // YYYY-MM-DD

export type TxType =
  | 'income' | 'expense' | 'refund'
  | 'transfer' | 'ccpay' | 'fx' | 'invest'
  | 'realized' | 'valuation';

export type AccountKind = 'cash' | 'bank' | 'epay' | 'credit' | 'invest' | 'custom';
export type AssetType = 'realestate' | 'invest' | 'other';
export type ProjectStatus = '構想' | '培育' | '驗證' | '穩定收益' | '暫停' | '轉型' | '終止';
export type PlantStage = 'seed' | 'sprout' | 'bud' | 'bloom' | 'stable' | 'dormant' | 'amber' | 'specimen';

export interface Allocation { pid: string; pct: number }

export interface Transaction {
  id: string;
  type: TxType;
  date: ISODate;
  amt: Cents;            // original-currency amount (signed only for valuation / realized)
  cur: CurrencyCode;     // currency of `acct` / `from`
  rate: number;          // rate used at record time (fx: toAmt / amt)
  base: Cents;           // TWD amount at record time
  desc: string;
  cat?: string;
  acct?: string;
  from?: string;
  to?: string;
  toAmt?: Cents;
  toCur?: CurrencyCode;
  alloc: Allocation[];
  recurringAttr?: boolean;
  reusable?: boolean;
  snapshotCovered?: boolean; // dated on/before the opening snapshot: history only, no balance effect
  deleted?: boolean;         // soft delete
  demo?: boolean;
  imported?: boolean;
  created: string;
  updated?: string;
}

export interface Account {
  id: string; name: string; kind: AccountKind; cur: CurrencyCode; opening: Cents;
  archived?: boolean; demo?: boolean;
  reconciled?: { date: ISODate; stmt: Cents; diff: Cents };
}

export interface Asset {
  id: string; name: string; type: AssetType; value: Cents; monthlyIncome: Cents; maintenance: Cents;
  date: ISODate; history: { date: ISODate; value: Cents }[]; demo?: boolean;
}

export interface Liability {
  id: string; name: string; balance: Cents; rate: number; installment: Cents; dueDay: number;
  history: { date: ISODate; balance: Cents }[]; demo?: boolean;
}

export interface Activity {
  id: string; date: ISODate; title: string; minutes: number; kind: string;
  energy: number; // -5..+5 subjective ordinal score
  saved: number;  // minutes actually saved
  alloc: Allocation[];
  txId?: string; created: string; demo?: boolean; deleted?: boolean;
}

export interface Milestone { id: string; name: string; done: boolean; verified: boolean; date?: ISODate }
export interface Task { id: string; text: string; done: boolean; due?: ISODate; doneDate?: ISODate }

export interface Project {
  id: string; name: string; desc: string; goal: string; status: ProjectStatus;
  created: ISODate; due: ISODate | ''; budget: Cents; expected: string; expectedAmt: Cents;
  riskFlag: boolean; risks: string; tasks: Task[]; milestones: Milestone[];
  history: { date: ISODate; text: string }[]; demo?: boolean;
}

export interface Recurring {
  id: string; kind: 'income' | 'expense'; desc: string; amt: Cents; cat: string; acct: string; day: number; active: boolean;
}

export interface Template { id: string; name: string; type: TxType; amt: Cents; cat?: string; acct?: string; desc: string }

export interface Suggestion {
  id: string; status: 'pending' | 'approved' | 'rejected'; source: string; created: ISODate; decided?: ISODate;
  projectId?: string;
  title: string; finding: string; basis: string; reason: string; plan: string;
  money: Cents; timeMin: number; energy: string; benefit: string; risks: string; steps: string[]; measure: string;
}

export interface AuditEntry { id: string; ts: string; action: string; entity: string; detail: string; before?: unknown; after?: unknown }

export interface Settings {
  hourly: Cents; base: 'TWD';
  rates: Record<CurrencyCode, { rate: number; date: ISODate }>;
  snapshotDate: ISODate;
  aiConsent: { summary: boolean; raw: boolean; projects: boolean };
  provider: 'none' | 'gemini' | 'openai';
  setupDone: boolean;
  goals: { name: string; target: Cents }[];
  emailPrivacy: 'hide' | 'partial' | 'full';
  opsBudget: { total: Cents; items: { k: string; v: Cents }[] };
}

export interface State {
  version: number;
  mode: 'demo' | 'user';
  privacy?: boolean;
  settings: Settings;
  accounts: Account[];
  txs: Transaction[];
  activities: Activity[];
  projects: Project[];
  assets: Asset[];
  liabilities: Liability[];
  recurring: Recurring[];
  templates: Template[];
  suggestions: Suggestion[];
  budgets: Record<string, Cents>;
  customCats: { income: string[]; expense: string[] };
  audit: AuditEntry[];
  notifRead: string[];
  flags: Record<string, boolean>;
  aiUsage: { ts: string; provider: string; tokens: number; costCents: Cents }[];
}
