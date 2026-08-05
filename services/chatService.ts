import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import type { UserRole } from "@/types";

const GLOBAL_GROUP_NAME = "Company Group";

export const chatService = {
  /**
   * Fetches the single company-wide group conversation, creating it if it
   * doesn't exist yet, and keeps its participant list in sync with every
   * currently-active user (new hires are added automatically the next time
   * anyone touches the group; nobody needs to "invite" them).
   */
  async ensureGlobalGroup() {
    await connectDB();

    const activeUserIds = (await User.find({ isActive: true }, { _id: 1 }).lean()).map(
      (u: any) => u._id
    );

    let group = await Conversation.findOne({ isGlobal: true });

    if (!group) {
      group = await Conversation.create({
        type: "GROUP",
        isGlobal: true,
        name: GLOBAL_GROUP_NAME,
        participants: activeUserIds,
      });
      return group;
    }

    const existing = new Set(group.participants.map((p: any) => p.toString()));
    const missing = activeUserIds.filter((id: any) => !existing.has(id.toString()));

    if (missing.length > 0) {
      group.participants.push(...missing);
      await group.save();
    }

    return group;
  },

  /** All active users except the given one — the "who can I message" list. */
  async listContacts(excludeUserId: string) {
    await connectDB();
    return User.find({ isActive: true, _id: { $ne: excludeUserId } }, "name role department isActive")
      .sort({ name: 1 })
      .lean();
  },

  /** Finds (or creates) the 1:1 conversation between two users. */
  async getOrCreateDirectConversation(userId: string, otherUserId: string) {
    await connectDB();

    if (userId === otherUserId) {
      throw new Error("Cannot start a conversation with yourself");
    }

    const other = await User.findById(otherUserId).lean();
    if (!other || !(other as any).isActive) {
      throw new Error("That user is not available to message");
    }

    let convo = await Conversation.findOne({
      type: "DIRECT",
      participants: { $all: [userId, otherUserId], $size: 2 },
    });

    if (!convo) {
      convo = await Conversation.create({
        type: "DIRECT",
        participants: [userId, otherUserId],
        createdBy: userId,
      });
    }

    return convo;
  },

  /** Conversations the given user is a participant of (their own inbox). */
  async listConversationsForUser(userId: string) {
    await connectDB();
    await this.ensureGlobalGroup();

    return Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();
  },

  async getConversationById(conversationId: string) {
    await connectDB();
    return Conversation.findById(conversationId).lean();
  },

  async isParticipant(conversationId: string, userId: string) {
    await connectDB();
    const convo = await Conversation.findOne({ _id: conversationId, participants: userId }, { _id: 1 }).lean();
    return !!convo;
  },

  /**
   * Whether `viewerRole` is allowed to *monitor* (read-only) the given
   * conversation, per the oversight rules described in utils/permissions.ts.
   */
  async canMonitorConversation(conversationId: string, viewerRole: UserRole | undefined) {
    await connectDB();
    if (viewerRole === "SUPER_ADMIN") return true;
    if (viewerRole !== "ADMIN") return false;

    const convo = await Conversation.findById(conversationId, { participants: 1, isGlobal: 1 }).lean();
    if (!convo) return false;
    if ((convo as any).isGlobal) return true;

    const employeeCount = await User.countDocuments({
      _id: { $in: (convo as any).participants },
      role: "EMPLOYEE",
    });
    return employeeCount > 0;
  },

  /**
   * All conversations a SUPER_ADMIN or ADMIN is allowed to observe, for the
   * "Team Chats" monitoring view. This includes conversations the viewer is
   * NOT personally a participant of.
   */
  async listMonitorConversations(viewerRole: UserRole) {
    await connectDB();
    await this.ensureGlobalGroup();

    if (viewerRole === "SUPER_ADMIN") {
      return Conversation.find({}).sort({ lastMessageAt: -1, updatedAt: -1 }).lean();
    }

    // ADMIN: every conversation with at least one EMPLOYEE participant,
    // plus the global group.
    const employeeIds = (await User.find({ role: "EMPLOYEE" }, { _id: 1 }).lean()).map(
      (u: any) => u._id
    );

    return Conversation.find({
      $or: [{ participants: { $in: employeeIds } }, { isGlobal: true }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();
  },

  async listMessages(conversationId: string, opts: { before?: string; limit?: number } = {}) {
    await connectDB();
    const { before, limit = 50 } = opts;

    const filter: Record<string, unknown> = { conversation: conversationId };
    if (before) filter.createdAt = { $lt: new Date(before) };

    const items = await Message.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    return items.reverse();
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
    await connectDB();

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content: trimmed,
      readBy: [senderId],
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageText: trimmed.slice(0, 200),
      lastMessageAt: message.createdAt,
      lastMessageBy: senderId,
    });

    return message;
  },

  async markConversationRead(conversationId: string, userId: string) {
    await connectDB();
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
  },

  async unreadCountForConversation(conversationId: string, userId: string) {
    await connectDB();
    return Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    });
  },

  /** Unread counts for a batch of conversations, in one query. */
  async unreadCountsForUser(conversationIds: string[], userId: string) {
    await connectDB();
    const rows = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversationIds.map((id) => new mongoose.Types.ObjectId(id)) },
          sender: { $ne: new mongoose.Types.ObjectId(userId) },
          readBy: { $ne: new mongoose.Types.ObjectId(userId) },
        },
      },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);
    const map: Record<string, number> = {};
    for (const row of rows) map[row._id.toString()] = row.count;
    return map;
  },
};
