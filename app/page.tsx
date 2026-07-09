'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import { supabase, Match, Player, Prediction } from '@/lib/supabase'

type Pick = 'home'|'draw'|'away'

type Row = Player & { points:number; total:number; correct:number; accuracy:number }

function deviceId(){
  if(typeof window==='undefined') return ''
  let id=localStorage.getItem('wc_device_id')
  if(!id){id=crypto.randomUUID();localStorage.setItem('wc_device_id',id)}
  return id
}
function label(m:Match,p:Pick){return p==='home'?m.home_team:p==='away'?m.away_team:'Draw'}
function locked(m:Match){return Date.now()>=new Date(m.kickoff_at).getTime()}

export default function Home(){
  const [name,setName]=useState('')
  const [me,setMe]=useState<Player|null>(null)
  const [matches,setMatches]=useState<Match[]>([])
  const [players,setPlayers]=useState<Player[]>([])
  const [preds,setPreds]=useState<Prediction[]>([])
  const [loading,setLoading]=useState(true)
  const boardRef=useRef<HTMLDivElement>(null)

  async function load(){
    const did=deviceId()
    const [{data:ms},{data:us},{data:ps}] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_at'),
      supabase.from('players').select('*').order('created_at'),
      supabase.from('predictions').select('*')
    ])
    setMatches((ms||[]) as Match[]); setPlayers((us||[]) as Player[]); setPreds((ps||[]) as Prediction[])
    const player=(us||[]).find((u:any)=>u.device_id===did) as Player|undefined
    setMe(player||null); setLoading(false)
  }
  useEffect(()=>{load(); const t=setInterval(load,30000); return()=>clearInterval(t)},[])

  async function saveName(){
    if(!name.trim()) return alert('Please enter your name')
    const did=deviceId()
    const {data,error}=await supabase.from('players').upsert({device_id:did,name:name.trim()},{onConflict:'device_id'}).select().single()
    if(error) return alert(error.message)
    setMe(data as Player); await load()
  }
  async function choose(m:Match,pick:Pick){
    if(!me) return alert('Enter your name first')
    if(locked(m)) return alert('Voting is closed for this match')
    const {error}=await supabase.from('predictions').upsert({user_id:me.id,match_id:m.id,pick},{onConflict:'user_id,match_id'})
    if(error) return alert(error.message)
    await load()
  }

  const todayOpen=useMemo(()=>matches.filter(m=>!locked(m)).slice(0,8),[matches])
  const board:Row[]=useMemo(()=>players.map(u=>{
    const mine=preds.filter(p=>p.user_id===u.id)
    let total=0,correct=0
    mine.forEach(p=>{const m=matches.find(x=>x.id===p.match_id); if(m?.result){total++; if(m.result===p.pick) correct++}})
    return {...u,total,correct,points:correct,accuracy:total?Math.round(correct/total*100):0}
  }).sort((a,b)=>b.points-a.points||b.accuracy-a.accuracy||a.name.localeCompare(b.name)),[players,preds,matches])

  async function downloadBoard(){
    if(!boardRef.current) return
    const dataUrl=await htmlToImage.toPng(boardRef.current,{width:1080,height:1350,pixelRatio:1})
    const a=document.createElement('a'); a.href=dataUrl; a.download=`leaderboard-${new Date().toISOString().slice(0,10)}.png`; a.click()
  }

  if(loading) return <main className="min-h-screen grid place-items-center"><p>Loading...</p></main>
  return <main className="max-w-6xl mx-auto p-4 md:p-8">
    <section className="py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
      <div><p className="text-yellow-300 font-black tracking-[.22em] uppercase">Office League</p><h1 className="text-4xl md:text-7xl font-black leading-none">World Cup Predictions</h1><p className="text-white/65 mt-4 text-lg">Pick before kickoff. 1 correct prediction = 1 point.</p></div>
      {me && <button className="ghost" onClick={()=>setMe(null)}>Change name</button>}
    </section>

    {!me && <section className="card p-6 max-w-xl"><h2 className="text-2xl font-black mb-2">Enter your name</h2><p className="text-white/60 mb-4">Use the same name until the final.</p><div className="flex gap-2 flex-col sm:flex-row"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/><button className="btn" onClick={saveName}>Start</button></div></section>}

    {me && <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-5">
      <section className="card p-5"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-black">Open Matches</h2><span className="text-white/50">KSA time</span></div>
        <div className="space-y-4">{todayOpen.length?todayOpen.map(m=>{const mine=preds.find(p=>p.user_id===me.id&&p.match_id===m.id);return <div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl p-4"><div className="flex justify-between text-sm text-white/55"><span>{m.stage}</span><span>{new Date(m.kickoff_at).toLocaleString()}</span></div><div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center text-center my-5"><b>{m.home_team}</b><span className="text-yellow-300 text-sm">VS</span><b>{m.away_team}</b></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><button className={mine?.pick==='home'?'btn':'ghost'} onClick={()=>choose(m,'home')}>{m.home_team}</button>{m.allow_draw&&<button className={mine?.pick==='draw'?'btn':'ghost'} onClick={()=>choose(m,'draw')}>Draw</button>}<button className={mine?.pick==='away'?'btn':'ghost'} onClick={()=>choose(m,'away')}>{m.away_team}</button></div>{mine&&<p className="text-green-300 mt-3 text-sm">Your pick: {label(m,mine.pick as Pick)}</p>}</div>}):<p className="text-white/60">No open matches. Admin can add matches from /admin.</p>}</div></section>
      <section className="card p-5"><div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-black">Leaderboard</h2><button className="ghost" onClick={downloadBoard}>Save image</button></div><div ref={boardRef} className="bg-[#07111f] rounded-3xl p-6 min-h-[700px]"><p className="text-yellow-300 font-black tracking-[.18em] uppercase">Daily leaderboard</p><h3 className="text-4xl font-black mb-6">World Cup Office League</h3>{board.map((u,i)=><div key={u.id} className={`grid grid-cols-[48px_1fr_60px] gap-3 items-center p-3 border-b border-white/10 ${i<3?'bg-yellow-300/10 rounded-xl':''}`}><b className="text-yellow-300">#{i+1}</b><div><b>{u.name}</b><p className="text-white/50 text-sm">{u.correct}/{u.total} correct • {u.accuracy}%</p></div><b className="text-right text-xl">{u.points}</b></div>)}</div></section>
    </div>}
  </main>
}
