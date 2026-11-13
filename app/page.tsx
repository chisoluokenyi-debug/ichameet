"use client";

import { useState } from "react";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="IchaMeet home">icha<span>meet</span></a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#how">How it works</a><a href="#features">Why IchaMeet</a><a href="#safety">Safety</a>
        </nav>
        <div className="nav-actions"><button className="btn btn-light" onClick={() => setOpen(true)}>Log in</button><button className="btn btn-primary" onClick={() => setOpen(true)}>Join free</button></div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">A world of possibilities</span>
          <h1>Real connections.<br/><em>Meaningful</em> beginnings.</h1>
          <p className="hero-copy">Meet interesting people, share your story, and discover connections that could become something beautiful. Your next chapter could start here.</p>
          <div className="hero-buttons"><button className="btn btn-primary" onClick={() => setOpen(true)}>Create your account <span aria-hidden="true">→</span></button><a className="btn btn-light" href="#how">Discover how it works</a></div>
          <p className="hero-note">Designed for adults 18+ • Connect respectfully • Meet the world</p>
        </div>
        <div className="visual" aria-label="Abstract illustration representing two people connecting">
          <div className="photo-main"><div className="photo-glow"/></div>
          <div className="float-card float-one">♡ A connection starts here<small>Be yourself. Be curious.</small></div>
          <div className="float-card float-two">✦ Across the world<small>Discover new perspectives</small></div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading"><span className="eyebrow">Made for meaningful moments</span><h2>More than a swipe</h2><p>IchaMeet is being built to make meeting people feel welcoming, thoughtful, and safe.</p></div>
        <div className="feature-grid">
          <article className="feature"><div className="feature-icon">🌍</div><h3>Meet beyond borders</h3><p>Discover people and perspectives from different places around the world.</p></article>
          <article className="feature"><div className="feature-icon">💗</div><h3>Find mutual interest</h3><p>Like profiles you are interested in and connect when the interest is mutual.</p></article>
          <article className="feature"><div className="feature-icon">🛡️</div><h3>Respect comes first</h3><p>Safety, privacy, blocking, and reporting are core parts of the product we are building.</p></article>
        </div>
      </section>

      <section className="section section-soft" id="how">
        <div className="section-heading"><span className="eyebrow">Your journey</span><h2>Three simple steps</h2><p>A clear path from first hello to a genuine connection.</p></div>
        <div className="steps">
          <article className="step"><div className="step-number">1</div><h3>Create your profile</h3><p>Tell people a little about who you are and what matters to you.</p></article>
          <article className="step"><div className="step-number">2</div><h3>Discover people</h3><p>Explore profiles and show interest in people you would like to know.</p></article>
          <article className="step"><div className="step-number">3</div><h3>Start a conversation</h3><p>When interest is mutual, take the next step and say hello.</p></article>
        </div>
      </section>

      <section className="section" id="safety">
        <div className="section-heading"><span className="eyebrow">Trust matters</span><h2>A better experience starts with safety</h2><p>The full platform will include adult-only registration, privacy controls, reporting and blocking, moderation, and clear community rules before public launch.</p></div>
      </section>

      <section className="cta"><h2>Your story could start with hello.</h2><p>Join IchaMeet as we build a new way to make meaningful connections.</p><button className="btn btn-light" onClick={() => setOpen(true)}>Get started</button></section>

      <footer className="site-footer"><a className="brand" href="#">icha<span>meet</span></a><span>© {new Date().getFullYear()} IchaMeet. Built for respectful connections.</span><span>Adults 18+ only</span></footer>

      {open && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) { setOpen(false); setSubmitted(false); } }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="signup-title">
          <button className="close" aria-label="Close" onClick={() => { setOpen(false); setSubmitted(false); }}>×</button>
          <h2 id="signup-title">{submitted ? "Thanks for your interest!" : "Join IchaMeet"}</h2>
          {submitted ? <p>This is an early preview. Account creation is not active yet; we are building secure sign-up and profile features next.</p> : <>
            <p>Be among the first to explore meaningful connections. Account registration will open after secure sign-up is ready.</p>
            <label htmlFor="email">Email address</label><input id="email" type="email" placeholder="you@example.com" autoComplete="email"/>
            <button className="btn btn-primary" onClick={() => setSubmitted(true)}>Continue</button>
          </>}
        </section>
      </div>}
    </main>
  );
}
