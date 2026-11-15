"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type UserInfo = { email?: string; user_metadata?: { display_name?: string } };

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);\n  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) router.replace("/signup");
      else setUser(data.user as UserInfo);
      setLoading(false);
    });
  }, [router]);
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }
  if (loading) return <main className="auth-page"><div className="auth-card">Loading your account…</div></main>;
  if (!user) return <main className="auth-page"><div className="auth-card">Taking you to login…</div></main>;
  return <main className="auth-page"><div className="auth-card">
    <Link className="brand auth-brand" href="/">icha<span>meet</span></Link>
    <span className="eyebrow">Your IchaMeet account</span>
    <h1>Welcome{user.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}!</h1>
    <p className="auth-intro">You are signed in as {user.email}.</p>
    <p className="auth-notice">Your account is active. Complete your profile and explore the IchaMeet community.</p>
    <div className="account-actions">
      <Link className="btn btn-primary" href="/profile">Set up my profile</Link>
      <Link className="btn btn-light" href="/groups">Explore groups</Link>
      <Link className="btn btn-light" href="/chat">Open messages</Link>\n      <Link className="btn btn-light" href="/notifications">Notifications</Link>\n      {isAdmin && <Link className="btn btn-light" href="/admin">Admin dashboard</Link>}
      <Link className="auth-home" href="/">← Back to home</Link>
    </div>
    <button className="btn btn-light auth-submit" onClick={logout}>Log out</button>
  </div></main>;
}
