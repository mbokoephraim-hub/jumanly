# Kit commun des pages recruteur (Modèle B) : styles, icônes, barre du bas, feuilles, Orbi, importeurs.
import os, json
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, 'canvas/project')

def ico(d, s=20, sw='1.7', col='currentColor'):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex: none;"><path d="{d}"></path></svg>'
ORBI = lambda s: (f'<svg width="{s}" height="{s}" viewBox="0 0 48 48" aria-hidden="true" style="flex: none;"><circle cx="24" cy="24" r="23" fill="#2FD3A6"></circle>'
                  '<path d="M23 10.5c1.3 7.4 5.6 11.8 13 13.1-7.4 1.3-11.7 5.7-13 13.1-1.3-7.4-5.6-11.8-13-13.1 7.4-1.3 11.7-5.7 13-13.1z" fill="#0B1A1F"></path>'
                  '<circle cx="35" cy="13" r="3.4" fill="#F2EDE5"></circle></svg>')
I = {
    'retour': 'M15 5 8 12l7 7', 'croix': 'M6 6l12 12M18 6 6 18', 'check': 'm5 12.5 4.5 4.5L19 7.5', 'chev': 'm9 6 6 6-6 6', 'bas': 'm6 9 6 6 6-6',
    'plus': 'M12 5v14M5 12h14', 'horl': 'M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15zM12 8v4l2.5 2',
    'cloche': 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0',
    'fil': 'M4 6h16M4 12h16M4 18h10',
    'offres': 'M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M12 11.5v2',
    'candidatures': 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.3M21.5 20a6.5 6.5 0 0 0-3.8-5.9',
    'talents': 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z',
    'messages': 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z',
    'cal': 'M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4',
    'pdf': 'M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 13h6M9 16.5h4',
    'note': 'M5 4.5h14v15H5zM8.5 9h7M8.5 12.5h7M8.5 16h4',
    'fleche': 'M5 12h14M13 6l6 6-6 6', 'envoi': 'M4 12 20 4l-6 16-3-7z',
    'lien': 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    'coeur': 'M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
    'bulle': 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z',
    'repub': 'M7 7h11l-3-3M17 17H6l3 3M18 7v4M6 17v-4',
    'partage': 'M12 4v11M7.5 8.5 12 4l4.5 4.5M5 14v5h14v-5',
    'reglage': 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5',
    'equipe': 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 19a5.5 5.5 0 0 1 11 0M10.5 19a5.5 5.5 0 0 1 11 0',
    'bat': 'M4 20V8l8-4 8 4v12M9 20v-5h6v5M8 10h.01M12 10h.01M16 10h.01',
    'carte': 'M3.5 6.5h17v11h-17zM3.5 10h17M7 14.5h4',
    'cle': 'M14.5 4.5a5 5 0 1 1-4.3 7.6L4 18.3V20h2.5v-2h2v-2l2.2-2.2a5 5 0 0 1 3.8-9.3z',
    'aide': 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17h.01',
    'sortie': 'M14 4.5h4.5v15H14M10 8l-4 4 4 4M6 12h10',
    'oeil': 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'video': 'M3.5 7h11v10h-11zM14.5 10.5l6-3.5v10l-6-3.5',
    'lieu': 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 1 1 13 0c0 4.8-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    'tel': 'M6.5 3.5h3l1.5 4-2 1.2a11 11 0 0 0 5.3 5.3l1.2-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 5.5a2 2 0 0 1 2-2z',
    'trombone': 'M16.5 7.5 9 15a2.1 2.1 0 0 1-3-3l7.8-7.8a3.5 3.5 0 0 1 5 5L10.5 17.5a5 5 0 0 1-7-7L10 4',
    'filtre': 'M4 5.5h16l-6 7.5v5l-4 2v-7z', 'tri': 'M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5',
    'etoile': 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z',
    'signet': 'M6.5 4h11v16.5L12 16.5l-5.5 4z', 'micro': 'M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5v3',
    'photo': 'M4 7.5h3l1.5-2h7l1.5 2h3v11H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
}
LOUPE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9FB3AE" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" style="flex: none;"><circle cx="11" cy="11" r="6.5"></circle><path d="m20 20-4.4-4.4"></path></svg>'
BACK = lambda act, t: f'<button onClick="{{{{{act}}}}}" class="retour" aria-label="Retour">{ico(I["retour"], 20, "2")}{t}</button>'
BACKA = lambda href, t: f'<a href="{href}" class="retour" aria-label="Retour" style="color: #F2EDE5;">{ico(I["retour"], 20, "2")}{t}</a>'

# Portrait illustré de Nadia
def PORTRAIT(s):
    return (f'<svg width="{s}" height="{s}" viewBox="0 0 100 100" aria-hidden="true" style="display: block; border-radius: 50%; flex: none;">'
            '<rect width="100" height="100" fill="#F4C9A0"></rect><circle cx="50" cy="40" r="25" fill="#2A1A12"></circle>'
            '<ellipse cx="50" cy="46" rx="16" ry="19" fill="#8A5A3B"></ellipse><path d="M34 40c2-13 30-15 32 0-4-6-12-9-16-9s-12 3-16 9z" fill="#2A1A12"></path>'
            '<path d="M18 100c4-20 18-28 32-28s28 8 32 28z" fill="#0F3F37"></path><path d="M42 72l8 10 8-10" fill="none" stroke="#A6F26B" stroke-width="3"></path></svg>')
MOI = lambda s=36: (f'<a href="Recruteur-compte.dc.html" aria-label="Mon compte" style="position: relative; width: {s}px; height: {s}px; flex: none; display: block;">'
                    f'<span style="display: block; width: {s}px; height: {s}px; border-radius: 50%; overflow: hidden;">{PORTRAIT(s)}</span>'
                    f'<span style="position: absolute; right: -3px; bottom: -3px; width: 16px; height: 16px; border-radius: 5px; background: #14745F; border: 2px solid #0B1A1F; color: #FFFFFF; font-size: 6.5px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span></a>')
CLOCHE = lambda n='4': (f'<a href="Recruteur-notifications.dc.html" class="rond" aria-label="Notifications, {n} nouvelles" style="position: relative; background: #1A2629; color: #F2EDE5;">{ico(I["cloche"], 21, "1.8")}'
                        f'<span style="position: absolute; right: 7px; top: 7px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: #A6F26B; color: #0B1A1F; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{n}</span></a>')

CSS = '''
body{margin:0;background:#050D10}
a{color:#A6F26B;text-decoration:none}
.fd,.fd *{box-sizing:border-box}
.fd{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.fd h1,.fd h2,.fd h3,.fd p{margin:0}
.fd button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.fd textarea{font:inherit}
.fd .scroll{scrollbar-width:none}.fd .scroll::-webkit-scrollbar{display:none}
.fd .hrow{display:flex;gap:10px;overflow-x:auto;padding:0 20px 4px;scrollbar-width:none}
.fd .hrow::after{content:"";flex:0 0 6px}
.fd .hrow::-webkit-scrollbar{display:none}
.fd .hrow>*{flex:none}
.fd .sec{display:flex;align-items:baseline;justify-content:space-between;padding:0 20px;margin:28px 0 10px}
.fd .sec h2{font-size:18px;font-weight:600}
.fd .sec a,.fd .sec button{font-size:14px;font-weight:600;min-height:36px;display:inline-flex;align-items:center}
.fd .meta{font-size:13px;color:#8FA39E}
.fd .tag{display:inline-block;font-size:12.5px;padding:5px 9px;border-radius:7px;background:#1A2629;color:#C9D6D2;white-space:nowrap}
.fd .ligne{width:100%;display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.07);color:#F2EDE5}
.fd .mini{width:48px;height:48px;border-radius:14px;color:#FFFFFF;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.fd .av{width:44px;height:44px;border-radius:50%;background:#1B3338;color:#F2EDE5;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.fd .barre{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.1);margin-top:8px;overflow:hidden}
.fd .barre i{display:block;height:100%;background:#A6F26B;border-radius:2px}
.fd .chip,.fd .pill{height:38px;padding:0 15px;border-radius:19px;font-size:13.5px;font-weight:600;white-space:nowrap;display:inline-flex;align-items:center;flex:none}
.fd .bp{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:52px;border-radius:26px;background:#A6F26B;color:#0B1A1F;font-size:15px;font-weight:700;text-align:center}
.fd .bs{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;padding:0 20px;border-radius:26px;border:1px solid rgba(255,255,255,.18);font-size:14px;font-weight:600;text-align:center;color:#F2EDE5}
.fd .bloc{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.07)}
.fd .bloc h3{font-size:15px;font-weight:700;margin-bottom:10px}
.fd .li{display:flex;gap:10px;font-size:14.5px;line-height:1.45;color:#ECE7DF;padding:4px 0}
.fd .li i{width:6px;height:6px;border-radius:50%;background:#A6F26B;margin-top:8px;flex:none}
.fd .barreh{padding:50px 12px 8px;display:flex;align-items:center;gap:4px;border-bottom:1px solid rgba(255,255,255,.08);min-height:102px}
.fd .retour{height:44px;padding:0 8px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:4px;white-space:nowrap;color:#F2EDE5}
.fd .plus{font-size:18px;letter-spacing:1px;color:#B9CBC6;min-width:44px;min-height:44px;text-align:center;display:flex;align-items:center;justify-content:center}
.fd .rond{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none}
.fd .nav{position:absolute;left:0;right:0;bottom:0;height:84px;padding:8px 6px 22px;background:rgba(11,26,31,.86);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));z-index:4}
.fd .nav a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;position:relative}
.fd .voile{position:absolute;inset:0;width:100%;background:rgba(0,0,0,.55)}
.fd .feuille{position:absolute;left:0;right:0;bottom:0;background:#13282C;border-radius:30px 30px 0 0;padding:10px 20px 28px;border-top:1px solid rgba(255,255,255,.08);max-height:760px;overflow-y:auto;scrollbar-width:none}
.fd .poignee{display:block;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.2);margin:0 auto 14px}
.fd .opt{width:100%;display:flex;align-items:center;gap:14px;min-height:56px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.06);font-size:15px;font-weight:600;color:#F2EDE5}
.fd .opt small{display:block;font-size:12.5px;font-weight:400;color:#8FA39E;margin-top:2px}
.fd .annuler{width:100%;height:50px;margin-top:12px;border-radius:999px;background:#1B3338;text-align:center;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;color:#F2EDE5}
.fd .q{width:100%;padding:14px 16px;border-radius:16px;background:#1B3338;font-size:14px;font-weight:600;line-height:1.4;display:block;color:#F2EDE5}
.fd .champ{display:flex;align-items:center;gap:10px;min-height:52px;border-radius:26px;background:#0B1A1F;padding:0 6px 0 18px;border:1px solid rgba(47,211,166,.45);min-width:0}
.fd .champ input{flex:1 1 0;width:0;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:14px;color:#F2EDE5}
.fd .env{height:40px;padding:0 16px;border-radius:20px;background:#A6F26B;color:#0B1A1F;font-size:13px;font-weight:700;display:flex;align-items:center;flex:none}
.fd .in{width:100%;height:52px;border-radius:16px;background:#0B1A1F;border:1px solid rgba(255,255,255,.14);padding:0 16px;font:inherit;font-size:15px;color:#F2EDE5;outline:0}
.fd .ta{width:100%;min-height:96px;border-radius:16px;background:#0B1A1F;border:1px solid rgba(255,255,255,.14);padding:12px 14px;font-size:14.5px;line-height:1.45;color:#F2EDE5;outline:0;resize:none}
.fd .lab{display:block;font-size:13px;font-weight:600;color:#B9CBC6;margin:20px 0 10px}
.fd .bas{position:absolute;left:0;right:0;bottom:0;padding:12px 20px 28px;background:rgba(11,26,31,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid rgba(255,255,255,.08);display:flex;gap:10px;z-index:4}
.fd .seg{display:flex;gap:0;border-bottom:1px solid rgba(255,255,255,.08);overflow-x:auto;scrollbar-width:none;padding:0 8px}
.fd .seg::-webkit-scrollbar{display:none}
.fd .seg button{height:46px;padding:0 12px;font-size:14px;white-space:nowrap;position:relative;flex:none}
.fd .seg button i{position:absolute;left:12px;right:12px;bottom:-1px;height:3px;border-radius:2px;background:#A6F26B}
.fd .carte{width:100%;display:block;border-radius:20px;border:1px solid rgba(255,255,255,.12);background:#13282C;padding:16px;color:#F2EDE5}
.fd .kpi{display:flex;gap:8px}
.fd .kpi span{flex:1;border-radius:12px;background:#0B1A1F;padding:9px 10px;font-size:11.5px;color:#8FA39E}
.fd .kpi b{display:block;font-size:17px;font-weight:700;color:#F2EDE5;margin-bottom:1px}
.fd .g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.fd .tuile{border-radius:16px;background:#13282C;border:1px solid rgba(255,255,255,.08);padding:14px;font-size:12.5px;color:#8FA39E;display:block}
.fd .tuile b{display:block;font-size:24px;font-weight:700;color:#F2EDE5;letter-spacing:-0.02em;margin-bottom:2px}
.fd .case{width:24px;height:24px;border-radius:7px;border:1.5px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#0B1A1F;flex:none}
.fd .score{min-width:50px;height:30px;padding:0 9px;border-radius:15px;font-size:13.5px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex:none}
.fd .rech{flex:1;min-width:0;height:50px;border-radius:25px;background:#1A2629;display:flex;align-items:center;gap:12px;padding:0 16px}
.fd .rech input{flex:1 1 0;width:0;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:16px;color:#F2EDE5}
.fd .rech input::placeholder,.fd .in::placeholder,.fd .champ input::placeholder{color:#6F8580}
'''

def nav(actif):
    items = [('fil', 'Fil', 'Recruteur-fil.dc.html'), ('offres', 'Offres', 'Recruteur-offres.dc.html'), ('candidatures', 'Candidatures', 'Recruteur-candidatures.dc.html'),
             ('talents', 'Talents', 'Recruteur-talents.dc.html'), ('messages', 'Messages', 'Recruteur-messages.dc.html')]
    h = '<nav aria-label="Navigation principale" class="nav">'
    for k, t, href in items:
        on = k == actif
        pastille = ''
        if k == 'candidatures' and not on:
            pastille = '<span style="position: absolute; top: 4px; left: 50%; margin-left: 6px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: #A6F26B; color: #0B1A1F; font-size: 9.5px; font-weight: 800; display: flex; align-items: center; justify-content: center;">17</span>'
        if k == 'messages' and not on:
            pastille = '<span style="position: absolute; top: 6px; left: 50%; margin-left: 7px; width: 8px; height: 8px; border-radius: 50%; background: #A6F26B;"></span>'
        h += (f'<a href="{href}" aria-label="{t}"{" aria-current=\"page\"" if on else ""} style="color: {"#A6F26B" if on else "#8FA39E"};">'
              f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{"2.1" if on else "1.7"}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{I[k]}"></path></svg>'
              f'<span style="width: 5px; height: 5px; border-radius: 50%; background: #A6F26B; opacity: {"1" if on else "0"};"></span>{pastille}</a>')
    return h + '</nav>'

def feuille(cond, corps, fermer='fermer', style=''):
    return (f'<sc-if value="{{{{{cond}}}}}" hint-placeholder-val="{{{{ false }}}}">\n<div style="position: absolute; inset: 0; z-index: 10;">\n'
            f'<button onClick="{{{{{fermer}}}}}" aria-label="Fermer" class="voile"></button>\n'
            f'<div class="feuille" style="{style}"><span class="poignee"></span>\n{corps}\n</div>\n</div>\n</sc-if>')

PILLS = lambda lst, n=4: ('<div style="display: flex; flex-wrap: wrap; gap: 8px;"><sc-for list="{{' + lst + f'}}}}" as="f" hint-placeholder-count="{n}">'
                          '<button onClick="{{f.pick}}" class="pill" style="border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div>')
SEG = lambda lst, n=4: ('<div class="seg" role="tablist"><sc-for list="{{' + lst + f'}}}}" as="o" hint-placeholder-count="{n}">'
                        '<button role="tab" aria-selected="{{o.sel}}" onClick="{{o.pick}}" style="font-weight: {{o.fw}}; color: {{o.col}};">{{o.t}}<sc-if value="{{o.aN}}" hint-placeholder-val="{{ false }}"><span style="margin-left: 6px; font-size: 11.5px; font-weight: 800; color: #A6F26B;">{{o.n}}</span></sc-if><sc-if value="{{o.on}}" hint-placeholder-val="{{ false }}"><i></i></sc-if></button></sc-for></div>')

TOAST = ('<sc-if value="{{aToast}}" hint-placeholder-val="{{ false }}">\n<div role="status" style="position: absolute; left: 20px; right: 20px; top: 54px; z-index: 30; padding: 14px 16px; border-radius: 16px; background: #F2EDE5; color: #0B1A1F; font-size: 14px; font-weight: 600; box-shadow: 0 16px 30px -10px rgba(0,0,0,.7); display: flex; align-items: center; gap: 10px;">'
         + ico(I['check'], 18, '2.6', '#14745F') + '{{toast}}</div>\n</sc-if>')

def FAB(cond='fab', bas=100):
    return (f'<sc-if value="{{{{{cond}}}}}" hint-placeholder-val="{{{{ true }}}}">\n<div style="position: absolute; right: 20px; bottom: {bas}px; display: flex; align-items: center; gap: 8px; z-index: 5;">'
            '<sc-if value="{{aBulle}}" hint-placeholder-val="{{ true }}"><button onClick="{{bulleGo}}" style="max-width: 210px; background: #1B3338; border-radius: 18px 18px 6px 18px; padding: 9px 12px; font-size: 12.5px; font-weight: 600; line-height: 1.35; box-shadow: 0 14px 30px -12px rgba(0,0,0,.8); border: 1px solid rgba(255,255,255,.08);">{{bulle}}</button></sc-if>'
            '<button onClick="{{ouvrirOrbi}}" aria-label="Ouvrir Orbi, l’assistant" style="width: 58px; height: 58px; border-radius: 50%; flex: none; box-shadow: 0 0 0 6px rgba(47,211,166,.2),0 14px 30px -8px rgba(47,211,166,.55);">' + ORBI(58) + '</button>\n</div>\n</sc-if>')

ORBI_SHEET = ('<sc-if value="{{orbi}}" hint-placeholder-val="{{ false }}">\n<div style="position: absolute; inset: 0; z-index: 12;">\n<button onClick="{{fermerOrbi}}" aria-label="Fermer Orbi" class="voile"></button>\n'
    '<div class="feuille"><span class="poignee"></span>\n<div style="display: flex; align-items: center; gap: 12px;">'
    '<sc-if value="{{aRep}}" hint-placeholder-val="{{ false }}"><button onClick="{{autresQ}}" aria-label="Autres questions" style="height: 40px; width: 32px; display: flex; align-items: center;">' + ico(I['retour'], 20, '2') + '</button></sc-if>'
    + ORBI(42) + '<span style="flex: 1;"><b style="display: block; font-size: 17px;">{{orbiTitre}}</b><span style="font-size: 12.5px; color: #8FA39E;">Orbi · {{orbiSous}} · 212 crédits restants</span></span>'
    '<button onClick="{{fermerOrbi}}" aria-label="Fermer" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">' + ico(I['croix']) + '</button></div>\n'
    '<sc-if value="{{sansRep}}" hint-placeholder-val="{{ true }}"><div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;"><sc-for list="{{questionsOrbi}}" as="q" hint-placeholder-count="4"><button onClick="{{q.go}}" class="q">{{q.t}}</button></sc-for></div></sc-if>\n'
    '<sc-if value="{{aRep}}" hint-placeholder-val="{{ false }}"><div style="margin-top: 16px;"><p class="meta">{{ra.q}}</p><p style="font-size: 15px; line-height: 1.5; margin-top: 8px;">{{ra.t}}</p>'
    '<sc-if value="{{ra.aAct}}" hint-placeholder-val="{{ true }}"><button onClick="{{ra.act}}" class="q" style="margin-top: 14px; background: #A6F26B; color: #0B1A1F; text-align: center;">{{ra.actT}}</button></sc-if>'
    '<sc-if value="{{ra.aLien}}" hint-placeholder-val="{{ false }}"><a href="{{ra.href}}" class="q" style="margin-top: 14px; background: #A6F26B; color: #0B1A1F; text-align: center;">{{ra.actT}}</a></sc-if>'
    '<p class="meta" style="margin-top: 10px; font-size: 12px;">Orbi recommande, vous décidez.</p></div></sc-if>\n'
    '<label class="champ" style="margin-top: 14px;"><input value="{{oq}}" onChange="{{ecrireOrbi}}" aria-label="Écrire à Orbi" placeholder="Écrire à Orbi…"><button onClick="{{envoyerOrbi}}" class="env">Envoyer</button></label>\n'
    '<a href="Recruteur-orbi.dc.html" style="display: flex; justify-content: center; margin-top: 10px; font-size: 13.5px; font-weight: 700; color: #5FE0B8; min-height: 36px; align-items: center;">Ouvrir la conversation complète</a>\n'
    '</div>\n</div>\n</sc-if>')

# Prélude commun inséré au début de chaque renderVals
PRELUDE = open(os.path.join(D, 'r_prelude.js')).read()
DONNEES = open(os.path.join(D, 'r_donnees.js')).read()

def ecrire_page(nom, titre, corps, js, props, css_extra=''):
    props = dict(props); props['$preview'] = {'width': 390, 'height': 844}
    js = js.replace('/*PRELUDE*/', PRELUDE).replace('/*DONNEES*/', DONNEES)
    html = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{titre}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>{CSS}{css_extra}</style>
</helmet>
<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">
{corps}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{json.dumps(props, ensure_ascii=False)}'>
{js}
</script>
</body>
</html>
'''
    import transitions_lib as _tl
    html = _tl.fix(html)
    open(os.path.join(P, nom + '.dc.html'), 'w').write(html)

def importer(nom, fn, titre, props):
    attrs = ' '.join(f'{k}="{v}"' for k, v in props.items())
    open(os.path.join(P, fn), 'w').write(f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{titre}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>body{{margin:0}}</style>
</helmet>
<div style="width: 390px; height: 844px; font-family: Sora, system-ui, sans-serif; color: #F2EDE5;">
<dc-import name="{nom}" {attrs} hint-size="390px,844px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":844}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{ oui: true }}; }}
}}
</script>
</body>
</html>
''')

def pages(nom, liste, sortie):
    for fn, t, pr in liste:
        importer(nom, fn, t, pr)
    json.dump([[nom + '.dc.html', 'prototype']] + [[x[0], x[1]] for x in liste], open(os.path.join(D, sortie), 'w'), ensure_ascii=False)
