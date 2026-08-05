import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import type { INotification } from "@/types";

export const notificationService = {
  async create(input: {
    recipient: string;
    title: string;
    message: string;
    type: INotification["type"];
    relatedTask?: string;
  }) {
    await connectDB();
    return Notification.create(input);
  },

  async listForUser(userId: string, unreadOnly = false) {
    await connectDB();
    const filter: Record<string, unknown> = { recipient: userId };
    if (unreadOnly) filter.isRead = false;
    return Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean();
  },

  async markRead(id: string, userId: string) {
    await connectDB();
    return Notification.findOneAndUpdate({ _id: id, recipient: userId }, { isRead: true }, { new: true }).lean();
  },

  async markAllRead(userId: string) {
    await connectDB();
    return Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  },
};
