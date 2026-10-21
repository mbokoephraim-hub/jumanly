# Génère project/Messages.dc.html (Modèle B, messagerie)
import os
OUT = os.path.join(os.path.dirname(__file__), 'canvas', 'project', 'Messages.dc.html')

B = {
 'p2': '/_blob/f6752c76c7b089d8d92e5aae07109df8',
 'p3': '/_blob/d159cc907efe9558da98ea05e4859c51',
 'p4': '/_blob/c98cbb9a256f1018c3f5694dd11b02d5',
 'bn': '/_blob/7a8185bb3611a612aa729be91409f78e',
 'av': '/_blob/b19fba46d85726a0c5e063a063d71f68',
}
SV = {
 's1': ('#0F3F37', '<path d="M12 74 L34 52 L52 60 L72 32 L92 40" fill="none" stroke="#A6F26B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path>'),
 's2': ('#1E4E79', '<path d="M24 86 V60 M42 86 V44 M60 86 V54 M78 86 V30" fill="none" stroke="#CFE4F7" stroke-width="9" stroke-linecap="round"></path>'),
 's3': ('#D9941E', '<circle cx="52" cy="52" r="26" fill="none" stroke="#FFF4D6" stroke-width="10" stroke-dasharray="110 60"></circle>'),
 's4': ('#14745F', '<path d="M24 34 H80 M24 50 H72 M24 66 H62" fill="none" stroke="#C9F1E3" stroke-width="6" stroke-linecap="round"></path>'),
 's5': ('#3A2A4F', '<circle cx="36" cy="44" r="8" fill="#E4D7FF"></circle><circle cx="64" cy="58" r="12" fill="#E4D7FF" opacity=".6"></circle>'),
}
GAL = ['p2', 'bn', 's1', 'p4', 's2', 's3', 's4', 's5']
ALL = ['p2', 'p3', 'p4', 'bn', 's1', 's2', 's3', 's4', 's5']

def tile(k, css):
    if k in B:
        return f'<img src="{B[k]}" alt="" style="{css} object-fit: cover; display: block;">'
    c, inner = SV[k]
    return f'<span style="{css} display: block; background: {c};"><svg viewBox="0 0 104 104" preserveAspectRatio="xMidYMid slice" style="width: 100%; height: 100%; display: block;" aria-hidden="true">{inner}</svg></span>'

def tiles(prefix, css, keys=ALL):
    return ''.join(f'<sc-if value="{{{{{prefix}.{k}}}}}" hint-placeholder-val="{{{{ false }}}}">{tile(k, css)}</sc-if>' for k in keys)

ORBI = '<circle cx="24" cy="24" r="23" fill="#2FD3A6"></circle><path d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z" fill="#0B1A1F"></path><circle cx="35" cy="13" r="3.4" fill="#F2EDE5"></circle>'
def orbi(s): return f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" aria-hidden="true">{ORBI}</svg>'
def ico(d, s=22, sw=1.8, col='currentColor'):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg>'
I = {
 'back': 'M15 5 8 12l7 7',
 'clip': 'M20 11.5 12.4 19a5 5 0 0 1-7.1-7.1l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3',
 'cam': 'M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 10a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z',
 'mic': 'M12 3.5a2.8 2.8 0 0 0-2.8 2.8v5.4a2.8 2.8 0 0 0 5.6 0V6.3A2.8 2.8 0 0 0 12 3.5zM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5',
 'send': 'M5 12h13M13 6l6 6-6 6',
 'search': 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.4-4.4',
 'new': 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13.5 6.5l4 4',
 'x': 'M6 6l12 12M18 6 6 18',
 'trash': 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12',
 'file': 'M7 3.5h7l4 4v13H7zM14 3.5v4h4',
 'cv': 'M6 3.5h12v17H6zM12 7.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8.5 16c.6-1.6 1.9-2.5 3.5-2.5s2.9.9 3.5 2.5',
 'lettre': 'M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6',
 'contact': 'M12 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5 20c.9-3.5 3.6-5.5 7-5.5s6.1 2 7 5.5',
 'agenda': 'M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4',
 'org': 'M5 20V5.5h9V20M14 9.5h5V20M3.5 20h17M8 9h2M8 12.5h2M8 16h2',
 'muet': 'M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4zM10 20h4M4 4l16 16',
 'ephem': 'M12 4.5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8.5v4l2.5 2.5',
 'up': 'M6 15l6-6 6 6', 'down': 'M6 9l6 6 6-6',
 'img': 'M4 5.5h16v13H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15.5 9.5h.01',
 'lien': 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
 'horloge': 'M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM12 8v4l3 2',
 'flip': 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
}
VERIF = '<svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-label="Compte vérifié" style="flex: none;"><circle cx="12" cy="12" r="11" fill="#A6F26B"></circle><path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="#0B1A1F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
def verif(x): return f'<sc-if value="{{{{{x}.verif}}}}" hint-placeholder-val="{{{{ true }}}}">{VERIF}</sc-if>'
def avatar(x, s, dot=True):
    ds = max(10, s // 4)
    d = f'<span style="position: absolute; right: 0; bottom: 0; width: {ds}px; height: {ds}px; border-radius: 50%; background: #5FE0B8; box-shadow: 0 0 0 2.5px #0B1A1F; opacity: {{{{{x}.on}}}};"></span>' if dot else ''
    return (f'<span style="position: relative; width: {s}px; height: {s}px; flex: none; display: block;">'
            f'<sc-if value="{{{{{x}.pp}}}}" hint-placeholder-val="{{{{ false }}}}"><img src="{B["p3"]}" alt="" style="width: {s}px; height: {s}px; border-radius: 50%; object-fit: cover; display: block;"></sc-if>'
            f'<sc-if value="{{{{{x}.pi}}}}" hint-placeholder-val="{{{{ true }}}}"><span style="width: {s}px; height: {s}px; border-radius: {{{{{x}.rad}}}}; background: {{{{{x}.col}}}}; color: {{{{{x}.lc}}}}; font-size: {round(s*0.32)}px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{{{{{x}.ini}}}}</span></sc-if>'
            f'{d}</span>')

TY=[('photos','Photos','img','#1E4E79'),('docs','Documents','file','#B8432F'),('liens','Liens','lien','#14745F'),('contacts','Contacts','contact','#3A2A4F'),('vocaux','Notes vocales','mic','#7A5C00'),('rdv','Rendez-vous','agenda','#0F3F37')]
TYGRID=''.join(f'<button class="opi" onClick="{{{{rt_{k}}}}}" style="border-radius: 18px; background: #0E1A1D; padding: 14px 0 12px;"><span class="c" style="background: {c}; width: 46px; height: 46px; border-radius: 15px;">{ico(I[i], 22, 1.8, "#F2EDE5")}</span>{t}</button>' for k,t,i,c in TY)
PANEL=f"""<sc-if value="{{{{rOptions}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="meta" style="padding: 20px 16px 10px;">Rechercher par type</p>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 0 16px;">{TYGRID}</div>
<p class="meta" style="padding: 24px 16px 4px;">Recherches récentes</p>
<sc-for list="{{{{recents}}}}" as="r" hint-placeholder-count="3"><button class="row" onClick="{{{{r.pick}}}}" style="padding: 10px 16px;">{ico(I["horloge"], 20, 1.8, "#8FA39E")}<span style="flex: 1; font-size: 15px;">{{{{r.t}}}}</span><span class="meta">{{{{r.d}}}}</span></button></sc-for>
<p class="meta" style="padding: 20px 16px 10px;">Vos connexions</p>
<div class="scroll" style="display: flex; gap: 14px; overflow-x: auto; padding: 0 16px 6px;"><sc-for list="{{{{rapides}}}}" as="c" hint-placeholder-count="5"><button onClick="{{{{c.ouvrir}}}}" style="display: flex; flex-direction: column; align-items: center; gap: 6px; width: 62px; flex: none; font-size: 12.5px; text-align: center;">{avatar("c", 56)}<span style="width: 62px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{{{c.prenom}}}}</span></button></sc-for></div>
<p class="meta" style="padding: 18px 16px; line-height: 1.5;">Tapez une lettre pour chercher un nom ou un mot dans vos messages.</p>
</div>
</sc-if>
<sc-if value="{{{{rType}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<div style="display: flex; align-items: center; gap: 8px; padding: 16px 16px 10px;"><span class="chip" style="background: #F2EDE5; color: #0B1A1F; gap: 8px;">{{{{rtNom}}}}<button onClick="{{{{viderRt}}}}" aria-label="Retirer le filtre" style="display: flex; color: #0B1A1F;">{ico(I["x"], 14, 2.4)}</button></span><span style="flex: 1;"></span><span class="meta">{{{{rtCompte}}}}</span></div>
<sc-if value="{{{{rtPhotos}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px;"><sc-for list="{{{{resType}}}}" as="r" hint-placeholder-count="3"><button onClick="{{{{r.voir}}}}" aria-label="Voir la photo" style="position: relative; display: block;">{tiles("r.ph", "width: 100%; height: 124px;")}<span style="position: absolute; left: 6px; bottom: 6px; font-size: 11px; font-weight: 600; padding: 3px 7px; border-radius: 8px; background: rgba(0,0,0,.6);">{{{{r.prenom}}}}</span></button></sc-for></div></sc-if>
<sc-if value="{{{{rtListe}}}}" hint-placeholder-val="{{{{ true }}}}"><div><sc-for list="{{{{resType}}}}" as="r" hint-placeholder-count="3"><button class="row" onClick="{{{{r.ouvrir}}}}" style="align-items: flex-start;">{avatar("r", 44, False)}<span style="flex: 1; min-width: 0;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 15px;">{{{{r.nom}}}}</b><span class="meta">{{{{r.h}}}}</span></span><span style="display: block; font-size: 13.5px; color: #B9CBC6; margin-top: 2px; line-height: 1.4;">{{{{r.t}}}}</span></span></button></sc-for></div></sc-if>
<sc-if value="{{{{rtVide}}}}" hint-placeholder-val="{{{{ false }}}}"><p class="meta" style="padding: 20px 16px; text-align: center;">Rien de ce type dans vos messages.</p></sc-if>
</div>
</sc-if>"""

BACK = f'<button class="bk" onClick="{{{{retour}}}}" aria-label="Retour">{ico(I["back"], 22, 2)}</button>'
def sheetback(label='Joindre'):
    return f'<button onClick="{{{{versJoindre}}}}" style="display: flex; align-items: center; gap: 4px; height: 40px; padding: 0 14px; font-size: 14px; color: #9FB3AE;">{ico(I["back"], 18, 2)}{label}</button>'

H = []
w = H.append
w('''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Messages</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#050D10}
a{color:#A6F26B;text-decoration:none}a:hover{color:#C8F99E}
.ms,.ms *{box-sizing:border-box}
.ms{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.ms h1,.ms h2,.ms p{margin:0}
.ms button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.ms input,.ms textarea{font:inherit;color:#F2EDE5}
.ms .scroll{scrollbar-width:none}.ms .scroll::-webkit-scrollbar{display:none}
.ms .meta{font-size:13px;color:#8FA39E}
.ms .pg{position:absolute;inset:0;background:#0B1A1F;z-index:6}
.ms .bk{width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex:none}
.ms .ib{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;color:#C9D6D2}
.ms .row{width:100%;display:flex;align-items:center;gap:14px;padding:12px 16px}
.ms .it{width:100%;display:flex;align-items:center;gap:14px;padding:15px 16px;border-bottom:1px solid rgba(255,255,255,.07);font-size:15px;min-height:54px}
.ms .it .v{color:#8FA39E;font-size:14px;margin-left:auto;white-space:nowrap}
.ms .tgl{width:46px;height:28px;border-radius:14px;position:relative;flex:none;margin-left:auto}
.ms .tgl i{position:absolute;top:3px;width:22px;height:22px;border-radius:50%;background:#F2EDE5}
.ms .sh{position:absolute;inset:0;z-index:20}
.ms .shb{position:absolute;inset:0;width:100%;background:rgba(0,0,0,.6)}
.ms .shp{position:absolute;left:0;right:0;bottom:0;background:#13282C;border-radius:28px 28px 0 0;padding:10px 0 28px;border-top:1px solid rgba(255,255,255,.08);max-height:90%;overflow-y:auto}
.ms .poi{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.2);margin:0 auto 12px}
.ms .sht{font-size:18px;font-weight:700;padding:0 18px 8px}
.ms .opt{width:100%;display:flex;align-items:center;gap:14px;padding:15px 18px;font-size:15px;border-bottom:1px solid rgba(255,255,255,.06);min-height:54px;color:#F2EDE5}
.ms .radio{width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;margin-left:auto}
.ms .radio i{width:10px;height:10px;border-radius:50%;background:#A6F26B}
.ms .chip{height:38px;padding:0 15px;border-radius:19px;font-size:13.5px;font-weight:600;display:inline-flex;align-items:center;white-space:nowrap}
.ms .bp{width:100%;height:52px;border-radius:26px;background:#A6F26B;color:#0B1A1F;font-size:15px;font-weight:700;text-align:center;display:flex;align-items:center;justify-content:center}
.ms .bs{width:100%;height:52px;border-radius:26px;border:1px solid rgba(255,255,255,.25);font-size:15px;font-weight:600;text-align:center;display:flex;align-items:center;justify-content:center}
.ms .rouge{color:#F08A7C}
.ms .badge{min-width:22px;height:22px;padding:0 7px;border-radius:11px;background:#A6F26B;color:#0B1A1F;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.ms .champ{display:flex;align-items:center;gap:10px;height:46px;border-radius:23px;background:#111D20;border:1px solid rgba(255,255,255,.1);padding:0 14px}
.ms .champ{min-width:0}
.ms .champ input{flex:1 1 0;width:0;border:0;outline:0;background:none;font-size:15px;min-width:0}
.ms .opi{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:12.5px;text-align:center;padding:6px 0}
.ms .opi span.c{width:54px;height:54px;border-radius:18px;display:flex;align-items:center;justify-content:center}
</style>
</helmet>
<div class="ms" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">
''')

# ---------------- LISTE ----------------
w(f'''<!-- ================= LISTE ================= -->
<div class="scroll" style="position: absolute; inset: 0; overflow-y: auto; padding-bottom: 120px;">
<div style="display: flex; align-items: center; justify-content: space-between; padding: 54px 10px 8px 16px;">
<h1 style="font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Messages</h1>
<button class="ib" onClick="{{{{ouvrirNouveau}}}}" aria-label="Nouveau message">{ico(I["new"])}</button>
</div>
<div style="padding: 0 16px; display: flex; align-items: center; gap: 10px;">
<label class="champ" style="flex: 1;">{ico(I["search"], 18, 1.8, "#9FB3AE")}<input value="{{{{q}}}}" onChange="{{{{chercher}}}}" onFocus="{{{{focusQ}}}}" placeholder="Rechercher une personne ou un message" aria-label="Rechercher dans les messages"><sc-if value="{{{{aQ}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{effacerQ}}}}" aria-label="Effacer la recherche" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #9FB3AE;">{ico(I["x"], 16, 2)}</button></sc-if></label>
<sc-if value="{{{{rOuvert}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{annulerQ}}}}" style="height: 44px; font-size: 14px; font-weight: 600; color: #A6F26B;">Annuler</button></sc-if>
</div>

<sc-if value="{{{{sansQ}}}}" hint-placeholder-val="{{{{ true }}}}">
<div>
<div role="tablist" aria-label="Types de conversations" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 14px; border-bottom: 1px solid rgba(255,255,255,.12);">
<sc-for list="{{{{onglets}}}}" as="o" hint-placeholder-count="3">
<button role="tab" onClick="{{{{o.pick}}}}" style="height: 48px; font-size: 14.5px; font-weight: {{{{o.fw}}}}; color: {{{{o.col}}}}; position: relative; display: flex; align-items: center; justify-content: center; gap: 6px;">{{{{o.t}}}}<span class="badge" style="min-width: 18px; height: 18px; font-size: 10.5px; padding: 0 5px; opacity: {{{{o.bo}}}};">{{{{o.n}}}}</span><span style="position: absolute; left: 14px; right: 14px; bottom: -1px; height: 3px; border-radius: 2px; background: #F2EDE5; opacity: {{{{o.on}}}};"></span></button>
</sc-for>
</div>
<sc-if value="{{{{ongC}}}}" hint-placeholder-val="{{{{ true }}}}">
<button class="row" onClick="{{{{goDemandes}}}}" style="border-bottom: 1px solid rgba(255,255,255,.07); padding: 14px 16px;">
<span style="width: 52px; height: 52px; border-radius: 50%; background: #13282C; color: #A6F26B; display: flex; align-items: center; justify-content: center; flex: none;">{ico(I["contact"], 22, 1.8)}</span>
<span style="flex: 1;"><b style="display: block; font-size: 15.5px;">Demandes de connexion</b><span class="meta">{{{{demTexte}}}}</span></span>
<span class="badge" style="opacity: {{{{demO}}}};">{{{{nbDem}}}}</span>
</button>
</sc-if>
<sc-for list="{{{{convs}}}}" as="c" hint-placeholder-count="5">
<button class="row" onClick="{{{{c.ouvrir}}}}" style="padding: 12px 16px;">
{avatar("c", 52)}
<span style="flex: 1; min-width: 0;">
<span style="display: flex; align-items: center; gap: 6px;"><b style="font-size: 15.5px; font-weight: {{{{c.fw}}}}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{{{c.nom}}}}</b>{verif("c")}<span style="flex: 1;"></span><span style="font-size: 12.5px; color: {{{{c.hc}}}}; flex: none;">{{{{c.heure}}}}</span></span>
<span style="display: flex; align-items: center; gap: 8px; margin-top: 3px;"><span style="flex: 1; min-width: 0; font-size: 13.5px; color: {{{{c.ac}}}}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{{{c.apercu}}}}</span><sc-if value="{{{{c.muet}}}}" hint-placeholder-val="{{{{ false }}}}">{ico(I["muet"], 15, 1.8, "#8FA39E")}</sc-if><span class="badge" style="opacity: {{{{c.bo}}}};">{{{{c.nl}}}}</span></span>
</span>
</button>
</sc-for>
<p class="meta" style="padding: 18px 16px; text-align: center;">Vous écrivez seulement à vos connexions.</p>
</div>
</sc-if>

{PANEL}
<sc-if value="{{{{aQ}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="meta" style="padding: 20px 16px 6px;">Personnes</p>
<sc-for list="{{{{resPers}}}}" as="c" hint-placeholder-count="2">
<button class="row" onClick="{{{{c.ouvrir}}}}">{avatar("c", 44)}<span style="flex: 1; min-width: 0;"><span style="display: flex; align-items: center; gap: 6px;"><b style="font-size: 15px;">{{{{c.nom}}}}</b>{verif("c")}</span><span class="meta">{{{{c.sous}}}}</span></span></button>
</sc-for>
<sc-if value="{{{{resPersVide}}}}" hint-placeholder-val="{{{{ false }}}}"><p class="meta" style="padding: 4px 16px;">Aucune connexion à ce nom.</p></sc-if>
<p class="meta" style="padding: 20px 16px 6px;">Dans les messages</p>
<sc-for list="{{{{resMsg}}}}" as="r" hint-placeholder-count="2">
<button class="row" onClick="{{{{r.ouvrir}}}}" style="align-items: flex-start;">{avatar("r", 44, False)}<span style="flex: 1; min-width: 0;"><span style="display: flex; justify-content: space-between;"><b style="font-size: 15px;">{{{{r.nom}}}}</b><span class="meta">{{{{r.h}}}}</span></span><span style="display: block; font-size: 13.5px; color: #B9CBC6; margin-top: 2px; line-height: 1.4;">{{{{r.t}}}}</span></span></button>
</sc-for>
<sc-if value="{{{{resMsgVide}}}}" hint-placeholder-val="{{{{ false }}}}"><p class="meta" style="padding: 4px 16px;">Aucun message ne contient « {{{{q}}}} ».</p></sc-if>
</div>
</sc-if>
</div>

<button onClick="{{{{ouvrirOrbi}}}}" aria-label="Ouvrir Orbi, l’assistant" style="position: absolute; right: 14px; bottom: 100px; width: 58px; height: 58px; border-radius: 50%; z-index: 5; box-shadow: 0 0 0 6px rgba(47,211,166,.2),0 14px 30px -8px rgba(47,211,166,.55);">{orbi(58)}</button>

<nav aria-label="Navigation principale" style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; padding: 8px 6px 22px; background: rgba(11,26,31,.86); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-top: 1px solid rgba(255,255,255,.07); display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); z-index: 4;">
<sc-for list="{{{{nav}}}}" as="n" hint-placeholder-count="5">
<a href="{{{{n.href}}}}" aria-label="{{{{n.t}}}}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; color: {{{{n.c}}}};">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{{{{n.sw}}}}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{{{n.d}}}}"></path></svg>
<span style="width: 5px; height: 5px; border-radius: 50%; background: #A6F26B; opacity: {{{{n.dot}}}};"></span>
</a>
</sc-for>
</nav>
''')

# ---------------- DEMANDES ----------------
w(f'''<!-- ================= DEMANDES ================= -->
<sc-if value="{{{{eDem}}}}" hint-placeholder-val="{{{{ false }}}}">
<div class="pg scroll" style="overflow-y: auto;">
<div style="display: flex; align-items: center; gap: 4px; padding: 48px 8px 8px; border-bottom: 1px solid rgba(255,255,255,.08);">{BACK}<b style="font-size: 17px;">Demandes de connexion</b></div>
<sc-for list="{{{{demandes}}}}" as="d" hint-placeholder-count="2">
<div class="row" style="align-items: flex-start; padding: 16px; border-bottom: 1px solid rgba(255,255,255,.07);">
{avatar("d", 52, False)}
<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 15.5px;">{{{{d.nom}}}}</b><span class="meta">{{{{d.sous}}}}</span>
<span style="display: block; font-size: 13.5px; color: #B9CBC6; margin-top: 6px; line-height: 1.4;">« {{{{d.mot}}}} »</span>
<sc-if value="{{{{d.attente}}}}" hint-placeholder-val="{{{{ true }}}}"><span style="display: flex; gap: 8px; margin-top: 12px;"><button onClick="{{{{d.accepter}}}}" style="height: 40px; padding: 0 18px; border-radius: 20px; background: #A6F26B; color: #0B1A1F; font-size: 14px; font-weight: 700;">Accepter</button><button onClick="{{{{d.refuser}}}}" style="height: 40px; padding: 0 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,.25); font-size: 14px; font-weight: 600;">Ignorer</button></span></sc-if>
<sc-if value="{{{{d.ok}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{d.ecrire}}}}" style="margin-top: 12px; height: 40px; padding: 0 18px; border-radius: 20px; border: 1px solid #A6F26B; color: #A6F26B; font-size: 14px; font-weight: 700;">Écrire à {{{{d.prenom}}}}</button></sc-if>
<sc-if value="{{{{d.non}}}}" hint-placeholder-val="{{{{ false }}}}"><span class="meta" style="display: block; margin-top: 10px;">Demande ignorée. {{{{d.prenom}}}} n’est pas prévenu·e.</span></sc-if>
</span>
</div>
</sc-for>
<p class="meta" style="padding: 18px 16px; line-height: 1.5;">Une fois connectés, vous pouvez vous écrire. Sans connexion, pas de message.</p>
</div>
</sc-if>
''')

# ---------------- DISCUSSION ----------------
bubble = f'''<sc-for list="{{{{msgs}}}}" as="m" hint-placeholder-count="5">
<div style="display: flex; justify-content: {{{{m.jc}}}}; padding: 3px 12px;">
<sc-if value="{{{{m.sys}}}}" hint-placeholder-val="{{{{ false }}}}"><span style="font-size: 12px; color: #9FB3AE; background: #111D20; padding: 6px 12px; border-radius: 12px; margin: 8px 0; text-align: center; max-width: 86%;">{{{{m.t}}}}</span></sc-if>
<sc-if value="{{{{m.bulle}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="max-width: 80%; background: {{{{m.bg}}}}; border-radius: {{{{m.rad}}}}; padding: {{{{m.pad}}}}; box-shadow: 0 0 0 {{{{m.hl}}}} #A6F26B;">
<sc-if value="{{{{m.texte}}}}" hint-placeholder-val="{{{{ true }}}}"><p style="font-size: 14.5px; line-height: 1.45; white-space: pre-line;">{{{{m.t}}}}</p></sc-if>
<sc-if value="{{{{m.photos}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{m.voir}}}}" aria-label="Voir les photos" style="display: grid; grid-template-columns: repeat({{{{m.cols}}}}, minmax(0, 1fr)); gap: 3px; width: 230px; border-radius: 16px; overflow: hidden;">{tiles("m.ph", "width: 100%; height: {{m.th}};")}</button></sc-if>
<sc-if value="{{{{m.doc}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{m.voir}}}}" style="display: flex; align-items: center; gap: 12px; width: 230px; padding: 4px 2px;"><span style="width: 40px; height: 48px; border-radius: 8px; background: #B8432F; color: #FFFFFF; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">{{{{m.ext}}}}</span><span style="min-width: 0;"><b style="display: block; font-size: 13.5px; font-weight: 600; word-break: break-all;">{{{{m.t}}}}</b><span class="meta">{{{{m.d}}}}</span></span></button></sc-if>
<sc-if value="{{{{m.contact}}}}" hint-placeholder-val="{{{{ false }}}}"><span style="display: block; width: 220px;"><span style="display: flex; align-items: center; gap: 10px; padding: 2px 0 10px;">{avatar("m.ct", 40, False)}<span><b style="display: block; font-size: 14.5px;">{{{{m.t}}}}</b><span class="meta">{{{{m.d}}}}</span></span></span><a href="Personne.dc.html" style="display: flex; justify-content: center; align-items: center; height: 38px; border-top: 1px solid rgba(255,255,255,.12); font-size: 13.5px; font-weight: 700;">Voir le profil</a></span></sc-if>
<sc-if value="{{{{m.event}}}}" hint-placeholder-val="{{{{ false }}}}"><span style="display: block; width: 230px;"><span style="font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #A6F26B;">{{{{m.lab}}}}</span><b style="display: block; font-size: 15px; margin-top: 4px;">{{{{m.t}}}}</b><span class="meta" style="display: block; margin-top: 2px;">{{{{m.d}}}}</span><button onClick="{{{{m.agenda}}}}" style="margin-top: 10px; width: 100%; height: 38px; border-radius: 19px; border: 1px solid rgba(255,255,255,.25); font-size: 13px; font-weight: 600; text-align: center;">Ajouter à l’agenda</button></span></sc-if>
<sc-if value="{{{{m.org}}}}" hint-placeholder-val="{{{{ false }}}}"><span style="display: block; width: 220px;"><span style="display: flex; align-items: center; gap: 10px; padding: 2px 0 10px;"><span style="width: 40px; height: 40px; border-radius: 12px; background: {{{{m.oc}}}}; color: {{{{m.olc}}}}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">{{{{m.oi}}}}</span><span><b style="display: block; font-size: 14.5px;">{{{{m.t}}}}</b><span class="meta">{{{{m.d}}}}</span></span></span><a href="Entreprise.dc.html" style="display: flex; justify-content: center; align-items: center; height: 38px; border-top: 1px solid rgba(255,255,255,.12); font-size: 13.5px; font-weight: 700;">Voir la page</a></span></sc-if>
<sc-if value="{{{{m.vocal}}}}" hint-placeholder-val="{{{{ false }}}}"><span style="display: flex; align-items: center; gap: 10px; width: 220px;"><button onClick="{{{{m.jouer}}}}" aria-label="{{{{m.jl}}}}" style="width: 38px; height: 38px; border-radius: 50%; background: #F2EDE5; color: #0B1A1F; display: flex; align-items: center; justify-content: center; flex: none;"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="{{{{m.jd}}}}" fill="#0B1A1F"></path></svg></button><span style="flex: 1; display: flex; align-items: center; gap: 2px; height: 28px;"><sc-for list="{{{{m.onde}}}}" as="b" hint-placeholder-count="20"><span style="flex: 1; height: {{{{b.h}}}}; border-radius: 2px; background: {{{{b.c}}}};"></span></sc-for></span><span class="meta" style="font-size: 12px;">{{{{m.t}}}}</span></span></sc-if>
<sc-if value="{{{{m.lien}}}}" hint-placeholder-val="{{{{ false }}}}"><a href="Offres-detail.dc.html" style="display: block; width: 230px; color: #F2EDE5;"><span style="display: block; height: 84px; border-radius: 12px; background: #0F3F37; position: relative; overflow: hidden;"><span style="position: absolute; left: 12px; top: 12px; width: 34px; height: 34px; border-radius: 10px; background: #A6F26B; color: #0F3F37; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;">BF</span></span><b style="display: block; font-size: 14px; margin-top: 8px;">{{{{m.d}}}}</b><span style="display: block; font-size: 12.5px; color: #A6F26B; margin-top: 2px;">{{{{m.t}}}}</span></a></sc-if>
<span style="display: flex; justify-content: flex-end; align-items: center; gap: 6px; margin-top: 4px; font-size: 11px; color: {{{{m.hcol}}}};"><sc-if value="{{{{m.hd}}}}" hint-placeholder-val="{{{{ false }}}}"><b style="font-size: 10px; padding: 1px 5px; border-radius: 4px; border: 1px solid currentColor;">HD</b></sc-if><sc-if value="{{{{m.eph}}}}" hint-placeholder-val="{{{{ false }}}}">{ico(I["ephem"], 12, 2)}</sc-if>{{{{m.h}}}}<span style="color: #5FE0B8;">{{{{m.lu}}}}</span></span>
</div>
</sc-if>
</div>
</sc-for>'''

w(f'''<!-- ================= DISCUSSION ================= -->
<sc-if value="{{{{eConv}}}}" hint-placeholder-val="{{{{ false }}}}">
<div class="pg">
<sc-if value="{{{{sansRech}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="position: absolute; left: 0; right: 0; top: 0; height: 104px; padding: 48px 4px 0; display: flex; align-items: center; gap: 2px; background: rgba(11,26,31,.96); border-bottom: 1px solid rgba(255,255,255,.08); z-index: 3;">
{BACK}
<button onClick="{{{{goInfos}}}}" aria-label="Voir les informations de la discussion" style="flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; height: 52px;">
{avatar("cur", 40)}
<span style="min-width: 0;"><span style="display: flex; align-items: center; gap: 6px;"><b style="font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{{{cur.nom}}}}</b>{verif("cur")}<sc-if value="{{{{cur.muet}}}}" hint-placeholder-val="{{{{ false }}}}">{ico(I["muet"], 15, 1.8, "#8FA39E")}</sc-if></span><span style="display: block; font-size: 12.5px; color: {{{{cur.sc}}}};">{{{{cur.statut}}}}</span></span>
</button>
<button class="ib" onClick="{{{{ouvrirMenu}}}}" aria-label="Options de la discussion" style="font-size: 20px; letter-spacing: 1px; color: #F2EDE5;">···</button>
</div>
</sc-if>
<sc-if value="{{{{aRech}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; left: 0; right: 0; top: 0; height: 104px; padding: 48px 8px 0 12px; display: flex; align-items: center; gap: 4px; background: rgba(11,26,31,.96); border-bottom: 1px solid rgba(255,255,255,.08); z-index: 3;">
<label class="champ" style="flex: 1; height: 42px;">{ico(I["search"], 17, 1.8, "#9FB3AE")}<input value="{{{{rq}}}}" onChange="{{{{chercherConv}}}}" placeholder="Rechercher dans la discussion" aria-label="Rechercher dans la discussion"><span class="meta" style="font-size: 12px; white-space: nowrap;">{{{{rCompte}}}}</span></label>
<button class="ib" onClick="{{{{rPrec}}}}" aria-label="Résultat précédent" style="width: 38px;">{ico(I["up"], 20, 2)}</button>
<button class="ib" onClick="{{{{rSuiv}}}}" aria-label="Résultat suivant" style="width: 38px;">{ico(I["down"], 20, 2)}</button>
<button onClick="{{{{fermerRech}}}}" style="height: 44px; padding: 0 6px; font-size: 14px; color: #A6F26B; font-weight: 600;">Fermer</button>
</div>
</sc-if>
<sc-if value="{{{{aRech}}}}" hint-placeholder-val="{{{{ false }}}}"><div class="scroll" style="position: absolute; left: 0; right: 0; top: 104px; height: 54px; display: flex; align-items: center; gap: 8px; padding: 0 12px; overflow-x: auto; background: #0B1A1F; border-bottom: 1px solid rgba(255,255,255,.06); z-index: 2;"><button class="chip" onClick="{{{{rcPhotos}}}}" style="border: 1px solid rgba(255,255,255,.28); gap: 6px;">{ico(I["img"], 16)}Photos</button><button class="chip" onClick="{{{{rcDocs}}}}" style="border: 1px solid rgba(255,255,255,.28); gap: 6px;">{ico(I["file"], 16)}Documents</button><button class="chip" onClick="{{{{rcLiens}}}}" style="border: 1px solid rgba(255,255,255,.28); gap: 6px;">{ico(I["lien"], 16)}Liens</button></div></sc-if>
<div class="scroll" style="position: absolute; left: 0; right: 0; top: {{{{hautMsgs}}}}; bottom: {{{{basMsgs}}}}; overflow-y: auto; display: flex; flex-direction: column-reverse;">
<div style="padding: 10px 0 12px;">
<sc-if value="{{{{cur.ephOn}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{ouvrirEphem}}}}" style="display: flex; align-items: center; gap: 8px; margin: 4px auto 10px; padding: 8px 14px; border-radius: 14px; background: #111D20; font-size: 12.5px; color: #B9CBC6;">{ico(I["ephem"], 15, 1.8)}Messages éphémères : {{{{cur.eph}}}}</button></sc-if>
{bubble}
<sc-if value="{{{{vide}}}}" hint-placeholder-val="{{{{ false }}}}"><p class="meta" style="text-align: center; padding: 40px 30px;">Aucun message. Écrivez le premier.</p></sc-if>
</div>
</div>

<sc-if value="{{{{composeur}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 10px 26px; display: flex; align-items: flex-end; gap: 6px; background: #0B1A1F; border-top: 1px solid rgba(255,255,255,.06);">
<button class="ib" onClick="{{{{ouvrirJoindre}}}}" aria-label="Joindre un fichier">{ico(I["clip"])}</button>
<label class="champ" style="flex: 1; padding: 0 6px 0 16px; min-height: 46px;"><input value="{{{{draft}}}}" onChange="{{{{saisir}}}}" placeholder="Écrire un message" aria-label="Écrire un message"><button onClick="{{{{ouvrirOrbiEcrire}}}}" aria-label="Écrire avec Orbi" style="width: 34px; height: 34px; flex: none;">{orbi(30)}</button></label>
<sc-if value="{{{{sansDraft}}}}" hint-placeholder-val="{{{{ true }}}}"><button class="ib" onClick="{{{{goCamera}}}}" aria-label="Prendre une photo">{ico(I["cam"])}</button></sc-if>
<sc-if value="{{{{sansDraft}}}}" hint-placeholder-val="{{{{ true }}}}"><button onClick="{{{{enregistrer}}}}" aria-label="Enregistrer une note vocale" style="width: 46px; height: 46px; border-radius: 50%; background: #1B3338; display: flex; align-items: center; justify-content: center; flex: none;">{ico(I["mic"], 22, 1.9)}</button></sc-if>
<sc-if value="{{{{aDraft}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{envoyer}}}}" aria-label="Envoyer" style="width: 46px; height: 46px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; flex: none;">{ico(I["send"], 22, 2.2)}</button></sc-if>
</div>
</sc-if>
<sc-if value="{{{{enreg}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 10px 26px; display: flex; align-items: center; gap: 10px; background: #0E1A1D; border-top: 1px solid rgba(255,255,255,.08);">
<button class="ib rouge" onClick="{{{{annulerVocal}}}}" aria-label="Supprimer la note vocale">{ico(I["trash"])}</button>
<span style="width: 10px; height: 10px; border-radius: 50%; background: #F08A7C; flex: none;"></span>
<b style="font-size: 15px; font-variant-numeric: tabular-nums;">{{{{duree}}}}</b>
<span style="flex: 1; display: flex; align-items: center; gap: 2px; height: 28px;"><sc-for list="{{{{ondeRec}}}}" as="b" hint-placeholder-count="20"><span style="flex: 1; height: {{{{b.h}}}}; border-radius: 2px; background: #F2EDE5; opacity: .75;"></span></sc-for></span>
<button onClick="{{{{envoyerVocal}}}}" aria-label="Envoyer la note vocale" style="width: 46px; height: 46px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; flex: none;">{ico(I["send"], 22, 2.2)}</button>
</div>
</sc-if>
<sc-if value="{{{{bloque}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 16px 16px 30px; text-align: center; background: #0E1A1D; border-top: 1px solid rgba(255,255,255,.08);">
<p class="meta" style="font-size: 14px;">Vous avez bloqué {{{{cur.prenom}}}}.</p>
<button onClick="{{{{debloquer}}}}" style="margin-top: 8px; height: 40px; padding: 0 20px; border-radius: 20px; border: 1px solid #A6F26B; color: #A6F26B; font-size: 14px; font-weight: 700;">Débloquer</button>
</div>
</sc-if>
</div>
</sc-if>
''')

# ---------------- INFOS ----------------
w(f'''<!-- ================= INFOS DE LA DISCUSSION ================= -->
<sc-if value="{{{{eInfos}}}}" hint-placeholder-val="{{{{ false }}}}">
<div class="pg scroll" style="overflow-y: auto; padding-bottom: 40px;">
<div style="padding: 48px 8px 0;">{BACK}</div>
<div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 20px;">
{avatar("cur", 96)}
<span style="display: flex; align-items: center; gap: 8px; margin-top: 14px;"><b style="font-size: 22px;">{{{{cur.nom}}}}</b>{verif("cur")}</span>
<span class="meta" style="font-size: 14px; margin-top: 4px;">{{{{cur.sous}}}}</span>
<span style="font-size: 13px; color: {{{{cur.sc}}}}; margin-top: 4px;">{{{{cur.statut}}}}</span>
</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 20px 16px 8px;">
<a href="{{{{cur.profil}}}}" style="height: 72px; border-radius: 18px; background: #111D20; color: #F2EDE5; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 12.5px;">{ico(I["contact"], 22)}Profil</a>
<button onClick="{{{{lancerRech}}}}" style="height: 72px; border-radius: 18px; background: #111D20; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 12.5px;">{ico(I["search"], 22)}Rechercher</button>
<button role="switch" aria-checked="{{{{muetT.ac}}}}" onClick="{{{{basculerMuet}}}}" style="height: 72px; border-radius: 18px; background: {{{{muetBg}}}}; color: {{{{muetCol}}}}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 12.5px;">{ico(I["muet"], 22)}{{{{muetLab}}}}</button>
</div>
<button class="it" onClick="{{{{goMedias}}}}" style="border-top: 1px solid rgba(255,255,255,.07); margin-top: 12px;">Médias, liens et documents<span class="v">{{{{nbMedias}}}} ›</span></button>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 10px 16px 14px;">
<button onClick="{{{{goMedias}}}}" aria-label="Ouvrir les médias" style="border-radius: 10px; overflow: hidden;">{tile("s1", "width: 100%; height: 80px;")}</button>
<button onClick="{{{{goMedias}}}}" aria-label="Ouvrir les médias" style="border-radius: 10px; overflow: hidden;">{tile("p2", "width: 100%; height: 80px;")}</button>
<button onClick="{{{{goMedias}}}}" aria-label="Ouvrir les médias" style="border-radius: 10px; overflow: hidden;">{tile("s2", "width: 100%; height: 80px;")}</button>
<button onClick="{{{{goMedias}}}}" aria-label="Ouvrir les médias" style="border-radius: 10px; overflow: hidden;">{tile("bn", "width: 100%; height: 80px;")}</button>
</div>
<button class="it" role="switch" aria-checked="{{{{muetT.ac}}}}" onClick="{{{{basculerMuet}}}}" style="border-top: 1px solid rgba(255,255,255,.07);"><span style="flex: 1;">Mode silencieux</span><span class="tgl" style="background: {{{{muetT.bg}}}};"><i style="left: {{{{muetT.x}}}};"></i></span></button>
<button class="it" onClick="{{{{ouvrirEphem}}}}">Messages éphémères<span class="v">{{{{cur.eph}}}} ›</span></button>
<button class="it" onClick="{{{{ouvrirPlus}}}}">Plus<span class="v">›</span></button>
</div>
</sc-if>
''')

# ---------------- MEDIAS ----------------
medgrid = ''.join(f'<button onClick="{{{{voir_{k}}}}}" aria-label="Voir la photo" style="display: block;">{tile(k, "width: 100%; height: 120px;")}</button>' for k in ['s1', 'p2', 's2', 'bn', 'p4', 's3', 's4', 's5', 'p3'])
w(f'''<!-- ================= MÉDIAS, LIENS, DOCUMENTS ================= -->
<sc-if value="{{{{eMedias}}}}" hint-placeholder-val="{{{{ false }}}}">
<div class="pg scroll" style="overflow-y: auto; padding-bottom: 40px;">
<div style="display: flex; align-items: center; gap: 4px; padding: 48px 8px 0;">{BACK}<b style="font-size: 17px;">{{{{cur.nom}}}}</b></div>
<div role="tablist" aria-label="Contenus partagés" style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: 1px solid rgba(255,255,255,.12); margin-top: 6px;">
<sc-for list="{{{{mOnglets}}}}" as="o" hint-placeholder-count="3"><button role="tab" onClick="{{{{o.pick}}}}" style="height: 48px; text-align: center; font-size: 14.5px; font-weight: {{{{o.fw}}}}; color: {{{{o.col}}}}; position: relative;">{{{{o.t}}}}<span style="position: absolute; left: 20px; right: 20px; bottom: -1px; height: 3px; border-radius: 2px; background: #F2EDE5; opacity: {{{{o.on}}}};"></span></button></sc-for>
</div>
<sc-if value="{{{{mtMedias}}}}" hint-placeholder-val="{{{{ true }}}}"><div><p class="meta" style="padding: 14px 16px 8px;">Octobre</p><div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px;">{medgrid}</div></div></sc-if>
<sc-if value="{{{{mtLiens}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<a href="Offres-detail.dc.html" class="row" style="color: #F2EDE5; border-bottom: 1px solid rgba(255,255,255,.07);"><span style="width: 52px; height: 52px; border-radius: 12px; background: #0F3F37; color: #A6F26B; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">BF</span><span style="min-width: 0;"><b style="display: block; font-size: 14.5px;">Analyste de données junior · Baobab Fintech</b><span style="font-size: 12.5px; color: #A6F26B;">jumanly.io/offres/analyste-baobab</span></span></a>
<a href="Entreprise.dc.html" class="row" style="color: #F2EDE5; border-bottom: 1px solid rgba(255,255,255,.07);"><span style="width: 52px; height: 52px; border-radius: 12px; background: #FFE1A1; color: #8A5A00; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">ME</span><span style="min-width: 0;"><b style="display: block; font-size: 14.5px;">Mwinda Énergie sur Jumanly</b><span style="font-size: 12.5px; color: #A6F26B;">jumanly.io/mwinda-energie</span></span></a>
</div>
</sc-if>
<sc-if value="{{{{mtDocs}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<sc-for list="{{{{docsConv}}}}" as="d" hint-placeholder-count="2"><button class="row" onClick="{{{{d.voir}}}}" style="border-bottom: 1px solid rgba(255,255,255,.07);"><span style="width: 40px; height: 48px; border-radius: 8px; background: #B8432F; color: #FFFFFF; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">PDF</span><span style="min-width: 0;"><b style="display: block; font-size: 14.5px; font-weight: 500;">{{{{d.t}}}}</b><span class="meta">{{{{d.d}}}}</span></span></button></sc-for>
</div>
</sc-if>
</div>
</sc-if>
''')

# ---------------- CAMÉRA ----------------
w(f'''<!-- ================= CAMÉRA ================= -->
<sc-if value="{{{{eCam}}}}" hint-placeholder-val="{{{{ false }}}}">
<div class="pg" style="background: #000000;">
<img src="{B["p2"]}" alt="Ce que voit la caméra" style="position: absolute; left: 0; right: 0; top: 0; width: 100%; height: 700px; object-fit: cover; display: block;">
<div style="position: absolute; left: 0; right: 0; top: 0; padding: 48px 10px 0; display: flex; justify-content: space-between;">
<button class="ib" onClick="{{{{retour}}}}" aria-label="Fermer la caméra" style="background: rgba(0,0,0,.5); color: #FFFFFF;">{ico(I["x"], 22, 2)}</button>
<sc-if value="{{{{cliche}}}}" hint-placeholder-val="{{{{ false }}}}"><button onClick="{{{{basculerHd}}}}" style="height: 40px; padding: 0 14px; border-radius: 20px; background: {{{{hdBg}}}}; color: {{{{hdCol}}}}; font-size: 13px; font-weight: 700; margin-top: 2px;">HD</button></sc-if>
</div>
<sc-if value="{{{{sansCliche}}}}" hint-placeholder-val="{{{{ true }}}}">
<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 160px; display: flex; align-items: center; justify-content: space-around; background: #000000;">
<button onClick="{{{{camVersGalerie}}}}" aria-label="Ouvrir la galerie" style="width: 48px; height: 48px; border-radius: 12px; overflow: hidden;">{tile("bn", "width: 48px; height: 48px;")}</button>
<button onClick="{{{{prendre}}}}" aria-label="Prendre la photo" style="width: 76px; height: 76px; border-radius: 50%; border: 5px solid #FFFFFF; display: flex; align-items: center; justify-content: center;"><span style="width: 58px; height: 58px; border-radius: 50%; background: #FFFFFF;"></span></button>
<button onClick="{{{{retourner}}}}" aria-label="Changer de caméra" class="ib" style="color: #FFFFFF;">{ico(I["flip"], 24)}</button>
</div>
</sc-if>
<sc-if value="{{{{cliche}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 12px 30px; display: flex; align-items: center; gap: 10px; background: #000000;">
<label class="champ" style="flex: 1; background: #1A1A1A;"><input placeholder="Ajouter une légende" aria-label="Légende" value="{{{{legende}}}}" onChange="{{{{saisirLegende}}}}"></label>
<button onClick="{{{{envoyerCliche}}}}" aria-label="Envoyer la photo" style="width: 50px; height: 50px; border-radius: 50%; background: #A6F26B; color: #0B1A1F; display: flex; align-items: center; justify-content: center; flex: none;">{ico(I["send"], 22, 2.2)}</button>
</div>
</sc-if>
</div>
</sc-if>
''')

# ---------------- VISIONNEUSE ----------------
vue = ''.join(f'<sc-if value="{{{{vue.{k}}}}}" hint-placeholder-val="{{{{ false }}}}">{tile(k, "width: 100%; height: 480px;")}</sc-if>' for k in ALL)
w(f'''<!-- ================= VISIONNEUSE ================= -->
<sc-if value="{{{{aVue}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: absolute; inset: 0; background: #000000; z-index: 25; display: flex; flex-direction: column;">
<div style="padding: 48px 10px 10px; display: flex; align-items: center; gap: 8px;"><button class="ib" onClick="{{{{fermerVue}}}}" aria-label="Fermer" style="color: #FFFFFF;">{ico(I["x"], 22, 2)}</button><span><b style="display: block; font-size: 15px;">{{{{vueTitre}}}}</b><span class="meta">{{{{vueSous}}}}</span></span></div>
<div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 0 20px;">
<sc-if value="{{{{vuePhoto}}}}" hint-placeholder-val="{{{{ true }}}}"><div style="width: 100%;">{vue}</div></sc-if>
<sc-if value="{{{{vueDoc}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="width: 290px; height: 410px; background: #FFFFFF; border-radius: 6px; padding: 26px 22px; display: flex; flex-direction: column; gap: 9px;"><span style="height: 12px; width: 60%; border-radius: 4px; background: #13282C;"></span><span style="height: 7px; width: 40%; border-radius: 4px; background: #14745F;"></span><span style="height: 5px; border-radius: 3px; background: #D5DAD8; margin-top: 14px;"></span><span style="height: 5px; width: 90%; border-radius: 3px; background: #D5DAD8;"></span><span style="height: 5px; width: 80%; border-radius: 3px; background: #D5DAD8;"></span><span style="height: 5px; width: 92%; border-radius: 3px; background: #D5DAD8;"></span><span style="height: 7px; width: 35%; border-radius: 4px; background: #14745F; margin-top: 14px;"></span><span style="height: 5px; border-radius: 3px; background: #D5DAD8;"></span><span style="height: 5px; width: 70%; border-radius: 3px; background: #D5DAD8;"></span><span style="height: 5px; width: 86%; border-radius: 3px; background: #D5DAD8;"></span></div></sc-if>
</div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 0 16px 34px;"><button class="bs" onClick="{{{{vueTransferer}}}}">Transférer</button><button class="bp" onClick="{{{{vueEnregistrer}}}}">Enregistrer</button></div>
</div>
</sc-if>
''')

# ---------------- FEUILLES ----------------
galtiles = ''.join(f'''<button onClick="{{{{gal.{k}.pick}}}}" aria-label="Choisir cette photo" style="position: relative; display: block; border-radius: 10px; overflow: hidden; box-shadow: 0 0 0 {{{{gal.{k}.ring}}}} #A6F26B inset;">{tile(k, "width: 100%; height: 86px;")}<span style="position: absolute; right: 6px; top: 6px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #FFFFFF; background: {{{{gal.{k}.bg}}}}; color: #0B1A1F; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center;">{{{{gal.{k}.n}}}}</span></button>''' for k in GAL)
OPTS = [('Documents', 'file', '#1E4E79', 'goDocs'), ('CV', 'cv', '#14745F', 'goCv'), ('Lettre de motivation', 'lettre', '#7A5C00', 'goLettre'), ('Contact', 'contact', '#3A2A4F', 'goContact'), ('Agenda', 'agenda', '#B8432F', 'goAgenda'), ('Organisation', 'org', '#0F3F37', 'goOrg')]
optgrid = ''.join(f'<button class="opi" onClick="{{{{{f}}}}}"><span class="c" style="background: {c};">{ico(I[i], 24, 1.8, "#F2EDE5")}</span>{t}</button>' for t, i, c, f in OPTS)

w(f'''<!-- ================= FEUILLES ================= -->
<sc-if value="{{{{sheetOuverte}}}}" hint-placeholder-val="{{{{ false }}}}">
<div class="sh">
<button class="shb" onClick="{{{{fermer}}}}" aria-label="Fermer"></button>
<div class="shp scroll">
<span class="poi"></span>

<sc-if value="{{{{sJoindre}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 4px; padding: 4px 12px 14px;">{optgrid}</div>
<div style="display: flex; justify-content: space-between; align-items: baseline; padding: 6px 16px 10px;"><b style="font-size: 15px;">Photos récentes</b><span class="meta">{{{{selTexte}}}}</span></div>
<sc-if value="{{{{galOk}}}}" hint-placeholder-val="{{{{ true }}}}"><div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 0 12px;">{galtiles}</div></sc-if>
<sc-if value="{{{{galNon}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="margin: 0 16px; padding: 20px 16px; border-radius: 18px; background: #0B1A1F; text-align: center;"><p style="font-size: 14.5px; line-height: 1.5;">Autorisez Jumanly à voir vos photos pour les envoyer ici.</p><button onClick="{{{{autoriserGal}}}}" style="margin-top: 12px; height: 42px; padding: 0 20px; border-radius: 21px; background: #A6F26B; color: #0B1A1F; font-size: 14px; font-weight: 700;">Autoriser l’accès</button></div></sc-if>
<sc-if value="{{{{aSel}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="position: sticky; bottom: -28px; margin-top: 14px; padding: 12px 12px 14px; background: #13282C; border-top: 1px solid rgba(255,255,255,.1); display: flex; align-items: center; gap: 10px;">
<button class="ib" onClick="{{{{viderSel}}}}" aria-label="Annuler la sélection" style="background: #1B3338;">{ico(I["x"], 20, 2)}</button>
<button onClick="{{{{basculerHd}}}}" aria-label="Envoyer en haute définition" style="height: 44px; padding: 0 14px; border-radius: 22px; background: {{{{hdBg}}}}; color: {{{{hdCol}}}}; border: 1px solid {{{{hdBd}}}}; font-size: 13px; font-weight: 700;">HD</button>
<button class="bp" onClick="{{{{envoyerPhotos}}}}" style="flex: 1; height: 46px;">Envoyer {{{{selEnvoi}}}}</button>
</div>
</sc-if>
</div>
</sc-if>

<sc-if value="{{{{sDocs}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>{sheetback()}<p class="sht">Documents</p><p class="meta" style="padding: 0 18px 8px;">Sur ce téléphone · Téléchargements</p>
<sc-for list="{{{{fichiers}}}}" as="f" hint-placeholder-count="3"><button class="opt" onClick="{{{{f.envoyer}}}}"><span style="width: 36px; height: 44px; border-radius: 8px; background: #B8432F; color: #FFFFFF; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">PDF</span><span><span style="display: block;">{{{{f.t}}}}</span><span class="meta">{{{{f.d}}}}</span></span></button></sc-for>
</div>
</sc-if>

<sc-if value="{{{{sCv}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>{sheetback()}<p class="sht">Envoyer un CV</p>
<sc-for list="{{{{cvs}}}}" as="f" hint-placeholder-count="3"><button class="opt" onClick="{{{{f.envoyer}}}}"><span style="width: 36px; height: 46px; border-radius: 6px; background: #F2EDE5; padding: 6px 5px; display: flex; flex-direction: column; gap: 3px; flex: none;"><span style="height: 5px; width: 60%; border-radius: 3px; background: {{{{f.c}}}};"></span><span style="height: 3px; border-radius: 2px; background: #C9CFCB;"></span><span style="height: 3px; width: 80%; border-radius: 2px; background: #C9CFCB;"></span><span style="height: 3px; border-radius: 2px; background: #C9CFCB;"></span></span><span><span style="display: block;">{{{{f.t}}}}</span><span class="meta">{{{{f.d}}}}</span></span></button></sc-for>
<a href="Carriere-cv-nouveau.dc.html" class="opt" style="border: 0; color: #A6F26B; font-weight: 600;">Créer un nouveau CV dans Carrière ›</a>
</div>
</sc-if>

<sc-if value="{{{{sLettre}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>{sheetback()}<p class="sht">Lettre de motivation</p>
<sc-for list="{{{{lettres}}}}" as="f" hint-placeholder-count="2"><button class="opt" onClick="{{{{f.envoyer}}}}"><span style="width: 36px; height: 44px; border-radius: 8px; background: #7A5C00; color: #FFFFFF; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">PDF</span><span><span style="display: block;">{{{{f.t}}}}</span><span class="meta">{{{{f.d}}}}</span></span></button></sc-for>
<div style="margin: 14px 16px 0; padding: 14px; border-radius: 18px; background: rgba(47,211,166,.08); border: 1px solid rgba(47,211,166,.28);">
<div style="display: flex; align-items: center; gap: 12px;">{orbi(34)}<span style="flex: 1; font-size: 13.5px;">Orbi rédige une lettre pour {{{{cur.cible}}}} à partir de votre profil.</span><button onClick="{{{{orbiLettre}}}}" style="font-size: 13.5px; font-weight: 700; color: #5FE0B8; min-height: 36px;">Rédiger</button></div>
<sc-if value="{{{{lettreOrbi}}}}" hint-placeholder-val="{{{{ false }}}}"><div style="margin-top: 12px; padding: 12px; border-radius: 14px; background: #0B1A1F;"><p style="font-size: 13.5px; line-height: 1.55;">Madame, Monsieur, diplômée en statistiques et formée à Power BI, je souhaite rejoindre {{{{cur.cible}}}} comme analyste de données. Lors de mon stage chez Mwinda Énergie, j’ai créé quatre tableaux de bord des ventes…</p><button onClick="{{{{envoyerLettreOrbi}}}}" style="margin-top: 12px; width: 100%; height: 42px; border-radius: 21px; background: #2FD3A6; color: #0B1A1F; font-size: 14px; font-weight: 700; text-align: center;">Envoyer en PDF</button></div></sc-if>
</div>
</div>
</sc-if>

<sc-if value="{{{{sContact}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>{sheetback()}<p class="sht">Partager un contact</p><p class="meta" style="padding: 0 18px 8px;">Parmi vos connexions</p>
<sc-for list="{{{{contacts}}}}" as="c" hint-placeholder-count="3"><button class="opt" onClick="{{{{c.envoyer}}}}">{avatar("c", 40, False)}<span><span style="display: block;">{{{{c.nom}}}}</span><span class="meta">{{{{c.sous}}}}</span></span></button></sc-for>
</div>
</sc-if>

<sc-if value="{{{{sAgenda}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>{sheetback()}<p class="sht">Proposer un rendez-vous</p>
<p class="meta" style="padding: 4px 18px 8px;">Jour</p><div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px;"><sc-for list="{{{{jours}}}}" as="s" hint-placeholder-count="3"><button class="chip" onClick="{{{{s.pick}}}}" style="background: {{{{s.bg}}}}; color: {{{{s.col}}}}; border: 1px solid {{{{s.bd}}}};">{{{{s.t}}}}</button></sc-for></div>
<p class="meta" style="padding: 14px 18px 8px;">Heure</p><div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px;"><sc-for list="{{{{heures}}}}" as="s" hint-placeholder-count="3"><button class="chip" onClick="{{{{s.pick}}}}" style="background: {{{{s.bg}}}}; color: {{{{s.col}}}}; border: 1px solid {{{{s.bd}}}};">{{{{s.t}}}}</button></sc-for></div>
<p class="meta" style="padding: 14px 18px 8px;">Comment</p><div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 0 18px;"><sc-for list="{{{{modes}}}}" as="s" hint-placeholder-count="3"><button class="chip" onClick="{{{{s.pick}}}}" style="background: {{{{s.bg}}}}; color: {{{{s.col}}}}; border: 1px solid {{{{s.bd}}}};">{{{{s.t}}}}</button></sc-for></div>
<div style="padding: 20px 18px 0;"><button class="bp" onClick="{{{{envoyerRdv}}}}">Envoyer : {{{{rdvTexte}}}}</button></div>
</div>
</sc-if>

<sc-if value="{{{{sOrg}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>{sheetback()}<p class="sht">Partager une organisation</p>
<sc-for list="{{{{orgs}}}}" as="o" hint-placeholder-count="3"><button class="opt" onClick="{{{{o.envoyer}}}}"><span style="width: 40px; height: 40px; border-radius: 12px; background: {{{{o.c}}}}; color: {{{{o.lc}}}}; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">{{{{o.i}}}}</span><span><span style="display: block;">{{{{o.t}}}}</span><span class="meta">{{{{o.d}}}}</span></span></button></sc-for>
</div>
</sc-if>

<sc-if value="{{{{sMenu}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<a href="{{{{cur.profil}}}}" class="opt">{ico(I["contact"])}Voir le profil</a>
<button class="opt" onClick="{{{{lancerRech}}}}">{ico(I["search"])}Rechercher dans la discussion</button>
<button class="opt" onClick="{{{{goMedias}}}}">{ico(I["file"])}Médias, liens et documents</button>
<button class="opt" role="switch" aria-checked="{{{{muetT.ac}}}}" onClick="{{{{basculerMuet}}}}">{ico(I["muet"])}<span style="flex: 1;">Mode silencieux</span><span class="tgl" style="background: {{{{muetT.bg}}}};"><i style="left: {{{{muetT.x}}}};"></i></span></button>
<button class="opt" onClick="{{{{ouvrirEphem}}}}">{ico(I["ephem"])}<span style="flex: 1;">Messages éphémères</span><span class="meta">{{{{cur.eph}}}}</span></button>
<button class="opt" onClick="{{{{ouvrirPlus}}}}" style="border: 0;"><span style="width: 22px; text-align: center; font-size: 18px; letter-spacing: 1px;">···</span><span style="flex: 1;">Plus</span><span class="meta">›</span></button>
</div>
</sc-if>

<sc-if value="{{{{sPlus}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="sht">{{{{cur.nom}}}}</p>
<button class="opt rouge" onClick="{{{{ouvrirBloquer}}}}">Bloquer {{{{cur.prenom}}}}</button>
<button class="opt rouge" onClick="{{{{ouvrirEffacer}}}}">Effacer la discussion</button>
<button class="opt" onClick="{{{{ouvrirExport}}}}">Exporter la discussion</button>
<button class="opt" onClick="{{{{ajouterRaccourci}}}}" style="border: 0;">Ajouter un raccourci sur l’écran d’accueil</button>
</div>
</sc-if>

<sc-if value="{{{{sEphem}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="sht">Messages éphémères</p>
<p class="meta" style="padding: 0 18px 10px; font-size: 14px; line-height: 1.5;">Les nouveaux messages disparaissent après la durée choisie, pour vous et pour {{{{cur.prenom}}}}.</p>
<sc-for list="{{{{ephems}}}}" as="e" hint-placeholder-count="4"><button class="opt" onClick="{{{{e.pick}}}}">{{{{e.t}}}}<span class="radio" style="border: 2px solid {{{{e.bd}}}};"><i style="opacity: {{{{e.on}}}};"></i></span></button></sc-for>
</div>
</sc-if>

<sc-if value="{{{{sExport}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="sht">Exporter la discussion</p>
<sc-for list="{{{{exports}}}}" as="e" hint-placeholder-count="2"><button class="opt" onClick="{{{{e.pick}}}}"><span><span style="display: block;">{{{{e.t}}}}</span><span class="meta">{{{{e.d}}}}</span></span><span class="radio" style="border: 2px solid {{{{e.bd}}}};"><i style="opacity: {{{{e.on}}}};"></i></span></button></sc-for>
<div style="padding: 18px 18px 0;"><button class="bp" onClick="{{{{exporter}}}}">Exporter</button></div>
</div>
</sc-if>

<sc-if value="{{{{sConfirm}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="padding: 0 18px;">
<p class="sht" style="padding: 0 0 8px;">{{{{confirm.t}}}}</p>
<p class="meta" style="font-size: 14.5px; line-height: 1.5;">{{{{confirm.d}}}}</p>
<div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;"><button onClick="{{{{confirmer}}}}" style="width: 100%; height: 52px; border-radius: 26px; background: #E25C4B; color: #FFFFFF; font-size: 15px; font-weight: 700; text-align: center;">{{{{confirm.b}}}}</button><button class="bs" onClick="{{{{fermer}}}}">Annuler</button></div>
</div>
</sc-if>

<sc-if value="{{{{sNouveau}}}}" hint-placeholder-val="{{{{ false }}}}">
<div>
<p class="sht">Nouveau message</p>
<p class="meta" style="padding: 0 18px 10px;">Vous pouvez écrire seulement à vos connexions.</p>
<sc-for list="{{{{toutes}}}}" as="c" hint-placeholder-count="6"><button class="opt" onClick="{{{{c.ouvrir}}}}">{avatar("c", 40)}<span style="min-width: 0;"><span style="display: flex; align-items: center; gap: 6px;">{{{{c.nom}}}}{verif("c")}</span><span class="meta">{{{{c.sous}}}}</span></span></button></sc-for>
<a href="Offres.dc.html" class="opt" style="border: 0; color: #A6F26B; font-weight: 600;">Trouver des personnes dans Explorer ›</a>
</div>
</sc-if>

<sc-if value="{{{{sOrbi}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="padding: 0 18px;">
<div style="display: flex; align-items: center; gap: 12px;">{orbi(44)}<span><b style="display: block; font-size: 17px;">Orbi</b><span class="meta">{{{{orbiSous}}}}</span></span></div>
<sc-if value="{{{{orbiDraft}}}}" hint-placeholder-val="{{{{ false }}}}"><p style="margin-top: 14px; padding: 12px 14px; border-radius: 14px; background: #0B1A1F; font-size: 14px; color: #B9CBC6; line-height: 1.5;">Votre texte : « {{{{draft}}}} »</p></sc-if>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;"><sc-for list="{{{{orbiActions}}}}" as="a" hint-placeholder-count="4"><button class="chip" onClick="{{{{a.pick}}}}" style="background: {{{{a.bg}}}}; color: {{{{a.col}}}}; border: 1px solid {{{{a.bd}}}};">{{{{a.t}}}}</button></sc-for></div>
<sc-if value="{{{{orbiRep}}}}" hint-placeholder-val="{{{{ false }}}}">
<div style="margin-top: 14px; padding: 14px; border-radius: 16px; background: #0B1A1F; border: 1px solid rgba(47,211,166,.3);">
<p style="font-size: 14.5px; line-height: 1.55; white-space: pre-line;">{{{{orbiTexte}}}}</p>
<sc-if value="{{{{orbiUtilisable}}}}" hint-placeholder-val="{{{{ true }}}}"><div style="display: flex; gap: 8px; margin-top: 12px;"><button onClick="{{{{orbiUtiliser}}}}" style="flex: 1; height: 42px; border-radius: 21px; background: #2FD3A6; color: #0B1A1F; font-size: 14px; font-weight: 700; text-align: center;">Utiliser</button><button onClick="{{{{orbiAutre}}}}" style="flex: 1; height: 42px; border-radius: 21px; border: 1px solid rgba(255,255,255,.25); font-size: 14px; font-weight: 600; text-align: center;">Autre version</button></div></sc-if>
</div>
</sc-if>
</div>
</sc-if>

</div>
</div>
</sc-if>

<sc-if value="{{{{aToast}}}}" hint-placeholder-val="{{{{ false }}}}">
<div role="status" style="position: absolute; left: 16px; right: 16px; top: 54px; z-index: 30; padding: 14px 16px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; font-weight: 600; box-shadow: 0 16px 30px -10px rgba(0,0,0,.7); display: flex; align-items: center; gap: 10px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14745F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"></path></svg>{{{{toast}}}}</div>
</sc-if>

</div>
</x-dc>
''')

JS = open(os.path.join(os.path.dirname(__file__), 'messages_logic.js')).read()
PROPS = '{"onglet":{"editor":"enum","options":["connexions","recruteurs","entreprises"],"default":"connexions"},"ecran":{"editor":"enum","options":["liste","demandes","conv","infos","medias","camera"],"default":"liste"},"conv":{"editor":"enum","options":["patrick","joel","ruth","sarah","nadia","moussa","clarisse","baobab","mwinda","fleuve"],"default":"patrick"},"feuille":{"editor":"enum","options":["","nouveau","menu","plus","ephem","export","confirm","joindre","docs","cv","lettre","contact","agenda","org","orbi"],"default":""},"variante":{"editor":"text","default":""},"$preview":{"width":390,"height":844}}'
w(f"<script type=\"text/x-dc\" data-dc-script data-props='{PROPS}'>\n{JS}\n</script>\n</body>\n</html>\n")
import importlib.util as _u
_sp = _u.spec_from_file_location('gouttiere', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gouttiere_lib.py')); _g = _u.module_from_spec(_sp); _sp.loader.exec_module(_g)
open(OUT, 'w').write(_g.fix(''.join(H)))
print('ok', len(''.join(H)))

# transitions douces (voir transitions_lib.py)
import transitions_lib as _tl
_p = OUT
_t = _tl.fix(open(_p).read())
open(_p, "w").write(_t)
