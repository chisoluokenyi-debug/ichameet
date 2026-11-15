"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
type Post={id:string;body:string;author_id:string;created_at:string};
type Report={id:string;reason:string;details:string;status:string;reported_user_id:string;created_at:string};
export default function AdminPage(){
 const router=useRouter();const [allowed,setAllowed]=useState(false);const [loading,setLoading]=useState(true);const [posts,setPosts]=useState<Post[]>([]);const [reports,setReports]=useState<Report[]>([]);const [members,setMembers]=useState(0);const [error,setError]=useState("");
 const supabase=createClient();
 async function load(){const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/signup");return;}
 const {data:admin}=await supabase.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();if(!admin){setLoading(false);return;}setAllowed(true);
 const [p,r,m]=await Promise.all([supabase.from("feed_posts").select("id,body,author_id,created_at").order("created_at",{ascending:false}).limit(100),supabase.from("user_reports").select("id,reason,details,status,reported_user_id,created_at").order("created_at",{ascending:false}).limit(100),supabase.from("profiles").select("id",{count:"exact",head:true})]);
 if(p.error||r.error||m.error)setError(p.error?.message||r.error?.message||m.error?.message||"");setPosts(p.data??[]);setReports(r.data??[]);setMembers(m.count??0);setLoading(false);}
 useEffect(()=>{load();},[]);
 async function removePost(id:string){if(!confirm("Remove this post?"))return;const {error}=await supabase.from("feed_posts").delete().eq("id",id);if(error)setError(error.message);else setPosts(v=>v.filter(p=>p.id!==id));}
 async function resolve(id:string,status:"resolved"|"dismissed"){const {error}=await supabase.from("user_reports").update({status}).eq("id",id);if(error)setError(error.message);else setReports(v=>v.map(r=>r.id===id?{...r,status}:r));}
 if(loading)return <main className="auth-page"><section className="auth-card">Checking administrator access…</section></main>;
 if(!allowed)return <main className="auth-page"><section className="auth-card"><h1>Admin access required</h1><p>This page is restricted to accounts added by the site owner.</p><Link href="/account">Return to account</Link></section></main>;
 return <main className="auth-page"><section className="auth-card" style={{width:"min(900px,95vw)"}}><Link className="brand" href="/">icha<span>meet</span></Link><h1>Admin dashboard</h1><p>Members: {members} · Posts shown: {posts.length} · Reports: {reports.length}</p>{error&&<p className="auth-error">{error}</p>}
 <h2>Moderate public posts</h2>{posts.map(p=><article key={p.id} style={{borderBottom:"1px solid #ddd",padding:12}}><p>{p.body||"(Media post)"}</p><small>{p.author_id} · {new Date(p.created_at).toLocaleString()}</small><p><button onClick={()=>removePost(p.id)}>Remove post</button></p></article>)}
 <h2>User reports</h2>{reports.map(r=><article key={r.id} style={{borderBottom:"1px solid #ddd",padding:12}}><b>{r.reason}</b><p>{r.details}</p><small>Reported user: {r.reported_user_id} · Status: {r.status}</small><p><button onClick={()=>resolve(r.id,"resolved")}>Resolve</button> <button onClick={()=>resolve(r.id,"dismissed")}>Dismiss</button></p></article>)}
 <Link href="/feed">Open community feed</Link></section></main>;
}