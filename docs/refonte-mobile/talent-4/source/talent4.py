# Refonte mobile · étape 2, lot 4 : inscription, profil, CV et documents, compte (19/10/2026).
# python3 talent4.py && node shot.js talent-4
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/talent3.py').read().split("\n# 1. Apprendre : accueil et catalogue")[0])   # aides + CSS des lots 1 à 3

CSS4 = '''
.auth .contenu{gap:14px}
.auth-h{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:26px 0 8px}
.auth-h .lgo{display:flex;align-items:center;gap:8px;font-size:22px;font-weight:600}
.auth-h h2{font-size:24px;font-weight:600;letter-spacing:-.02em;line-height:1.2}
.auth-h p{font-size:13.5px;color:var(--texte2);max-width:290px}
.fourn{display:flex;align-items:center;justify-content:center;gap:10px;height:54px;border-radius:999px;font-size:14.5px;font-weight:600}
.fourn .lf{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff}
.ou{display:flex;align-items:center;gap:12px;font-size:12px;color:var(--texte2)}.ou::before,.ou::after{content:"";flex:1;height:1px;background:var(--trait)}
.mention{font-size:11.5px;color:var(--texte2);text-align:center;line-height:1.5}.mention a{color:var(--texte);font-weight:600}
.ob-q{display:flex;flex-direction:column;gap:6px}.ob-q h2{font-size:22px;font-weight:600;letter-spacing:-.02em;line-height:1.25}.ob-q p{font-size:13px;color:var(--texte2)}
.obj-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.obj-g div{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:24px;min-height:128px;font-size:12px;color:var(--texte2)}
.obj-g div b{font-size:14px;color:var(--texte);line-height:1.25}
.obj-g div .cases{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.7);color:#0F3F37}
.obj-g .o1{background:var(--g-oppo)}.obj-g .o2{background:var(--g-accomp)}.obj-g .o3{background:var(--g-former)}.obj-g .o4{background:linear-gradient(150deg,#E8F1FB,#B9D5F2)}
.obj-g div.on{box-shadow:0 0 0 2.5px #0F3F37}
.sombre .obj-g .o4{background:linear-gradient(150deg,rgba(120,170,230,.24),rgba(120,170,230,.08))}.sombre .obj-g div .cases{background:rgba(255,255,255,.12);color:var(--texte)}.sombre .obj-g div.on{box-shadow:0 0 0 2.5px var(--lime)}
.lab-c{font-size:13px;font-weight:600}
.pret{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:8px 0 0}
.pret h2{font-size:22px;font-weight:600;letter-spacing:-.02em}.pret p{font-size:13px;color:var(--texte2);max-width:300px}
.form{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:26px}
.form .h{display:flex;align-items:center;justify-content:space-between}.form .h b{font-size:16px}
.form .h .prix{font-size:20px;font-weight:600}.form .h .prix small{font-size:12px;font-weight:500;color:var(--texte2)}
.form ul{list-style:none;display:flex;flex-direction:column;gap:6px;font-size:12.5px}
.form ul li{display:flex;gap:8px;align-items:flex-start}.form ul li .ic{width:16px;height:16px;flex:none;margin-top:1px;color:#3DA14F}
.form.on{box-shadow:0 0 0 2.5px #0F3F37,var(--verre)}.sombre .form.on{box-shadow:0 0 0 2.5px var(--lime),var(--verre)}
.form .rec{align-self:flex-start;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--g-accent);color:#0F3F37}
.form.fr{background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}.sombre .form.fr{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.sect{padding:4px 0}
.sect .sh{display:flex;align-items:center;gap:12px;padding:12px 16px}
.sect .sh .cases{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;flex:none}
.sect .sh b{flex:1;font-size:14.5px}.sect .sh small{font-size:12px;color:var(--texte2);font-weight:500}
.sect .sh .chev{transform:rotate(90deg);width:16px;height:16px}.sect.ferme .sh .chev{transform:none}
.sect .sc{padding:0 16px 14px;display:flex;flex-direction:column;gap:10px}
.prv{display:flex;gap:10px;align-items:center;font-size:12.5px}
.prv b{font-size:13.5px;flex:1}.prv .pr{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:var(--lime-c);color:var(--texte)}
.prv .pr.n{background:var(--zone);color:var(--texte2)}.prv .pr .ic{width:12px;height:12px}
.projs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.projs .re{height:auto}
.ajout.s{padding:10px;font-size:12.5px;border-radius:16px}
.vu-rec{display:flex;gap:10px;align-items:center;padding:10px 14px;border-radius:16px;background:var(--ambre-c);font-size:12.5px;font-weight:600}
.vu-rec .ic{width:16px;height:16px}
.masque{display:flex;flex-direction:column;gap:8px;padding:14px 16px}
.masque .l{display:flex;justify-content:space-between;font-size:12.5px;gap:10px}.masque .l span{color:var(--texte2)}.masque .l b{text-align:right}
.masque .l s{color:var(--texte2);text-decoration:none;font-style:italic}
.depot.s{padding:16px}
.point{display:flex;flex-direction:column;gap:10px;padding:16px}
.point h4{font-size:15px;font-weight:600}
.point .pt{display:flex;gap:10px;font-size:13px;align-items:flex-start}.point .pt i{width:22px;height:22px;border-radius:50%;flex:none;display:grid;place-items:center}
.point .pt.ok i{background:var(--lime-c)}.point .pt.ko i{background:var(--ambre-c)}.point .pt i .ic{width:12px;height:12px}
.doc{display:flex;gap:12px;align-items:center;padding:12px 14px}
.doc .mini{width:44px;height:58px;border-radius:8px;background:#fff;box-shadow:0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:4px;padding:7px 6px;flex:none}
.doc .mini i{height:4px;border-radius:2px;background:#DCE5E1}.doc .mini i:first-child{background:#0F3F37;width:70%}
.doc .mini.l i:first-child{background:#3DA14F}.doc .mini.k{background:#E8F1FB}.doc .mini.k i:first-child{background:#2B6CB0}
.doc .t{flex:1;min-width:0}.doc .t b{display:block;font-size:14px}.doc .t span{font-size:12px;color:var(--texte2)}
.doc .t .pp{display:inline-block;margin-top:4px;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--lime-c);color:var(--texte)}
.tpls{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tpl{display:flex;flex-direction:column;gap:6px;font-size:12.5px;font-weight:600}
.tpl .pg{position:relative;aspect-ratio:.72;border-radius:14px;background:#fff;box-shadow:0 0 0 1px var(--trait),0 10px 20px -14px rgba(15,63,55,.4);padding:12px 10px;display:flex;flex-direction:column;gap:5px;overflow:hidden}
.tpl .pg i{height:5px;border-radius:3px;background:#E1E8E5}.tpl .pg i.h{height:9px;width:60%;background:#0F3F37}.tpl .pg i.c{width:40%;background:#3DA14F}.tpl .pg i.k{width:82%}
.tpl .pg.b{padding-left:30px}.tpl .pg.b::before{content:"";position:absolute;left:0;top:0;bottom:0;width:20px;background:#0F3F37}
.tpl .pg.c2::before{content:"";position:absolute;left:0;right:0;top:0;height:34px;background:#E8F1FB}.tpl .pg.c2 i.h{margin-top:30px;background:#2B6CB0}
.tpl .pg.d i.h{background:#7A3E1D}.tpl .pg.d i.c{background:#C98A2E}
.tpl.on .pg{box-shadow:0 0 0 2.5px #0F3F37,0 10px 20px -14px rgba(15,63,55,.4)}.sombre .tpl.on .pg{box-shadow:0 0 0 2.5px var(--lime)}
.tpl .bdg{position:absolute;top:8px;right:8px;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:999px;background:var(--g-accent);color:#0F3F37;display:flex;gap:4px;align-items:center}
.tpl .bdg .ic{width:11px;height:11px}.tpl .bdg.n{background:rgba(15,63,55,.85);color:#fff}
.ed-ap{display:flex;gap:12px;align-items:center;padding:12px 14px}
.ed-ap .pg{width:62px;aspect-ratio:.72;border-radius:8px;background:#fff;box-shadow:0 0 0 1px var(--trait);padding:7px 6px;display:flex;flex-direction:column;gap:3px;flex:none}
.ed-ap .pg i{height:3px;border-radius:2px;background:#DCE5E1}.ed-ap .pg i.h{height:5px;width:60%;background:#0F3F37}
.ed-ap .t{flex:1}.ed-ap .t b{display:block;font-size:14px}.ed-ap .t span{font-size:12px;color:var(--texte2)}
.reg{display:flex;gap:8px;overflow:hidden}
.reg span{display:flex;align-items:center;gap:6px;height:36px;padding:0 13px;border-radius:999px;background:var(--zone);font-size:12.5px;font-weight:500;white-space:nowrap}
.reg span i{width:14px;height:14px;border-radius:50%;background:#0F3F37}
.edl .li{min-height:54px}.edl .li .poig{width:14px;display:flex;flex-direction:column;gap:3px}.edl .li .poig i{height:2px;border-radius:1px;background:var(--texte2);opacity:.5}
.edl .li .orb-b{display:flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;padding:5px 9px;border-radius:999px;background:var(--lime-c);color:var(--texte)}
.avap{display:flex;flex-direction:column;gap:8px;padding:14px 16px}
.avap small{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.avap p{font-size:13.5px;line-height:1.5}
.avap.av-a p{color:var(--texte2);text-decoration:line-through;text-decoration-color:rgba(255,107,61,.6)}
.avap.ap{background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}.sombre .avap.ap{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.avap.ap p mark{background:rgba(166,242,107,.55);color:inherit;border-radius:4px;padding:0 2px}
.sombre .avap.ap p mark{background:rgba(166,242,107,.28)}
.ecart{display:flex;flex-direction:column;gap:8px;padding:14px 16px}
.ecart .l{display:flex;gap:10px;font-size:12.5px;align-items:center}.ecart .l .ic{width:16px;height:16px;flex:none}
.ecart .l.ok .ic{color:#3DA14F}.ecart .l.ko .ic{color:#D9822B}
.hub-id{display:flex;gap:14px;align-items:center;padding:14px 16px}
.hub-id .av{width:56px;height:56px;font-size:17px;box-shadow:none}
.hub-id .t{flex:1}.hub-id .t b{display:block;font-size:16px}.hub-id .t span{font-size:12.5px;color:var(--texte2)}
.fo-act{display:flex;gap:12px;align-items:center;padding:14px 16px;background:var(--g-accomp)}
.fo-act .t{flex:1}.fo-act .t small{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.fo-act .t b{display:block;font-size:18px}.fo-act .t span{font-size:12px;color:var(--texte2)}
.quota{display:flex;flex-direction:column;gap:6px;padding:12px 16px;border-top:1px solid var(--trait)}
.quota .l{display:flex;justify-content:space-between;font-size:13px}.quota .l span{color:var(--texte2);font-size:12px}
.quotas{padding:4px 0}.quotas .quota:first-child{border-top:0}
.mm{display:flex;flex-direction:column}
.mm .li .lf{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff;flex:none}
.recu{display:flex;justify-content:space-between;align-items:center;padding:14px 16px}
.recu b{font-size:14px}.recu span{font-size:12px;color:var(--texte2)}.recu .m{font-size:20px;font-weight:600}
.code6{display:flex;gap:8px;justify-content:center}.code6 span{width:44px;height:54px;border-radius:16px;background:var(--plein);box-shadow:var(--verre);display:grid;place-items:center;font-size:20px;font-weight:600}
.code6 span.f{box-shadow:0 0 0 2px var(--texte),var(--verre)}
.danger-c{display:flex;flex-direction:column;gap:8px;padding:14px 16px;background:var(--corail-c)}
.danger-c b{font-size:14px}.danger-c p{font-size:12.5px;line-height:1.5}
.bt.dg{background:#C2410C;color:#fff}
.hist .li .t span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.consult{display:flex;gap:10px;align-items:center;padding:10px 14px}
.consult .lg-e{width:36px;height:36px;font-size:11px}
.consult .t{flex:1}.consult .t b{display:block;font-size:13px}.consult .t span{font-size:11.5px;color:var(--texte2)}
.auth .bt.pl{flex:none;width:100%;height:54px}
.form ul,.point ul{padding:0;margin:0}
.compl .anneau b{display:grid}
.bt.dg.off{opacity:.45}
.conf .bt.pl{flex:none;height:54px}
.fl{width:24px;height:16px;flex:none;border-radius:3px;display:inline-block;vertical-align:middle}
.puce .fl{width:20px;height:14px}
.py{min-height:50px!important}.py .fl{width:30px;height:20px}
.pays-l{display:flex;flex-direction:column}.pays-l .ck-t{padding:10px 2px 2px}.pays-l .li{padding:0 2px;border-top:1px solid var(--trait)}
.sheet.haute{top:120px}.sheet.haute .pays-l{overflow:hidden}
.lab-l{display:flex;justify-content:space-between}.lab-l a{font-weight:600;font-size:12.5px;text-decoration:underline}
.mdp{letter-spacing:.18em}
.lien-m{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:600}
.force{display:flex;gap:6px;align-items:center;margin-top:-4px}.force i{flex:1;height:5px;border-radius:3px;background:var(--piste)}.force i.ok{background:#3DA14F}.force span{font-size:12px;font-weight:600;margin-left:6px}
.regles-m{display:flex;flex-wrap:wrap;gap:6px}.regles-m span{display:flex;gap:4px;align-items:center;font-size:11.5px;padding:4px 9px;border-radius:999px;background:var(--zone);color:var(--texte2)}.regles-m span.ok{background:var(--lime-c);color:var(--texte)}.regles-m .ic{width:12px;height:12px}
.coche{width:24px;height:24px;border-radius:8px;box-shadow:inset 0 0 0 2px var(--trait);display:grid;place-items:center;flex:none}.coche.on{background:#0F3F37;color:#A6F26B;box-shadow:none}.sombre .coche.on{background:var(--lime);color:#0F3F37}
.env-r{width:72px;height:72px;border-radius:50%;background:var(--g-accomp);display:grid;place-items:center;color:#0F3F37}
.env-r .ic,.rond-att .ic{width:32px;height:32px}
.conf .liste{margin:4px 0}
.aide-c{font-size:11.5px;color:var(--texte2)}
.bienv{display:flex;flex-direction:column;gap:10px;padding:16px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}
.sombre .bienv{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.bienv .k{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.bienv h3{font-size:17px;font-weight:600;line-height:1.3}
.pr-l{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.7);font-size:12px;color:var(--texte2)}.sombre .pr-l{background:rgba(255,255,255,.08)}
.pr-l b{flex:1;font-size:13.5px;color:var(--texte)}.pr-l .n1{width:24px;height:24px;border-radius:50%;background:#0F3F37;color:#A6F26B;display:grid;place-items:center;font-size:12px;font-weight:700}
.toast-b{position:absolute;left:20px;right:20px;bottom:126px;z-index:6;display:flex;gap:8px;align-items:center;padding:12px 16px;border-radius:18px;background:#0F3F37;color:#fff;font-size:13px;font-weight:600;box-shadow:0 14px 30px -12px rgba(15,63,55,.6)}.toast-b .ic{color:#A6F26B}
.ph-ed{position:relative;align-self:center}.ph-ed .bi{position:absolute;right:-6px;bottom:-4px}
.dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.diag-h{display:flex;gap:14px;align-items:center;padding:14px 16px}.diag-h .t{flex:1}.diag-h .t b{display:block;font-size:15px}.diag-h .t span{font-size:12px;color:var(--texte2)}
.dims{display:flex;flex-direction:column;gap:12px;padding:16px}
.dim{display:grid;grid-template-columns:130px 1fr 28px;gap:10px;align-items:center;font-size:12.5px}.dim b{text-align:right;font-size:13px}
.li-b{display:flex;flex-direction:column;gap:8px;padding:14px 16px}.li-b small{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}.li-b p{font-size:13.5px;line-height:1.45}.li-b .bt{align-self:flex-start}
.lf-m{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff;flex:none}
.tel{gap:12px}.tel .ind{display:flex;align-items:center;gap:6px;padding-right:12px;border-right:1px solid var(--trait);font-weight:600}.tel .ind .ic{width:12px;height:12px;transform:rotate(90deg)}
.rond-att{width:96px;height:96px;border-radius:50%;background:var(--g-accomp);display:grid;place-items:center;color:#0F3F37;margin-top:60px}
.attente{display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:13px;font-weight:600}.attente .sp{width:18px;height:18px;border-radius:50%;border:2.5px solid var(--piste);border-top-color:#3DA14F}
.contact{display:flex;flex-direction:column;gap:6px;padding:14px 16px}.contact b{font-size:14px}.contact span{font-size:12px;color:var(--texte2)}.contact .bt{align-self:flex-start;margin-top:4px}
'''

LOGO = '<svg viewBox="0 0 120 120" width="40" height="40"><rect width="120" height="120" rx="30" fill="#0F3F37"/><g transform="translate(2.25 -4.35) scale(1.1)"><path d="M70 55 V70 A19 19 0 0 1 33.15 76.50" fill="none" stroke="#fff" stroke-width="17" stroke-linecap="round"/><circle cx="70" cy="31" r="11.5" fill="#A6F26B"/></g></svg>'
OK = lambda: ic("valider", "xs")

# ---------- 1. Inscription et premiers pas ----------
INS = phone(f'''<div class="auth-h"><span class="lgo">{LOGO}jumanly</span><h2>Créez votre compte</h2><p>Gratuit. Postuler aux offres reste gratuit pour toujours.</p></div>
<a class="verre fourn tap" data-n="22"><span class="lf" style="background:#4285F4">G</span>Continuer avec Google</a>
<a class="verre fourn"><span class="lf" style="background:#0A66C2">in</span>Continuer avec LinkedIn</a>
<div class="ou">ou</div>
<a class="bt p pl">{ic("message","s")}Continuer avec mon e-mail</a>
<p class="mention">En continuant, vous acceptez les <a>conditions</a> et la <a>politique de confidentialité</a>. Déjà inscrit ? <a>Se connecter</a></p>''', cls='auth', avec_nav=False)

OB1 = phone(f'''{tete_f("", droite=None)}{pas(1,4)}<span class="pas-t">1 sur 4</span>
<div class="ob-q"><h2>Qu’est-ce qui vous amène ?</h2><p>Jumanly adapte vos offres et formations à cet objectif.</p></div>
<div class="obj-g">
<div class="o1 on"><span class="cases">{ic("opportunites","s")}</span><b>Trouver mon premier emploi</b>Stage, premier CDD ou CDI</div>
<div class="o2"><span class="cases">{ic("candidature","s")}</span><b>Changer d’emploi</b>Un poste qui me correspond mieux</div>
<div class="o3"><span class="cases">{ic("former","s")}</span><b>Monter en compétences</b>Apprendre et le prouver</div>
<div class="o4"><span class="cases">{ic("cap","s")}</span><b>Me reconvertir</b>Changer de métier</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Continuer</a></div>')

OB2 = phone(f'''{tete_f("", droite=None)}{pas(2,4)}<span class="pas-t">2 sur 4</span>
<div class="ob-q"><h2>Vos études et votre domaine</h2></div>
<span class="lab-c">Niveau d’études</span>
<div class="puces"><span class="puce">Secondaire</span><span class="puce">Bac + 2</span><span class="puce on">Licence</span><span class="puce">Master</span><span class="puce">Autre</span></div>
<span class="lab-c">Domaine</span>
<div class="verre rech">{ic("recherche","s")}<span>Rechercher un domaine</span></div>
<div class="puces"><span class="puce on">{OK()}Data et statistiques</span><span class="puce">Finance</span><span class="puce">Marketing</span><span class="puce">Informatique</span><span class="puce">Énergie</span><span class="puce">Santé</span></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Passer</a><a class="bt p pl">Continuer</a></div>')

OB3 = phone(f'''{tete_f("", droite=None)}{pas(3,4)}<span class="pas-t">3 sur 4</span>
<div class="ob-q"><h2>Où et comment travailler ?</h2><p>Le pays n’est demandé qu’ici. Vous le changez dans votre profil.</p></div>
<div class="champ"><label>Pays et ville</label><div class="verre saisie">{ic("localisation","s")}&nbsp;&nbsp;RD Congo · Kinshasa</div></div>
<span class="lab-c">Type de contrat</span>
<div class="puces"><span class="puce on">CDI</span><span class="puce on">CDD</span><span class="puce">Stage</span><span class="puce">Freelance</span></div>
<span class="lab-c">Mode de travail</span>
<div class="seg"><span>Sur site</span><span class="on">Hybride</span><span>À distance</span></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Passer</a><a class="bt p pl">Continuer</a></div>')

OB4 = phone(f'''{tete_f("", droite=None)}{pas(4,4)}<span class="pas-t">4 sur 4</span>
<div class="pret"><span class="rond-ok" style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("valider")}</span><h2>Votre espace est prêt</h2><p>Vous commencez avec la formule gratuite. Vous pourrez en changer à tout moment.</p></div>
<div class="form fr on"><div class="h"><b>Free</b><span class="prix">0 $</span></div>
<ul><li>{OK()}Postuler à toutes les offres</li><li>{OK()}Profil et suivi des candidatures</li><li>{OK()}Un modèle de CV, formations gratuites</li></ul></div>
<div class="verre carte sugg">{orbi(36)}<div class="t"><small>Pour aller plus loin</small><b>Starter dès 4,9 $ par mois : Orbi, plus de modèles de CV et de formations.</b><div><a class="bt sec s">Voir les formules</a></div></div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt a pl">Commencer gratuitement</a></div>')

# ---------- 2. Compte (par l’avatar) ----------
PM_AV = PM_JOB.replace('<span class="av">GM</span>', '<span class="av tap" data-n="1">GM</span>', 1)
COMPTE = phone(f'''{tete_f("Compte", droite=None)}
<div class="verre hub-id tap" data-n="2"><span class="av">GM</span><div class="t"><b>Grâce Mbuyi</b><span>Voir mon profil · 70 %</span></div>{ic("suivant","s")}</div>
<div class="verre liste lignes">
<div class="li tap" data-n="3"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>CV et documents</b><span>3 CV, 2 lettres</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("certificat","s")}</span><div class="t"><b>Attestations</b><span>3 obtenues</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("connexion","s")}</span><div class="t"><b>Connexions</b><span>48 personnes</span></div>{ic("suivant")}</div></div>
<div class="verre liste lignes">
<div class="li tap" data-n="4"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Abonnement</b><span>Pro · 112 crédits Orbi</span></div>{ic("suivant")}</div>
<div class="li tap" data-n="5"><span class="cases">{ic("reglages","s")}</span><div class="t"><b>Paramètres</b><span>Sécurité, confidentialité, notifications</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("aide","s")}</span><div class="t"><b>Aide</b><span>assistant@jumanly.io</span></div>{ic("suivant")}</div></div>
<div class="verre liste"><div class="li danger"><span class="cases">{ic("deconnexion","s")}</span><div class="t"><b>Se déconnecter</b></div></div></div>''', avec_nav=False)

# ---------- 3. Mon profil ----------
def sect(icn, c, t, n, corps='', ferme=False, tap=None):
    tp = f' tap" data-n="{tap}' if tap else ''
    sc = f'<div class="sc">{corps}</div>' if corps and not ferme else ''
    return f'<div class="verre sect{" ferme" if ferme else ""}{tp}"><div class="sh"><span class="cases {c}" style="background:var(--g-{c})">{ic(icn,"s")}</span><b>{t}</b><small>{n}</small>{ic("suivant","s").replace("class=\"ic", "class=\"ic chev")}</div>{sc}</div>'
PROF = phone(f'''<div class="pf-cov">{PF_COV}</div><div class="pf-top">{bi("retour")}<span style="display:flex;gap:8px">{bi("partager")}{bi("modifier")}</span></div>
<div class="pf-id"><span class="av">GM</span><h2>Grâce Mbuyi</h2><p>Analyste de données · Kinshasa</p><span class="cap"><i></i>Vise : premier emploi en data</span></div>
<div class="pf-act"><a class="bt p m pl tap" data-n="6">{orbi(20)}Faire le point</a><a class="bt sec m tap" data-n="7">{ic("profil","s")}Vu par un recruteur</a></div>
<div class="verre compl"><span class="anneau" style="width:46px;height:46px"><b style="width:36px;height:36px;font-size:11px">70 %</b></span><div class="t"><b>Profil à 70 %</b><span>Ajoutez un projet pour atteindre 80 %</span></div>{ic("suivant","s")}</div>
{sect("cap","former","Compétences","6",
 '<div class="prv"><b>Power BI</b><span class="pr">' + ic("certificat","xs") + 'Attestation</span></div><div class="prv"><b>SQL</b><span class="pr">' + ic("realisation","xs") + 'Projet</span></div><div class="prv"><b>Python</b><span class="pr n">Déclarée</span></div>')}
{sect("realisation","oppo","Projets","3", ferme=True)}
{sect("entreprise","accomp","Expériences","2", ferme=True)}''', avec_nav=False, cls='long')

PROF2 = phone(f'''{tete_f("Mon profil", droite="modifier")}
{sect("realisation","oppo","Projets","3",
 '<div class="projs"><span class="re">' + REAL["tb"] + '<b>Tableau de bord des agences</b></span><span class="re">' + REAL["pdf"] + '<b>Rapport épargne mobile</b></span></div><a class="ajout s tap" data-n="8">' + ic("plus","s") + 'Ajouter un projet</a>')}
{sect("entreprise","accomp","Expériences","2", ferme=True)}
{sect("former","former","Études","Licence", ferme=True)}
{sect("certificat","former","Attestations et certificats","3", ferme=True)}
{sect("document","accomp","Langues","2", ferme=True)}
{sect("cap","oppo","Ce que je cherche","CDI · Kinshasa", ferme=True)}''', avec_nav=False)

APERCU = phone(f'''{tete_f("Vu par un recruteur", droite="fermer")}
<div class="vu-rec">{ic("profil","s")}Aperçu : c’est ce que voit Baobab Fintech.</div>
<div class="verre masque">
<div class="l"><span>Titre</span><b>Analyste de données</b></div>
<div class="l"><span>Compétences</span><b>Power BI ✓, SQL ✓, Python</b></div>
<div class="l"><span>Projets</span><b>3 projets publics</b></div>
<div class="l"><span>Attestations</span><b>3, vérifiables</b></div>
<div class="l"><span>CV</span><b>Celui envoyé avec la candidature</b></div></div>
<span class="ck-t">Jamais utilisé pour le score</span>
<div class="verre masque">
<div class="l"><span>Photo, âge, genre</span><s>exclus du matching</s></div>
<div class="l"><span>Nationalité, situation familiale</span><s>exclus du matching</s></div>
<div class="l"><span>Adresse précise</span><s>ville seulement</s></div></div>
<div class="gar">{ic("confidentialite","s")}Un recruteur voit votre profil seulement si vous postulez ou le rendez visible.</div>''', avec_nav=False)

PROJ = phone(f'''{tete_f("Nouveau projet", droite="fermer")}
<div class="depot s"><span class="cases">{ic("photo","s")}</span><b>Ajouter des photos ou un PDF</b><span>Jusqu’à 6 fichiers</span></div>
<div class="champ"><label>Titre</label><div class="verre saisie focus">Prévision des ventes d’une boutique</div></div>
<div class="champ"><label>Ce que vous avez fait</label><div class="verre saisie" style="height:84px;align-items:flex-start;padding-top:14px;color:var(--texte2)">Le problème, votre rôle, le résultat chiffré</div></div>
<span class="lab-c">Compétences utilisées</span>
<div class="puces"><span class="puce on">Python</span><span class="puce on">Excel</span><span class="puce">{ic("plus","xs")}Ajouter</span></div>
<div class="li" style="padding:0;border:0"><div class="t"><b>Visible par les recruteurs</b><span>Sinon, seulement vous</span></div><span class="sw on"></span></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Enregistrer</a></div>')

POINT = phone(f'''{tete_f("Faire le point", droite="fermer")}
<div class="bulle-o">{orbi(32)}<div class="verre corps"><span>Votre profil est solide pour des postes d’analyste junior à Kinshasa.</span></div></div>
<div class="verre point"><h4>Vos atouts</h4>
<div class="pt ok"><i>{OK()}</i><span>Power BI prouvé par une attestation</span></div>
<div class="pt ok"><i>{OK()}</i><span>Un projet chiffré sur les agences</span></div></div>
<div class="verre point"><h4>À renforcer</h4>
<div class="pt ko"><i>{ic("plus","xs")}</i><span>SQL avancé : demandé par 7 offres sur 10</span></div>
<div class="pt ko"><i>{ic("plus","xs")}</i><span>Aucune expérience décrite avec un résultat</span></div></div>
<div class="rebond"><b>Prochaine action</b><span>Module « SQL : jointures », 30 min</span><a class="bt sec s">Commencer</a></div>
<a class="pq">{ic("pourquoi")}Pourquoi ces conseils ?</a>''', avec_nav=False)

# ---------- 4. CV et documents ----------
def doc(t, s_, cls='', pp=None, tap=None):
    tp = f' tap" data-n="{tap}' if tap else ''
    p = f'<span class="pp">{pp}</span>' if pp else ''
    return f'<div class="verre doc{tp}"><span class="mini {cls}"><i></i><i></i><i></i><i></i><i></i></span><div class="t"><b>{t}</b><span>{s_}</span>{p}</div><a class="bi">{ic("plus-options","s")}</a></div>'
DOCS = phone(f'''{tete_f("CV et documents", droite=None)}
<div class="seg"><span class="on">CV<small>3</small></span><span>Lettres<small>2</small></span><span>LinkedIn</span></div>
{doc("Data · octobre","1 page · modifié le 12 oct.",'',"Principal")}
{doc("Data · Baobab","Adapté à une offre · 18 oct.")}
{doc("Général","2 pages · 2 sept.")}
<div class="bts"><a class="bt p m pl tap" data-n="9">{ic("plus","s")}Nouveau CV</a><a class="bt sec m pl tap" data-n="10">{ic("telecharger","s")}Importer</a></div>''', avec_nav=False)

def tpl(n, cls='', bdg=None, on=False, tap=None):
    tp = f' tap" data-n="{tap}' if tap else ''
    b = ''
    if bdg == 'ok': b = f'<span class="bdg">{OK()}Inclus</span>'
    elif bdg: b = f'<span class="bdg n">{ic("cadenas","xs")}{bdg}</span>'
    return f'<div class="tpl{" on" if on else ""}{tp}"><span class="pg {cls}">{b}<i class="h"></i><i class="c"></i><i></i><i class="k"></i><i></i><i class="c"></i><i></i><i class="k"></i><i></i></span>{n}</div>'
MODS = phone(f'''{tete_f("Choisir un modèle")}
<div class="puces"><span class="puce on">Tous</span><span class="puce">Sobres</span><span class="puce">Colonne</span><span class="puce">Créatifs</span></div>
<div class="tpls">{tpl("Kinshasa","", "ok", True, 11)}{tpl("Dakar","b","ok")}{tpl("Abidjan","c2","ok")}{tpl("Accra","d","ok")}</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Utiliser « Kinshasa »</a></div>')

EDIT = phone(f'''{tete_f("Data · octobre", droite="plus-options")}
<div class="verre ed-ap"><span class="pg"><i class="h"></i><i></i><i></i><i></i><i></i><i></i><i></i></span><div class="t"><b>Modèle Kinshasa</b><span>1 page · enregistré</span></div><a class="bt sec s">Aperçu</a></div>
<div class="reg"><span><i></i>Sapin</span><span>Aa · Sora</span><span>Compacte</span></div>
<span class="ck-t">Sections · glisser pour réordonner</span>
<div class="verre liste edl">
<div class="li"><span class="poig"><i></i><i></i><i></i></span><div class="t"><b>Résumé</b><span>3 lignes</span></div><span class="orb-b tap" data-n="12">{orbi(16)}Améliorer</span></div>
<div class="li"><span class="poig"><i></i><i></i><i></i></span><div class="t"><b>Expériences</b><span>2</span></div>{ic("suivant","s")}</div>
<div class="li"><span class="poig"><i></i><i></i><i></i></span><div class="t"><b>Compétences</b><span>6, depuis le profil</span></div>{ic("suivant","s")}</div>
<div class="li"><span class="poig"><i></i><i></i><i></i></span><div class="t"><b>Études</b><span>1</span></div>{ic("suivant","s")}</div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m pl tap" data-n="13">{ic("opportunites","s")}Adapter</a><a class="bt p pl tap" data-n="14">{ic("telecharger","s")}PDF</a></div>')

AVAP = phone(f'''{tete_f("Améliorer le résumé", droite="fermer")}
<div class="verre avap av-a"><small>Avant</small><p>Je suis une personne motivée qui aime les chiffres et travailler en équipe.</p></div>
<div class="verre avap ap"><small>Proposition d’Orbi</small><p>Analyste de données, <mark>Power BI et SQL</mark>. J’ai conçu un tableau de bord suivi par <mark>12 agences</mark> pour piloter l’épargne mobile.</p></div>
<div class="gar">{ic("cadenas","s")}Rien n’est modifié sans votre accord. 1 crédit Orbi sur 112.</div>
<a class="pq">{ic("pourquoi")}Pourquoi ces changements ?</a>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Refuser</a><a class="bt sec m">Modifier</a><a class="bt p pl">{ic("valider","s")}Accepter</a></div>')

ADAPT = phone(f'''{tete_f("Data · octobre", droite="plus-options")}
<div class="verre ed-ap"><span class="pg"><i class="h"></i><i></i><i></i><i></i><i></i><i></i><i></i></span><div class="t"><b>Modèle Kinshasa</b><span>1 page · enregistré</span></div></div>''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Adapter à une offre</h3>
{OFF_L}
<div class="verre ecart">
<div class="l ok">{ic("valider","s")}Power BI, Excel : déjà dans votre CV</div>
<div class="l ko">{ic("plus","s")}SQL avancé : à mettre en avant</div>
<div class="l ko">{ic("plus","s")}Mot-clé « reporting » absent</div></div>
<div class="gar">{ic("document","s")}Orbi crée une copie « Data · Baobab ». Votre CV principal ne change pas.</div>
<a class="bt p pl">{orbi(20)}Créer la copie adaptée</a></div>''')

IMPORT = phone(f'''{tete_f("Importer un CV")}
<div class="depot"><span class="cases">{ic("telecharger","s")}</span><b>Choisir un fichier</b><span>PDF ou Word, 5 Mo au plus</span></div>
<div class="verre pj"><span class="cases" style="background:linear-gradient(150deg,#E6F0FB,#9CC3EE)">{ic("connexion","s")}</span><div class="t"><b>Depuis LinkedIn</b><span>Fichier PDF de votre profil</span></div>{ic("suivant","s")}</div>
<span class="ck-t">Lu dans votre fichier · à vérifier</span>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("entreprise","s")}</span><div class="t"><b>2 expériences</b><span>Stagiaire data, Fleuve Banque…</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c1">{ic("cap","s")}</span><div class="t"><b>7 compétences</b><span>Excel, Power BI, SQL…</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("former","s")}</span><div class="t"><b>1 diplôme</b><span>Licence, Université de Kinshasa</span></div><span class="sw on"></span></div></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Ajouter à mon profil</a></div>')

LETTRES = phone(f'''{tete_f("CV et documents", droite=None)}
<div class="seg"><span>CV<small>3</small></span><span class="on">Lettres<small>2</small></span><span>LinkedIn</span></div>
{doc("Lettre · Baobab Fintech","Rédigée le 18 oct.","l")}
{doc("Lettre · candidature spontanée","5 sept.","l")}
<div class="verre carte sugg">{orbi(36)}<div class="t"><small>LinkedIn</small><b>Orbi propose un titre, un résumé et 5 compétences à copier sur LinkedIn.</b><div><a class="bt sec s">Préparer mon LinkedIn</a></div></div></div>
<a class="ajout">{ic("plus","s")}Nouvelle lettre</a>''', avec_nav=False)

# ---------- 5. Abonnement ----------
ABO = phone(f'''{tete_f("Abonnement", droite=None)}
<div class="verre fo-act"><div class="t"><small>Votre formule</small><b>Pro · 19,9 $/mois</b><span>Payée jusqu’au 12 novembre</span></div></div>
<div class="verre quotas">
<div class="quota"><div class="l"><b>Crédits Orbi</b><span>112 sur 150</span></div><span class="barre"><i style="width:75%"></i></span></div>
<div class="quota"><div class="l"><b>Entretiens écrits</b><span>4 sur 10</span></div><span class="barre"><i style="width:40%"></i></span></div>
<div class="quota"><div class="l"><b>Entretiens vocaux</b><span>1 sur 3</span></div><span class="barre"><i style="width:33%"></i></span></div>
<div class="quota"><div class="l"><b>Candidatures</b><span>Illimitées, gratuites</span></div></div></div>
<div class="verre liste lignes">
<div class="li tap" data-n="15"><span class="cases c2">{ic("progression","s")}</span><div class="t"><b>Changer de formule</b><span>Starter, Premium</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("portefeuille","s")}</span><div class="t"><b>Moyen de paiement</b><span>M-Pesa · 81 ••• 42</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("document","s")}</span><div class="t"><b>Factures</b><span>3 · en PDF</span></div>{ic("suivant")}</div></div>
<div class="gar">{ic("horloge","s")}Prépayé, sans renouvellement forcé. Un rappel 3 jours avant la fin.</div>''', avec_nav=False)

FORMS = phone(f'''{tete_f("Formules")}
<div class="seg"><span class="on">Mensuel</span><span>Annuel</span></div>
<div class="verre form"><div class="h"><b>Starter</b><span class="prix">4,9 $<small> /mois</small></span></div><ul><li>{OK()}30 crédits Orbi, 3 entretiens</li><li>{OK()}Modèles de CV Starter, LinkedIn</li></ul></div>
<div class="verre form"><span class="rec">Recommandé · votre formule</span><div class="h"><b>Pro</b><span class="prix">19,9 $<small> /mois</small></span></div><ul><li>{OK()}150 crédits, entretiens vocaux</li><li>{OK()}Adapter son CV à chaque offre</li><li>{OK()}Tous les parcours standards</li></ul></div>
<div class="verre form on tap" data-n="16"><div class="h"><b>Premium</b><span class="prix">49,9 $<small> /mois</small></span></div><ul><li>{OK()}500 crédits, 10 entretiens vocaux</li><li>{OK()}Rapports détaillés de progression</li><li>{OK()}Aide prioritaire</li></ul></div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Passer à Premium</a></div>')

PAY = phone(f'''{tete_f("Paiement")}
<div class="verre recu"><div><b>Premium · 1 mois</b><br><span>du 19 oct. au 18 nov.</span></div><span class="m">49,9 $</span></div>
<span class="ck-t">Mobile Money</span>
<div class="verre liste mm">
<div class="li"><span class="lf" style="background:#E2231A">M</span><div class="t"><b>M-Pesa</b><span>81 ••• 42</span></div><span class="radio" style="box-shadow:inset 0 0 0 7px var(--sapin)"></span></div>
<div class="li"><span class="lf" style="background:#FF7900">O</span><div class="t"><b>Orange Money</b></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div>
<div class="li"><span class="lf" style="background:#C8102E">A</span><div class="t"><b>Airtel Money</b></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div></div>
<div class="verre liste"><div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Carte bancaire</b><span>Visa, Mastercard</span></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div></div>
<div class="gar">{ic("message","s")}Vous validez sur votre téléphone avec votre code Mobile Money.</div>''', avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">{ic("cadenas","s")}Payer 49,9 $</a></div>')

# ---------- 6. Paramètres ----------
PARAM = phone(f'''{tete_f("Paramètres", droite=None)}
<div class="verre liste lignes">
<div class="li tap" data-n="17"><span class="cases c2">{ic("cadenas","s")}</span><div class="t"><b>Sécurité</b><span>Code par e-mail, double vérification</span></div>{ic("suivant")}</div>
<div class="li tap" data-n="18"><span class="cases c1">{ic("confidentialite","s")}</span><div class="t"><b>Confidentialité</b><span>Visibilité, consultations, Orbi</span></div>{ic("suivant")}</div>
<div class="li tap" data-n="19"><span class="cases c3">{ic("notification","s")}</span><div class="t"><b>Notifications</b><span>Par catégorie</span></div>{ic("suivant")}</div></div>
<div class="verre liste lignes">
<div class="li"><span class="cases">{ic("progression","s")}</span><div class="t"><b>Économiser les données</b><span>Images allégées, vidéo 240p</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases">{ic("orbi","s")}</span><div class="t"><b>Apparence</b><span>Automatique</span></div><span class="v">Auto</span></div>
<div class="li"><span class="cases">{ic("document","s")}</span><div class="t"><b>Langue</b><span>Français</span></div>{ic("suivant")}</div></div>
<div class="verre liste lignes">
<div class="li"><span class="cases">{ic("telecharger","s")}</span><div class="t"><b>Télécharger mes données</b><span>Fichier envoyé par e-mail</span></div>{ic("suivant")}</div>
<div class="li danger tap" data-n="20"><span class="cases">{ic("supprimer","s")}</span><div class="t"><b>Supprimer mon compte</b></div></div></div>''', avec_nav=False)

SECU4 = phone(f'''{tete_f("Sécurité")}
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("message","s")}</span><div class="t"><b>Connexion par code e-mail</b><span>grace.mbuyi@exemple.cd</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("cadenas","s")}</span><div class="t"><b>Double vérification</b><span>Application d’authentification</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("connexion","s")}</span><div class="t"><b>Comptes liés</b><span>Google, LinkedIn</span></div>{ic("suivant")}</div></div>
<span class="ck-t">Code de l’application</span>
<div class="code6"><span>4</span><span>8</span><span>1</span><span class="f">2</span><span></span><span></span></div>
<span class="ck-t">Appareils connectés</span>
<div class="verre liste lignes">
<div class="li"><div class="t"><b>Ce téléphone</b><span>Kinshasa · maintenant</span></div><span class="st pre">Actif</span></div>
<div class="li"><div class="t"><b>Ordinateur · Chrome</b><span>Kinshasa · il y a 2 jours</span></div><span class="v">Déconnecter</span></div></div>''', avec_nav=False)

CONF = phone(f'''{tete_f("Confidentialité")}
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("profil","s")}</span><div class="t"><b>Visible par les recruteurs</b><span>Même sans candidature</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c1">{ic("orbi","s")}</span><div class="t"><b>Utiliser Orbi</b><span>Seulement pour m’aider</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("realisation","s")}</span><div class="t"><b>Projets publics</b><span>3 sur 3</span></div>{ic("suivant")}</div></div>
<span class="ck-t">Qui a consulté mon profil</span>
<div class="verre consult"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b><span>Après votre candidature · hier</span></div></div>
<div class="verre consult"><span class="lg-e amb">ME</span><div class="t"><b>Mwinda Énergie</b><span>Profil visible · 14 oct.</span></div></div>
<div class="gar">{ic("confidentialite","s")}Chaque consultation par un recruteur est enregistrée ici.</div>''', avec_nav=False)

NOTIF4 = phone(f'''{tete_f("Notifications")}
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("candidature","s")}</span><div class="t"><b>Candidatures</b><span>Statut, entretiens</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c2">{ic("message","s")}</span><div class="t"><b>Messages</b><span>Recruteurs, connexions</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c3">{ic("opportunites","s")}</span><div class="t"><b>Offres pour moi</b><span>Une fois par jour</span></div><span class="sw on"></span></div>
<div class="li"><span class="cases c1">{ic("former","s")}</span><div class="t"><b>Formations</b><span>Rappels de reprise</span></div><span class="sw"></span></div>
<div class="li"><span class="cases">{ic("portefeuille","s")}</span><div class="t"><b>Abonnement</b><span>Rappels de fin de période</span></div><span class="sw on"></span></div></div>
<span class="ck-t">Recevoir aussi par</span>
<div class="seg"><span class="on">Appli + e-mail</span><span>Appli seule</span></div>''', avec_nav=False)

SUPPR = phone(f'''{tete_f("Paramètres", droite=None)}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Supprimer mon compte ?</h3>
<div class="danger-c"><b>Ce qui sera effacé</b><p>Profil, CV, documents, messages et candidatures en cours, après 30 jours. Les attestations restent vérifiables par leur numéro.</p></div>
<div class="li" style="padding:0;border:0"><div class="t"><b>Télécharger mes données d’abord</b><span>Recommandé</span></div><span class="sw on"></span></div>
<div class="champ"><label>Tapez SUPPRIMER pour confirmer</label><div class="verre saisie">SUPPR</div></div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt dg off m pl">Supprimer</a></div></div>''')

# ---------- 7. Orbi en plein écran ----------
ORB_H = phone(f'''{tete_f("Historique Orbi", droite=None)}
<div class="verre rech">{ic("recherche","s")}<span>Rechercher dans mes échanges</span></div>
<div class="verre liste lignes hist">
<div class="li"><span class="cases c2">{ic("cv","s")}</span><div class="t"><b>Résumé du CV Data</b><span>Proposition acceptée · aujourd’hui</span></div></div>
<div class="li"><span class="cases c3">{ic("opportunites","s")}</span><div class="t"><b>Offre Baobab Fintech</b><span>Pourquoi 86 % · hier</span></div></div>
<div class="li"><span class="cases c1">{ic("entretien","s")}</span><div class="t"><b>Entraînement à l’entretien</b><span>8 questions · 15 oct.</span></div></div>
<div class="li"><span class="cases c1">{ic("lecon","s")}</span><div class="t"><b>La formule SI</b><span>Dans la leçon Excel · 14 oct.</span></div></div></div>
<div class="gar">{ic("supprimer","s")}Vous pouvez effacer un échange ou tout l’historique.</div>''', avec_nav=False)
ORB_P = A_ORB.replace('<span class="verre credits">18 crédits</span>', f'<span class="verre credits">112 crédits</span>{bi("horloge","","tap").replace("class=\"bi tap\"","class=\"bi tap\" data-n=\"21\"")}', 1)

# ---------- Drapeaux (dessins simplifiés) ----------
def _fl(c):
    return f'<svg class="fl" viewBox="0 0 30 20" aria-hidden="true"><defs><clipPath id="r"><rect width="30" height="20" rx="3"/></clipPath></defs><g clip-path="url(#r)">{c}</g><rect width="30" height="20" rx="3" fill="none" stroke="rgba(0,0,0,.12)"/></svg>'
def h3(a, b, c): return f'<rect width="30" height="7" fill="{a}"/><rect y="6.67" width="30" height="7" fill="{b}"/><rect y="13.33" width="30" height="6.67" fill="{c}"/>'
def v3(a, b, c): return f'<rect width="10" height="20" fill="{a}"/><rect x="10" width="10" height="20" fill="{b}"/><rect x="20" width="10" height="20" fill="{c}"/>'
STAR = lambda x, y, r, f: f'<polygon fill="{f}" points="' + ' '.join(f'{x + (r if i % 2 == 0 else r * .4) * __import__("math").sin(i * 3.14159 / 5):.2f},{y - (r if i % 2 == 0 else r * .4) * __import__("math").cos(i * 3.14159 / 5):.2f}' for i in range(10)) + '"/>'
FLAG = {
 'cd': _fl('<rect width="30" height="20" fill="#007FFF"/><path d="M0 17 27 0h3v3L3 20H0z" fill="#F7D618"/><path d="M0 18.6 28.6 0H30v1.4L1.4 20H0z" fill="#CE1021"/>' + STAR(6, 6, 3.6, '#F7D618')),
 'cg': _fl('<rect width="30" height="20" fill="#FBDE4A"/><path d="M0 0h20L0 20z" fill="#009543"/><path d="M30 0v20H10z" fill="#DC241F"/>'),
 'cm': _fl(v3('#007A5E', '#CE1126', '#FCD116') + STAR(15, 10.5, 3.6, '#FCD116')),
 'ga': _fl(h3('#009E60', '#FCD116', '#3A75C4')),
 'ci': _fl(v3('#F77F00', '#FFFFFF', '#009E60')),
 'sn': _fl(v3('#00853F', '#FDEF42', '#E31B23') + STAR(15, 10.5, 3.4, '#00853F')),
 'ng': _fl(v3('#008751', '#FFFFFF', '#008751')),
 'gh': _fl(h3('#CE1126', '#FCD116', '#006B3F') + STAR(15, 10.4, 3, '#000')),
 'rw': _fl('<rect width="30" height="20" fill="#00A1DE"/><rect y="10" width="30" height="5" fill="#FAD201"/><rect y="15" width="30" height="5" fill="#20603D"/><circle cx="24" cy="5" r="2.4" fill="#FAD201"/>'),
 'ke': _fl('<rect width="30" height="20" fill="#fff"/><rect width="30" height="6" fill="#000"/><rect y="7.5" width="30" height="5" fill="#BB0000"/><rect y="14" width="30" height="6" fill="#006600"/><ellipse cx="15" cy="10" rx="2.6" ry="5" fill="#BB0000" stroke="#000" stroke-width=".6"/>'),
 'ma': _fl('<rect width="30" height="20" fill="#C1272D"/>' + STAR(15, 10.6, 4, 'none').replace('fill="none"', 'fill="none" stroke="#006233" stroke-width="1"')),
 'ao': _fl('<rect width="30" height="10" fill="#CC092F"/><rect y="10" width="30" height="10" fill="#000"/><circle cx="15" cy="10" r="3.4" fill="none" stroke="#FFCB00" stroke-width="1.2"/>'),
 'za': _fl('<rect width="30" height="10" fill="#E03C31"/><rect y="10" width="30" height="10" fill="#001489"/><path d="M0 0l12 10L0 20" fill="#000" stroke="#FFB81C" stroke-width="2"/><path d="M-2 -2 13 10-2 22M12 10h20" fill="none" stroke="#fff" stroke-width="6"/><path d="M-2 -2 13 10-2 22M12 10h20" fill="none" stroke="#007749" stroke-width="3.4"/><path d="M0 2l10 8-10 8z" fill="#000"/>'),
 'us': _fl('<rect width="30" height="20" fill="#fff"/>' + ''.join(f'<rect y="{i * 20 / 13 * 2:.2f}" width="30" height="{20 / 13:.2f}" fill="#B22234"/>' for i in range(7)) + '<rect width="13" height="10.8" fill="#3C3B6E"/>'),
 'fr': _fl(v3('#0055A4', '#FFFFFF', '#EF4135')),
 'gb': _fl('<rect width="30" height="20" fill="#012169"/><path d="M0 0l30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0 0 20" stroke="#C8102E" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#C8102E" stroke-width="3.4"/>'),
 'be': _fl(v3('#000000', '#FDDA24', '#EF3340')),
 'de': _fl(h3('#000000', '#DD0000', '#FFCE00')),
 'ru': _fl(h3('#FFFFFF', '#0039A6', '#D52B1E')),
 'ca': _fl('<rect width="30" height="20" fill="#fff"/><rect width="7.5" height="20" fill="#D80621"/><rect x="22.5" width="7.5" height="20" fill="#D80621"/>' + STAR(15, 10.4, 3.6, '#D80621')),
}
def pays(code, nom, ind=None, on=False, k=''):
    d = f'<span class="v">{ind}</span>' if ind else ''
    r = '<span class="radio" style="box-shadow:inset 0 0 0 7px var(--sapin)"></span>' if on else ''
    return f'<div class="li py">{FLAG[code]}<div class="t"><b>{nom}</b>{k}</div>{d}{r}</div>'

# ---------- Connexion et mot de passe ----------
def champ(lab, val, cls='', ico=None, aide=''):
    i = f'{ic(ico,"s")}&nbsp;&nbsp;' if ico else ''
    a = f'<span class="aide-c">{aide}</span>' if aide else ''
    return f'<div class="champ"><label>{lab}</label><div class="verre saisie {cls}">{i}{val}</div>{a}</div>'
MDP = '<span class="mdp">••••••••••</span>'
CONNEX = phone(f"""<div class="auth-h"><span class="lgo">{LOGO}jumanly</span><h2>Bon retour</h2><p>Connectez-vous pour retrouver vos offres et vos formations.</p></div>
<a class="verre fourn"><span class="lf" style="background:#4285F4">G</span>Continuer avec Google</a>
<a class="verre fourn"><span class="lf" style="background:#0A66C2">in</span>Continuer avec LinkedIn</a>
<div class="ou">ou</div>
{champ('Adresse e-mail','grace.mbuyi@exemple.cd')}
<div class="champ"><label class="lab-l">Mot de passe<a>Mot de passe oublié ?</a></label><div class="verre saisie focus">{MDP}<span style="flex:1"></span>{ic("confidentialite","s")}</div></div>
<a class="bt p pl">Se connecter</a>
<a class="bt txt lien-m">{ic("message","s")}Recevoir un lien de connexion par e-mail</a>
<p class="mention">Pas encore de compte ? <a>Créer un compte</a></p>""", cls='auth', avec_nav=False)

MDP1 = phone(f"""{tete_f("Mot de passe oublié", droite=None)}
<div class="ob-q"><h2>Réinitialiser votre mot de passe</h2><p>Entrez l’adresse de votre compte. Nous vous envoyons un code à 6 chiffres.</p></div>
{champ('Adresse e-mail','grace.mbuyi@exemple.cd','focus')}
<div class="gar">{ic("confidentialite","s")}Pour votre sécurité, le message est le même que l’adresse existe ou non.</div>
<p class="mention">Vous ne retrouvez plus votre adresse ? Écrivez à <a>assistant@jumanly.io</a></p>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Envoyer le code</a></div>')

MDP2 = phone(f"""{tete_f("Nouveau mot de passe", droite=None)}
<div class="ob-q"><h2>Code reçu par e-mail</h2><p>Envoyé à g•••••@exemple.cd · valable 10 minutes</p></div>
<div class="code6"><span>4</span><span>8</span><span>1</span><span>2</span><span>0</span><span class="f">7</span></div>
{champ('Nouveau mot de passe', MDP, 'focus')}
<div class="force"><i class="ok"></i><i class="ok"></i><i class="ok"></i><i></i><span>Solide</span></div>
<div class="regles-m"><span class="ok">{OK()}10 caractères au moins</span><span class="ok">{OK()}Un chiffre</span><span>{ic("plus","xs")}Un symbole</span></div>
<p class="mention">Pas reçu ? <a>Renvoyer le code</a> dans 0:42</p>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Enregistrer</a></div>')

MDP3 = phone(f"""<span class="rond-ok">{ic("valider")}</span>
<h2 class="h2s">Mot de passe modifié</h2><p>Vous êtes connectée. Les autres appareils ont été déconnectés par sécurité.</p>
<a class="bt p pl" style="width:100%">Continuer</a>""", cls='conf', avec_nav=False)

# ---------- Inscription : compte, code, validation, bienvenue ----------
INS2 = phone(f"""{tete_f("Créer un compte", droite=None)}
{champ('Prénom et nom','Grâce Mbuyi')}
{champ('Adresse e-mail','grace.mbuyi@exemple.cd')}
{champ('Mot de passe', MDP, 'focus')}
<div class="force"><i class="ok"></i><i class="ok"></i><i class="ok"></i><i></i><span>Solide</span></div>
<div class="li" style="padding:0;border:0;min-height:44px"><span class="coche on">{OK()}</span><div class="t"><span style="color:var(--texte)">J’accepte les <b style="font-size:12px">conditions</b> et la <b style="font-size:12px">politique de confidentialité</b></span></div></div>
<div class="li" style="padding:0;border:0;min-height:44px"><span class="coche"></span><div class="t"><span style="color:var(--texte)">Recevoir des conseils et des offres par e-mail</span></div></div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Créer mon compte</a></div>')

VERIF = phone(f"""{tete_f("Vérifier l’e-mail", droite=None)}
<div class="pret"><span class="env-r">{ic("message")}</span><h2>Entrez le code</h2><p>Nous l’avons envoyé à grace.mbuyi@exemple.cd</p></div>
<div class="code6"><span>2</span><span>9</span><span>4</span><span class="f">0</span><span></span><span></span></div>
<p class="mention">Pas reçu ? Regardez dans les indésirables ou <a>renvoyez le code</a> dans 0:51.<br><a>Modifier l’adresse</a></p>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Valider</a></div>')

VALIDE = phone(f"""<span class="rond-ok">{ic("valider")}</span>
<h2 class="h2s">Compte validé</h2><p>Bienvenue sur Jumanly, Grâce. Encore 4 questions pour vous proposer les bonnes offres et formations.</p>
<div class="verre liste lignes" style="width:100%;text-align:left">
<div class="li"><span class="cases c3">{ic("cap","s")}</span><div class="t"><b>Votre objectif</b><span>30 secondes</span></div></div>
<div class="li"><span class="cases c1">{ic("former","s")}</span><div class="t"><b>Vos études et votre domaine</b><span>Facultatif</span></div></div>
<div class="li"><span class="cases c2">{ic("localisation","s")}</span><div class="t"><b>Où et comment travailler</b><span>Pays, contrat</span></div></div></div>
<a class="bt p pl" style="width:100%">C’est parti</a>""", cls='conf', avec_nav=False)

PAYS = phone(f"""{tete_f("", droite=None)}{pas(3,4)}""", avec_nav=False,
 bas=f"""<div class="voile"></div><div class="sheet haute"><div class="poignee"></div><h3>Votre pays</h3>
<div class="verre rech">{ic("recherche","s")}<span>Rechercher un pays</span></div>
<div class="liste pays-l">
{pays('cd','RD Congo',on=True)}
<span class="ck-t">Afrique centrale</span>
{pays('cg','Congo')}{pays('cm','Cameroun')}{pays('ga','Gabon')}{pays('ao','Angola')}{pays('rw','Rwanda')}
<span class="ck-t">Afrique de l’Ouest et de l’Est</span>
{pays('ci','Côte d’Ivoire')}{pays('sn','Sénégal')}{pays('ng','Nigeria')}</div></div>""")
PAYS2 = phone(f"""{tete_f("", droite=None)}{pas(3,4)}""", avec_nav=False,
 bas=f"""<div class="voile"></div><div class="sheet haute"><div class="poignee"></div><h3>Votre pays</h3>
<div class="verre rech">{ic("recherche","s")}<span>Rechercher un pays</span></div>
<div class="liste pays-l">
{pays('gh','Ghana')}{pays('ke','Kenya')}{pays('ma','Maroc')}
<span class="ck-t">Hors d’Afrique</span>
{pays('fr','France')}{pays('be','Belgique')}{pays('gb','Royaume-Uni')}{pays('de','Allemagne')}{pays('us','États-Unis')}{pays('ca','Canada')}{pays('ru','Russie')}
<span class="ck-t">Tous les pays de A à Z</span>{pays('za','Afrique du Sud')}</div></div>""")

OB3b = OB3.replace(f'<div class="verre saisie">{ic("localisation","s")}&nbsp;&nbsp;RD Congo · Kinshasa</div>',
 f'<div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;RD Congo<span style="flex:1"></span>{ic("suivant","s")}</div></div><div class="champ"><label>Ville</label><div class="verre saisie">{ic("localisation","s")}&nbsp;&nbsp;Kinshasa</div>').replace('<label>Pays et ville</label>', '<label>Pays</label>')

BIENV = phone(f"""{tete("Bonjour, Grâce")}
<div class="verre bienv"><span class="k">{orbi(28)}Bienvenue sur Jumanly</span><h3>Votre espace est prêt. Voici par où commencer.</h3>
<div class="pr-l"><span class="n1">1</span><b>Compléter mon profil</b><span>40 %</span></div>
<div class="pr-l"><span class="n1">2</span><b>Importer ou créer mon CV</b><span>5 min</span></div>
<div class="pr-l"><span class="n1">3</span><b>Voir mes 12 offres</b><span>Kinshasa</span></div></div>
{offre('baobab','BF','sap','Analyste de données junior','Baobab Fintech','Kinshasa',['CDI','Hybride'],86)}""", 'accueil',
 bas='<div class="toast-b">' + ic("valider","s") + 'Compte créé · formule Free</div>')

# ---------- Profil : édition ----------
EDIT_ID = phone(f"""{tete_f("Modifier le profil", droite=None)}
<div class="ph-ed"><span class="av" style="width:84px;height:84px;font-size:24px">GM</span><a class="bi">{ic("photo","s")}</a></div>
{champ('Titre','Analyste de données')}
{champ('Résumé','Je transforme des données en décisions…','', aide='Facultatif · 300 caractères')}
<div class="champ"><label>Pays et ville</label><div class="verre saisie">{FLAG["cd"]}&nbsp;&nbsp;RD Congo · Kinshasa<span style="flex:1"></span>{ic("suivant","s")}</div></div>
<div class="gar">{ic("confidentialite","s")}La photo n’entre jamais dans le score. Vous pouvez ne pas en mettre.</div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Enregistrer</a></div>')

EXP_F = phone(f"""{tete_f("Nouvelle expérience", droite="fermer")}
{champ('Poste','Stagiaire data','focus')}
{champ('Organisation','Fleuve Banque')}
<div class="dates"><div class="champ"><label>Début</label><div class="verre saisie">03 / 2025</div></div><div class="champ"><label>Fin</label><div class="verre saisie">09 / 2025</div></div></div>
<div class="li" style="padding:0;border:0;min-height:40px"><div class="t"><b>Poste actuel</b></div><span class="sw"></span></div>
<div class="champ"><label>Résultat obtenu</label><div class="verre saisie" style="height:76px;align-items:flex-start;padding-top:14px">Rapport mensuel automatisé : 2 jours gagnés par mois</div></div>
<div class="verre carte sugg">{orbi(32)}<div class="t"><small>Orbi peut reformuler</small><b>Vous validez avant l’ajout.</b></div></div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Ajouter</a></div>')

COMP_F = phone(f"""{tete_f("Compétences", droite="fermer")}
<div class="verre rech focus">{ic("recherche","s")}<span style="color:var(--texte)">sql</span></div>
<div class="puces"><span class="puce on">{OK()}SQL</span><span class="puce">SQL avancé</span><span class="puce">PostgreSQL</span></div>
<span class="ck-t">Niveau</span>
<div class="seg"><span>Débutant</span><span class="on">Intermédiaire</span><span>Avancé</span></div>
<span class="ck-t">Preuve</span>
<div class="verre liste lignes">
<div class="li"><span class="cases c1">{ic("certificat","s")}</span><div class="t"><b>Attestation Jumanly</b><span>SQL : bases · 4 oct.</span></div><span class="radio" style="box-shadow:inset 0 0 0 7px var(--sapin)"></span></div>
<div class="li"><span class="cases c3">{ic("realisation","s")}</span><div class="t"><b>Un projet</b><span>Tableau de bord des agences</span></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div>
<div class="li"><span class="cases">{ic("modifier","s")}</span><div class="t"><b>Déclarée seulement</b><span>Sans preuve</span></div><span class="radio" style="background:none;box-shadow:inset 0 0 0 2px var(--trait)"></span></div></div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Ajouter SQL</a></div>')

PREFS = phone(f"""{tete_f("Ce que je cherche", droite=None)}
<span class="ck-t">Métiers visés</span>
<div class="puces"><span class="puce on">Analyste de données</span><span class="puce on">Analyste BI</span><span class="puce">{ic("plus","xs")}Ajouter</span></div>
<span class="ck-t">Où travailler</span>
<div class="puces"><span class="puce on">{FLAG["cd"]}Kinshasa</span><span class="puce on">{FLAG["cg"]}Brazzaville</span><span class="puce">{ic("plus","xs")}Ajouter</span></div>
<span class="ck-t">Contrat et mode</span>
<div class="puces"><span class="puce on">CDI</span><span class="puce on">CDD</span><span class="puce on">Hybride</span><span class="puce">À distance</span></div>
{champ('Salaire souhaité','À partir de 600 $ par mois','', 'salaire', 'Visible seulement par vous et les recruteurs à qui vous postulez')}
<div class="li" style="padding:0;border:0"><div class="t"><b>Disponible</b><span>Dès maintenant</span></div><span class="sw on"></span></div>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt p pl">Enregistrer</a></div>')

def dim(n, t, v, cls=''):
    return f'<div class="dim"><span class="t">{t}</span><span class="barre"><i style="width:{v}%;{cls}"></i></span><b>{v}</b></div>'
DIAG = phone(f"""{tete_f("Diagnostic de carrière", droite="partager")}
<div class="verre diag-h"><span class="anneau" style="background:conic-gradient(#3DA14F 0,#2FD3A6 68%,var(--piste) 0)"><b>68</b></span><div class="t"><b>Prête pour un premier poste</b><span>Calculé sur vos réponses, les mêmes donnent le même résultat.</span></div></div>
<div class="verre dims">
{dim(1,'Compétences',74)}{dim(2,'Expérience',45)}{dim(3,'Documents',80)}{dim(4,'Visibilité',62)}{dim(5,'Préparation entretien',58)}{dim(6,'Réseau',40)}</div>
<a class="pq">{ic("pourquoi")}Pourquoi ces notes ?</a>""", avec_nav=False,
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Refaire</a><a class="bt p pl">Mon plan</a></div>')

PLAN = phone(f"""{tete_f("Mon plan de progression", droite=None)}
<div class="verre parc-h"><span class="k">Objectif · d’ici décembre</span><h2>Premier poste d’analyste data</h2><span class="barre"><i style="width:40%"></i></span></div>
<div class="etapes-p">
<div class="e"><span class="num ok">{ic("valider","xs")}</span><div class="verre"><b>Prouver Power BI</b><span>Attestation obtenue</span></div></div>
<div class="e"><span class="num en">2</span><div class="verre"><b>SQL : jointures</b><span>Formation · 30 min · en cours</span></div></div>
<div class="e"><span class="num">3</span><div class="verre"><b>Décrire 2 expériences avec un résultat</b><span>Profil · 10 min</span></div></div>
<div class="e"><span class="num">4</span><div class="verre"><b>S’entraîner à l’entretien</b><span>3 simulations</span></div></div></div>
<div class="gar">{ic("pourquoi","s")}Orbi propose, vous choisissez : chaque étape se modifie ou se retire.</div>""", avec_nav=False)

def per(lg, cls, nom, s_, act):
    return f'<div class="li"><span class="lg-e {cls}" style="width:40px;height:40px;font-size:12px">{lg}</span><div class="t"><b>{nom}</b><span>{s_}</span></div>{act}</div>'
CONNS = phone(f"""{tete_f("Connexions", droite="recherche")}
<div class="seg"><span class="on">Mes connexions<small>48</small></span><span>Demandes<small>2</small></span></div>
<span class="ck-t">Demandes reçues</span>
<div class="verre liste lignes">
{per('DI','sap','Daniel Ilunga','Chef de projet data · 12 en commun','<a class="bt p s">Accepter</a>')}
{per('FN','amb','Fatou Ndiaye','Analyste BI · 4 en commun','<a class="bt sec s">Ignorer</a>')}</div>
<span class="ck-t">Mes connexions</span>
<div class="verre liste lignes">
{per('AK','mer','Amani Kabila','Data scientist · Mwinda Énergie','<a class="bi">' + ic("message","s") + '</a>')}
{per('JM','sap','Joël Mutombo','Comptable · Fleuve Banque','<a class="bi">' + ic("message","s") + '</a>')}</div>
<div class="gar">{ic("message","s")}On écrit seulement à une connexion acceptée.</div>""", avec_nav=False)

LINKEDIN = phone(f"""{tete_f("Préparer LinkedIn", droite=None)}
<div class="verre li-b"><small>Titre proposé</small><p>Analyste de données · Power BI, SQL · Kinshasa</p><a class="bt sec s">{ic("document","xs")}Copier</a></div>
<div class="verre li-b"><small>Résumé proposé</small><p>J’aide les équipes à décider plus vite avec des tableaux de bord clairs. Mon dernier projet est suivi par 12 agences.</p><a class="bt sec s">{ic("document","xs")}Copier</a></div>
<div class="verre li-b"><small>5 compétences à ajouter</small><div class="comp"><span class="v">Power BI</span><span class="v">SQL</span><span>Excel</span><span>Python</span><span>Reporting</span></div></div>
<div class="gar">{ic("cadenas","s")}Rien n’est publié sur LinkedIn : vous copiez ce que vous voulez.</div>""", avec_nav=False)

# ---------- Paiement : numéro, attente, reçu, factures ----------
PAYN = phone(f"""{tete_f("Paiement")}
<div class="verre recu"><div><b>Premium · 1 mois</b><br><span>du 19 oct. au 18 nov.</span></div><span class="m">49,9 $</span></div>
<div class="verre pj"><span class="lf-m" style="background:#E2231A">M</span><div class="t"><b>M-Pesa</b><span>Changer</span></div></div>
<div class="champ"><label>Numéro Mobile Money</label><div class="verre saisie focus tel"><span class="ind">{FLAG["cd"]}+243{ic("suivant","xs")}</span><span>81 234 56 42</span></div><span class="aide-c">Utilisé seulement pour ce paiement, jamais affiché.</span></div>""", avec_nav=False,
 bas=f"""<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Indicatif</h3>
<div class="verre rech">{ic("recherche","s")}<span>Pays ou indicatif</span></div>
<div class="liste pays-l">{pays('cd','RD Congo','+243',True)}{pays('cg','Congo','+242')}{pays('cm','Cameroun','+237')}{pays('ci','Côte d’Ivoire','+225')}{pays('sn','Sénégal','+221')}{pays('fr','France','+33')}{pays('be','Belgique','+32')}</div></div>""")

PAY_ATT = phone(f"""<span class="rond-att">{ic("horloge")}</span>
<h2 class="h2s">Validez sur votre téléphone</h2><p>M-Pesa vous envoie une demande de 49,9 $ au +243 81 ••• 42. Entrez votre code secret pour confirmer.</p>
<div class="verre attente"><span class="sp"></span>En attente de la confirmation · 1:48</div>
<a class="bt txt">Je n’ai rien reçu</a>""", cls='conf', avec_nav=False)

PAY_OK = phone(f"""<span class="rond-ok">{ic("valider")}</span>
<h2 class="h2s">Paiement reçu</h2><p>Premium est actif jusqu’au 18 novembre. Votre reçu est dans Factures et dans votre boîte e-mail.</p>
<div class="verre liste lignes" style="width:100%;text-align:left">
<div class="li"><div class="t"><span>Montant</span><b>49,9 $ · M-Pesa</b></div></div>
<div class="li"><div class="t"><span>Référence</span><b>JMN-PAY-8F2K41</b></div></div></div>
<a class="bt p pl" style="width:100%">Découvrir Premium</a>""", cls='conf', avec_nav=False)

FACT = phone(f"""{tete_f("Factures", droite=None)}
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Premium · octobre</b><span>19 oct. 2026 · M-Pesa</span></div><span class="v">49,9 $</span>{ic("telecharger","s")}</div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Pro · septembre</b><span>12 sept. 2026 · M-Pesa</span></div><span class="v">19,9 $</span>{ic("telecharger","s")}</div>
<div class="li"><span class="cases c2">{ic("document","s")}</span><div class="t"><b>Pro · août</b><span>12 août 2026 · carte</span></div><span class="v">19,9 $</span>{ic("telecharger","s")}</div></div>
<div class="gar">{ic("message","s")}Une question sur un paiement : assistant@jumanly.io</div>""", avec_nav=False)

AIDE = phone(f"""{tete_f("Aide", droite=None)}
<div class="verre rech">{ic("recherche","s")}<span>Rechercher dans l’aide</span></div>
<div class="verre liste lignes">
<div class="li"><span class="cases c3">{ic("candidature","s")}</span><div class="t"><b>Postuler et suivre</b><span>6 articles</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("former","s")}</span><div class="t"><b>Formations et attestations</b><span>5 articles</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c2">{ic("portefeuille","s")}</span><div class="t"><b>Paiement et formules</b><span>7 articles</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("confidentialite","s")}</span><div class="t"><b>Données et confidentialité</b><span>4 articles</span></div>{ic("suivant")}</div></div>
<div class="verre contact"><b>Écrire à l’équipe</b><span>assistant@jumanly.io · réponse sous 2 jours ouvrés</span><a class="bt p s">{ic("message","xs")}Écrire un e-mail</a></div>""", avec_nav=False)

# ---------- Chemins ----------
CHEMINS = [
 ('Se connecter', ['Ouverture de l’appli', 'Se connecter', 'Google, LinkedIn, mot de passe ou lien par e-mail']),
 ('Mot de passe oublié', ['Se connecter', 'Mot de passe oublié ?', 'Code par e-mail', 'Nouveau mot de passe', 'Connectée']),
 ('S’inscrire', ['Créer un compte', 'Nom, e-mail, mot de passe', 'Code par e-mail', 'Compte validé', '4 questions', 'Free par défaut', 'Bienvenue']),
 ('Choisir son pays', ['Étape 3', 'Pays', 'Liste avec drapeaux']),
 ('Ouvrir le compte', ['Toute page', 'Avatar', 'Compte']),
 ('Compléter mon profil', ['Compte', 'Mon profil', 'Crayon, Ajouter une expérience, une compétence ou un projet']),
 ('Dire ce que je cherche', ['Mon profil', 'Ce que je cherche']),
 ('Faire le point', ['Mon profil', 'Faire le point', 'Diagnostic', 'Mon plan']),
 ('Gérer mes connexions', ['Compte', 'Connexions', 'Accepter une demande']),
 ('Créer ou importer un CV', ['Compte', 'CV et documents', 'Nouveau CV ou Importer', 'Éditeur']),
 ('Améliorer ou adapter', ['Éditeur', 'Améliorer', 'Accepter ou refuser', 'ou', 'Adapter']),
 ('Préparer LinkedIn', ['CV et documents', 'LinkedIn', 'Copier']),
 ('Changer de formule', ['Compte', 'Abonnement', 'Changer de formule', 'Premium', 'Numéro Mobile Money', 'Valider sur le téléphone', 'Reçu']),
 ('Retrouver une facture', ['Abonnement', 'Factures', 'PDF']),
 ('Régler mon compte', ['Compte', 'Paramètres', 'Sécurité, confidentialité, notifications']),
 ('Obtenir de l’aide', ['Compte', 'Aide', 'Article ou e-mail']),
 ('Supprimer mon compte', ['Paramètres', 'Supprimer', 'Confirmer']),
 ('Revoir mes échanges', ['Onglet Orbi', 'Historique']),
]

def chemins():
    h = ''
    for t, et in CHEMINS:
        e = ''
        for i, x in enumerate(et):
            if isinstance(x, tuple): e += f'<span class="n">{x[0]}</span><span>{x[1]}</span>'
            elif x == 'ou': e += f'<em>{x}</em>'
            else: e += f'<span>{x}</span>'
            if i < len(et) - 1 and not (isinstance(x, str) and x.startswith('ou')) and not (isinstance(et[i+1], str) and et[i+1].startswith('ou')): e += '<em>→</em>'
        h += f'<div class="chemin"><h4>{t}</h4><div class="ch-et">{e}</div></div>'
    return f'<div class="legende"><i>1</i>Les pastilles orange montrent où l’on appuie. Elles ne font pas partie de l’interface.</div><div class="chemins">{h}</div>'

ECR = [
 ('b0','0 · Comment on y arrive','Chaque écran porte des pastilles numérotées sur l’élément où l’on appuie. Voici les chemins.', []),
 ('b1','1 · Se connecter','Google, LinkedIn, mot de passe ou lien par e-mail. Mot de passe oublié en trois écrans.',
  [ecrans((CONNEX,'Se connecter','Mot de passe oublié, lien par e-mail, créer un compte.'),(MDP1,'Mot de passe oublié','Un code à 6 chiffres par e-mail.'),(MDP2,'Nouveau mot de passe','Code, nouveau mot de passe, solidité.'),(MDP3,'Mot de passe modifié','Les autres appareils sont déconnectés.'))]),
 ('b2','2 · Inscription et premiers pas','Compte, code par e-mail, compte validé, quatre questions, pays avec drapeaux, formule gratuite par défaut, bienvenue.',
  [ecrans((INS,'Créer un compte','Google, LinkedIn ou e-mail.'),(INS2,'Avec mon e-mail','Nom, e-mail, mot de passe, consentements.'),(VERIF,'Code de vérification','6 chiffres, renvoyer, modifier l’adresse.'),(VALIDE,'Compte validé','Le message qui suit le code.'),(OB1,'Objectif','Quatre objectifs en cartes.'),(OB2,'Études et domaine','Facultatif.'),(OB3b,'Lieu et contrat','Le pays n’est demandé qu’ici.'),(PAYS,'Choisir le pays','RD Congo en tête, puis l’Afrique par région.'),(PAYS2,'Plus bas dans la liste','Hors d’Afrique, puis tous les pays de A à Z.'),(OB4,'Espace prêt','Le message de fin des étapes ; Free par défaut.'),(BIENV,'Bienvenue','Première arrivée sur Pour moi : 3 premiers pas.'))]),
 ('b3','3 · Compte','Il n’est plus dans la barre : on l’ouvre par l’avatar, en haut de chaque onglet.',
  [ecrans((PM_AV,'Pour moi','L’avatar ouvre le compte.'),(COMPTE,'Compte','Profil, CV et documents, abonnement, paramètres.'),(CONNS,'Connexions','Demandes, connexions, message après acceptation.'))]),
 ('b4','4 · Mon profil','Sections repliables. Chaque compétence montre sa preuve. Le portfolio devient « Projets ».',
  [ecrans((PROF,'Mon profil','Faire le point, vu par un recruteur.'),(PROF2,'Sections','Ajouter un projet ; le reste replié.'),(EDIT_ID,'Modifier le profil','Photo facultative, titre, résumé, pays.'),(EXP_F,'Nouvelle expérience','Poste, dates, résultat.'),(COMP_F,'Compétence','Niveau et preuve.'),(PREFS,'Ce que je cherche','Métiers, villes avec drapeau, contrat, salaire.'),(PROJ,'Nouveau projet','Photos ou PDF, résultat, compétences.'),(APERCU,'Vu par un recruteur','Et ce qui n’entre jamais dans le score.'))]),
 ('b5','5 · Faire le point','Le bilan d’Orbi, le diagnostic calculé par des règles fixes, puis le plan.',
  [ecrans((POINT,'Faire le point','Atouts, à renforcer, prochaine action.'),(DIAG,'Diagnostic','Six notes sur 100, avec leur pourquoi.'),(PLAN,'Plan de progression','Étapes modifiables.'))]),
 ('b6','6 · CV et documents','Mes CV, mes lettres, LinkedIn. L’éditeur garde la main au talent.',
  [ecrans((DOCS,'Mes CV','Nouveau CV, importer.'),(LETTRES,'Lettres','Lettres et accès LinkedIn.'),(LINKEDIN,'Préparer LinkedIn','Titre, résumé, compétences à copier.'),(IMPORT,'Importer','Ce qui est lu, à cocher avant d’ajouter.'),(MODS,'Choisir un modèle','Les modèles inclus dans la formule.'),(EDIT,'Éditeur','Améliorer, adapter, PDF.'),(AVAP,'Avant, après','Accepter, modifier ou refuser.'),(ADAPT,'Adapter à une offre','Une copie, l’original ne change pas.'))]),
 ('b7','7 · Abonnement et paiement','Prépayé, sans surprise. Postuler reste gratuit dans toutes les formules.',
  [ecrans((ABO,'Abonnement','Formule, quotas, paiement, factures.'),(FORMS,'Formules','Choisir Premium.'),(PAY,'Moyen de paiement','Mobile Money ou carte.'),(PAYN,'Numéro et indicatif','Indicatif avec drapeau.'),(PAY_ATT,'Validation','Le code se tape sur le téléphone.'),(PAY_OK,'Paiement reçu','Reçu et référence.'),(FACT,'Factures','PDF à télécharger.'))]),
 ('b8','8 · Paramètres et aide','Sécurité, confidentialité, notifications, données, aide par e-mail.',
  [ecrans((PARAM,'Paramètres','Sécurité, confidentialité, notifications, supprimer.'),(SECU4,'Sécurité','Double vérification, appareils.'),(CONF,'Confidentialité','Visibilité, Orbi, consultations.'),(NOTIF4,'Notifications','Par catégorie.'),(SUPPR,'Supprimer','30 jours, données téléchargeables.'),(AIDE,'Aide','Articles, contact par e-mail.'))]),
 ('b9','9 · Orbi en plein écran','L’onglet du centre et l’historique des échanges.',
  [ecrans((ORB_P,'Orbi','Historique.'),(ORB_H,'Historique','Retrouver ou effacer un échange.'))]),
 ('b10','10 · Mode sombre','',
  [ecrans((sombre(CONNEX),'Se connecter',''),(sombre(PAYS),'Pays',''),(sombre(PROF),'Mon profil',''),(sombre(EDIT),'Éditeur',''),(sombre(PAYN),'Indicatif',''))]),
]
EXTRA = {'b0': chemins()}
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p).replace('</div></section>', EXTRA.get(i, '') + '</div></section>') if i in EXTRA else bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · talent, lot 4</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}{CSS3L}{CSS4}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly · refonte mobile · étape 2</span><h1>Talent, lot 4 : compte et profil</h1>
<p>19 octobre 2026. Connexion, mot de passe oublié, inscription et validation, premiers pas, pays avec drapeaux, compte, profil, diagnostic et plan, CV et documents, abonnement et paiement, paramètres, aide, historique d’Orbi. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
out = os.path.join(H, '..', 'refonte-mobile-talent-4.html')
exec(open(H + '/sans_tap.py').read()); html = sans_tap(html)
open(out, 'w').write(html); print(out, len(html))
