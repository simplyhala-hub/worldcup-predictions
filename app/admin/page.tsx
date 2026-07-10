'use client'
import { useEffect, useState } from 'react'
import { supabase, Match } from '@/lib/supabase'

type Form = {stage:string;home_team:string;away_team:string;kickoff_at:string;allow_draw:boolean}
const empty:Form={stage:'Group Stage',home_team:'',away_team:'',kickoff_at:'',allow_draw:true}
export default function Admin(){
 const [pin,setPin]=useState(''); const [ok,setOk]=useState(false); const [matches,setMatches]=useState<Match[]>([]); const [form,setForm]=useState<Form>(empty)
 async function load(){const {data}=await supabase.from('matches').select('*').order('kickoff_at'); setMatches((data||[]) as Match[])}
 useEffect(()=>{if(ok)load()},[ok])
 function unlock(){ if(pin==='1234') setOk(true); else alert('Wrong PIN. Change the PIN in the deployed app later if needed.') }
 async function add(){ if(!form.home_team||!form.away_team||!form.kickoff_at) return alert('Fill all fields'); const {error}=await supabase.from('matches').insert({...form,match_date:form.kickoff_at.slice(0,10)}); if(error) alert(error.message); else {setForm(empty);load()} }
 async function result(id:string,result:string){
  const m=matches.find(x=>x.id===id)
  await supabase.from('matches').update({result:result||null}).eq('id',id)
  if(m&&(result==='home'||result==='away')){
   const winner=result==='home'?m.home_team:m.away_team
   const loser=result==='home'?m.away_team:m.home_team
   if(m.next_match_id&&m.next_slot) await supabase.from('matches').update({[m.next_slot==='home'?'home_team':'away_team']:winner}).eq('id',m.next_match_id)
   if(m.loser_next_match_id&&m.loser_next_slot) await supabase.from('matches').update({[m.loser_next_slot==='home'?'home_team':'away_team']:loser}).eq('id',m.loser_next_match_id)
  }
  load()
 }
 async function del(id:string){if(confirm('Delete match?')){await supabase.from('matches').delete().eq('id',id);load()}}
 async function exportCsv(){const [{data:users},{data:preds}]=await Promise.all([supabase.from('players').select('*'),supabase.from('predictions').select('*')]); const blob=new Blob([JSON.stringify({users,preds,matches},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='worldcup-export.json'; a.click()}
 if(!ok) return <main className="min-h-screen grid place-items-center p-4"><section className="card p-6 max-w-md w-full"><h1 className="text-3xl font-black mb-3">Admin</h1><p className="text-white/60 mb-4">Enter admin PIN.</p><input value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN" type="password"/><button className="btn mt-3 w-full" onClick={unlock}>Open Admin</button><p className="text-white/40 text-xs mt-3">Default PIN: 1234. Change it in code before public use.</p></section></main>
 return <main className="max-w-5xl mx-auto p-4 md:p-8"><h1 className="text-5xl font-black mb-6">Admin Dashboard</h1><section className="card p-5 mb-5"><h2 className="text-2xl font-black mb-4">Add Match</h2><div className="grid md:grid-cols-2 gap-3"><input placeholder="Stage" value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}/><input type="datetime-local" value={form.kickoff_at} onChange={e=>setForm({...form,kickoff_at:e.target.value})}/><input placeholder="Home team" value={form.home_team} onChange={e=>setForm({...form,home_team:e.target.value})}/><input placeholder="Away team" value={form.away_team} onChange={e=>setForm({...form,away_team:e.target.value})}/><label className="flex gap-2 items-center"><input className="w-auto" type="checkbox" checked={form.allow_draw} onChange={e=>setForm({...form,allow_draw:e.target.checked})}/> Allow draw</label></div><button className="btn mt-4" onClick={add}>Add Match</button></section><section className="card p-5"><div className="flex justify-between mb-4"><h2 className="text-2xl font-black">Matches & Results</h2><button className="ghost" onClick={exportCsv}>Export JSON</button></div><div className="space-y-3">{matches.map(m=><div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 grid md:grid-cols-[1fr_220px_90px] gap-3 items-center"><div><b>{m.home_team} vs {m.away_team}</b><p className="text-white/50 text-sm">{m.stage} • {new Date(m.kickoff_at).toLocaleString()}</p></div><select value={m.result||''} onChange={e=>result(m.id,e.target.value)}><option value="">No result</option><option value="home">{m.home_team} won</option>{m.allow_draw&&<option value="draw">Draw</option>}<option value="away">{m.away_team} won</option></select><button className="ghost" onClick={()=>del(m.id)}>Delete</button></div>)}</div></section></main>
}
