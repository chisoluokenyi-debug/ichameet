"use client";

import Link from "next/link";
import { useState } from "react";

type ChatMessage = { from: "You" | "Maya"; text: string; time: string };

export default function ChatPage() {
  const [active, setActive] = useState("Maya");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "Maya", text: "Hi! How is your day going?", time: "10:32" },
    { from: "You", text: "It's going well, thanks. How about yours?", time: "10:34" },
    { from: "Maya", text: "Pretty good! Have you explored any groups yet?", time: "10:35" },
  ]);
  const [callType, setCallType] = useState<"voice" | "video" | null>(null);

  function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim()) return;
    setMessages((items) => [...items, { from: "You", text: draft.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setDraft("");
  }

  return <main className="chat-page">
    <header className="site-header">
      <Link className="brand" href="/">icha<span>meet</span></Link>
      <nav className="nav"><Link href="/">Home</Link><Link href="/groups">Groups</Link></nav>
      <span className="chat-preview-label">Chat preview</span>
    </header>
    <section className="chat-shell">
      <aside className="chat-contacts">
        <h1>Messages</h1>
        <input aria-label="Search conversations" placeholder="Search conversations" />
        <button className={active === "Maya" ? "chat-contact selected" : "chat-contact"} onClick={() => setActive("Maya")}>
          <span className="chat-avatar">M</span><span><strong>Maya</strong><small>Hi! How is your day going?</small></span><i>10:35</i>
        </button>
        <p className="chat-preview-note">Sample conversation for layout preview. Real member messaging will connect after account and database setup.</p>
      </aside>
      <section className="chat-conversation">
        <header className="chat-person">
          <div className="chat-person-info"><span className="chat-avatar large">M</span><div><strong>{active}</strong><small>Conversation preview</small></div></div>
          <div className="call-actions">
            <button className="call-button" onClick={() => setCallType("voice")} aria-label="Start voice call"><span>☎</span><small>Voice call</small></button>
            <button className="call-button" onClick={() => setCallType("video")} aria-label="Start video call"><span>▣</span><small>Video call</small></button>
          </div>
        </header>
        <div className="chat-messages">
          <div className="chat-date">TODAY</div>
          {messages.map((message, i) => <div key={i} className={message.from === "You" ? "message-row mine" : "message-row"}><div className="message-bubble"><p>{message.text}</p><small>{message.time}</small></div></div>)}
        </div>
        <form className="chat-compose" onSubmit={sendMessage}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message..." aria-label="Write a message" />
          <button className="btn btn-primary" disabled={!draft.trim()}>Send</button>
        </form>
      </section>
    </section>
    {callType && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setCallType(null); }}>
      <section className="modal call-setup-modal" role="dialog" aria-modal="true" aria-labelledby="call-setup-title">
        <button className="close" onClick={() => setCallType(null)} aria-label="Close">×</button>
        <div className="call-modal-icon">{callType === "voice" ? "☎" : "▣"}</div>
        <h2 id="call-setup-title">{callType === "voice" ? "Voice calling" : "Video calling"}</h2>
        <p>The {callType} call controls are being prepared. To connect calls privately between members, IchaMeet still needs secure sign-in, a call-signalling service, and configured voice/video infrastructure.</p>
        <p className="call-setup-status">Call service not connected yet</p>
        <button className="btn btn-primary" onClick={() => setCallType(null)}>Okay</button>
      </section>
    </div>}
  </main>;
}
