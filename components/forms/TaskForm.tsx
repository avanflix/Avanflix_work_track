"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TaskFormProps {
  onDone: () => void;
  initialValues?: Partial<CreateTaskInput> & {
    _id?: string;
  };
  isEdit?: boolean;
}

export function TaskForm({
  onDone,
  initialValues,
  isEdit = false,
}: TaskFormProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  // Both Admin and Super Admin can assign work
  const assignableRoles = "ADMIN,EMPLOYEE";

  const createTask = useCreateTask();
  const updateTask = useUpdateTask(initialValues?._id ?? "");
  const { data: employees } = useEmployees({
    role: assignableRoles,
    isActive: "true",
    availabilityStatus: "ACTIVE",
  });

  const admins =
    employees?.items?.filter((emp: any) => emp.role === "ADMIN") ?? [];

  const nonAdmins =
    employees?.items?.filter((emp: any) => emp.role !== "ADMIN") ?? [];

  // Get unique departments
  const departments = Array.from(
    new Set(
      (employees?.items ?? [])
        .map((emp: any) => emp.department)
        .filter(Boolean)
    )
  ).sort();

  const formatDate = (date: string | Date) => {
    const d = new Date(date);

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      assignedTo: initialValues?.assignedTo ?? "",
      department: initialValues?.department ?? "",
      priority: initialValues?.priority ?? "MEDIUM",
      estimatedHours: initialValues?.estimatedHours,
      startDate: initialValues?.startDate
        ? formatDate(initialValues.startDate)
        : "",

      deadline: initialValues?.deadline
        ? formatDate(initialValues.deadline)
        : "",
    },
  });

  async function onSubmit(values: CreateTaskInput) {
    try {
      if (isEdit) {
        await updateTask.mutateAsync(values);
        toast.success("Task updated successfully");
      } else {
        await createTask.mutateAsync(values);
        toast.success("Task assigned successfully");
      }

      onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Task Title */}
      <div className="space-y-2">
        <Label>Task title</Label>
        <Input
          {...register("title")}
          placeholder="Design the onboarding flow"
        />
        {errors.title && (
          <p className="text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          placeholder="What needs to be done?"
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Assign To + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Assign to</Label>

          <Select
            value={watch("assignedTo") || ""}
            onValueChange={(employeeId) => {
              setValue("assignedTo", employeeId);

              const employee = employees?.items?.find(
                (emp: any) => emp._id === employeeId
              );

              if (employee?.department) {
                setValue("department", employee.department);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>

            <SelectContent>
              {admins.length > 0 && (
                <>
                  <div className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                    Admins
                  </div>

                  {admins.map((emp: any) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.name} — {emp.department}
                    </SelectItem>
                  ))}
                </>
              )}

              {nonAdmins.length > 0 && (
                <>
                  <div className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                    Employees
                  </div>

                  {nonAdmins.map((emp: any) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.name} — {emp.department}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          {errors.assignedTo && (
            <p className="text-xs text-destructive">
              {errors.assignedTo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>

          <Select
            value={watch("priority") || "MEDIUM"}
            onValueChange={(value) =>
              setValue("priority", value as "LOW" | "MEDIUM" | "HIGH")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Department + Estimated Hours */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Department</Label>

          <Select
            value={watch("department") || ""}
            onValueChange={(value) => setValue("department", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>

            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.department && (
            <p className="text-xs text-destructive">
              {errors.department.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Estimated Time</Label>
            <Input
              type="number"
              min="1"
              {...register("estimatedHours")}
              placeholder="30"
            />
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              defaultValue="MINUTES"
              onValueChange={(value) => {
                const currentValue = watch("estimatedHours");

                if (currentValue) {
                  if (value === "HOURS") {
                    // Convert minutes to hours
                    setValue(
                      "estimatedHours",
                      (Number(currentValue) / 60).toString() as any
                    );
                  } else {
                    // Convert hours to minutes
                    setValue(
                      "estimatedHours",
                      (Number(currentValue) * 60).toString() as any
                    );
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="MINUTES">Minutes</SelectItem>
                <SelectItem value="HOURS">Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-xs text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Deadline</Label>
          <Input type="date" {...register("deadline")} />
          {errors.deadline && (
            <p className="text-xs text-destructive">
              {errors.deadline.message}
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={
          createTask.isPending ||
          updateTask.isPending
        }
      >
        {(createTask.isPending ||
          updateTask.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
        {isEdit ? "Update Task" : "Assign Task"}
      </Button>
    </form>
  );
}