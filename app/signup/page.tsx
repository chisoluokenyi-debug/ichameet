"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(params.get("message") === "verification-failed" ? "Email verification could not be completed. Please try again." : "");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        if (!adult) throw new Error("You must confirm that you are 18 or older to join IchaMeet.");
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
          },
        });
        if (authError) throw authError;
        if (data.session) router.push("/account");
        else setNotice("Your account request was received. Check your email and open the verification link to activate your account.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.push("/account");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <div className="auth-card">
      <Link className="brand auth-brand" href="/">icha<span>meet</span></Link>
      <span className="eyebrow">A world of possibilities</span>
      <h1>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-intro">{mode === "signup" ? "Join IchaMeet and start building meaningful connections." : "Log in to continue to IchaMeet."}</p>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <form onSubmit={submit}>
        {mode === "signup" && <><label htmlFor="display-name">Your name</label><input id="display-name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={60} required placeholder="Your name"/></>}
        <label htmlFor="email">Email address</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/>
        <label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required placeholder="At least 8 characters"/>
        {mode === "signup" && <label className="adult-check"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/><span>I confirm that I am 18 years old or older.</span></label>}
        <button className="btn btn-primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}</button>
      </form>
      <p className="auth-switch">{mode === "signup" ? "Already have an account?" : "New to IchaMeet?"} <button onClick={()=>{setMode(mode === "signup" ? "login" : "signup");setError("");setNotice("");}}>{mode === "signup" ? "Log in" : "Create an account"}</button></p>
      <p className="auth-terms">By continuing, you agree to use IchaMeet respectfully and follow its community guidelines. Adults 18+ only.</p>
      <Link className="auth-home" href="/">← Back to home</Link>
    </div>
  </main>;
}
