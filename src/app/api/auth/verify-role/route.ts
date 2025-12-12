import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, role: null, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Check if user is an admin
    const admin = await Admin.findOne({ clerkId: userId });

    if (admin) {
      return NextResponse.json({
        success: true,
        role: admin.role || 'admin',
        user: {
          id: admin._id,
          clerkId: admin.clerkId,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
        }
      });
    }

    // Check if user exists in User model
    const user = await User.findOne({ clerkId: userId });

    if (user) {
      return NextResponse.json({
        success: true,
        role: user.role || 'user',
        user: {
          id: user._id,
          clerkId: user.clerkId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    }

    // Not found in either - return user role (default)
    return NextResponse.json({
      success: true,
      role: 'user',
      user: null,
    });

  } catch (error: any) {
    console.error('Verify role error:', error);
    return NextResponse.json(
      { success: false, role: null, error: error.message },
      { status: 500 }
    );
  }
}

