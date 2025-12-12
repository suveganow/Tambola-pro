import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkId, email, firstName, lastName, isVerified } = body;

    if (!clerkId || !email) {
      return NextResponse.json(
        { success: false, message: 'Clerk ID and email are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ clerkId });
    if (existingAdmin) {
      // Update verification status if needed
      if (isVerified && !existingAdmin.isVerified) {
        existingAdmin.isVerified = true;
        await existingAdmin.save();
      }
      return NextResponse.json(
        { success: true, message: 'Admin already registered', admin: existingAdmin },
        { status: 200 }
      );
    }

    // Create new admin
    const newAdmin = await Admin.create({
      clerkId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      isVerified: isVerified || false,
      role: 'admin',
    });

    return NextResponse.json(
      { success: true, message: 'Admin registered successfully', admin: newAdmin },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Admin registration error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Admin already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  );
}
