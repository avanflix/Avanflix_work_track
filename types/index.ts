export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type TaskStatus =
  | "PENDING"
  | "NOTICED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ISSUE"
  | "DELAYED"
  | "CANCELLED";

export interface IUser {
  _id: string;
  name: string;
  employeeId?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: string;
  designation?: string;
  joiningDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  availabilityStatus: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  availability:
  | "AVAILABLE"
  | "ON_LEAVE"
  | "WFH"
  | "HALF_DAY"
  | "INACTIVE";
  leaveFrom?: Date;
  leaveTo?: Date;
  leaveReason?: string;
}

export interface SafeUser {
  id: string;
  name: string;
  employeeId?: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
  joiningDate?: string;
  isActive: boolean;
  availabilityStatus: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
}

export interface ITaskTimelineEntry {
  timestamp: string;
  author: string;
  authorName: string;
  action: string;
  note?: string;
}

export interface IDelaySubmission {
  reason: string;
  expectedCompletionDate: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  department: string;
  assignedTo: string;
  createdBy: string;
  startDate: string;
  deadline: string;
  estimatedHours?: number;
  status: TaskStatus;
  completionPercent: number;
  remarks?: string;
  currentIssue?: string;
  timeSpentMinutes: number;
  delaySubmission?: IDelaySubmission;
  timeline: ITaskTimelineEntry[];
  estimatedCompletionDate?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITransferRequest {
  _id: string;
  task: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: UserRole;
  transferTo: string;
  transferToName: string;
  reason: string;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  previousAssignee: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: "TASK_ASSIGNED" | "DEADLINE_APPROACHING" | "TASK_COMPLETED" | "TASK_ISSUE" | "DELAY_SUBMITTED" | "DELAY_REVIEWED" | "GENERAL";
  relatedTask?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IDepartment {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export type ConversationType = "DIRECT" | "GROUP";

export interface IConversation {
  _id: string;
  type: ConversationType;
  isGlobal: boolean;
  name?: string;
  participants: string[];
  createdBy?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  conversation: string;
  sender: string;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface ChatContact {
  _id: string;
  name: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
}

export interface ConversationListItem extends IConversation {
  displayName: string;
  otherParticipant?: ChatContact;
  unreadCount: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  delayedTasks: number;
  issueTasks: number;
  upcomingDeadlines: number;
}
