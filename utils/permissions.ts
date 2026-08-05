import type { UserRole } from "@/types";

/**
 * Work-log visibility rules (kept separate from the flat PERMISSIONS matrix
 * below because this is scoped by *role hierarchy*, not a simple allow-list):
 *
 *  - EMPLOYEE    -> can only ever see/edit their OWN work logs.
 *  - ADMIN       -> can see their OWN work logs + every EMPLOYEE's work logs.
 *                   Cannot see another ADMIN's (or the SUPER_ADMIN's) logs.
 *  - SUPER_ADMIN -> can see EVERYONE's work logs (all ADMINs + all
 *                   EMPLOYEEs) as well as their own.
 *
 * `getWorkLogVisibleRoles` returns which *other users' roles* the given
 * role is allowed to look at (in addition to always being able to see
 * their own record, which callers add separately).
 */
export function getWorkLogVisibleRoles(role: UserRole | undefined): UserRole[] {
  switch (role) {
    case "SUPER_ADMIN":
      return ["ADMIN", "EMPLOYEE"];
    case "ADMIN":
      return ["EMPLOYEE"];
    default:
      return [];
  }
}

export function canViewWorkLogOf(
  viewerRole: UserRole | undefined,
  viewerId: string,
  targetUserId: string,
  targetUserRole: UserRole
): boolean {
  if (!viewerRole) return false;
  if (viewerId === targetUserId) return true;
  return getWorkLogVisibleRoles(viewerRole).includes(targetUserRole);
}


/**
 * Centralized RBAC matrix. Extend this, not scattered `if (role === ...)`
 * checks, when new modules (attendance, payroll, CRM, ...) are plugged in.
 */
export const PERMISSIONS = {
  ADD_ADMIN: ["SUPER_ADMIN"],
  DELETE_ADMIN: ["SUPER_ADMIN"],
  ADD_EMPLOYEE: ["SUPER_ADMIN"],
  DELETE_EMPLOYEE: ["SUPER_ADMIN"],
  ACTIVATE_USER: ["SUPER_ADMIN"],
  DEACTIVATE_USER: ["SUPER_ADMIN"],
  CHANGE_ROLE: ["SUPER_ADMIN"],

  ASSIGN_TASK: ["SUPER_ADMIN", "ADMIN"],
  // Admins may hand tasks to fellow admins as well as employees; Super Admin can assign to anyone.
  ASSIGN_TO_ADMIN: ["SUPER_ADMIN", "ADMIN"],
  DELETE_TASK: ["SUPER_ADMIN", "ADMIN"],
  VIEW_ALL_EMPLOYEES: ["SUPER_ADMIN", "ADMIN"],
  VIEW_REPORTS: ["SUPER_ADMIN", "ADMIN"],
  // Fine-grained scope for *which* roles' work logs can be seen is handled
  // by getWorkLogVisibleRoles() below (Admin != Super Admin scope).
  VIEW_TEAM_WORK_LOGS: ["SUPER_ADMIN", "ADMIN"],
  REVIEW_DELAY: ["SUPER_ADMIN", "ADMIN"],

  UPDATE_OWN_TASK: ["EMPLOYEE", "ADMIN"],
  SUBMIT_DELAY: ["EMPLOYEE", "ADMIN"],

  // Transfer workflow (Features 10-14)
  REQUEST_TRANSFER: ["EMPLOYEE", "ADMIN"],
  APPROVE_EMPLOYEE_TRANSFER: ["ADMIN", "SUPER_ADMIN"],
  APPROVE_ADMIN_TRANSFER: ["SUPER_ADMIN"],
  TRANSFER_ANY_TASK: ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export function isAdminLike(role: UserRole | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

/**
 * Messaging rules:
 *  - Any active user (EMPLOYEE, ADMIN, SUPER_ADMIN) can open a 1:1 chat with
 *    any other active user, regardless of role ("among themselves").
 *  - Every active user is automatically a member of the single company-wide
 *    group conversation.
 *  - Oversight (read-only) is layered on top of that:
 *      SUPER_ADMIN -> can view every conversation in the system (all
 *                      EMPLOYEE and ADMIN chats, plus the group).
 *      ADMIN       -> can view every conversation that has at least one
 *                      EMPLOYEE participant (i.e. "all employee chats"),
 *                      plus the group. Cannot view a chat that is strictly
 *                      between two other ADMINs (or an ADMIN and the
 *                      SUPER_ADMIN) with no EMPLOYEE in it.
 *      EMPLOYEE    -> no oversight, only their own conversations.
 */
export function canMonitorChats(role: UserRole | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function canMonitorAllChats(role: UserRole | undefined): boolean {
  return role === "SUPER_ADMIN";
}
