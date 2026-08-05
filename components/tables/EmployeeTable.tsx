"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetUserActive, useDeleteUser } from "@/hooks/useEmployees";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Trash2, UserCheck, UserX } from "lucide-react";

export function EmployeeTable({
  users,
  loading,
  canManage,
  onUpdateAvailability,
}: {
  users: any[];
  loading?: boolean;
  canManage: boolean;
  onUpdateAvailability: (user: any) => void;
}) {
  const setActive = useSetUserActive();
  const deleteUser = useDeleteUser();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No employees found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Availability</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u._id}>
            <TableCell className="font-medium">
              {u.name}
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </TableCell>
            <TableCell>{u.department ?? "—"}</TableCell>
            <TableCell>{u.designation ?? "—"}</TableCell>
            <TableCell>
              <Badge variant="secondary">{u.role.replace("_", " ")}</Badge>
            </TableCell>
            <TableCell>{u.joiningDate ? formatDate(u.joiningDate) : "—"}</TableCell>
            <TableCell>
              <Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Active" : "Inactive"}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  u.availabilityStatus === "ACTIVE"
                    ? "success"
                    : u.availabilityStatus === "ON_LEAVE"
                      ? "secondary"
                      : "destructive"
                }
              >
                {u.availabilityStatus?.replace("_", " ") ?? "ACTIVE"}
              </Badge>

              {u.availabilityStatus === "ON_LEAVE" && u.leaveTo && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Until {formatDate(u.leaveTo)}
                </div>
              )}
            </TableCell>
            {canManage && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title={u.isActive ? "Deactivate" : "Activate"}
                    onClick={() =>
                      toast.promise(setActive.mutateAsync({ id: u._id, isActive: !u.isActive }), {
                        loading: "Updating...",
                        success: `User ${u.isActive ? "deactivated" : "activated"}`,
                        error: "Failed to update user",
                      })
                    }
                  >
                    {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateAvailability(u)}
                  >
                    Availability
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={() => {
                      if (confirm(`Delete ${u.name}? This cannot be undone.`)) {
                        toast.promise(deleteUser.mutateAsync(u._id), {
                          loading: "Deleting...",
                          success: "User deleted",
                          error: "Failed to delete user",
                        });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
