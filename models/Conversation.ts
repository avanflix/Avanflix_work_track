import { Schema, model, models, Model } from "mongoose";
import type { IConversation } from "@/types";

const ConversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["DIRECT", "GROUP"],
      required: true,
      default: "DIRECT",
    },
    // Marks the single, auto-managed "company wide" group that every
    // active user is a member of. There should only ever be one of these.
    isGlobal: { type: Boolean, default: false },
    name: { type: String, trim: true }, // only used for GROUP conversations
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true, index: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    // Denormalized "last message" preview fields so the conversation list
    // can render without a join/lookup per row.
    lastMessageText: { type: String, default: "" },
    lastMessageAt: { type: Date },
    lastMessageBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1, updatedAt: -1 });
// Only one global group conversation should ever exist.
ConversationSchema.index(
  { isGlobal: 1 },
  { unique: true, partialFilterExpression: { isGlobal: true } }
);

const Conversation: Model<IConversation> =
  models.Conversation || model<IConversation>("Conversation", ConversationSchema);
export default Conversation;
