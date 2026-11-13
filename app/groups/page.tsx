"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type Group = { id: number; name: string; description: string; privacy: "Public" | "Private"; owner: string; members: string[]; posts: { author: string; text: string }[]; invites: string[] };

const starter: Group[] = [
  { id: 1, name: "Travel & Discovery", description: "Share places to visit and stories from around the world.", privacy: "Public", owner: "You", members: ["You", "Amara", "Daniel"], posts: [{ author: "Amara", text: "What destination is at the top of your travel list?" }], invites: [] },
  { id: 2, name: "Music Lovers", description: "Discover music and meet people with the same taste.", privacy: "Public", owner: "You", members: ["You", "Tomi"], posts: [{ author: "Tomi", text: "Share one song you have on repeat." }], invites: [] },
  { id: 3, name: "Books & Conversation", description: "Talk about books, learning, and ideas that inspire you.", privacy: "Public", owner: "You", members: ["You"], posts: [], invites: [] },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(starter);
  const [selectedId, setSelectedId] = useState(1);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"Public" | "Private">("Public");
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState("");
  const [notice, setNotice] = useState("");

  const selected = groups.find((g) => g.id === selectedId) ?? groups[0];
  const visible = useMemo(() => groups.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()) || g.description.toLowerCase().includes(query.toLowerCase())), [groups, query]);

  function createGroup(e: FormEvent) {
    e.preventDefault();
    const group: Group = { id: Date.now(), name: name.trim(), description: description.trim(), privacy, owner: "You", members: ["You"], posts: [], invites: [] };
    setGroups((all) => [group, ...all]);
    setSelectedId(group.id);
    setName(""); setDescription(""); setPrivacy("Public"); setShowCreate(false);
    setNotice("Group created in this preview. Connect a verified account and database to save it permanently.");
  }

  function joinGroup(group: Group) {
    if (group.privacy === "Private") { setNotice("This is a private group. A join request would be sent once accounts and approvals are enabled."); return; }
    setGroups((all) => all.map((g) => g.id === group.id && !g.members.includes("You") ? { ...g, members: [...g.members, "You"] } : g));
    setNotice("You joined the group in this preview.");
  }

  function leaveGroup(group: Group) {
    if (group.owner === "You") { setNotice("Group owners must transfer ownership or close the group before leaving."); return; }
    setGroups((all) => all.map((g) => g.id === group.id ? { ...g, members: g.members.filter((m) => m !== "You") } : g));
    setNotice("You left the group in this preview.");
  }

  function postMessage(e: FormEvent) {
    e.preventDefault();
    if (!message.trim() || !selected) return;
    setGroups((all) => all.map((g) => g.id === selected.id ? { ...g, posts: [...g.posts, { author: "You", text: message.trim() }] } : g));
    setMessage("");
  }

  function inviteMember(e: FormEvent) {
    e.preventDefault();
    if (!invite.trim() || !selected) return;
    setGroups((all) => all.map((g) => g.id === selected.id ? { ...g, invites: [...g.invites, invite.trim()] } : g));
    setNotice("Invitation added to this preview. Email delivery will be enabled after authentication and email service are configured.");
    setInvite("");
  }

  const isMember = selected?.members.includes("You");
  const isOwner = selected?.owner === "You";

  return <main className="groups-page">
    <header className="site-header"><Link className="brand" href="/">icha<span>meet</span></Link><nav className="nav"><Link href="/">Home</Link><a href="#directory">Discover groups</a></nav><Link className="btn btn-light" href="/">Back to IchaMeet</Link></header>
    <section className="groups-hero"><span className="eyebrow">Community on IchaMeet</span><h1>Find your people.</h1><p>Create a community, join conversations, and connect through shared interests.</p><button className="btn btn-primary" onClick={() => setShowCreate(true)}>＋ Create a group</button></section>
    <section className="groups-layout" id="directory">
      <aside className="groups-directory"><h2>Explore groups</h2><input aria-label="Search groups" placeholder="Search groups..." value={query} onChange={(e) => setQuery(e.target.value)} />
        {visible.map((g) => <button className={selectedId === g.id ? "directory-item active" : "directory-item"} key={g.id} onClick={() => setSelectedId(g.id)}><strong>{g.name}</strong><small>{g.privacy} · {g.members.length} members</small></button>)}
        {visible.length === 0 && <p className="muted">No groups match that search.</p>}
      </aside>
      {selected && <section className="group-workspace"><div className="group-panel-head"><div><span className="eyebrow">{selected.privacy} community</span><h2>{selected.name}</h2><p>{selected.description}</p><small>{selected.members.length} members · Admin: {selected.owner}</small></div>
        {isMember ? <button className="btn btn-light" onClick={() => leaveGroup(selected)}>Leave group</button> : <button className="btn btn-primary" onClick={() => joinGroup(selected)}>{selected.privacy === "Private" ? "Request to join" : "Join group"}</button>}</div>
        {notice && <p className="group-notice" role="status">{notice}</p>}
        <div className="group-tools">
          <section className="group-tool-card"><h3>Group conversation</h3><div className="group-posts">{selected.posts.length ? selected.posts.map((p, i) => <article className="group-post" key={i}><strong>{p.author}</strong><p>{p.text}</p></article>) : <p className="muted">No posts yet. Start the conversation.</p>}</div>
            <form onSubmit={postMessage}><label htmlFor="group-message">Write a message</label><textarea id="group-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share something with the group..." rows={3} disabled={!isMember}/><button className="btn btn-primary" disabled={!isMember || !message.trim()}>Post message</button></form>
          </section>
          <aside className="group-tool-card"><h3>Members</h3><ul className="member-list">{selected.members.map((m) => <li key={m}><span className="member-avatar">{m.slice(0,1)}</span><span>{m}</span>{m === selected.owner && <small>Admin</small>}</li>)}</ul>
            {isOwner && <form onSubmit={inviteMember}><label htmlFor="invite-email">Invite by email</label><input id="invite-email" type="email" required placeholder="friend@example.com" value={invite} onChange={(e) => setInvite(e.target.value)}/><button className="btn btn-light">Add invitation</button>{selected.invites.length > 0 && <p className="muted">Pending preview invites: {selected.invites.join(", ")}</p>}</form>}
            <div className="group-admin-note"><strong>Community guidelines</strong><p>Be respectful. No harassment, scams, spam, or inappropriate content. Report harmful behaviour to moderators.</p><button className="text-action" onClick={() => setNotice("Thanks. Reporting will be connected to the moderation system before launch.")}>Report this group</button></div>
          </aside>
        </div>
        <p className="preview-warning">Preview mode: actions are temporary and reset on refresh. Secure accounts, real invitations, persistent group membership, moderation, and live chat still need a connected backend.</p>
      </section>}
    </section>
    {showCreate && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-group-title"><button className="close" onClick={() => setShowCreate(false)} aria-label="Close">×</button><h2 id="create-group-title">Create a group</h2><p>Give your community a clear name and purpose.</p><form onSubmit={createGroup}><label htmlFor="new-group-name">Group name</label><input id="new-group-name" required maxLength={50} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Food & Culture"/><label htmlFor="new-group-description">Description</label><textarea id="new-group-description" rows={3} maxLength={240} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will members share?"/><label htmlFor="new-group-privacy">Privacy</label><select id="new-group-privacy" value={privacy} onChange={(e) => setPrivacy(e.target.value as "Public" | "Private")}><option>Public</option><option>Private</option></select><button className="btn btn-primary">Create group</button></form></section></div>}
  </main>;
}
