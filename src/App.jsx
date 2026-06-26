import { useState, useEffect, useCallback, useRef } from "react";

// ── Supabase 설정 ──────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const TABLE = "yv_data";
const STORAGE_KEY = "gantt_v2";

// ── 상수 ──────────────────────────────────────────────
const NCOLS = 12;
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const PRESET_COLORS = [
  "#27ae60","#e67e22","#2980b9","#16a085","#8e44ad","#c0392b",
  "#f39c12","#e84393","#636e72","#00b894","#0984e3","#6c5ce7",
  "#fd79a8","#00cec9","#fdcb6e","#e17055","#2d3436","#74b9ff",
];
const THIS_YEAR = new Date().getFullYear();
const TODAY_MONTH = new Date().getMonth() + 1;
const YEARS = Array.from({length:10}, (_,i) => THIS_YEAR + i); // 올해~10년

const DEFAULT_LEGEND = [
  { id:"plan",    name:"기획/준비",     color:"#27ae60" },
  { id:"recruit", name:"모집/선발",     color:"#e67e22" },
  { id:"run",     name:"진행/운영",     color:"#2980b9" },
  { id:"edu",     name:"교육",          color:"#16a085" },
  { id:"event",   name:"행사/무대",     color:"#8e44ad" },
  { id:"result",  name:"결과/모니터링", color:"#c0392b" },
];

// 연도별 기본 데이터 (2026만 샘플, 나머지는 빈 프로젝트 구조)
function makeDefaultYearData(year) {
  if (year === 2026) return [
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
  return []; // 다른 연도는 빈 배열
}

function makeDefaultAllData() {
  const obj = {};
  YEARS.forEach(y => { obj[y] = makeDefaultYearData(y); });
  return obj;
}

// ── Supabase ──────────────────────────────────────────
const sbHeaders = {
  "Content-Type":"application/json",
  "apikey":SUPABASE_KEY,
  "Authorization":`Bearer ${SUPABASE_KEY}`,
};
async function dbGet() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.${STORAGE_KEY}&select=value`,{headers:sbHeaders});
    const rows = await res.json();
    if(rows?.length>0) return JSON.parse(rows[0].value);
    return null;
  } catch { return null; }
}
async function dbSet(payload) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`,{
      method:"POST",
      headers:{...sbHeaders,"Prefer":"resolution=merge-duplicates"},
      body:JSON.stringify({key:STORAGE_KEY,value:JSON.stringify(payload)}),
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

const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
function dateToMonthFloat(month,day) { return month + (day-1)/DAYS_IN_MONTH[month-1]; }
function parseDate(str) {
  const m = str.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
  if(!m) return null;
  const month=parseInt(m[1]),day=parseInt(m[2]);
  if(month<1||month>12||day<1||day>31) return null;
  return dateToMonthFloat(month,day);
}
function monthFloatToLabel(mf) {
  const month=Math.floor(mf);
  const day=Math.round((mf-month)*DAYS_IN_MONTH[Math.min(month,12)-1])+1;
  return `${month}/${day}`;
}

// ── 공통 컴포넌트 ──────────────────────────────────────
function Modal({open,onClose,title,children,wide}) {
  if(!open) return null;
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
function FG({label,children}) {
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
function Btn({children,onClick,v="primary",sm,style}) {
  const S={
    primary:{background:"#00b894",color:"white"},
    secondary:{background:"rgba(255,255,255,0.15)",color:"white",border:"1px solid rgba(255,255,255,0.3)"},
    legend:{background:"#fdcb6e",color:"#2d3436"},
    cancel:{background:"#f5f6fa",color:"#636e72",border:"1.5px solid #dfe6e9"},
    danger:{background:"#fab1a0",color:"#2d3436"},
    add:{background:"#55efc4",color:"#2d3436"},
    edit:{background:"#74b9ff",color:"#2d3436"},
  };
  return <button onClick={onClick} style={{
    padding:sm?"4px 10px":"7px 16px",borderRadius:sm?5:7,border:"none",
    cursor:"pointer",fontSize:sm?11:12,fontWeight:600,transition:"all 0.15s",...S[v],...style
  }}>{children}</button>;
}
function ColorPicker({value,onChange}) {
  const [hex,setHex]=useState(value||"#27ae60");
  useEffect(()=>setHex(value||"#27ae60"),[value]);
  const apply=c=>{setHex(c);onChange(c);};
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
function SaveBadge({s}) {
  const m={idle:{t:"",c:"transparent"},saving:{t:"저장 중...",c:"#74b9ff"},saved:{t:"✓ 저장됨",c:"#00b894"},error:{t:"⚠ 저장 실패",c:"#e17055"}};
  const x=m[s]||m.idle;
  return <span style={{fontSize:11,color:x.c,marginLeft:8,transition:"color 0.3s"}}>{x.t}</span>;
}

// ── 메인 ──────────────────────────────────────────────
export default function App() {
  const [legend,setLegend]       = useState(DEFAULT_LEGEND);
  const [allData,setAllData]     = useState(makeDefaultAllData()); // { 2026:[...], 2027:[...], ... }
  const [loading,setLoading]     = useState(true);
  const [saveStatus,setSave]     = useState("idle");
  const [activeYear,setActiveYear] = useState(THIS_YEAR);
  const [activeFilter,setFilter] = useState("all");
  const [tooltip,setTooltip]     = useState(null);

  const [projModal,setProjModal] = useState(null);
  const [progModal,setProgModal] = useState(null);
  const [legendModal,setLegModal]= useState(false);
  const [tempProj,setTempProj]   = useState({name:"",color:PRESET_COLORS[0]});
  const [tempProg,setTempProg]   = useState({name:"",bars:[],newBar:{s:"",e:"",l:"",cat:null}});
  const [tempLeg,setTempLeg]     = useState([]);
  const saveTimer = useRef(null);
  const swipeRef = useRef({active:false, startX:0, startYear:null});
  const chartRef = useRef(null);
  const firstYearColRef = useRef(null);
  const activeYearRef = useRef(activeYear);
  const rafRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 3.0;
  const cellWidth = Math.round(64 * zoom);
  const MIN_CELL = 36;
  const MAX_CELL = 120;
  const [barEditModal, setBarEditModal] = useState(null); // {pi,ri,bi}
  const [tempBar, setTempBar] = useState(null);
  const dragRowRef = useRef(null); // {pi, ri}
  const [dragOver, setDragOver] = useState(null); // {pi, ri}

  // 현재 연도 데이터
  const data = allData[activeYear] || [];

  useEffect(()=>{
    (async()=>{
      const stored = await dbGet();
      if(stored?.allData) setAllData({...makeDefaultAllData(),...stored.allData});
      else if(stored?.data) {
        // 구버전 마이그레이션
        const migrated = makeDefaultAllData();
        migrated[2026] = stored.data;
        setAllData(migrated);
      }
      if(stored?.legend) setLegend(stored.legend);
      setLoading(false);
    })();
  },[]);

  useEffect(()=>{
    const id=setInterval(async()=>{
      const stored=await dbGet();
      if(stored?.allData) setAllData({...makeDefaultAllData(),...stored.allData});
      if(stored?.legend)  setLegend(stored.legend);
    },30000);
    return ()=>clearInterval(id);
  },[]);

  const save=useCallback((ad,l)=>{
    if(saveTimer.current) clearTimeout(saveTimer.current);
    setSave("saving");
    saveTimer.current=setTimeout(async()=>{
      const ok=await dbSet({allData:ad,legend:l});
      setSave(ok?"saved":"error");
      setTimeout(()=>setSave("idle"),2500);
    },700);
  },[]);

  function upData(newYearData) {
    const next={...allData,[activeYear]:newYearData};
    setAllData(next); save(next,legend);
  }
  function upLeg(l) { setLegend(l); save(allData,l); }

  // 연도 변경시 필터 초기화
  function changeYear(y) {
    activeYearRef.current = y;
    setActiveYear(y);
    setFilter("all");
    if(chartRef.current && firstYearColRef.current) {
      const firstCellLeft = firstYearColRef.current.offsetLeft;
      const cw = firstYearColRef.current.offsetWidth || cellWidth;
      const idx = YEARS.indexOf(y);
      chartRef.current.scrollTo({left: firstCellLeft + idx * 12 * cw, behavior:"smooth"});
    }
  }

  // 프로젝트
  function saveProject() {
    if(!tempProj.name.trim()) return alert("프로젝트명을 입력하세요.");
    const next=[...data];
    if(projModal.idx==null) next.push({proj:tempProj.name.trim(),color:tempProj.color,rows:[]});
    else next[projModal.idx]={...next[projModal.idx],proj:tempProj.name.trim(),color:tempProj.color};
    upData(next); setProjModal(null); setFilter("all");
  }
  function delProject(pi) {
    if(!confirm(`"${data[pi].proj.replace("\n"," ")}" 프로젝트를 삭제할까요?`)) return;
    upData(data.filter((_,i)=>i!==pi)); setFilter("all");
  }

  // 사업
  function addTempBar() {
    const sRaw=tempProg.newBar.s.trim(), eRaw=tempProg.newBar.e.trim();
    let s=parseDate(sRaw), e=parseDate(eRaw);
    if(e!==null){const em=Math.floor(e);e=e+1/DAYS_IN_MONTH[Math.min(em,12)-1];}
    if(s===null||e===null) return alert("날짜를 올바르게 입력하세요.\n예: 시작 3/11, 종료 4/18");
    if(s>=e) return alert("시작일이 종료일보다 늦습니다.");
    if(!tempProg.newBar.cat) return alert("구분을 선택하세요.");
    const label=tempProg.newBar.l.trim()||`${sRaw}~${eRaw}`;
    setTempProg(p=>({...p,bars:[...p.bars,{s,e,cat:p.newBar.cat,l:label}],newBar:{s:"",e:"",l:"",cat:p.newBar.cat}}));
  }
  function saveProgram() {
    if(!tempProg.name.trim()) return alert("사업명을 입력하세요.");
    const next=data.map(p=>({...p,rows:[...p.rows]}));
    const row={prog:tempProg.name.trim(),bars:tempProg.bars};
    if(progModal.ri!=null) {
      next[progModal.pi].rows[progModal.ri]=row; // 수정
    } else if(progModal.insertAfter!=null) {
      next[progModal.pi].rows.splice(progModal.insertAfter+1,0,row); // 중간 삽입
    } else {
      next[progModal.pi].rows.push(row); // 맨 뒤 추가
    }
    upData(next); setProgModal(null);
  }
  function delProgram(pi,ri) {
    if(!confirm(`"${data[pi].rows[ri].prog}"를 삭제할까요?`)) return;
    upData(data.map((p,i)=>i!==pi?p:{...p,rows:p.rows.filter((_,j)=>j!==ri)}));
  }
  function moveProgram(pi,ri,dir) {
    const next=data.map(p=>({...p,rows:[...p.rows]}));
    const rows=next[pi].rows;
    const newRi=ri+dir;
    if(newRi<0||newRi>=rows.length) return;
    [rows[ri],rows[newRi]]=[rows[newRi],rows[ri]];
    upData(next);
  }
  function handleDragStart(pi,ri) { dragRowRef.current={pi,ri}; }
  function handleDragOver(e,pi,ri) { e.preventDefault(); setDragOver({pi,ri}); }
  function handleDrop(pi,ri) {
    const from=dragRowRef.current;
    if(!from||from.pi!==pi||from.ri===ri) { setDragOver(null); dragRowRef.current=null; return; }
    const next=data.map(p=>({...p,rows:[...p.rows]}));
    const rows=next[pi].rows;
    const [moved]=rows.splice(from.ri,1);
    rows.splice(ri,0,moved);
    upData(next);
    setDragOver(null); dragRowRef.current=null;
  }
  function handleDragEnd() { setDragOver(null); dragRowRef.current=null; }

  // 바 수정 모달 열기
  function openBarEdit(pi,ri,bi,y) {
    const bar=(allData[y]||[])?.[pi]?.rows?.[ri]?.bars?.[bi];
    if(!bar) return;
    setTempBar({...bar, pi, ri, bi, year:y,
      sStr: monthFloatToLabel(bar.s),
      eStr: monthFloatToLabel(bar.e - 1/DAYS_IN_MONTH[Math.min(Math.floor(bar.e),12)-1])
    });
    setBarEditModal({pi,ri,bi,year:y});
  }
  function saveBarEdit() {
    const s=parseDate(tempBar.sStr), eRaw=parseDate(tempBar.eStr);
    if(s===null||eRaw===null) return alert("날짜를 올바르게 입력하세요.");
    const eMonth=Math.floor(eRaw);
    const e=eRaw+1/DAYS_IN_MONTH[Math.min(eMonth,12)-1];
    if(s>=e) return alert("시작일이 종료일보다 늦습니다.");
    const y=barEditModal.year;
    const next={...allData};
    next[y]=next[y].map(p=>({...p,rows:[...p.rows]}));
    next[y][barEditModal.pi].rows[barEditModal.ri].bars[barEditModal.bi]={
      ...tempBar, s, e, l:tempBar.l, cat:tempBar.cat
    };
    setAllData(next); save(next,legend);
    setBarEditModal(null); setTempBar(null);
  }
  function deleteBarEdit() {
    if(!confirm("이 일정을 삭제할까요?")) return;
    const y=barEditModal.year;
    const next={...allData};
    next[y]=next[y].map(p=>({...p,rows:[...p.rows]}));
    next[y][barEditModal.pi].rows[barEditModal.ri].bars.splice(barEditModal.bi,1);
    setAllData(next); save(next,legend);
    setBarEditModal(null); setTempBar(null);
  }

  function openAddProgramAt(pi,afterRi) {
    setTempProg({name:"",bars:[],newBar:{s:"",e:"",l:"",cat:legend[0]?.id||null},insertAfter:afterRi});
    setProgModal({pi,insertAfter:afterRi});
  }

  // 범례
  function saveLegend(){upLeg(tempLeg);setLegModal(false);}
  function addLegRow(){setTempLeg(l=>[...l,{id:uid(),name:"새 항목",color:PRESET_COLORS[Math.floor(Math.random()*PRESET_COLORS.length)]}]);}
  function delLegRow(li){
    const leg=tempLeg[li];
    const used=data.some(p=>p.rows.some(r=>r.bars.some(b=>b.cat===leg.id)));
    if(used&&!confirm(`"${leg.name}"은 사용 중입니다. 삭제 시 해당 일정이 회색으로 표시됩니다. 계속할까요?`)) return;
    setTempLeg(l=>l.filter((_,i)=>i!==li));
  }

  const totalProg=data.reduce((a,b)=>a+b.rows.length,0);
  const isCurrentYear=activeYear===THIS_YEAR;
  const activeCount=isCurrentYear?data.reduce((s,p)=>s+p.rows.filter(r=>r.bars.some(b=>b.s<=TODAY_MONTH&&b.e>=TODAY_MONTH)).length,0):0;
  const todayPct=((TODAY_MONTH-1)/NCOLS*100).toFixed(2);
  // 행 기준: 2026 데이터(baseData)를 행으로 사용. 필터는 activeYear 데이터 기준.
  const baseData = allData[THIS_YEAR] || [];
  const visData = activeFilter==="all"
    ? baseData.map((p,i)=>({...p,_i:i}))
    : baseData.map((p,i)=>({...p,_i:i})).filter(p=>p._i===parseInt(activeFilter));

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:16}}>
      <div style={{fontSize:40}}>📋</div>
      <div style={{fontSize:14,color:"#636e72"}}>데이터를 불러오는 중...</div>
    </div>
  );

  return (
    <div style={{fontSize:13,color:"#2d3436",background:"#f5f6fa",minHeight:"100vh"}}>

      {/* 헤더 */}
      <div style={{background:"#2d3436",color:"white",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontSize:18,fontWeight:700}}>📋 사업 일정 대시보드</div>
          <div style={{fontSize:11,opacity:0.5,marginTop:3,display:"flex",alignItems:"center",gap:8}}>
            YouthVoice · 연간 사업 계획
            <span style={{background:"#00b894",color:"white",padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:600,opacity:1}}>🔗 실시간 공유</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <SaveBadge s={saveStatus}/>
          {/* 확대/축소 */}
          <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"4px 8px"}}>
            <button onClick={()=>setZoom(z=>Math.max(MIN_ZOOM,+(z-0.2).toFixed(1)))} title="축소 (Ctrl+스크롤)"
              style={{background:"none",border:"none",color:"white",cursor:"pointer",fontSize:16,lineHeight:1,padding:"0 2px"}}>−</button>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.7)",minWidth:36,textAlign:"center"}}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(MAX_ZOOM,+(z+0.2).toFixed(1)))} title="확대 (Ctrl+스크롤)"
              style={{background:"none",border:"none",color:"white",cursor:"pointer",fontSize:16,lineHeight:1,padding:"0 2px"}}>＋</button>
            <button onClick={()=>setZoom(1.0)} title="100% 초기화"
              style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:10,lineHeight:1,padding:"0 2px"}}>↺</button>
          </div>
          <Btn v="legend" onClick={()=>{setTempLeg(JSON.parse(JSON.stringify(legend)));setLegModal(true);}}>🎨 범례 관리</Btn>
          <Btn v="secondary" onClick={()=>{setTempProj({name:"",color:PRESET_COLORS[0]});setProjModal({});}}>+ 프로젝트 추가</Btn>
        </div>
      </div>

      {/* 연도 탭 — 드래그로 연도 전환 */}
      <div
        style={{background:"#1e272e",display:"flex",alignItems:"center",overflowX:"auto",padding:"0 12px",userSelect:"none",cursor:"grab",scrollbarWidth:"none"}}
        onMouseDown={e=>{
          swipeRef.current={dragging:false,startX:e.clientX,startYear:activeYear};
          e.currentTarget.style.cursor="grabbing";
        }}
        onMouseMove={e=>{
          const ds=swipeRef.current;
          if(ds.startYear==null) return;
          const diff=e.clientX-ds.startX;
          if(Math.abs(diff)>8) ds.dragging=true;
          if(!ds.dragging) return;
          const idx=YEARS.indexOf(ds.startYear);
          const step=Math.round(-diff/80); // 80px당 1년
          const newIdx=Math.max(0,Math.min(YEARS.length-1,idx+step));
          if(YEARS[newIdx]!==activeYear) changeYear(YEARS[newIdx]);
        }}
        onMouseUp={e=>{swipeRef.current={dragging:false,startX:0,startYear:null};e.currentTarget.style.cursor="grab";}}
        onMouseLeave={e=>{swipeRef.current={dragging:false,startX:0,startYear:null};e.currentTarget.style.cursor="grab";}}
        onTouchStart={e=>{swipeRef.current={dragging:false,startX:e.touches[0].clientX,startYear:activeYear};}}
        onTouchMove={e=>{
          const ds=swipeRef.current;
          if(ds.startYear==null) return;
          const diff=e.touches[0].clientX-ds.startX;
          if(Math.abs(diff)>8) ds.dragging=true;
          if(!ds.dragging) return;
          const idx=YEARS.indexOf(ds.startYear);
          const step=Math.round(-diff/80);
          const newIdx=Math.max(0,Math.min(YEARS.length-1,idx+step));
          if(YEARS[newIdx]!==activeYear) changeYear(YEARS[newIdx]);
        }}
        onTouchEnd={()=>{swipeRef.current={dragging:false,startX:0,startYear:null};}}>
        {/* 이전 연도 화살표 */}
        <button onClick={()=>{const i=YEARS.indexOf(activeYear);if(i>0)changeYear(YEARS[i-1]);}}
          disabled={activeYear===YEARS[0]}
          style={{background:"none",border:"none",color:activeYear===YEARS[0]?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)",
                  fontSize:16,cursor:activeYear===YEARS[0]?"default":"pointer",padding:"10px 8px",flexShrink:0}}>‹</button>
        {YEARS.map(y=>{
          const yData=allData[y]||[];
          const hasProg=yData.some(p=>p.rows.length>0);
          return (
            <button key={y}
              onClick={e=>{if(!false)changeYear(y);}}
              style={{padding:"10px 18px",border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
                      whiteSpace:"nowrap",transition:"all 0.2s",borderBottom:"3px solid transparent",
                      background:"transparent",flexShrink:0,
                      color:activeYear===y?"#00b894":"rgba(255,255,255,0.45)",
                      borderBottomColor:activeYear===y?"#00b894":"transparent",
                      transform:activeYear===y?"scale(1.1)":"scale(1)"}}>
              {y}
              {hasProg&&<span style={{marginLeft:5,fontSize:9,background:activeYear===y?"#00b894":"rgba(255,255,255,0.3)",color:"white",borderRadius:8,padding:"1px 5px",fontWeight:600}}>
                {yData.reduce((a,b)=>a+b.rows.length,0)}
              </span>}
            </button>
          );
        })}
        {/* 다음 연도 화살표 */}
        <button onClick={()=>{const i=YEARS.indexOf(activeYear);if(i<YEARS.length-1)changeYear(YEARS[i+1]);}}
          disabled={activeYear===YEARS[YEARS.length-1]}
          style={{background:"none",border:"none",color:activeYear===YEARS[YEARS.length-1]?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)",
                  fontSize:16,cursor:activeYear===YEARS[YEARS.length-1]?"default":"pointer",padding:"10px 8px",flexShrink:0}}>›</button>
      </div>

      {/* 통계 카드 */}
      <div style={{display:"flex",gap:12,padding:"14px 24px",flexWrap:"wrap"}}>
        {[
          {num:data.length,        lbl:`${activeYear}년 프로젝트 수`, c:"#27ae60"},
          {num:totalProg,          lbl:`${activeYear}년 총 사업 수`,  c:"#2980b9"},
          {num:isCurrentYear?activeCount:"—", lbl:isCurrentYear?`현재(${TODAY_MONTH}월) 진행 중`:"해당 없음", c:"#e67e22"},
        ].map(s=>(
          <div key={s.lbl} style={{background:"white",borderRadius:10,padding:"12px 18px",flex:1,minWidth:120,borderLeft:`4px solid ${s.c}`,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.num}</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div style={{display:"flex",gap:8,padding:"10px 24px",background:"white",borderBottom:"1px solid #eee",flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#636e72",fontWeight:600,marginRight:4}}>필터:</span>
        {[{key:"all",label:"전체",color:null},...baseData.map((p,i)=>({key:String(i),label:p.proj.replace("\n"," "),color:p.color}))].map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)}
            style={{padding:"5px 13px",borderRadius:20,border:`1.5px solid ${activeFilter===f.key?"#2d3436":"#dfe6e9"}`,
                    background:activeFilter===f.key?"#2d3436":"white",color:activeFilter===f.key?"white":"#636e72",
                    cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:4}}>
            {f.color&&<span style={{width:8,height:8,borderRadius:"50%",background:f.color,display:"inline-block"}}/>}
            {f.label}
          </button>
        ))}
      </div>

      {/* 범례 바 */}
      <div style={{display:"flex",gap:8,padding:"9px 24px",background:"white",borderBottom:"1px solid #eee",flexWrap:"wrap",alignItems:"center"}}>
        {legend.map(leg=>(
          <div key={leg.id} onClick={()=>{setTempLeg(JSON.parse(JSON.stringify(legend)));setLegModal(true);}}
            style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#636e72",cursor:"pointer",padding:"3px 8px",borderRadius:20,border:"1px solid transparent"}}
            onMouseEnter={e=>{e.currentTarget.style.background="#f0f0f0";e.currentTarget.style.borderColor="#dfe6e9";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="transparent";}}>
            <div style={{width:12,height:12,borderRadius:3,background:leg.color,flexShrink:0}}/>
            {leg.name} <span style={{fontSize:9,opacity:0.4}}>✏️</span>
          </div>
        ))}
        <button onClick={()=>{setTempLeg(JSON.parse(JSON.stringify(legend)));setLegModal(true);setTimeout(addLegRow,80);}}
          style={{padding:"3px 10px",borderRadius:20,border:"1.5px dashed #b2bec3",background:"transparent",cursor:"pointer",fontSize:11,color:"#636e72"}}>
          + 항목 추가
        </button>
      </div>

      {/* 간트 테이블 — 전체 연도 연결, 가로 스크롤 */}
      <div
        ref={chartRef}
        style={{overflowX:"auto",padding:"20px 0 40px"}}
        onWheel={e=>{
          // Ctrl+스크롤 or 트랙패드 핀치줌
          if(e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(z=>+(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z+delta))).toFixed(2));
          }
        }}
        onScroll={e=>{
          const scrollLeft = e.currentTarget.scrollLeft;
          if(rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(()=>{
            try {
              if(!firstYearColRef.current) return;
              const firstCellLeft = firstYearColRef.current.offsetLeft;
              const cellWidth = firstYearColRef.current.offsetWidth;
              if(!cellWidth) return;
              const monthsScrolled = (scrollLeft - firstCellLeft) / cellWidth;
              const yearIdx = Math.max(0, Math.min(YEARS.length-1, Math.floor(monthsScrolled/12)));
              const visibleYear = YEARS[yearIdx];
              if(activeYearRef.current !== visibleYear) {
                activeYearRef.current = visibleYear;
                setActiveYear(visibleYear);
              }
            } catch(e){}
          });
        }}>
        <table style={{borderCollapse:"collapse",tableLayout:"fixed"}}>
          <thead>
            <tr>
              {/* 고정 컬럼 — Project+Program 합쳐서 sticky */}
              <th style={{width:100,minWidth:100,fontSize:11,fontWeight:600,color:"#636e72",padding:"6px 8px",
                          borderBottom:"2px solid #dfe6e9",textAlign:"center",whiteSpace:"nowrap",background:"white",
                          position:"sticky",left:0,zIndex:10,boxShadow:"none"}}>Project</th>
              <th style={{width:180,minWidth:180,fontSize:11,fontWeight:600,color:"#636e72",padding:"6px 8px 6px 12px",
                          borderBottom:"2px solid #dfe6e9",textAlign:"left",whiteSpace:"nowrap",background:"white",
                          position:"sticky",left:100,zIndex:10,boxShadow:"4px 0 8px rgba(0,0,0,0.08)"}}>Program</th>
              {/* 연도×월 헤더 — 전체 렌더 (고정) */}
              {YEARS.map((y,yi)=>
                MONTHS.map((m,mi)=>(
                  <th key={`${y}-${mi}`}
                    ref={yi===0&&mi===0?firstYearColRef:null}
                    style={{
                      ...th(`${cellWidth}px`,"center"),
                      background: y===THIS_YEAR&&mi+1===TODAY_MONTH?"rgba(225,112,85,0.07)":
                                  mi===0?"#f8f9fa":"white",
                      borderLeft: mi===0?"3px solid #b2bec3":"none",
                      color: y===THIS_YEAR&&mi+1===TODAY_MONTH?"#e17055":"#636e72",
                      fontSize:10, whiteSpace:"nowrap",
                    }}>
                    {mi===0
                      ? <><span style={{display:"block",fontSize:Math.max(9,Math.min(11,cellWidth/6)),fontWeight:800,color:"#2d3436"}}>{y}</span>
                         <span style={{fontSize:Math.max(8,Math.min(10,cellWidth/7))}}>{cellWidth>=50?m:`${mi+1}`}</span></>
                      : <span style={{fontSize:Math.max(8,Math.min(10,cellWidth/7))}}>{cellWidth>=50?m:`${mi+1}`}</span>}
                  </th>
                ))
              )}
              <th style={{...th("90px","center"),position:"sticky",right:0,zIndex:10,background:"white",boxShadow:"-2px 0 4px rgba(0,0,0,0.06)"}}>관리</th>
            </tr>
          </thead>
          <tbody>
            {/* 프로젝트별 행 — 현재 연도 기준으로 렌더, 관리는 activeYear 데이터 */}
            {baseData.length===0&&(
              <tr><td colSpan={YEARS.length*12+3}>
                <div style={{textAlign:"center",padding:60,color:"#b2bec3"}}>
                  <div style={{fontSize:40}}>📭</div>
                  <div style={{marginTop:12,fontSize:14}}>프로젝트가 없습니다.</div>
                  <div style={{marginTop:6,fontSize:12}}>위의 "+ 프로젝트 추가" 버튼으로 시작하세요!</div>
                </div>
              </td></tr>
            )}
            {visData.map(proj=>{
              const pi=proj._i;
              return [
                ...proj.rows.map((row,ri)=>(
                  <tr key={`${pi}-${ri}`}
                    draggable
                    onDragStart={()=>handleDragStart(pi,ri)}
                    onDragOver={e=>handleDragOver(e,pi,ri)}
                    onDrop={()=>handleDrop(pi,ri)}
                    onDragEnd={handleDragEnd}
                    style={{borderTop:"none",
                            background:dragOver?.pi===pi&&dragOver?.ri===ri?"#e8f8f5":"",
                            transition:"background 0.1s"}}
                    onMouseEnter={e=>Array.from(e.currentTarget.cells).forEach(td=>{if(!td.dataset.sticky&&!dragRowRef.current)td.style.background="#f0f8ff";})}
                    onMouseLeave={e=>Array.from(e.currentTarget.cells).forEach(td=>{if(!td.dataset.sticky)td.style.background="transparent";})}>
                    {/* 프로젝트 셀 (고정) */}
                    {ri===0&&(
                      <td data-sticky="1" rowSpan={proj.rows.length+1} style={{
                        width:100,minWidth:100,fontSize:11,fontWeight:700,textAlign:"center",background:"#f8f9fa",
                        border:"none",borderLeft:`4px solid ${proj.color}`,
                        padding:"6px",lineHeight:1.5,verticalAlign:"middle",
                        color:proj.color,
                        position:"sticky",left:0,zIndex:3}}>
                        {proj.proj.split("\n").map((t,i)=><div key={i}>{t}</div>)}
                        <div style={{marginTop:6,display:"flex",justifyContent:"center",gap:4}}>
                          <button title="수정" onClick={()=>{setTempProj({name:proj.proj.replace("\n"," "),color:proj.color});setProjModal({idx:pi});}}
                            style={{background:"#74b9ff",border:"none",borderRadius:4,cursor:"pointer",padding:"3px 6px",fontSize:12}}>✏️</button>
                          <button title="삭제" onClick={()=>delProject(pi)}
                            style={{background:"#fab1a0",border:"none",borderRadius:4,cursor:"pointer",padding:"3px 6px",fontSize:12}}>🗑️</button>
                        </div>
                      </td>
                    )}
                    {/* 사업명 셀 (고정) */}
                    <td data-sticky="1" style={{width:180,minWidth:180,fontSize:12,padding:"2px 12px",whiteSpace:"nowrap",background:"white",
                        border:"none",verticalAlign:"middle",
                        position:"sticky",left:100,zIndex:3,boxShadow:"4px 0 8px rgba(0,0,0,0.08)"}}>
                      {row.prog}
                    </td>
                    {/* 연도×월 바 셀 */}
                    {YEARS.map((y,yi)=>
                      MONTHS.map((m,mi)=>{
                        const isToday=y===THIS_YEAR&&mi+1===TODAY_MONTH;
                        const isYearStart=mi===0;
                        // 이 셀의 월 범위: [mi+1, mi+2) in float
                        const cellS=mi+1, cellE=mi+2;
                        return (
                          <td key={`${y}-${mi}`} style={{
                            position:"relative",height:36,padding:0,
                            borderBottom:"none",
                            borderLeft:isYearStart?"2px solid #dfe6e9":"none",
                            background:isToday?"rgba(225,112,85,0.07)":"transparent",
                            minWidth:cellWidth,width:cellWidth,
                          }}>
                            {/* 오늘 세로선 */}
                            {isToday&&ri===0&&<>
                              <div style={{position:"absolute",top:0,bottom:0,left:`${((TODAY_MONTH-1)/1)*0+50}%`,width:2,background:"#e17055",zIndex:5,pointerEvents:"none"}}/>
                            </>}
                            {/* 해당 연도·월에 걸치는 바 렌더 */}
                            {((allData[y]||[])?.[pi]?.rows?.[ri]?.bars||[]).map((bar,bi)=>{
                              const overlapS=Math.max(bar.s,cellS);
                              const overlapE=Math.min(bar.e,cellE);
                              if(overlapS>=overlapE) return null;
                              const leftPct=((overlapS-cellS)/(cellE-cellS)*100).toFixed(2);
                              const widthPct=((overlapE-overlapS)/(cellE-cellS)*100).toFixed(2);
                              return (
                                <div key={bi} style={{
                                  position:"absolute",top:"50%",transform:"translateY(-50%)",
                                  height:20,borderRadius:4,
                                  left:`${leftPct}%`,width:`${widthPct}%`,
                                  background:catColor(legend,bar.cat),
                                  display:"flex",alignItems:"center",justifyContent:"center",
                                  cursor:"pointer",zIndex:2,overflow:"visible",
                                  boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}
                                  onClick={()=>openBarEdit(pi,ri,bi,y)}
                                  onMouseEnter={e=>setTooltip({x:e.clientX,y:e.clientY,
                                    text:`[${y}] ${proj.proj.replace("\n"," ")} · ${row.prog}`+
                                         (catName(legend,bar.cat)?` [${catName(legend,bar.cat)}]`:"")+
                                         (bar.l?` · ${bar.l}`:"")+" (클릭하여 수정)"})}
                                  onMouseMove={e=>setTooltip(t=>t?{...t,x:e.clientX,y:e.clientY}:null)}
                                  onMouseLeave={()=>setTooltip(null)}>
                                  {overlapS===bar.s&&bar.l&&<span style={{fontSize:10,color:"white",fontWeight:600,padding:"0 6px",whiteSpace:"nowrap",letterSpacing:"-0.2px"}}>{bar.l}</span>}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })
                    )}
                    {/* 관리 셀 (고정) */}
                    <td data-sticky="1" style={{textAlign:"center",background:"white",borderBottom:"none",
                        whiteSpace:"nowrap",verticalAlign:"middle",padding:"2px 4px",
                        position:"sticky",right:0,zIndex:3,boxShadow:"-2px 0 4px rgba(0,0,0,0.04)"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                        <span title="드래그하여 순서 변경" style={{cursor:"grab",fontSize:13,color:"#b2bec3",padding:"0 2px",userSelect:"none"}}>⠿</span>
                        <button title="아래에 사업 추가" onClick={()=>openAddProgramAt(pi,ri)}
                          style={{background:"#55efc4",border:"none",borderRadius:4,cursor:"pointer",padding:"2px 5px",fontSize:11}}>＋</button>
                        <button title="수정" onClick={()=>{setTempProg({name:row.prog,bars:JSON.parse(JSON.stringify(row.bars)),newBar:{s:"",e:"",l:"",cat:legend[0]?.id||null}});setProgModal({pi,ri});}}
                          style={{background:"#74b9ff",border:"none",borderRadius:4,cursor:"pointer",padding:"2px 5px",fontSize:11}}>✏️</button>
                        <button title="삭제" onClick={()=>delProgram(pi,ri)}
                          style={{background:"#fab1a0",border:"none",borderRadius:4,cursor:"pointer",padding:"2px 5px",fontSize:11}}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )),
                <tr key={`${pi}-add`}>
                  <td colSpan={YEARS.length*12+3} style={{padding:"4px 10px 8px",background:"#f8f9fa",borderTop:"2px solid #dfe6e9",borderBottom:"2px solid #dfe6e9"}}>
                    <button onClick={()=>{setTempProg({name:"",bars:[],newBar:{s:"",e:"",l:"",cat:legend[0]?.id||null}});setProgModal({pi});}}
                      style={{width:"100%",padding:5,fontSize:11,border:"1.5px dashed #b2bec3",borderRadius:5,background:"transparent",cursor:"pointer",color:"#636e72"}}
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
        <div style={{position:"fixed",left:tooltip.x+14,top:tooltip.y-40,background:"#2d3436",color:"white",
                     padding:"8px 12px",borderRadius:7,fontSize:11,pointerEvents:"none",zIndex:9999,
                     boxShadow:"0 4px 12px rgba(0,0,0,0.2)",lineHeight:1.7,maxWidth:280}}>
          {tooltip.text}
        </div>
      )}

      {/* 바 수정 모달 */}
      <Modal open={!!barEditModal} onClose={()=>{setBarEditModal(null);setTempBar(null);}} title="일정 수정">
        {tempBar&&<>
          <FG label="시작일">
            <Inp value={tempBar.sStr} placeholder="예: 3/11"
              onChange={e=>setTempBar(b=>({...b,sStr:e.target.value}))} />
          </FG>
          <FG label="종료일">
            <Inp value={tempBar.eStr} placeholder="예: 4/18"
              onChange={e=>setTempBar(b=>({...b,eStr:e.target.value}))} />
          </FG>
          <FG label="표시 텍스트">
            <Inp value={tempBar.l||""} placeholder="예: 3/11~4/18"
              onChange={e=>setTempBar(b=>({...b,l:e.target.value}))} />
          </FG>
          <FG label="구분">
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:4}}>
              {legend.map(leg=>(
                <div key={leg.id} onClick={()=>setTempBar(b=>({...b,cat:leg.id}))}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:20,
                          border:`2px solid ${tempBar.cat===leg.id?"#2d3436":"#eee"}`,
                          cursor:"pointer",fontSize:11,fontWeight:600,background:"white",
                          boxShadow:tempBar.cat===leg.id?"0 2px 6px rgba(0,0,0,0.12)":"none"}}>
                  <div style={{width:10,height:10,borderRadius:3,background:leg.color,flexShrink:0}}/>
                  {leg.name}
                </div>
              ))}
            </div>
          </FG>
          <div style={{display:"flex",gap:10,justifyContent:"space-between",marginTop:20}}>
            <Btn v="danger" onClick={deleteBarEdit}>🗑️ 삭제</Btn>
            <div style={{display:"flex",gap:10}}>
              <Btn v="cancel" onClick={()=>{setBarEditModal(null);setTempBar(null);}}>취소</Btn>
              <Btn v="primary" onClick={saveBarEdit}>저장</Btn>
            </div>
          </div>
        </>}
      </Modal>

      {/* 프로젝트 모달 */}
      <Modal open={!!projModal} onClose={()=>setProjModal(null)} title={projModal?.idx==null?`${activeYear}년 프로젝트 추가`:`프로젝트 수정`}>
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
        title={progModal?.ri==null?`사업 추가 — ${data[progModal?.pi]?.proj.replace("\n"," ")||""}`:`사업 수정 — ${data[progModal?.pi]?.proj.replace("\n"," ")||""}`}>
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
                    {monthFloatToLabel(b.s)}~{monthFloatToLabel(b.e)}{b.l?` · ${b.l}`:""} <span style={{fontSize:10,color:"#888",fontWeight:600}}>[{catName(legend,b.cat)}]</span>
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
              표시 텍스트 <span style={{fontWeight:400,color:"#b2bec3"}}>(비우면 날짜 자동 표시)</span>
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
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
          {tempLeg.map((leg,li)=>(
            <div key={leg.id} style={{background:"#f8f9fa",borderRadius:10,border:"1px solid #eee",overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px 8px"}}>
                <div style={{width:20,height:20,borderRadius:5,background:leg.color,flexShrink:0,border:"2px solid rgba(0,0,0,0.08)"}}/>
                <div style={{flex:1}}>
                  <Inp value={leg.name} placeholder="항목명 입력" style={{fontWeight:600,fontSize:14}}
                    onChange={e=>setTempLeg(l=>l.map((x,i)=>i===li?{...x,name:e.target.value}:x))} />
                </div>
                <Btn sm v="danger" onClick={()=>delLegRow(li)}>🗑️</Btn>
              </div>
              <div style={{padding:"0 14px 12px"}}>
                <div style={{fontSize:11,color:"#b2bec3",fontWeight:600,marginBottom:6}}>색상 선택</div>
                <ColorPicker value={leg.color} onChange={c=>setTempLeg(l=>l.map((x,i)=>i===li?{...x,color:c}:x))} />
              </div>
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
