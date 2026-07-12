// Sdílené vykreslení statistik pro stats.html (samostatná stránka) i overlay ve hře
// (index.html, kiosk ovládaný gamepadem). Čte stejný localStorage jako ukládání her.
(function(global){
  const STORE_KEY='drwedding-games';
  function loadGames(){
    try{ const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]'); return Array.isArray(v)?v:[]; }
    catch(e){ console.warn('Statistiky se nepodařilo načíst:',e); return []; }
  }

  function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function fmtDur(ms){ const s=Math.round(ms/1000), m=(s/60)|0, ss=String(s%60).padStart(2,'0'); return m>0 ? m+' m '+ss+' s' : ss+' s'; }
  function fmtTime(ts){ const d=new Date(ts); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  function dayKey(ts){ const d=new Date(ts); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function fmtDayLabel(k){
    const [y,m,d]=k.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('cs-CZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  }
  function plural(n,one,few,many){ return n===1?one : (n>=2&&n<=4)?few : many; }

  // Vykreslí statistiky do prvku `el`. Vrátí ovladač { next, prev, refresh, page, pages }
  // pro externí (gamepad) ovládání. opts.standalone → zpětný odkaz + tlačítko na smazání
  // (na samostatné stránce). V overlay režimu se smazání i odkaz vynechají.
  function mount(el, opts){
    opts = opts||{};
    const standalone = !!opts.standalone;
    const backLink = standalone ? '<div class="back"><a href="index.html">← Zpět do hry</a></div>' : '';
    let order, groups, overall, page;

    function init(){
      const games=loadGames();
      games.sort((a,b)=> b.startedAt-a.startedAt);   // nejnovější první
      page=0;
      if(games.length===0){
        order=[]; groups=new Map(); overall='';
        el.innerHTML='<h1>DR. WEDDING<small>STATISTIKY</small></h1>'
          +'<p class="empty">Zatím žádné dohrané hry.<br>Zahraj si a vrať se sem. 💍</p>'+backLink;
        return;
      }
      // celkový souhrn napříč všemi dny
      let tWL=0,tWR=0,tDraw=0,tAI=0,tTime=0,tLongest=0;
      for(const g of games){
        if(g.winner==='L') tWL++; else if(g.winner==='R') tWR++; else tDraw++;
        if(g.vsAI) tAI++;
        tTime+=g.durationMs;
        if(g.durationMs>tLongest) tLongest=g.durationMs;
      }
      overall='<div class="overall"><div class="big">'
        +'<div><span class="v win-L">'+tWL+'</span><span class="l">Ženich</span></div>'
        +'<div><span class="v total">'+games.length+'</span><span class="l">'+plural(games.length,'hra','hry','her')+' celkem</span></div>'
        +'<div><span class="v win-R">'+tWR+'</span><span class="l">Nevěsta</span></div>'
        +'</div><div class="meta">celkem odehráno <b>'+fmtDur(tTime)+'</b>'
        +' · nejdelší hra <b>'+fmtDur(tLongest)+'</b>'
        +' · vs počítač <b>'+tAI+'×</b>'
        +(tDraw? ' · remízy <b>'+tDraw+'×</b>' : '')+'</div></div>';
      // seskupení po dnech (sestupně, protože hry jsou seřazené sestupně)
      order=[]; groups=new Map();
      for(const g of games){ const k=dayKey(g.startedAt); if(!groups.has(k)){ groups.set(k,[]); order.push(k); } groups.get(k).push(g); }
      draw();
    }

    function draw(){
      if(!order.length) return;
      const key=order[page], rows=groups.get(key);
      let wL=0,wR=0,dCount=0,ai=0,total=0;
      for(const g of rows){ if(g.winner==='L') wL++; else if(g.winner==='R') wR++; else dCount++; if(g.vsAI) ai++; total+=g.durationMs; }

      const head='<h1>DR. WEDDING<small>STATISTIKY</small></h1>'+overall
        +'<div class="nav">'
        +'<button id="sNewer"'+(page<=0?' disabled':'')+'>‹ Novější</button>'
        +'<span class="day">'+esc(fmtDayLabel(key))+'</span>'
        +'<button id="sOlder"'+(page>=order.length-1?' disabled':'')+'>Starší ›</button>'
        +'</div>'
        +'<div class="pageno">den '+(page+1)+' / '+order.length+'</div>'
        +'<div class="sum">'+rows.length+' '+plural(rows.length,'hra','hry','her')
        +' · ženich <b>'+wL+'×</b> · nevěsta <b>'+wR+'×</b>'
        +(dCount? ' · remízy <b>'+dCount+'×</b>' : '')
        +' · vs počítač <b>'+ai+'×</b> · celkem odehráno <b>'+fmtDur(total)+'</b></div>';

      let table='<table><thead><tr>'
        +'<th>Začátek</th><th class="dur">Trvání</th><th class="vir">Starosti</th><th>Režim</th>'
        +'<th title="ženich : nevěsta">Skóre Ž:N</th><th>Vítěz</th>'
        +'</tr></thead><tbody>';
      for(const g of rows){
        const win = g.winner==='L' ? '<span class="win-L">Ženich</span>'
          : g.winner==='R' ? '<span class="win-R">Nevěsta</span>'
          : '<span>Remíza</span>';
        const sL=g.scoreL==null?'–':g.scoreL, sR=g.scoreR==null?'–':g.scoreR;
        table+='<tr>'
          +'<td>'+fmtTime(g.startedAt)+'</td>'
          +'<td class="dur">'+fmtDur(g.durationMs)+'</td>'
          +'<td class="vir">'+g.viruses+' ('+(g.level>=6?'hardcore':'úroveň '+g.level)+')</td>'
          +'<td>'+(g.vsAI?'vs počítač':'dva hráči')+'</td>'
          +'<td class="score"><span class="sL win-L">'+sL+'</span> : <span class="sR win-R">'+sR+'</span></td>'
          +'<td>'+win+'</td>'
          +'</tr>';
      }
      table+='</tbody></table>';

      const actions = standalone ? '<div class="actions"><button id="sClear" class="danger">🗑 Vymazat statistiky</button></div>' : '';
      el.innerHTML=head+table+actions+backLink;

      const older=el.querySelector('#sOlder'), newer=el.querySelector('#sNewer');
      if(older) older.onclick=()=>ctrl.next();
      if(newer) newer.onclick=()=>ctrl.prev();
      const clr=el.querySelector('#sClear');
      if(clr) clr.onclick=()=>{
        if(confirm('Opravdu smazat všechny statistiky? Tuto akci nelze vrátit.')){
          try{ localStorage.removeItem(STORE_KEY); }catch(e){}
          el.scrollTop=0; init();
        }
      };
    }

    const ctrl = {
      next(){ if(order && page<order.length-1){ page++; draw(); el.scrollTop=0; return true; } return false; },   // starší den
      prev(){ if(order && page>0){ page--; draw(); el.scrollTop=0; return true; } return false; },                // novější den
      refresh(){ init(); },
      get page(){ return page; },
      get pages(){ return order ? order.length : 0; },
    };
    init();
    return ctrl;
  }

  global.StatsView = { mount, loadGames, STORE_KEY };
})(this);
