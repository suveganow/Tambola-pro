import dbConnect from "./db";
import User from "@/models/User";
import Admin from "@/models/Admin";

interface ClerkUser {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName?: string | null;
  lastName?: string | null;
}

export async function syncUser(user: ClerkUser) {
  await dbConnect();

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return;

  await User.findOneAndUpdate(
    { clerkId: user.id },
    {
      clerkId: user.id,
      email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    },
    { upsert: true, new: true }
  );
}

export async function syncAdmin(admin: ClerkUser) {
  await dbConnect();

  const email = admin.emailAddresses[0]?.emailAddress;
  if (!email) return;

  await Admin.findOneAndUpdate(
    { clerkId: admin.id },
    {
      clerkId: admin.id,
      email,
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      isVerified: true,
    },
    { upsert: true, new: true }
  );
}

