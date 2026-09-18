"use client";

import Link from "next/link";
import { ImageDown, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "./auth-provider";

export function Header() {
  const { user, loading, logOut } = useAuth();
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link href="/" className="brand" aria-label="Sizvo Compressor home">
          <span className="brand-mark"><ImageDown size={20} strokeWidth={2.4} /></span>
          <span>Sizvo</span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          {loading ? <span className="avatar-skeleton" aria-label="Checking sign-in" /> : user ? (
            <div className="user-menu">
              {user.photoURL ? <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              </> : <span>{user.displayName?.[0] ?? "U"}</span>}
              <button onClick={logOut} className="logout-button"><LogOut size={15} /><span>Sign out</span></button>
            </div>
          ) : <Link href="/login" className="button button-small button-secondary">Sign in</Link>}
        </div>
      </div>
    </header>
  );
}
