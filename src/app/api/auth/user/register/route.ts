import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkId, email, firstName, lastName } = body;

    if (!clerkId || !email) {
      return NextResponse.json(
        { success: false, message: 'Clerk ID and email are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      return NextResponse.json(
        { success: true, message: 'User already registered', user: existingUser },
        { status: 200 }
      );
    }

    // Create new user
    const newUser = await User.create({
      clerkId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'user',
    });

    return NextResponse.json(
      { success: true, message: 'User registered successfully', user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('User registration error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
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
