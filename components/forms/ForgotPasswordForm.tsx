"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormInput,
} from "@/lib/validations";
import {
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type VerifyOtpInput,
  type ResetPasswordInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "otp" | "reset" | "done";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // --- Step 1: request an OTP -------------------------------------------------
  const emailForm = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function requestOtp(values: ForgotPasswordInput) {
    setSendingOtp(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        return;
      }

      toast.success(data.message || "Verification code sent.");
      setEmail(values.email);
      setStep("otp");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setSendingOtp(false);
    }
  }
  // --- Step 2: verify the OTP --------------------------------------------------
  const otpForm = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function verifyOtp(values: VerifyOtpInput) {
    console.log("verifyOtp called", values);

    setVerifyingOtp(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: values.otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid code.");
        return;
      }

      if (!data.resetToken) {
        toast.error("Verification failed.");
        return;
      }

      setResetToken(data.resetToken);
      toast.success("OTP verified successfully.");
      setStep("reset");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  // --- Step 3: set a new password ----------------------------------------------
  const resetForm = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
    },
  });
  const [showPassword, setShowPassword] = useState(false);

  async function resetPassword(values: ResetPasswordFormInput) {
    setResettingPassword(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          resetToken,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Could not reset password.");
        return;
      }

      toast.success("Password updated successfully.");

      setStep("done");

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    } finally {
      setResettingPassword(false);
    }
  }
  if (step === "email") {
    return (
      <form onSubmit={emailForm.handleSubmit(requestOtp)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Company email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...emailForm.register("email")} />
          {emailForm.formState.errors.email && (
            <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={sendingOtp}
        >
          {sendingOtp && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {sendingOtp ? "Sending..." : "Send verification code"}
        </Button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={otpForm.handleSubmit(
        verifyOtp,
        (errors) => {
          console.log(errors);
          alert("Validation Failed");
        }
      )} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires in 10
          minutes.
        </p>
        <div className="space-y-2">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            className="text-center text-lg tracking-[0.5em]"
            {...otpForm.register("otp")}
          />
          {otpForm.formState.errors.otp && (
            <p className="text-xs text-destructive">{otpForm.formState.errors.otp.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={verifyingOtp}
        >
          {verifyingOtp && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {verifyingOtp ? "Verifying..." : "Verify code"}
        </Button>
        <button
          type="button"
          onClick={() => setStep("email")}
          className="w-full text-center text-xs font-medium text-primary hover:underline"
        >
          Use a different email
        </button>
      </form>
    );
  }

  if (step === "reset") {
    return (
      <form onSubmit={resetForm.handleSubmit(
        resetPassword,
        (errors) => {
          console.log("Reset validation errors:", errors);
        }
      )}
        className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pr-10"
              {...resetForm.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              tabIndex={-1}
              className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {resetForm.formState.errors.password && (
            <p className="text-xs text-destructive">{resetForm.formState.errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={resettingPassword}
        >
          {resettingPassword && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {resettingPassword ? "Updating..." : "Reset password"}
        </Button>
      </form>
    );
  }

  return <p className="text-center text-sm text-muted-foreground">Redirecting you to sign in…</p>;
}
