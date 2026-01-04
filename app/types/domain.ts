export interface SlackLogEntry {
  app_id?: string;
  service_id?: string;
  app_type?: string;
  service_type?: string;
  scope?: string;
  change_type: 'added' | 'removed' | 'enabled' | 'disabled' | 'updated';
  date: string;
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
