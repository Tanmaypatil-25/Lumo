import mongoose from "mongoose";
import User from "./User.js"

const messageSchema = new mongoose.Schema({
    senderId: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true},
    recieverId: {type: mongoose.Schema.Types.ObjectId, ref: User, required: true},
    text: {type: String},
    image: {type: String},
    seen: {type: Boolean, default: false}
},
{
    timestamps: true
});

// Conversation queries + pagination
messageSchema.index({
  senderId: 1,
  recieverId: 1,
  createdAt: -1
});


// Unread-message queries
messageSchema.index({
  recieverId: 1,
  seen: 1,
  senderId: 1
});

const Message = mongoose.model("Message", messageSchema);

export default Message;