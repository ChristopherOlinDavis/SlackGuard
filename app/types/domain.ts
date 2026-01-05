export interface SlackLogEntry {
  app_id?: string;
  service_id?: string;
  app_type?: string;
  service_type?: string;
  scope?: string;
  change_type: 'added' | 'removed' | 'enabled' | 'disabled' | 'updated';
  date: string;
}

export type SubscriptionTier = "FREE" | "PRO";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "TRIAL";

export interface WorkspaceSubscription {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  hasUsedFreeScan: boolean;
}

export interface ScanResult {
  classicApps: number;
  modernApps: number;
  apps: Array<{
    id: string;
    name: string;
    isClassic: boolean;
    scopes: string[];
  }>;
}

export interface SlackIntegrationLogsResponse {
  ok: boolean;
  logs: SlackLogEntry[];
  paging?: {
    count: number;
    total: number;
    page: number;
    pages: number;
  };
  error?: string;
}

export interface ScanHistoryEntry {
  id: string;
  classicCount: number;
  modernCount: number;
  totalApps: number;
  newClassicApps: string[];
  removedApps: string[];
  scanDate: Date;
}
