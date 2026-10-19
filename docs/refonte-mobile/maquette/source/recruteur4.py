# Refonte mobile · recruteur lot 4 : ATS avec Orbi, réponses groupées, messagerie, contacts, rejoindre une organisation, rapport PDF (19/10/2026).
# python3 recruteur4.py && node shot.js recruteur-4
import os
H = os.path.dirname(os.path.abspath(__file__))
exec(open(H + '/recruteur3.py').read().split("\nCHEMINS = [")[0])
exec(open(H + '/modeles4.py').read())

CSSR += '''
.ats-h{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:24px;background:linear-gradient(140deg,#0F3F37,#1C6B5A);color:#fff}
.ats-h .r{display:flex;align-items:center;gap:12px}.ats-h .r .t{flex:1;font-size:12px;color:#CFE9DF}.ats-h .r .t b{display:block;font-size:16px;color:#fff}
.ats-h .bt{background:#A6F26B;color:#0F3F37;height:46px!important;flex:none!important;display:flex;align-items:center;justify-content:center;font-weight:700}
.ats-h .cr{display:flex;gap:8px;font-size:11.5px;color:#CFE9DF}.ats-h .cr span{padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.1)}
.sombre .ats-h{background:linear-gradient(140deg,#13493F,#1E6A59)}
.rk{display:flex;gap:10px;align-items:center;padding:12px 14px}
.rk .no{width:24px;font-size:13px;font-weight:700;color:var(--texte2);text-align:center;flex:none}
.rk .av{width:42px;height:42px;font-size:12.5px;box-shadow:none;color:#0F3F37}
.rk .t{flex:1;min-width:0}.rk .t b{display:flex;gap:6px;align-items:center;font-size:14px}.rk .t span{font-size:11.5px;color:var(--texte2);display:block}
.rk .fx{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.rk .fx em{font-style:normal;font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:99px;background:var(--lime-c)}.rk .fx em.a{background:var(--ambre-c)}
.rk .cb{width:24px;height:24px;border-radius:8px;flex:none;box-shadow:inset 0 0 0 2px var(--trait);display:grid;place-items:center;color:#0F3F37}
.rk .cb.on{background:#A6F26B;box-shadow:none}.rk .cb .ic{width:14px;height:14px}
.rks{padding:0}.rks .rk+.rk{border-top:1px solid var(--trait)}
.rk.top{background:linear-gradient(90deg,rgba(166,242,107,.16),transparent 70%)}
.reco{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:22px;background:linear-gradient(150deg,#F2FCE6,#DDF6EE)}
.sombre .reco{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))}
.reco .h{display:flex;gap:10px;align-items:center}.reco .h .t{flex:1}.reco .h b{display:block;font-size:14px}.reco .h span{font-size:11.5px;color:var(--texte2)}
.reco .avs{display:flex}.reco .avs .av{width:34px;height:34px;font-size:10.5px;margin-left:-8px;box-shadow:0 0 0 2px #E8F8E4;color:#0F3F37}.reco .avs .av:first-child{margin-left:0}
.reco p{margin:0;font-size:12.5px;line-height:1.45}
.prog{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 16px;text-align:center}
.prog .big{width:132px;height:132px;border-radius:50%;background:conic-gradient(#2FD3A6 0 71%,var(--piste) 0);display:grid;place-items:center}
.prog .big b{width:108px;height:108px;border-radius:50%;background:var(--plein);display:grid;place-items:center;font-size:26px;line-height:1.1}
.prog .big b small{display:block;font-size:11px;color:var(--texte2);font-weight:500}
.lst-a{display:flex;flex-direction:column;padding:4px 14px}
.lst-a div{display:flex;gap:10px;align-items:center;font-size:12.5px;padding:8px 0;border-top:1px solid var(--trait)}.lst-a div:first-child{border-top:0}
.lst-a .o{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;flex:none;background:#A6F26B;color:#0F3F37}.lst-a .o .ic{width:12px;height:12px}
.lst-a .o.w{background:var(--zone)}.lst-a span.x{flex:1}.lst-a small{color:var(--texte2)}
.cmp-c{padding:0}
.cmp-c .r{display:grid;grid-template-columns:1.1fr 1.4fr 26px;gap:8px;align-items:center;padding:10px 14px;border-top:1px solid var(--trait);font-size:12px}
.cmp-c .r:first-child{border-top:0}.cmp-c .r.h{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2)}
.cmp-c .r b{font-weight:600}.cmp-c .r span{color:var(--texte2)}
.cmp-c .s{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800}
.cmp-c .s.v{background:#A6F26B;color:#0F3F37}.cmp-c .s.a{background:#F8CF73;color:#0F3F37}.cmp-c .s.m{background:var(--zone);color:var(--texte2)}
.qx{display:flex;flex-direction:column;gap:8px;padding:12px 14px;font-size:12.5px}
.qx div{display:flex;gap:8px}.qx div i{font-style:normal;font-weight:700;color:#1E9C78}
.sel-b{position:absolute;left:12px;right:12px;bottom:26px;z-index:4;display:flex;align-items:center;gap:8px;padding:8px 8px 8px 16px;border-radius:999px;background:#0F3F37;color:#fff}
.sel-b .t{flex:1;font-size:12px;color:#CFE9DF}.sel-b .t b{display:block;font-size:14px;color:#fff}
.sel-b .bt{height:44px;padding:0 16px}.sel-b .bt.p{background:#A6F26B;color:#0F3F37}.sel-b .bt.g{background:rgba(255,255,255,.12);color:#fff}
.sombre .sel-b{background:#1E6A59}
.ret-l{padding:0}
.ret-l .r{display:flex;gap:10px;align-items:center;padding:12px 14px;border-top:1px solid var(--trait)}.ret-l .r:first-child{border-top:0}
.ret-l .poig{display:flex;flex-direction:column;gap:3px;flex:none}.ret-l .poig i{width:14px;height:2px;border-radius:2px;background:var(--texte2);opacity:.5}
.ret-l .av{width:38px;height:38px;font-size:11.5px;box-shadow:none;color:#0F3F37}
.ret-l .t{flex:1}.ret-l .t b{display:block;font-size:13.5px}.ret-l .t span{font-size:11.5px;color:var(--texte2)}
.ch2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ch2 a{display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:18px;background:var(--plein);box-shadow:var(--verre);font-size:11.5px;color:var(--texte2)}
.ch2 a b{font-size:13px;color:var(--texte)}.ch2 a.on{box-shadow:0 0 0 2px #0F3F37,var(--verre)}
.sombre .ch2 a.on{box-shadow:0 0 0 2px #A6F26B}
.ch2 a .cases{width:32px;height:32px;border-radius:11px}
.env-t{display:flex;flex-direction:column;gap:6px;padding:12px 14px;font-size:12.5px;line-height:1.5;max-height:150px;overflow:hidden;position:relative}
.env-t:after{content:"";position:absolute;left:0;right:0;bottom:0;height:40px;background:linear-gradient(transparent,var(--plein))}
.env-t mark{background:#E4F8D2;border-radius:4px;padding:0 3px}
.relu{display:flex;gap:10px;align-items:center;font-size:12.5px}.relu .cb{width:22px;height:22px;border-radius:7px;background:#A6F26B;display:grid;place-items:center;color:#0F3F37;flex:none}.relu .cb .ic{width:13px;height:13px}
.long-m{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:22px;background:var(--plein);box-shadow:var(--verre);font-size:13px;line-height:1.55}
.long-m .h{display:flex;gap:10px;align-items:center}.long-m .h .lg-e{width:38px;height:38px;font-size:11px}.long-m .h .t{flex:1;font-size:11.5px;color:var(--texte2)}.long-m .h .t b{display:block;font-size:13.5px;color:var(--texte)}
.long-m p{margin:0}.long-m .cta{display:flex;gap:8px}
.long-m .invl{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:var(--zone);font-size:12px}
.req{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:24px;background:var(--plein);box-shadow:var(--verre)}
.req .h{display:flex;gap:12px;align-items:center}.req .h .lg-e{width:48px;height:48px;font-size:13px}.req .h .t{flex:1;font-size:12px;color:var(--texte2)}.req .h .t b{display:block;font-size:15px;color:var(--texte)}
.req p{margin:0;font-size:13px;line-height:1.5}
.req .vu{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:14px;background:var(--zone);font-size:12px}
.req .vu div{display:flex;gap:8px;align-items:center}.req .vu .o{width:18px;height:18px;border-radius:50%;background:#A6F26B;display:grid;place-items:center;color:#0F3F37}.req .vu .o.n{background:var(--trait)}.req .vu .o .ic{width:10px;height:10px}
.tl-c{display:flex;flex-direction:column;padding:12px 16px}
.tl-c .e{display:flex;gap:12px;position:relative;padding-bottom:14px;font-size:12.5px}.tl-c .e:last-child{padding-bottom:0}
.tl-c .e:before{content:"";position:absolute;left:11px;top:24px;bottom:0;width:2px;background:var(--trait)}.tl-c .e:last-child:before{display:none}
.tl-c .e .o{width:24px;height:24px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--zone);color:var(--texte2)}.tl-c .e .o .ic{width:12px;height:12px}
.tl-c .e.ok .o{background:#A6F26B;color:#0F3F37}.tl-c .e.at .o{background:#F8CF73;color:#0F3F37}
.tl-c .e b{display:block;font-size:13px}.tl-c .e span{color:var(--texte2)}
.ctc{padding:0}
.ctc .r{display:flex;gap:12px;align-items:center;padding:11px 14px;border-top:1px solid var(--trait)}.ctc .r:first-child{border-top:0}
.ctc .av{width:42px;height:42px;font-size:12px;box-shadow:none;color:#0F3F37}
.ctc .t{flex:1;min-width:0}.ctc .t b{display:flex;gap:6px;align-items:center;font-size:13.5px}.ctc .t span{font-size:11.5px;color:var(--texte2);display:block}
.ctc .bi{width:38px;height:38px}
.ctc .r .bt{height:32px;padding:0 12px;font-size:12px}
.org-f{display:flex;flex-direction:column;gap:0;padding:0;overflow:hidden;box-shadow:0 0 0 2px #A6F26B,var(--verre)}
.org-f .ban{height:62px}.org-f .ban svg{width:100%;height:100%}
.org-f .c{padding:0 14px 14px;margin-top:-22px;display:flex;flex-direction:column;gap:6px}
.org-f .lg-e{width:48px;height:48px;font-size:14px;box-shadow:0 0 0 3px var(--plein)}
.org-f b.n{font-size:16px;display:flex;align-items:center;gap:6px}.org-f span.m{font-size:12px;color:var(--texte2)}
.org-f .ok-v{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:99px;background:var(--lime-c);color:#2E6B1F}
.org-f .eq{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--texte2)}
.org-f .eq .avs{display:flex}.org-f .eq .av{width:26px;height:26px;font-size:9px;margin-left:-6px;box-shadow:0 0 0 2px var(--plein);color:#0F3F37}.org-f .eq .av:first-child{margin-left:0}
.trouve{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:#1E9C78}
.mail-g{display:flex;flex-wrap:wrap;gap:36px;align-items:flex-start;padding:10px 0 20px}
.mail-g figure{margin:0;display:flex;flex-direction:column;gap:10px}
.mail-g figcaption{font-size:13px;color:var(--texte2)}.mail-g figcaption b{color:var(--texte)}
.rp-g2{display:flex;flex-wrap:wrap;gap:32px;padding:10px 0 20px}
.rp-g2 .sc{width:635px;height:898px;overflow:hidden}
.rp-g2 .sc .rp-p{transform:scale(.8);transform-origin:0 0}
''' + RCSS

def rk(no, i, cls, nom, s_, sc, fx, cb=None, top=False, et=None):
    f = ''.join(f'<em class="{"a" if x.startswith("!") else ""}">{x.lstrip("!")}</em>' for x in fx)
    e = f'<span class="etq-s {et[1]}">{et[0]}</span>' if et else ''
    c = '' if cb is None else f'<span class="cb {"on" if cb else ""}">{CK if cb else ""}</span>'
    return f'<div class="rk{" top" if top else ""}">{c}<span class="no">{no}</span><span class="av {cls}">{i}</span><div class="t"><b>{nom}{e}</b><span>{s_}</span><div class="fx">{f}</div></div>{ring(sc)}</div>'

OFFRE_T = f'{tete_f("Analyste de données junior", droite="plus-options")}'

# ---------- 1. ATS : tout analyser ----------
ATS1 = phone(f'''{OFFRE_T}
<div class="filtres-h"><span class="puce on">Toutes<small>24</small></span><span class="puce">Reçues<small>9</small></span><span class="puce">En examen<small>7</small></span><span class="puce">Présélection</span></div>
<div class="ats-h"><div class="r">{orbi(40)}<div class="t"><b>Analyser les 24 CV</b>Orbi lit chaque dossier, le compare à l’offre et prépare un classement expliqué.</div></div>
<div class="cr"><span>24 crédits</span><span>99 disponibles</span><span>Environ 1 min</span></div><a class="bt pl">Lancer l’analyse</a></div>
<div class="sec-t"><h2>Classées par score</h2><a>Trier</a></div>
<div class="verre rks">
{rk(1,"AM","","Amani M.","1 an · Kinshasa · reçue il y a 2 h",88,["SQL","Power BI"],top=True)}
{rk(2,"GM","b","Grâce M.","2 ans · Kinshasa",86,["SQL","Projet BI"],et=("Retenue","ret"))}
{rk(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,["Power BI","!SQL à vérifier"])}
{rk(4,"PK","b","Patrick K.","1 an · Lubumbashi",74,["Excel","!Mobilité"])}</div>''', avec_nav=False, cls='long')

ATS2 = phone(f'''{OFFRE_T}
<div class="verre prog"><span class="big"><b>17<small>sur 24 CV</small></b></span><b style="font-size:15px">Orbi analyse les dossiers</b><span style="font-size:12px;color:var(--texte2)">Vous pouvez quitter l’écran, une notification arrive à la fin.</span></div>
<div class="verre lst-a">
<div><span class="o">{CK}</span><span class="x"><b>Amani M.</b> · CV, lettre, 2 réponses</span><small>88 %</small></div>
<div><span class="o">{CK}</span><span class="x"><b>Grâce M.</b> · CV, projet</span><small>86 %</small></div>
<div><span class="o">{CK}</span><span class="x"><b>Fatou N.</b> · CV, attestation</span><small>81 %</small></div>
<div><span class="o w">{ic("horloge","xs")}</span><span class="x"><b>Ange M.</b> · lecture du CV…</span><small></small></div>
<div><span class="o w">{ic("horloge","xs")}</span><span class="x"><b>Prisca L.</b> · en attente</span><small></small></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Je lis chaque dossier comme une donnée. Je ne tiens jamais compte du nom, de l’âge, du genre ni de la photo.</div></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec pl">Arrêter l’analyse</a></div>')

ATS3 = phone(f'''{OFFRE_T}
<div class="reco"><div class="h">{orbi(32)}<div class="t"><b>Recommandation d’Orbi</b><span>24 CV analysés · 24 crédits utilisés</span></div></div>
<div style="display:flex;align-items:center;gap:10px"><span class="avs"><span class="av">AM</span><span class="av b">GM</span><span class="av a">FN</span><span class="av">RB</span><span class="av b">DK</span></span><b style="font-size:13px">5 dossiers à voir en priorité</b></div>
<p>Ils ont SQL et Power BI, avec une preuve. Fatou et David : un point à vérifier en entretien.</p>
<div style="display:flex;gap:8px"><a class="bt p s">Voir les 5</a><a class="bt sec s">{ic("pourquoi","xs")}Pourquoi ?</a></div></div>
<div class="filtres-h"><span class="puce on">Recommandés<small>5</small></span><span class="puce">À vérifier<small>7</small></span><span class="puce">Tous<small>24</small></span></div>
<div class="verre rks">
{rk(1,"AM","","Amani M.","1 an · Kinshasa",88,["SQL ✓","Power BI ✓","Projet"],top=True)}
{rk(2,"GM","b","Grâce M.","2 ans · Kinshasa",86,["SQL ✓","Power BI ✓"],top=True)}
{rk(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,["Power BI ✓","!SQL"])}
{rk(4,"RB","","Ruth B.","Analyste BI · Kinshasa",80,["SQL ✓","Attestation"])}
{rk(5,"DK","b","David K.","Data analyst · Kinshasa",79,["SQL ✓","!Disponibilité"])}</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Sélectionner</a><a class="bt p pl">Liste des retenus</a></div>')

ATS4 = phone(f'''{tete_f("Profil pour cette offre", droite="plus-options")}
<div class="verre mini-c"><span class="av">AM</span><div class="t"><b>Amani M.</b><span>Reçue il y a 2 h · Kinshasa</span></div>{ring(88)}</div>
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Synthèse d’Orbi</b><span>Profil lu au regard de l’offre</span></div></div>
<div class="pt"><i class="v">✓</i><span>Les 3 compétences requises, dont 2 prouvées par un projet.</span></div>
<div class="pt"><i class="v">✓</i><span>Disponible maintenant, à Kinshasa, CDI accepté.</span></div>
<div class="pt"><i class="a">!</i><span>Python souhaité : non mentionné.</span></div></div>
<div class="verre cmp-c"><div class="r h"><span>Critère de l’offre</span><span>Ce que montre le dossier</span><span></span></div>
<div class="r"><b>SQL</b><span>Projet « Ventes 2025 », CV p. 1</span><span class="s v">✓</span></div>
<div class="r"><b>Power BI</b><span>Tableau de bord, lien public</span><span class="s v">✓</span></div>
<div class="r"><b>Excel</b><span>Déclaré dans le CV</span><span class="s v">✓</span></div>
<div class="r"><b>Python</b><span>Non indiqué</span><span class="s a">!</span></div>
<div class="r"><b>Disponibilité</b><span>Immédiate</span><span class="s v">✓</span></div>
<div class="r"><b>Documents</b><span>CV, lettre</span><span class="s v">✓</span></div></div>
<span class="lab-c">Questions proposées pour l’entretien</span>
<div class="verre qx"><div><i>1</i>Comment avez-vous fiabilisé les données du projet Ventes ?</div><div><i>2</i>Avez-vous déjà écrit un script, en Python ou autre ?</div></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Dossier</a><a class="bt a pl">{ic("valider","s")}Ajouter aux retenus</a></div>')

ATS_SEL = phone(f'''{OFFRE_T}
<div class="filtres-h"><span class="puce on">Recommandés<small>5</small></span><span class="puce">À vérifier<small>7</small></span><span class="puce">Tous<small>24</small></span></div>
<div class="li" style="padding:0 4px;border:0;min-height:30px"><div class="t"><b style="font-size:13px">5 sélectionnés</b></div><a style="font-size:12.5px;font-weight:700">Tout sélectionner</a></div>
<div class="verre rks">
{rk(1,"AM","","Amani M.","1 an · Kinshasa",88,["SQL ✓","Power BI ✓"],True)}
{rk(2,"GM","b","Grâce M.","2 ans · Kinshasa",86,["SQL ✓","Power BI ✓"],True)}
{rk(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,["Power BI ✓","!SQL"],True)}
{rk(4,"RB","","Ruth B.","Analyste BI · Kinshasa",80,["SQL ✓"],True)}
{rk(5,"DK","b","David K.","Data analyst · Kinshasa",79,["SQL ✓"],True)}
{rk(6,"PK","b","Patrick K.","1 an · Lubumbashi",74,["Excel"],False)}</div>''', avec_nav=False, cls='long',
 bas=f'<div class="sel-b"><div class="t"><b>5 sélectionnés</b>sur 24</div><a class="bt g">{ic("message","s")}</a><a class="bt p">Retenir</a></div>')

RETENUS = phone(f'''{tete_f("Liste des retenus", droite="plus")}
<div class="verre mini-c"><span class="cases" style="width:40px;height:40px;border-radius:13px;background:var(--g-former)">{ic("offre","s")}</span><div class="t"><b>Analyste de données junior</b><span>Pour l’étape Entretien · 5 personnes</span></div></div>
<div class="verre ret-l">
<div class="r"><span class="poig"><i></i><i></i><i></i></span><span class="av">AM</span><div class="t"><b>Amani M.</b><span>88 % · ajoutée par vous</span></div><span class="etq-s ret">Retenue</span></div>
<div class="r"><span class="poig"><i></i><i></i><i></i></span><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>86 % · entretien mardi 22</span></div><span class="etq-s ret">Retenue</span></div>
<div class="r"><span class="poig"><i></i><i></i><i></i></span><span class="av a">FN</span><div class="t"><b>Fatou N.</b><span>81 % · SQL à vérifier</span></div><span class="etq-s ret">Retenue</span></div>
<div class="r"><span class="poig"><i></i><i></i><i></i></span><span class="av">RB</span><div class="t"><b>Ruth B.</b><span>80 % · ajoutée par Olivier</span></div><span class="etq-s ret">Retenue</span></div>
<div class="r"><span class="poig"><i></i><i></i><i></i></span><span class="av b">DK</span><div class="t"><b>David K.</b><span>79 % · disponibilité à vérifier</span></div><span class="etq-s ret">Retenu</span></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">19 autres candidatures restent ouvertes. Leur envoyer une réponse ?</div><a class="bt sec s">Préparer</a></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">{ic("agenda","s")}Créneaux</a><a class="bt p pl">{ic("message","s")}Informer les 5</a></div>')

# ---------- 1 bis. ATS v4.1 : rendu plus riche (retour d'Ephraïm du 19/10 « trop primaire ») ----------
CSSR += '''
.a2-c{position:relative;display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:22px;background:var(--plein);box-shadow:var(--verre);overflow:hidden}
.a2-c:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--a2c,#E2DCD2)}
.a2-c.r1{--a2c:linear-gradient(#A6F26B,#2FD3A6)}.a2-c.r2{--a2c:#2FD3A6}.a2-c.r3{--a2c:#F2B33D}
.a2-c .h{display:flex;gap:12px;align-items:center}
.a2-c .avw{position:relative;flex:none}.a2-c .avw .av{width:50px;height:50px;font-size:14px;box-shadow:none;color:#0F3F37}
.a2-c .md{position:absolute;right:-5px;bottom:-4px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;background:#fff;color:#0F3F37;box-shadow:0 2px 6px rgba(15,63,55,.25)}
.a2-c.r1 .md{background:#0F3F37;color:#A6F26B}.a2-c.r2 .md{background:#1E9C78;color:#fff}.a2-c.r3 .md{background:#F2B33D;color:#0F3F37}
.a2-c .h .t{flex:1;min-width:0}.a2-c .h .t b{display:flex;gap:6px;align-items:center;font-size:15px}.a2-c .h .t span{display:block;font-size:11.5px;color:var(--texte2);margin-top:2px}
.a2-sc{display:flex;flex-direction:column;align-items:center;flex:none}
.a2-sc .rg{width:56px;height:56px;border-radius:50%;background:conic-gradient(from 200deg,#A6F26B,#2FD3A6 calc(var(--p)*1%),var(--piste) 0);display:grid;place-items:center}
.a2-sc .rg b{width:44px;height:44px;border-radius:50%;background:var(--plein);display:grid;place-items:center;font-size:14px;font-weight:800}
.a2-sc small{font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);margin-top:3px;font-weight:700}
.a2-bars{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:10px 12px;border-radius:14px;background:var(--zone)}
.a2-bars div{display:flex;flex-direction:column;gap:5px;font-size:10.5px;color:var(--texte2);font-weight:600}
.a2-bars i{display:flex;gap:3px}.a2-bars i u{flex:1;height:5px;border-radius:3px;background:var(--trait)}.a2-bars i u.on{background:#2FD3A6}.a2-bars i u.am{background:#F2B33D}
.a2-f{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.a2-f em{font-style:normal;display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 9px;border-radius:99px;background:var(--lime-c)}
.a2-f em:before{content:"";width:6px;height:6px;border-radius:50%;background:#3DB86B}
.a2-f em.a{background:var(--ambre-c)}.a2-f em.a:before{background:#F2B33D}
.a2-f .pq2{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:700}.a2-f .pq2 .ic{width:13px;height:13px}
.a2-c.sel{box-shadow:0 0 0 2px #0F3F37,var(--verre)}.sombre .a2-c.sel{box-shadow:0 0 0 2px #A6F26B}
.a2-c .ck{width:28px;height:28px;border-radius:50%;flex:none;display:grid;place-items:center;box-shadow:inset 0 0 0 2px var(--trait)}
.a2-c.sel .ck{background:#0F3F37;color:#A6F26B;box-shadow:none}.sombre .a2-c.sel .ck{background:#A6F26B;color:#0F3F37}.a2-c .ck .ic{width:15px;height:15px}
.a2-c.mini{padding:12px 14px;gap:0}.a2-c.mini .avw .av{width:44px;height:44px;font-size:13px}
.a2-hero{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:26px;background:radial-gradient(120% 90% at 100% 0%,#2A7A66 0%,#0F3F37 60%);color:#fff}
.a2-hero .rings{position:absolute;right:-40px;top:-40px;width:180px;height:180px;opacity:.5}
.a2-hero .r{display:flex;gap:12px;align-items:center;position:relative}
.a2-hero .r .t{flex:1;font-size:12px;color:#CFE9DF;line-height:1.45}.a2-hero .r .t b{display:block;font-size:17px;color:#fff;margin-bottom:2px}
.a2-docs{position:relative;width:62px;height:58px;flex:none}
.a2-docs i{position:absolute;width:38px;height:48px;border-radius:7px;background:#fff;box-shadow:0 6px 14px -6px rgba(0,0,0,.4)}
.a2-docs i:after{content:"";position:absolute;left:7px;right:7px;top:9px;height:22px;background:repeating-linear-gradient(#D7E3DF 0 3px,transparent 3px 7px)}
.a2-docs i:nth-child(1){left:0;top:8px;transform:rotate(-12deg);opacity:.6}.a2-docs i:nth-child(2){left:12px;top:4px;transform:rotate(-4deg);opacity:.8}.a2-docs i:nth-child(3){left:24px;top:0;transform:rotate(6deg)}
.a2-docs b{position:absolute;right:-4px;bottom:-2px;width:26px;height:26px;border-radius:50%;background:#A6F26B;color:#0F3F37;display:grid;place-items:center;font-size:11px;font-weight:800;box-shadow:0 0 0 3px #0F3F37}
.a2-kp{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;position:relative}
.a2-kp div{padding:9px 10px;border-radius:14px;background:rgba(255,255,255,.08);font-size:10.5px;color:#CFE9DF}.a2-kp b{display:block;font-size:16px;color:#fff}
.a2-hero .bt{background:#A6F26B;color:#0F3F37;height:48px!important;flex:none!important;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;position:relative}
.a2-dist{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:20px;background:var(--plein);box-shadow:var(--verre)}
.a2-dist .h{display:flex;justify-content:space-between;font-size:12px;color:var(--texte2)}.a2-dist .h b{font-size:13.5px;color:var(--texte)}
.a2-dist .bar{display:flex;height:12px;border-radius:8px;overflow:hidden;gap:3px}.a2-dist .bar i{display:block}
.a2-dist .lg{display:flex;gap:12px;font-size:11px;color:var(--texte2)}.a2-dist .lg span{display:inline-flex;align-items:center;gap:5px}.a2-dist .lg span:before{content:"";width:8px;height:8px;border-radius:3px;background:var(--c)}
.a2-prog{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px 16px 18px;border-radius:26px;background:radial-gradient(110% 80% at 50% 0%,#2A7A66 0%,#0F3F37 65%);color:#fff;text-align:center}
.a2-prog .big{position:relative;width:150px;height:150px;border-radius:50%;background:conic-gradient(from 0deg,#A6F26B,#2FD3A6 71%,rgba(255,255,255,.12) 0);display:grid;place-items:center;box-shadow:0 0 40px -6px rgba(166,242,107,.55)}
.a2-prog .big:after{content:"";position:absolute;top:2px;left:calc(50% + 50px);width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 0 12px #A6F26B}
.a2-prog .big b{width:126px;height:126px;border-radius:50%;background:#0F3F37;display:grid;place-items:center;align-content:center;font-size:38px;line-height:1}
.a2-prog .big b small{display:block;font-size:11.5px;color:#CFE9DF;font-weight:500;margin-top:4px}
.a2-prog h3{margin:0;font-size:17px}.a2-prog p{margin:0;font-size:12px;color:#CFE9DF}
.a2-step{display:flex;width:100%;gap:6px}
.a2-step div{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:10.5px;color:#9CC9BC}
.a2-step div i{width:100%;height:4px;border-radius:3px;background:rgba(255,255,255,.14)}
.a2-step div.ok{color:#fff}.a2-step div.ok i{background:#A6F26B}.a2-step div.en{color:#fff;font-weight:700}.a2-step div.en i{background:linear-gradient(90deg,#2FD3A6 60%,rgba(255,255,255,.14) 0)}
.a2-fl{display:flex;flex-direction:column;gap:8px}
.a2-fl .r{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:18px;background:var(--plein);box-shadow:var(--verre)}
.a2-fl .r .av{width:38px;height:38px;font-size:11.5px;box-shadow:none;color:#0F3F37}
.a2-fl .r .t{flex:1;min-width:0}.a2-fl .r .t b{display:block;font-size:13px}.a2-fl .r .t span{font-size:11px;color:var(--texte2)}
.a2-fl .r .mb{height:4px;border-radius:3px;background:var(--trait);margin-top:6px;overflow:hidden}.a2-fl .r .mb i{display:block;height:100%;background:linear-gradient(90deg,#A6F26B,#2FD3A6)}
.a2-fl .pill{font-size:12px;font-weight:800;padding:5px 10px;border-radius:99px;background:var(--lime-c);color:#0F3F37}
.a2-fl .pill.w{background:var(--zone);color:var(--texte2);font-weight:600}
.a2-fl .r.en{box-shadow:0 0 0 1.5px #2FD3A6,var(--verre)}
.a2-pod{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:8px;align-items:end;padding:0 2px}
.a2-pod .p{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.a2-pod .p .av{width:50px;height:50px;font-size:14px;box-shadow:0 0 0 3px var(--plein),0 8px 18px -8px rgba(15,63,55,.5);color:#0F3F37}
.a2-pod .p.c1 .av{width:62px;height:62px;font-size:16px}
.a2-pod .p b{font-size:12.5px}.a2-pod .p small{font-size:10.5px;color:var(--texte2);margin-top:-4px}
.a2-pod .st{width:100%;border-radius:16px 16px 6px 6px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:10px;font-weight:800;font-size:18px;color:#0F3F37}
.a2-pod .c1 .st{height:84px;background:linear-gradient(180deg,#C9F79A,#A6F26B)}.a2-pod .c2 .st{height:64px;background:linear-gradient(180deg,#BDF0DF,#7FDEC0)}.a2-pod .c3 .st{height:50px;background:linear-gradient(180deg,#FFE7AE,#F8CF73)}
.a2-pod .st small{font-size:10px;font-weight:700;opacity:.7;margin:0;color:#0F3F37}
.sombre .a2-pod .p .av{box-shadow:0 0 0 3px #10302B}
.a2-crown{color:#A6F26B;margin-bottom:-4px}.a2-crown svg{width:22px;height:16px}
.a2-reco{position:relative;overflow:hidden;display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:26px;background:linear-gradient(160deg,#F2FCE6 0%,#DDF6EE 60%,#E4EEF9 100%)}
.sombre .a2-reco{background:linear-gradient(160deg,rgba(166,242,107,.16),rgba(47,211,166,.08) 60%,rgba(120,160,220,.08))}
.a2-reco .h{display:flex;gap:10px;align-items:center}.a2-reco .h .t{flex:1}.a2-reco .h b{display:block;font-size:15px}.a2-reco .h span{font-size:11.5px;color:var(--texte2)}
.a2-reco p{margin:0;font-size:12.5px;line-height:1.5}
.a2-reco .acts{display:flex;gap:8px}
.a2-tabs{display:flex;padding:4px;border-radius:16px;background:var(--zone);gap:4px}
.a2-tabs a{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;height:38px;border-radius:12px;font-size:12.5px;font-weight:600;color:var(--texte2)}
.a2-tabs a small{font-size:10.5px;padding:1px 7px;border-radius:99px;background:var(--trait)}
.a2-tabs a.on{background:var(--plein);color:var(--texte);box-shadow:0 4px 12px -6px rgba(15,63,55,.35)}.a2-tabs a.on small{background:#A6F26B;color:#0F3F37}
.a2-selh{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:var(--plein);box-shadow:var(--verre)}
.a2-selh .ck{width:24px;height:24px;border-radius:8px;background:#0F3F37;color:#A6F26B;display:grid;place-items:center}.a2-selh .ck .ic{width:13px;height:13px}
.sombre .a2-selh .ck{background:#A6F26B;color:#0F3F37}
.a2-selh .t{flex:1;font-size:12px;color:var(--texte2)}.a2-selh .t b{display:block;font-size:13.5px;color:var(--texte)}
.a2-selh a{font-size:12px;font-weight:700;padding:7px 12px;border-radius:99px;background:var(--zone)}
.a2-sb{position:absolute;left:12px;right:12px;bottom:24px;z-index:4;display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:26px;background:rgba(15,63,55,.94);backdrop-filter:blur(14px);color:#fff;box-shadow:0 20px 40px -16px rgba(15,63,55,.6)}
.a2-sb .h{display:flex;align-items:center;gap:10px}
.a2-sb .avs{display:flex}.a2-sb .avs .av{width:30px;height:30px;font-size:9.5px;margin-left:-5px;box-shadow:0 0 0 2px #0F3F37;color:#0F3F37}.a2-sb .avs .av:first-child{margin-left:0}
.a2-sb .h .t{flex:1;font-size:11.5px;color:#CFE9DF}.a2-sb .h .t b{display:block;font-size:14px;color:#fff}
.a2-sb .h .x{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1)}.a2-sb .h .x .ic{width:14px;height:14px}
.a2-sb .acts{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:8px}
.a2-sb .acts a{height:46px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;font-weight:700;background:rgba(255,255,255,.1);color:#fff}
.a2-sb .acts a .ic{width:16px;height:16px}
.a2-sb .acts a.p{background:#A6F26B;color:#0F3F37}
.sombre .a2-sb{background:rgba(30,106,89,.95)}
'''
_CROWN = '<span class="a2-crown"><svg viewBox="0 0 22 16"><path d="M2 14 L4 4 L8 9 L11 2 L14 9 L18 4 L20 14 Z" fill="currentColor"/></svg></span>'
_RINGS = '<svg class="rings" viewBox="0 0 180 180" fill="none" stroke="#A6F26B" stroke-opacity=".35"><circle cx="90" cy="90" r="30"/><circle cx="90" cy="90" r="55"/><circle cx="90" cy="90" r="80"/></svg>'

def _bars(v):
    out = ''
    for lab, n, am in v:
        u = ''.join(f'<u class="{("am" if am else "on") if k < n else ""}"></u>' for k in range(5))
        out += f'<div>{lab}<i>{u}</i></div>'
    return f'<div class="a2-bars">{out}</div>'

def rc(no, i, cls, nom, s_, sc, fx, bars=None, sel=None, et=None, pq=True, mini=False):
    f = ''.join(f'<em class="{"a" if x.startswith("!") else ""}">{x.lstrip("!")}</em>' for x in fx)
    p = f'<a class="pq2">{ic("pourquoi","xs")}Pourquoi ?</a>' if pq else ''
    e = f'<span class="etq-s {et[1]}">{et[0]}</span>' if et else ''
    r = f' r{no}' if no <= 3 else ''
    ck = '' if sel is None else f'<span class="ck">{CK if sel else ""}</span>'
    b = _bars(bars) if bars else ''
    return (f'<div class="a2-c{r}{" sel" if sel else ""}{" mini" if mini else ""}"><div class="h">{ck}<span class="avw"><span class="av {cls}">{i}</span><span class="md">{no}</span></span>'
            f'<div class="t"><b>{nom}{e}</b><span>{s_}</span></div><span class="a2-sc"><span class="rg" style="--p:{sc}"><b>{sc}</b></span><small>sur 100</small></span></div>'
            f'{b}{"" if mini else f"<div class=a2-f>{f}{p}</div>"}</div>')

ATS1 = phone(f'''{OFFRE_T}
<div class="a2-hero">{_RINGS}<div class="r"><span class="a2-docs"><i></i><i></i><i></i><b>24</b></span><div class="t"><b>Analyser les 24 CV</b>Orbi compare chaque dossier à l’offre et prépare un classement expliqué.</div></div>
<div class="a2-kp"><div><b>24</b>crédits</div><div><b>99</b>disponibles</div><div><b>≈ 1 min</b>durée</div></div>
<a class="bt pl">{orbi(22)}Lancer l’analyse</a></div>
<div class="a2-dist"><div class="h"><b>Où en sont les 24 candidatures</b><span>aujourd’hui</span></div>
<div class="bar"><i style="flex:9;background:#A6F26B"></i><i style="flex:7;background:#2FD3A6"></i><i style="flex:5;background:#F2B33D"></i><i style="flex:3;background:#9CC3EE"></i></div>
<div class="lg"><span style="--c:#A6F26B">Reçues 9</span><span style="--c:#2FD3A6">Examen 7</span><span style="--c:#F2B33D">Présél. 5</span><span style="--c:#9CC3EE">Entretien 3</span></div></div>
<div class="sec-t"><h2>Classées par score</h2><a>Trier</a></div>
{rc(1,"AM","","Amani M.","1 an · Kinshasa · reçue il y a 2 h",88,["SQL","Power BI"],[("Compétences",5,0),("Expérience",3,0),("Preuves",4,0)])}
{rc(2,"GM","b","Grâce M.","2 ans · Kinshasa",86,["SQL","Projet BI"],[("Compétences",4,0),("Expérience",4,0),("Preuves",4,0)],et=("Retenue","ret"))}
{rc(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,["Power BI","!SQL à vérifier"],[("Compétences",4,0),("Expérience",2,1),("Preuves",4,0)])}
{rc(4,"PK","b","Patrick K.","1 an · Lubumbashi",74,["Excel","!Mobilité"],[("Compétences",3,0),("Expérience",3,0),("Preuves",2,1)])}''', avec_nav=False, cls='long')

ATS2 = phone(f'''{OFFRE_T}
<div class="a2-prog"><span class="big"><b>17<small>sur 24 CV</small></b></span><h3>Orbi analyse les dossiers</h3><p>Environ 20 secondes. Vous pouvez quitter l’écran,<br>une notification arrive à la fin.</p>
<div class="a2-step"><div class="ok"><i></i>Lecture</div><div class="ok"><i></i>Compétences</div><div class="en"><i></i>Preuves</div><div><i></i>Classement</div></div></div>
<div class="sec-t"><h2>Dossier par dossier</h2><a>17 / 24</a></div>
<div class="a2-fl">
<div class="r"><span class="av">AM</span><div class="t"><b>Amani M.</b><span>CV, lettre, 2 réponses</span></div><span class="pill">88</span></div>
<div class="r"><span class="av b">GM</span><div class="t"><b>Grâce M.</b><span>CV, projet Power BI</span></div><span class="pill">86</span></div>
<div class="r en"><span class="av a">AN</span><div class="t"><b>Ange M.</b><span>Vérification des preuves…</span><div class="mb"><i style="width:62%"></i></div></div><span class="pill w">…</span></div>
<div class="r" style="opacity:.6"><span class="av">PL</span><div class="t"><b>Prisca L.</b><span>En attente</span></div><span class="pill w">{ic("horloge","xs")}</span></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Chaque dossier est lu comme une donnée. Nom, âge, genre et photo ne comptent jamais.</div></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec pl">Arrêter l’analyse</a></div>')

ATS3 = phone(f'''{OFFRE_T}
<div class="a2-reco"><div class="h">{orbi(34)}<div class="t"><b>Recommandation d’Orbi</b><span>24 CV analysés · 24 crédits utilisés</span></div></div>
<div class="a2-pod">
<div class="p c2"><span class="av b">GM</span><b>Grâce M.</b><small>2 ans</small><span class="st">2<small>86</small></span></div>
<div class="p c1">{_CROWN}<span class="av">AM</span><b>Amani M.</b><small>1 an</small><span class="st">1<small>88</small></span></div>
<div class="p c3"><span class="av a">FN</span><b>Fatou N.</b><small>Diplômée</small><span class="st">3<small>81</small></span></div></div>
<p><b>5 dossiers à voir en priorité.</b> Ils ont SQL et Power BI, avec une preuve. Fatou et David : un point à vérifier en entretien.</p>
<div class="acts"><a class="bt p s">Voir les 5</a><a class="bt sec s">{ic("pourquoi","xs")}Pourquoi ?</a></div></div>
<div class="a2-tabs"><a class="on">Recommandés<small>5</small></a><a>À vérifier<small>7</small></a><a>Tous<small>24</small></a></div>
{rc(4,"RB","","Ruth B.","Analyste BI · Kinshasa",80,["SQL","Attestation"],[("Compétences",4,0),("Expérience",3,0),("Preuves",5,0)])}
{rc(5,"DK","b","David K.","Data analyst · Kinshasa",79,["SQL","!Disponibilité"],[("Compétences",4,0),("Expérience",4,0),("Preuves",3,1)])}''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Sélectionner</a><a class="bt p pl">Liste des retenus</a></div>')

ATS_SEL = phone(f'''{OFFRE_T}
<div class="a2-tabs"><a class="on">Recommandés<small>5</small></a><a>À vérifier<small>7</small></a><a>Tous<small>24</small></a></div>
<div class="a2-selh"><span class="ck">{CK}</span><div class="t"><b>5 sur 5 sélectionnés</b>Recommandés par Orbi</div><a>Tout retirer</a></div>
{rc(1,"AM","","Amani M.","1 an · Kinshasa",88,[],sel=True,mini=True)}
{rc(2,"GM","b","Grâce M.","2 ans · Kinshasa",86,[],sel=True,mini=True)}
{rc(3,"FN","a","Fatou N.","Diplômée · Kinshasa",81,[],sel=True,mini=True)}
{rc(4,"RB","","Ruth B.","Analyste BI · Kinshasa",80,[],sel=True,mini=True)}
{rc(5,"DK","b","David K.","Data analyst · Kinshasa",79,[],sel=True,mini=True)}
{rc(6,"PK","b","Patrick K.","1 an · Lubumbashi",74,[],sel=False,mini=True)}
<div style="height:40px"></div>''', avec_nav=False, cls='long',
 bas=f'''<div class="a2-sb"><div class="h"><span class="avs"><span class="av">AM</span><span class="av b">GM</span><span class="av a">FN</span><span class="av">RB</span><span class="av b">DK</span></span><div class="t"><b>5 sélectionnés</b>sur 24 candidatures</div><span class="x">{ic("fermer","xs")}</span></div>
<div class="acts"><a>{ic("message","s")}Écrire</a><a>{ic("agenda","s")}Entretien</a><a class="p">{ic("valider","s")}Retenir</a></div></div>''')

# ---------- 2. Réponses groupées ----------
ENV = phone(f'''{tete_f("Répondre aux candidats", droite=None)}
<div class="ch2"><a class="on"><span class="cases" style="background:var(--g-accent)">{ic("valider","s")}</span><b>Retenus · 5</b>Invitation à l’entretien</a><a><span class="cases" style="background:var(--zone)">{ic("message","s")}</span><b>Non retenus · 19</b>Réponse respectueuse</a></div>
<span class="lab-c">Envoyer par</span>
<div class="puces"><span class="puce on">{OK()}Message Jumanly</span><span class="puce on">{OK()}E-mail</span></div>
<span class="lab-c">Modèle « Candidature retenue »</span>
<div class="verre env-t"><b>Objet : Vous êtes invité·e à un entretien</b><span>Bonjour <mark>{{prénom}}</mark>, merci pour votre candidature au poste d’Analyste de données junior. Nous avons lu votre dossier avec attention, et <mark>{{point fort relevé par Orbi}}</mark> a particulièrement retenu notre attention. Nous avons le plaisir de vous inviter à un entretien…</span></div>
<div class="orbi-l">{orbi(26)}<div class="t"><b>Orbi</b> personnalise une phrase par personne, à partir de son dossier. Vous voyez chaque message avant l’envoi.</div></div>
<div class="relu"><span class="cb">{CK}</span>J’ai relu les 5 messages</div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Aperçus</a><a class="bt p pl">{ic("envoyer","s")}Envoyer à 5</a></div>')

ENV_OK = phone(f'''{OFFRE_T}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Envoyer 19 réponses ?</h3>
<div class="verre liste lignes"><div class="li"><span class="cases" style="background:var(--zone)">{ic("message","s")}</span><div class="t"><b>Non retenus · 19</b><span>Message Jumanly et e-mail</span></div></div>
<div class="li"><span class="cases" style="background:var(--g-accomp)">{ic("horloge","s")}</span><div class="t"><b>Annulation possible 10 minutes</b><span>Rien ne part avant</span></div></div></div>
<div class="relu"><span class="cb">{CK}</span>J’ai relu le modèle et la liste des 19 personnes</div>
<div class="bts"><a class="bt sec m">Revoir la liste</a><a class="bt p m pl">Envoyer</a></div></div>''')

MSG_LONG = phone(f'''{tete_f("Aperçu du message", droite=None)}
<span class="lab-c">Ce que Grâce reçoit dans Jumanly</span>
<div class="long-m"><div class="h"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b>Nadia K. · Analyste de données junior</div><span class="etq-s ret">Retenue</span></div>
<p>Bonjour Grâce,</p>
<p>Merci pour votre candidature. Nous avons lu votre dossier avec attention, et votre <b>projet Power BI pour trois agences</b> a particulièrement retenu notre attention.</p>
<p>Nous avons le plaisir de vous inviter à un entretien de 45 minutes, en visio, avec Nadia et Olivier. Choisissez le créneau qui vous convient :</p>
<div class="invl"><span class="cases" style="width:34px;height:34px;border-radius:11px;background:var(--g-accomp)">{ic("agenda","s")}</span><div style="flex:1"><b style="display:block">Mardi 22 octobre</b>10:00 ou 14:30 · heure de Kinshasa</div></div>
<p>Si aucun créneau ne convient, répondez ici : nous trouverons une autre date. À très bientôt !</p>
<div class="cta"><a class="bt p s">Choisir un créneau</a><a class="bt sec s">Répondre</a></div></div>''', avec_nav=False, cls='long')

MSG_REFUS = phone(f'''{tete_f("Aperçu du message", droite=None)}
<span class="lab-c">Ce que Joël reçoit dans Jumanly</span>
<div class="long-m"><div class="h"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b>Nadia K. · Chargé de clientèle</div><span class="etq-s nr">Non retenu</span></div>
<p>Bonjour Joël,</p>
<p>Merci pour l’intérêt que vous portez à Baobab Fintech et pour le temps consacré à votre candidature.</p>
<p>Après avoir étudié l’ensemble des dossiers, notre équipe a retenu d’autres profils pour la suite de ce recrutement. Cette décision ne remet pas en cause la qualité de votre parcours.</p>
<p>Votre profil reste visible des recruteurs, et 12 offres de relation client sont ouvertes à Kinshasa.</p>
<p>Avec nos remerciements et tous nos vœux de réussite.</p>
<div class="cta"><a class="bt p s">Voir les offres proches</a></div></div>''', avec_nav=False, cls='long')

# ---------- 3. Conversation ----------
CONV_MENU = phone(CONV_TETE + CONV_CORPS, avec_nav=False, cls='long',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Patrick K.</h3>
<div class="verre liste lignes">
<div class="li"><span class="cases c2">{ic("candidats","s")}</span><div class="t"><b>Voir le dossier</b><span>Analyste de données junior</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c3">{ic("document","s")}</span><div class="t"><b>Modèles de messages</b><span>4 modèles</span></div>{ic("suivant")}</div>
<div class="li"><span class="cases c1">{ic("agenda","s")}</span><div class="t"><b>Proposer des créneaux</b></div>{ic("suivant")}</div>
<div class="li"><span class="cases">{ic("favori","s")}</span><div class="t"><b>Épingler la conversation</b></div></div>
<div class="li"><span class="cases">{ic("notification","s")}</span><div class="t"><b>Couper les notifications</b></div><span class="sw"></span></div>
<div class="li"><span class="cases">{ic("supprimer","s")}</span><div class="t"><b>Retirer de ma messagerie</b><span>Patrick garde ses messages</span></div></div>
<div class="li danger"><span class="cases">{ic("aide","s")}</span><div class="t"><b>Signaler</b></div></div></div></div>''')

CONV_PLUS = phone(CONV_TETE + CONV_CORPS, avec_nav=False, cls='long',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Ajouter au message</h3>
<div class="ch2"><a><span class="cases" style="background:var(--g-former)">{ic("document","s")}</span><b>Modèles</b>Insérés, puis relus</a><a><span class="cases" style="background:var(--g-accomp)">{ic("agenda","s")}</span><b>Créneaux</b>Depuis l’agenda</a><a><span class="cases" style="background:var(--g-oppo)">{ic("cv","s")}</span><b>Demander un document</b>Diplôme, attestation</a><a><span class="cases" style="background:var(--zone)">{ic("telecharger","s")}</span><b>Joindre un fichier</b>PDF, 5 Mo au plus</a></div>
<span class="lab-c">Modèles récents</span>
<div class="verre liste lignes">
<div class="li"><span class="cases c1">{ic("agenda","s")}</span><div class="t"><b>Invitation à un entretien</b><span>Avec les créneaux de l’offre</span></div><a class="bt sec s">Insérer</a></div>
<div class="li"><span class="cases c3">{ic("valider","s")}</span><div class="t"><b>Confirmation de date</b><span>Rappel du lien et de l’heure</span></div><a class="bt sec s">Insérer</a></div></div></div>''')

CONV_ORBI = phone(CONV_TETE + CONV_CORPS, avec_nav=False, cls='long',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3 style="display:flex;align-items:center;gap:8px">{orbi(26)}Orbi dans cette conversation</h3>
<div class="pq-o"><div class="h"><div class="t"><b>Résumé de l’échange</b><span>8 messages depuis le 18 oct.</span></div></div>
<div class="pt"><i class="v">1</i><span>Invité mardi 22 à 10:00 ou 14:30.</span></div>
<div class="pt"><i class="a">2</i><span>Indisponible mardi (examen), demande jeudi.</span></div>
<div class="pt"><i class="v">3</i><span>Vous avez proposé jeudi 24 à 11:00. Réponse en cours.</span></div></div>
<div class="ch2"><a><span class="cases" style="background:var(--g-accent)">{ic("message","s")}</span><b>Proposer une réponse</b>Brouillon à relire</a><a><span class="cases" style="background:var(--g-accomp)">{ic("modifier","s")}</span><b>Changer le ton</b>Chaleureux, formel</a><a><span class="cases" style="background:var(--g-former)">{ic("document","s")}</span><b>Traduire</b>Anglais, swahili</a><a><span class="cases" style="background:var(--g-oppo)">{ic("horloge","s")}</span><b>Relance</b>Si pas de réponse en 2 j</a></div>
<span style="font-size:11.5px;color:var(--texte2)">1 crédit par aide. Orbi n’envoie rien sans vous.</span></div>''')

CLEAN = phone(f'''{tete_r("Messages")}''', 'message',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3 style="display:flex;align-items:center;gap:8px">{orbi(26)}Alléger la messagerie</h3>
<p style="margin:0;font-size:12.5px;color:var(--texte2)">Ces conversations de candidats non retenus sont terminées depuis plus de 30 jours.</p>
<div class="verre rks">
<div class="rk"><span class="cb on">{CK}</span><span class="av">JT</span><div class="t"><b>Joël T.<span class="etq-s nr">Non retenu</span></b><span>Chargé de clientèle · 12 sept.</span></div></div>
<div class="rk"><span class="cb on">{CK}</span><span class="av a">AM</span><div class="t"><b>Ange M.<span class="etq-s nr">Non retenue</span></b><span>Comptable · 9 sept.</span></div></div>
<div class="rk"><span class="cb">{""}</span><span class="av b">PL</span><div class="t"><b>Prisca L.<span class="etq-s nr">Non retenue</span></b><span>Chargé de clientèle · 2 sept.</span></div></div></div>
<p style="margin:0;font-size:11.5px;color:var(--texte2)">Les candidats gardent leurs messages. Le dossier reste dans l’offre.</p>
<div class="bts"><a class="bt sec m">Garder</a><a class="bt p m pl">Retirer 2 conversations</a></div></div>''')

# ---------- 4. Contacts ----------
DEM_ENV = phone(f'''{tete_f("Proposer l’offre", droite=None)}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div>
<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:6px 0"><span class="rond-ok" style="width:64px;height:64px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("envoyer")}</span><h3 style="margin:4px 0 0">Demande envoyée à Ruth</h3><span style="font-size:12.5px;color:var(--texte2)">Elle reçoit l’offre et votre message. Vous serez prévenue de sa réponse.</span></div>
<div class="verre tl-c"><div class="e ok"><span class="o">{CK}</span><div><b>Envoyée</b><span>Aujourd’hui 10:05</span></div></div><div class="e at"><span class="o">{ic("horloge","xs")}</span><div><b>Ruth décide</b><span>Accepter ou refuser, sous 14 jours</span></div></div><div class="e"><span class="o">{ic("message","xs")}</span><div><b>Conversation ouverte</b><span>Si elle accepte</span></div></div></div>
<a class="bt p pl" style="flex:none;height:50px">Voir mes contacts</a></div>''')

TAL_REQ = phone(f'''{tete_f("Demande de contact", droite=None)}
<div class="req"><div class="h"><span class="lg-e sap">BF</span><div class="t"><b>Baobab Fintech</b>Nadia K. · Responsable recrutement · organisation vérifiée</div></div>
<p>Bonjour Ruth, votre attestation SQL et votre tableau de bord Power BI correspondent à ce que nous cherchons. L’offre vous intéresse-t-elle ?</p>
<div class="verre off-m" style="box-shadow:none;background:var(--zone)"><span class="im">{BAN["baobab"]}</span><div class="t"><b>Analyste de données junior</b><span>CDI · Hybride · Kinshasa</span></div></div>
<div class="vu"><b style="font-size:12px">Si vous acceptez, Baobab Fintech voit :</b><div><span class="o">{CK}</span>Votre profil complet et vos projets</div><div><span class="o">{CK}</span>Une conversation avec vous</div><div><span class="o n"></span>Pas votre téléphone ni votre adresse</div></div></div>
<div class="pq-o"><div class="h">{orbi(30)}<div class="t"><b>Ce que vous en dit Orbi</b><span>Votre profil et cette offre</span></div>{ring(84)}</div>
<div class="pt"><i class="v">✓</i><span>SQL et Power BI demandés : vous avez les deux, avec une attestation.</span></div>
<div class="pt"><i class="a">!</i><span>Python souhaité : une formation courte existe sur Jumanly.</span></div></div>
<span style="font-size:11.5px;color:var(--texte2);text-align:center">Écran du talent · la recruteuse n’est pas prévenue d’un refus</span>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Refuser</a><a class="bt p pl">{ic("valider","s")}Accepter</a></div>')
TAL_REQ = TAL_REQ.replace('la recruteuse n’est pas prévenue d’un refus', 'un refus est annoncé sans détail')

ACCEPTE = phone(f'''{tete_r("Messages")}''', 'message',
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div>
<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:6px 0"><span class="av enl" style="width:72px;height:72px;font-size:20px;color:#0F3F37">RB</span><h3 style="margin:6px 0 0">Ruth a accepté votre demande</h3><span style="font-size:12.5px;color:var(--texte2)">Analyste de données junior · il y a 2 min</span><span class="etq-s ct">Contact accepté</span></div>
<div class="orbi-l">{orbi(26)}<div class="t">Je peux préparer un premier message ou l’inviter à postuler.</div></div>
<div class="bts"><a class="bt sec m">Profil</a><a class="bt p m pl">{ic("message","s")}Écrire à Ruth</a></div></div>''')

CONTACTS = phone(f'''{tete_r("Contacts")}
<div class="verre rech">{ic("recherche","s")}<span>Nom, métier, offre</span></div>
<div class="filtres-h"><span class="puce on">Tous<small>18</small></span><span class="puce">Acceptés<small>12</small></span><span class="puce">En attente<small>4</small></span><span class="puce">Refusés<small>2</small></span></div>
<div class="verre ctc">
<div class="r"><span class="av enl">RB</span><div class="t"><b>Ruth B.<span class="etq-s ct">Accepté</span></b><span>Analyste BI · Kinshasa · en ligne</span></div><a class="bi">{ic("message","s")}</a></div>
<div class="r"><span class="av b">DK</span><div class="t"><b>David K.<span class="etq-s ct">Accepté</span></b><span>Data analyst · vu hier</span></div><a class="bi">{ic("message","s")}</a></div>
<div class="r"><span class="av">MT</span><div class="t"><b>Merveille T.<span class="etq-s at">En attente</span></b><span>Envoyée il y a 2 j · Analyste</span></div><a class="bt sec">Relancer</a></div>
<div class="r"><span class="av a">SL</span><div class="t"><b>Sarah L.<span class="etq-s at">En attente</span></b><span>Envoyée il y a 5 j · Analyste</span></div><a class="bt sec">Relancer</a></div>
<div class="r"><span class="av b">CN</span><div class="t"><b>Christian N.<span class="etq-s ct">Accepté</span></b><span>Comptable · vu lun.</span></div><a class="bi">{ic("message","s")}</a></div>
<div class="r"><span class="av">YK</span><div class="t"><b>Yannick K.<span class="etq-s nr">Refusé</span></b><span>Chargé de clientèle · 3 oct.</span></div></div></div>
<div class="verre quota-g"><div class="h"><b>Demandes ce mois</b><span>6 sur 10</span></div><span class="barre"><i style="width:60%"></i></span></div>''', 'candidats', 'long')

# ---------- 5. Rejoindre une organisation existante ----------
ORG_TROUVE = phone(f'''{tete_f("", droite=None)}{pas(2,3)}<span class="pas-t">2 sur 3</span>
<div class="ob-q"><h2>Votre organisation</h2><p>Elle apparaîtra sur vos offres.</p></div>
{champ('Nom','Baobab','focus')}
<span class="trouve">{ic("valider","xs")}Déjà sur Jumanly</span>
<div class="verre org-f"><span class="ban">{BAN["baobab"]}</span><div class="c"><span class="lg-e sap">BF</span><b class="n">Baobab Fintech<span class="ok-v">{ic("valider","xs")}Vérifiée</span></b><span class="m">Services financiers · 50 à 200 · {FLAG["cd"]} Kinshasa</span>
<div class="eq"><span class="avs"><span class="av">NK</span><span class="av b">OB</span></span>2 recruteurs · admin principale : Nadia K.</div></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Votre e-mail <b>@baobab-fintech.example</b> correspond à cette organisation.</div></div>
<a style="font-size:12.5px;font-weight:600;text-align:center">Ce n’est pas mon organisation</a>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec m">Retour</a><a class="bt p pl">Demander à rejoindre</a></div>')

JOIN_ATT = phone(f'''{tete_f("", droite=None)}
<div class="pret"><span class="rond-ok" style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("envoyer")}</span><h2>Demande envoyée</h2><p>Nadia K., admin principale de Baobab Fintech, a reçu une notification et un e-mail.</p></div>
<div class="verre tl-c"><div class="e ok"><span class="o">{CK}</span><div><b>Demande envoyée</b><span>Aujourd’hui 10:20</span></div></div><div class="e at"><span class="o">{ic("horloge","xs")}</span><div><b>L’admin choisit votre rôle</b><span>Recruteur, admin ou lecteur</span></div></div><div class="e"><span class="o">{ic("candidats","xs")}</span><div><b>Accès aux offres</b><span>Selon votre rôle</span></div></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">En attendant, vous pouvez compléter votre profil RH.</div><a class="bt sec s">Profil</a></div>''', avec_nav=False, cls='long',
 bas=f'<div class="verre fort bas-f"><a class="bt sec pl">Annuler la demande</a></div>')

ADM_NOTIF = phone(f'''{tete_f("Notifications", droite="reglages")}
<div class="grp-t">Aujourd’hui</div>
<div class="req" style="box-shadow:0 0 0 2px #F8CF73,var(--verre)"><div class="h"><span class="av" style="width:48px;height:48px;color:#0F3F37">MT</span><div class="t"><b>Merveille Tshala veut rejoindre Baobab Fintech</b>Chargée RH · e-mail sur votre domaine confirmé</div></div>
<div class="ch2"><a class="on"><b>Recruteur</b>Ses offres et candidats</a><a><b>Lecteur</b>Consulter et noter</a></div>
<span style="font-size:11.5px;color:var(--texte2)">Sièges : 2 sur 3 après acceptation</span>
<div class="bts" style="display:flex;gap:8px"><a class="bt sec m">Refuser</a><a class="bt p m pl" style="flex:1">{ic("valider","s")}Accepter</a></div></div>
<div class="verre liste lignes">
{nt('c3','candidature','4 nouvelles candidatures','Analyste de données junior','10:40',True)}
{nt('c2','entretien','Grâce M. a confirmé','Mardi 22 oct. à 10:00 · visio','10:12')}</div>''', avec_nav=False, cls='long')

# ---------- 6. Rapport PDF ----------
EXPORT = phone(f'''{tete_f("Rapports", droite=None)}''', avec_nav=False,
 bas=f'''<div class="voile"></div><div class="sheet"><div class="poignee"></div><h3>Exporter le rapport en PDF</h3>
<span class="lab-c">Période</span><div class="puces"><span class="puce on">Octobre</span><span class="puce">Trimestre</span><span class="puce">Personnalisée</span></div>
<span class="lab-c">Offres</span><div class="puces"><span class="puce on">Toutes · 4</span><span class="puce">Choisir</span></div>
<span class="lab-c">Contenu</span>
<div class="verre liste lignes"><div class="li"><div class="t"><b>Chiffres clés et étapes</b></div><span class="sw on"></span></div><div class="li"><div class="t"><b>Détail par offre</b></div><span class="sw on"></span></div><div class="li"><div class="t"><b>Lecture d’Orbi</b><span>Constats sur vos chiffres</span></div><span class="sw on"></span></div></div>
<div class="bts"><a class="bt sec m">Aperçu</a><a class="bt p m pl">{ic("telecharger","s")}Télécharger le PDF</a></div></div>''')

def _mail_c(obj):
    return f'<div class="verre pdf-x"><span class="th"><i></i><em></em><u></u><u></u><u style="width:60%"></u></span><div class="t"><b>Aussi par e-mail</b>Objet : {obj}</div><a class="bt sec s">Voir</a></div>'
MSG_LONG = MSG_LONG.replace('<a class="bt sec s">Répondre</a></div></div>', '<a class="bt sec s">Répondre</a></div></div>' + _mail_c('Vous êtes invitée à un entretien'), 1)
MSG_REFUS = MSG_REFUS.replace('Voir les offres proches</a></div></div>', 'Voir les offres proches</a></div></div>' + _mail_c('Merci pour votre candidature'), 1)

# ---------- Chemins ----------
CHEMINS = [
 ('Analyser tous les CV', ['Offres', 'Une offre', 'Candidatures', 'Lancer l’analyse']),
 ('Créer la liste des retenus', ['Recommandation d’Orbi', 'Sélectionner', 'Retenir']),
 ('Répondre à tous', ['Liste des retenus', 'Informer les 5', 'Relire', 'Envoyer']),
 ('Ouvrir les modèles de messages', ['Conversation', '+ dans la zone de saisie', 'Modèles'], ),
 ('Menu d’une conversation', ['Conversation', '⋯ en haut à droite']),
 ('Demander de l’aide à Orbi dans une conversation', ['Conversation', 'Orbi dans la zone de saisie']),
 ('Voir tous les contacts', ['Candidats', 'Contacts']),
 ('Rejoindre son organisation', ['Inscription', 'Je recrute', 'Votre organisation', 'Demander à rejoindre']),
 ('Exporter un rapport', ['Compte', 'Rapports', 'Exporter en PDF']),
]
def chemins():
    h = ''.join(f'<div class="chemin"><h4>{t}</h4><div class="ch-et">' + '<em>→</em>'.join(f'<span>{x}</span>' for x in et) + '</div></div>' for t, et in CHEMINS)
    return f'<div class="chemins">{h}</div>'

MAILS = f'''<div class="mail-g"><figure>{mail_retenu()}<figcaption><b>Candidature retenue</b> · invitation à l’entretien</figcaption></figure>
<figure>{mail_refus()}<figcaption><b>Candidature non retenue</b> · réponse respectueuse</figcaption></figure>
<figure>{mail_admin()}<figcaption><b>Admin principale</b> · demande pour rejoindre l’organisation</figcaption></figure></div>'''
RAPPORT_PDF = f'<div class="rp-g2"><div class="sc">{rapport_p1()}</div><div class="sc">{rapport_p2()}</div></div>'

ECR = [
 ('x0','0 · Comment on y arrive','Pour chaque écran, le chemin depuis la barre.', []),
 ('x1','1 · ATS : analyser et classer','En un geste, Orbi lit tous les CV d’une offre, les classe par score et explique. Le recruteur choisit qui retenir.',
  [ecrans((ATS1,'Candidatures de l’offre','Classées par score, analyse en un geste.'),(ATS2,'Analyse en cours','Dossier par dossier.'),(ATS3,'Recommandation d’Orbi','5 dossiers prioritaires, avec leur pourquoi.'),(ATS4,'Profil pour cette offre','Critère par critère, avec la preuve.'),(ATS_SEL,'Sélection rapide','Cocher, puis retenir.'),(RETENUS,'Liste des retenus','Pour l’étape suivante.'))]),
 ('x2','2 · Répondre à tous','Retenus et non retenus, par message Jumanly et par e-mail. Toujours relu, annulable 10 minutes.',
  [ecrans((ENV,'Choisir et relire','Modèle, canal, phrase personnalisée.'),(ENV_OK,'Confirmer','19 réponses, annulation possible.'),(MSG_LONG,'Message « retenue »','Ce que reçoit la candidate.'),(MSG_REFUS,'Message « non retenu »','Respectueux, avec une suite.'))]),
 ('x3','3 · Modèles d’e-mail','Aux couleurs de Jumanly, sans numéro de téléphone. Le texte vient du modèle, relu avant l’envoi.', []),
 ('x4','4 · Messagerie','Présence en ligne, accusés de lecture, badge d’étape, menu, modèles et aide d’Orbi.',
  [ecrans((MSG_R,'Messages','Badges Retenu, Contact, Non retenu.'),(CONV_R,'Conversation','En ligne, lu, en train d’écrire.'),(CONV_MENU,'Menu ⋯','Dossier, modèles, épingler, retirer.'),(CONV_PLUS,'Bouton +','Modèles, créneaux, documents.'),(CONV_ORBI,'Orbi dans la conversation','Résumé, réponse, ton, traduction, relance.'),(CLEAN,'Alléger la messagerie','Proposé par Orbi, choisi par vous.'))]),
 ('x5','5 · Contacts','Demander, attendre, être accepté : tous les contacts au même endroit.',
  [ecrans((DEM_ENV,'Demande envoyée','Les étapes qui suivent.'),(TAL_REQ,'Côté talent','Ruth accepte ou refuse.'),(ACCEPTE,'Acceptée','La conversation s’ouvre.'),(CONTACTS,'Tous les contacts','Acceptés, en attente, refusés.'))]),
 ('x6','6 · Rejoindre une organisation existante','À l’inscription, l’organisation déjà présente s’affiche. L’admin principale décide.',
  [ecrans((ORG_TROUVE,'Organisation trouvée','Fiche, équipe, domaine reconnu.'),(JOIN_ATT,'Demande envoyée','En attente de l’admin.'),(ADM_NOTIF,'Côté admin','Rôle choisi, accepter ou refuser.'))]),
 ('x7','7 · Rapport PDF','Toujours exporté en PDF A4, aux couleurs de Jumanly. Chiffres réels, aucune donnée personnelle.',
  [ecrans((RAPPORT,'Rapports','Aperçu et export.'),(EXPORT,'Exporter','Période, offres, contenu.'))]),
 ('x8','8 · Mode sombre','',
  [ecrans((sombre(ATS3),'Recommandation',''),(sombre(CONV_R),'Conversation',''),(sombre(CONTACTS),'Contacts',''))]),
]
EXTRA = {'x0': chemins(), 'x3': MAILS, 'x7': RAPPORT_PDF}
som = ''.join(f'<li><a href="#{i}">{t.split(" · ")[1]}</a></li>' for i, t, _, _ in ECR)
corps = ''.join(bloc(i, t, d, *p).replace('</div></section>', EXTRA.get(i, '') + '</div></section>') if i in EXTRA else bloc(i, t, d, *p) for i, t, d, p in ECR)
html = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Refonte mobile · recruteur, lot 4</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>{open(H + '/fondations.css').read()}{CSS}{CSS2}{CSS3L}{CSS4}{CSSR}</style></head><body>
<header class="couv"><span class="k">{orbi(22)}Jumanly Hire · refonte mobile · étape 3</span><h1>Recruteur, lot 4 : ATS, réponses, messagerie, contacts</h1>
<p>19 octobre 2026. Analyse de tous les CV par Orbi, liste des retenus, réponses groupées par message et e-mail, messagerie vivante, contacts, organisation existante, rapport PDF. Contenus fictifs.</p>
<ul class="som">{som}</ul></header>{corps}<p class="fin">Jumanly · Learn. Grow. Connect.</p></body></html>'''
exec(open(H + '/sans_tap.py').read()); html = sans_tap(html); html = epure(html)
out = os.path.join(H, '..', 'refonte-mobile-recruteur-4.html')
open(out, 'w').write(html); print(out, len(html))

# Fichiers servis : e-mails et rapport
M = os.path.join(H, '..', 'modeles-recruteur')
os.makedirs(M, exist_ok=True)
open(os.path.join(M, 'email-candidature-retenue.html'), 'w').write(doc('Candidature retenue', mail_retenu()))
open(os.path.join(M, 'email-candidature-non-retenue.html'), 'w').write(doc('Candidature non retenue', mail_refus()))
open(os.path.join(M, 'email-demande-rejoindre-organisation.html'), 'w').write(doc('Demande pour rejoindre', mail_admin()))
open(os.path.join(M, 'rapport-recrutement.html'), 'w').write(doc('Rapport de recrutement', rapport_p1() + rapport_p2(), RCSS))
