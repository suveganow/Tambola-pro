"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useRoleProtection } from "@/hooks/useRoleProtection";

export default function SettingsPage() {
  const { isAuthorized, isLoading: roleLoading } = useRoleProtection({
    allowedRole: "admin",
    redirectTo: "/dashboard",
  });

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [updating, setUpdating] = useState(false);

  if (roleLoading || !isAuthorized || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          Manage your account and platform settings
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <User className="h-5 w-5 mr-2 text-purple-500" />
            Profile Information
          </CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  <User className="h-10 w-10 text-purple-500" />
                </div>
              )}
              <Badge className="absolute -bottom-1 -right-1 bg-green-500">
                <Check className="h-3 w-3" />
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.firstName} {user?.lastName || "Admin"}
              </h3>
              <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
              <Badge className="mt-2 bg-purple-100 text-purple-800">
                <Shield className="h-3 w-3 mr-1" />
                Administrator
              </Badge>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                defaultValue={user?.firstName || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                defaultValue={user?.lastName || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                defaultValue={user?.primaryEmailAddress?.emailAddress || ""}
                disabled
                className="bg-gray-50 flex-1"
              />
              <Badge className="self-center bg-green-100 text-green-800">Verified</Badge>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Profile information is managed through your authentication provider (Clerk).
          </p>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <SettingsIcon className="h-5 w-5 mr-2 text-blue-500" />
            Platform Settings
          </CardTitle>
          <CardDescription>Configure Tambola game settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Default Ticket Price (₹)</Label>
              <Input
                id="defaultPrice"
                type="number"
                defaultValue="50"
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultTickets">Default Total Tickets</Label>
              <Input
                id="defaultTickets"
                type="number"
                defaultValue="100"
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="drawInterval">Draw Interval (seconds)</Label>
              <Input
                id="drawInterval"
                type="number"
                defaultValue="5"
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claimTimeout">Claim Timeout (seconds)</Label>
              <Input
                id="claimTimeout"
                type="number"
                defaultValue="60"
                placeholder="60"
              />
            </div>
          </div>

          <Button
            onClick={() => toast.success("Settings saved!")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Mail className="h-5 w-5 mr-2 text-green-500" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Account ID</p>
                <p className="text-sm text-gray-500 font-mono">{user?.id}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Created At</p>
                <p className="text-sm text-gray-500">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Last Sign In</p>
                <p className="text-sm text-gray-500">
                  {user?.lastSignInAt
                    ? new Date(user.lastSignInAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg text-red-600">
            <LogOut className="h-5 w-5 mr-2" />
            Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">Sign Out</p>
              <p className="text-sm text-gray-500">
                End your current session and return to the login page.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full sm:w-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
