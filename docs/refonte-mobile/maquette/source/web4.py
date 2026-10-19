# Version ordinateur et tablette · talent, lot 4 : compte, profil, abonnement, paramètres (19/10/2026). python3 web4.py && node shotw.js talent-4
import os
H = os.path.dirname(os.path.abspath(__file__))
_t4 = open(H + '/talent4.py').read(); exec(_t4[:_t4.index('\nECR = [')])     # écrans, CSS des lots 2 à 4 mobiles, drapeaux
_K = (CSS2, CSS3L, CSS4)
_s = open(H + '/web1.py').read(); exec(_s[:_s.index('\nECR = [')])
CSS2, CSS3L, CSS4 = _K

CSSW4 = '''
.web .rond-ok,.tab .rond-ok,.pub .rond-ok{width:88px;height:88px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;box-shadow:var(--halo);color:var(--sapin);flex:none}.web .rond-ok .ic,.tab .rond-ok .ic,.pub .rond-ok .ic{width:40px;height:40px;color:#0F3F37}
.w-c .col>.bt,.dlg .bts .bt{flex:none}
/* Pages publiques : connexion et inscription */
.pub{width:1240px;min-height:800px;border-radius:18px;overflow:hidden;position:relative;background:var(--fond);color:var(--texte);box-shadow:0 0 0 1px rgba(15,63,55,.10),0 40px 80px -30px rgba(15,63,55,.45)}
.pub .chr{height:38px;display:flex;align-items:center;padding:0 16px;background:rgba(255,255,255,.55);border-bottom:1px solid var(--trait)}
.pub.sombre .chr{background:rgba(255,255,255,.04)}
.pub .chr i{width:11px;height:11px;border-radius:50%;background:#E3DCD0;display:inline-block;margin-right:6px}.pub.sombre .chr i{background:rgba(255,255,255,.14)}
.pub .chr .url{flex:0 1 420px;margin:0 auto;height:24px;border-radius:8px;background:var(--zone);display:flex;align-items:center;justify-content:center;gap:6px;font-size:11.5px;color:var(--texte2)}.pub .chr .url .ic{width:12px;height:12px}
.split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:762px}
.vit{position:relative;overflow:hidden;margin:14px;border-radius:30px;background:linear-gradient(160deg,#0F3F37 0%,#14574B 60%,#1E7A63 100%);color:#fff;padding:40px;display:flex;flex-direction:column;gap:22px}
.vit::before{content:"";position:absolute;right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(166,242,107,.35),transparent 65%)}
.vit>*{position:relative}
.vit .lgo{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:600}
.vit h2{font-size:38px;font-weight:600;letter-spacing:-.03em;line-height:1.1;margin-top:auto}
.vit h2 em{font-style:normal;color:#A6F26B}
.vit p{font-size:14.5px;color:rgba(255,255,255,.75);max-width:420px}
.vit .pls{display:flex;flex-wrap:wrap;gap:8px}.vit .pls span{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14)}
.vit .pls .ic{width:14px;height:14px;color:#A6F26B}
.vit .flot{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:22px;background:rgba(255,255,255,.95);color:#0F3F37;box-shadow:0 24px 40px -20px rgba(0,0,0,.5);max-width:400px}
.vit .flot .t{flex:1}.vit .flot b{display:block;font-size:14px}.vit .flot span{font-size:12px;color:#5B6B68}
.vit .flot .anneau{width:52px;height:52px;--plein:#fff;--texte:#0F3F37;--piste:#E3EAE7}.vit .flot .anneau b{width:42px;height:42px;font-size:12px;display:grid;place-items:center}
.vit .flot.f2{margin-left:60px}
.frm{display:flex;flex-direction:column;justify-content:center;gap:14px;padding:40px 90px}
.frm .auth-h{align-items:flex-start;text-align:left;padding:0 0 6px}.frm .auth-h p{max-width:none}
.frm .bt.pl{flex:none;height:54px;width:100%}
.frm .fourn{height:52px}
.frm .mention{text-align:left}
.frm .ob-q h2{font-size:28px}
.frm .code6{justify-content:flex-start}.frm .code6 span{width:56px;height:64px;font-size:24px}
.frm .pret{align-items:flex-start;text-align:left}
.frm .rond-ok{margin:0}
.duo-f{display:grid;grid-template-columns:1fr 1fr;gap:12px}
/* Premiers pas (plein écran, sans barre latérale) */
.obw{display:flex;flex-direction:column;min-height:762px}
.obw .oh{display:flex;align-items:center;gap:16px;padding:22px 40px}
.obw .oh .lgo{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:600}
.obw .oh .prg{flex:1;max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--texte2);text-align:center}
.obw .oh .prg .pas{margin:0}
.obw .oc{flex:1;width:820px;margin:0 auto;display:flex;flex-direction:column;justify-content:center;gap:22px;padding:20px 0 60px}
.tab .obw .oc{width:auto;padding:20px 40px 60px}.tab .obw{min-height:720px}
.obw .obj-g div{position:relative;overflow:hidden}.obw .obj-g div::after{content:"";position:absolute;right:-40px;bottom:-40px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.35)}
.obw .obj-g.t2{grid-template-columns:1fr 1fr}.obw .obj-g.t2 div{min-height:170px}
.bienv .g3 .pr-l{flex-direction:column;align-items:flex-start;gap:6px}
.obw .oc .ob-q h2{font-size:30px}.obw .oc .ob-q p{font-size:14px}
.obw .obj-g{grid-template-columns:repeat(4,1fr);gap:14px}.obw .obj-g div{min-height:240px;padding:18px;font-size:12.5px}.obw .obj-g div b{font-size:16px}
.obw .ob{display:flex;justify-content:space-between;align-items:center;padding:18px 40px;border-top:1px solid var(--trait)}
.obw .ob .bt{flex:none;min-width:180px}
.obw .duo{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}
.pub.haut{min-height:1040px}.pub.haut .obw{min-height:1002px}.pub.haut .oc{justify-content:flex-start;padding-top:30px}
.pop-p{position:absolute;z-index:8;width:560px;padding:18px;border-radius:26px;background:var(--plein);box-shadow:0 40px 80px -30px rgba(0,0,0,.5),0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:10px}
.pop-p .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 18px}
.pop-p .pays-l .li{min-height:38px!important}.pop-p .pays-l .ck-t{padding:8px 2px 2px}
.oc .form-r{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:stretch}
.oc .form-r .form{height:100%}
/* Menu de l'avatar */
.amenu{position:absolute;z-index:8;right:32px;top:104px;width:320px;padding:10px;border-radius:24px;background:var(--plein);box-shadow:0 40px 80px -30px rgba(0,0,0,.5),0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:2px}
.amenu .hub-id{padding:10px}
.amenu a{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;font-size:13.5px;font-weight:600}
.amenu a .cases{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--zone)}
.amenu a>span:not(.cases){flex:1}.amenu a .cases{flex:none}.amenu a small{font-weight:500;font-size:11.5px;color:var(--texte2)}
.amenu a.on{background:var(--zone)}.amenu .sp{height:1px;background:var(--trait);margin:4px 8px}
.amenu a.dc{color:#C2410C}
/* Compte */
.cpt-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.cpt-g a{display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:26px;min-height:150px;font-size:12.5px;color:var(--texte2)}
.cpt-g a b{font-size:15.5px;color:var(--texte)}
.cpt-g a .cases{width:44px;height:44px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.7);color:#0F3F37}
.sombre .cpt-g a .cases{background:rgba(255,255,255,.12);color:var(--texte)}
.cpt-g .k1{background:var(--g-former)}.cpt-g .k2{background:var(--g-accomp)}.cpt-g .k3{background:var(--g-oppo)}.cpt-g .k4{background:linear-gradient(150deg,#E8F1FB,#B9D5F2)}
.sombre .cpt-g .k4{background:linear-gradient(150deg,rgba(120,170,230,.24),rgba(120,170,230,.08))}
.cpt-id{display:flex;align-items:center;gap:18px;padding:20px 22px}
.cpt-id .av{width:72px;height:72px;font-size:22px;box-shadow:none;color:#0F3F37}
.cpt-id .t{flex:1}.cpt-id .t b{display:block;font-size:20px}.cpt-id .t span{font-size:13px;color:var(--texte2)}
.cpt-id .anneau{width:62px;height:62px}.cpt-id .anneau b{width:50px;height:50px;font-size:13px;display:grid;place-items:center}
/* Connexions */
.pers-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.pers{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:20px 14px 16px;border-radius:26px}
.pers .lg-e{width:64px;height:64px;font-size:18px;border-radius:50%}
.pers b{font-size:14.5px}.pers span{font-size:12px;color:var(--texte2);min-height:32px}
.pers .bts{width:100%}.pers .bts .bt{flex:1}
/* Profil */
.pfw{position:relative;border-radius:30px;overflow:hidden;padding:0}
.pfw .cov{position:relative;height:150px;background:var(--g-profil)}.pfw .cov>svg{position:absolute;inset:0;width:100%;height:100%}
.pfw .cov .act{background:none;box-shadow:none;position:absolute;right:16px;top:16px;display:flex;gap:8px}
.pfw .idr{display:flex;align-items:flex-end;gap:18px;padding:0 24px 22px;margin-top:-48px;position:relative}
.pfw .idr .av{width:112px;height:112px;font-size:32px;box-shadow:0 0 0 6px var(--plein),0 14px 30px -12px rgba(15,63,55,.5);color:#0F3F37}
.pfw .idr .t{flex:1;padding-top:62px}.pfw .idr h2{font-size:26px;letter-spacing:-.02em;font-weight:600}.pfw .idr p{font-size:13.5px;color:var(--texte2);margin:2px 0 8px}
.pfw .idr .bts{gap:10px}.pfw .idr .bts .bt{flex:none}
.tab .pfw .idr{flex-wrap:wrap}.tab .pfw .idr .bts{flex-basis:100%}.tab .pfw .idr .t{min-width:0}
.projs3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.projs3 .re{height:118px}
.sect .sc .bt{align-self:flex-start}
.exp{display:flex;gap:12px;align-items:flex-start}.exp .lg-e{width:40px;height:40px;font-size:12px;flex:none}.exp .t b{display:block;font-size:14px}.exp .t span{display:block;font-size:12px;color:var(--texte2)}.exp .t p{font-size:12.5px;margin-top:4px}
.mini-l{display:flex;flex-direction:column;gap:8px;padding:16px}
.mini-l h4{font-size:15px;font-weight:600;display:flex;justify-content:space-between;align-items:center}.mini-l h4 a{font-size:12px;font-weight:600;color:var(--texte2)}
.dlg.l{width:640px}
.dlg .ph-ed{align-self:flex-start}
.dlg .duo-f .champ{min-width:0}
/* Diagnostic */
.w-c .dims{padding:20px}.w-c .dim{grid-template-columns:170px 1fr 30px;font-size:13.5px}
.diag-big{display:flex;gap:20px;align-items:center;padding:22px}
.diag-big .anneau{width:96px;height:96px}.diag-big .anneau b{width:78px;height:78px;font-size:24px;display:grid;place-items:center}
.diag-big .t b{display:block;font-size:20px}.diag-big .t span{font-size:13px;color:var(--texte2)}
/* Simulations */
.ent-h{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;padding:22px;border-radius:30px;background:linear-gradient(140deg,#0F3F37,#1E7A63);color:#fff}
.ent-h .k{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#A6F26B}
.ent-h h3{font-size:24px;font-weight:600;letter-spacing:-.02em;margin:6px 0}.ent-h p{font-size:13px;color:rgba(255,255,255,.75)}
.ent-h .bt{align-self:flex-start;margin-top:14px;flex:none}
.ent-h .r{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:22px;background:rgba(255,255,255,.08)}
.ent-h .r b{font-size:13px}.ent-h .r span{font-size:12px;color:rgba(255,255,255,.7)}
.ent-h .lg-e{width:48px;height:48px}
.w-c .ent-g{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.w-c .eg{min-height:140px;padding:18px;font-size:12.5px}.w-c .eg b{font-size:15px}
.vocw{display:flex;flex-direction:column;align-items:center;gap:18px;padding:30px;border-radius:30px}
.vocw .q{width:100%}
.vocw .onde{height:90px;gap:6px}.vocw .onde i{width:7px}
.vocw .voc-t{font-size:14.5px;max-width:560px}
.vocw .mic{width:96px;height:96px}
.cl{display:grid;gap:22px;align-items:start}
.critw{display:flex;flex-wrap:wrap;gap:8px}.critw span{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;padding:8px 12px;border-radius:999px;background:var(--lime-c)}.critw span.m{background:var(--ambre-c)}.critw span i{font-style:normal;font-weight:500;color:var(--texte2)}
.qs6{padding:16px;display:flex;flex-direction:column;gap:6px}
.qs6 h4{font-size:15px;font-weight:600;margin-bottom:4px;display:flex;justify-content:space-between}.qs6 h4 span{font-size:12px;font-weight:500;color:var(--texte2)}
.qs6 .l{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;font-size:13px}.qs6 .l i{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700;background:var(--zone)}
.qs6 .l.ok i{background:var(--sapin);color:var(--lime)}.sombre .qs6 .l.ok i{background:var(--lime);color:#0F3F37}.qs6 .l.on{background:var(--zone);font-weight:700}.qs6 .l.on i{background:var(--g-accent);color:#0F3F37}.qs6 .l i .ic{width:12px;height:12px}
.opts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
/* Abonnement et formules */
.abo-h{display:flex;align-items:center;gap:20px;padding:24px;border-radius:30px;background:var(--g-accomp)}
.abo-h .t{flex:1}.abo-h small{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.abo-h b{display:block;font-size:28px;letter-spacing:-.02em;margin:4px 0}.abo-h span{font-size:13px;color:var(--texte2)}
.abo-h .bts .bt{flex:none}
.q4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.q4 .verre{padding:16px;display:flex;flex-direction:column;gap:10px}
.q4 small{font-size:12px;color:var(--texte2)}.q4 b{font-size:22px;letter-spacing:-.02em}.q4 b span{font-size:13px;font-weight:500;color:var(--texte2)}
.q4 .cases{width:38px;height:38px;border-radius:13px;display:grid;place-items:center}
.f4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;align-items:stretch}
.f4 .form{padding:20px;gap:14px}
.f4 .form .h{flex-direction:column;align-items:flex-start;gap:6px}
.f4 .form .h .prix{font-size:30px;letter-spacing:-.02em}
.f4 .form .bt{margin-top:auto;flex:none}
.f4 .form .rec{height:22px;margin:0;display:inline-flex;align-items:center}
.f4 .form .vide{height:22px;display:block}
.web.haut{min-height:1000px}.web.haut .w-body{min-height:962px}
.tbl{padding:6px 0}
.tbl .r{display:grid;grid-template-columns:minmax(0,1.4fr) 1fr 1fr 110px 120px;gap:12px;align-items:center;padding:14px 20px;border-top:1px solid var(--trait);font-size:13.5px}
.tbl .r:first-child{border-top:0;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);padding:10px 20px}
.tbl .r b{font-size:14px}.tbl .r .st{justify-self:start}.tbl .r .bt{justify-self:end;flex:none}
.recap{padding:20px;display:flex;flex-direction:column;gap:12px}
.recap .l{display:flex;justify-content:space-between;font-size:13.5px}.recap .l span{color:var(--texte2)}
.recap .tot{display:flex;justify-content:space-between;align-items:baseline;padding-top:12px;border-top:1px solid var(--trait)}.recap .tot b{font-size:28px}
.recap .bt{flex:none}
.dd{position:absolute;z-index:8;width:340px;padding:14px;border-radius:22px;background:var(--plein);box-shadow:0 40px 80px -30px rgba(0,0,0,.5),0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:8px}
.dd .pays-l .li{min-height:44px!important}
.dlg.c{align-items:center;text-align:center}.dlg.c .h2s{font-size:22px;font-weight:600}.dlg.c p{font-size:13.5px;color:var(--texte2);max-width:400px}
.dlg.c .rond-att{margin-top:6px;width:84px;height:84px}.dlg.c .rond-ok{margin:6px 0 0}
.dlg.c .liste,.dlg.c .attente{width:100%;text-align:left}.dlg.c>.bt{width:100%;flex:none}
/* Paramètres */
.prm{display:grid;grid-template-columns:270px minmax(0,1fr);gap:22px;align-items:start}
.snav{padding:10px;display:flex;flex-direction:column;gap:2px}
.snav a{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;font-size:13.5px;font-weight:600;color:var(--texte2)}
.snav a .cases{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--zone)}
.snav a.on{background:var(--zone);color:var(--texte)}.snav a.dg{color:#C2410C}
.snav .sp{height:1px;background:var(--trait);margin:6px 10px}
.prm h3{font-size:20px;font-weight:600}.prm .ss{font-size:13px;color:var(--texte2);margin-top:-8px}
.dev{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dev .verre{display:flex;align-items:center;gap:12px;padding:14px 16px}
.dev .verre .cases{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:var(--zone)}
.dev .verre .t{flex:1}.dev .verre b{display:block;font-size:14px}.dev .verre span{font-size:12px;color:var(--texte2)}
.w-c .code6{justify-content:flex-start}
.aide-h{display:flex;flex-direction:column;align-items:center;gap:14px;padding:30px;border-radius:30px;background:var(--g-accomp);text-align:center}
.aide-h h2{font-size:28px;font-weight:600;letter-spacing:-.02em}
.aide-h .rech{width:560px;height:54px}
.aide-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.aide-g a{display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:24px;font-size:12px;color:var(--texte2)}.aide-g a b{font-size:14.5px;color:var(--texte)}
.aide-g a .cases{width:42px;height:42px;border-radius:14px;display:grid;place-items:center}
.art{display:flex;flex-direction:column;gap:2px;padding:8px}
.art a{display:flex;align-items:center;gap:10px;padding:12px;border-radius:14px;font-size:13.5px;font-weight:600}.art a span{flex:1}
/* Orbi en page */
.orw{display:grid;grid-template-columns:300px minmax(0,1fr);min-height:724px}
.orw .hs{border-right:1px solid var(--trait);padding:20px 16px;display:flex;flex-direction:column;gap:12px}
.orw .hs h4{font-size:15px;font-weight:600;display:flex;justify-content:space-between;align-items:center}
.orw .hs .bt{flex:none}
.orw .hs .liste{box-shadow:none;background:none}
.orw .hs .li{border-radius:14px;padding:8px}.orw .hs .li.on{background:var(--plein);box-shadow:var(--verre)}
.orw .cv{display:flex;flex-direction:column;gap:16px;padding:22px 60px 18px}
.orw .cv .tete-o{display:flex;align-items:center;gap:12px}.orw .cv .tete-o .t{flex:1}.orw .cv .tete-o b{display:block;font-size:17px}.orw .cv .tete-o span{font-size:12.5px;color:var(--texte2)}
.orw .aides{grid-template-columns:repeat(4,1fr);gap:12px}.orw .ai{min-height:110px;padding:16px}.orw .ai b{font-size:14px}
.orw .fil{flex:1;display:flex;flex-direction:column;gap:14px;max-width:760px;width:100%;margin:0 auto}
.orw .compo{max-width:760px;width:100%;margin:0 auto;height:62px}
.orw .pied{text-align:center;font-size:11.5px;color:var(--texte2);margin-top:-8px}
.tab .orw{grid-template-columns:1fr;min-height:0}.tab .orw .hs{display:none}.tab .orw .cv{padding:16px 24px}.tab .orw .aides{grid-template-columns:repeat(2,1fr)}
/* Lien vers la planche Studio CV */
.lienp{display:flex;align-items:center;gap:20px;padding:24px;border-radius:30px;background:linear-gradient(140deg,#F2FCE6,#DDF6EE);text-decoration:none;color:#0F3F37;max-width:1240px}
.lienp .cases{width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:#0F3F37;color:#A6F26B;flex:none}
.lienp .t{flex:1}.lienp b{display:block;font-size:19px}.lienp span{font-size:13.5px;color:#3E5752}
.lienp .bt{flex:none}
.ch0{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%}
.ch0 .c{padding:16px;display:flex;flex-direction:column;gap:10px;background:#fff;border-radius:22px}
.ch0 .c b{font-size:14.5px}.ch0 .p{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ch0 .p span{font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;background:#F2EDE5}.ch0 .p span.f{background:#A6F26B;color:#0F3F37}
.ch0 .p .ic{width:12px;height:12px;color:#5B6B68}
.tab .prm{grid-template-columns:1fr}
'''

CHK = '<span class="radio" style="box-shadow:inset 0 0 0 7px var(--sapin)"></span>'
NOCHK = '<span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span>'

# ---------- Cadres publics (connexion, inscription, premiers pas) ----------
def pub(url, corps, over='', cls=''):
    return (f'<div class="pub {cls}"><div class="chr"><span><i></i><i></i><i></i></span><span class="url">{ic("cadenas","xs")}jumanly.io{url}</span><span style="width:52px"></span></div>'
            f'{corps}{over}</div>')
def tpub(corps, cls=''):
    return f'<div class="tabz"><div class="tab {cls}"><div class="chr"><span>9:41</span><span><i></i><i></i><i></i></span></div>{corps}</div></div>'

VIT = f'''<div class="vit"><span class="lgo">{LOGO.replace('fill="#0F3F37"/>', 'fill="#ffffff" fill-opacity=".14"/>', 1)}jumanly</span>
<h2>Se former, être vu, <em>être recruté.</em></h2><p>Une seule plateforme pour apprendre, montrer ce que vous savez faire et postuler. Postuler reste gratuit pour toujours.</p>
<div class="pls"><span>{ic("valider","xs")}Offres vérifiées</span><span>{ic("valider","xs")}Attestations vérifiables</span><span>{ic("valider","xs")}Orbi, votre assistant</span></div>
<div class="flot"><span class="lg-e sap">BF</span><div class="t"><b>Analyste de données junior</b><span>Baobab Fintech · Kinshasa</span></div><span class="anneau"><b>86 %</b></span></div>
<div class="flot f2">{orbi(40)}<div class="t"><b>Orbi</b><span>« Il vous manque SQL avancé : 45 min suffisent. »</span></div></div></div>'''

def split(url, droite, gauche=VIT, cls=''):
    return pub(url, f'<div class="split">{gauche}<div class="frm">{droite}</div></div>', cls=cls)

AUTH_H = lambda t, p: f'<div class="auth-h"><h2>{t}</h2><p>{p}</p></div>'
FOURN = f'''<div class="duo-f"><a class="verre fourn"><span class="lf" style="background:#4285F4">G</span>Google</a><a class="verre fourn"><span class="lf" style="background:#0A66C2">in</span>LinkedIn</a></div>'''

W_CONNEX = split('/connexion', f'''{AUTH_H("Bon retour", "Connectez-vous pour retrouver vos offres et vos formations.")}{FOURN}<div class="ou">ou</div>
{champ('Adresse e-mail','grace.mbuyi@exemple.cd')}
<div class="champ"><label class="lab-l">Mot de passe<a>Mot de passe oublié ?</a></label><div class="verre saisie focus">{MDP}<span style="flex:1"></span>{ic("confidentialite","s")}</div></div>
<a class="bt p pl">Se connecter</a><a class="bt txt lien-m">{ic("message","s")}Recevoir un lien de connexion par e-mail</a>
<p class="mention">Pas encore de compte ? <a>Créer un compte</a></p>''')

W_MDP1 = split('/mot-de-passe-oublie', f'''<a class="bt txt lien-m" style="justify-content:flex-start">{ic("retour","s")}Retour à la connexion</a>
<div class="ob-q"><h2>Réinitialiser votre mot de passe</h2><p>Entrez l’adresse de votre compte. Nous vous envoyons un code à 6 chiffres.</p></div>
{champ('Adresse e-mail','grace.mbuyi@exemple.cd','focus')}<a class="bt p pl">Envoyer le code</a>
<div class="gar">{ic("confidentialite","s")}Pour votre sécurité, le message est le même que l’adresse existe ou non.</div>
<p class="mention">Vous ne retrouvez plus votre adresse ? Écrivez à <a>assistant@jumanly.io</a></p>''')

W_MDP2 = split('/mot-de-passe-oublie/code', f'''<div class="ob-q"><h2>Code reçu par e-mail</h2><p>Envoyé à g•••••@exemple.cd · valable 10 minutes</p></div>
<div class="code6"><span>4</span><span>8</span><span>1</span><span>2</span><span>0</span><span class="f">7</span></div>
{champ('Nouveau mot de passe', MDP, 'focus')}
<div class="force"><i class="ok"></i><i class="ok"></i><i class="ok"></i><i></i><span>Solide</span></div>
<div class="regles-m"><span class="ok">{OK()}10 caractères au moins</span><span class="ok">{OK()}Un chiffre</span><span>{ic("plus","xs")}Un symbole</span></div>
<a class="bt p pl">Enregistrer</a><p class="mention">Pas reçu ? <a>Renvoyer le code</a> dans 0:42</p>''')

T_MDP3 = tpub(f'''<div class="w-c" style="align-items:center;justify-content:center;min-height:720px;text-align:center"><span class="rond-ok">{ic("valider")}</span>
<h2 style="font-size:26px;font-weight:600">Mot de passe modifié</h2><p style="color:var(--texte2);max-width:380px">Vous êtes connectée. Les autres appareils ont été déconnectés par sécurité.</p><a class="bt p" style="width:320px">Continuer</a></div>''')

T_CONNEX = tpub(f'''<div class="w-c" style="min-height:720px;justify-content:center;width:460px;margin:0 auto"><div class="auth-h"><span class="lgo">{LOGO}jumanly</span><h2>Bon retour</h2><p>Connectez-vous pour retrouver vos offres et vos formations.</p></div>{FOURN}<div class="ou">ou</div>
{champ('Adresse e-mail','grace.mbuyi@exemple.cd')}<div class="champ"><label class="lab-l">Mot de passe<a>Mot de passe oublié ?</a></label><div class="verre saisie">{MDP}</div></div>
<a class="bt p pl" style="flex:none;height:54px">Se connecter</a><p class="mention">Pas encore de compte ? <a>Créer un compte</a></p></div>''')

# ---------- Inscription ----------
W_INS = split('/inscription', f'''{AUTH_H("Créez votre compte", "Gratuit. Postuler aux offres reste gratuit pour toujours.")}
<a class="verre fourn"><span class="lf" style="background:#4285F4">G</span>Continuer avec Google</a><a class="verre fourn"><span class="lf" style="background:#0A66C2">in</span>Continuer avec LinkedIn</a>
<div class="ou">ou</div><a class="bt p pl">{ic("message","s")}Continuer avec mon e-mail</a>
<p class="mention">En continuant, vous acceptez les <a>conditions</a> et la <a>politique de confidentialité</a>. Déjà inscrit ? <a>Se connecter</a></p>''')

W_INS2 = split('/inscription/e-mail', f'''<div class="ob-q"><h2>Créer un compte</h2><p>Avec votre adresse e-mail.</p></div>
{champ('Prénom et nom','Grâce Mbuyi')}{champ('Adresse e-mail','grace.mbuyi@exemple.cd')}{champ('Mot de passe', MDP, 'focus')}
<div class="force"><i class="ok"></i><i class="ok"></i><i class="ok"></i><i></i><span>Solide</span></div>
<div class="li" style="padding:0;border:0;min-height:40px;display:flex;gap:10px;align-items:center"><span class="coche on">{OK()}</span><span style="font-size:12.5px">J’accepte les <b>conditions</b> et la <b>politique de confidentialité</b></span></div>
<div class="li" style="padding:0;border:0;min-height:40px;display:flex;gap:10px;align-items:center"><span class="coche"></span><span style="font-size:12.5px">Recevoir des conseils et des offres par e-mail</span></div>
<a class="bt p pl">Créer mon compte</a>''')

W_VERIF = split('/inscription/verifier', f'''<span class="env-r">{ic("message")}</span><div class="ob-q"><h2>Entrez le code</h2><p>Nous l’avons envoyé à grace.mbuyi@exemple.cd</p></div>
<div class="code6"><span>2</span><span>9</span><span>4</span><span class="f">0</span><span></span><span></span></div><a class="bt p pl">Valider</a>
<p class="mention">Pas reçu ? Regardez dans les indésirables ou <a>renvoyez le code</a> dans 0:51. <a>Modifier l’adresse</a></p>''')

T_VALIDE = tpub(f'''<div class="w-c" style="align-items:center;justify-content:center;min-height:720px;text-align:center;width:500px;margin:0 auto"><span class="rond-ok">{ic("valider")}</span>
<h2 style="font-size:26px;font-weight:600">Compte validé</h2><p style="color:var(--texte2)">Bienvenue sur Jumanly, Grâce. Encore 4 questions pour vous proposer les bonnes offres et formations.</p>
<div class="verre liste lignes" style="width:100%;text-align:left">
<div class="li"><span class="cases c3">{ic("cap","s")}</span><div class="t"><b>Votre objectif</b><span>30 secondes</span></div></div>
<div class="li"><span class="cases c1">{ic("former","s")}</span><div class="t"><b>Vos études et votre domaine</b><span>Facultatif</span></div></div>
<div class="li"><span class="cases c2">{ic("localisation","s")}</span><div class="t"><b>Où et comment travailler</b><span>Pays, contrat</span></div></div></div><a class="bt p" style="width:100%">C’est parti</a></div>''')

def obw(n, corps, bas, tb=False):
    h = (f'<div class="obw"><div class="oh"><span class="lgo">{LOGO.replace("40","30")}jumanly</span><div class="prg">{pas(n,4)}<span>{n} sur 4</span></div><span style="width:110px"></span></div>'
         f'<div class="oc">{corps}</div><div class="ob">{bas}</div></div>')
    return h
OBJ4 = f'''<div class="obj-g">
<div class="o1 on"><span class="cases">{ic("opportunites","s")}</span><b>Trouver mon premier emploi</b>Stage, premier CDD ou CDI</div>
<div class="o2"><span class="cases">{ic("candidature","s")}</span><b>Changer d’emploi</b>Un poste qui me correspond mieux</div>
<div class="o3"><span class="cases">{ic("former","s")}</span><b>Monter en compétences</b>Apprendre et le prouver</div>
<div class="o4"><span class="cases">{ic("cap","s")}</span><b>Me reconvertir</b>Changer de métier</div></div>'''
OB_B = lambda p=True: (f'<a class="bt sec m">{ic("retour","s")}Retour</a>' if p else '<span></span>') + '<span style="display:flex;gap:10px"><a class="bt sec m">Passer</a><a class="bt p m">Continuer</a></span>'
W_OB1 = pub('/bienvenue/objectif', obw(1, f'<div class="ob-q"><h2>Qu’est-ce qui vous amène ?</h2><p>Jumanly adapte vos offres et formations à cet objectif.</p></div>{OBJ4}', '<span></span><a class="bt p m">Continuer</a>'))
T_OB1 = tpub(obw(1, f'<div class="ob-q"><h2>Qu’est-ce qui vous amène ?</h2><p>Jumanly adapte vos offres et formations à cet objectif.</p></div>{OBJ4.replace("obj-g", "obj-g t2")}', '<span></span><a class="bt p m">Continuer</a>'))
W_OB2 = pub('/bienvenue/etudes', obw(2, f'''<div class="ob-q"><h2>Vos études et votre domaine</h2><p>Facultatif. Cela affine les offres et les formations proposées.</p></div>
<div class="duo"><div class="col"><span class="lab-c">Niveau d’études</span><div class="puces" style="flex-wrap:wrap"><span class="puce">Secondaire</span><span class="puce">Bac + 2</span><span class="puce on">Licence</span><span class="puce">Master</span><span class="puce">Autre</span></div></div>
<div class="col"><span class="lab-c">Domaine</span><div class="verre rech">{ic("recherche","s")}<span>Rechercher un domaine</span></div>
<div class="puces" style="flex-wrap:wrap"><span class="puce on">{OK()}Data et statistiques</span><span class="puce">Finance</span><span class="puce">Marketing</span><span class="puce">Informatique</span><span class="puce">Énergie</span><span class="puce">Santé</span></div></div></div>''', OB_B()))

PAYS_POP = f'''<div class="pop-p" style="left:230px;top:352px;width:780px"><div style="display:flex;gap:12px;align-items:center"><div class="verre rech focus" style="flex:1">{ic("recherche","s")}<span>Rechercher un pays</span></div><a class="bt sec s">Tous de A à Z</a></div>
<div class="liste pays-l">{pays('cd','RD Congo',on=True)}</div><div class="cols"><div class="liste pays-l"><span class="ck-t">Afrique centrale</span>{pays('cg','Congo')}{pays('cm','Cameroun')}{pays('ga','Gabon')}{pays('ao','Angola')}{pays('rw','Rwanda')}</div>
<div class="liste pays-l"><span class="ck-t">Afrique de l’Ouest et de l’Est</span>{pays('ci','Côte d’Ivoire')}{pays('sn','Sénégal')}{pays('ng','Nigeria')}{pays('gh','Ghana')}{pays('ke','Kenya')}<span class="ck-t">Nord et australe</span>{pays('ma','Maroc')}{pays('za','Afrique du Sud')}</div>
<div class="liste pays-l"><span class="ck-t">Hors d’Afrique</span>{pays('fr','France')}{pays('be','Belgique')}{pays('gb','Royaume-Uni')}{pays('de','Allemagne')}{pays('us','États-Unis')}{pays('ca','Canada')}{pays('ru','Russie')}</div></div></div>'''
OB3_C = f'''<div class="ob-q"><h2>Où et comment travailler ?</h2><p>Le pays n’est demandé qu’ici. Vous le changez dans votre profil.</p></div>
<div class="duo"><div class="champ"><label>Pays</label><div class="verre saisie focus">{FLAG["cd"]}&nbsp;&nbsp;RD Congo<span style="flex:1"></span>{ic("suivant","s")}</div></div><div class="champ"><label>Ville</label><div class="verre saisie">{ic("localisation","s")}&nbsp;&nbsp;Kinshasa</div></div></div>
<div class="duo"><div class="col"><span class="lab-c">Type de contrat</span><div class="puces"><span class="puce on">CDI</span><span class="puce on">CDD</span><span class="puce">Stage</span><span class="puce">Freelance</span></div></div>
<div class="col"><span class="lab-c">Mode de travail</span><div class="seg"><span>Sur site</span><span class="on">Hybride</span><span>À distance</span></div></div></div>'''
W_OB3 = pub('/bienvenue/lieu', obw(3, OB3_C, OB_B()), over=PAYS_POP, cls='haut')
W_OB4 = pub('/bienvenue/pret', obw(4, f'''<div class="pret" style="align-items:center"><span class="rond-ok" style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("valider")}</span><h2>Votre espace est prêt</h2><p>Vous commencez avec la formule gratuite. Vous pourrez en changer à tout moment.</p></div>
<div class="form-r"><div class="form fr on"><div class="h"><b>Free</b><span class="prix">0 $</span></div><ul><li>{OK()}Postuler à toutes les offres</li><li>{OK()}Profil et suivi des candidatures</li><li>{OK()}Un modèle de CV, formations gratuites</li></ul></div>
<div class="verre carte sugg" style="align-items:flex-start">{orbi(40)}<div class="t"><small>Pour aller plus loin</small><b>Starter dès 4,9 $ par mois : Orbi, plus de modèles de CV et de formations.</b><div><a class="bt sec s">Voir les formules</a></div></div></div></div>''', '<span></span><a class="bt a m">Commencer gratuitement</a>'))

BIENV_C = f'''<div class="verre bienv"><span class="k">{orbi(28)}Bienvenue sur Jumanly</span><h3>Votre espace est prêt. Voici par où commencer.</h3><div class="g3" style="gap:10px">
<div class="pr-l"><span class="n1">1</span><b>Compléter mon profil</b><span>40 %</span></div><div class="pr-l"><span class="n1">2</span><b>Importer ou créer mon CV</b><span>5 min</span></div><div class="pr-l"><span class="n1">3</span><b>Voir mes 12 offres</b><span>Kinshasa</span></div></div></div>'''
W_BIENV = web(pm_job().replace(ETW, BIENV_C, 1), 'accueil', url='/app',
              over=f'<div class="toast-b" style="left:520px;right:auto;bottom:28px;width:300px">{ic("valider","s")}Compte créé · formule Free</div>')

# ---------- Compte ----------
AMENU = f'''<div class="amenu"><div class="hub-id"><span class="av">GM</span><div class="t"><b>Grâce Mbuyi</b><span>Voir mon profil · 70 %</span></div>{ic("suivant","s")}</div><div class="sp"></div>
<a><span class="cases">{ic("cv","s")}</span><span>CV et documents</span><small>3 CV</small></a><a><span class="cases">{ic("certificat","s")}</span><span>Attestations</span><small>3</small></a>
<a><span class="cases">{ic("entretien","s")}</span><span>S’entraîner aux entretiens</span></a><a><span class="cases">{ic("connexion","s")}</span><span>Connexions</span><small>48</small></a><div class="sp"></div>
<a><span class="cases">{ic("portefeuille","s")}</span><span>Abonnement</span><small>Pro</small></a><a><span class="cases">{ic("reglages","s")}</span><span>Paramètres</span></a><a><span class="cases">{ic("aide","s")}</span><span>Aide</span></a><div class="sp"></div>
<a class="dc"><span class="cases">{ic("deconnexion","s")}</span><span>Se déconnecter</span></a></div>'''
W_AMENU = web(pm_job(), 'accueil', url='/app', over=AMENU)

CPT_G = f'''<div class="cpt-g"><a class="k2"><span class="cases">{ic("cv","s")}</span><b>CV et documents</b>3 CV, 2 lettres, LinkedIn</a><a class="k1"><span class="cases">{ic("certificat","s")}</span><b>Attestations</b>3 obtenues, vérifiables</a>
<a class="k3"><span class="cases">{ic("entretien","s")}</span><b>S’entraîner aux entretiens</b>4 simulations ce mois</a><a class="k4"><span class="cases">{ic("connexion","s")}</span><b>Connexions</b>48 personnes · 2 demandes</a></div>'''
def compte(t=False):
    idc = f'<div class="verre cpt-id"><span class="av">GM</span><div class="t"><b>Grâce Mbuyi</b><span>Analyste de données · Kinshasa · compte talent</span></div><span class="anneau"><b>70 %</b></span><a class="bt p m">Voir mon profil</a></div>'
    l2 = f'''<div class="verre liste lignes">
<div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Abonnement</b><span>Pro · 112 crédits Orbi</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("reglages","s")}</span><div class="t"><b>Paramètres</b><span>Sécurité, confidentialité, notifications</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("aide","s")}</span><div class="t"><b>Aide</b><span>assistant@jumanly.io</span></div>{ic("suivant")}</div></div>'''
    dc = f'<div class="verre liste"><div class="li danger"><span class="cases">{ic("deconnexion","s")}</span><div class="t"><b>Se déconnecter</b></div></div></div>'
    g = CPT_G.replace('repeat(4', 'repeat(2') if t else CPT_G
    if t: g = g.replace('class="cpt-g"', 'class="cpt-g" style="grid-template-columns:repeat(2,minmax(0,1fr))"')
    return wh('Compte') + idc + g + (f'{l2}{dc}' if t else f'<div class="g2e">{l2}<div class="col">{dc}<div class="gar">{ic("message","s")}Une question : assistant@jumanly.io. Aucun numéro de téléphone, réponse par e-mail.</div></div></div>')
W_CPT = web(compte(), '', url='/app/compte')
T_CPT = tab(compte(True), '')

def pers(lg, cls, nom, s_, bts):
    return f'<div class="verre pers"><span class="lg-e {cls}">{lg}</span><b>{nom}</b><span>{s_}</span><div class="bts">{bts}</div></div>'
MSG_B = f'<a class="bt sec s">{ic("message","xs")}Message</a>'
def connexions():
    dem = f'''<div class="verre liste lignes">{per('DI','sap','Daniel Ilunga','Chef de projet data · 12 en commun','<a class="bt p s">Accepter</a>')}{per('FN','amb','Fatou Ndiaye','Analyste BI · 4 en commun','<a class="bt sec s">Ignorer</a>')}</div>'''
    g = ''.join([pers('AK','mer','Amani Kabila','Data scientist · Mwinda Énergie', MSG_B), pers('JM','sap','Joël Mutombo','Comptable · Fleuve Banque', MSG_B), pers('SK','amb','Sarah Kanku','Chargée RH · Baobab Fintech', MSG_B),
                 pers('PL','kiv','Patrick Lukusa','Développeur · Kivu Agro', MSG_B), pers('ER','mer','Esther Ruhimbasa','Analyste crédit · Fleuve Banque', MSG_B), pers('BN','sap','Benoît Nzuzi','Statisticien · Institut Lumière', MSG_B)])
    return (wh('Connexions', '48 connexions · 2 demandes', f'<div class="verre rech" style="width:320px">{ic("recherche","s")}<span>Rechercher une personne</span></div>')
            + f'''<div class="g2r" style="grid-template-columns:minmax(0,1fr) 400px"><div class="col"><div class="sec-w"><h2>Mes connexions</h2><a>Tout voir</a></div><div class="pers-g">{g}</div></div>
<div class="col"><div class="sec-w"><h2>Demandes reçues</h2></div>{dem}<div class="gar">{ic("message","s")}On écrit seulement à une connexion acceptée.</div></div></div>''')
W_CONNS = web(connexions(), 'connexion', url='/app/connexions')

# ---------- Mon profil ----------
SKL = ('<div class="prv"><b>Power BI</b><span class="pr">' + ic("certificat","xs") + 'Attestation</span></div><div class="prv"><b>SQL</b><span class="pr">' + ic("realisation","xs") + 'Projet</span></div>'
       '<div class="prv"><b>Excel</b><span class="pr">' + ic("certificat","xs") + 'Attestation</span></div><div class="prv"><b>Python</b><span class="pr n">Déclarée</span></div><a class="bt sec s">' + ic("plus","xs") + 'Ajouter une compétence</a>')
PRJ = ('<div class="projs3"><span class="re">' + REAL["tb"] + '<b>Tableau de bord des agences</b></span><span class="re">' + REAL["pdf"] + '<b>Rapport épargne mobile</b></span><span class="re">' + REAL["poste"] + '<b>Stage Baobab : reporting</b></span></div><a class="ajout s">' + ic("plus","s") + 'Ajouter un projet</a>')
EXPS = ('<div class="exp"><span class="lg-e mer">FB</span><div class="t"><b>Stagiaire data · Fleuve Banque</b><span>Mars à septembre 2025 · Kinshasa</span><p>Rapport mensuel automatisé : 2 jours gagnés par mois.</p></div></div>'
        '<div class="exp"><span class="lg-e amb">UK</span><div class="t"><b>Tutrice en statistique · Université de Kinshasa</b><span>2023 à 2024</span></div></div><a class="bt sec s">' + ic("plus","xs") + 'Ajouter une expérience</a>')
def pf_head():
    return f'''<div class="verre pfw"><div class="cov">{PF_COV}<span class="act">{bi("partager")}{bi("modifier")}</span></div><div class="idr"><span class="av">GM</span><div class="t"><h2>Grâce Mbuyi</h2><p>Analyste de données · Kinshasa</p><span class="cap"><i></i>Vise : premier emploi en data</span></div>
<div class="bts"><a class="bt p m">{orbi(20)}Faire le point</a><a class="bt sec m">{ic("profil","s")}Vu par un recruteur</a></div></div></div>'''
SIDE_P = f'''<div class="verre compl"><span class="anneau" style="width:46px;height:46px"><b style="width:36px;height:36px;font-size:11px">70 %</b></span><div class="t"><b>Profil à 70 %</b><span>Un projet de plus : 80 %</span></div>{ic("suivant","s")}</div>
<div class="verre mini-l"><h4>Ce que je cherche<a>Modifier</a></h4><div class="puces" style="flex-wrap:wrap"><span class="puce on">Analyste de données</span><span class="puce on">{FLAG["cd"]}Kinshasa</span><span class="puce on">{FLAG["cg"]}Brazzaville</span><span class="puce on">CDI</span><span class="puce on">Hybride</span></div><span style="font-size:12px;color:var(--texte2)">À partir de 600 $ par mois · disponible</span></div>
{sect("certificat","former","Attestations","3", '<div class="prv"><b>Excel pour le travail</b><span class="pr">90 %</span></div><div class="prv"><b>SQL : les bases</b><span class="pr">85 %</span></div><div class="prv"><b>Écrire un CV</b><span class="pr">100 %</span></div>')}
{sect("former","former","Études","Licence", '<div class="exp"><span class="lg-e amb">UK</span><div class="t"><b>Licence en statistique</b><span>Université de Kinshasa · 2025</span></div></div>')}
{sect("document","accomp","Langues","2", '<div class="prv"><b>Français</b><span class="pr n">Courant</span></div><div class="prv"><b>Anglais</b><span class="pr n">Lu, écrit</span></div>')}'''
def profil(t=False):
    main = f'''{sect("cap","former","Compétences","6", SKL)}{sect("realisation","oppo","Projets","3", PRJ)}{sect("entreprise","accomp","Expériences","2", EXPS)}'''
    if t:
        return pf_head() + f'<div class="g2e"><div class="col">{main}</div><div class="col">{SIDE_P}</div></div>'
    return pf_head() + f'<div class="g2"><div class="col">{main}</div><div class="col">{SIDE_P}</div></div>'
UP = '/app/profil'
W_PROF = web(profil(), '', url=UP)
T_PROF = tab(profil(True), '')

APER_C = f'''<div class="vu-rec">{ic("profil","s")}Aperçu : c’est ce que voit Baobab Fintech.</div>
<div class="verre masque"><div class="l"><span>Titre</span><b>Analyste de données</b></div><div class="l"><span>Compétences</span><b>Power BI ✓, SQL ✓, Python</b></div><div class="l"><span>Projets</span><b>3 projets publics</b></div><div class="l"><span>Attestations</span><b>3, vérifiables</b></div><div class="l"><span>CV</span><b>Celui envoyé avec la candidature</b></div></div>
<span class="ck-t">Jamais utilisé pour le score</span>
<div class="verre masque"><div class="l"><span>Photo, âge, genre</span><s>exclus du matching</s></div><div class="l"><span>Nationalité, situation familiale</span><s>exclus du matching</s></div><div class="l"><span>Adresse précise</span><s>ville seulement</s></div></div>
<div class="gar">{ic("confidentialite","s")}Un recruteur voit votre profil seulement si vous postulez ou le rendez visible.</div>'''
APER_P = f'<div class="op"><div class="opt"><span class="cases" style="width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:var(--ambre-c)">{ic("profil","s")}</span><div class="t"><b>Vu par un recruteur</b><span>Aperçu, rien n’est envoyé</span></div>{bi("fermer")}</div>{APER_C}</div>'
W_APER = web(profil(), '', url=UP, over=APER_P)

DLG_ID = f'''<h3>Modifier le profil</h3><div style="display:flex;gap:18px;align-items:center"><div class="ph-ed"><span class="av" style="width:84px;height:84px;font-size:24px">GM</span><a class="bi">{ic("photo","s")}</a></div><div class="gar" style="flex:1">{ic("confidentialite","s")}La photo n’entre jamais dans le score. Vous pouvez ne pas en mettre.</div></div>
<div class="duo-f">{champ('Titre','Analyste de données')}<div class="champ"><label>Pays et ville</label><div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;RD Congo · Kinshasa<span style="flex:1"></span>{ic("suivant","s")}</div></div></div>
{champ('Résumé','Je transforme des données en décisions…','', aide='Facultatif · 300 caractères')}<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Enregistrer</a></div>'''
W_EDID = web(profil(), '', url=UP, over=fenetre(DLG_ID).replace('class="dlg"', 'class="dlg l"'))

DLG_EXP = f'''<h3>Nouvelle expérience</h3><div class="duo-f">{champ('Poste','Stagiaire data','focus')}{champ('Organisation','Fleuve Banque')}</div>
<div class="duo-f"><div class="champ"><label>Début</label><div class="verre saisie">03 / 2025</div></div><div class="champ"><label>Fin</label><div class="verre saisie">09 / 2025</div></div></div>
<div class="li" style="padding:0;border:0;min-height:36px"><div class="t"><b>Poste actuel</b></div><span class="sw"></span></div>
<div class="champ"><label>Résultat obtenu</label><div class="verre saisie" style="height:76px;align-items:flex-start;padding-top:14px">Rapport mensuel automatisé : 2 jours gagnés par mois</div></div>
<div class="verre carte sugg">{orbi(32)}<div class="t"><small>Orbi peut reformuler</small><b>Vous validez avant l’ajout.</b></div></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Ajouter</a></div>'''
W_EXP = web(profil(), '', url=UP, over=fenetre(DLG_EXP).replace('class="dlg"', 'class="dlg l"'))

DLG_COMP = f'''<h3>Ajouter une compétence</h3><div class="verre rech focus">{ic("recherche","s")}<span style="color:var(--texte)">sql</span></div>
<div class="puces"><span class="puce on">{OK()}SQL</span><span class="puce">SQL avancé</span><span class="puce">PostgreSQL</span></div>
<span class="ck-t">Niveau</span><div class="seg"><span>Débutant</span><span class="on">Intermédiaire</span><span>Avancé</span></div><span class="ck-t">Preuve</span>
<div class="verre liste lignes" style="box-shadow:none;background:var(--zone)">
<div class="li"><span class="cases c1">{ic("certificat","s")}</span><div class="t"><b>Attestation Jumanly</b><span>SQL : bases · 4 oct.</span></div>{CHK}</div>
<div class="li"><span class="cases c3">{ic("realisation","s")}</span><div class="t"><b>Un projet</b><span>Tableau de bord des agences</span></div>{NOCHK}</div>
<div class="li"><span class="cases">{ic("modifier","s")}</span><div class="t"><b>Déclarée seulement</b><span>Sans preuve</span></div>{NOCHK}</div></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Ajouter SQL</a></div>'''
W_COMP = web(profil(), '', url=UP, over=fenetre(DLG_COMP))

DLG_PROJ = f'''<h3>Nouveau projet</h3><div class="duo-f" style="align-items:stretch"><div class="depot s" style="justify-content:center"><span class="cases">{ic("photo","s")}</span><b>Ajouter des photos ou un PDF</b><span>Jusqu’à 6 fichiers</span></div>
<div class="col" style="gap:10px">{champ('Titre','Prévision des ventes d’une boutique','focus')}<div class="champ"><label>Ce que vous avez fait</label><div class="verre saisie" style="height:84px;align-items:flex-start;padding-top:14px;color:var(--texte2)">Le problème, votre rôle, le résultat chiffré</div></div></div></div>
<span class="lab-c">Compétences utilisées</span><div class="puces"><span class="puce on">Python</span><span class="puce on">Excel</span><span class="puce">{ic("plus","xs")}Ajouter</span></div>
<div class="li" style="padding:0;border:0"><div class="t"><b>Visible par les recruteurs</b><span>Sinon, seulement vous</span></div><span class="sw on"></span></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Enregistrer</a></div>'''
W_PROJ = web(profil(), '', url=UP, over=fenetre(DLG_PROJ).replace('class="dlg"', 'class="dlg l"'))

DLG_PREFS = f'''<h3>Ce que je cherche</h3><span class="ck-t">Métiers visés</span><div class="puces"><span class="puce on">Analyste de données</span><span class="puce on">Analyste BI</span><span class="puce">{ic("plus","xs")}Ajouter</span></div>
<span class="ck-t">Où travailler</span><div class="puces"><span class="puce on">{FLAG["cd"]}Kinshasa</span><span class="puce on">{FLAG["cg"]}Brazzaville</span><span class="puce">{ic("plus","xs")}Ajouter</span></div>
<span class="ck-t">Contrat et mode</span><div class="puces"><span class="puce on">CDI</span><span class="puce on">CDD</span><span class="puce on">Hybride</span><span class="puce">À distance</span></div>
{champ('Salaire souhaité','À partir de 600 $ par mois','', 'salaire', 'Visible seulement par vous et les recruteurs à qui vous postulez')}
<div class="li" style="padding:0;border:0"><div class="t"><b>Disponible</b><span>Dès maintenant</span></div><span class="sw on"></span></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Enregistrer</a></div>'''
W_PREFS = web(profil(), '', url=UP, over=fenetre(DLG_PREFS).replace('class="dlg"', 'class="dlg l"'))

# ---------- Faire le point, diagnostic, plan ----------
POINT_C = f'''<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Votre profil est solide pour des postes d’analyste junior à Kinshasa.</span></div></div>
<div class="verre point"><h4>Vos atouts</h4><div class="pt ok"><i>{OK()}</i><span>Power BI prouvé par une attestation</span></div><div class="pt ok"><i>{OK()}</i><span>Un projet chiffré sur les agences</span></div></div>
<div class="verre point"><h4>À renforcer</h4><div class="pt ko"><i>{ic("plus","xs")}</i><span>SQL avancé : demandé par 7 offres sur 10</span></div><div class="pt ko"><i>{ic("plus","xs")}</i><span>Aucune expérience décrite avec un résultat</span></div></div>
<div class="rebond"><b>Prochaine action</b><span>Module « SQL : jointures », 30 min</span><a class="bt sec s">Commencer</a></div>
<div style="display:flex;justify-content:space-between;align-items:center"><a class="pq">{ic("pourquoi")}Pourquoi ces conseils ?</a><a class="bt sec s">Mon diagnostic</a></div>'''
W_POINT = web(profil(), '', url=UP, over=panneau_orbi('Faire le point', 'Bilan de votre profil · 1 crédit', POINT_C))

def diag():
    d = f'''<div class="verre diag-big"><span class="anneau" style="background:conic-gradient(#3DA14F 0,#2FD3A6 68%,var(--piste) 0)"><b>68</b></span><div class="t"><b>Prête pour un premier poste</b><span>Calculé par des règles fixes : les mêmes réponses donnent le même résultat.</span></div></div>
<div class="verre dims">{dim(1,'Compétences',74)}{dim(2,'Expérience',45)}{dim(3,'Documents',80)}{dim(4,'Visibilité',62)}{dim(5,'Préparation entretien',58)}{dim(6,'Réseau',40)}</div>
<div style="display:flex;justify-content:space-between;align-items:center"><a class="pq">{ic("pourquoi")}Pourquoi ces notes ?</a><a class="bt sec m">Refaire le diagnostic</a></div>'''
    p = f'''<div class="verre parc-h"><span class="k">Objectif · d’ici décembre</span><h2>Premier poste d’analyste data</h2><span class="barre"><i style="width:40%"></i></span></div>
<div class="etapes-p"><div class="e"><span class="num ok">{ic("valider","xs")}</span><div class="verre"><b>Prouver Power BI</b><span>Attestation obtenue</span></div></div>
<div class="e"><span class="num en">2</span><div class="verre"><b>SQL : jointures</b><span>Formation · 30 min · en cours</span></div></div>
<div class="e"><span class="num">3</span><div class="verre"><b>Décrire 2 expériences avec un résultat</b><span>Profil · 10 min</span></div></div>
<div class="e"><span class="num">4</span><div class="verre"><b>S’entraîner à l’entretien</b><span>3 simulations</span></div></div></div>
<div class="gar">{ic("pourquoi","s")}Orbi propose, vous choisissez : chaque étape se modifie ou se retire.</div>'''
    return wh('Diagnostic de carrière', 'Six notes sur 100 et le plan qui en découle', f'<a class="bt sec m">{ic("partager","s")}Partager</a>') + f'<div class="g2e"><div class="col">{d}</div><div class="col"><div class="sec-w"><h2>Mon plan de progression</h2></div>{p}</div></div>'
W_DIAG = web(diag(), '', url='/app/profil/diagnostic')

# ---------- Simulations d'entretien ----------
def ent_hub():
    h = f'''<div class="ent-h"><div style="display:flex;flex-direction:column"><span class="k">Entretien prévu</span><h3>Baobab Fintech · Analyste data</h3><p>Mardi 22 octobre · 10:00 · en visio</p><a class="bt a m">{ic("entretien","s")}Préparer cet entretien</a></div>
<div class="r"><span class="lg-e sap">BF</span><b>Orbi a préparé un brief</b><span>Ce qu’il faut savoir sur l’offre, 8 questions probables, vos points forts à citer.</span></div></div>'''
    g = f'''<div class="ent-g"><a class="eg e1"><span class="cases">{ic("opportunites","s")}</span><b>Sur une offre</b>Enregistrée ou envoyée</a><a class="eg e2"><span class="cases">{ic("cap","s")}</span><b>Sur un métier</b>Analyste de données</a><a class="eg e3"><span class="cases">{ic("message","s")}</span><b>Questions classiques</b>Se présenter, défauts</a><a class="eg e4"><span class="cases">{ic("micro","s")}</span><b>À l’oral</b>Avec votre voix</a></div>'''
    q = f'''<div class="verre quotas"><div class="quota"><div class="l"><b>Simulations écrites</b><span>4 sur 10 ce mois</span></div><span class="barre"><i style="width:40%"></i></span></div><div class="quota"><div class="l"><b>Simulations vocales</b><span>1 sur 3 ce mois</span></div><span class="barre"><i style="width:33%"></i></span></div></div>'''
    d = f'''<div class="verre liste lignes"><div class="li"><span class="cases c1">{ic("entretien","s")}</span><div class="t"><b>Baobab Fintech · écrit</b><span>15 oct. · 8 questions · retour prêt</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("micro","s")}</span><div class="t"><b>Analyste de données · oral</b><span>12 oct. · 6 questions</span></div>{ic("suivant")}</div></div>'''
    return (wh('S’entraîner aux entretiens', 'Toujours privé : un recruteur ne voit jamais vos simulations.', f'<a class="bt p m">{ic("plus","s")}Nouvel entraînement</a>')
            + f'<div class="g2"><div class="col">{h}<div class="sec-w"><h2>S’entraîner librement</h2></div>{g}</div><div class="col"><div class="sec-w"><h2>Ce mois</h2></div>{q}<div class="sec-w"><h2>Derniers entraînements</h2><a>Tout voir</a></div>{d}</div></div>')
UE = '/app/entrainement'
W_ENT = web(ent_hub(), '', url=UE)
DLG_ENT = f'''<h3>Nouvel entraînement</h3>{champ('Métier','Analyste de données','', 'cap')}
<span class="ck-t">Niveau du poste</span><div class="seg"><span class="on">Junior</span><span>Confirmé</span><span>Senior</span></div>
<span class="ck-t">Types de questions</span><div class="puces" style="flex-wrap:wrap"><span class="puce on">{OK()}Motivation</span><span class="puce on">{OK()}Techniques</span><span class="puce on">{OK()}Mises en situation</span><span class="puce">Salaire</span></div>
<span class="ck-t">Format</span><div class="opts"><span class="on"><b>Écrit</b>4 sur 10</span><span><b>Oral</b>1 sur 3</span><span><b>Mixte</b>oral</span></div>
<div class="opts"><span><b>Rapide</b>10 min</span><span class="on"><b>Standard</b>20 min</span><span><b>Complet</b>30 min</span></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt a m pl">{ic("entretien","s")}Commencer</a></div>'''
W_ENTC = web(ent_hub(), '', url=UE, over=fenetre(DLG_ENT).replace('class="dlg"', 'class="dlg l"'))

QS6 = lambda n: f'''<div class="verre qs6"><h4>Questions<span>{n} sur 6</span></h4>''' + ''.join(
    f'<div class="l{" ok" if i < n else (" on" if i == n else "")}"><i>{ic("valider","xs") if i < n else i}</i><span>{t}</span></div>' for i, t in enumerate(['Se présenter', 'Situation : données incomplètes', 'Un tableau de bord réussi', 'Expliquer un chiffre à un non-spécialiste', 'Vos défauts', 'Vos questions'], 1)) + '</div>'
def vocal():
    o = ''.join(f'<i style="height:{h}px"></i>' for h in [14,26,40,58,36,70,48,28,64,42,22,54,34,18,42,66,30,20,50,38,24,60,32,16])
    return f'''<div class="cl" style="grid-template-columns:minmax(0,1fr) 300px"><div class="col"><div class="w-h"><div class="t"><h1 style="font-size:26px">Simulation orale · Analyste de données</h1><p>Question 2 sur 6 · 2 minutes par réponse</p></div><a class="bt sec m">{ic("fermer","s")}Quitter</a></div>{pas(2,6)}
<div class="verre vocw"><div class="verre q"><small>Mise en situation · oral</small><b>Votre responsable vous demande un chiffre pour demain, mais les données sont incomplètes. Que faites-vous ?</b></div>
<div class="onde">{o}</div><span class="tps">0:48 / 2:00</span><span class="voc-t">« Je commencerais par dire clairement ce qui manque, puis je donnerais une estimation avec une marge… »</span>
<div class="voc-b"><a class="bi">{ic("fermer","s")}</a><a class="mic">{ic("micro")}</a><a class="bi">{ic("valider","s")}</a></div></div></div>
<div class="col">{QS6(2)}<div class="gar">{ic("cadenas","s")}Votre voix sert seulement à transcrire la réponse. L’audio est effacé après le retour.</div></div></div>'''
W_VOC = web(vocal(), '', url=UE + '/oral', tb=False, rail=True)

def fbv():
    return wh('Votre retour · oral', 'Analyste de données · 6 questions · 12 octobre') + f'''<div class="g2"><div class="col"><div class="verre sc-c">{orbi(48)}<div class="t"><b>Réponses claires, débit à ralentir</b><span>Retour sur 5 critères, sans note</span></div></div>
<div class="g2e"><div class="verre fb-c"><h4>Points forts</h4><div class="pt ok"><i>{ic("valider","xs")}</i>Structure : situation, action, résultat</div><div class="pt ok"><i>{ic("valider","xs")}</i>Exemples chiffrés</div></div>
<div class="verre fb-c"><h4>À l’oral</h4><div class="pt ko"><i>{ic("plus","xs")}</i>Débit rapide sur la question 4</div><div class="pt ko"><i>{ic("plus","xs")}</i>Trois « euh » par réponse en moyenne</div></div></div>
<div class="verre mini-l"><h4>Les 5 critères</h4><div class="critw"><span>Structure <i>solide</i></span><span>Exemples <i>chiffrés</i></span><span>Clarté <i>bonne</i></span><span class="m">Débit <i>à ralentir</i></span><span class="m">Hésitations <i>à réduire</i></span></div></div>
<div class="verre mini-l"><h4>Question 4 · votre réponse et la proposition d’Orbi</h4><p style="font-size:13px;color:var(--texte2);font-style:italic">« Le chiffre, c’est le nombre de clients actifs, donc… euh… ceux qui ont fait une opération… »</p><p style="font-size:13px"><b>Proposition :</b> commencez par une phrase simple (« 1 client sur 3 utilise l’appli chaque mois »), puis donnez la définition.</p></div>
<a class="pq">{ic("pourquoi")}Pourquoi ce retour ?</a></div>
<div class="col"><div class="verre pj"><span class="cases">{ic("lecon","s")}</span><div class="t"><b>Réécouter ma réponse 4</b><span>Avec la réponse proposée par Orbi</span></div>{ic("suivant","s")}</div>
<div class="verre mg"><span class="vign">{FORM["entretien"]}</span><div class="t"><small>Pour progresser</small><b>Réussir son entretien</b><span>Module « Parler avec assurance » · 9 min</span></div>{ic("suivant","s")}</div>
<div class="bts"><a class="bt sec m">Recommencer</a><a class="bt p m pl">Terminer</a></div></div></div>'''
W_FBV = web(fbv(), '', url=UE + '/oral/retour')

def ent_free():
    return wh('S’entraîner aux entretiens') + f'''<div class="verrou">{ic("cadenas","s")}<div class="t"><b>Simulations avec Orbi dès Starter</b>Écrites dès Starter, à l’oral dès Pro.</div><a class="bt p s" style="margin-left:auto">Voir les formules</a></div>
<div class="sec-w"><h2>Gratuit</h2></div><div class="verre liste lignes">
<div class="li"><span class="cases c1">{ic("lecon","s")}</span><div class="t"><b>Les 10 questions les plus posées</b><span>Fiche et exemples de réponses</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("entretien","s")}</span><div class="t"><b>Se présenter en 2 minutes</b><span>Formation gratuite · 6 min</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("document","s")}</span><div class="t"><b>Préparer un entretien en visio</b><span>Conseils · 3 min</span></div>{ic("suivant")}</div></div>
<div class="sec-w"><h2>Formations gratuites</h2></div><div class="g2e">{formation('entretien','Entretien','Se présenter en 2 minutes','Gratuit','6 min')}{formation('cv','Employabilité','Écrire un CV qui décroche un entretien','5 modules · gratuit','45 min')}</div>
<div class="gar">{ic("valider","s")}Postuler et passer vos entretiens restent gratuits.</div>'''
T_ENTF = tab(ent_free(), '')

# ---------- Abonnement et paiement ----------
UB = '/app/abonnement'
def abo():
    h = f'''<div class="abo-h"><div class="t"><small>Votre formule</small><b>Pro · 19,9 $ par mois</b><span>Payée jusqu’au 12 novembre · prépayé, sans renouvellement forcé</span></div><div class="bts"><a class="bt sec m">Prolonger</a><a class="bt p m">Changer de formule</a></div></div>'''
    q = f'''<div class="q4"><div class="verre"><span class="cases" style="background:var(--g-accent)">{ic("orbi","s")}</span><small>Crédits Orbi</small><b>112 <span>sur 150</span></b><span class="barre"><i style="width:75%"></i></span></div>
<div class="verre"><span class="cases" style="background:var(--g-former)">{ic("entretien","s")}</span><small>Entretiens écrits</small><b>4 <span>sur 10</span></b><span class="barre"><i style="width:40%"></i></span></div>
<div class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("micro","s")}</span><small>Entretiens vocaux</small><b>1 <span>sur 3</span></b><span class="barre"><i style="width:33%"></i></span></div>
<div class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("candidature","s")}</span><small>Candidatures</small><b>Illimitées</b><span style="font-size:12px;color:var(--texte2)">Gratuites dans toutes les formules</span></div></div>'''
    m = f'''<div class="verre liste lignes"><div class="li"><span class="lf-m" style="background:#E2231A">M</span><div class="t"><b>M-Pesa</b><span>81 ••• 42 · moyen par défaut</span></div><a class="bt sec s">Changer</a></div></div>'''
    f = f'''<div class="verre liste lignes"><div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Pro · octobre</b><span>12 oct. 2026 · M-Pesa</span></div><span class="v">19,9 $</span>{ic("telecharger","s")}</div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Pro · septembre</b><span>12 sept. 2026 · M-Pesa</span></div><span class="v">19,9 $</span>{ic("telecharger","s")}</div></div>'''
    return wh('Abonnement') + h + q + f'''<div class="g2e"><div class="col"><div class="sec-w"><h2>Moyen de paiement</h2></div>{m}<div class="gar">{ic("horloge","s")}Un rappel 3 jours avant la fin. Sans paiement, retour à la formule gratuite, sans rien perdre.</div></div>
<div class="col"><div class="sec-w"><h2>Factures</h2><a>Tout voir</a></div>{f}</div></div>'''
W_ABO = web(abo(), '', url=UB)

def formules(t=False):
    def F(n, p, items, on=False, rec=None, bt='Choisir', cls=''):
        r = f'<span class="rec">{rec}</span>' if rec else '<span class="rec" style="visibility:hidden">Formule</span>'
        li = ''.join(f'<li>{OK()}{x}</li>' for x in items)
        return f'<div class="verre form {cls}{" on" if on else ""}">{r}<div class="h"><b>{n}</b><span class="prix">{p}<small> /mois</small></span></div><ul>{li}</ul><a class="bt {"p" if on else "sec"} m">{bt}</a></div>'
    g = (F('Free', '0 $', ['Postuler à toutes les offres', 'Profil et suivi', 'Un modèle de CV', 'Formations gratuites'], bt='Formule de base', cls='fr')
         + F('Starter', '4,9 $', ['30 crédits Orbi', '3 entretiens écrits', 'Modèles de CV Starter', 'Préparer LinkedIn'])
         + F('Pro', '19,9 $', ['150 crédits Orbi', 'Entretiens vocaux', 'Adapter son CV à chaque offre', 'Tous les parcours standards'], rec='Votre formule', bt='Formule actuelle')
         + F('Premium', '49,9 $', ['500 crédits Orbi', '10 entretiens vocaux', 'Rapports détaillés de progression', 'Aide prioritaire par e-mail'], on=True, bt='Passer à Premium'))
    st = ' style="grid-template-columns:repeat(2,minmax(0,1fr))"' if t else ''
    return wh('Formules', 'Prépayées, sans engagement. Postuler reste gratuit dans toutes les formules.', '<div class="seg" style="width:260px"><span class="on">Mensuel</span><span>Annuel</span></div>') + f'''<div class="f4"{st}>{g}</div><div class="verre mini-l"><h4>Dans toutes les formules</h4><div class="critw"><span>Postuler gratuitement</span><span>Suivi des candidatures</span><span>Attestations vérifiables</span><span>Données protégées</span><span>Aide par e-mail</span></div></div>
<div class="gar">{ic("portefeuille","s")}Mobile Money ou carte. Prépayé : à la fin de la période, retour à Free sans rien perdre.</div>'''
W_FORMS = web(formules(), '', url=UB + '/formules')
T_FORMS = tab(formules(True), '')

RECAP = f'''<div class="verre recap"><h4 style="font-size:16px">Récapitulatif</h4><div class="l"><span>Formule</span><b>Premium · 1 mois</b></div><div class="l"><span>Période</span><b>19 oct. au 18 nov.</b></div><div class="l"><span>Renouvellement</span><b>Non, prépayé</b></div>
<div class="tot"><span>Total</span><b>49,9 $</b></div><a class="bt p m">{ic("cadenas","s")}Payer 49,9 $</a><span style="font-size:12px;color:var(--texte2);text-align:center">Reçu envoyé par e-mail et dans Factures.</span></div>'''
def paiement():
    mm = f'''<div class="verre liste mm"><div class="li"><span class="lf" style="background:#E2231A">M</span><div class="t"><b>M-Pesa</b><span>Vodacom</span></div>{CHK}</div>
<div class="li"><span class="lf" style="background:#FF7900">O</span><div class="t"><b>Orange Money</b></div>{NOCHK}</div><div class="li"><span class="lf" style="background:#C8102E">A</span><div class="t"><b>Airtel Money</b></div>{NOCHK}</div></div>
<div class="verre liste"><div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Carte bancaire</b><span>Visa, Mastercard</span></div>{NOCHK}</div></div>'''
    num = f'''<div class="champ"><label>Numéro Mobile Money</label><div class="verre saisie focus tel"><span class="ind">{FLAG["cd"]}+243{ic("suivant","xs")}</span><span>81 234 56 42</span></div><span class="aide-c">Utilisé seulement pour ce paiement, jamais affiché.</span></div>
<div class="gar">{ic("message","s")}Vous validez sur votre téléphone avec votre code Mobile Money.</div>'''
    return wh('Paiement', 'Premium · 1 mois') + f'<div class="g2r"><div class="col"><span class="ck-t">Mobile Money</span>{mm}{num}</div><div class="col">{RECAP}</div></div>'
IND = f'''<div class="dd" style="left:264px;top:604px"><div class="verre rech">{ic("recherche","s")}<span>Pays ou indicatif</span></div><div class="liste pays-l">{pays('cd','RD Congo','+243',True)}{pays('cg','Congo','+242')}{pays('cm','Cameroun','+237')}{pays('ci','Côte d’Ivoire','+225')}{pays('sn','Sénégal','+221')}{pays('fr','France','+33')}{pays('be','Belgique','+32')}</div></div>'''
W_PAY = web(paiement(), '', url=UB + '/paiement')
W_PAYN = web(paiement(), '', url=UB + '/paiement', over=IND, cls='haut')
DLG_ATT = f'''<span class="rond-att">{ic("horloge")}</span><h2 class="h2s">Validez sur votre téléphone</h2><p>M-Pesa vous envoie une demande de 49,9 $ au +243 81 ••• 42. Entrez votre code secret pour confirmer.</p>
<div class="verre attente"><span class="sp"></span>En attente de la confirmation · 1:48</div><a class="bt txt">Je n’ai rien reçu</a>'''
W_PATT = web(paiement(), '', url=UB + '/paiement', over=fenetre(DLG_ATT).replace('class="dlg"', 'class="dlg c"'))
DLG_OK = f'''<span class="rond-ok">{ic("valider")}</span><h2 class="h2s">Paiement reçu</h2><p>Premium est actif jusqu’au 18 novembre. Votre reçu est dans Factures et dans votre boîte e-mail.</p>
<div class="verre liste lignes" style="box-shadow:none;background:var(--zone)"><div class="li"><div class="t"><span>Montant</span><b>49,9 $ · M-Pesa</b></div></div><div class="li"><div class="t"><span>Référence</span><b>JMN-PAY-8F2K41</b></div></div></div><a class="bt p m">Découvrir Premium</a>'''
W_POK = web(paiement(), '', url=UB + '/paiement', over=fenetre(DLG_OK).replace('class="dlg"', 'class="dlg c"'))

def factures():
    rows = [('Premium · octobre', '19 oct. 2026', 'M-Pesa', '49,9 $'), ('Pro · septembre', '12 sept. 2026', 'M-Pesa', '19,9 $'), ('Pro · août', '12 août 2026', 'Carte', '19,9 $'), ('Starter · juillet', '12 juil. 2026', 'Orange Money', '4,9 $')]
    r = '<div class="r"><span>Formule</span><span>Date</span><span>Moyen</span><span>Montant</span><span></span></div>' + ''.join(
        f'<div class="r"><b>{a}</b><span>{b}</span><span>{c}</span><b>{d}</b><a class="bt sec s">{ic("telecharger","xs")}PDF</a></div>' for a, b, c, d in rows)
    return wh('Factures', '4 factures · en PDF') + f'<div class="verre tbl">{r}</div><div class="gar">{ic("message","s")}Une question sur un paiement : assistant@jumanly.io</div>'
W_FACT = web(factures(), '', url=UB + '/factures')

# ---------- Paramètres et aide ----------
SN = [('cadenas', 'Sécurité'), ('confidentialite', 'Confidentialité'), ('notification', 'Notifications'), None, ('progression', 'Économiser les données'), ('orbi', 'Apparence'), ('document', 'Langue'), None, ('telecharger', 'Mes données')]
def snav(on):
    h = ''
    for x in SN:
        if x is None: h += '<div class="sp"></div>'
        else: h += f'<a class="{"on" if x[1] == on else ""}"><span class="cases">{ic(x[0],"s")}</span>{x[1]}</a>'
    return f'<div class="verre snav">{h}<div class="sp"></div><a class="dg{" on" if on == "Supprimer" else ""}"><span class="cases">{ic("supprimer","s")}</span>Supprimer mon compte</a></div>'
def prm(on, corps, t=False):
    if t:
        ch = ''.join(f'<span class="puce{" on" if x[1] == on else ""}">{x[1]}</span>' for x in SN if x)
        return wh('Paramètres') + f'<div class="puces" style="flex-wrap:wrap">{ch}</div><div class="col">{corps}</div><div class="verre liste lignes"><div class="li"><span class="cases">{ic("telecharger","s")}</span><div class="t"><b>Télécharger mes données</b><span>Fichier envoyé par e-mail</span></div>{ic("suivant")}</div><div class="li danger"><span class="cases">{ic("supprimer","s")}</span><div class="t"><b>Supprimer mon compte</b></div></div></div>'
    return wh('Paramètres') + f'<div class="prm">{snav(on)}<div class="col">{corps}</div></div>'
SECU_C = f'''<h3>Sécurité</h3><div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("message","s")}</span><div class="t"><b>Connexion par code e-mail</b><span>grace.mbuyi@exemple.cd</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("cadenas","s")}</span><div class="t"><b>Double vérification</b><span>Application d’authentification</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("connexion","s")}</span><div class="t"><b>Comptes liés</b><span>Google, LinkedIn</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("modifier","s")}</span><div class="t"><b>Mot de passe</b><span>Modifié il y a 3 mois</span></div><a class="bt sec s">Changer</a></div></div>
<span class="ck-t">Code de l’application</span><div class="code6"><span>4</span><span>8</span><span>1</span><span class="f">2</span><span></span><span></span></div>
<span class="ck-t">Appareils connectés</span><div class="dev"><div class="verre"><span class="cases">{ic("document","s")}</span><div class="t"><b>Ordinateur · Chrome</b><span>Kinshasa · maintenant</span></div><span class="st pre">Actif</span></div>
<div class="verre"><span class="cases">{ic("message","s")}</span><div class="t"><b>Téléphone Android</b><span>Kinshasa · avant-hier</span></div><a class="bt sec s">Déconnecter</a></div></div>'''
W_SECU = web(prm('Sécurité', SECU_C), '', url='/app/parametres/securite')
CONF_C = f'''<h3>Confidentialité</h3><div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("profil","s")}</span><div class="t"><b>Visible par les recruteurs</b><span>Même sans candidature</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c1">{ic("orbi","s")}</span><div class="t"><b>Utiliser Orbi</b><span>Seulement pour m’aider · jamais pour me classer</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("realisation","s")}</span><div class="t"><b>Projets publics</b><span>3 sur 3</span></div>{ic("suivant")}</div></div>
<span class="ck-t">Qui a consulté mon profil</span><div class="g2e"><div class="verre consult"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b><span>Après votre candidature · hier</span></div></div>
<div class="verre consult"><span class="lg-e amb">ME</span><div class="t"><b>Mwinda Énergie</b><span>Profil visible · 14 oct.</span></div></div></div>
<div class="gar">{ic("confidentialite","s")}Chaque consultation par un recruteur est enregistrée ici.</div>'''
W_CONF = web(prm('Confidentialité', CONF_C), '', url='/app/parametres/confidentialite')
T_CONF = tab(prm('Confidentialité', CONF_C, True), '')
NOTIF_C = f'''<h3>Notifications</h3><div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("candidature","s")}</span><div class="t"><b>Candidatures</b><span>Statut, entretiens</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c2">{ic("message","s")}</span><div class="t"><b>Messages</b><span>Recruteurs, connexions</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("opportunites","s")}</span><div class="t"><b>Offres pour moi</b><span>Une fois par jour</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c1">{ic("former","s")}</span><div class="t"><b>Formations</b><span>Rappels de reprise</span></div><span class="sw"></span></div>
<div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Abonnement</b><span>Rappels de fin de période</span></div><span class="sw on"></span></div></div>
<span class="ck-t">Recevoir aussi par</span><div class="seg" style="width:360px"><span class="on">Appli + e-mail</span><span>Appli seule</span></div>
<span class="ck-t">Affichage et données</span><div class="verre liste lignes">
<div class="li"><span class="cases">{ic("progression","s")}</span><div class="t"><b>Économiser les données</b><span>Images allégées, vidéo 240p</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases">{ic("orbi","s")}</span><div class="t"><b>Apparence</b><span>Clair, sombre ou automatique</span></div><span class="v">Auto</span></div>
<div class="li"><span class="cases">{ic("document","s")}</span><div class="t"><b>Langue</b><span>Français</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("telecharger","s")}</span><div class="t"><b>Télécharger mes données</b><span>Fichier envoyé par e-mail</span></div>{ic("suivant")}</div></div>'''
W_NOTIF = web(prm('Notifications', NOTIF_C), '', url='/app/parametres/notifications')
DLG_SUP = f'''<h3>Supprimer mon compte ?</h3><div class="danger-c"><b>Ce qui sera effacé</b><p>Profil, CV, documents, messages et candidatures en cours, après 30 jours. Les attestations restent vérifiables par leur numéro.</p></div>
<div class="li" style="padding:0;border:0"><div class="t"><b>Télécharger mes données d’abord</b><span>Recommandé</span></div><span class="sw on"></span></div>
<div class="champ"><label>Tapez SUPPRIMER pour confirmer</label><div class="verre saisie">SUPPR</div></div><div class="bts"><a class="bt sec m">Annuler</a><a class="bt dg off m pl">Supprimer</a></div>'''
W_SUP = web(prm('Supprimer', SECU_C), '', url='/app/parametres', over=fenetre(DLG_SUP))

def aide():
    g = f'''<div class="aide-g"><a class="verre"><span class="cases" style="background:var(--g-oppo)">{ic("candidature","s")}</span><b>Postuler et suivre</b>6 articles</a><a class="verre"><span class="cases" style="background:var(--g-former)">{ic("former","s")}</span><b>Formations et attestations</b>5 articles</a>
<a class="verre"><span class="cases" style="background:var(--g-accomp)">{ic("portefeuille","s")}</span><b>Paiement et formules</b>7 articles</a><a class="verre"><span class="cases" style="background:var(--zone)">{ic("confidentialite","s")}</span><b>Données et confidentialité</b>4 articles</a></div>'''
    a = f'''<div class="verre art"><a>{ic("aide","s")}<span>Pourquoi mon score est-il de 86 % ?</span>{ic("suivant","s")}</a><a>{ic("aide","s")}<span>Comment payer avec Mobile Money ?</span>{ic("suivant","s")}</a><a>{ic("aide","s")}<span>Un recruteur peut-il voir mes simulations ?</span>{ic("suivant","s")}</a><a>{ic("aide","s")}<span>Comment faire vérifier une attestation ?</span>{ic("suivant","s")}</a></div>'''
    return f'''<div class="aide-h"><h2>Comment pouvons-nous aider ?</h2><div class="verre rech">{ic("recherche","s")}<span>Rechercher dans l’aide</span></div></div>{g}
<div class="g2"><div class="col"><div class="sec-w"><h2>Questions fréquentes</h2></div>{a}</div><div class="col"><div class="sec-w"><h2>Nous écrire</h2></div><div class="verre contact"><b>Écrire à l’équipe</b><span>assistant@jumanly.io · réponse sous 2 jours ouvrés</span><a class="bt p s">{ic("message","xs")}Écrire un e-mail</a></div></div></div>'''
W_AIDE = web(aide(), '', url='/app/aide')

# ---------- Orbi en page ----------
HIST = f'''<div class="hs"><h4>Historique<a class="bt sec s">{ic("plus","xs")}Nouveau</a></h4><div class="verre rech">{ic("recherche","s")}<span>Rechercher</span></div>
<div class="liste lignes hist"><div class="li on"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>CV et offre Baobab</b><span>Aujourd’hui</span></div></div>
<div class="li"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>Résumé du CV Data</b><span>Proposition acceptée · hier</span></div></div>
<div class="li"><span class="cases c3">{ic("opportunites","s")}</span><div class="t"><b>Offre Baobab Fintech</b><span>Pourquoi 86 % · hier</span></div></div>
<div class="li"><span class="cases c1">{ic("entretien","s")}</span><div class="t"><b>Entraînement à l’entretien</b><span>8 questions · 15 oct.</span></div></div>
<div class="li"><span class="cases c1">{ic("lecon","s")}</span><div class="t"><b>La formule SI</b><span>Dans la leçon Excel · 14 oct.</span></div></div></div>
<div class="gar" style="margin-top:auto">{ic("supprimer","s")}Effacer un échange ou tout l’historique.</div></div>'''
ORB_CV = f'''<div class="cv"><div class="tete-o">{orbi(44)}<div class="t"><b>Orbi</b><span>112 crédits · propose, vous décidez</span></div>{bi("horloge")}</div>
<div class="aides"><div class="ai p1"><span class="cases">{ic("cv","s")}</span><b>Améliorer mon CV</b></div><div class="ai p2"><span class="cases">{ic("entretien","s")}</span><b>Préparer un entretien</b></div><div class="ai p3"><span class="cases">{ic("opportunites","s")}</span><b>Analyser une offre</b></div><div class="ai p4"><span class="cases">{ic("cap","s")}</span><b>Choisir ma voie</b></div></div>
<div class="fil"><div class="bulle-u">Mon CV est-il prêt pour l’offre Baobab ?</div>
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Presque. Il manque SQL avancé et une réalisation chiffrée. Je peux créer une copie adaptée à l’offre : votre CV principal ne change pas.</span><div class="acts"><a class="bt p s">Créer la copie adaptée</a><a class="bt sec s">Voir l’offre</a><a class="pq">{ic("pourquoi")}Pourquoi ?</a></div></div></div></div>
<div class="verre fort compo"><a class="bi">{ic("plus","s")}</a><span>Écrire à Orbi</span><a class="bi">{ic("micro","s")}</a><a class="bi env">{ic("envoyer","s")}</a></div><span class="pied">Orbi propose, vous décidez. Il ne rejette personne et n’envoie rien sans vous.</span></div>'''
W_ORB = web(f'<div class="orw">{HIST}{ORB_CV}</div>', 'orbi', url='/app/orbi', tb=False)
T_ORB = tab(f'<div class="orw">{ORB_CV}</div>', 'orbi', tb=False)

# ---------- Chemins ----------
def chemins_w():
    def c(t, et):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(et) - 1 else ""}">{e}</span>' for i, e in enumerate(et))
        return f'<div class="c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join(c(t, e) for t, e in [
        ('Se connecter', ['jumanly.io', 'Se connecter', 'Google, LinkedIn, mot de passe ou lien']), ('Mot de passe oublié', ['Se connecter', 'Mot de passe oublié ?', 'Code par e-mail', 'Nouveau mot de passe']),
        ('S’inscrire', ['Créer un compte', 'Code par e-mail', 'Compte validé', '4 questions', 'Bienvenue']), ('Ouvrir le compte', ['Avatar en haut à droite', 'Menu', 'Compte']),
        ('Compléter mon profil', ['Avatar', 'Voir mon profil', 'Ajouter ou Modifier']), ('Faire le point', ['Mon profil', 'Faire le point', 'Mon diagnostic', 'Mon plan']),
        ('S’entraîner à un entretien', ['Avatar ou Suivi', 'S’entraîner', 'Écrit ou oral', 'Retour']), ('Gérer mes connexions', ['Barre latérale', 'Connexions', 'Accepter']),
        ('CV et documents', ['Barre latérale', 'Mes CV', 'Studio CV']), ('Changer de formule', ['Avatar', 'Abonnement', 'Formules', 'Payer', 'Reçu']),
        ('Retrouver une facture', ['Abonnement', 'Factures', 'PDF']), ('Régler mon compte', ['Barre latérale', 'Paramètres', 'Une rubrique']),
        ('Obtenir de l’aide', ['Avatar', 'Aide', 'Article ou e-mail']), ('Supprimer mon compte', ['Paramètres', 'Supprimer mon compte', 'Confirmer']),
        ('Parler à Orbi', ['Orbi dans la barre ou Ctrl K', 'Page Orbi', 'Historique à gauche'])]) + '</div>'

LIEN_CV = f'''<a class="lienp" href="https://claude.ai/artifact/AouTjvj7VpNf6XGk31D2h6"><span class="cases">{ic("cv")}</span><div class="t"><b>Studio CV · version ordinateur et tablette</b><span>Mes CV, galerie des 15 modèles, studio de mise en forme, améliorer, adapter à une offre ou à un texte collé, importer, lettres, LinkedIn, mode sombre.</span></div><span class="bt p m">Ouvrir la planche{ic("suivant","xs")}</span></a>'''

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
def psombre(e): return e.replace('class="pub ', 'class="pub sombre ', 1)
ECR = [
 ('f0', '0 · Comment on y arrive', 'Les mêmes chemins qu’en mobile, sans pastilles. Sur grand écran, le compte s’ouvre par l’avatar en haut à droite.', [chemins_w()]),
 ('f1', '1 · Se connecter', 'Page publique en deux parties : la promesse à gauche, le formulaire à droite. Mot de passe oublié en trois étapes.',
  [W(W_CONNEX, 'Se connecter', 'Google, LinkedIn, mot de passe ou lien par e-mail.'), W(W_MDP1, 'Mot de passe oublié', 'Un code à 6 chiffres par e-mail.'), W(W_MDP2, 'Nouveau mot de passe', 'Code, solidité, règles.'),
   T(T_CONNEX, 'Se connecter'), T(T_MDP3, 'Mot de passe modifié', 'Les autres appareils sont déconnectés.')]),
 ('f2', '2 · Inscription et premiers pas', 'Compte, code par e-mail, compte validé, puis quatre questions en plein écran. Le pays se choisit dans une liste avec drapeaux. Formule gratuite par défaut.',
  [W(W_INS, 'Créer un compte'), W(W_INS2, 'Avec mon e-mail', 'Nom, e-mail, mot de passe, consentements.'), W(W_VERIF, 'Code de vérification'), T(T_VALIDE, 'Compte validé'),
   W(W_OB1, 'Objectif', 'Quatre objectifs en cartes.'), W(W_OB2, 'Études et domaine', 'Facultatif.'), W(W_OB3, 'Lieu et contrat', 'RD Congo en tête, l’Afrique par région, puis le reste du monde.'),
   W(W_OB4, 'Espace prêt', 'Free par défaut.'), W(W_BIENV, 'Bienvenue', 'Première arrivée sur Pour moi : 3 premiers pas.'), T(T_OB1, 'Objectif')]),
 ('f3', '3 · Compte et connexions', 'L’avatar ouvre un menu rapide ; la page Compte rassemble tout. Les connexions ont leur entrée dans la barre latérale.',
  [W(W_AMENU, 'Menu de l’avatar'), W(W_CPT, 'Compte'), W(W_CONNS, 'Connexions', 'Demandes à droite, connexions en cartes.'), T(T_CPT, 'Compte')]),
 ('f4', '4 · Mon profil', 'Identité et actions en tête, les sections en deux colonnes. Chaque compétence montre sa preuve. Les formulaires s’ouvrent en fenêtre.',
  [W(W_PROF, 'Mon profil'), W(W_APER, 'Vu par un recruteur', 'Et ce qui n’entre jamais dans le score.'), W(W_EDID, 'Modifier le profil', 'Photo facultative.'),
   W(W_EXP, 'Nouvelle expérience'), W(W_COMP, 'Compétence', 'Niveau et preuve.'), W(W_PROJ, 'Nouveau projet', 'Photos ou PDF, résultat, compétences.'), W(W_PREFS, 'Ce que je cherche'), T(T_PROF, 'Mon profil')]),
 ('f5', '5 · Faire le point', 'Le bilan d’Orbi s’ouvre à droite du profil. Le diagnostic, calculé par des règles fixes, et le plan sont côte à côte.',
  [W(W_POINT, 'Faire le point'), W(W_DIAG, 'Diagnostic et plan', 'Six notes sur 100, chaque étape modifiable.')]),
 ('f5b', '5 bis · Simulations d’entretien', 'Écrites dès Starter, orales dès Pro. Toujours privées. Le brief, la simulation écrite et le retour écrit sont dans le lot 2 (Suivi).',
  [W(W_ENT, 'S’entraîner', 'Entretien prévu, sujets libres, quotas, historique.'), W(W_ENTC, 'Nouvel entraînement'), W(W_VOC, 'Simulation orale', 'Mode concentré, plan des questions à droite.'),
   W(W_FBV, 'Retour oral', 'Sans note : points forts, à travailler, réécoute.'), T(T_ENTF, 'En formule Free', 'Conseils gratuits ; simulations dès Starter.')]),
 ('f6', '6 · CV et documents', 'Tous les écrans sont dans la planche Studio CV, déjà livrée en version ordinateur et tablette.', [LIEN_CV]),
 ('f7', '7 · Abonnement et paiement', 'Prépayé, sans surprise. Postuler reste gratuit dans toutes les formules.',
  [W(W_ABO, 'Abonnement', 'Formule, quotas, paiement, factures.'), W(W_FORMS, 'Formules', 'Les quatre côte à côte.'), W(W_PAY, 'Paiement', 'Mobile Money ou carte, récapitulatif à droite.'),
   W(W_PAYN, 'Indicatif', 'Liste avec drapeaux.'), W(W_PATT, 'Validation', 'Le code se tape sur le téléphone.'), W(W_POK, 'Paiement reçu'), W(W_FACT, 'Factures'), T(T_FORMS, 'Formules')]),
 ('f8', '8 · Paramètres et aide', 'Les rubriques à gauche, le réglage à droite. Aide par articles et par e-mail, sans téléphone.',
  [W(W_SECU, 'Sécurité', 'Double vérification, appareils.'), W(W_CONF, 'Confidentialité', 'Visibilité, Orbi, consultations.'), W(W_NOTIF, 'Notifications et affichage'),
   W(W_SUP, 'Supprimer mon compte', '30 jours, données téléchargeables.'), W(W_AIDE, 'Aide'), T(T_CONF, 'Confidentialité')]),
 ('f9', '9 · Orbi en page', 'Depuis Orbi dans la barre latérale ou Ctrl K : la conversation au centre, l’historique à gauche.',
  [W(W_ORB, 'Orbi', 'Historique, raccourcis, conversation.'), T(T_ORB, 'Orbi')]),
 ('f10', '10 · Mode sombre', 'Les mêmes écrans sur fond Nuit.',
  [W(psombre(W_CONNEX), 'Se connecter'), W(wsombre(W_PROF), 'Mon profil'), W(wsombre(W_SECU), 'Paramètres'), W(wsombre(W_ORB), 'Orbi')]),
]
page_w('talent-4', 'Jumanly · version ordinateur et tablette', 'Talent, lot 4 : compte et profil',
       '19 octobre 2026. Les écrans du lot 4 mobile adaptés aux grands écrans : connexion, inscription, premiers pas, compte, profil, diagnostic, entretiens, abonnement, paramètres, aide, Orbi. Contenus fictifs.', ECR, CSS + CSS1 + CSS2 + CSS3L + CSS4 + CSSW4)
