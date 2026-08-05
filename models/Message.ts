import { Schema, model, models, Model } from "mongoose";
import type { IMessage } from "@/types";

const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    // Users who have read this message (used for unread counts / read receipts).
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

const Message: Model<IMessage> = models.Message || model<IMessage>("Message", MessageSchema);
export default Message;
