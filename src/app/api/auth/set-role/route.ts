import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { role, autoGrant } = body;

    if (role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Auto-grant admin access when accessing through /admin page
    if (autoGrant) {
      await dbConnect();

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ clerkId: userId });

      if (existingAdmin) {
        return NextResponse.json({
          success: true,
          message: 'Already an admin',
          admin: existingAdmin,
        });
      }

      // Create new admin
      const newAdmin = await Admin.create({
        clerkId: userId,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        isVerified: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Admin access granted',
        admin: newAdmin,
      });
    }

    // If not auto-grant, reject (we no longer require secret key)
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Set role error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({
        success: true,
        message: 'Already an admin',
      });
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
