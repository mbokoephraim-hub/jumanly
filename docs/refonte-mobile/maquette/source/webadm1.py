# Espace administrateur entreprise, web uniquement (ordinateur et tablette), lot 1 : pilotage de l'équipe (19/10/2026).
# python3 webadm1.py && node shotw.js admin-1   (lundi 19 octobre 2026 ; organisation fictive Mwinda Énergies, Company Plus)
import os, re
H = os.path.dirname(os.path.abspath(__file__))
_w4 = open(H + '/webr4.py').read(); exec(_w4[:_w4.index('\n# ---------- Chemins')])     # cadres web, CSS et écrans recruteur (lots 1 à 4)

# ---------- Cadre : espace « Administration » ----------
NAV_W['adm'] = [('aujourdhui', 'Vue d’ensemble'), ('candidats', 'Équipe'), ('cadenas', 'Rôles et accès'), None, ('entreprise', 'Pôles'), ('offre', 'Offres')]
_sb0, _rl0, _tb0 = _sb, _rl, _tb
def _sb(actif, role):
    if role != 'adm':
        return _sb0(actif, role)
    h = f'<div class="org ad-org"><span class="lg-e sap">ME</span><span class="t">Mwinda Énergies<small>Administration</small></span>{ic("suivant","xs")}</div>'
    for it in NAV_W['adm']:
        if it is None:
            h += f'<a class="orb{" on" if actif == "orbi" else ""}">{orbi(34, "reflechit" if actif == "orbi" else "repos")}Orbi<small>Ctrl K</small></a>'
        else:
            k, l = it
            b = '<b>4</b>' if k == 'aujourdhui' else ('<b>2</b>' if k == 'offre' else '')
            h += f'<a class="it{" on" if k == actif else ""}">{ic(k, "s", k == actif)}{l}{b}</a>'
    sec = ''.join(f'<a class="it{" on" if k == actif else ""}">{ic(k, "s", k == actif)}{l}</a>' for k, l in
                  [('portefeuille', 'Crédits et quotas'), ('progression', 'Rapports'), ('confidentialite', 'Sécurité')])
    return (f'<aside class="sb"><div class="lg"><span class="j">J</span>jumanly<em>.</em></div>{h}<div class="sep"></div>{sec}'
            f'<div class="bas"><a class="it">{ic("reglages","s")}Paramètres</a><div class="moi"><span class="av">SI</span><div class="t"><b>Sandrine Ilunga</b><span>Admin principale</span></div>{ic("suivant","xs")}</div></div></aside>')
def _rl(actif, role):
    if role != 'adm':
        return _rl0(actif, role)
    h = '<span class="j">J</span>'
    for it in NAV_W['adm']:
        if it is None:
            h += f'<a class="orb{" on" if actif == "orbi" else ""}"><span class="rond">{orbi(40)}</span>Orbi</a>'
        else:
            k, l = it
            h += f'<a class="{"on" if k == actif else ""}">{ic(k, "", k == actif)}{l.split(" ")[0]}</a>'
    return f'<aside class="rl">{h}<span class="av">SI</span></aside>'
def _tb(role, tab=False):
    if role != 'adm':
        return _tb0(role, tab)
    k = '' if tab else '<kbd>Ctrl K</kbd>'
    return (f'<div class="tb"><div class="verre rch">{ic("recherche","s")}<span>Membre, pôle, offre, ou demander à Orbi</span>{k}</div><span class="sp"></span>'
            f'{bi("notification", "<span class=pastille></span>")}{bi("message", "<span class=cpt>2</span>")}<span class="av">SI</span></div>')

A = lambda c, a, url, **k: web(c, a, 'adm', '/organisation' + url, **k)
AT = lambda c, a, **k: tab(c, a, 'adm', **k)
def mbr(h):   # recruteuse membre de l'équipe : même espace recruteur, au nom de Mwinda Énergies
    return (h.replace('Baobab Fintech', 'Mwinda Énergies').replace('>BF<', '>ME<').replace('Nadia Kabeya', 'Aïcha Kasongo')
             .replace('Responsable recrutement', 'Recruteuse · Tech et Data').replace('>NK<', '>AK<'))
def dlg(corps, w=560):
    return fenetre(corps).replace('class="dlg"', f'class="dlg" style="width:{w}px"')

CSSA1 = '''
.ad-org .t{flex:1;display:flex;flex-direction:column;line-height:1.2}.ad-org .t small{font-size:10.5px;font-weight:700;color:#1E8F6F;letter-spacing:.02em}
.sombre .ad-org .t small{color:#A6F26B}
.ad-av{display:inline-grid;place-items:center;border-radius:50%;flex:none;font-weight:700;color:#0F3F37;background:var(--g-accent)}
.ad-av.b{background:var(--g-former)}.ad-av.c{background:var(--g-accomp)}.ad-av.d{background:var(--g-oppo)}.ad-av.e{background:linear-gradient(150deg,#DCE7FB,#B9CCF2)}.ad-av.s{background:#0F3F37;color:#A6F26B}
.ad-pl{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:99px;white-space:nowrap;background:var(--zone);color:var(--texte)}
.ad-pl.ap{background:#0F3F37;color:#A6F26B}.ad-pl.ad{background:#E4F9CF;color:#0F3F37}.ad-pl.rc{background:#DDF6EE;color:#0F3F37}.ad-pl.mg{background:#FDEFD0;color:#7A4B00}.ad-pl.lc{background:#ECEAE4;color:#4A5754}.ad-pl.pe{background:#E3EBFB;color:#24427A}
.ad-pl.at{background:#FDEFD0;color:#7A4B00}.ad-pl.ok{background:#DDF6EE;color:#0F3F37}.ad-pl.in{background:#F8E1DC;color:#8A2E1E}
.sombre .ad-pl.ad,.sombre .ad-pl.rc,.sombre .ad-pl.ok{background:rgba(166,242,107,.16);color:#CFF5B0}.sombre .ad-pl.mg,.sombre .ad-pl.at{background:rgba(248,207,115,.18);color:#F8CF73}.sombre .ad-pl.lc{background:rgba(255,255,255,.08);color:#C9D6D3}.sombre .ad-pl.pe{background:rgba(147,180,240,.18);color:#C3D4F6}.sombre .ad-pl.in{background:rgba(240,120,100,.18);color:#F4B3A6}
.ad-g{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;align-items:start}.ad-g>.col,.ad-col{display:flex;flex-direction:column;gap:14px;min-width:0}
.ad-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ad-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.ad-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.tab .ad-g{grid-template-columns:1fr}.tab .ad-g4{grid-template-columns:repeat(2,minmax(0,1fr))}.tab .ad-g3{grid-template-columns:repeat(2,minmax(0,1fr))}
.ad-k{padding:16px;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden}
.ad-k .h{display:flex;align-items:center;gap:10px}.ad-k .cases{width:38px;height:38px;border-radius:13px;display:grid;place-items:center;color:#0F3F37;flex:none}
.ad-k small{font-size:12px;color:var(--texte2)}.ad-k b.v{font-size:26px;letter-spacing:-.02em;line-height:1}.ad-k b.v span{font-size:13px;font-weight:500;color:var(--texte2)}
.ad-k .barre{height:8px;border-radius:99px;background:var(--zone);overflow:hidden}.ad-k .barre i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#A6F26B,#2FD3A6)}
.ad-k .barre i.w{background:linear-gradient(90deg,#F8CF73,#F0A23B)}
.ad-k .n{font-size:12px;color:var(--texte2)}
.ad-st{display:flex;gap:4px}.ad-st i{flex:1;height:12px;border-radius:5px;background:var(--zone)}.ad-st i.on{background:linear-gradient(90deg,#A6F26B,#2FD3A6)}.ad-st i.at{background:repeating-linear-gradient(135deg,#F8CF73 0 4px,#FBE3A8 4px 8px)}
.ad-hero{display:flex;gap:18px;align-items:center;padding:20px 22px;border-radius:26px;background:linear-gradient(135deg,#0F3F37,#14594C);color:#fff;position:relative;overflow:hidden}
.ad-hero .ban{position:absolute;right:-30px;top:-40px;width:260px;height:260px;border-radius:50%;border:1px solid rgba(166,242,107,.25);box-shadow:0 0 0 30px rgba(166,242,107,.05),0 0 0 60px rgba(166,242,107,.03)}
.ad-hero .lg-e{width:58px;height:58px;font-size:18px;border-radius:18px;background:#A6F26B;color:#0F3F37;display:grid;place-items:center;font-weight:800;flex:none}
.ad-hero .t{flex:1;position:relative}.ad-hero h2{margin:0;font-size:22px;color:#fff}.ad-hero p{margin:4px 0 0;font-size:13px;color:#CFE9DF}
.ad-hero .fm{position:relative;display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-size:12px;color:#CFE9DF}.ad-hero .fm b{font-size:15px;color:#A6F26B}
.ad-todo{display:flex;flex-direction:column}.ad-todo .r{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--trait)}.ad-todo .r:first-child{border-top:0}
.ad-todo .r .t{flex:1;min-width:0}.ad-todo .r .t b{display:block;font-size:14px}.ad-todo .r .t span{font-size:12px;color:var(--texte2)}
.ad-todo .cases{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#0F3F37;flex:none}
.ad-sec{display:flex;align-items:center;justify-content:space-between;font-size:16px;font-weight:700;padding:2px 2px 0}.ad-sec a{font-size:13px;font-weight:600;color:var(--texte2)}
.ad-pole{padding:16px;display:flex;flex-direction:column;gap:12px}.ad-pole .h{display:flex;align-items:center;gap:10px}.ad-pole .h .cases{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;color:#0F3F37;flex:none}
.ad-pole .h .t{flex:1}.ad-pole .h b{display:block;font-size:15px}.ad-pole .h span{font-size:12px;color:var(--texte2)}
.ad-avs{display:flex}.ad-avs .ad-av{width:30px;height:30px;font-size:10px;margin-left:-4px;box-shadow:0 0 0 2px var(--plein)}.ad-avs .ad-av:first-child{margin-left:0}.ad-avs .plus{margin-left:6px;font-size:12px;color:var(--texte2);align-self:center}
.ad-chf{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.ad-chf div{padding:8px 10px;border-radius:12px;background:var(--zone);display:flex;flex-direction:column}.ad-chf b{font-size:16px}.ad-chf span{font-size:11px;color:var(--texte2)}
.ad-act .r{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--trait);font-size:13px}.ad-act .r:first-child{border-top:0}.ad-act .r .x{flex:1}.ad-act .r small{color:var(--texte2);font-size:11.5px}
.ad-tbl{padding:4px 0;overflow:hidden}.ad-tbl .r{display:grid;gap:12px;align-items:center;padding:11px 18px;border-top:1px solid var(--trait);font-size:13px}
.ad-tbl .r:first-child{border-top:0;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--texte2);padding:10px 18px}
.ad-tbl .r .m{display:flex;align-items:center;gap:10px;min-width:0}.ad-tbl .r .m .t{min-width:0}.ad-tbl .r .m .t b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ad-tbl .r .m .t span{font-size:12px;color:var(--texte2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.ad-tbl .r .g{color:var(--texte2);font-size:12.5px}.ad-tbl .r .bt{justify-self:end}.ad-tbl .r.sel{background:linear-gradient(90deg,rgba(166,242,107,.16),rgba(47,211,166,.05))}
.ad-tbl .r .dot{display:inline-flex;align-items:center;gap:6px;font-size:12.5px}.ad-tbl .r .dot i{width:8px;height:8px;border-radius:50%;background:#2FD3A6}.ad-tbl .r .dot i.o{background:#C9D2CF}.ad-tbl .r .dot i.w{background:#F0A23B}
.ad-tbl .r .kb{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--zone);justify-self:end}
.ad-eq .r{grid-template-columns:minmax(0,1.6fr) 150px 130px 110px 120px 40px}
.tab .ad-eq .r{grid-template-columns:minmax(0,1.6fr) 130px 110px 34px}.tab .ad-eq .r>:nth-child(4),.tab .ad-eq .r>:nth-child(5){display:none}
.ad-flt{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.ad-flt .rch2{flex:0 0 210px;display:flex;align-items:center;gap:10px;height:42px;padding:0 16px;border-radius:99px;background:var(--plein);box-shadow:var(--verre);font-size:13.5px;color:var(--texte2)}
.ad-pc{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:99px;background:var(--plein);box-shadow:var(--verre);font-size:12.5px;font-weight:600;white-space:nowrap}.ad-pc.on{background:var(--g-accent);color:#0F3F37}.ad-pc em{font-style:normal;font-size:11px;opacity:.7}
.ad-dr{position:absolute;z-index:8;top:38px;right:0;bottom:0;width:440px;background:var(--plein);border-radius:28px 0 0 28px;box-shadow:-30px 0 60px -30px rgba(0,0,0,.4);padding:22px;display:flex;flex-direction:column;gap:14px;overflow:hidden}
.ad-dr .hd{display:flex;align-items:center;gap:12px}.ad-dr .hd .t{flex:1}.ad-dr .hd h3{margin:0;font-size:19px}.ad-dr .hd .t span{font-size:12.5px;color:var(--texte2)}
.ad-li{display:flex;flex-direction:column;border-radius:18px;background:var(--zone);overflow:hidden}.ad-li .r{display:flex;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--trait);font-size:13px}.ad-li .r:first-child{border-top:0}
.ad-li .r .t{flex:1;min-width:0}.ad-li .r .t b{display:block;font-size:13.5px}.ad-li .r .t span{font-size:11.5px;color:var(--texte2)}.ad-li .r .v{font-weight:700;font-size:13px}
.ad-li .cases{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;color:#0F3F37;flex:none}
.ad-bts{display:flex;gap:10px;flex-wrap:wrap}.ad-bts .bt{flex:none}.ad-dr .ad-bts.fin{margin-top:auto}
.ad-rk{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.tab .ad-rk{grid-template-columns:repeat(3,minmax(0,1fr))}
.ad-rk .c{padding:14px;border-radius:20px;background:var(--plein);box-shadow:var(--verre);display:flex;flex-direction:column;gap:8px}.ad-rk .c.on{box-shadow:0 0 0 2px #0F3F37}.sombre .ad-rk .c.on{box-shadow:0 0 0 2px #A6F26B}
.ad-rk .c .cases{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;color:#0F3F37}.ad-rk .c b{font-size:14px}.ad-rk .c span{font-size:11.5px;color:var(--texte2);line-height:1.35}.ad-rk .c em{font-style:normal;font-size:11px;font-weight:700;color:var(--texte2)}
.ad-mx{padding:6px 0;overflow:hidden}.ad-mx .r{display:grid;grid-template-columns:minmax(0,1fr) repeat(5,108px);align-items:center;padding:9px 18px;border-top:1px solid var(--trait);font-size:13px}
.ad-mx .r.hd{border-top:0;font-size:11.5px;font-weight:700;color:var(--texte2)}.ad-mx .r.hd span{text-align:center}.ad-mx .r.cat{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--texte2);background:var(--zone);padding:7px 18px}
.ad-mx .r i{justify-self:center;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:12px;font-weight:800}
.ad-mx .r i.y{background:#A6F26B;color:#0F3F37}.ad-mx .r i.p{background:#DDF6EE;color:#0F3F37;width:auto;padding:0 8px;border-radius:99px;font-size:10px;white-space:nowrap}.ad-mx .r i.n{color:#B5BFBC}
.sombre .ad-mx .r i.p{background:rgba(47,211,166,.2);color:#BFF3E3}
.tab .ad-mx .r{grid-template-columns:minmax(0,1fr) repeat(5,64px);padding:9px 14px}
.ad-opt{display:flex;flex-direction:column;gap:8px}.ad-opt .o{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:var(--zone)}.ad-opt .o.on{background:var(--plein);box-shadow:0 0 0 2px #0F3F37}
.ad-opt .o .t{flex:1}.ad-opt .o .t b{display:block;font-size:13.5px}.ad-opt .o .t span{font-size:12px;color:var(--texte2)}.ad-opt .o .rd{width:20px;height:20px;border-radius:50%;box-shadow:inset 0 0 0 2px #C9D2CF;flex:none}.ad-opt .o.on .rd{box-shadow:inset 0 0 0 6px #0F3F37}
.ad-opt .o .cases{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;color:#0F3F37;flex:none}
.ad-tg{display:flex;flex-direction:column;border-radius:18px;background:var(--zone)}.ad-tg .r{display:flex;align-items:center;gap:12px;padding:11px 14px;border-top:1px solid var(--trait)}.ad-tg .r:first-child{border-top:0}
.ad-tg .r .t{flex:1}.ad-tg .r .t b{display:block;font-size:13.5px}.ad-tg .r .t span{font-size:11.5px;color:var(--texte2)}
.ad-ml{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;border-radius:16px;background:var(--plein);box-shadow:inset 0 0 0 2px #0F3F37;min-height:48px;align-items:center}.ad-ml span{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:99px;background:#E4F9CF;font-size:12.5px;font-weight:600;color:#0F3F37}.ad-ml em{font-style:normal;color:var(--texte2);font-size:12.5px}
.ad-lab{font-size:12.5px;font-weight:700;margin-bottom:-6px}
.ad-sg{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:16px;background:var(--zone);font-size:12.5px}.ad-sg .ad-st{flex:1}
.ad-off .r{grid-template-columns:minmax(0,1.5fr) 130px minmax(0,1fr) 120px 90px 120px}
.ad-cr .r{grid-template-columns:minmax(0,1.7fr) 100px minmax(0,1.2fr) 100px 90px}
.ad-mt{display:flex;align-items:center;gap:8px}.ad-mt .barre{flex:1;height:8px;border-radius:99px;background:var(--zone);overflow:hidden}.ad-mt .barre i{display:block;height:100%;background:linear-gradient(90deg,#A6F26B,#2FD3A6)}.ad-mt .barre i.w{background:linear-gradient(90deg,#F8CF73,#F0A23B)}.ad-mt small{font-size:12px;color:var(--texte2);white-space:nowrap}
.ad-stk{display:flex;height:16px;border-radius:99px;overflow:hidden;gap:3px}.ad-stk i{display:block;height:100%}
.ad-lg{display:flex;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--texte2)}.ad-lg span{display:inline-flex;align-items:center;gap:6px}.ad-lg i{width:10px;height:10px;border-radius:3px}
.ad-sw{position:absolute;z-index:9;left:84px;top:150px;width:340px;padding:10px;border-radius:24px;background:var(--plein);box-shadow:0 30px 70px -20px rgba(0,0,0,.4),0 0 0 1px var(--trait);display:flex;flex-direction:column;gap:4px}
.ad-sw .r{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px}.ad-sw .r.on{background:linear-gradient(90deg,rgba(166,242,107,.25),rgba(47,211,166,.10))}
.ad-sw .r .t{flex:1}.ad-sw .r .t b{display:block;font-size:13.5px}.ad-sw .r .t span{font-size:11.5px;color:var(--texte2)}.ad-sw .r .cases{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#0F3F37}
.ad-sw .cap{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--texte2);padding:8px 12px 2px}
.ad-sw .ck{width:22px;height:22px;border-radius:50%;background:#0F3F37;color:#A6F26B;display:grid;place-items:center}
.ad-ov{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px;align-items:start}
.ad-ofc{padding:20px;display:flex;flex-direction:column;gap:12px}.ad-ofc h3{margin:0;font-size:20px}.ad-ofc .mt{display:flex;flex-wrap:wrap;gap:8px}.ad-ofc p{margin:0;font-size:13.5px;line-height:1.55;color:var(--texte)}
.ad-ofc .ad-cpt{display:flex;flex-wrap:wrap;gap:6px}.ad-ofc .ad-cpt span{padding:5px 11px;border-radius:99px;background:var(--zone);font-size:12.5px;font-weight:600}.ad-ofc .ad-cpt span.r{background:#E4F9CF;color:#0F3F37}
.ad-chk{display:flex;flex-direction:column;gap:8px}.ad-chk .r{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.4}.ad-chk .r i{width:22px;height:22px;border-radius:50%;flex:none;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:800}
.ad-chk .r i.v{background:#A6F26B;color:#0F3F37}.ad-chk .r i.a{background:#F8CF73;color:#0F3F37}
.ad-pv{display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:18px;background:var(--zone)}.ad-pv .r{display:flex;align-items:center;gap:10px;font-size:13px}.ad-pv .r b{flex:1}
.ad-cmp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;width:100%}.ad-cmp .c{padding:22px;border-radius:26px;background:#fff;display:flex;flex-direction:column;gap:12px}.ad-cmp .c.e{background:linear-gradient(150deg,#0F3F37,#14594C);color:#fff}
.ad-cmp .c h3{margin:0;font-size:19px}.ad-cmp .c p{margin:0;font-size:13px;color:#5B6B68}.ad-cmp .c.e p{color:#CFE9DF}.ad-cmp .c .cases{width:48px;height:48px;border-radius:16px;display:grid;place-items:center;color:#0F3F37}
.ad-cmp .c ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}.ad-cmp .c li{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.4}.ad-cmp .c li i{width:20px;height:20px;border-radius:50%;flex:none;display:grid;place-items:center;background:#E4F9CF;color:#0F3F37;font-style:normal;font-size:11px;font-weight:800}
.ad-cmp .c.e li i{background:#A6F26B}
.ad-mail{width:600px;border-radius:24px;overflow:hidden;background:#fff;box-shadow:0 30px 60px -30px rgba(15,63,55,.4);font-size:14px;color:#1F2D2A}
.ad-mail .hd{background:#0F3F37;color:#fff;padding:28px 34px;position:relative;overflow:hidden}.ad-mail .hd .j{font-size:26px;font-weight:800;color:#fff}.ad-mail .hd .j em{color:#A6F26B;font-style:normal}
.ad-mail .hd .k{display:inline-block;margin-top:14px;padding:4px 10px;border-radius:99px;background:#A6F26B;color:#0F3F37;font-size:10.5px;font-weight:800;letter-spacing:.08em}
.ad-mail .hd h2{margin:10px 0 4px;font-size:24px;color:#fff}.ad-mail .hd p{margin:0;color:#CFE9DF;font-size:13px}
.ad-mail .hd .rings{position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;border:1px solid rgba(166,242,107,.3);box-shadow:0 0 0 28px rgba(166,242,107,.06)}
.ad-mail .bd{padding:26px 34px;display:flex;flex-direction:column;gap:14px;line-height:1.55}.ad-mail .bd p{margin:0}
.ad-mail .card{display:flex;gap:12px;align-items:center;padding:14px;border-radius:16px;background:#F4F1EA}.ad-mail .card b{display:block}.ad-mail .card span{font-size:12.5px;color:#5B6B68}
.ad-mail .cta{align-self:flex-start;padding:12px 22px;border-radius:99px;background:#A6F26B;color:#0F3F37;font-weight:700}
.ad-mail .ft{padding:16px 34px;background:#F4F1EA;font-size:11.5px;color:#5B6B68;line-height:1.5}.ad-mail .ft b{color:#0F3F37}
.ad-inv{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:26px;align-items:center;padding:60px 60px 90px;min-height:560px}
.ad-inv h2{margin:0;font-size:30px}.ad-inv p{margin:0;color:var(--texte2);font-size:14px}
.ad-mem{display:flex;align-items:center;gap:16px;padding:16px 18px;border-radius:24px;background:linear-gradient(120deg,#F2FCE6,#DDF6EE)}.sombre .ad-mem{background:linear-gradient(120deg,rgba(166,242,107,.14),rgba(47,211,166,.06))}
.ad-mem .t{flex:1}.ad-mem .t b{display:block;font-size:15px}.ad-mem .t span{font-size:12.5px;color:var(--texte2)}
.ad-mem .q{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:210px}.ad-mem .q small{font-size:12px;color:var(--texte2)}
.ad-grd .r{display:grid;grid-template-columns:minmax(0,1fr) 210px;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--trait);font-size:13.5px}.ad-grd .r:first-child{border-top:0}
.ad-grd .r .t span{display:block;font-size:12px;color:var(--texte2)}
.ad-stars{display:flex;gap:6px}.ad-stars i{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--zone);font-style:normal;font-weight:700;font-size:13px}.ad-stars i.on{background:#0F3F37;color:#A6F26B}
.sombre .ad-stars i.on{background:#A6F26B;color:#0F3F37}
.sombre .cases[style*="--g-former"],.sombre .ad-av.b{background:linear-gradient(150deg,#ECFCD8,#C3F38E)!important;color:#0F3F37!important}
.sombre .cases[style*="--g-accomp"],.sombre .ad-av.c{background:linear-gradient(150deg,#E2F8F0,#93E8CD)!important;color:#0F3F37!important}
.sombre .cases[style*="--g-oppo"],.sombre .ad-av.d{background:linear-gradient(150deg,#FFF3D6,#F8CF73)!important;color:#0F3F37!important}
.sombre .cases[style*="--g-accent"],.sombre .ad-av{color:#0F3F37!important}.sombre .cases[style*="--g-accent"] svg{stroke:#0F3F37}.sombre .ad-av.s{color:#A6F26B}.sombre .ad-av.s{background:#0F3F37;box-shadow:inset 0 0 0 1.5px #A6F26B}
.sombre .ad-rk .c,.sombre .ad-tbl,.sombre .ad-pole{box-shadow:0 0 0 1px rgba(255,255,255,.06)}
.sombre .ad-rk .c span,.sombre .ad-li .r .t span,.sombre .ad-tbl .r .g{color:#B8CBC6}
.sombre .ad-pl{background:rgba(255,255,255,.10);color:#E6F3EE}.sombre .ad-pl.ap{background:#A6F26B;color:#0F3F37}
[data-ob]{background:linear-gradient(150deg,#F2FCE6,#DDF6EE)!important}.sombre [data-ob]{background:linear-gradient(150deg,rgba(166,242,107,.16),rgba(47,211,166,.08))!important}
.ad-lock{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:16px;background:var(--zone);font-size:12.5px;color:var(--texte2)}
.ad-blur{filter:blur(6px);opacity:.6;pointer-events:none}
.ad-ech{display:flex;flex-direction:column;gap:10px}.ad-ech .r{display:flex;align-items:center;gap:10px;font-size:13px}.ad-ech .r .barre{flex:1}
'''

# ---------- Données fictives ----------
MBRS = [  # initiales, couleur, nom, e-mail, rôle (classe, libellé), pôle, offres, activité (classe, libellé)
 ('SI', 's', 'Sandrine Ilunga', 'Directrice RH · vous', ('ap', 'Admin principale'), 'Tous les pôles', '2 offres', ('', 'En ligne')),
 ('JM', 'b', 'Jonathan Mukendi', 'jonathan.m@mwinda-energies.example', ('ad', 'Admin'), 'Commercial', '3 offres', ('', 'Aujourd’hui')),
 ('AK', '', 'Aïcha Kasongo', 'aicha.k@mwinda-energies.example', ('rc', 'Recruteuse'), 'Tech et Data', '4 offres', ('', 'En ligne')),
 ('EN', 'c', 'Esther Nzuzi', 'esther.n@mwinda-energies.example', ('rc', 'Recruteuse'), 'Lubumbashi', '5 offres', ('', 'Aujourd’hui')),
 ('PL', 'd', 'Pascal Lumbala', 'pascal.l@mwinda-energies.example', ('rc', 'Recruteur'), 'Commercial', '3 offres', ('', 'Hier')),
 ('CN', 'e', 'Christelle Ngoy', 'christelle.n@mwinda-energies.example', ('pe', 'Recruteuse junior'), 'Finance', '2 offres', ('', 'Hier')),
 ('DM', 'b', 'Dieudonné Mpiana', 'dieudonne.m@mwinda-energies.example', ('mg', 'Manager'), 'Tech et Data', '2 offres', ('', 'Ven.')),
 ('RT', 'c', 'Rachel Tshibanda', 'rachel.t@mwinda-energies.example', ('mg', 'Manager'), 'Finance', '1 offre', ('', 'Jeu.')),
 ('BK', 'd', 'Benoît Kalala', 'benoit.k@mwinda-energies.example', ('lc', 'Lecteur'), 'Direction générale', 'Rapports', ('o', 'Il y a 6 j')),
 ('FL', 'e', 'Franck Lokwa', 'franck.l@mwinda-energies.example', ('rc', 'Recruteur'), 'Commercial', '2 offres', ('w', 'Il y a 34 j')),
 ('HN', '', 'Héritier Ngandu', 'Invitation envoyée le 16 oct.', ('at', 'Invité'), 'Lubumbashi', '—', ('o', 'En attente')),
 ('GL', 'b', 'Grâce Lusamba', 'Invitation envoyée le 17 oct.', ('at', 'Invitée'), 'Tech et Data', '—', ('o', 'En attente')),
]
AV = lambda i, c, s=40: f'<span class="ad-av {c}" style="width:{s}px;height:{s}px;font-size:{round(s*.3)}px">{i}</span>'
def sieges(on=10, at=2, tot=15):
    return '<span class="ad-st">' + '<i class="on"></i>' * on + '<i class="at"></i>' * at + '<i></i>' * (tot - on - at) + '</span>'
CS = lambda nom, g, s=38, r=13: f'<span class="cases" style="width:{s}px;height:{s}px;border-radius:{r}px;background:var(--g-{g})">{ic(nom,"s")}</span>'

# ---------- 1. Entrer dans l'administration ----------
def kpis():
    return f'''<div class="ad-g4">
<div class="verre ad-k"><div class="h">{CS("candidats","accomp")}<small>Sièges</small></div><b class="v">12 <span>sur 15</span></b>{sieges()}<span class="n">10 actifs · 2 invitations en attente</span></div>
<div class="verre ad-k"><div class="h">{CS("offre","former")}<small>Offres actives</small></div><b class="v">23 <span>sur 50</span></b><span class="barre"><i style="width:46%"></i></span><span class="n">2 à valider avant publication</span></div>
<div class="verre ad-k"><div class="h">{CS("orbi","accent")}<small>Crédits Orbi du mois</small></div><b class="v">640 <span>sur 1 000</span></b><span class="barre"><i style="width:64%"></i></span><span class="n">Renouvelés le 9 novembre</span></div>
<div class="verre ad-k"><div class="h">{CS("candidature","oppo")}<small>Candidatures ce mois</small></div><b class="v">412</b><span class="barre"><i style="width:78%"></i></span><span class="n">+ 18 % sur septembre · 9 recrutements</span></div></div>'''

def todo():
    return f'''<div class="ad-sec">À traiter<a>4</a></div><div class="verre ad-todo">
<div class="r">{CS("candidats","accomp",40)}<div class="t"><b>Gloire Mavinga veut rejoindre l’organisation</b><span>E-mail sur votre domaine vérifié · Tech et Data</span></div><a class="bt sec s">Choisir le rôle</a></div>
<div class="r">{CS("offre","former",40)}<div class="t"><b>2 offres attendent votre validation</b><span>Commercial terrain B2B · Contrôleur de gestion</span></div><a class="bt p s">Valider</a></div>
<div class="r">{CS("orbi","accent",40)}<div class="t"><b>Esther demande 100 crédits Orbi</b><span>Pôle Lubumbashi · 5 offres, 96 % de ses crédits utilisés</span></div><a class="bt sec s">Répondre</a></div>
<div class="r">{CS("horloge","oppo",40)}<div class="t"><b>Franck n’est pas venu depuis 34 jours</b><span>2 offres et 9 candidatures sans réponse</span></div><a class="bt sec s">Voir</a></div></div>'''

def poles_mini():
    P = [('Tech et Data', 'accent', 'entreprise', ['AK', 'DM', 'GL'], 7, 132), ('Commercial', 'former', 'offre', ['JM', 'PL', 'FL'], 8, 151),
         ('Finance', 'oppo', 'portefeuille', ['CN', 'RT'], 3, 48), ('Lubumbashi', 'accomp', 'localisation', ['EN', 'HN'], 5, 81)]
    c = ''.join(f'<div class="verre ad-pole"><div class="h">{CS(i,g,42,14)}<div class="t"><b>{n}</b><span>{o} offres · {k} candidatures</span></div></div><div class="ad-avs">{"".join(AV(a, "bcde"[j % 4] if a != "AK" else "", 30) for j, a in enumerate(m))}</div></div>' for n, g, i, m, o, k in P)
    return f'<div class="ad-sec">Pôles<a>Gérer</a></div><div class="ad-g2">{c}</div>'

def activite():
    R = [('AK', '', 'Aïcha a publié <b>Data analyst confirmé</b>', '10:20'), ('EN', 'c', 'Esther a retenu 4 personnes pour <b>Technicien de maintenance</b>', '09:48'),
         ('DM', 'b', 'Dieudonné a évalué Ruth B. avec la grille', '09:15'), ('JM', 'b', 'Jonathan a invité Grâce Lusamba', 'Ven.'), ('SI', 's', 'Vous avez créé le rôle <b>Recruteur junior</b>', 'Jeu.')]
    r = ''.join(f'<div class="r">{AV(i, c, 30)}<span class="x">{t}</span><small>{h}</small></div>' for i, c, t, h in R)
    return f'<div class="ad-sec">Activité de l’équipe<a>Journal</a></div><div class="verre ad-act">{r}</div>'

def orbi_adm():
    return f'''<div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:10px" data-ob="1"><div style="display:flex;gap:10px;align-items:center">{orbi(34)}<div><b style="display:block">Orbi pour l’équipe</b><span style="font-size:12px;color:var(--texte2)">Constats de la semaine</span></div></div>
<div class="ad-chk"><div class="r"><i class="a">!</i><span>Le pôle Commercial répond en 6 jours, contre 2 ailleurs.</span></div><div class="r"><i class="v">✓</i><span>Lubumbashi a recruté 3 personnes ce mois.</span></div><div class="r"><i class="a">!</i><span>Un siège peut se libérer : Franck est inactif.</span></div></div>
<span style="font-size:11.5px;color:var(--texte2)">Orbi constate, vous décidez. Aucun changement sans votre accord.</span></div>'''

def dash(t=False):
    hero = f'''<div class="ad-hero"><span class="ban"></span><span class="lg-e">ME</span><div class="t"><h2>Bonjour Sandrine</h2><p>Lundi 19 octobre · Mwinda Énergies · 4 pôles, 12 personnes</p></div>
<div class="fm"><span class="ad-pl ap" style="background:#A6F26B;color:#0F3F37">Company Plus</span><b>179,9 $ par mois</b><span>payée jusqu’au 9 novembre</span></div></div>'''
    if t:
        return hero + kpis() + todo() + poles_mini()
    return hero + kpis() + f'<div class="ad-g"><div class="col">{todo()}{poles_mini()}</div><div class="col">{orbi_adm()}{activite()}</div></div>'

SW = f'''<div class="ad-sw"><span class="cap">Mwinda Énergies · vos deux rôles</span>
<div class="r on">{CS("reglages","accent")}<div class="t"><b>Administration</b><span>Équipe, rôles, pôles, offres, crédits</span></div><span class="ck">{ic("valider","xs")}</span></div>
<div class="r">{CS("offre","former")}<div class="t"><b>Recrutement</b><span>Vos 2 offres et vos candidats, comme un recruteur</span></div></div>
<span class="cap">Votre compte RH</span>
<div class="r">{AV("SI","s",38)}<div class="t"><b>Sandrine Ilunga</b><span>Profil RH, signature, notifications, sécurité</span></div></div></div>'''
W_SW = A(dash(), 'aujourdhui', '', over=SW)
W_DASH = A(dash(), 'aujourdhui', '')
T_DASH = AT(dash(True), 'aujourdhui')

# ---------- 2. Équipe ----------
def eq_rows(sel=None, t=False):
    h = '<div class="r"><span>Membre</span><span>Rôle</span><span>Pôle</span><span>Offres</span><span>Activité</span><span></span></div>'
    for i, c, n, m, (rc, rl), p, o, (ac, al) in MBRS:
        h += (f'<div class="r{" sel" if n == sel else ""}"><div class="m">{AV(i, c)}<div class="t"><b>{n}</b><span>{m}</span></div></div><span><span class="ad-pl {rc}">{rl}</span></span>'
              f'<span class="g">{p}</span><span class="g">{o}</span><span class="dot"><i class="{ac}"></i>{al}</span><span class="kb">{ic("suivant","xs")}</span></div>')
    return f'<div class="verre ad-tbl ad-eq">{h}</div>'
def equipe_a(sel=None, t=False):
    flt = f'''<div class="ad-flt"><div class="rch2">{ic("recherche","s")}Nom, e-mail, pôle</div><span class="ad-pc on">Tous <em>12</em></span><span class="ad-pc">Admins <em>2</em></span><span class="ad-pc">Recruteurs <em>5</em></span><span class="ad-pc">Managers <em>2</em></span><span class="ad-pc">Lecteurs <em>1</em></span><span class="ad-pc">Invitations <em>2</em></span><span class="ad-pc">Demandes <em>1</em></span></div>'''
    sg = f'<div class="ad-sg"><b>Sièges : 12 sur 15</b>{sieges()}<span style="color:var(--texte2)">3 libres</span></div>'
    return wh('Équipe', 'Mwinda Énergies · 10 membres actifs', f'<div class="ad-bts"><a class="bt sec m">{ic("telecharger","s")}Exporter la liste</a><a class="bt p m">{ic("plus","s")}Inviter</a></div>') + sg + flt + eq_rows(sel, t)
W_EQ = A(equipe_a(), 'candidats', '/equipe')
T_EQ = AT(equipe_a(t=True), 'candidats')

def fiche_mb():
    return f'''<div class="w-voile"></div><div class="ad-dr"><div class="hd">{AV("AK", "", 58)}<div class="t"><h3>Aïcha Kasongo</h3><span>aicha.k@mwinda-energies.example · membre depuis mars</span></div>{bi("fermer")}</div>
<div class="ad-bts"><span class="ad-pl rc">Recruteuse</span><span class="ad-pl">Pôle Tech et Data</span><span class="ad-pl ok">En ligne</span></div>
<div class="ad-li"><div class="r">{CS("offre","former",32,11)}<div class="t"><b>Offres confiées</b><span>Data analyst confirmé, Ingénieur réseau, +2</span></div><span class="v">4</span></div>
<div class="r">{CS("candidature","oppo",32,11)}<div class="t"><b>Candidatures traitées ce mois</b><span>Délai moyen de réponse : 2 jours</span></div><span class="v">96</span></div>
<div class="r">{CS("orbi","accent",32,11)}<div class="t"><b>Crédits Orbi</b><span>Limite mensuelle fixée par vous</span></div><span class="v">74 / 120</span></div>
<div class="r">{CS("confidentialite","accomp",32,11)}<div class="t"><b>Profils consultés</b><span>Journalisés, visibles dans Sécurité</span></div><span class="v">58</span></div></div>
<span class="ck-t">Ce qu’elle peut faire</span><div class="ad-chk"><div class="r"><i class="v">✓</i><span>Publier, décider et écrire aux candidats sur ses 4 offres</span></div><div class="r"><i class="v">✓</i><span>Rechercher des talents et leur proposer une offre</span></div><div class="r"><i class="a">—</i><span>Pas d’accès à l’équipe, aux rôles ni à l’abonnement</span></div></div>
<div class="ad-bts fin"><a class="bt p m">Changer le rôle</a><a class="bt sec m">Offres et pôle</a><a class="bt sec m">Crédits</a><a class="bt sec m">Retirer</a></div></div>'''
W_MB = A(equipe_a('Aïcha Kasongo'), 'candidats', '/equipe/aicha-kasongo', over=fiche_mb())

# ---------- 3. Inviter et accueillir ----------
DLG_INV = f'''<h3>Inviter dans l’équipe</h3><span class="ad-lab">E-mails</span><div class="ad-ml"><span>grace.l@mwinda-energies.example</span><span>patrick.m@mwinda-energies.example</span><em>Ajouter, ou coller une liste</em></div>
<span class="ad-lab">Rôle</span><div class="seg"><span>Admin</span><span class="on">Recruteur</span><span>Recruteur junior</span><span>Manager</span><span>Lecteur</span></div>
<div class="ad-g2"><div style="display:flex;flex-direction:column;gap:8px"><span class="ad-lab">Pôle</span><div class="puces"><span class="puce on">Tech et Data</span><span class="puce">Commercial</span></div></div>
<div style="display:flex;flex-direction:column;gap:8px"><span class="ad-lab">Crédits Orbi par mois</span><div class="puces"><span class="puce">50</span><span class="puce on">120</span><span class="puce">Autre</span></div></div></div>
<span class="ad-lab">Offres confiées</span><div class="puces"><span class="puce on">Data analyst confirmé</span><span class="puce">Ingénieur réseau électrique</span><span class="puce">Plus tard</span></div>
<div class="ad-sg"><b>2 sièges utilisés sur 3 libres</b>{sieges(10, 4)}</div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">{ic("envoyer","s")}Envoyer 2 invitations</a></div>'''
W_INV = A(equipe_a(), 'candidats', '/equipe', over=dlg(DLG_INV, 620))

DLG_INVOK = f'''<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("envoyer")}</span><h3 style="margin:6px 0 0">2 invitations envoyées</h3><span style="font-size:13px;color:var(--texte2)">Par e-mail et dans Jumanly si la personne a déjà un compte.</span></div>
<div class="ad-li"><div class="r">{AV("GL","b",32)}<div class="t"><b>grace.l@mwinda-energies.example</b><span>Recruteur · Tech et Data · 120 crédits</span></div><span class="ad-pl at">En attente</span></div><div class="r">{AV("PM","c",32)}<div class="t"><b>patrick.m@mwinda-energies.example</b><span>Recruteur · Tech et Data · 120 crédits</span></div><span class="ad-pl at">En attente</span></div></div>
<div class="gar">{ic("horloge","s")}Le lien est valable 7 jours. Le siège est réservé jusqu’à l’acceptation, et libéré s’il expire.</div><div class="bts"><a class="bt p m pl">Voir l’équipe</a></div>'''
W_INVOK = A(equipe_a(), 'candidats', '/equipe', over=dlg(DLG_INVOK, 520))

DLG_REQ = f'''<div style="display:flex;gap:14px;align-items:center">{AV("GM","c",56)}<div style="flex:1"><h3 style="margin:0">Gloire Mavinga demande à rejoindre</h3><span style="font-size:12.5px;color:var(--texte2)">gloire.m@mwinda-energies.example · demande du 18 oct.</span></div></div>
<div class="ad-chk"><div class="r"><i class="v">✓</i><span>E-mail sur votre domaine vérifié <b>mwinda-energies.example</b></span></div><div class="r"><i class="v">✓</i><span>Compte Jumanly confirmé · « Data engineer, Kinshasa »</span></div></div>
<span class="ad-lab">Rôle et pôle</span><div class="ad-opt"><div class="o on"><span class="rd"></span><div class="t"><b>Recruteur · Tech et Data</b><span>Ses offres, ses candidats, ses messages</span></div></div><div class="o"><span class="rd"></span><div class="t"><b>Manager · Tech et Data</b><span>Évalue les candidats des offres confiées</span></div></div><div class="o"><span class="rd"></span><div class="t"><b>Lecteur</b><span>Tableaux de bord et rapports, sans dossier nominatif</span></div></div></div>
<div class="ad-sg"><b>Sièges après acceptation : 13 sur 15</b>{sieges(11, 2)}</div>
<div class="bts"><a class="bt sec m">Refuser</a><a class="bt p m pl">{ic("valider","s")}Accepter</a></div>'''
W_REQ = A(equipe_a(), 'candidats', '/equipe/demandes', over=dlg(DLG_REQ, 580))

DLG_FULL = f'''<h3>Plus de siège libre</h3><span style="font-size:13px;color:var(--texte2);margin-top:-8px">Company Plus compte 15 sièges, tous pris ou réservés.</span><div class="ad-sg"><b>15 sur 15</b>{sieges(13, 2)}</div>
<div class="ad-opt"><div class="o on">{CS("horloge","oppo",36,12)}<div class="t"><b>Libérer un siège</b><span>Franck Lokwa est inactif depuis 34 jours. Ses offres passent à Pascal.</span></div><span class="rd"></span></div>
<div class="o">{CS("modifier","accomp",36,12)}<div class="t"><b>Annuler une invitation en attente</b><span>Héritier Ngandu n’a pas répondu depuis le 16 oct.</span></div><span class="rd"></span></div>
<div class="o">{CS("entreprise","former",36,12)}<div class="t"><b>Passer à Company Premium</b><span>30 sièges et plus, filiales, sur devis</span></div><span class="rd"></span></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Je propose Franck : aucune activité depuis le 15 septembre. Rien n’est retiré sans votre geste.</div></div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Continuer</a></div>'''
W_FULL = A(equipe_a(), 'candidats', '/equipe', over=dlg(DLG_FULL, 560))

# ---------- 4. Rôles et accès ----------
ROLES = [('ap', 'Admin principale', 'Tout, abonnement et factures', '1 personne', 'reglages', 'accent'), ('ad', 'Admin', 'Équipe, pôles, offres, rapports', '1 personne', 'cadenas', 'former'),
         ('rc', 'Recruteur', 'Ses offres, de la publication à la décision', '4 personnes', 'offre', 'accomp'), ('pe', 'Recruteur junior', 'Rôle créé par vous · publie après validation', '1 personne', 'modifier', 'oppo'),
         ('mg', 'Manager', 'Évalue les candidats des offres confiées', '2 personnes', 'candidature', 'oppo'), ('lc', 'Lecteur', 'Tableaux de bord et rapports', '1 personne', 'progression', 'accomp')]
def roles_cards(on='rc'):
    return '<div class="ad-rk">' + ''.join(f'<div class="c{" on" if k == on else ""}">{CS(i, g, 36, 12)}<b>{n}</b><span>{d}</span><em>{p}</em></div>' for k, n, d, p, i, g in ROLES) + '</div>'
MX = [('Offres', None), ('Créer et publier une offre', 'yyy' + 'pnn'), ('Valider une offre avant publication', 'yynnnn'), ('Clôturer, prolonger', 'yyynnn'),
      ('Candidats', None), ('Voir les dossiers', 'yy' + 'ppp' + 'n'), ('Évaluer avec la grille, commenter', 'yyyyyn'), ('Décider : retenu, non retenu', 'yyypnn'), ('Écrire aux candidats', 'yyyynn'),
      ('Talents et Orbi', None), ('Rechercher des talents, proposer une offre', 'yyyynn'), ('Utiliser Orbi', 'yyyyyn'),
      ('Organisation', None), ('Inviter, changer les rôles, pôles', 'yynnnn'), ('Rapports et statistiques', 'yyppny'), ('Abonnement et factures', 'ypnnnn')]
PV = {'Créer et publier une offre': ['', '', '', 'Après validation', '', ''], 'Voir les dossiers': ['', '', 'Ses offres', 'Ses offres', 'Offres confiées', ''],
      'Décider : retenu, non retenu': ['', '', '', 'Propose', '', ''], 'Rapports et statistiques': ['', '', 'Ses offres', 'Ses offres', '', ''], 'Abonnement et factures': ['', 'Lecture', '', '', '', '']}
def matrice(cols=('Admin', 'Recruteur', 'Recr. junior', 'Manager', 'Lecteur')):
    h = '<div class="r hd"><span style="text-align:left">Permission</span>' + ''.join(f'<span>{c}</span>' for c in cols) + '</div>'
    for l, v in MX:
        if v is None:
            h += f'<div class="r cat">{l}</div>'; continue
        cells = ''
        for j, x in enumerate(v[1:]):
            p = PV.get(l, [''] * 6)[j + 1]
            cells += f'<i class="p">{p}</i>' if x == 'p' else ('<i class="y">✓</i>' if x == 'y' else '<i class="n">—</i>')
        h += f'<div class="r"><span>{l}</span>{cells}</div>'
    return f'<div class="verre ad-mx">{h}</div>'
def roles_a(t=False):
    return (wh('Rôles et accès', 'Qui peut faire quoi dans Mwinda Énergies', f'<a class="bt p m">{ic("plus","s")}Créer un rôle</a>') + roles_cards()
            + matrice() + f'<div class="gar">{ic("confidentialite","s")}L’admin principale a toutes les permissions. Personne ne voit un talent qui n’a pas postulé ou rendu son profil visible. Le lecteur ne voit aucun dossier nominatif.</div>')
W_ROLES = A(roles_a(), 'cadenas', '/roles')
T_ROLES = AT(roles_a(True), 'cadenas')

DLG_ROLE = f'''<div style="display:flex;gap:12px;align-items:center">{AV("AK","",48)}<div><h3 style="margin:0">Changer le rôle d’Aïcha</h3><span style="font-size:12.5px;color:var(--texte2)">Recruteuse · Tech et Data</span></div></div>
<div class="ad-opt"><div class="o on">{CS("cadenas","former",36,12)}<div class="t"><b>Admin</b><span>Équipe, rôles, pôles, toutes les offres, rapports</span></div><span class="rd"></span></div>
<div class="o">{CS("offre","accomp",36,12)}<div class="t"><b>Recruteur</b><span>Rôle actuel</span></div><span class="rd"></span></div>
<div class="o">{CS("candidature","oppo",36,12)}<div class="t"><b>Manager</b><span>Évaluer seulement</span></div><span class="rd"></span></div></div>
<span class="ck-t">Ce qui change pour elle</span><div class="ad-chk"><div class="r"><i class="v">+</i><span>Voit toutes les offres et les 412 candidatures du mois</span></div><div class="r"><i class="v">+</i><span>Peut inviter, changer des rôles, valider des offres</span></div><div class="r"><i class="a">=</i><span>Garde ses 4 offres et ses conversations</span></div></div>
<div class="gar">{ic("notification","s")}Aïcha est prévenue dans l’app et par e-mail. Le changement est inscrit au journal.</div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Nommer admin</a></div>'''
W_ROLE = A(roles_a(), 'cadenas', '/roles', over=dlg(DLG_ROLE, 560))

def custom():
    tg = lambda b, s, on: f'<div class="r"><div class="t"><b>{b}</b><span>{s}</span></div><span class="sw{" on" if on else ""}"></span></div>'
    g = f'''<div class="col"><div class="verre" style="padding:18px;display:flex;flex-direction:column;gap:14px">{champ("Nom du rôle", "Recruteur junior", "focus")}
<span class="ad-lab">Part de</span><div class="seg"><span class="on">Recruteur</span><span>Manager</span><span>Lecteur</span></div>
<span class="ad-lab">Portée</span><div class="seg"><span>Toute l’organisation</span><span class="on">Son pôle</span><span>Offres choisies</span></div></div>
<div class="verre" style="padding:6px"><div class="ad-tg">{tg("Publier sans validation", "Sinon, l’offre part chez un admin avant publication", False)}{tg("Décider seul", "Sinon, il propose et le recruteur de l’offre décide", False)}
{tg("Écrire aux candidats", "Messages Jumanly et e-mails, relus avant l’envoi", True)}{tg("Rechercher des talents", "Compte dans les 1 000 recherches du mois", True)}{tg("Exporter les rapports", "PDF de ses offres", False)}</div></div></div>'''
    d = f'''<div class="col"><div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:12px"><b>Aperçu du rôle</b><div class="ad-pv">
<div class="r"><i style="font-style:normal">✓</i><b>Ses offres, dans son pôle</b></div><div class="r"><i style="font-style:normal">✓</i><b>Évalue, écrit, propose</b></div><div class="r"><i style="font-style:normal">—</i><b>Publie après validation</b></div><div class="r"><i style="font-style:normal">—</i><b>Ne décide pas seul</b></div></div>
<span class="ad-lab">Crédits Orbi par mois</span><div class="puces"><span class="puce on">50</span><span class="puce">80</span><span class="puce">120</span></div></div>
<div class="orbi-l">{orbi(26)}<div class="t">Utile pour un stagiaire ou une nouvelle recrue : Christelle pourrait l’avoir.</div></div>
<div class="gar">{ic("aide","s")}Rôles personnalisés : dès Company Plus.</div></div>'''
    return wh('Créer un rôle', 'Rôles et accès · Mwinda Énergies', '<div class="ad-bts"><a class="bt sec m">Annuler</a><a class="bt p m">Créer le rôle</a></div>') + f'<div class="ad-g">{g}{d}</div>'
W_CUSTOM = A(custom(), 'cadenas', '/roles/nouveau')

# ---------- 5. Pôles et offres ----------
def poles_a():
    P = [('Tech et Data', 'accent', 'entreprise', 'Aïcha Kasongo', ['AK', 'DM', 'GL'], ('7', '132', '2 j'), 300),
         ('Commercial', 'former', 'offre', 'Jonathan Mukendi', ['JM', 'PL', 'FL'], ('8', '151', '6 j'), 300),
         ('Finance', 'oppo', 'portefeuille', 'Rachel Tshibanda', ['CN', 'RT'], ('3', '48', '3 j'), 150),
         ('Lubumbashi', 'accomp', 'localisation', 'Esther Nzuzi', ['EN', 'HN'], ('5', '81', '2 j'), 250)]
    c = ''
    for n, g, i, r, m, (o, k, d), cr in P:
        av = ''.join(AV(a, 'bcde'[j % 4] if a != 'AK' else '', 30) for j, a in enumerate(m))
        c += (f'<div class="verre ad-pole"><div class="h">{CS(i,g,42,14)}<div class="t"><b>{n}</b><span>Responsable : {r}</span></div>{bi("suivant")}</div>'
              f'<div class="ad-chf"><div><b>{o}</b><span>offres</span></div><div><b>{k}</b><span>candidatures</span></div><div><b>{d}</b><span>pour répondre</span></div></div>'
              f'<div style="display:flex;align-items:center;justify-content:space-between"><div class="ad-avs">{av}<span class="plus">{len(m)} membres</span></div><span class="ad-pl">{cr} crédits Orbi</span></div></div>')
    nv = f'<div class="verre ad-pole" style="align-items:center;justify-content:center;border:2px dashed var(--trait);box-shadow:none;background:transparent;min-height:170px">{CS("plus","accent",46,15)}<b>Créer un pôle</b><span style="font-size:12px;color:var(--texte2)">Département, site ou équipe</span></div>'
    return (wh('Pôles', 'Chaque pôle a ses membres, ses offres, ses crédits et son tableau de bord', f'<a class="bt p m">{ic("plus","s")}Créer un pôle</a>')
            + f'<div class="ad-g3">{c}{nv}</div><div class="gar">{ic("entreprise","s")}Filiales et entités juridiques séparées : Company Premium.</div>')
W_POLES = A(poles_a(), 'entreprise', '/poles')

OFFS = [('Commercial terrain B2B', 'Commercial', 'PL', 'd', 'Pascal Lumbala', ('at', 'À valider'), '—', 'Valider'), ('Contrôleur de gestion', 'Finance', 'CN', 'e', 'Christelle Ngoy', ('at', 'À valider'), '—', 'Valider'),
        ('Data analyst confirmé', 'Tech et Data', 'AK', '', 'Aïcha Kasongo', ('ok', 'Publiée'), '24', 'Ouvrir'), ('Technicien de maintenance', 'Lubumbashi', 'EN', 'c', 'Esther Nzuzi', ('ok', 'Publiée'), '61', 'Ouvrir', 'Lubumbashi · CDD'),
        ('Ingénieur réseau électrique', 'Tech et Data', 'AK', '', 'Aïcha Kasongo', ('ok', 'Publiée'), '38', 'Ouvrir'), ('Chargé de clientèle', 'Commercial', 'FL', 'e', 'Franck Lokwa', ('in', 'Sans réponse'), '9', 'Confier'),
        ('Comptable fournisseurs', 'Finance', 'CN', 'e', 'Christelle Ngoy', ('lc', 'En pause'), '17', 'Ouvrir')]
def offres_a():
    h = '<div class="r"><span>Offre</span><span>Pôle</span><span>Confiée à</span><span>Statut</span><span>Cand.</span><span></span></div>'
    for t, p, i, c, n, (sc, sl), k, b, *v in OFFS:
        h += (f'<div class="r"><div class="m">{CS("offre","former",36,12)}<div class="t"><b>{t}</b><span>{v[0] if v else "Kinshasa · CDI"}</span></div></div><span class="g">{p}</span><div class="m">{AV(i, c, 28)}<span style="font-size:12.5px">{n}</span></div>'
              f'<span><span class="ad-pl {sc}">{sl}</span></span><span class="g">{k}</span><a class="bt {"p" if b == "Valider" else "sec"} s">{b}</a></div>')
    flt = f'<div class="ad-flt"><div class="rch2">{ic("recherche","s")}Offre, pôle, recruteur</div><span class="ad-pc on">Toutes <em>23</em></span><span class="ad-pc">À valider <em>2</em></span><span class="ad-pc">Sans réponse <em>1</em></span><span class="ad-pc">En pause <em>1</em></span><span class="ad-pc">Tous les pôles</span></div>'
    v = f'<div class="ad-sg"><b>Validation avant publication</b><span style="flex:1;color:var(--texte2)">Pour les recruteurs juniors et le pôle Commercial</span><span class="sw on"></span></div>'
    return wh('Offres', '23 actives sur 50 · toutes les équipes', '') + v + flt + f'<div class="verre ad-tbl ad-off">{h}</div>'
W_OFF = A(offres_a(), 'offre', '/offres')

def valider():
    o = f'''<div class="verre ad-ofc"><div style="display:flex;gap:12px;align-items:center">{CS("offre","former",48,16)}<div style="flex:1"><h3>Commercial terrain B2B</h3><span style="font-size:12.5px;color:var(--texte2)">Envoyée par Pascal Lumbala · aujourd’hui 09:30</span></div><span class="ad-pl at">À valider</span></div>
<div class="mt"><span class="ad-pl">Kinshasa</span><span class="ad-pl">CDI</span><span class="ad-pl">Sur le terrain</span><span class="ad-pl">900 à 1 200 $ par mois</span><span class="ad-pl">Jusqu’au 20 novembre</span></div>
<p>Vous développez un portefeuille d’entreprises clientes à Kinshasa : prospection, rendez-vous, devis et suivi. Vous travaillez avec l’équipe technique pour les raccordements.</p>
<span class="ck-t">Compétences</span><div class="ad-cpt"><span class="r">Vente B2B · requise</span><span class="r">Négociation · requise</span><span>Énergie · souhaitée</span><span>Excel · souhaitée</span></div>
<span class="ck-t">Critères éliminatoires</span><div class="ad-cpt"><span class="r">Permis B</span><span class="r">2 ans de vente</span></div></div>'''
    d = f'''<div class="col"><div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:12px" data-ob="1"><div style="display:flex;gap:10px;align-items:center">{orbi(32)}<b>Relecture d’Orbi</b></div>
<div class="ad-chk"><div class="r"><i class="v">✓</i><span>Salaire indiqué : plus de candidatures en général.</span></div><div class="r"><i class="v">✓</i><span>Aucun critère sur l’âge, le genre ou l’origine.</span></div><div class="r"><i class="a">!</i><span>« Jeune et dynamique » écarte selon l’âge : à retirer avec Pascal avant publication.</span></div></div></div>
<div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:10px"><b>Votre décision</b><a class="bt p m" style="width:100%">{ic("valider","s")}Valider et publier</a><a class="bt sec m" style="width:100%">Demander une modification</a>
<span style="font-size:12px;color:var(--texte2)">Pascal est prévenu dans les deux cas. Sans réponse, rien n’est publié.</span></div>
<div class="verre ad-act"><div class="r">{AV("PL","d",28)}<span class="x">Pascal a envoyé l’offre</span><small>09:30</small></div><div class="r">{AV("JM","b",28)}<span class="x">Jonathan l’a relue</span><small>10:05</small></div></div></div>'''
    return wh('Valider une offre', 'Offres · Pôle Commercial') + f'<div class="ad-g">{o}{d}</div>'
W_VAL = A(valider(), 'offre', '/offres/commercial-terrain-b2b/validation')

DLG_ASG = f'''<h3>Confier « Chargé de clientèle »</h3><span style="font-size:13px;color:var(--texte2);margin-top:-8px">Pôle Commercial · 9 candidatures sans réponse</span>
<span class="ad-lab">Recruteur de l’offre</span><div class="ad-opt"><div class="o on">{AV("PL","d",36)}<div class="t"><b>Pascal Lumbala</b><span>3 offres · répond en 3 jours</span></div><span class="rd"></span></div><div class="o">{AV("JM","b",36)}<div class="t"><b>Jonathan Mukendi</b><span>Admin · 3 offres</span></div><span class="rd"></span></div></div>
<span class="ad-lab">Peuvent évaluer</span><div class="puces"><span class="puce on">Dieudonné Mpiana</span><span class="puce">Rachel Tshibanda</span><span class="puce">{ic("plus","xs")}Ajouter</span></div>
<span class="ad-lab">Avec l’offre, Pascal reçoit</span><div class="ad-chk"><div class="r"><i class="v">✓</i><span>Les 9 dossiers, les notes et l’historique</span></div><div class="r"><i class="v">✓</i><span>Les conversations en cours avec les candidats</span></div></div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Confier à Pascal</a></div>'''
W_ASG = A(offres_a(), 'offre', '/offres', over=dlg(DLG_ASG, 560))

# ---------- 6. Crédits Orbi et quotas ----------
def credits_a():
    q = f'''<div class="ad-g4"><div class="verre ad-k"><div class="h">{CS("orbi","accent")}<small>Crédits Orbi</small></div><b class="v">640 <span>sur 1 000</span></b><span class="barre"><i style="width:64%"></i></span><span class="n">Renouvelés le 9 novembre</span></div>
<div class="verre ad-k"><div class="h">{CS("recherche","accomp")}<small>Recherches de talents</small></div><b class="v">412 <span>sur 1 000</span></b><span class="barre"><i style="width:41%"></i></span><span class="n">Partagées par l’équipe</span></div>
<div class="verre ad-k"><div class="h">{CS("envoyer","former")}<small>Propositions aux talents</small></div><b class="v">248 <span>sur 300</span></b><span class="barre"><i class="w" style="width:83%"></i></span><span class="n">Alerte à 80 % envoyée</span></div>
<div class="verre ad-k"><div class="h">{CS("offre","oppo")}<small>Offres actives</small></div><b class="v">23 <span>sur 50</span></b><span class="barre"><i style="width:46%"></i></span><span class="n">Candidater reste gratuit</span></div></div>'''
    rp = f'''<div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:12px"><b>Répartition des crédits Orbi par pôle</b><div class="ad-stk"><i style="flex:300;background:#A6F26B"></i><i style="flex:300;background:#2FD3A6"></i><i style="flex:150;background:#F8CF73"></i><i style="flex:250;background:#93B4F0"></i></div>
<div class="ad-lg"><span><i style="background:#A6F26B"></i>Tech et Data 300</span><span><i style="background:#2FD3A6"></i>Commercial 300</span><span><i style="background:#F8CF73"></i>Finance 150</span><span><i style="background:#93B4F0"></i>Lubumbashi 250</span></div></div>'''
    R = [('AK', '', 'Aïcha Kasongo', 'Tech et Data', 74, 120), ('EN', 'c', 'Esther Nzuzi', 'Lubumbashi', 192, 200), ('PL', 'd', 'Pascal Lumbala', 'Commercial', 88, 150),
         ('CN', 'e', 'Christelle Ngoy', 'Finance', 31, 50), ('JM', 'b', 'Jonathan Mukendi', 'Commercial', 102, 150), ('DM', 'b', 'Dieudonné Mpiana', 'Tech et Data', 12, 40)]
    h = '<div class="r"><span>Membre</span><span>Pôle</span><span>Utilisés ce mois</span><span>Limite</span><span></span></div>'
    for i, c, n, p, u, l in R:
        w = 'w' if u / l > .9 else ''
        h += (f'<div class="r"><div class="m">{AV(i, c, 32)}<div class="t"><b>{n.split()[0]} {n.split()[1][0]}.</b></div></div><span class="g">{p}</span><div class="ad-mt"><span class="barre"><i class="{w}" style="width:{round(u / l * 100)}%"></i></span><small>{u} / {l}</small></div>'
              f'<span class="ad-pl">{l} par mois</span><a class="bt sec s">Modifier</a></div>')
    return (wh('Crédits et quotas', 'Company Plus · mois du 9 octobre au 8 novembre', f'<a class="bt sec m">Acheter des crédits</a>') + q
            + f'<div class="ad-g"><div class="col">{rp}<div class="verre ad-tbl ad-cr">{h}</div></div><div class="col">{orbi_cr()}<div class="gar">{ic("aide","s")}Un membre qui atteint sa limite vous envoie une demande. Il peut toujours travailler sans Orbi.</div></div></div>')
def orbi_cr():
    return f'''<div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:10px" data-ob="1"><div style="display:flex;gap:10px;align-items:center">{orbi(32)}<b>À ce rythme</b></div>
<div class="ad-chk"><div class="r"><i class="v">✓</i><span>L’équipe finira le mois avec environ 120 crédits.</span></div><div class="r"><i class="a">!</i><span>Esther atteindra sa limite jeudi : 5 offres à Lubumbashi.</span></div></div><a class="bt sec s" style="align-self:flex-start">Ajuster les limites</a></div>'''
W_CRED = A(credits_a(), 'portefeuille', '/credits')

DLG_CREQ = f'''<div style="display:flex;gap:12px;align-items:center">{AV("EN","c",52)}<div><h3 style="margin:0">Esther demande 100 crédits Orbi</h3><span style="font-size:12.5px;color:var(--texte2)">Pôle Lubumbashi · aujourd’hui 08:40</span></div></div>
<div class="orbi-l" style="background:var(--zone)"><div class="t">« 61 candidatures pour Technicien de maintenance, je voudrais les faire analyser avant vendredi. »</div></div>
<div class="ad-li"><div class="r"><div class="t"><b>Utilisés ce mois</b></div><span class="v">192 / 200</span></div><div class="r"><div class="t"><b>Restent à l’organisation</b></div><span class="v">360</span></div><div class="r"><div class="t"><b>Analyse de 61 CV</b><span>1 crédit par CV</span></div><span class="v">61</span></div></div>
<span class="ad-lab">Accorder</span><div class="puces"><span class="puce">50</span><span class="puce on">100</span><span class="puce">Pour ce mois seulement</span></div>
<div class="bts"><a class="bt sec m">Refuser</a><a class="bt p m pl">Accorder 100 crédits</a></div>'''
W_CREQ = A(credits_a(), 'portefeuille', '/credits', over=dlg(DLG_CREQ, 540))

# ---------- 7. Départ d'un membre ----------
DLG_RM = f'''<div style="display:flex;gap:12px;align-items:center">{AV("FL","e",52)}<div><h3 style="margin:0">Franck Lokwa quitte l’équipe ?</h3><span style="font-size:12.5px;color:var(--texte2)">Recruteur · Commercial · inactif depuis 34 jours</span></div></div>
<div class="seg"><span>Suspendre</span><span class="on">Retirer de l’organisation</span></div>
<span class="ad-lab">Ses offres et ses conversations passent à</span><div class="ad-opt"><div class="o on">{AV("PL","d",36)}<div class="t"><b>Pascal Lumbala</b><span>Même pôle · 2 offres, 9 candidatures, 4 conversations</span></div><span class="rd"></span></div></div>
<div class="ad-chk"><div class="r"><i class="v">✓</i><span>Les dossiers, notes et décisions restent dans l’organisation</span></div><div class="r"><i class="v">✓</i><span>Son compte RH personnel lui reste, sans accès à l’organisation</span></div><div class="r"><i class="v">✓</i><span>Un siège se libère : 11 sur 15</span></div></div>
<div class="gar">{ic("confidentialite","s")}Son accès est coupé tout de suite. Inscrit au journal, réversible en l’invitant à nouveau.</div>
<div class="bts"><a class="bt sec m">Annuler</a><a class="bt p m pl">Retirer et confier à Pascal</a></div>'''
W_RM = A(equipe_a('Franck Lokwa'), 'candidats', '/equipe/franck-lokwa', over=dlg(DLG_RM, 560))

# ---------- 8. Côté membre de l'équipe ----------
CMP = f'''<div class="ad-cmp"><div class="c">{CS("profil","accomp",48,16)}<h3>Recruteur autonome ou petit cabinet</h3><p>RH Free, Pro ou Premium. Son compte RH est aussi son organisation.</p>
<ul><li><i>✓</i>Ouvre son espace seul, invite 1 à 2 collègues</li><li><i>✓</i>Publie et décide sans validation</li><li><i>✓</i>Gère ses crédits et son abonnement</li></ul></div>
<div class="c e"><span class="cases" style="background:#A6F26B">{ic("entreprise","s")}</span><h3>Membre d’une organisation</h3><p>Company, Company Plus, Company Premium. L’admin pilote.</p>
<ul><li><i>✓</i>Rejoint sur invitation ou demande, avec un rôle et un pôle</li><li><i>✓</i>Voit les offres qui lui sont confiées</li><li><i>✓</i>Utilise les crédits que l’admin lui alloue</li><li><i>✓</i>Garde son compte RH s’il quitte l’organisation</li></ul></div></div>'''

MAIL_INV = f'''<div class="ad-mail"><div class="hd"><span class="rings"></span><div class="j">j<em>.</em></div><span class="k">INVITATION</span><h2>Rejoignez l’équipe de recrutement</h2><p>Mwinda Énergies · Pôle Tech et Data</p></div>
<div class="bd"><p>Bonjour,</p><p><b>Sandrine Ilunga</b>, Directrice RH, vous invite à recruter avec Mwinda Énergies sur Jumanly.</p>
<div class="card">{AV("ME","s",44)}<div><b>Recruteur · Pôle Tech et Data</b><span>1 offre confiée · Data analyst confirmé · 120 crédits Orbi par mois</span></div></div>
<p>Votre compte RH est créé, ou relié s’il existe déjà. Il vous appartient et reste rattaché à Mwinda Énergies tant que vous êtes dans l’équipe.</p><span class="cta">Accepter l’invitation</span>
<p style="font-size:12.5px;color:#5B6B68">Ce lien est valable 7 jours, jusqu’au 26 octobre.</p></div>
<div class="ft"><b>Jumanly</b> · Learn. Grow. Connect.<br>Une question : assistant@jumanly.io · infojumanly@gmail.com<br>Une plateforme développée par The Growth Lab.</div></div>'''

ACC_C = f'''<div class="ad-inv"><div style="display:flex;flex-direction:column;gap:14px"><span class="ad-pl ok" style="align-self:flex-start">Invitation de Sandrine Ilunga</span><h2>Rejoindre Mwinda Énergies</h2><p>Vous recruterez avec l’équipe, dans le rôle choisi par l’admin.</p>
<div class="ad-li" style="background:var(--plein);box-shadow:var(--verre)"><div class="r">{CS("offre","accomp",32,11)}<div class="t"><b>Recruteur</b><span>Publier, décider, écrire aux candidats</span></div></div><div class="r">{CS("entreprise","accent",32,11)}<div class="t"><b>Pôle Tech et Data</b><span>Responsable : Aïcha Kasongo</span></div></div><div class="r">{CS("orbi","former",32,11)}<div class="t"><b>120 crédits Orbi par mois</b><span>Alloués par l’organisation</span></div></div></div>
<div class="gar">{ic("confidentialite","s")}Votre compte RH reste le vôtre : si vous quittez l’équipe, vous le gardez.</div></div>
<div class="verre" style="padding:22px;display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center">{AV("GL","b",76)}<b style="font-size:17px">Grâce Lusamba</b><span style="font-size:12.5px;color:var(--texte2)">grace.l@mwinda-energies.example</span>
<a class="bt p m" style="width:100%">Accepter et rejoindre</a><a class="bt sec m" style="width:100%">Refuser</a></div></div>'''
W_ACCI = pub('/invitation/mwinda-energies', f'<div style="display:flex;flex-direction:column;height:100%"><div style="display:flex;align-items:center;gap:10px;padding:22px 40px"><span class="lg-e sap" style="width:34px;height:34px">J</span><b>jumanly</b></div>{ACC_C}</div>')

ACT_M = f'''<div class="r">{AV("SI","s",28)}<span class="x">Sandrine vous a confié <b>Chef de projet SI</b></span><small>Hier</small></div><div class="r">{AV("DM","b",28)}<span class="x">Dieudonné a évalué Ruth B.</span><small>09:15</small></div><div class="r">{AV("GL","b",28)}<span class="x">Grâce a rejoint le pôle</span><small>Ven.</small></div>'''
def membre_home(pr="Aïcha", role="Recruteuse · Pôle Tech et Data", u=74, l=120, val="non", O=None, act=None, sous=None, dem="Demander plus"):
    m = f'''<div class="ad-mem">{AV("ME","s",48)}<div class="t"><b>Mwinda Énergies · {role}</b><span>{sous or "Offres confiées par Sandrine Ilunga · validation avant publication : " + val}</span></div>
<div class="q"><small>Crédits Orbi : {u} sur {l}</small><div class="ad-mt" style="width:100%"><span class="barre"><i class="{"w" if u / l > .9 else ""}" style="width:{round(u / l * 100)}%"></i></span></div><a style="font-size:12px;font-weight:600">{dem}</a></div></div>'''
    O = O or [('Data analyst confirmé', '24 candidatures · 6 nouvelles', 'Publiée'), ('Ingénieur réseau électrique', '38 candidatures · 2 entretiens', 'Publiée'), ('Développeur back-end', 'Brouillon', 'Brouillon'), ('Chef de projet SI', 'Confiée hier par Sandrine', 'À lancer')]
    o = ''.join(f'<div class="verre ad-pole"><div class="h">{CS("offre","former",42,14)}<div class="t"><b>{t}</b><span>{s}</span></div><span class="ad-pl {"ok" if st == "Publiée" else ("at" if st == "À lancer" else "")}">{st}</span></div></div>' for t, s, st in O)
    return (wh(f'Bonjour {pr}', 'Lundi 19 octobre') + m + f'<div class="ad-g"><div class="col"><div class="ad-sec">Vos offres<a>{len(O)}</a></div><div class="ad-g2">{o}</div></div>'
            f'<div class="col"><div class="ad-sec">De l’équipe</div><div class="verre ad-act">{act or ACT_M}</div></div></div>')
W_ADREC = (R(membre_home('Sandrine', 'Admin principale · recrute aussi', 38, 150, O=[('Responsable des achats', '19 candidatures · 3 nouvelles', 'Publiée'), ('Juriste droit des affaires', '11 candidatures · 1 entretien', 'Publiée')], act=f'<div class="r">{AV("AK","",28)}<span class="x">Aïcha a publié <b>Data analyst confirmé</b></span><small>10:20</small></div><div class="r">{AV("DM","b",28)}<span class="x">Dieudonné a évalué un candidat de votre offre</span><small>09:15</small></div>', sous='Vos 2 offres · vous publiez sans validation · crédits pris sur ceux de l’organisation', dem='Crédits et quotas'), 'aujourdhui', '/hire')
   .replace('Nadia Kabeya', 'Sandrine Ilunga').replace('Responsable recrutement', 'Admin principale').replace('>NK<', '>SI<').replace('Baobab Fintech', 'Mwinda Énergies').replace('>BF<', '>ME<')
   .replace('Mwinda Énergies' + ic("suivant","xs") + '</div>', '<span class="t" style="flex:1;display:flex;flex-direction:column;line-height:1.2">Mwinda Énergies<small style="font-size:10.5px;font-weight:700;color:#1E8F6F">Recrutement</small></span>' + ic("suivant","xs") + '</div>', 1)
   .replace('<div class="ad-g"><div class="col"><div class="ad-sec">Vos offres', f'<div class="ad-sg" style="background:linear-gradient(90deg,#0F3F37,#14594C);color:#fff"><b style="flex:1">Vous êtes dans votre espace recruteur</b><a class="bt a s" style="flex:none">{ic("reglages","s")}Revenir à l’administration</a></div><div class="ad-g"><div class="col"><div class="ad-sec">Vos offres', 1))
W_MHOME = mbr(R(membre_home(), 'aujourdhui', '/hire'))

DLG_SUB = f'''<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span style="width:72px;height:72px;border-radius:50%;background:var(--g-accent);display:grid;place-items:center;color:#0F3F37">{ic("envoyer")}</span><h3 style="margin:6px 0 0">Offre envoyée pour validation</h3><span style="font-size:13px;color:var(--texte2)">Commercial terrain B2B · Pôle Commercial</span></div>
<div class="ad-li"><div class="r">{CS("valider","accent",32,11)}<div class="t"><b>Envoyée</b><span>Aujourd’hui 09:30</span></div></div><div class="r">{CS("horloge","oppo",32,11)}<div class="t"><b>Sandrine ou Jonathan valide</b><span>Ou demande une modification</span></div></div><div class="r">{CS("offre","former",32,11)}<div class="t"><b>Publication</b><span>Vous êtes prévenu dès qu’elle est en ligne</span></div></div></div>
<div class="bts"><a class="bt sec m">Modifier encore</a><a class="bt p m pl">Voir mes offres</a></div>'''
W_MSUB = (mbr(R(membre_home('Pascal', 'Recruteur · Pôle Commercial', 88, 150, 'oui'), 'offre', '/hire/offres', over=dlg(DLG_SUB, 500))).replace('Aïcha Kasongo', 'Pascal Lumbala').replace('Recruteuse · Tech et Data', 'Recruteur · Commercial').replace('>AK<', '>PL<'))

DLG_MCR = f'''<div style="display:flex;gap:12px;align-items:center">{orbi(48)}<div><h3 style="margin:0">Vos crédits Orbi du mois sont utilisés</h3><span style="font-size:12.5px;color:var(--texte2)">192 sur 200 · renouvelés le 9 novembre</span></div></div>
<span class="ad-lab">Demander à Sandrine</span><div class="puces"><span class="puce">50</span><span class="puce on">100</span><span class="puce">Autre</span></div>
{champ("Pourquoi", "61 candidatures pour Technicien de maintenance, je voudrais les faire analyser avant vendredi.")}
<div class="gar">{ic("aide","s")}Sans crédits, tout le reste fonctionne : lire, trier, décider, écrire.</div>
<div class="bts"><a class="bt sec m">Plus tard</a><a class="bt p m pl">{ic("envoyer","s")}Envoyer la demande</a></div>'''
W_MCR = (mbr(R(membre_home('Esther', 'Recruteuse · Pôle Lubumbashi', 192, 200), 'orbi', '/hire', over=dlg(DLG_MCR, 540))).replace('Aïcha Kasongo', 'Esther Nzuzi').replace('Recruteuse · Tech et Data', 'Recruteuse · Lubumbashi').replace('>AK<', '>EN<'))

def manager():
    g = [('SQL et modélisation', 'Requête testée en entretien', 4), ('Power BI', 'Tableau de bord présenté', 5), ('Communication', 'Explique simplement', 4), ('Esprit d’équipe', 'Exemples concrets', 3)]
    gr = ''.join(f'<div class="r"><div class="t"><b>{n}</b><span>{s}</span></div><div class="ad-stars">{"".join(f"<i class={chr(34)}on{chr(34)}>{k}</i>" if k <= v else f"<i>{k}</i>" for k in range(1, 6))}</div></div>' for n, s, v in g)
    l = f'''<div class="col"><div class="verre" style="padding:16px;display:flex;gap:12px;align-items:center">{AV("RB","",52)}<div style="flex:1"><b style="font-size:16px">Ruth B.</b><span style="display:block;font-size:12.5px;color:var(--texte2)">Data analyst confirmé · entretien du jeudi 22 octobre</span></div>{ring(80)}</div>
<div class="ad-sec">Grille d’évaluation</div><div class="verre ad-grd">{gr}</div>{champ("Votre avis", "Solide en SQL, très claire à l’oral. À revoir : travail en équipe sur un projet long.")}</div>'''
    d = f'''<div class="col"><div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:10px"><b>Votre rôle sur cette offre</b><span class="ad-pl mg" style="align-self:flex-start">Manager · évalue</span>
<div class="ad-chk"><div class="r"><i class="v">✓</i><span>Lire le dossier et les documents</span></div><div class="r"><i class="v">✓</i><span>Noter avec la grille, commenter</span></div><div class="r"><i class="a">—</i><span>La décision revient à Aïcha, recruteuse de l’offre</span></div></div></div>
<div class="ad-lock">{ic("cadenas","s")}Messages aux candidats et décisions : réservés au recruteur de l’offre.</div><a class="bt p m" style="width:100%">Envoyer mon évaluation</a></div>'''
    return wh('Évaluer Ruth B.', 'Pôle Tech et Data · offre confiée par Aïcha') + f'<div class="ad-g">{l}{d}</div>'
W_MGR = (mbr(R(manager(), 'candidats', '/hire/candidats/ruth-b/evaluation')).replace('Aïcha Kasongo', 'Dieudonné Mpiana').replace('Recruteuse · Tech et Data', 'Manager · Tech et Data').replace('>AK<', '>DM<'))

def lecteur():
    return (wh('Rapports', 'Mwinda Énergies · tous les pôles · 30 derniers jours', f'<a class="bt sec m">{ic("telecharger","s")}Exporter en PDF</a>') + kpis()
            + f'''<div class="ad-g"><div class="col"><div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:12px"><b>Candidatures par pôle</b><div class="ad-ech">
<div class="r"><span style="width:110px">Commercial</span><div class="ad-mt" style="flex:1"><span class="barre"><i style="width:100%"></i></span><small>151</small></div></div><div class="r"><span style="width:110px">Tech et Data</span><div class="ad-mt" style="flex:1"><span class="barre"><i style="width:87%"></i></span><small>132</small></div></div>
<div class="r"><span style="width:110px">Lubumbashi</span><div class="ad-mt" style="flex:1"><span class="barre"><i style="width:54%"></i></span><small>81</small></div></div><div class="r"><span style="width:110px">Finance</span><div class="ad-mt" style="flex:1"><span class="barre"><i style="width:32%"></i></span><small>48</small></div></div></div></div>
<div class="verre" style="padding:16px;display:flex;flex-direction:column;gap:12px"><b>Délai moyen de première réponse</b><div class="ad-ech">
<div class="r"><span style="width:110px">Tech et Data</span><div class="ad-mt" style="flex:1"><span class="barre"><i style="width:33%"></i></span><small>2 j</small></div></div><div class="r"><span style="width:110px">Lubumbashi</span><div class="ad-mt" style="flex:1"><span class="barre"><i style="width:33%"></i></span><small>2 j</small></div></div>
<div class="r"><span style="width:110px">Finance</span><div class="ad-mt" style="flex:1"><span class="barre"><i style="width:50%"></i></span><small>3 j</small></div></div><div class="r"><span style="width:110px">Commercial</span><div class="ad-mt" style="flex:1"><span class="barre"><i class="w" style="width:100%"></i></span><small>6 j</small></div></div></div></div></div>
<div class="col"><div class="verre ad-k"><div class="h">{CS("valider","accent")}<small>Recrutements du mois</small></div><b class="v">9</b><span class="n">dont 3 à Lubumbashi</span></div><div class="ad-lock">{ic("cadenas","s")}Rôle Lecteur : chiffres et rapports. Aucun dossier, aucun nom de candidat.</div></div></div>''')
W_LEC = (re.sub(r'<a class="it">(?:(?!</a>).)*?(?:Offres|Candidats|Messages|Agenda)(?:<b>\d</b>)?</a>', '', mbr(R(lecteur(), 'progression', '/hire/rapports'))).replace('Aïcha Kasongo', 'Benoît Kalala').replace('Recruteuse · Tech et Data', 'Lecteur · Direction générale').replace('>AK<', '>BK<'))

# ---------- Chemins ----------
def chemins_w():
    def c(t, et):
        p = f' {ic("suivant","xs")} '.join(f'<span class="{"f" if i == len(et) - 1 else ""}">{e}</span>' for i, e in enumerate(et))
        return f'<div class="c"><b>{t}</b><div class="p">{p}</div></div>'
    return '<div class="ch0">' + ''.join(c(t, e) for t, e in [
        ('Ouvrir l’administration', ['Nom de l’organisation en haut à gauche', 'Administration']), ('Recruter soi-même', ['Nom de l’organisation', 'Recrutement']), ('Revenir à l’administration', ['Bandeau « espace recruteur »', 'Revenir à l’administration']),
        ('Inviter des personnes', ['Équipe', 'Inviter', 'E-mails, rôle, pôle, crédits']), ('Accepter une demande', ['Vue d’ensemble ou Équipe > Demandes', 'Choisir le rôle', 'Accepter']),
        ('Changer un rôle', ['Équipe', 'Membre', 'Changer le rôle']), ('Créer un rôle', ['Rôles et accès', 'Créer un rôle']),
        ('Créer un pôle', ['Pôles', 'Créer un pôle']), ('Valider une offre', ['Offres', 'À valider', 'Valider et publier']),
        ('Confier une offre', ['Offres', 'Ligne de l’offre', 'Confier']), ('Fixer les crédits d’un membre', ['Crédits et quotas', 'Modifier']),
        ('Répondre à une demande de crédits', ['Vue d’ensemble', 'Répondre', 'Accorder']), ('Retirer un membre', ['Équipe', 'Membre', 'Retirer', 'Confier ses offres']),
        ('Rejoindre une équipe, côté membre', ['E-mail d’invitation', 'Accepter et rejoindre']), ('Demander des crédits, côté membre', ['Bandeau de l’organisation', 'Demander plus'])]) + '</div>'

def W(e, t, n=''): return wrow(wfig(e, '<span class="wtag">Ordinateur</span>' + t, n))
def T(e, t, n=''): return wrow(wfig(e, '<span class="wtag t">Tablette</span>' + t, n))
ECR = [
 ('w0', '0 · Comment on y arrive', 'L’admin a un compte RH personnel, rattaché à l’entreprise, et deux rôles : Administration et Recrutement. Il passe de l’un à l’autre par le nom de l’organisation, en haut à gauche.', [chemins_w()]),
 ('w1', '1 · Vue d’ensemble', 'Ce que l’admin pilote d’un coup d’œil : sièges, offres, crédits, demandes à traiter, pôles et activité de l’équipe.',
  [W(W_SW, 'Changer de rôle', 'Administration ou Recrutement, avec le même compte RH.'), W(W_ADREC, 'L’admin recrute aussi', 'Ses propres offres, retour à l’administration en un geste.'), W(W_DASH, 'Vue d’ensemble', 'À traiter, pôles, constats d’Orbi, activité.'), T(T_DASH, 'Vue d’ensemble')]),
 ('w2', '2 · Équipe', 'Tous les membres, leur rôle, leur pôle, leurs offres et leur activité. Une fiche par personne.',
  [W(W_EQ, 'Liste de l’équipe', 'Filtres par rôle, invitations, demandes.'), W(W_MB, 'Fiche d’un membre', 'Offres, crédits, consultations, actions.'), T(T_EQ, 'Liste de l’équipe')]),
 ('w3', '3 · Inviter et accueillir', 'Plusieurs e-mails à la fois, avec rôle, pôle, offres et crédits. Les demandes sur le domaine vérifié s’acceptent en un geste.',
  [W(W_INV, 'Inviter', 'Le siège est réservé jusqu’à l’acceptation.'), W(W_INVOK, 'Invitations envoyées', 'Valables 7 jours.'), W(W_REQ, 'Demande pour rejoindre', 'L’admin choisit le rôle.'), W(W_FULL, 'Plus de siège libre', 'Libérer un siège ou changer de formule.')]),
 ('w4', '4 · Rôles et accès', 'Cinq rôles prêts, et des rôles créés par l’organisation dès Company Plus. Chaque changement est expliqué, prévenu et journalisé.',
  [W(W_ROLES, 'Qui peut faire quoi', 'Rôles et permissions.'), W(W_ROLE, 'Changer un rôle', 'Ce qui change, dit avant.'), W(W_CUSTOM, 'Créer un rôle', 'Part d’un rôle, portée, permissions.'), T(T_ROLES, 'Rôles et accès')]),
 ('w5', '5 · Pôles et offres', 'Les pôles regroupent membres, offres et crédits. L’admin voit toutes les offres, valide celles qui le demandent et confie celles qui restent sans réponse.',
  [W(W_POLES, 'Pôles', 'Responsable, chiffres, membres, crédits.'), W(W_OFF, 'Toutes les offres', 'Validation avant publication, filtres.'), W(W_VAL, 'Valider une offre', 'Relecture d’Orbi, puis votre décision.'), W(W_ASG, 'Confier une offre', 'Dossiers et conversations suivent.')]),
 ('w6', '6 · Crédits Orbi et quotas', 'Les crédits de l’organisation se répartissent par pôle et par membre. Une limite atteinte n’empêche jamais de travailler sans Orbi.',
  [W(W_CRED, 'Crédits et quotas', 'Jauges, répartition, limites par membre.'), W(W_CREQ, 'Demande de crédits', 'Accorder ou refuser.')]),
 ('w7', '7 · Départ d’un membre', 'Suspendre ou retirer. Les offres et conversations passent à un collègue, les données restent, le siège se libère.', [W(W_RM, 'Retirer un membre', 'Tout est dit avant, et réversible.')]),
 ('w8', '8 · Côté membre de l’équipe', 'Le recruteur d’une organisation garde l’espace recruteur qu’il connaît. Il y voit son organisation, son rôle, ses offres confiées et ses crédits.',
  [CMP, wrow(wfig(MAIL_INV, '<span class="wtag">E-mail</span>Invitation', 'Sans numéro de téléphone.')), W(W_ACCI, 'Accepter l’invitation', 'Un compte RH personnel, rattaché à l’entreprise.'), W(W_MHOME, 'Accueil d’une recruteuse membre', 'Organisation, rôle, crédits alloués.'),
   W(W_MSUB, 'Recruteur avec validation', 'L’offre part chez l’admin.'), W(W_MCR, 'Crédits utilisés', 'Demander à l’admin.'), W(W_MGR, 'Manager', 'Évalue avec la grille, ne décide pas.'), W(W_LEC, 'Lecteur', 'Chiffres seulement, aucun nom.')]),
 ('w9', '9 · Mode sombre', 'Les mêmes écrans sur fond Nuit.', [W(wsombre(W_DASH), 'Vue d’ensemble'), W(wsombre(W_EQ), 'Équipe'), W(wsombre(W_ROLES), 'Rôles et accès'), W(wsombre(W_MB), 'Fiche d’un membre'), W(wsombre(W_ADREC), 'L’admin recrute aussi')]),
]
_st = lambda x: x.replace("<style>", "").replace("</style>", "")
page_w('admin-1', 'Jumanly for Companies · administration, ordinateur et tablette', 'Administrateur entreprise, lot 1 : piloter l’équipe',
       '19 octobre 2026. L’espace de l’admin d’une organisation (cabinet ou grande entreprise) : sièges, invitations, rôles et accès, pôles, validation et attribution des offres, crédits Orbi, départ d’un membre, et ce que cela change pour chaque recruteur de l’équipe. Web uniquement. Organisation et personnes fictives.', ECR,
       CSS + CSS1 + CSS2 + CSS3L + CSS4 + CSSR + _st(CSS_AB) + _st(CSS_RP) + CSSWR1 + CSSW2 + CSSW4 + CSSWR3 + CSSWR4 + CSSA1)
