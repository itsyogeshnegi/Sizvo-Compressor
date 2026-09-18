"use client";

import { LogIn, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { user, loading, configured, error, signIn, logOut } = useAuth();
  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-icon"><UserRound size={27} /></div>
        <h1>{user ? "You're signed in" : "Welcome to Sizvo"}</h1>
        <p>{user ? "Your identity is connected. Compression stays just as private and easy." : "Sign in is optional. You can always compress images without an account."}</p>
        {loading ? <button className="google-button" disabled>Checking your account…</button> : user ? (
          <div className="signed-in-panel"><strong>{user.displayName ?? "Sizvo user"}</strong><span>{user.email}</span><button className="button button-secondary" onClick={logOut}>Sign out</button></div>
        ) : <button className="google-button" onClick={signIn} disabled={!configured}><span className="google-g">G</span>{configured ? "Continue with Google" : "Google sign-in not configured"}</button>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <p className="auth-note"><LogIn size={12} /> No uploads, history, or compression data are stored in your account.</p>
      </div>
    </section>
  );
}
