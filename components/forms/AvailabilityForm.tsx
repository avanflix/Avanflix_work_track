"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Loader2 } from "lucide-react";

import { useUpdateAvailability } from "@/hooks/useEmployees";

type AvailabilityStatus =
    | "ACTIVE"
    | "ON_LEAVE"
    | "WFH"
    | "HALF_DAY"
    | "INACTIVE";

interface AvailabilityFormData {
    availabilityStatus: AvailabilityStatus;
    leaveFrom?: string;
    leaveTo?: string;
    leaveReason?: string;
}

export function AvailabilityForm({
    employee,
    onDone,
}: {
    employee: any;
    onDone: () => void;
}) {
    const updateAvailability = useUpdateAvailability();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
    } = useForm<AvailabilityFormData>({
        defaultValues: {
            availabilityStatus:
                employee.availabilityStatus ?? "ACTIVE",
            leaveFrom: employee.leaveFrom
                ? employee.leaveFrom.slice(0, 10)
                : "",
            leaveTo: employee.leaveTo
                ? employee.leaveTo.slice(0, 10)
                : "",
            leaveReason: employee.leaveReason ?? "",
        },
    });

    useEffect(() => {
        reset({
            availabilityStatus:
                employee.availabilityStatus ?? "ACTIVE",
            leaveFrom: employee.leaveFrom
                ? employee.leaveFrom.slice(0, 10)
                : "",
            leaveTo: employee.leaveTo
                ? employee.leaveTo.slice(0, 10)
                : "",
            leaveReason: employee.leaveReason ?? "",
        });
    }, [employee, reset]);

    const status = watch("availabilityStatus");

      async function onSubmit(values: AvailabilityFormData) {
        try {
          await updateAvailability.mutateAsync({
            userId: employee._id,
            ...values,
          });

          toast.success("Availability updated");

          onDone();
        } catch (err: any) {
          toast.error(
            err?.message ?? "Failed to update availability"
          );
        }
      }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
        >
            <div className="space-y-2">
                <Label>Availability</Label>

                <Select
                    value={status}
                    onValueChange={(value) =>
                        setValue(
                            "availabilityStatus",
                            value as AvailabilityStatus
                        )
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="ACTIVE">
                            Available
                        </SelectItem>

                        <SelectItem value="ON_LEAVE">
                            On Leave
                        </SelectItem>

                        <SelectItem value="WFH">
                            Work From Home
                        </SelectItem>

                        <SelectItem value="HALF_DAY">
                            Half Day
                        </SelectItem>

                        <SelectItem value="INACTIVE">
                            Inactive
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {status === "ON_LEAVE" && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Leave From</Label>

                            <Input
                                type="date"
                                {...register("leaveFrom")}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Leave To</Label>

                            <Input
                                type="date"
                                {...register("leaveTo")}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Reason</Label>

                        <Textarea
                            rows={4}
                            placeholder="Leave reason..."
                            {...register("leaveReason")}
                        />
                    </div>
                </>
            )}

            <Button
                className="w-full"
                disabled={updateAvailability.isPending}
            >
                {updateAvailability.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                Update Availability
            </Button>
        </form>
    );
}