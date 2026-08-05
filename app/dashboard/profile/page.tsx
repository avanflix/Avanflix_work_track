"use client";

import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  if (!user) return null;

  const initials = (user.name ?? "U")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge className="mt-2" variant="secondary">{user.role?.replace("_", " ")}</Badge>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-border py-2">
            <span className="text-muted-foreground">Status</span>
            <span>Active</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Role</span>
            <span>{user.role?.replace("_", " ")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
