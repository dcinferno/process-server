import bcrypt from "bcryptjs";

export async function hashPassword(password) {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
}

export async function verifyPassword(password, hashedPassword) {
  const isValid = await bcrypt.compare(password, hashedPassword);
  return isValid;
}
