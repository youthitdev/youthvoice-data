import { useState, useEffect, useCallback, useRef } from "react";

// ── Supabase 설정 ──────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const TABLE = "yv_data";
const STORAGE_KEY = "gantt_v1";

// ── 상수 ──────────────────────────────────────────────
const NCOLS = 12;
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const PRESET_COLORS = [
  "#27ae60","#e67e22","#2980b9","#16a085","#8e44ad","#c0392b",
  "#f39c12","#e84393","#636e72","#00b894","#0984e3","#6c5ce7",
  "#fd79a8","#00cec9","#fdcb6e","#e17055","#2d3436","#74b9ff",
];
const TODAY_MONTH = new Date().getMonth() + 1;

const DEFAULT_LEGEND = [
  { id:"plan",    name:"기획/준비",     color:"#27ae60" },
  { id:"recruit", name:"모집/선발",     color:"#e67e22" },
  { id:"run",     name:"진행/운영",     color:"#2980b9" },
  { id:"edu",     name:"교육",          color:"#16a085" },
  { id:"event",   name:"행사/무대",     color:"#8e44ad" },
  { id:"result",  name:"결과/모니터링", color:"#c0392b" },
];

const DEFAULT_DATA = [
  { proj:"TMI 프로젝트\n(바보의나눔)", color:"#16a085", rows:[
    { prog:"진로 멘토 교육자(기관) 모집", bars:[{s:3.5,e:4.5,cat:"recruit",l:"모집"}] },
    { prog:"참여자 모집, 선발",           bars:[{s:4.0,e:5.5,cat:"recruit",l:"5/1~5/30"}] },
    { prog:"OT 및 진로탐방캠프",         bars:[{s:5.75,e:6.2,cat:"run",l:"12~3"}] },
    { prog:"발견미션",                    bars:[{s:6.25,e:7.5,cat:"plan",l:"6/14~7/15"}] },
    { prog:"중간워크숍",                  bars:[{s:7.5,e:7.75,cat:"plan",l:"16"}] },
    { prog:"창작워크숍",                  bars:[{s:7.75,e:8.2,cat:"plan",l:"25"}] },
    { prog:"개별 창작 활동 (지원금)",     bars:[{s:8.0,e:9.5,cat:"plan",l:"25~4"}] },
    { prog:"쇼케이스(공유회/전시/포트폴리오)", bars:[{s:8.25,e:10.0,cat:"event",l:"8~21"}] },
    { prog:"결과보고",                    bars:[{s:10.5,e:12.5,cat:"result",l:"결과보고"}] },
  ]},
  { proj:"TMI 프로젝트\n(태안군/서부발전)", color:"#2980b9", rows:[
    { prog:"진로 멘토 교육자(기관) 모집", bars:[{s:1.5,e:2.5,cat:"recruit",l:"모집"},{s:2.5,e:3.5,cat:"run",l:""}] },
    { prog:"참여자 모집, 선발",           bars:[{s:1.75,e:2.75,cat:"recruit",l:"모집"},{s:3.5,e:5.25,cat:"recruit",l:"4/12~5/11"}] },
    { prog:"OT 및 진로탐방캠프",         bars:[{s:5.0,e:5.5,cat:"run",l:"17"}] },
    { prog:"발견미션",                    bars:[{s:5.75,e:6.5,cat:"plan",l:"24"}] },
    { prog:"중간워크숍",                  bars:[{s:6.5,e:7.25,cat:"plan",l:"30~29"}] },
    { prog:"창작워크숍",                  bars:[{s:6.75,e:7.5,cat:"plan",l:"26~13"}] },
    { prog:"개별 창작 활동 (지원금)",     bars:[{s:7.5,e:8.5,cat:"plan",l:"19"}] },
    { prog:"쇼케이스(공유회/전시/포트폴리오)", bars:[{s:5.75,e:6.75,cat:"event",l:"5/26~6/27"}] },
    { prog:"결과보고",                    bars:[{s:6.75,e:7.25,cat:"result",l:"28"}] },
  ]},
  { proj:"SMile Music Festival\n(SM엔티)", color:"#e67e22", rows:[
    { prog:"결과보고 및 미팅",            bars:[{s:2.75,e:3.0,cat:"result",l:"27~28"}] },
    { prog:"참여자 모집 및 선발",         bars:[{s:3.5,e:6.0,cat:"recruit",l:"5/2~6/1"},{s:6.5,e:7.0,cat:"recruit",l:"24"}] },
    { prog:"서포터즈 모집 및 선발",       bars:[{s:5.0,e:7.5,cat:"recruit",l:"6/24~7/14"}] },
    { prog:"오리엔테이션",               bars:[{s:7.0,e:7.5,cat:"run",l:"7~3"}] },
    { prog:"중간워크숍",                  bars:[{s:9.5,e:10.0,cat:"plan",l:"18"}] },
    { prog:"최종무대",                    bars:[{s:10.5,e:11.0,cat:"event",l:"15"}] },
    { prog:"모니터링",                    bars:[{s:8.0,e:12.5,cat:"result",l:"모니터링"}] },
  ]},
  { proj:"문장력 프로젝트\n(KT&G장학재단)", color:"#8e44ad", rows:[
    { prog:"기관 선정 및 답사",           bars:[{s:1.0,e:2.75,cat:"plan",l:"1/14~2/21"}] },
    { prog:"교육자 선정 및 기관 매칭",    bars:[{s:1.0,e:2.75,cat:"recruit",l:"1/14~2/21"}] },
    { prog:"미디어 교육",                 bars:[{s:3.25,e:8.0,cat:"edu",l:"3.17~7/31"}] },
    { prog:"콘텐츠 제작 및 발행",         bars:[{s:5.0,e:10.5,cat:"run",l:"콘텐츠 제작"}] },
    { prog:"결과보고 및 평가회의",        bars:[{s:9.75,e:10.25,cat:"result",l:"29"}] },
  ]},
  { proj:"MYB CLASS", color:"#c0392b", rows:[
    { prog:"기관 선정 및 답사",           bars:[{s:2.25,e:2.5,cat:"plan",l:""}] },
    { prog:"교육자 선정 및 기관 매칭",    bars:[{s:3.25,e:3.75,cat:"recruit",l:"3/11~3/20"},{s:4.0,e:4.5,cat:"recruit",l:"4/4~4/18"}] },
    { prog:"미디어 교육",                 bars:[{s:4.75,e:5.5,cat:"edu",l:"4/21~5/2"}] },
  ]},
];

// ── Supabase REST API ──────────────────────────────────
const sbHeaders = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

async function dbGet() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${STORAGE_KEY}&select=value`,
      { headers: sbHeaders }
    );
    const rows = await res.json();
    if (rows?.length > 0) return JSON.parse(rows[0].value);
    return null;
  } catch { return null; }
}

async function dbSet(payload) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: { ...sbHeaders, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ key: STORAGE_KEY, value: JSON.stringify(payload) }),
    });
    return res.ok;
  } catch { return false; }
}

// ── 유틸 ──────────────────────────────────────────────
function pct(m)    { return `${((m-1)/NCOLS*100).toFixed(3)}%`; }
function wPct(s,e) { return `${((e-s)/NCOLS*100).toFixed(3)}%`; }
function catColor(legend,id) { return legend.find(l=>l.id===id)?.color ?? "#b2bec3"; }
function catName(legend,id)  { return legend.find(l=>l.id===id)?.name ?? id ?? ""; }
function uid() { return "cat_"+Date.now()+"_"+Math.random().toString(36).slice(2,6); }

// 날짜(월/일) → 월.소수 변환 (예: "3/15" → 3.48)
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
function dateToMonthFloat(month, day) {
  const daysInMonth = DAYS_IN_MONTH[month - 1];
  return month + (day - 1) / daysInMonth;
}
// "3/15" 형태 파싱
function parseDate(str) {
  const m = str.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
  if (!m) return null;
  const month = parseInt(m[1]), day = parseInt(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return dateToMonthFloat(month, day);
}
// 월.소수 → "M/D" 표시용 역변환
function monthFloatToLabel(mf) {
  const month = Math.floor(mf);
  const daysInMonth = DAYS_IN_MONTH[Math.min(month,12) - 1];
  const day = Math.round((mf - month) * daysInMonth) + 1;
  return `${month}/${day}`;
}

// ── 공통 컴포넌트 ──────────────────────────────────────
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,
              display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"white",borderRadius:14,padding:28,
                   width:wide?540:480,maxWidth:"95vw",maxHeight:"90vh",
                   overflowY:"auto",boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
        <h2 style={{fontSize:16,fontWeight:700,marginBottom:18,color:"#2d3436"}}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function FG({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:"#636e72",marginBottom:5}}>{label}</label>
      {children}
    </div>
  );
}

function Inp(props) {
  return <input {...props}
    style={{width:"100%",padding:"8px 12px",border:"1.5px solid #dfe6e9",
            borderRadius:7,fontSize:13,outline:"none",...props.style}}
    onFocus={e=>e.target.style.borderColor="#00b894"}
    onBlur={e=>e.target.style.borderColor="#dfe6e9"} />;
}

function Btn({ children, onClick, v="primary", sm, style }) {
  const S = {
    primary:   {background:"#00b894",color:"white"},
    secondary: {background:"rgba(255,255,255,0.15)",color:"white",border:"1px solid rgba(255,255,255,0.3)"},
    legend:    {background:"#fdcb6e",color:"#2d3436"},
    cancel:    {background:"#f5f6fa",color:"#636e72",border:"1.5px solid #dfe6e9"},
    danger:    {background:"#fab1a0",color:"#2d3436"},
    add:       {background:"#55efc4",color:"#2d3436"},
    edit:      {background:"#74b9ff",color:"#2d3436"},
  };
  return <button onClick={onClick} style={{
    padding:sm?"4px 10px":"7px 16px",borderRadius:sm?5:7,border:"none",
    cursor:"pointer",fontSize:sm?11:12,fontWeight:600,transition:"all 0.15s",...S[v],...style
  }}>{children}</button>;
}

function ColorPicker({ value, onChange }) {
  const [hex,setHex] = useState(value||"#27ae60");
  useEffect(()=>setHex(value||"#27ae60"),[value]);
  const apply = c => { setHex(c); onChange(c); };
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
        {PRESET_COLORS.map(c=>(
          <div key={c} onClick={()=>apply(c)} style={{
            width:24,height:24,borderRadius:5,background:c,cursor:"pointer",
            border:c===hex?"2.5px solid #2d3436":"2.5px solid transparent",
            transform:c===hex?"scale(1.2)":"scale(1)",transition:"all 0.12s"}} />
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <input type="color" value={hex} onChange={e=>apply(e.target.value)}
          style={{width:34,height:28,border:"none",padding:0,cursor:"pointer",borderRadius:5}} />
        <input type="text" value={hex} maxLength={7}
          onChange={e=>{setHex(e.target.value);if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))onChange(e.target.value);}}
          style={{flex:1,padding:"5px 8px",border:"1.5px solid #dfe6e9",borderRadius:6,fontSize:12,fontFamily:"monospace",outline:"none"}} />
        <div style={{width:30,height:30,borderRadius:7,background:hex,border:"1.5px solid #dfe6e9"}} />
      </div>
    </div>
  );
}

function SaveBadge({ s }) {
  const m = {
    idle:   {t:"",c:"transparent"},
    saving: {t:"저장 중...",c:"#74b9ff"},
    saved:  {t:"✓ 저장됨",c:"#00b894"},
    error:  {t:"⚠ 저장 실패",c:"#e17055"},
  };
  const x = m[s]||m.idle;
  return <span style={{fontSize:11,color:x.c,marginLeft:8,transition:"color 0.3s"}}>{x.t}</span>;
}

// ── 메인 앱 ───────────────────────────────────────────
export default function App() {
  const [legend,setLegend]       = useState(DEFAULT_LEGEND);
  const [data,setData]           = useState(DEFAULT_DATA);
  const [loading,setLoading]     = useState(true);
  const [saveStatus,setSave]     = useState("idle");
  const [activeFilter,setFilter] = useState("all");
  const [tooltip,setTooltip]     = useState(null);

  const [projModal,setProjModal]   = useState(null);
  const [progModal,setProgModal]   = useState(null);
  const [legendModal,setLegModal]  = useState(false);

  const [tempProj,setTempProj]   = useState({name:"",color:PRESET_COLORS[0]});
  const [tempProg,setTempProg]   = useState({name:"",bars:[],newBar:{s:"",e:"",l:"",cat:null}});
  const [tempLeg,setTempLeg]     = useState([]);

  const saveTimer = useRef(null);

  // 초기 로드
  useEffect(()=>{
    (async()=>{
      const stored = await dbGet();
      if (stored?.data)   setData(stored.data);
      if (stored?.legend) setLegend(stored.legend);
      setLoading(false);
    })();
  },[]);

  // 30초 폴링 (다른 사람 변경 반영)
  useEffect(()=>{
    const id = setInterval(async()=>{
      const stored = await dbGet();
      if (stored?.data)   setData(stored.data);
      if (stored?.legend) setLegend(stored.legend);
    }, 30000);
    return ()=>clearInterval(id);
  },[]);

  // 자동 저장 (debounce 700ms)
  const save = useCallback((d,l)=>{
    if(saveTimer.current) clearTimeout(saveTimer.current);
    setSave("saving");
    saveTimer.current = setTimeout(async()=>{
      const ok = await dbSet({data:d,legend:l});
      setSave(ok?"saved":"error");
      setTimeout(()=>setSave("idle"),2500);
    },700);
  },[]);

  function upData(d) { setData(d);   save(d,legend); }
  function upLeg(l)  { setLegend(l); save(data,l); }

  // ── 프로젝트 ──
  function saveProject() {
    if(!tempProj.name.trim()) return alert("프로젝트명을 입력하세요.");
    const next = [...data];
    if(projModal.idx==null) next.push({proj:tempProj.name.trim(),color:tempProj.color,rows:[]});
    else next[projModal.idx]={...next[projModal.idx],proj:tempProj.name.trim(),color:tempProj.color};
    upData(next); setProjModal(null); setFilter("all");
  }
  function delProject(pi) {
    if(!confirm(`"${data[pi].proj.replace("\n"," ")}" 프로젝트를 삭제할까요?`)) return;
    upData(data.filter((_,i)=>i!==pi)); setFilter("all");
  }

  // ── 사업 ──
  function addTempBar() {
    const sRaw = tempProg.newBar.s.trim();
    const eRaw = tempProg.newBar.e.trim();
    let s = parseDate(sRaw);
    let e = parseDate(eRaw);
    if(e !== null) {
      const eMonth = Math.floor(e);
      const eDays = DAYS_IN_MONTH[Math.min(eMonth,12)-1];
      e = e + 1/eDays;
    }
    if(s===null||e===null) return alert("날짜를 올바르게 입력하세요.\n예: 시작 3/11, 종료 4/18");
    if(s>=e) return alert("시작일이 종료일보다 늦습니다.");
    if(!tempProg.newBar.cat) return alert("구분을 선택하세요.");
    const autoLabel = `${sRaw}~${eRaw}`;
    const label = tempProg.newBar.l.trim() || autoLabel;
    setTempProg(p=>({...p,bars:[...p.bars,{s,e,cat:p.newBar.cat,l:label}],newBar:{s:"",e:"",l:"",cat:p.newBar.cat}}));
  }
  function saveProgram() {
    if(!tempProg.name.trim()) return alert("사업명을 입력하세요.");
    const next = data.map(p=>({...p,rows:[...p.rows]}));
    const row = {prog:tempProg.name.trim(),bars:tempProg.bars};
    if(progModal.ri==null) next[progModal.pi].rows.push(row);
    else next[progModal.pi].rows[progModal.ri]=row;
    upData(next); setProgModal(null);
  }
  function delProgram(pi,ri) {
    if(!confirm(`"${data[pi].rows[ri].prog}"를 삭제할까요?`)) return;
    upData(data.map((p,i)=>i!==pi?p:{...p,rows:p.rows.filter((_,j)=>j!==ri)}));
  }

  // ── 범례 ──
  function saveLegend() { upLeg(tempLeg); setLegModal(false); }
  function addLegRow() {
    setTempLeg(l=>[...l,{id:uid(),name:"새 항목",color:PRESET_COLORS[Math.floor(Math.random()*PRESET_COLORS.length)]}]);
  }
  function delLegRow(li) {
    const leg=tempLeg[li];
    const used=data.some(p=>p.rows.some(r=>r.bars.some(b=>b.cat===leg.id)));
    if(used&&!confirm(`"${leg.name}"은 사용 중입니다. 삭제 시 해당 일정이 회색으로 표시됩니다. 계속할까요?`)) return;
    setTempLeg(l=>l.filter((_,i)=>i!==li));
  }

  // ── 렌더 ──
  const totalProg  = data.reduce((a,b)=>a+b.rows.length,0);
  const activeCount= data.reduce((s,p)=>s+p.rows.filter(r=>r.bars.some(b=>b.s<=TODAY_MONTH&&b.e>=TODAY_MONTH)).length,0);
  const todayPct   = ((TODAY_MONTH-1)/NCOLS*100).toFixed(2);
  const visData    = activeFilter==="all"
    ? data.map((p,i)=>({...p,_i:i}))
    : data.map((p,i)=>({...p,_i:i})).filter(p=>p._i===parseInt(activeFilter));

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",
                 flexDirection:"column",gap:16}}>
      <div style={{fontSize:40}}>📋</div>
      <div style={{fontSize:14,color:"#636e72"}}>데이터를 불러오는 중...</div>
    </div>
  );

  return (
    <div style={{fontSize:13,color:"#2d3436",background:"#f5f6fa",minHeight:"100vh"}}>

      {/* 헤더 */}
      <div style={{background:"#2d3436",color:"white",padding:"14px 24px",
                   display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:18,fontWeight:700}}>📋 사업 일정 대시보드</div>
          <div style={{fontSize:11,opacity:0.5,marginTop:3,display:"flex",alignItems:"center",gap:8}}>
            YouthVoice · 2026년 연간 사업 계획
            <span style={{background:"#00b894",color:"white",padding:"1px 7px",borderRadius:10,
                          fontSize:10,fontWeight:600,opacity:1}}>🔗 실시간 공유</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <SaveBadge s={saveStatus}/>
          <Btn v="legend" onClick={()=>{setTempLeg(JSON.parse(JSON.stringify(legend)));setLegModal(true);}}>🎨 범례 관리</Btn>
          <Btn v="secondary" onClick={()=>{setTempProj({name:"",color:PRESET_COLORS[0]});setProjModal({});}}>+ 프로젝트 추가</Btn>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{display:"flex",gap:12,padding:"14px 24px",flexWrap:"wrap"}}>
        {[
          {num:data.length, lbl:"총 프로젝트 수",   c:"#27ae60"},
          {num:totalProg,   lbl:"총 사업 수",        c:"#2980b9"},
          {num:activeCount, lbl:`현재(${TODAY_MONTH}월) 진행 중`, c:"#e67e22"},
        ].map(s=>(
          <div key={s.lbl} style={{background:"white",borderRadius:10,padding:"12px 18px",flex:1,
                                    minWidth:120,borderLeft:`4px solid ${s.c}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.num}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{display:"flex",gap:8,padding:"10px 24px",background:"white",
                   borderBottom:"1px solid #eee",flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#636e72",fontWeight:600,marginRight:4}}>필터:</span>
        {[{key:"all",label:"전체",color:null},...data.map((p,i)=>({key:String(i),label:p.proj.replace("\n"," "),color:p.color}))].map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)}
            style={{padding:"5px 13px",borderRadius:20,
                    border:`1.5px solid ${activeFilter===f.key?"#2d3436":"#dfe6e9"}`,
                    background:activeFilter===f.key?"#2d3436":"white",
                    color:activeFilter===f.key?"white":"#636e72",
                    cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:4}}>
            {f.color&&<span style={{width:8,height:8,borderRadius:"50%",background:f.color,display:"inline-block"}}/>}
            {f.label}
          </button>
        ))}
      </div>

      {/* 범례 바 */}
      <div style={{display:"flex",gap:8,padding:"9px 24px",background:"white",
                   borderBottom:"1px solid #eee",flexWrap:"wrap",alignItems:"center"}}>
        {legend.map(leg=>(
          <div key={leg.id}
            onClick={()=>{setTempLeg(JSON.parse(JSON.stringify(legend)));setLegModal(true);}}
            style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#636e72",
                    cursor:"pointer",padding:"3px 8px",borderRadius:20,border:"1px solid transparent"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#f0f0f0";e.currentTarget.style.borderColor="#dfe6e9";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
            <div style={{width:12,height:12,borderRadius:3,background:leg.color,flexShrink:0}}/>
            {leg.name} <span style={{fontSize:9,opacity:0.4}}>✏️</span>
          </div>
        ))}
        <button
          onClick={()=>{setTempLeg(JSON.parse(JSON.stringify(legend)));setLegModal(true);setTimeout(addLegRow,80);}}
          style={{padding:"3px 10px",borderRadius:20,border:"1.5px dashed #b2bec3",
                  background:"transparent",cursor:"pointer",fontSize:11,color:"#636e72"}}>
          + 항목 추가
        </button>
      </div>

      {/* 간트 테이블 */}
      <div style={{overflowX:"auto",padding:"20px 24px 40px"}}>
        <table style={{borderCollapse:"collapse",width:"100%",minWidth:1050}}>
          <thead>
            <tr>
              <th style={th("120px","center")}>Project</th>
              <th style={th("200px","left",{paddingLeft:12})}>Program</th>
              {MONTHS.map(m=><th key={m} style={th("auto","center")}>{m}</th>)}
              <th style={th("70px","center")}>관리</th>
            </tr>
          </thead>
          <tbody>
            {visData.length===0&&(
              <tr><td colSpan={16}>
                <div style={{textAlign:"center",padding:40,color:"#b2bec3"}}>
                  <div style={{fontSize:36}}>📭</div>
                  <div style={{marginTop:10}}>프로젝트가 없습니다. 위에서 추가해보세요!</div>
                </div>
              </td></tr>
            )}
            {visData.map(proj=>{
              const pi=proj._i;
              return [
                ...proj.rows.map((row,ri)=>(
                  <tr key={`${pi}-${ri}`} style={{borderTop:ri===0?"3px solid #dfe6e9":"none"}}
                    onMouseEnter={e=>Array.from(e.currentTarget.cells).forEach(td=>td.style.background="#fafbfc")}
                    onMouseLeave={e=>Array.from(e.currentTarget.cells).forEach(td=>td.style.background="")}>
                    {ri===0&&(
                      <td rowSpan={proj.rows.length+1} style={{
                        fontSize:11,fontWeight:700,textAlign:"center",background:"#f8f9fa",
                        borderRight:"2px solid #dfe6e9",borderBottom:"1px solid #f0f0f0",
                        padding:"6px",lineHeight:1.5,verticalAlign:"middle",
                        color:proj.color,borderLeft:`4px solid ${proj.color}`}}>
                        {proj.proj.split("\n").map((t,i)=><div key={i}>{t}</div>)}
                        <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                          <Btn sm v="edit" onClick={()=>{setTempProj({name:proj.proj.replace("\n"," "),color:proj.color});setProjModal({idx:pi});}}>✏️ 수정</Btn>
                          <Btn sm v="danger" onClick={()=>delProject(pi)}>🗑️ 삭제</Btn>
                        </div>
                      </td>
                    )}
                    <td style={{fontSize:12,padding:"2px 12px",whiteSpace:"nowrap",background:"white",
                                borderRight:"1px solid #eee",borderBottom:"1px solid #f0f0f0",verticalAlign:"middle"}}>
                      {row.prog}
                    </td>
                    <td colSpan={12} style={{position:"relative",height:30,background:"white",
                                            borderBottom:"1px solid #f0f0f0",padding:0}}>
                      {ri===0&&<>
                        <div style={{position:"absolute",top:0,bottom:0,left:`${todayPct}%`,
                                     width:2,background:"#e17055",zIndex:5,pointerEvents:"none"}}/>
                        <div style={{position:"absolute",top:1,left:`${todayPct}%`,fontSize:9,
                                     color:"#e17055",fontWeight:700,transform:"translateX(-50%)",
                                     pointerEvents:"none",whiteSpace:"nowrap"}}>오늘</div>
                      </>}
                      {row.bars.map((bar,bi)=>(
                        <div key={bi}
                          style={{position:"absolute",top:"50%",transform:"translateY(-50%)",height:17,
                                  borderRadius:3,left:pct(bar.s),width:wPct(bar.s,bar.e),
                                  background:catColor(legend,bar.cat),
                                  display:"flex",alignItems:"center",justifyContent:"center",
                                  cursor:"pointer",zIndex:2}}
                          onMouseEnter={e=>setTooltip({x:e.clientX,y:e.clientY,
                            text:`${proj.proj.replace("\n"," ")} · ${row.prog}`+
                                 (catName(legend,bar.cat)?` [${catName(legend,bar.cat)}]`:"")+
                                 (bar.l?` · ${bar.l}`:"")})}
                          onMouseMove={e=>setTooltip(t=>t?{...t,x:e.clientX,y:e.clientY}:null)}
                          onMouseLeave={()=>setTooltip(null)}>
                          <span style={{fontSize:9,color:"white",fontWeight:700,
                                        overflow:"hidden",padding:"0 4px",whiteSpace:"nowrap"}}>
                            {bar.l||""}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td style={{textAlign:"center",background:"white",borderBottom:"1px solid #f0f0f0",
                                whiteSpace:"nowrap",verticalAlign:"middle",padding:"2px 4px"}}>
                      <Btn sm v="edit" style={{marginRight:3}}
                        onClick={()=>{setTempProg({name:row.prog,bars:JSON.parse(JSON.stringify(row.bars)),
                          newBar:{s:"",e:"",l:"",cat:legend[0]?.id||null}});setProgModal({pi,ri});}}>✏️</Btn>
                      <Btn sm v="danger" onClick={()=>delProgram(pi,ri)}>🗑️</Btn>
                    </td>
                  </tr>
                )),
                <tr key={`${pi}-add`}>
                  <td colSpan={14} style={{padding:"4px 10px 6px",background:"#f0fff8",borderBottom:"1px solid #f0f0f0"}}>
                    <button
                      onClick={()=>{setTempProg({name:"",bars:[],newBar:{s:"",e:"",l:"",cat:legend[0]?.id||null}});setProgModal({pi});}}
                      style={{width:"100%",padding:5,fontSize:11,border:"1.5px dashed #b2bec3",
                              borderRadius:5,background:"transparent",cursor:"pointer",color:"#636e72"}}
                      onMouseEnter={e=>{e.target.style.borderColor="#00b894";e.target.style.color="#00b894";}}
                      onMouseLeave={e=>{e.target.style.borderColor="#b2bec3";e.target.style.color="#636e72";}}>
                      ＋ 사업 추가
                    </button>
                  </td>
                </tr>
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* 툴팁 */}
      {tooltip&&(
        <div style={{position:"fixed",left:tooltip.x+14,top:tooltip.y-40,background:"#2d3436",
                     color:"white",padding:"8px 12px",borderRadius:7,fontSize:11,
                     pointerEvents:"none",zIndex:9999,boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
                     lineHeight:1.7,maxWidth:280}}>
          {tooltip.text}
        </div>
      )}

      {/* 프로젝트 모달 */}
      <Modal open={!!projModal} onClose={()=>setProjModal(null)}
        title={projModal?.idx==null?"프로젝트 추가":"프로젝트 수정"}>
        <FG label="프로젝트명">
          <Inp value={tempProj.name} placeholder="예: TMI 프로젝트 (바보의나눔)"
            onChange={e=>setTempProj(p=>({...p,name:e.target.value}))} />
        </FG>
        <FG label="대표 색상">
          <ColorPicker value={tempProj.color} onChange={c=>setTempProj(p=>({...p,color:c}))} />
        </FG>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
          <Btn v="cancel" onClick={()=>setProjModal(null)}>취소</Btn>
          <Btn v="primary" onClick={saveProject}>저장</Btn>
        </div>
      </Modal>

      {/* 사업 모달 */}
      <Modal open={!!progModal} onClose={()=>setProgModal(null)}
        title={progModal?.ri==null
          ?`사업 추가 — ${data[progModal?.pi]?.proj.replace("\n"," ")||""}`
          :`사업 수정 — ${data[progModal?.pi]?.proj.replace("\n"," ")||""}`}>
        <FG label="사업(프로그램)명">
          <Inp value={tempProg.name} placeholder="예: 참여자 모집, 선발"
            onChange={e=>setTempProg(p=>({...p,name:e.target.value}))} />
        </FG>
        <FG label="등록된 일정">
          <div style={{border:"1.5px solid #dfe6e9",borderRadius:8,overflow:"hidden",minHeight:44}}>
            {tempProg.bars.length===0
              ?<div style={{padding:12,color:"#b2bec3",fontSize:12,textAlign:"center"}}>일정이 없습니다. 아래에서 추가하세요.</div>
              :tempProg.bars.map((b,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderBottom:"1px solid #f0f0f0"}}>
                  <div style={{width:28,height:14,borderRadius:3,background:catColor(legend,b.cat),flexShrink:0}}/>
                  <div style={{flex:1,fontSize:12}}>
                    {b.s}월 ~ {b.e}월{b.l?` · ${b.l}`:""} <span style={{fontSize:10,color:"#888",fontWeight:600}}>[{catName(legend,b.cat)}]</span>
                  </div>
                  <button onClick={()=>setTempProg(p=>({...p,bars:p.bars.filter((_,j)=>j!==i)}))}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#b2bec3",fontSize:14}}>✕</button>
                </div>
              ))
            }
          </div>
        </FG>
        <div style={{background:"#f8f9fa",borderRadius:8,border:"1px solid #eee",padding:14,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#636e72",marginBottom:4}}>＋ 일정 추가</div>
          <div style={{fontSize:11,color:"#b2bec3",marginBottom:12}}>월/일 형식으로 입력하세요 (예: 3/11)</div>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <div style={{flex:1}}>
              <label style={{fontSize:12,fontWeight:600,color:"#636e72",display:"block",marginBottom:4}}>시작일</label>
              <Inp value={tempProg.newBar.s} type="text" placeholder="예: 3/11"
                onChange={e=>setTempProg(p=>({...p,newBar:{...p.newBar,s:e.target.value}}))} />
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:12,fontWeight:600,color:"#636e72",display:"block",marginBottom:4}}>종료일</label>
              <Inp value={tempProg.newBar.e} type="text" placeholder="예: 4/18"
                onChange={e=>setTempProg(p=>({...p,newBar:{...p.newBar,e:e.target.value}}))} />
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,fontWeight:600,color:"#636e72",display:"block",marginBottom:4}}>
              표시 텍스트 <span style={{fontWeight:400,color:"#b2bec3"}}>(비우면 날짜가 자동으로 표시)</span>
            </label>
            <Inp value={tempProg.newBar.l} placeholder="예: 모집 중 (비우면 3/11~4/18 자동 표시)"
              onChange={e=>setTempProg(p=>({...p,newBar:{...p.newBar,l:e.target.value}}))} />
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color:"#636e72",display:"block",marginBottom:6}}>구분 선택</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {legend.map(leg=>(
                <div key={leg.id} onClick={()=>setTempProg(p=>({...p,newBar:{...p.newBar,cat:leg.id}}))}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:20,
                          border:`2px solid ${tempProg.newBar.cat===leg.id?"#2d3436":"#eee"}`,
                          cursor:"pointer",fontSize:11,fontWeight:600,background:"white",
                          boxShadow:tempProg.newBar.cat===leg.id?"0 2px 6px rgba(0,0,0,0.12)":"none"}}>
                  <div style={{width:10,height:10,borderRadius:3,background:leg.color,flexShrink:0}}/>
                  {leg.name}
                </div>
              ))}
            </div>
          </div>
          <Btn v="add" onClick={addTempBar} style={{width:"100%",padding:8,fontSize:12}}>+ 이 일정 추가</Btn>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn v="cancel" onClick={()=>setProgModal(null)}>취소</Btn>
          <Btn v="primary" onClick={saveProgram}>저장</Btn>
        </div>
      </Modal>

      {/* 범례 모달 */}
      <Modal open={legendModal} onClose={()=>setLegModal(false)} title="🎨 범례 관리" wide>
        <p style={{fontSize:12,color:"#888",marginBottom:16,lineHeight:1.6}}>
          항목명과 색상을 자유롭게 수정하세요. 저장하면 팀 전체에 즉시 반영됩니다.
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
          {tempLeg.map((leg,li)=>(
            <div key={leg.id} style={{display:"flex",alignItems:"flex-start",gap:10,
                                      padding:"12px 14px",background:"#f8f9fa",borderRadius:8,border:"1px solid #eee"}}>
              <div style={{paddingTop:6,minWidth:180}}>
                <ColorPicker value={leg.color} onChange={c=>setTempLeg(l=>l.map((x,i)=>i===li?{...x,color:c}:x))} />
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:"#888",fontWeight:600,display:"block",marginBottom:4}}>항목명</label>
                <Inp value={leg.name} placeholder="항목명"
                  onChange={e=>setTempLeg(l=>l.map((x,i)=>i===li?{...x,name:e.target.value}:x))} />
              </div>
              <Btn sm v="danger" onClick={()=>delLegRow(li)} style={{marginTop:24}}>🗑️</Btn>
            </div>
          ))}
        </div>
        <Btn v="add" onClick={addLegRow} style={{width:"100%",padding:9,fontSize:12,marginBottom:4}}>+ 항목 추가</Btn>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <Btn v="cancel" onClick={()=>setLegModal(false)}>취소</Btn>
          <Btn v="primary" onClick={saveLegend}>저장</Btn>
        </div>
      </Modal>

    </div>
  );
}

function th(w,align,extra) {
  return {fontSize:11,fontWeight:600,color:"#636e72",padding:"6px 4px",
          borderBottom:"2px solid #dfe6e9",background:"white",textAlign:align,
          whiteSpace:"nowrap",width:w,...extra};
}
