export type TicketStatus = 'open' | 'closed' | 'pending' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketDto {
  id: string;
  number: number;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  requesterProfile?: Record<string, unknown> | null;
  subject: string;
  description: string;
  priority: TicketPriority;
  category?: string | null;
  status: TicketStatus;
  assignedOperatorId?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  firstActionAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface TicketNoteDto {
  id: string;
  ticketId: string;
  operatorId: string;
  body: string;
  kind: "internal" | "client";
  createdAt: string;
}

export interface OperatorDto {
  id: string;
  hostUserId: string;
  displayName?: string | null;
  status: "online" | "offline";
  active: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  requesterVisible: boolean;
  sortOrder: number;
  archivedAt?: string | null;
  createdAt: string;
}

export interface WidgetCategoryDto {
  name: string;
}

export interface MetricsDto {
  opened: number;
  resolved: number;
  closed: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  avgFirstActionSec: number | null;
  avgResolutionSec: number | null;
  byOperator: {
    operatorId: string;
    displayName: string | null;
    handled: number;
    avgFirstActionSec: number | null;
  }[];
}

export interface MeDto {
  operatorId: string;
  hostUserId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  position: string | null;
  lastLoginAt: string | null;
}

export type View = "tickets" | "overview" | "settings" | "account";

export interface SidebarProps {
  open: boolean;
  view: View;
  operatorName: string;
  onClose: () => void;
  onNavigate: (v: View) => void;
  /** Provided by the host once it has authentication; hides the item when absent. */
  onSignOut?: () => void;
}
