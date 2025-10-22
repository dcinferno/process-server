import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String, // store hashed password here
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
