"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { IconShieldCheck, IconClipboardText } from "@tabler/icons-react";
import { toast } from "sonner";

export function LoginLanding({ error }: { error?: string }) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const errorParam = error || searchParams.get("error");
    if (errorParam === "AccessDenied") {
      toast.error("Access Denied", {
        description:
          "Your account is not authorized to access this portal. Please contact your administrator.",
        duration: 6000,
      });
    } else if (errorParam) {
      toast.error("Sign-in Failed", {
        description: "Something went wrong during sign-in. Please try again.",
        duration: 5000,
      });
    }
  }, [error, searchParams]);

  const handleGoogleLogin = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleIntakeForm = () => {
    router.push("/intake");
  };

  return (
    <div className="ncb-login-bg">
      {/* Grid overlay */}
      <div className="ncb-grid-overlay" />
      {/* Glow */}
      <div className="ncb-glow" />

      <div className="ncb-login-container">
        {/* Brand */}
        <div className="ncb-login-brand">
          <Image
            src="/logo.png"
            alt="Nashville ClearBra"
            width={280}
            height={72}
            className="mx-auto h-16 w-auto"
            priority
          />
          <p className="ncb-login-subtitle">
            Premium Paint Protection & Ceramic Coating
          </p>
        </div>

        {/* Two option cards */}
        <div className="ncb-login-options">
          {/* Team Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="ncb-option-card"
          >
            <div className="ncb-option-icon ncb-option-icon--team">
              <IconShieldCheck size={32} />
            </div>
            <h2 className="ncb-option-title">Team Login</h2>
            <p className="ncb-option-desc">
              Staff & admin dashboard access
            </p>
            <div className="ncb-option-action">
              {loading ? (
                <div className="ncb-spinner" />
              ) : (
                <>
                  <svg className="ncb-google-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </div>
          </button>

          {/* Intake Form */}
          <button
            onClick={handleIntakeForm}
            className="ncb-option-card"
          >
            <div className="ncb-option-icon ncb-option-icon--intake">
              <IconClipboardText size={32} />
            </div>
            <h2 className="ncb-option-title">Intake Form</h2>
            <p className="ncb-option-desc">
              New vehicle work order intake
            </p>
            <div className="ncb-option-action ncb-option-action--intake">
              Start Work Order →
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="ncb-login-footer">
          © {new Date().getFullYear()} Nashville ClearBra · Nashville, TN
        </p>
      </div>
    </div>
  );
}
