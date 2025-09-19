export interface Newsletter {
  id: string;
  title: string;
  message: string;
  type: NewsletterType;
  priority: Priority;
  status: NewsletterStatus;
  startDate: string | null;
  endDate: string | null;
  scheduledFor: string | null;
  sentAt: string | null;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterStats {
  totalMembers: number;
  sentThisMonth: number;
  scheduled: number;
}

export interface CreateNewsletterRequest {
  type: NewsletterType;
  title: string;
  message: string;
  startDate?: string;
  endDate?: string;
  priority: Priority;
  scheduleFor: 'now' | 'later';
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
  newsletter?: Newsletter;
}

export interface NewslettersListResponse {
  newsletters: Newsletter[];
  stats: NewsletterStats;
}

export type NewsletterType = 'CLOSURE' | 'MAINTENANCE' | 'EVENT' | 'GENERAL';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type NewsletterStatus = 'DRAFT' | 'SENT' | 'SCHEDULED';

export const NEWSLETTER_TYPE_LABELS: Record<NewsletterType, string> = {
  CLOSURE: 'Zatvaranje teretane',
  MAINTENANCE: 'Održavanje',
  EVENT: 'Događaj',
  GENERAL: 'Opšte obaveštenje'
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Nizak',
  MEDIUM: 'Srednji',
  HIGH: 'Visok'
};

export const STATUS_LABELS: Record<NewsletterStatus, string> = {
  DRAFT: 'Nacrt',
  SENT: 'Poslato',
  SCHEDULED: 'Zakazano'
};