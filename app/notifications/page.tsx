"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
type Announcement={id:string;title:string;body:string;created_at:string};
export default function NotificationsPage(){
 const router=useRouter();const supabase=createClient();const [items,setItems]=useState<Announcement[]>([]);const [readIds,setReadIds]=useState<string[]>([]);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 async function load(){const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/signup");return;}
 const [a,r]=await Promise.all([supabase.from("announcements").select("id,title,body,created_at").order("created_at",{ascending:false}).limit(100),supabase.from("announcement_reads").select("announcement_id").eq("user_id",user.id)]);
 if(a.error||r.error)setError(a.error?.message||r.error?.message||"");setItems(a.data??[]);setReadIds((r.data??[]).map(x=>x.announcement_id));setLoading(false);}
 useEffect(()=>{load();const channel=supabase.channel("icha-announcements-feed").on("postgres_changes",{event:"INSERT",schema:"public",table:"announcements"},payload=>{const next=payload.new as Announcement;setItems(old=>[next,...old.filter(x=>x.id!==next.id)]);}).subscribe();return()=>{supabase.removeChannel(channel);};},[]);
 async function markRead(id:string){if(readIds.includes(id))return;const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {error}=await supabase.from("announcement_reads").insert({announcement_id:id,user_id:user.id});if(error){setError(error.message);return;}setReadIds(old=>[...old,id]);}
 const unread=items.filter(x=>!readIds.includes(x.id)).length;
 return <main className="auth-page"><section className="auth-card" style={{width:"min(760px,94vw)"}}><Link className="brand" href="/">icha<span>meet</span></Link><h1>Notifications</h1><p>{unread} unread announcement{unread===1?"":"s"}</p>{error&&<p className="auth-error">{error}</p>}{loading?<p>Loading notifications…</p>:items.length===0?<p>No announcements yet. Check back later.</p>:items.map(item=><article key={item.id} onClick={()=>markRead(item.id)} style={{border:"1px solid #eadde3",borderRadius:12,padding:16,margin:"14px 0",background:readIds.includes(item.id)?"white":"#fff5f8",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><h2 style={{marginTop:0}}>{item.title}</h2>{!readIds.includes(item.id)&&<strong>New</strong>}</div><p style={{whiteSpace:"pre-wrap"}}>{item.body}</p><small>{new Date(item.created_at).toLocaleString()} · {readIds.includes(item.id)?"Read":"Tap to mark as read"}</small></article>)}<p><Link href="/feed">Community feed</Link> · <Link href="/chat">Messages</Link> · <Link href="/account">Account</Link></p></section></main>;
}