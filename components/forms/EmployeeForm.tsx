"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createEmployeeSchema, type CreateEmployeeInput } from "@/lib/validations";
import { useCreateEmployee } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function EmployeeForm({ onDone }: { onDone: () => void }) {
  const createEmployee = useCreateEmployee();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: { role: "EMPLOYEE" },
  });

  async function onSubmit(values: CreateEmployeeInput) {
    try {
      await createEmployee.mutateAsync(values);
      toast.success(`${values.role === "ADMIN" ? "Admin" : "Employee"} created`);
      onDone();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create user");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input {...register("name")} placeholder="Jane Doe" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Company email</Label>
          <Input type="email" {...register("email")} placeholder="jane@company.com" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Temporary password</Label>
          <Input type="password" {...register("password")} placeholder="Min. 8 characters" />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={watch("role")} onValueChange={(v) => setValue("role", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Department</Label>
          <Input {...register("department")} placeholder="Engineering" />
          {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Designation</Label>
          <Input {...register("designation")} placeholder="Software Engineer" />
          {errors.designation && <p className="text-xs text-destructive">{errors.designation.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Joining date</Label>
        <Input type="date" {...register("joiningDate")} />
        {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={createEmployee.isPending}>
        {createEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
