import { Suspense } from "react";
import { LoginForm } from "@/components/forms/LoginForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
            W
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Avan Flix</h1>
          <p className="text-sm text-muted-foreground">Employee work tracking, done right.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Use your company email to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Only active accounts created by an administrator can sign in.
        </p>
      </div>
    </div>
  );
}
