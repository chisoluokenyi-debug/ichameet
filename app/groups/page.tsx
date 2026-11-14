"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Comment = { id: string; author: string; text: string };
type Post = { id: string; author: string; text: string; comments: Comment[] };
type Group = { id: string; name: string; description: string; privacy: "Public" | "Private"; owner: string; ownerId: string; members: string[]; posts: Post[]; memberIds: string[] };

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"Public" | "Private">("Public");
  const [postText, setPostText] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [invite, setInvite] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadGroups = useCallback(async (uid: string) => {
    const supabase = createClient();
    const { data: groupRows, error: groupError } = await supabase.from("groups").select("id,name,description,is_private,created_by,created_at").order("created_at", { ascending: false });
    if (groupError) { setError(groupError.message); setLoading(false); return; }
    const ids = (groupRows ?? []).map((g: any) => g.id);
    if (!ids.length) { setGroups([]); setLoading(false); return; }
    const [memberResult, postResult, profileResult] = await Promise.all([
      supabase.from("group_members").select("group_id,user_id,role").in("group_id", ids),
      supabase.from("group_posts").select("id,group_id,author_id,content,created_at").in("group_id", ids).order("created_at", { ascending: true }),
      supabase.from("profiles").select("id,display_name")
    ]);
    if (memberResult.error || postResult.error || profileResult.error) {
      setError(memberResult.error?.message || postResult.error?.message || profileResult.error?.message || "Could not load group information.");
      setLoading(false); return;
    }
    const postRows = postResult.data ?? [];
    const postIds = postRows.map((p: any) => p.id);
    let commentRows: any[] = [];
    if (postIds.length) {
      const { data, error: commentError } = await supabase.from("group_comments").select("id,post_id,author_id,content,created_at").in("post_id", postIds).order("created_at", { ascending: true });
      if (commentError) { setError(commentError.message); setLoading(false); return; }
      commentRows = data ?? [];
    }
    const labels = new Map<string, string>((profileResult.data ?? []).map((p: any) => [p.id, p.display_name || "IchaMeet member"]));
    const members = memberResult.data ?? [];
    const nextGroups: Group[] = (groupRows ?? []).map((g: any) => {
      const groupMembers = members.filter((m: any) => m.group_id === g.id);
      const groupPosts = postRows.filter((p: any) => p.group_id === g.id).map((p: any) => ({
        id: p.id, author: labels.get(p.author_id) || "IchaMeet member", text: p.content,
        comments: commentRows.filter((c: any) => c.post_id === p.id).map((c: any) => ({ id: c.id, author: labels.get(c.author_id) || "IchaMeet member", text: c.content }))
      }));
      return {
        id: g.id, name: g.name, description: g.description || "", privacy: g.is_private ? "Private" : "Public",
        owner: labels.get(g.created_by) || "Group admin", ownerId: g.created_by,
        members: groupMembers.map((m: any) => labels.get(m.user_id) || "IchaMeet member"),
        memberIds: groupMembers.map((m: any) => m.user_id), posts: groupPosts
      };
    });
    setGroups(nextGroups);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (authError || !data.user) { router.replace("/signup"); return; }
      setUserId(data.user.id);
      loadGroups(data.user.id);
    });
  }, [router, loadGroups]);

  const selectedId = useState<string>("")[0];
  const [activeId, setActiveId] = useState("");
  const selected = groups.find((g) => g.id === activeId) ?? groups[0];
  const visible = useMemo(() => groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()) || g.description.toLowerCase().includes(query.toLowerCase())), [groups, query]);
  const isMember = !!selected && selected.memberIds.includes(userId);
  const isOwner = !!selected && selected.ownerId === userId;

  async function createGroup(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError(""); setNotice("");
    const supabase = createClient();
    const { data: created, error: createError } = await supabase.from("groups").insert({
      name: name.trim(), description: description.trim(), is_private: privacy === "Private", created_by: userId
    }).select("id").single();
    if (createError || !created) { setError(createError?.message || "Could not create the group."); setSaving(false); return; }
    const { error: memberError } = await supabase.from("group_members").insert({ group_id: created.id, user_id: userId, role: "owner" });
    if (memberError) {
      setError("The group was created, but adding you as its owner failed: " + memberError.message);
    } else {
      setNotice("Your group has been created and saved.");
      setActiveId(created.id);
      setName(""); setDescription(""); setPrivacy("Public"); setShowCreate(false);
    }
    await loadGroups(userId);
    setSaving(false);
  }

  async function joinGroup(group: Group) {
    if (group.privacy === "Private") { setNotice("This group is private. Only its owner or invited members can join at the moment."); return; }
    setError("");
    const supabase = createClient();
    const { error: joinError } = await supabase.from("group_members").insert({ group_id: group.id, user_id: userId });
    if (joinError && !joinError.message.toLowerCase().includes("duplicate")) { setError(joinError.message); return; }
    setNotice("You have joined this group.");
    await loadGroups(userId);
  }

  async function addPost(e: FormEvent) {
    e.preventDefault();
    if (!postText.trim() || !selected || !isMember) return;
    setSaving(true); setError("");
    const supabase = createClient();
    const { error: postError } = await supabase.from("group_posts").insert({ group_id: selected.id, author_id: userId, content: postText.trim() });
    if (postError) setError(postError.message);
    else { setPostText(""); setNotice("Your post has been published."); await loadGroups(userId); }
    setSaving(false);
  }

  async function addComment(e: FormEvent, postId: string) {
    e.preventDefault();
    const text = (commentDrafts[postId] ?? "").trim();
    if (!text || !selected || !isMember) return;
    setError("");
    const supabase = createClient();
    const { error: commentError } = await supabase.from("group_comments").insert({ post_id: postId, author_id: userId, content: text });
    if (commentError) setError(commentError.message);
    else { setCommentDrafts((all) => ({ ...all, [postId]: "" })); await loadGroups(userId); }
  }

  function inviteMember(e: FormEvent) {
    e.preventDefault();
    if (!invite.trim()) return;
    setNotice("Email invitations are not connected yet. No email has been sent.");
    setInvite("");
  }

  if (loading) return <main className="groups-page"><div className="group-tool-card">Loading your communities…</div></main>;

  return <main className="groups-page">
    <header className="site-header"><Link className="brand" href="/">icha<span>meet</span></Link><nav className="nav"><Link href="/">Home</Link><a href="#directory">Discover groups</a></nav><Link className="btn btn-light" href="/account">My account</Link></header>
    <section className="groups-hero"><span className="eyebrow">Community on IchaMeet</span><h1>Find your people.</h1><p>Create a community, publish posts, and talk with members through comments.</p><button className="btn btn-primary" onClick={() => setShowCreate(true)}>＋ Create a group</button></section>
    <section className="groups-layout" id="directory">
      <aside className="groups-directory"><h2>Explore groups</h2><input aria-label="Search groups" placeholder="Search groups..." value={query} onChange={(e) => setQuery(e.target.value)} />
        {visible.map((g) => <button className={(selected?.id === g.id) ? "directory-item active" : "directory-item"} key={g.id} onClick={() => setActiveId(g.id)}><strong>{g.name}</strong><small>{g.privacy} · {g.members.length} members</small></button>)}
        {visible.length === 0 && <p className="muted">No groups found yet. Create the first community.</p>}
      </aside>
      {selected && <section className="group-workspace">
        <div className="group-panel-head"><div><span className="eyebrow">{selected.privacy} community</span><h2>{selected.name}</h2><p>{selected.description}</p><small>{selected.members.length} members · Admin: {selected.owner}</small></div>
          {!isMember && <button className="btn btn-primary" onClick={() => joinGroup(selected)}>Join group</button>}
        </div>
        {notice && <p className="group-notice" role="status">{notice}</p>}
        {error && <p className="group-notice" role="alert">{error}</p>}
        <div className="group-tools">
          <section className="group-tool-card"><h3>Community feed</h3>
            <form onSubmit={addPost} className="create-post-form"><label htmlFor="group-post">Write a post</label><textarea id="group-post" value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Share a thought, question or update with this group..." rows={4} disabled={!isMember}/><button className="btn btn-primary" disabled={!isMember || saving || !postText.trim()}>Publish post</button></form>
            <div className="group-posts">{selected.posts.length ? [...selected.posts].reverse().map((p) => <article className="group-post" key={p.id}>
              <div className="post-author"><span className="member-avatar">{p.author.slice(0,1)}</span><strong>{p.author}</strong></div>
              <p className="post-body">{p.text}</p>
              <div className="comments-area"><strong className="comments-title">Comments ({p.comments.length})</strong>
                {p.comments.map((c) => <div className="comment-item" key={c.id}><strong>{c.author}</strong><span>{c.text}</span></div>)}
                <form className="comment-form" onSubmit={(e) => addComment(e, p.id)}><input aria-label="Write a comment" value={commentDrafts[p.id] ?? ""} onChange={(e) => setCommentDrafts((all) => ({ ...all, [p.id]: e.target.value }))} placeholder="Write a comment..." disabled={!isMember}/><button className="btn btn-light" disabled={!isMember || !(commentDrafts[p.id] ?? "").trim()}>Comment</button></form>
              </div>
            </article>) : <p className="muted">No posts yet. Be the first to share something.</p>}</div>
          </section>
          <aside className="group-tool-card"><h3>Members</h3><ul className="member-list">{selected.members.map((m, i) => <li key={selected.memberIds[i]}><span className="member-avatar">{m.slice(0,1)}</span><span>{m}</span>{selected.memberIds[i] === selected.ownerId && <small>Admin</small>}</li>)}</ul>
            {isOwner && <form onSubmit={inviteMember}><label htmlFor="invite-email">Invite by email</label><input id="invite-email" type="email" required placeholder="friend@example.com" value={invite} onChange={(e) => setInvite(e.target.value)}/><button className="btn btn-light">Add invitation</button></form>}
            <div className="group-admin-note"><strong>Community guidelines</strong><p>Be respectful. No harassment, scams, spam, or inappropriate content. Report harmful behaviour to moderators.</p><button className="text-action" onClick={() => setNotice("Group reporting will be connected to moderation before launch.")}>Report this group</button></div>
          </aside>
        </div>
      </section>}
      {!selected && <section className="group-workspace"><div className="group-tool-card"><h2>No communities yet</h2><p>Create a group to start building your community.</p></div></section>}
    </section>
    {showCreate && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-group-title"><button className="close" onClick={() => setShowCreate(false)} aria-label="Close">×</button><h2 id="create-group-title">Create a group</h2><p>Give your community a clear name and purpose.</p><form onSubmit={createGroup}><label htmlFor="new-group-name">Group name</label><input id="new-group-name" required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Food & Culture"/><label htmlFor="new-group-description">Description</label><textarea id="new-group-description" rows={3} maxLength={240} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will members share?"/><label htmlFor="new-group-privacy">Privacy</label><select id="new-group-privacy" value={privacy} onChange={(e) => setPrivacy(e.target.value as "Public" | "Private")}><option>Public</option><option>Private</option></select><button className="btn btn-primary" disabled={saving}>{saving ? "Creating…" : "Create group"}</button></form></section></div>}
  </main>;
}
