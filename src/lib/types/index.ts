export type UserRole = 'jc_admin' | 'client_admin' | 'client_user'

export type ServiceModule =
  | 'legales'
  | 'social_media'
  | 'ads'
  | 'influencers'
  | 'webs'
  | 'extras'
  | 'admin'

export type PermissionLevel = 'view' | 'comment' | 'approve' | 'edit'

export type SocialNetwork =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'google'
  | 'linkedin'
  | 'twitter'
  | 'pinterest'
  | 'spotify'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes'

export type InvoiceStatus = 'pending' | 'sent' | 'paid' | 'overdue'

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url?: string
  active_services: ServiceModule[]
  active_networks: SocialNetwork[]
  created_at: string
}

export interface WorkspaceUser {
  id: string
  workspace_id: string
  user_id: string
  role: UserRole
  permissions: Record<ServiceModule, PermissionLevel[]>
  created_at: string
  user?: {
    email: string
    full_name: string
    avatar_url?: string
  }
}

export interface LegalDocument {
  id: string
  workspace_id: string
  title: string
  description?: string
  file_url: string
  signed_file_url?: string
  status: 'pending' | 'signed'
  signed_at?: string
  signed_by?: string
  created_at: string
}

export interface SocialPost {
  id: string
  workspace_id: string
  network: SocialNetwork
  title: string
  caption: string
  media_urls: string[]
  scheduled_at: string
  status: ApprovalStatus | 'published' | 'draft'
  comments: PostComment[]
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user?: { full_name: string; avatar_url?: string }
}

export interface Influencer {
  id: string
  workspace_id: string
  name: string
  handle: string
  network: SocialNetwork
  followers: number
  engagement_rate: number
  category: string
  profile_url?: string
  profile_image?: string
  fee_proposal?: number
  status: 'scouting' | 'proposal_sent' | 'approved' | 'rejected' | 'in_production' | 'content_review' | 'published'
  notes?: string
  created_at: string
}

export interface AdAccount {
  id: string
  workspace_id: string
  platform: 'meta' | 'google' | 'tiktok'
  account_id: string
  account_name: string
  connected: boolean
  monthly_budget?: number
  created_at: string
}

export interface BillingRecord {
  id: string
  workspace_id: string
  month: string
  monthly_fee?: number
  ads_investment?: number
  ads_investment_approved?: number
  invoice_status: InvoiceStatus
  invoice_url?: string
  payment_date?: string
  notes?: string
  created_at: string
}
