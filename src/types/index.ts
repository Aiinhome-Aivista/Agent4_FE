export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'
export type Priority  = 'critical' | 'high' | 'medium' | 'low'
export type Source    = 'jira' | 'servicenow'

export interface Incident {
  ai_risk_score: number
  id: number
  source: Source
  ticket_id: string
  title: string
  description: string
  priority: Priority
  status: string
  assignee: string
  reporter: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  sla_due_at: string | null
  reassignment_count: number
  ingested_at: string
  // joined risk fields
  risk_score: number | null
  risk_level: RiskLevel | null
  breach_probability: string | null
  reasons: string[] | null
  recommended_actions: string[] | null
  calculated_at: string | null
}

export interface DashboardStats {
  total_incidents: number
  high_risk: number
  medium_risk: number
  low_risk: number
  avg_risk_score: number
}

export interface Connector {
  id: number
  connector_type: 'jira' | 'servicenow'
  base_url: string
  username: string
  app_id?: string | null
  is_active: boolean
  last_synced_at: string | null
  created_at: string
}
