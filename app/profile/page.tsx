"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  display_name: string;
  bio: string;
  country: string;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({
    display_name: "", bio: "", country: "", avatar_url: null,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (authError || !data.user) {
        router.replace("/signup");
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");
      const { data: row, error: profileError } = await supabase
        .from("profiles")
        .select("display_name,bio,country,avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError) setError(profileError.message);
      if (row) setProfile({
        display_name: row.display_name ?? "",
        bio: row.bio ?? "",
        country: row.country ?? "",
        avatar_url: row.avatar_url ?? null,
      });
      else if (data.user.user_metadata?.display_name) {
        setProfile(p => ({ ...p, display_name: data.user.user_metadata.display_name }));
      }
      setLoading(false);
    });
  }, [router]);

  function update(field: keyof Profile, value: string) {
    setProfile(p => ({ ...p, [field]: value }));
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError("");
    if (file && !file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      event.target.value = "";
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setPhoto(file);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    const supabase = createClient();
    let avatarUrl = profile.avatar_url;
    if (photo) {
      const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = userId + "/avatar-" + Date.now() + "." + extension;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos").upload(path, photo, { upsert: true, contentType: photo.type });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }
    const { error: saveError } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: profile.display_name.trim(),
      bio: profile.bio.trim(),
      country: profile.country.trim(),
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });
    if (saveError) setError(saveError.message);
    else {
      setProfile(p => ({ ...p, avatar_url: avatarUrl }));
      setPhoto(null);
      setMessage("Your profile has been saved.");
    }
    setSaving(false);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (loading) return <main className="auth-page"><div className="auth-card">Loading your profile…</div></main>;

  return <main className="auth-page">
    <section className="auth-card profile-card">
      <Link className="brand auth-brand" href="/">icha<span>meet</span></Link>
      <span className="eyebrow">Your member profile</span>
      <h1>Set up your profile</h1>
      <p className="auth-intro">Add a few details so other IchaMeet members can get to know you.</p>
      <p className="profile-email">Signed in as {email}</p>
      <form onSubmit={save}>
        <label htmlFor="profile-photo">Profile photo</label>
        <div className="profile-photo-row">
          {photo ? <img className="profile-photo" src={URL.createObjectURL(photo)} alt="Selected profile" /> :
            profile.avatar_url ? <img className="profile-photo" src={profile.avatar_url} alt="Your profile" /> :
            <div className="profile-photo profile-photo-empty">Photo</div>}
          <input id="profile-photo" type="file" accept="image/*" onChange={choosePhoto} />
        </div>
        <label htmlFor="display-name">Display name</label>
        <input id="display-name" value={profile.display_name} onChange={e => update("display_name", e.target.value)} maxLength={60} required placeholder="What should people call you?" />
        <label htmlFor="country">Country</label>
        <input id="country" value={profile.country} onChange={e => update("country", e.target.value)} maxLength={80} placeholder="Your country" />
        <label htmlFor="bio">About me</label>
        <textarea id="bio" className="profile-bio" value={profile.bio} onChange={e => update("bio", e.target.value)} maxLength={500} rows={5} placeholder="Tell people a little about yourself…" />
        <p className="profile-count">{profile.bio.length}/500 characters</p>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-notice" role="status">{message}</p>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
      </form>
      <div className="profile-links">
        <Link href="/">Back to IchaMeet</Link>
        <button type="button" className="text-action" onClick={logout}>Log out</button>
      </div>
    </section>
  </main>;
}
