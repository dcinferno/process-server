import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String, // store hashed password here
  role: {
    type: String,
    enum: ["admin", "process-server"],
    default: "process-server", // default role for new users
    required: true,
  },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
