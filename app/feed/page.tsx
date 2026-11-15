"use client";
import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Post={id:string;body:string;media_urls:string[];media_type:string;created_at:string;author_id:string};
export default function FeedPage(){
 const router=useRouter(); const [userId,setUserId]=useState(""); const [posts,setPosts]=useState<Post[]>([]);
 const [body,setBody]=useState(""); const [files,setFiles]=useState<File[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 const supabase=createClient();
 async function load(){const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace("/signup");return;}setUserId(user.id);
 const {data,error}=await supabase.from("feed_posts").select("id,body,media_urls,media_type,created_at,author_id").eq("visibility","public").order("created_at",{ascending:false}).limit(50);
 if(error)setError(error.message);else setPosts(data??[]);
 }
 useEffect(()=>{load();},[]);
 function choose(e:ChangeEvent<HTMLInputElement>){const chosen=Array.from(e.target.files??[]);if(chosen.some(f=>!(f.type.startsWith("image/")||f.type.startsWith("video/")))){setError("Only photos and videos are allowed.");return;}if(chosen.some(f=>f.size>100*1024*1024)){setError("Each file must be smaller than 100 MB.");return;}setFiles(chosen.slice(0,5));}
 async function publish(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const urls:string[]=[];for(const f of files){const ext=f.name.split(".").pop()||"bin";const path=userId+"/"+crypto.randomUUID()+"."+ext;const {error:upErr}=await supabase.storage.from("community-media").upload(path,f,{contentType:f.type});if(upErr)throw upErr;urls.push(supabase.storage.from("community-media").getPublicUrl(path).data.publicUrl);}
 const type=files.length===0?"none":files.every(f=>f.type.startsWith("image/"))?"image":files.every(f=>f.type.startsWith("video/"))?"video":"mixed";
 const {error:postErr}=await supabase.from("feed_posts").insert({author_id:userId,body:body.trim(),media_urls:urls,media_type:type,visibility:"public"});if(postErr)throw postErr;setBody("");setFiles([]);await load();
 }catch(e){setError(e instanceof Error?e.message:"Unable to publish post.");}finally{setBusy(false);}}
 async function like(id:string){const {error}=await supabase.from("feed_likes").insert({post_id:id,user_id:userId});if(error&&error.code!=="23505")setError(error.message);}
 async function addFriend(author:string){if(author===userId)return;const {error}=await supabase.from("friend_requests").insert({sender_id:userId,receiver_id:author});setError(error?error.message:"Friend request sent.");}
 return <main className="auth-page"><section className="auth-card" style={{width:"min(760px,94vw)"}}>
 <Link className="brand" href="/">icha<span>meet</span></Link><h1>Community feed</h1><p>Share moments, photos and videos with the IchaMeet community.</p><p><Link href="/notifications">Notifications</Link> · <Link href="/account">Account</Link></p>
 <form onSubmit={publish}><textarea value={body} onChange={e=>setBody(e.target.value)} maxLength={5000} rows={4} placeholder="What would you like to share?"/><label>Photos or videos (up to 5 files, 100 MB each)</label><input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple onChange={choose}/><p>{files.map(f=>f.name).join(", ")}</p><button className="btn btn-primary" disabled={busy||(!body.trim()&&!files.length)}>{busy?"Publishing…":"Publish to public feed"}</button></form>
 {error&&<p role="alert" className="auth-error">{error}</p>}<hr/>
 {posts.map(p=><article key={p.id} style={{borderBottom:"1px solid #ddd",padding:"18px 0"}}><p>{p.body}</p>{p.media_urls?.map((url,i)=>p.media_type==="video"||url.match(/\.(mp4|webm|mov)(\?|$)/i)?<video key={i} src={url} controls style={{width:"100%",maxHeight:440}}/>:<img key={i} src={url} alt="Community post" style={{width:"100%",maxHeight:440,objectFit:"contain"}}/>)}<small>{new Date(p.created_at).toLocaleString()}</small><div style={{display:"flex",gap:12,marginTop:10}}><button onClick={()=>like(p.id)}>Like</button>{p.author_id!==userId&&<button onClick={()=>addFriend(p.author_id)}>Add friend</button>}</div></article>)}
 <p><Link href="/groups">Groups</Link> · <Link href="/chat">Messages</Link> · <Link href="/profile">My profile</Link> · <Link href="/account">Account</Link></p>
 </section></main>;
}