"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeTable } from "@/components/tables/EmployeeTable";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { AvailabilityForm } from "@/components/forms/AvailabilityForm";

import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Plus, Search } from "lucide-react";

export default function EmployeesPage() {
  const { data: session } = useSession();

  const role = (session?.user as any)?.role;

  const [search, setSearch] = useState("");

  // Create Employee Dialog
  const [open, setOpen] = useState(false);

  // Availability Dialog
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data, isLoading } = useEmployees({ search });

  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Employees
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage everyone on the team.
          </p>
        </div>

        {isSuperAdmin && (
          <Dialog
            open={open}
            onOpenChange={setOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add employee / admin
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Create account
                </DialogTitle>

                <DialogDescription>
                  Only Super Admin can create
                  Admin or Employee accounts.
                </DialogDescription>
              </DialogHeader>

              <EmployeeForm
                onDone={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-9"
              placeholder="Search by name, email, department..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
        </CardHeader>

        <CardContent>
          <EmployeeTable
            users={data?.items ?? []}
            loading={isLoading}
            canManage={
              session?.user?.role === "ADMIN" ||
              session?.user?.role === "SUPER_ADMIN"
            }
            onUpdateAvailability={(employee) => {
              setSelectedEmployee(employee);
              setAvailabilityOpen(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Availability Dialog */}

      <Dialog
        open={availabilityOpen}
        onOpenChange={setAvailabilityOpen}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Update Availability
            </DialogTitle>

            <DialogDescription>
              Update employee availability and
              leave details.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <AvailabilityForm
              employee={selectedEmployee}
              onDone={() => {
                setAvailabilityOpen(false);
                setSelectedEmployee(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}