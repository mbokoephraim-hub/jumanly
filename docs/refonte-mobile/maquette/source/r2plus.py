# Recruteur lot 2, v2 du 19/10 : écrans enrichis (calendrier, Orbi, pleine page). Chargé par recruteur2.py.
CSSR += '''
.mini-c{display:flex;gap:10px;align-items:center;padding:10px 12px}
.mini-c .av{width:40px;height:40px;font-size:12.5px;box-shadow:none;color:#0F3F37}
.mini-c .t{flex:1;min-width:0}.mini-c .t b{display:block;font-size:13.5px}.mini-c .t span{font-size:11.5px;color:var(--texte2)}
.ring{--p:84;width:44px;height:44px;border-radius:50%;flex:none;display:grid;place-items:center;background:conic-gradient(#2FD3A6 calc(var(--p)*1%),var(--piste) 0)}
.ring b{width:34px;height:34px;border-radius:50%;background:var(--plein);display:grid;place-items:center;font-size:11px;font-weight:700}
.modes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.modes a{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:12.5px;font-weight:600}
.modes a .cases{width:36px;height:36px;border-radius:12px}
.modes a.on{background:#0F3F37;color:#fff;box-shadow:0 10px 22px -12px rgba(15,63,55,.7)}
.modes a.on .cases{background:var(--g-accent)!important;color:#0F3F37}
.sombre .modes a.on{background:var(--lime);color:#0F3F37}
.durees{display:flex;gap:8px}.durees span{flex:1;text-align:center;padding:9px 0;border-radius:14px;background:var(--plein);box-shadow:var(--verre);font-size:12.5px;font-weight:600}
.durees span.on{background:var(--g-accent);color:#0F3F37}
.calm{padding:12px 12px 10px;display:flex;flex-direction:column;gap:8px}
.calm .mh{display:flex;align-items:center;gap:8px}.calm .mh b{flex:1;font-size:14.5px}
.calm .mh a{width:30px;height:30px;border-radius:50%;background:var(--zone);display:grid;place-items:center}
.calm .mh a .ic{width:14px;height:14px}.calm .mh a.g .ic{transform:rotate(180deg)}
.calm .g7m{display:grid;grid-template-columns:repeat(7,1fr);row-gap:4px;text-align:center}
.calm .g7m i{font-style:normal;font-size:10.5px;font-weight:700;color:var(--texte2);padding-bottom:2px}
.calm .g7m span{position:relative;height:40px;display:grid;place-items:center;font-size:13px;font-weight:500;border-radius:12px}
.calm .g7m span.d-off{color:var(--texte2);opacity:.45}
.calm .g7m span.d-auj{box-shadow:inset 0 0 0 1.5px var(--texte)}
.calm .g7m span.d-sel{background:#0F3F37;color:#fff;font-weight:700}
.sombre .calm .g7m span.d-sel{background:var(--lime);color:#0F3F37}
.calm .g7m span.d-lib::after{content:"";position:absolute;bottom:4px;width:5px;height:5px;border-radius:50%;background:#2FD3A6}
.calm .g7m span.d-pl::after{content:"";position:absolute;bottom:4px;width:5px;height:5px;border-radius:50%;background:#F2B33D}
.calm .lg{display:flex;gap:14px;font-size:11px;color:var(--texte2)}.calm .lg em{font-style:normal;display:inline-flex;align-items:center;gap:5px}
.calm .lg em::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--c)}
.jour-g{display:flex;flex-direction:column;padding:12px 12px 12px 8px;gap:0}
.jour-g .h{display:flex;align-items:center;gap:8px;padding:0 0 8px 4px}.jour-g .h b{flex:1;font-size:14px}
.jour-g .pr{display:flex;gap:4px}.jour-g .pr .av{width:24px;height:24px;font-size:9px;box-shadow:0 0 0 2px var(--plein);color:#0F3F37}
.jg{position:relative;display:grid;grid-template-columns:40px 1fr;height:300px}
.jg .hr{display:flex;flex-direction:column;justify-content:space-between;font-size:10.5px;color:var(--texte2);padding:0 0 0 2px}
.jg .zone{position:relative;border-left:1px solid var(--trait);background:repeating-linear-gradient(to bottom,transparent 0,transparent 36.5px,var(--trait) 36.5px,var(--trait) 37.5px)}
.jg .blk{position:absolute;left:6px;right:6px;border-radius:12px;padding:6px 10px;font-size:11.5px;line-height:1.3;display:flex;flex-direction:column}
.jg .blk b{font-size:12px}
.jg .occ{background:repeating-linear-gradient(135deg,var(--zone) 0 6px,transparent 6px 12px);box-shadow:inset 0 0 0 1px var(--trait);color:var(--texte2)}
.jg .cr{background:var(--g-accent);color:#0F3F37;box-shadow:0 8px 18px -10px rgba(47,211,166,.9)}
.jg .cr2{background:#0F3F37;color:#fff}.sombre .jg .cr2{background:#C8F59E;color:#0F3F37}
.jg .sug{background:var(--plein);box-shadow:inset 0 0 0 1.5px #2FD3A6;color:var(--texte)}
.jg .now{position:absolute;left:0;right:0;height:2px;background:var(--corail)}.jg .now::before{content:"";position:absolute;left:-4px;top:-3px;width:8px;height:8px;border-radius:50%;background:var(--corail)}
.orbi-l{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:18px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE);font-size:12.5px;line-height:1.4}
.sombre .orbi-l{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.orbi-l .t{flex:1}.orbi-l b{font-weight:600}
.recap-b{position:absolute;left:12px;right:12px;bottom:26px;z-index:4;display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:999px}
.recap-b .t{flex:1;font-size:12px;color:var(--texte2)}.recap-b .t b{display:block;font-size:13.5px;color:var(--texte)}
.recap-b .bt{height:46px;padding:0 22px}
.inv2{padding:0;overflow:hidden;display:flex;flex-direction:column}
.inv2 .ban{height:64px;position:relative}.inv2 .ban svg{width:100%;height:100%}
.inv2 .ban .lg-e{position:absolute;left:14px;bottom:-18px;width:44px;height:44px;font-size:13px;box-shadow:0 0 0 3px var(--plein)}
.inv2 .c{padding:24px 14px 14px;display:flex;flex-direction:column;gap:10px}
.inv2 .k{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#2E8540}
.inv2 h3{font-size:16px;line-height:1.3}
.inv2 .ent{font-size:12px;color:var(--texte2);display:flex;gap:6px;align-items:center}
.inv2 .rows{display:flex;flex-direction:column;gap:7px;font-size:12.5px}
.inv2 .rows div{display:flex;gap:9px;align-items:center}.inv2 .rows .ic{width:16px;height:16px;flex:none}
.dts{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.dt{display:flex;gap:10px;align-items:center;padding:8px;border-radius:16px;background:var(--zone)}
.dt.on{background:var(--lime-c);box-shadow:inset 0 0 0 1.5px #2FD3A6}
.dt .cal-t{width:40px;border-radius:10px;overflow:hidden;background:var(--plein);text-align:center;flex:none;box-shadow:0 2px 6px rgba(0,0,0,.08)}
.dt .cal-t i{display:block;font-style:normal;font-size:9px;font-weight:700;background:#E25C4B;color:#fff;padding:2px 0}
.dt .cal-t b{display:block;font-size:16px;padding:2px 0 3px;color:#0F3F37}
.dt .t{font-size:11.5px;color:var(--texte2)}.dt .t b{display:block;font-size:14px;color:var(--texte)}
.inv2 .bts .bt{opacity:.95}
.msg-o{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:20px;background:var(--plein);box-shadow:var(--verre);font-size:13px;line-height:1.5}
.msg-o .k{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--texte2);text-transform:uppercase;letter-spacing:.04em}
.msg-o p{margin:0}
.msg-o mark{background:var(--lime-c);color:inherit;border-radius:5px;padding:0 3px;box-shadow:inset 0 -2px 0 #A6F26B}
.tons{display:flex;gap:6px;flex-wrap:wrap}.tons span{font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:999px;background:var(--zone)}
.tons span.on{background:#0F3F37;color:#fff}.sombre .tons span.on{background:var(--lime);color:#0F3F37}
.chk{display:flex;flex-direction:column;gap:8px;padding:12px 14px}
.chk div{display:flex;gap:10px;align-items:center;font-size:12.5px}
.chk .o{width:22px;height:22px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37;flex:none}.chk .o .ic{width:12px;height:12px}
.chk .o.g{background:var(--zone);color:var(--texte2)}
.tp-cov{position:relative;height:120px;margin:-6px -16px 0;border-radius:0 0 28px 28px;overflow:hidden;background:linear-gradient(130deg,#0F3F37 0%,#14574A 55%,#2FD3A6 130%)}
.tp-cov svg{position:absolute;inset:0;width:100%;height:100%}
.tp-top{position:absolute;top:56px;left:16px;right:16px;z-index:3;display:flex;justify-content:space-between}
.tp-top .bi{background:rgba(255,255,255,.9)}
.tp-id{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;margin-top:-46px;position:relative;z-index:2}
.tp-id .av{width:84px;height:84px;font-size:24px;box-shadow:0 0 0 4px var(--fond),0 12px 24px -12px rgba(15,63,55,.5);color:#0F3F37}
.tp-id h2{font-size:20px;font-weight:600;letter-spacing:-.01em;display:flex;gap:6px;align-items:center}
.tp-id p{font-size:12.5px;color:var(--texte2);display:flex;gap:6px;align-items:center}
.tp-id p .fl{width:18px;height:12px}
.tp-id .k{display:flex;gap:6px;margin-top:4px}
.vis-b{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--ciel-c)}
.vis-b .ic{width:12px;height:12px}
.st4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.st4 div{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px;border-radius:18px;font-size:10.5px;color:#0F3F37;text-align:center;line-height:1.2}
.st4 div b{font-size:18px;font-weight:600}
.st4 .s1{background:var(--g-former)}.st4 .s2{background:var(--g-accomp)}.st4 .s3{background:var(--g-oppo)}.st4 .s4{background:linear-gradient(150deg,#E6F0FB,#9CC3EE)}
.sombre .st4 div{color:var(--texte)}
.pq-o{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:22px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE);font-size:12.5px;line-height:1.45}
.sombre .pq-o{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.pq-o .h{display:flex;align-items:center;gap:10px}.pq-o .h .t{flex:1}.pq-o .h b{display:block;font-size:14px}.pq-o .h span{font-size:11.5px;color:var(--texte2)}
.pq-o .pt{display:flex;gap:8px;align-items:flex-start}.pq-o .pt i{width:20px;height:20px;border-radius:50%;flex:none;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700}
.pq-o .pt i.v{background:#A6F26B;color:#0F3F37}.pq-o .pt i.a{background:#F8CF73;color:#0F3F37}
.cpt-l{display:flex;flex-direction:column;gap:10px;padding:14px}
.cpt-l .r{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center}
.cpt-l .r b{font-size:13px}.cpt-l .pv{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:999px;display:inline-flex;gap:4px;align-items:center}
.cpt-l .pv .ic{width:11px;height:11px}
.pv.at{background:var(--lime-c)}.pv.pj{background:var(--ambre-c)}.pv.dc{background:var(--zone);color:var(--texte2)}.pv.mq{background:var(--corail-c);color:#C24533}
.cpt-l .lv{grid-column:1/-1;display:flex;gap:4px}.cpt-l .lv i{flex:1;height:5px;border-radius:9px;background:var(--piste)}.cpt-l .lv i.on{background:var(--g-accent)}
.cpt-l .hh{display:flex;justify-content:space-between;align-items:center}.cpt-l .hh b{font-size:14px}.cpt-l .hh span{font-size:11.5px;color:var(--texte2)}
.prj{display:flex;gap:10px;overflow:hidden}
.prj .p{flex:0 0 150px;border-radius:18px;overflow:hidden;background:var(--plein);box-shadow:var(--verre)}
.prj .p .im{height:74px;display:grid;place-items:center;color:#0F3F37}
.prj .p .im svg.ill{width:100%;height:100%}
.prj .p div.t{padding:8px 10px;font-size:11.5px;color:var(--texte2)}.prj .p div.t b{display:block;font-size:12.5px;color:var(--texte)}
.xp{display:flex;flex-direction:column;gap:0;padding:12px 14px}
.xp .e{display:flex;gap:10px;position:relative;padding-bottom:10px}
.xp .e:not(:last-child)::before{content:"";position:absolute;left:15px;top:32px;bottom:0;width:2px;background:var(--piste)}
.xp .e .lg-e{width:32px;height:32px;font-size:10px;flex:none}
.xp .e .t{font-size:11.5px;color:var(--texte2)}.xp .e .t b{display:block;font-size:13px;color:var(--texte)}
.parc{display:flex;align-items:center;gap:0;padding:4px 2px}
.parc span{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:9.5px;color:var(--texte2);flex:1;position:relative}
.parc span i{width:14px;height:14px;border-radius:50%;background:#2FD3A6;box-shadow:0 0 0 3px var(--menthe-c);z-index:1}
.parc span.now i{background:#0F3F37;box-shadow:0 0 0 4px #A6F26B}.sombre .parc span.now i{background:#A6F26B;box-shadow:0 0 0 4px rgba(166,242,107,.3)}
.parc span.no i{background:var(--piste);box-shadow:none}
.parc span:not(:last-child)::after{content:"";position:absolute;top:6px;left:50%;width:100%;height:2px;background:#2FD3A6}
.parc span.now::after,.parc span.no::after{background:var(--piste)!important}
.parc span.now{color:var(--texte);font-weight:700}
.evs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.evs div{padding:10px 12px;border-radius:16px;background:var(--zone);font-size:11.5px;color:var(--texte2)}
.evs div b{display:block;font-size:13px;color:var(--texte)}
.evs .n4{display:flex;gap:3px;margin-top:5px}.evs .n4 i{width:16px;height:6px;border-radius:4px;background:var(--piste)}.evs .n4 i.on{background:#0F3F37}.sombre .evs .n4 i.on{background:#A6F26B}
.res3b{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.res3b a{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:12px;border-radius:20px;font-size:12.5px;font-weight:600;line-height:1.25;color:#0F3F37}
.res3b a .cases{width:34px;height:34px;border-radius:11px;background:rgba(255,255,255,.75)}
.res3b a small{font-weight:500;font-size:10.5px;opacity:.8}
.res3b .r1{background:var(--g-former)}.res3b .r2{background:linear-gradient(150deg,#FDEAE6,#F5B3A8)}.res3b .r3{background:linear-gradient(150deg,#F1EEE9,#D9D3CA)}
.res3b a.on{box-shadow:0 0 0 2.5px #0F3F37,0 12px 22px -14px rgba(15,63,55,.6)}
.res3b a.on::after{content:"✓";position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:50%;background:#0F3F37;color:#fff;font-size:11px;display:grid;place-items:center}
.sombre .res3b a{color:#0F3F37}
.vv-c{display:flex;gap:6px;flex-wrap:wrap}
.quota-g{display:flex;flex-direction:column;gap:8px;padding:12px 14px}
.quota-g .h{display:flex;justify-content:space-between;font-size:12.5px}.quota-g .h b{font-size:13.5px}
.quota-g .barre{height:8px}
.off-m{display:flex;gap:10px;align-items:center;padding:10px;overflow:hidden}
.off-m .im{width:64px;height:48px;border-radius:12px;overflow:hidden;flex:none}.off-m .im svg{width:100%;height:100%}
.off-m .t{flex:1;min-width:0}.off-m .t b{display:block;font-size:13.5px}.off-m .t span{font-size:11.5px;color:var(--texte2)}
.wk{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:10px 8px}
.wk span{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 0;border-radius:14px;font-size:10.5px;color:var(--texte2);position:relative}
.wk span b{font-size:15px;color:var(--texte)}
.wk span.sel{background:#0F3F37;color:#C8F59E}.wk span.sel b{color:#fff}
.sombre .wk span.sel{background:var(--lime);color:#0F3F37}.sombre .wk span.sel b{color:#0F3F37}
.wk span em{display:flex;gap:2px;height:5px}.wk span em i{width:5px;height:5px;border-radius:50%;background:#2FD3A6}.wk span em i.a{background:#F2B33D}
.agd{display:flex;flex-direction:column;gap:8px}
.agd .it{display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:stretch}
.agd .it .hh{font-size:12px;font-weight:700;padding-top:12px;text-align:right}.agd .it .hh small{display:block;font-weight:500;color:var(--texte2);font-size:10.5px}
.agd .it .cdg{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);border-left:4px solid #2FD3A6}
.agd .it .cdg.at{border-left-color:#F2B33D}.agd .it .cdg.rp{border-left-color:#E25C4B}
.agd .it .cdg .av{width:36px;height:36px;font-size:11px;box-shadow:none;color:#0F3F37}
.agd .it .cdg .t{flex:1;min-width:0;font-size:11.5px;color:var(--texte2)}.agd .it .cdg .t b{display:block;font-size:13px;color:var(--texte)}
.etq-s{font-size:10px;font-weight:700;padding:3px 7px;border-radius:999px;white-space:nowrap}
.etq-s.ok{background:var(--lime-c);color:#2E6B1F}.etq-s.at{background:var(--ambre-c);color:#8A5A00}.etq-s.rp{background:var(--corail-c);color:#C24533}
.sombre .etq-s.ok{color:#C8F59E}.sombre .etq-s.at{color:#F8CF73}.sombre .etq-s.rp{color:#F5B3A8}
.vv2{display:flex;flex-direction:column;gap:10px;padding:14px}
.vv2 .h{display:flex;gap:10px;align-items:center}.vv2 .h .cases{width:40px;height:40px;border-radius:14px}
.vv2 .h .t{flex:1}.vv2 .h b{display:block;font-size:14px}.vv2 .h span{font-size:11.5px;color:var(--texte2)}
.vv2 .bas{display:flex;align-items:center;gap:8px}.vv2 .bas .sp{flex:1;font-size:11.5px;color:var(--texte2)}
'''

def ring(p, cls=''):
    return f'<span class="ring" style="--p:{p}"><b>{p} %</b></span>'
CK = ic("valider", "xs")

# ---------- Entretien : 1. mode, durée, calendrier ----------
PROG = phone(f'''{tete_f("Proposer un entretien", droite=None)}
<div class="verre mini-c"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>Analyste de données junior · Présélectionnée</span></div>{ring(86)}</div>
<div class="modes"><a class="on"><span class="cases" style="background:var(--g-accomp)">{ic("entretien","s")}</span>Visio</a><a><span class="cases" style="background:var(--g-oppo)">{ic("localisation","s")}</span>Sur site</a><a><span class="cases" style="background:var(--g-former)">{ic("micro","s")}</span>Audio</a></div>
<div class="durees"><span>30 min</span><span class="on">45 min</span><span>1 h</span><span>1 h 30</span></div>
<div class="verre calm"><div class="mh"><a class="g">{ic("suivant","s")}</a><b>Octobre 2026</b><a>{ic("suivant","s")}</a></div>
<div class="g7m"><i>L</i><i>M</i><i>M</i><i>J</i><i>V</i><i>S</i><i>D</i>
<span class="d-off">12</span><span class="d-off">13</span><span class="d-off">14</span><span class="d-off">15</span><span class="d-off">16</span><span class="d-off">17</span><span class="d-off">18</span>
<span class="d-auj d-lib">19</span><span class="d-lib">20</span><span class="d-lib">21</span><span class="d-sel">22</span><span class="d-pl">23</span><span class="d-lib">24</span><span class="d-off">25</span>
<span class="d-off">26</span><span class="d-lib">27</span><span class="d-lib">28</span><span class="d-pl">29</span><span class="d-lib">30</span><span class="d-lib">31</span><span class="d-off">1</span></div>
<div class="lg"><em style="--c:#2FD3A6">Équipe libre</em><em style="--c:#F2B33D">Peu de place</em><em style="--c:#0F3F37">Choisi</em></div></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> a lu vos agendas : Nadia et Olivier sont libres mardi 22 et jeudi 24 le matin.</div></div>
<div class="verre liste lignes"><div class="li"><span class="pr" style="display:flex"><span class="av" style="width:30px;height:30px;font-size:10px;color:#0F3F37">NK</span><span class="av b" style="width:30px;height:30px;font-size:10px;margin-left:-8px;color:#0F3F37">OB</span></span><div class="t"><b>Participants</b><span>Nadia K., Olivier B.</span></div><a class="bt sec s">{ic("plus","xs")}Inviter</a></div></div>''', avec_nav=False,
 bas=f'<div class="verre fort recap-b"><div class="t"><b>Mardi 22 octobre</b>Choisissez les heures</div><a class="bt p">Heures</a></div>')

# ---------- Entretien : 2. journée et créneaux ----------
PROG2 = phone(f'''{tete_f("Mardi 22 octobre", droite="agenda")}
<div class="verre wk"><span>L<b>20</b><em><i></i></em></span><span>M<b>21</b><em><i></i></em></span><span class="sel">M<b>22</b><em><i></i><i></i></em></span><span>J<b>23</b><em><i class="a"></i></em></span><span>V<b>24</b><em><i></i></em></span><span>S<b>25</b><em></em></span><span>D<b>26</b><em></em></span></div>
<div class="verre jour-g"><div class="h"><b>Disponibilités de l’équipe</b><span class="pr"><span class="av">NK</span><span class="av b">OB</span></span></div>
<div class="jg"><div class="hr"><span>09:00</span><span>10:00</span><span>11:00</span><span>12:00</span><span>13:00</span><span>14:00</span><span>15:00</span><span>16:00</span></div>
<div class="zone">
<div class="blk cr" style="top:38px;height:56px"><b>Créneau 1 · 10:00</b>45 min · visio</div>
<div class="blk occ" style="top:100px;height:52px"><b>Olivier occupé</b>Comité crédit</div>
<div class="blk occ" style="top:168px;height:36px"><b>Pause déjeuner</b></div>
<div class="blk cr2" style="top:204px;height:56px"><b>Créneau 2 · 14:30</b>45 min · visio</div>
<div class="now" style="top:20px"></div></div></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Ajouter un 3e choix : <b>jeudi 24 à 9:00</b>, toute l’équipe est libre.</div><a class="bt sec s">Ajouter</a></div>
<div class="verre chk"><div><span class="o">{CK}</span>Fuseau de Grâce : Kinshasa (UTC+1), comme vous</div><div><span class="o">{CK}</span>Lien de visio créé après sa confirmation</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort recap-b"><div class="t"><b>2 créneaux sur 3</b>22 oct. · 10:00 et 14:30</div><a class="bt p">Aperçu</a></div>')

# ---------- Entretien : 3. aperçu de l'invitation ----------
INV_AP = phone(f'''{tete_f("Aperçu de l’invitation", droite=None)}
<span class="ck-t">Ce que Grâce reçoit sur son téléphone</span>
<div class="verre inv2"><div class="ban">{BAN["baobab"]}<span class="lg-e sap">BF</span></div><div class="c">
<span class="k">Invitation à un entretien</span><h3>Analyste de données junior</h3>
<span class="ent">Baobab Fintech <span class="verif">{ic("valider","xs")}Vérifiée</span></span>
<div class="rows"><div>{ic("entretien","s")}Visio, 45 min · lien envoyé après confirmation</div><div>{ic("candidats","s")}Avec Nadia K. (RH) et Olivier B. (équipe data)</div></div>
<div class="dts"><div class="dt on"><span class="cal-t"><i>MAR</i><b>22</b></span><div class="t"><b>10:00</b>octobre</div></div><div class="dt"><span class="cal-t"><i>MAR</i><b>22</b></span><div class="t"><b>14:30</b>octobre</div></div></div>
<div class="bts"><a class="bt p m pl">Confirmer</a><a class="bt sec m">Autre date</a></div></div></div>
<div class="msg-o"><span class="k">{orbi(18)}Message préparé par Orbi, à relire</span><p>Bonjour Grâce, votre <mark>projet Power BI pour trois agences</mark> nous a convaincus. Nous aimerions en parler avec vous.</p><div class="tons"><span class="on">Chaleureux</span><span>Plus court</span><span>Formel</span><span>{ic("modifier","xs")} Écrire moi-même</span></div></div>
<div class="verre chk"><div><span class="o">{CK}</span>Notification et e-mail à Grâce</div><div><span class="o">{CK}</span>Rappel automatique la veille</div><div><span class="o">{CK}</span>Invitation agenda (.ics) après confirmation</div></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Modifier</a><a class="bt p pl">{ic("envoyer","s")}Envoyer l’invitation</a></div>')

# ---------- Entretiens : agenda ----------
AGENDA = phone(f'''{tete_f("Entretiens", droite="plus")}
<div class="seg"><span class="on">Semaine</span><span>Mois</span><span>À évaluer · 2</span></div>
<div class="verre wk"><span>L<b>20</b><em></em></span><span>M<b>21</b><em></em></span><span class="sel">M<b>22</b><em><i></i><i></i></em></span><span>J<b>23</b><em><i class="a"></i></em></span><span>V<b>24</b><em><i class="a"></i></em></span><span>S<b>25</b><em></em></span><span>D<b>26</b><em></em></span></div>
<div class="grp-t">Mardi 22 octobre</div>
<div class="agd">
<div class="it"><span class="hh">10:00<small>45 min</small></span><div class="cdg"><span class="av b">GM</span><div class="t"><b>Grâce M.</b>Analyste de données · visio</div><span class="etq-s ok">Confirmé</span></div></div>
<div class="it"><span class="hh">14:30<small>45 min</small></span><div class="cdg"><span class="av a">AM</span><div class="t"><b>Amani M.</b>Analyste de données · visio</div><span class="etq-s ok">Confirmé</span></div></div></div>
<div class="grp-t">Jeudi 23 octobre</div>
<div class="agd">
<div class="it"><span class="hh">14:30<small>1 h</small></span><div class="cdg at"><span class="av">JT</span><div class="t"><b>Joël T.</b>Chargé de clientèle · sur site</div><span class="etq-s at">Sans réponse</span></div></div>
<div class="it"><span class="hh">—</span><div class="cdg rp"><span class="av b">PK</span><div class="t"><b>Patrick K.</b>Propose jeudi 24 à 11:00</div><span class="etq-s rp">Autre date</span></div></div></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Préparer l’entretien de Grâce</b> : 3 questions liées à l’offre sont prêtes.</div><a class="bt p s">Ouvrir</a></div>''', 'aujourdhui', 'long')

# ---------- Profil d'un talent ----------
COV = '<svg viewBox="0 0 390 120" preserveAspectRatio="none"><g fill="none" stroke="rgba(166,242,107,.35)"><circle cx="330" cy="10" r="40"/><circle cx="330" cy="10" r="70"/><circle cx="330" cy="10" r="100"/></g><circle cx="330" cy="10" r="9" fill="#A6F26B"/></svg>'
TPROF = phone(f'''<div class="tp-cov">{COV}</div>
<div class="tp-id"><span class="av">RB</span><h2>Ruth B.</h2><p>Analyste BI · 2 ans · {FLAG["cd"]} Kinshasa</p>
<div class="k"><span class="stp pub">Disponible</span><span class="stp val">CDI, CDD</span><span class="vis-b">{ic("profil","xs")}Profil visible</span></div></div>
<div class="st4"><div class="s1"><b>2 ans</b>d’expérience</div><div class="s2"><b>5</b>compétences</div><div class="s3"><b>3</b>preuves</div><div class="s4"><b>2</b>projets</div></div>
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Avec « Analyste de données junior »</b><span>Calcul fixe · Orbi explique</span></div>{ring(84)}</div>
<div class="pt"><i class="v">✓</i><span>SQL et Power BI requis : prouvés par une attestation et un projet.</span></div>
<div class="pt"><i class="v">✓</i><span>Kinshasa, CDI accepté, disponible maintenant.</span></div>
<div class="pt"><i class="a">!</i><span>Python souhaité : non indiqué. À vérifier en entretien.</span></div>
<a class="pq">{ic("pourquoi","xs")}Voir le détail du score</a></div>
<div class="verre cpt-l"><div class="hh"><b>Compétences de l’offre</b><span>3 requises sur 3</span></div>
<div class="r"><b>SQL</b><span class="pv at">{ic("certificat","xs")}Attestation</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span></div>
<div class="r"><b>Power BI</b><span class="pv pj">{ic("realisation","xs")}Projet</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></span></div>
<div class="r"><b>Excel</b><span class="pv dc">Déclarée</span><span class="lv"><i class="on"></i><i class="on"></i><i></i><i></i></span></div>
<div class="r"><b>Python</b><span class="pv mq">Non indiquée</span></div></div>
<div class="sec-t"><h2>Projets</h2><a>Tout voir</a></div>
<div class="prj"><div class="p"><div class="im" style="background:var(--g-former)">{ic("progression")}</div><div class="t"><b>Tableau de bord ventes</b>Power BI · 3 agences</div></div><div class="p"><div class="im" style="background:var(--g-accomp)">{ic("document")}</div><div class="t"><b>Nettoyage de données</b>SQL · 40 000 lignes</div></div></div>
<div class="sec-t"><h2>Parcours</h2></div>
<div class="verre xp"><div class="e"><span class="lg-e amb">KC</span><div class="t"><b>Analyste BI · Kivu Conseil</b>2024 à aujourd’hui · Kinshasa</div></div><div class="e"><span class="lg-e sap">UK</span><div class="t"><b>Licence en statistiques</b>Université de Kinshasa · 2023</div></div></div>
<div class="consult">{ic("confidentialite","s")}Ruth a rendu son profil visible. Votre consultation est enregistrée.</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">{ic("favori","s")}Vivier</a><a class="bt p pl">{ic("message","s")}Proposer l’offre</a></div>')
TPROF = TPROF.replace('<div class="tp-cov">', f'<div class="tp-top">{bi("retour")}{bi("plus-options")}</div><div class="tp-cov">', 1)

# ---------- Proposer l'offre ----------
CONTACT = phone(f'''{tete_f("Proposer l’offre", droite=None)}
<div class="verre mini-c"><span class="av">RB</span><div class="t"><b>Ruth B.</b><span>Analyste BI · Kinshasa · disponible</span></div>{ring(84)}</div>
<span class="lab-c">Offre proposée</span>
<div class="verre off-m"><span class="im">{BAN["baobab"]}</span><div class="t"><b>Analyste de données junior</b><span>CDI · Hybride · limite 31 oct.</span></div><a class="bt sec s">Changer</a></div>
<span class="lab-c">Message</span>
<div class="msg-o"><span class="k">{orbi(18)}Personnalisé par Orbi, à relire</span><p>Bonjour Ruth, votre <mark>attestation SQL</mark> et votre <mark>tableau de bord Power BI</mark> correspondent à ce que nous cherchons pour ce poste. L’offre vous intéresse-t-elle ? Je serais heureuse d’en parler.</p>
<div class="tons"><span class="on">Chaleureux</span><span>Plus court</span><span>Formel</span><span>{ic("modifier","xs")} Modifier</span></div></div>
<div class="verre liste lignes"><div class="li"><span class="cases c3">{ic("offre","s")}</span><div class="t"><b>Joindre l’annonce</b><span>Ruth peut postuler en un geste</span></div><span class="sw on"></span></div></div>
<div class="verre quota-g"><div class="h"><b>Propositions ce mois</b><span>6 sur 10</span></div><span class="barre"><i style="width:60%"></i></span></div>
<div class="consult">{ic("confidentialite","s")}Ruth décide. Son contact n’est visible que si elle accepte.</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Annuler</a><a class="bt p pl">{ic("envoyer","s")}Envoyer à Ruth</a></div>')

# ---------- Décision finale ----------
DECIS = phone(f'''{tete_f("Décision finale", droite=None)}
<div class="verre carte" style="padding:12px 14px;display:flex;flex-direction:column;gap:10px">
<div class="mini-c" style="padding:0"><span class="av">JT</span><div class="t"><b>Joël T.</b><span>Chargé de clientèle · entretien le 23 oct.</span></div>{ring(71)}</div>
<div class="parc"><span><i></i>Reçue</span><span><i></i>Examen</span><span><i></i>Présél.</span><span><i></i>Entretien</span><span class="now"><i></i>Décision</span></div></div>
<div class="evs"><div><b>Relation client</b>Olivier B.<span class="n4"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span></div><div><b>Connaissance produit</b>Nadia K.<span class="n4"><i class="on"></i><i class="on"></i><i></i><i></i></span></div></div>
<span class="lab-c">Résultat</span>
<div class="res3b"><a class="r1"><span class="cases">{ic("valider","s")}</span>Retenue<small>Offre d’emploi</small></a><a class="r2 on"><span class="cases">{ic("fermer","s")}</span>Non retenue<small>Message respectueux</small></a><a class="r3"><span class="cases">{ic("deconnexion","s")}</span>Retrait<small>Le candidat se retire</small></a></div>
<div class="msg-o"><span class="k">{orbi(18)}Orbi a préparé le message, à relire</span><p>Bonjour Joël, merci pour notre échange du 23 octobre. Nous avons retenu un autre profil. Nous avons apprécié <mark>votre écoute des clients</mark> et aimerions garder contact pour une prochaine offre.</p>
<div class="tons"><span class="on">Respectueux</span><span>Plus court</span><span>Modèle d’origine</span></div></div>
<div class="verre liste lignes"><div class="li"><span class="cases c2">{ic("favori","s")}</span><div class="t"><b>Ajouter au vivier « Relation client »</b><span>Joël en est informé</span></div><span class="sw on"></span></div></div>
<div class="gar">{ic("horloge","s")}Rien n’est automatique : vous confirmez, et vous pouvez annuler pendant 10 minutes.</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Plus tard</a><a class="bt p pl">Confirmer et envoyer</a></div>')

# ---------- Préparer et évaluer : remplis ----------
PREP_R = phone(f'''{tete_f("Préparer l’entretien", droite=None)}
<div class="verre carte" style="padding:12px 14px;display:flex;flex-direction:column;gap:10px">
<div class="mini-c" style="padding:0"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>Analyste de données junior</span></div>{ring(86)}</div>
<div class="dts"><div class="dt on"><span class="cal-t"><i>MAR</i><b>22</b></span><div class="t"><b>10:00</b>visio, 45 min</div></div><div class="dt"><span class="cal-t" style="background:var(--g-accomp)"><i style="background:#0F3F37">AVEC</i><b style="font-size:11px;padding:5px 0">NK OB</b></span><div class="t"><b>2 personnes</b>Nadia, Olivier</div></div></div></div>
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Ce qu’il faut vérifier</b><span>D’après l’offre et le dossier</span></div></div>
<div class="pt"><i class="v">✓</i><span>Power BI : projet pour 3 agences, demander le résultat obtenu.</span></div>
<div class="pt"><i class="a">!</i><span>Python : déclaré, sans preuve.</span></div></div>
<div class="sec-t"><h2>Questions proposées</h2><a>{ic("plus","xs")} Ajouter</a></div>
<div class="q-o"><b>Racontez un tableau de bord qui a changé une décision.</b><small>Power BI · indispensable</small></div>
<div class="q-o"><b>Comment vérifiez-vous la qualité d’une donnée ?</b><small>SQL · indispensable</small></div>
<div class="q-o"><b>Quel script Python avez-vous écrit récemment ?</b><small>Python · à vérifier</small></div>
<div class="gar">{ic("confidentialite","s")}Jamais de question sur l’âge, la famille, la santé, la religion ou l’origine.</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">{ic("partager","s")}Partager</a><a class="bt p pl">Ouvrir l’évaluation</a></div>')

EVAL = phone(f'''{tete_f("Évaluation", droite=None)}
<div class="verre mini-c"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>Entretien du 22 oct. · grille de l’offre</span></div>{ring(86)}</div>
<div class="eval">
<div class="c"><b>Analyse de données</b><small>SQL, Power BI, qualité des données</small><div class="notes4"><span>1</span><span>2</span><span class="on">3</span><span>4</span></div></div>
<div class="c"><b>Communication des résultats</b><small>Clarté, pédagogie</small><div class="notes4"><span>1</span><span>2</span><span>3</span><span class="on">4</span></div></div>
<div class="c"><b>Python</b><small>Souhaitée</small><div class="notes4"><span>1</span><span class="on">2</span><span>3</span><span>4</span></div></div>
<div class="c"><b>Avis</b><small>Visible par l’équipe</small><div class="verre saisie" style="box-shadow:none;background:var(--zone)">Très claire, à former sur Python.</div></div></div>
<span class="lab-c">Suite proposée</span>
<div class="res3b"><a class="r3"><span class="cases">{ic("fermer","s")}</span>Ne pas poursuivre</a><a class="r1 on"><span class="cases">{ic("valider","s")}</span>Poursuivre</a><a class="r3" style="background:var(--g-oppo)"><span class="cases">{ic("pourquoi","s")}</span>Hésitation</a></div>
<div class="orbi-l">{orbi(26)}<div class="t">Olivier a aussi évalué : <b>3 et 4 sur 4</b>. Comparer les deux avis ?</div><a class="bt sec s">Comparer</a></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Brouillon</a><a class="bt p pl">Enregistrer</a></div>')

# ---------- Viviers ----------
def vv2(c, icn, t, s_, avs, n):
    a = ''.join(f'<span class="av {k}">{i}</span>' for i, k in avs)
    return f'<div class="verre vv2"><div class="h"><span class="cases" style="background:var(--g-{c})">{ic(icn,"s")}</span><div class="t"><b>{t}</b><span>{s_}</span></div>{ic("suivant","s")}</div><div class="bas"><span class="pile vv" style="padding:0"><span class="pile">{a}</span></span><span class="sp">{n}</span></div></div>'
VIVIERS = phone(f'''{tete_f("Viviers", droite="plus")}
<div class="orbi-l">{orbi(26)}<div class="t"><b>4 talents</b> de « Data junior » correspondent à votre nouvelle offre.</div><a class="bt p s">Voir</a></div>
{vv2("former","cap","Data junior","12 talents · mis à jour hier",[("RB",""),("DK","a"),("SL","b"),("AM","")],"+8 · 3 disponibles")}
{vv2("accomp","message","Relation client","7 talents · 15 oct.",[("JT",""),("MK","b"),("NL","a")],"+4 · 1 disponible")}
{vv2("oppo","document","Conformité","3 talents · 2 oct.",[("AN","a"),("BK","")],"+1")}
<a class="ajout s">{ic("plus","s")}Créer un vivier</a>
<div class="gar">{ic("confidentialite","s")}Un talent sort du vivier s’il masque son profil ou le demande.</div>''', 'candidats')

CSSR += ".ring b{font-size:11px!important;display:grid!important;color:var(--texte)}\n.dok{justify-content:flex-start!important;padding-top:24px}\n"
DECIS_OK = phone(f'''<span class="rond-ok">{ic("valider")}</span>
<h2 class="h2s">Décision enregistrée</h2><p>Joël T. passe en « Non retenue ».</p>
<div class="verre chk" style="text-align:left;width:100%"><div><span class="o">{CK}</span>Message envoyé à Joël, après votre relecture</div><div><span class="o">{CK}</span>Ajouté au vivier « Relation client »</div><div><span class="o">{CK}</span>Historique de la candidature mis à jour</div><div><span class="o g">{ic("horloge","xs")}</span>Annulable encore 9 min 52 s</div></div>
<span class="ck-t" style="align-self:flex-start">Encore à décider pour cette offre</span>
<div class="verre mini-c" style="width:100%;text-align:left"><span class="av a">SM</span><div class="t"><b>Sandra M.</b><span>Entretien passé le 21 oct. · évaluée 4/4</span></div>{ring(78)}</div>
<div class="verre mini-c" style="width:100%;text-align:left"><span class="av b">EK</span><div class="t"><b>Eric K.</b><span>Entretien passé le 22 oct. · à évaluer</span></div>{ring(69)}</div>
<div style="width:100%;display:flex;gap:8px"><a class="bt sec m" style="flex:1;height:50px">Annuler</a><a class="bt p m" style="flex:1.6;height:50px">Candidature suivante</a></div>''', cls='conf publie dok', avec_nav=False)

# ---------- Dossier enrichi ----------
CSSR += '''
.doc-p{display:flex;gap:10px}
.doc-p .d{flex:1;border-radius:18px;background:var(--plein);box-shadow:var(--verre);overflow:hidden}
.doc-p .d .pg{height:84px;background:linear-gradient(180deg,#F7F5F1,#EDE8E0);padding:10px 12px;display:flex;flex-direction:column;gap:5px}
.sombre .doc-p .d .pg{background:rgba(255,255,255,.06)}
.doc-p .d .pg i{display:block;height:5px;border-radius:3px;background:var(--piste)}.doc-p .d .pg i.h{height:8px;width:55%;background:#0F3F37;opacity:.8}
.doc-p .d .t{padding:8px 10px;font-size:11px;color:var(--texte2);display:flex;align-items:center;gap:6px}.doc-p .d .t b{display:block;font-size:12px;color:var(--texte)}.doc-p .d .t div{flex:1}
.dos-top{display:flex;gap:12px;align-items:center;padding:14px}
.dos-top .av{width:58px;height:58px;font-size:18px;color:#0F3F37}
.dos-top .t{flex:1;min-width:0}.dos-top h2{font-size:17px;font-weight:600}.dos-top p{font-size:12px;color:var(--texte2)}
.dos-top .k{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
'''
def dos_haut(i='AM', cls='', nom='Amani M.', s_='Analyste de données · 1 an · Kinshasa', p=88, now=0):
    et = ['Reçue','Examen','Présél.','Entretien','Décision']
    pc = ''.join(f'<span class="{"now" if k == now else ("no" if k > now else "")}"><i></i>{e}</span>' for k, e in enumerate(et))
    return f'''<div class="verre carte" style="padding:0;display:flex;flex-direction:column">
<div class="dos-top"><span class="av {cls}">{i}</span><div class="t"><h2>{nom}</h2><p>{s_}</p><div class="k"><span class="nv-b" style="color:#0F3F37">Nouveau</span><span class="stp br">a postulé il y a 2 h</span></div></div>{ring(p)}</div>
<div class="parc" style="padding:0 10px 12px">{pc}</div></div>'''
DOS_C = f'''{tete_f("Candidature", droite="plus-options")}
{dos_haut()}
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Résumé par Orbi</b><span>Tiré du dossier seulement · Orbi ne décide pas</span></div></div>
<div class="pt"><i class="v">✓</i><span>Tableaux de bord Power BI pour 3 agences, en stage.</span></div>
<div class="pt"><i class="v">✓</i><span>SQL attesté sur Jumanly.</span></div>
<div class="pt"><i class="a">!</i><span>Python déclaré, sans preuve : à vérifier.</span></div>
<a class="pq">{ic("pourquoi","xs")}Pourquoi 88 % ?</a></div>
<div class="doc-p"><div class="d"><div class="pg"><i class="h"></i><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i></div><div class="t">{ic("cv","xs")}<div><b>CV</b>2 pages · PDF</div></div></div><div class="d"><div class="pg"><i class="h" style="width:40%"></i><i></i><i></i><i style="width:70%"></i><i></i></div><div class="t">{ic("document","xs")}<div><b>Lettre</b>1 page · PDF</div></div></div></div>
{sect("document","former","Réponses aux questions","1", ferme=True)}
{sect("modifier","accomp","Notes privées","1", ferme=True)}'''
DOS = phone(DOS_C, avec_nav=False, cls='long', bas=BARRE_A)

DOS2 = phone(f'''{tete_f("Candidature", droite="plus-options")}
<div class="verre cpt-l"><div class="hh"><b>Compétences de l’offre</b><span>6 sur 7</span></div>
<div class="r"><b>SQL</b><span class="pv at">{ic("certificat","xs")}Attestation</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></span></div>
<div class="r"><b>Power BI</b><span class="pv pj">{ic("realisation","xs")}Projet</span><span class="lv"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></span></div>
<div class="r"><b>Excel</b><span class="pv dc">Déclarée</span><span class="lv"><i class="on"></i><i class="on"></i><i></i><i></i></span></div>
<div class="r"><b>Python · souhaitée</b><span class="pv mq">Non prouvée</span></div></div>
{sect("document","former","Réponses aux questions","1",
 '<div class="repq"><b>Êtes-vous disponible avant le 1er décembre ?</b><em style="font-style:normal;color:var(--texte2)">Oui, dès le 15 novembre.</em></div>')}
{sect("modifier","accomp","Notes privées","2",
 '<div class="note-p">Très bon portfolio. À interroger sur Python.<small>Nadia K. · aujourd’hui · modifiable</small></div><div class="note-p" style="background:var(--ciel-c)">D’accord pour un entretien.<small>Olivier B. · aujourd’hui</small></div><a class="ajout s">' + ic("plus","s") + 'Ajouter une note</a>')}
{sect("horloge","oppo","Historique","3",
 '<div class="hist-l"><span><b>Nadia K.</b> a ouvert le dossier · 10:52</span><span><b>Orbi</b> a résumé le dossier à la demande de Nadia · 10:53</span><span>Candidature reçue · 08:40</span></div>')}''', avec_nav=False, cls='long', bas=BARRE_A)

POURQ_R = POURQ_R.replace(f'{tete_f("Candidature", droite="plus-options")}', DOS_C, 1)
ORB_RES = ORB_RES.replace(f'{tete_f("Candidature", droite="plus-options")}', DOS_C, 1)
ETAPE = ETAPE.replace(f'{tete_f("Candidature", droite="plus-options")}', DOS_C, 1)

ORB_LOCK = phone(f'''{tete_f("Candidature", droite="plus-options")}
{dos_haut("FN","a","Fatou N.","Chargée d’études · Kinshasa",74)}
<div class="lock-r" style="background:linear-gradient(150deg,#F2FCE6,#DDF6EE)"><b>{orbi(22)}Résumé et analyse par Orbi</b>Disponibles dès RH Pro, avec 100 crédits Orbi par mois.<a class="bt sec s" style="align-self:flex-start;margin-top:4px">Voir RH Pro</a></div>
<div class="verre cpt-l"><div class="hh"><b>Compétences de l’offre</b><span>5 sur 7</span></div>
<div class="r"><b>SQL</b><span class="pv dc">Déclarée</span></div><div class="r"><b>Power BI</b><span class="pv at">{ic("certificat","xs")}Attestation</span></div><div class="r"><b>Python</b><span class="pv mq">Non indiquée</span></div>
<a class="pq">{ic("pourquoi","xs")}Pourquoi 74 % ? Toujours inclus</a></div>
<div class="doc-p"><div class="d"><div class="pg"><i class="h"></i><i></i><i style="width:80%"></i><i></i></div><div class="t">{ic("cv","xs")}<div><b>CV</b>1 page · PDF</div></div></div><div class="d" style="display:grid;place-items:center;color:var(--texte2);font-size:11.5px;text-align:center;padding:10px">Pas de lettre<br>Facultative</div></div>''', avec_nav=False, cls='long', bas=BARRE_A)
