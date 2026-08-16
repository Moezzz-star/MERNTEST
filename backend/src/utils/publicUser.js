export function publicUser(user) {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    age: user.age ?? null,
    role: user.role || "user",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}