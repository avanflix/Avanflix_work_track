"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { TaskForm } from "@/components/forms/TaskForm";
import { ReactNode } from "react";

interface EditTaskModalProps {
    task: any;
    trigger?: ReactNode;
}

export function EditTaskModal({
    task,
    trigger,
}: EditTaskModalProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const formattedTask = {
        ...task,
        assignedTo: task.assignedTo?._id ?? task.assignedTo,
        startDate: task.startDate
            ? new Date(task.startDate).toISOString().split("T")[0]
            : "",
        deadline: task.deadline
            ? new Date(task.deadline).toISOString().split("T")[0]
            : "",
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm" variant="outline">
                        Update
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>

                <TaskForm
                    isEdit
                    initialValues={formattedTask}
                    onDone={() => {
                        setOpen(false);
                        router.refresh();
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}