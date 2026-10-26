#!/usr/bin/env python3
"""Génère les planches « Fil : menu et publication » (canvas Design)."""
import json, os

P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'project')
BG = '#0B1A1F'

ICON = {
    'fil': '<path d="M4 6h16M4 12h16M4 18h10"/>',
    'explorer': '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    'carriere': '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5h6v2M3 12.5h18"/>',
    'formation': '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    'messages': '<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z"/>',
    'offres': '<path d="M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M12 11.5v2"/>',
    'candidatures': '<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.3M21.5 20a6.5 6.5 0 0 0-3.8-5.9"/>',
    'talents': '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.6 9.6l5.8-.8z"/>',
}
TALENT = [('fil', 'Fil'), ('explorer', 'Explorer'), ('carriere', 'Carrière'), ('formation', 'Hub'), ('messages', 'Chat')]
RECRUTEUR = [('fil', 'Fil'), ('offres', 'Offres'), ('candidatures', 'Candidatures'), ('talents', 'Talents'), ('messages', 'Chat')]

def svg(k, size=22, sw=1.9):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[k]}</svg>')

HEART = '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>'
BUBBLE = '<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z"/>'
SEND = '<path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/>'
SAVE = '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>'
SPARK = '<path d="M12 3c.6 4.6 3.4 7.4 9 9-5.6 1.6-8.4 4.4-9 9-.6-4.6-3.4-7.4-9-9 5.6-1.6 8.4-4.4 9-9z" fill="#0B1A1F"/>'

def ic(path, size=22, sw=1.9, fill='none'):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>')

# ---------------------------------------------------------------- CSS commun
CSS = """
body{margin:0}
a{color:#A6F26B;text-decoration:none}
.fd,.fd *{box-sizing:border-box}
.fd{font-family:Sora,system-ui,sans-serif;color:#F2EDE5;-webkit-font-smoothing:antialiased}
.fd h1,.fd h2,.fd p{margin:0}
.fd button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:left}
.fd .sc{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none;padding-bottom:150px}
.fd .sc::-webkit-scrollbar{display:none}
.fd .meta{font-size:13px;color:#8FA39E}
.fd .av{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex:none}
/* ---- publication ---- */
.fd .pub{padding:18px 20px 16px;border-bottom:1px solid rgba(255,255,255,.07)}
.fd .ph{display:flex;align-items:center;gap:10px}
.fd .ph .ring{width:44px;height:44px;border-radius:50%;padding:2.5px;flex:none}
.fd .ph .ring span{width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid #0B1A1F}
.fd .ph b{display:flex;align-items:center;gap:6px;font-size:14.5px;font-weight:700}
.fd .ph small{display:block;font-size:12.5px;color:#8FA39E;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd .pdots{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#8FA39E;flex:none}
.fd .pb{padding-left:54px;margin-top:6px}
.fd .pt{font-size:20px;font-weight:700;line-height:1.28;letter-spacing:-.01em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.fd .px{font-size:14.5px;line-height:1.5;color:#DCE6E3;margin-top:6px}
.fd .im{position:relative;height:280px;border-radius:30px;margin-top:14px;background:#13282C center/cover no-repeat;overflow:hidden}
.fd .im .grad{position:absolute;left:0;right:0;top:0;height:96px;background:linear-gradient(180deg,rgba(5,13,16,.62),rgba(5,13,16,0))}
.fd .au{position:absolute;left:14px;top:14px;right:56px;display:flex;align-items:center;gap:10px;color:#F2EDE5}
.fd .au .ring{width:46px;height:46px;border-radius:50%;padding:2.5px;flex:none}
.fd .au .ring span{width:100%;height:100%;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:2px solid #0B1A1F}
.fd .au b{display:flex;align-items:center;gap:6px;font-size:14.5px;font-weight:700;text-shadow:0 1px 6px rgba(0,0,0,.35)}
.fd .au small{display:block;font-size:12px;color:#E4ECE9;margin-top:1px;text-shadow:0 1px 6px rgba(0,0,0,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd .dots{position:absolute;right:12px;top:16px;width:38px;height:38px;border-radius:50%;background:rgba(11,26,31,.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;color:#F2EDE5}
.fd .notch{position:absolute;left:0;bottom:0;width:184px;height:62px;background:#0B1A1F;border-top-right-radius:28px;display:flex;align-items:center;gap:4px;padding:6px 8px 0 0}
.fd .k1,.fd .k2{position:absolute;width:28px;height:28px;background:radial-gradient(circle at 100% 0,transparent 27.5px,#0B1A1F 28px)}
.fd .k1{left:0;bottom:62px}.fd .k2{left:184px;bottom:0}
.fd .ab{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#F2EDE5;flex:none}
.fd .ab.sv{background:#1B3338}
.fd .reac{position:absolute;right:8px;bottom:12px;display:flex;align-items:center;gap:4px;height:34px;padding:0 10px 0 4px;border-radius:17px;background:rgba(11,26,31,.6);backdrop-filter:blur(8px);font-size:12.5px;font-weight:600}
.fd .reac i{width:24px;height:24px;border-radius:50%;margin-right:-10px;border:2px solid #13282C;font-style:normal;font-size:9.5px;font-weight:700;display:flex;align-items:center;justify-content:center}
.fd .reac i:last-of-type{margin-right:3px}
.fd .when{display:block;font-size:12.5px;color:#8FA39E;margin-top:8px}
/* ---- menu ---- */
.fd .menu{position:absolute;left:12px;right:12px;bottom:22px;height:64px;border-radius:32px;background:rgba(19,40,44,.9);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.08);box-shadow:0 14px 34px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:space-between;padding:0 8px;z-index:10}
.fd .it{position:relative;height:48px;min-width:48px;border-radius:24px;display:flex;align-items:center;justify-content:center;gap:0;padding:0 12px;transition:background-color .32s cubic-bezier(.3,.7,.2,1),color .32s,padding .32s cubic-bezier(.3,.7,.2,1)}
.fd .it .lb{display:inline-block;overflow:hidden;white-space:nowrap;font-size:13px;font-weight:700;transition:max-width .34s cubic-bezier(.3,.7,.2,1),opacity .22s,margin .34s}
.fd .it .bd{position:absolute;margin:-22px 0 0 22px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#A6F26B;color:#0B1A1F;font-size:9.5px;font-weight:800;display:flex;align-items:center;justify-content:center}
@media (prefers-reduced-motion:reduce){.fd .it,.fd .it .lb{transition:none}}
.fd .orbi{position:absolute;right:20px;bottom:104px;width:56px;height:56px;border-radius:50%;background:#2FD3A6;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(47,211,166,.16),0 10px 24px rgba(0,0,0,.4);z-index:9}
"""

HEAD = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>{css}</style>
</helmet>
"""
TAIL = """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{props}'>
{js}
</script>
</body>
</html>
"""

def page(name, title, body, js, w=390, h=844, extra_css=''):
    html = HEAD.format(title=title, css=CSS + extra_css) + body + TAIL.format(
        props=json.dumps({'$preview': {'width': w, 'height': h}}), js=js)
    open(os.path.join(P, name), 'w').write(html)

# ---------------------------------------------------------------- menu
def menu(items, key='nav'):
    """Menu en pilule : les 5 boutons restent dans le DOM, seuls leurs styles changent (animation)."""
    out = ['<nav class="menu" aria-label="Navigation principale">']
    for k, label in items:
        badge = ''
        if k == 'messages':
            badge = '<span class="bd" style="opacity: {{%s.%s.bdo}};">2</span>' % (key, k)
        if k == 'candidatures':
            badge = '<span class="bd" style="opacity: {{%s.%s.bdo}};">17</span>' % (key, k)
        out.append(
            f'<button class="it" onClick="{{{{{key}.{k}.go}}}}" aria-label="{label}" aria-current="{{{{{key}.{k}.cur}}}}" '
            f'style="background: {{{{{key}.{k}.bg}}}}; color: {{{{{key}.{k}.fg}}}}; padding: 0 {{{{{key}.{k}.pad}}}};">'
            f'{svg(k, 22, 2)}<span class="lb" style="max-width: {{{{{key}.{k}.mw}}}}; opacity: {{{{{key}.{k}.op}}}}; margin-left: {{{{{key}.{k}.ml}}}};">{label}</span>{badge}</button>')
    out.append('</nav>')
    return '\n'.join(out)

MENU_JS = """
    const navOf = (items, cur, set) => {
      const o = {};
      items.forEach(([k]) => {
        const on = k === cur;
        o[k] = { go: () => set(k), cur: on ? 'page' : 'false', bg: on ? '#A6F26B' : '#203F42', fg: on ? '#0F3F37' : '#C9D6D2',
          pad: on ? '16px' : '12px', mw: on ? '120px' : '0px', op: on ? '1' : '0', ml: on ? '8px' : '0px', bdo: on ? '0' : '1' };
      });
      return o;
    };"""

# ---------------------------------------------------------------- publication
def post(pid, title, text, img, author, sub, ring, avbg, avfg, avtxt, badge, reacts, n, when, href_author='#'):
    """Une publication : titre (2 lignes max), texte (~120 car.), image à encoche avec auteur et réactions."""
    bg = f"background-image: url('{img}');" if img else ''
    inner = '' if img else DASH
    rs = ''.join(f'<i style="background: {b}; color: {f};">{t}</i>' for t, b, f in reacts[:2])
    return f"""
<article class="pub">
<div class="ph"><span class="ring" style="background: {ring};"><span style="background: {avbg}; color: {avfg};">{avtxt}</span></span><span style="flex: 1; min-width: 0;"><b>{author}{badge}</b><small>{sub}</small></span><button class="pdots" onClick="{{{{{pid}.menu}}}}" aria-label="Plus d’options"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button></div>
<div class="pb">
<h2 class="pt">{title}</h2>
<p class="px">{text}</p>
<div class="im" style="{bg}">{inner}
<div class="reac">{rs}<svg width="13" height="13" viewBox="0 0 24 24" fill="#FF6B6B" aria-hidden="true">{HEART}</svg><span style="white-space: nowrap;">{{{{{pid}.n}}}}</span></div>
<i class="k1"></i><i class="k2"></i>
<div class="notch">
<button class="ab" onClick="{{{{{pid}.like}}}}" aria-label="J’aime" aria-pressed="{{{{{pid}.on}}}}" style="color: {{{{{pid}.hc}}}};"><svg width="25" height="25" viewBox="0 0 24 24" fill="{{{{{pid}.hf}}}}" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true">{HEART}</svg></button>
<button class="ab" onClick="{{{{{pid}.com}}}}" aria-label="Commenter">{ic(BUBBLE, 23)}</button>
<button class="ab" onClick="{{{{{pid}.env}}}}" aria-label="Envoyer">{ic(SEND, 22)}</button>
<button class="ab sv" onClick="{{{{{pid}.save}}}}" aria-label="Enregistrer" style="color: {{{{{pid}.sc}}}};"><svg width="20" height="20" viewBox="0 0 24 24" fill="{{{{{pid}.sf}}}}" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true">{SAVE}</svg></button>
</div>
</div>
<span class="when">{when}</span>
</div>
</article>"""

DASH = """<div style="position: absolute; inset: 0; background: #F2EDE5; padding: 20px 16px 0 16px;">
<div style="display: flex; gap: 8px; margin-left: 0;">
<div style="flex: 1; background: #fff; border-radius: 14px; padding: 9px 10px;"><span style="font-size: 10px; color: #5B6F6A;">Chiffre d’affaires</span><b style="display: block; font-size: 14px; white-space: nowrap; color: #0F3F37;">48 200 $</b></div>
<div style="flex: 1; background: #fff; border-radius: 14px; padding: 9px 10px;"><span style="font-size: 10px; color: #5B6F6A;">Meilleur mois</span><b style="display: block; font-size: 15px; color: #0F3F37;">Mars</b></div>
<div style="flex: 1; background: #0F3F37; border-radius: 14px; padding: 9px 10px;"><span style="font-size: 10px; color: #CFE8DA;">Stock bas</span><b style="display: block; font-size: 15px; color: #A6F26B;">3</b></div>
</div>
<div style="display: flex; align-items: flex-end; gap: 9px; height: 150px; margin: 18px 0 0 110px;">
<i style="flex: 1; height: 46%; border-radius: 6px; background: #2B6A5C;"></i><i style="flex: 1; height: 62%; border-radius: 6px; background: #2B6A5C;"></i><i style="flex: 1; height: 100%; border-radius: 6px; background: #A6F26B;"></i><i style="flex: 1; height: 72%; border-radius: 6px; background: #2B6A5C;"></i><i style="flex: 1; height: 84%; border-radius: 6px; background: #2B6A5C;"></i><i style="flex: 1; height: 58%; border-radius: 6px; background: #2B6A5C;"></i>
</div>
</div>"""

VERIF = '<svg width="15" height="15" viewBox="0 0 24 24" aria-label="Entreprise vérifiée"><path d="M12 2.5l2.4 1.8 3-.1.9 2.8 2.4 1.8-.9 2.9.9 2.9-2.4 1.8-.9 2.8-3-.1L12 21.5l-2.4-1.8-3 .1-.9-2.8-2.4-1.8.9-2.9-.9-2.9 2.4-1.8.9-2.8 3 .1z" fill="#A6F26B"/><path d="m8.5 12 2.4 2.4 4.6-4.8" fill="none" stroke="#0B1A1F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

POSTS = {
    'grace': dict(title='Mon premier tableau de bord Power BI est en ligne',
                  text='Les ventes d’une PME de Kinshasa, mois par mois. Construit après le cours Power BI de Jumanly. Vos retours m’aident à progresser.',
                  img='', author='Grâce Mbuyi', sub='Analyste de données junior · 2 h', ring='linear-gradient(135deg,#A6F26B,#2FD3A6)',
                  avbg='#A6F26B', avfg='#0B1A1F', avtxt='GM', badge='', n0=48,
                  reacts=[('AK', '#2B6A5C', '#F2EDE5'), ('JK', '#F4C463', '#0B1A1F'), ('SM', '#5FE0B8', '#0B1A1F')],
                  when='6 commentaires'),
    'baobab': dict(title='Nous recrutons 3 analystes data à Kinshasa',
                   text='Équipe jeune, projets concrets, formation sur place. Candidater est gratuit et chaque dossier reçoit une réponse.',
                   img='img/illus-baobab.jpg', author='Baobab Fintech', sub='Entreprise · Kinshasa · 5 h', ring='#A6F26B',
                   avbg='#0F3F37', avfg='#A6F26B', avtxt='BF', badge=VERIF, n0=126,
                   reacts=[('GM', '#A6F26B', '#0B1A1F'), ('PI', '#2B6A5C', '#F2EDE5'), ('NK', '#F4C463', '#0B1A1F')],
                   when='14 commentaires · offre dans Offres'),
    'kofi': dict(title='Premier jour chez Kivu Énergie',
                 text='Trois mois de candidatures, deux entretiens manqués, puis un oui. Merci à toutes les personnes qui ont relu mon CV.',
                 img='img/photo-kofi.jpg', author='Kofi Asante', sub='Technicien solaire · Goma · hier', ring='linear-gradient(135deg,#F4C463,#A6F26B)',
                 avbg='#2B6A5C', avfg='#F2EDE5', avtxt='KA', badge='', n0=312,
                 reacts=[('GM', '#A6F26B', '#0B1A1F'), ('DK', '#5FE0B8', '#0B1A1F'), ('AL', '#2B6A5C', '#F2EDE5')],
                 when='31 commentaires'),
}

def post_of(pid, **over):
    d = dict(POSTS[pid]); d.update(over)
    return post(pid, d['title'], d['text'], d['img'], d['author'], d['sub'], d['ring'], d['avbg'], d['avfg'], d['avtxt'],
                d['badge'], d['reacts'], d['n0'], d['when'])

POST_JS = """
    const postOf = (id, n0) => {
      const p = this.state.p[id] || {};
      const set = (patch) => this.setState({ p: { ...this.state.p, [id]: { ...p, ...patch } }, toast: patch.t || '' });
      return { on: p.like ? 'true' : 'false', hc: p.like ? '#FF6B6B' : '#F2EDE5', hf: p.like ? '#FF6B6B' : 'none', n: n0 + (p.like ? 1 : 0),
        like: () => set({ like: !p.like }), sc: p.save ? '#A6F26B' : '#F2EDE5', sf: p.save ? '#A6F26B' : 'none',
        save: () => set({ save: !p.save, t: p.save ? 'Retirée des enregistrements' : 'Enregistrée dans Carrière › Enregistrés' }),
        com: () => set({ t: 'Les commentaires s’ouvrent en feuille, comme aujourd’hui' }),
        env: () => set({ t: 'Envoyer à une connexion, comme aujourd’hui' }),
        menu: () => set({ t: 'Options : enregistrer, masquer, signaler' }) };
    };"""

TOAST = """<sc-if value="{{toastOn}}" hint-placeholder-val="{{ false }}"><div role="status" style="position: absolute; left: 20px; right: 20px; bottom: 100px; z-index: 12; padding: 12px 14px; border-radius: 14px; background: #F2EDE5; color: #0B1A1F; font-size: 13px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,.4);">{{toast}}</div></sc-if>"""

BELL = '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2.2 2.2 0 0 0 4 0"/>'

def fil_board(name, title, items, me_av, me_name, order, other_tabs, publier_href):
    tabs = ''.join(
        f'<span style="height: 44px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: {700 if i == 0 else 500}; color: {"#F2EDE5" if i == 0 else "#8FA39E"}; position: relative;">{t}'
        + ('<i style="position: absolute; left: 28%; right: 28%; bottom: -1px; height: 3px; border-radius: 2px; background: #A6F26B;"></i>' if i == 0 else '') + '</span>'
        for i, t in enumerate(['Pour vous', 'Abonnements', 'Entreprises']))
    posts = ''.join(post_of(pid, **ov) for pid, ov in order)
    body = f"""<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: {BG};">
<sc-if value="{{{{vFil}}}}" hint-placeholder-val="{{{{ true }}}}">
<div class="sc">
<header style="padding: 54px 20px 0; display: flex; align-items: center; gap: 8px;">
<h1 style="flex: 1; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">Fil</h1>
<span style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; position: relative;">{ic(BELL, 22, 1.7)}<span style="position: absolute; top: 6px; right: 4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: #A6F26B; color: #0B1A1F; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;">3</span></span>
<span class="av" style="width: 36px; height: 36px; background: {me_av[0]}; color: {me_av[1]};">{me_av[2]}</span>
</header>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 12px; border-bottom: 1px solid rgba(255,255,255,.08);">{tabs}</div>
<a href="{publier_href}" style="display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,.07); color: #F2EDE5;">
<span class="av" style="background: {me_av[0]}; color: {me_av[1]};">{me_av[2]}</span>
<span style="flex: 1;"><b style="display: block; font-size: 14px;">{me_name}</b><span style="font-size: 14px; color: #8FA39E;">Un titre, un texte, une image</span></span>
<span style="height: 36px; padding: 0 16px; border-radius: 999px; background: #A6F26B; color: #0B1A1F; font-size: 13px; font-weight: 700; display: flex; align-items: center;">Publier</span>
</a>
{posts}
</div>
</sc-if>
<sc-if value="{{{{vAutre}}}}" hint-placeholder-val="{{{{ false }}}}">
<div class="sc" style="padding: 54px 20px 0;">
<h1 style="font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">{{{{ongletT}}}}</h1>
<div style="margin-top: 22px; padding: 18px; border-radius: 22px; background: #13282C;">
<p style="font-size: 15px; line-height: 1.5;">Le contenu de cet onglet ne change pas. Regardez le menu : l’onglet actif s’est allongé en vert avec son nom, les autres restent des ronds.</p>
<button onClick="{{{{retourFil}}}}" style="margin-top: 14px; height: 44px; padding: 0 18px; border-radius: 22px; background: #A6F26B; color: #0B1A1F; font-weight: 700; font-size: 14px;">Revenir au Fil</button>
</div>
</div>
</sc-if>
{TOAST}
<span class="orbi" aria-label="Orbi"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">{SPARK}</svg></span>
{menu(items)}
</div>
"""
    labels = json.dumps({k: l for k, l in items}, ensure_ascii=False)
    ids = [pid for pid, _ in order]
    js = f"""class Component extends DCLogic {{
  constructor(props) {{ super(props); this.state = {{ tab: 'fil', p: {{}}, toast: '' }}; }}
  renderVals() {{{MENU_JS}{POST_JS}
    const L = {labels};
    const tab = this.state.tab;
    const items = Object.keys(L).map((k) => [k]);
    return {{
      nav: navOf(items, tab, (k) => this.setState({{ tab: k, toast: '' }})),
      vFil: tab === 'fil', vAutre: tab !== 'fil', ongletT: L[tab],
      retourFil: () => this.setState({{ tab: 'fil' }}),
      toast: this.state.toast, toastOn: !!this.state.toast,
      {', '.join(f"{pid}: postOf('{pid}', {POSTS[pid]['n0']})" for pid in ids)},
    }};
  }}
}}"""
    page(name, title, body, js)

fil_board('Fil-talent.dc.html', 'Fil talent, nouveau menu et publications', TALENT,
          ('#A6F26B', '#0B1A1F', 'GM'), 'Grâce Mbuyi',
          [('baobab', {}), ('grace', {'sub': 'Vous · 2 h'}), ('kofi', {})], [], 'Publier.dc.html')

fil_board('Fil-recruteur.dc.html', 'Fil recruteur, nouveau menu et publications', RECRUTEUR,
          ('#F4C463', '#0B1A1F', 'NK'), 'Nadia Kalala',
          [('grace', {}), ('baobab', {'sub': 'Publié par vous · 5 h'}), ('kofi', {})], [], 'Publier-recruteur.dc.html')

# ---------------------------------------------------------------- Publier
def publier(name, me_av, me_name, back, ent=False):
    body = f"""<div class="fd" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: {BG};">
<div class="sc" style="padding-bottom: 110px;">
<div style="display: grid; grid-template-columns: 96px 1fr 96px; align-items: center; padding: 48px 8px 6px; border-bottom: 1px solid rgba(255,255,255,.08);"><a href="{back}" style="color: #F2EDE5; font-size: 15px; padding: 0 12px; height: 44px; display: flex; align-items: center;">Annuler</a><b style="text-align: center; font-size: 16px; font-weight: 600;">Nouvelle publication</b><span></span></div>
<div style="padding: 14px 20px 0;">
<div style="display: flex; align-items: center; gap: 10px;"><span class="av" style="width: 36px; height: 36px; background: {me_av[0]}; color: {me_av[1]};">{me_av[2]}</span><b style="font-size: 14px;">{me_name}</b>{'<span class="meta" style="font-size: 12px;">au nom de Baobab Fintech</span>' if ent else ''}</div>

<div style="display: flex; align-items: baseline; margin-top: 16px;"><label for="ti" style="flex: 1; font-size: 13px; color: #8FA39E;">Titre · une phrase d’accroche</label><span style="font-size: 12px; font-weight: 700; color: {{{{tC}}}};">{{{{tN}}}}/60</span></div>
<textarea id="ti" rows="2" maxlength="60" onChange="{{{{setT}}}}" style="width: 100%; margin-top: 6px; border-radius: 14px; background: #111D20; border: 1px solid rgba(255,255,255,.1); padding: 12px 14px; font: inherit; font-size: 18px; font-weight: 700; line-height: 1.3; color: #F2EDE5; resize: none;">{{{{t}}}}</textarea>

<div style="display: flex; align-items: baseline; margin-top: 14px;"><label for="tx" style="flex: 1; font-size: 13px; color: #8FA39E;">Texte · environ 120 caractères</label><span style="font-size: 12px; font-weight: 700; color: {{{{xC}}}};">{{{{xN}}}}/160</span></div>
<textarea id="tx" rows="4" maxlength="160" onChange="{{{{setX}}}}" style="width: 100%; margin-top: 6px; border-radius: 14px; background: #111D20; border: 1px solid rgba(255,255,255,.1); padding: 12px 14px; font: inherit; font-size: 14.5px; line-height: 1.5; color: #F2EDE5; resize: none;">{{{{x}}}}</textarea>
<div style="height: 4px; border-radius: 2px; background: #1B3338; margin-top: 8px; position: relative;"><div style="position: absolute; left: 0; top: 0; height: 4px; border-radius: 2px; width: {{{{xPct}}}}; background: {{{{xC}}}};"></div><i style="position: absolute; left: 75%; top: -3px; width: 2px; height: 10px; background: #F2EDE5; opacity: .5;"></i></div>
<p class="meta" style="font-size: 12px; margin-top: 6px;">{{{{xAide}}}}</p>

<span style="display: block; font-size: 13px; color: #8FA39E; margin-top: 16px;">Image · elle prend la forme arrondie du Fil</span>
<div style="display: flex; gap: 8px; margin-top: 8px;">
<sc-for list="{{{{imgs}}}}" as="g" hint-placeholder-count="3"><button onClick="{{{{g.pick}}}}" aria-label="{{{{g.lab}}}}" style="width: 72px; height: 72px; border-radius: 18px; background: {{{{g.bg}}}} center/cover; outline: 2.5px solid {{{{g.ol}}}}; outline-offset: 2px;"></button></sc-for>
<span style="width: 72px; height: 72px; border-radius: 18px; border: 1.5px dashed rgba(255,255,255,.28); display: flex; align-items: center; justify-content: center; color: #A6F26B; font-size: 26px;">+</span>
</div>

<span style="display: block; font-size: 13px; font-weight: 700; color: #8FA39E; margin-top: 22px; letter-spacing: .4px;">APERÇU DANS LE FIL</span>
</div>
<article class="pub" style="border: 0; padding-top: 10px;">
<div class="ph"><span class="ring" style="background: linear-gradient(135deg,#A6F26B,#2FD3A6);"><span style="background: {me_av[0]}; color: {me_av[1]};">{me_av[2]}</span></span><span style="flex: 1;"><b>{me_name}</b><small>à l’instant</small></span></div>
<div class="pb">
<h2 class="pt">{{{{tAff}}}}</h2>
<p class="px">{{{{xAff}}}}</p>
<div class="im" style="background-image: {{{{imgUrl}}}};">
<i class="k1"></i><i class="k2"></i>
<div class="notch"><span class="ab">{ic(HEART, 25)}</span><span class="ab">{ic(BUBBLE, 23)}</span><span class="ab">{ic(SEND, 22)}</span><span class="ab sv">{ic(SAVE, 20)}</span></div>
</div>
</div>
</article>
</div>
<div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 20px 30px; background: rgba(11,26,31,.96); border-top: 1px solid rgba(255,255,255,.06);"><a href="{back}" style="display: flex; align-items: center; justify-content: center; height: 52px; border-radius: 26px; background: {{{{pubBg}}}}; color: {{{{pubFg}}}}; font-weight: 700; font-size: 15px;">{{{{pubT}}}}</a></div>
</div>
"""
    t0 = 'Nous recrutons 3 analystes data à Kinshasa' if ent else 'Mon premier tableau de bord Power BI est en ligne'
    x0 = POSTS['baobab' if ent else 'grace']['text']
    js = f"""class Component extends DCLogic {{
  constructor(props) {{ super(props); this.state = {{ t: {json.dumps(t0, ensure_ascii=False)}, x: {json.dumps(x0, ensure_ascii=False)}, g: {1 if ent else 2} }}; }}
  renderVals() {{
    const s = this.state, tn = s.t.length, xn = s.x.length;
    const G = [['img/photo-kofi.jpg', 'Photo'], ['img/illus-baobab.jpg', 'Illustration'], ['img/dash.png', 'Capture']];
    const imgs = G.map(([u, lab], i) => ({{ lab, bg: "url('" + u + "')", ol: s.g === i ? '#A6F26B' : 'transparent', pick: () => this.setState({{ g: i }}) }}));
    const ok = tn >= 8 && xn >= 40;
    return {{
      t: s.t, x: s.x, tN: tn, xN: xn, imgs,
      setT: (e) => this.setState({{ t: e.target.value.slice(0, 60) }}),
      setX: (e) => this.setState({{ x: e.target.value.slice(0, 160) }}),
      tC: tn > 55 ? '#F4C463' : '#8FA39E',
      xC: xn > 150 ? '#F4C463' : xn >= 90 ? '#A6F26B' : '#8FA39E',
      xPct: Math.round(xn / 160 * 100) + '%',
      xAide: xn < 90 ? 'Encore un peu : visez environ 120 caractères.' : xn <= 150 ? 'Bonne longueur.' : 'Presque au maximum.',
      tAff: s.t || 'Votre titre', xAff: s.x || 'Votre texte',
      imgUrl: "url('" + G[s.g][0] + "')",
      pubT: ok ? 'Publier' : 'Ajoutez un titre et un texte', pubBg: ok ? '#A6F26B' : '#1B3338', pubFg: ok ? '#0B1A1F' : '#8FA39E',
    }};
  }}
}}"""
    page(name, 'Nouvelle publication', body, js)

publier('Publier.dc.html', ('#A6F26B', '#0B1A1F', 'GM'), 'Grâce Mbuyi', 'Fil-talent.dc.html')
publier('Publier-recruteur.dc.html', ('#F4C463', '#0B1A1F', 'NK'), 'Nadia Kalala', 'Fil-recruteur.dc.html', ent=True)

# ---------------------------------------------------------------- Planche de règles
def static_menu(items, cur, scale=1):
    out = ['<div class="menu" style="position: relative; left: auto; right: auto; bottom: auto; width: 366px;">']
    for k, label in items:
        on = k == cur
        out.append(f'<span class="it" style="background: {"#A6F26B" if on else "#1B3338"}; color: {"#0F3F37" if on else "#C9D6D2"}; padding: 0 {"16px" if on else "12px"};">{svg(k, 22, 2)}'
                   + (f'<span class="lb" style="margin-left: 8px;">{label}</span>' if on else '') + '</span>')
    out.append('</div>')
    return ''.join(out)

def regles():
    rows_t = ''.join(f'<div style="display: flex; align-items: center; gap: 14px; margin-top: 10px;"><span style="width: 92px; font-size: 12.5px; color: #8FA39E;">{l}</span>{static_menu(TALENT, k)}</div>' for k, l in TALENT)
    rows_r = ''.join(f'<div style="display: flex; align-items: center; gap: 14px; margin-top: 10px;"><span style="width: 92px; font-size: 12.5px; color: #8FA39E;">{l}</span>{static_menu(RECRUTEUR, k)}</div>' for k, l in RECRUTEUR)
    rule = lambda n, t, d: f'<div style="display: flex; gap: 12px; padding: 11px 0; border-top: 1px solid rgba(255,255,255,.08);"><span style="width: 26px; height: 26px; border-radius: 50%; background: #1B3338; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none;">{n}</span><span><b style="display: block; font-size: 14.5px; font-weight: 600;">{t}</b><span style="display: block; font-size: 13px; color: #9FB3AE; line-height: 1.5; margin-top: 2px;">{d}</span></span></div>'
    body = f"""<div class="fd" style="width: 1440px; height: 1080px; background: {BG}; padding: 44px 56px; display: flex; flex-direction: column; gap: 22px;">
<div>
<p style="font-size: 13px; font-weight: 700; color: #A6F26B; letter-spacing: .6px;">FIL · TALENTS ET RECRUTEURS</p>
<h1 style="font-size: 34px; font-weight: 700; margin-top: 8px;">Un menu qui montre où l’on est, des publications qui accrochent</h1>
</div>
<div style="display: grid; grid-template-columns: 520px 1fr; gap: 28px; align-items: start;">
<div style="background: #13282C; border-radius: 24px; padding: 22px 22px 20px;">
<h2 style="font-size: 19px; font-weight: 700;">Le menu, onglet par onglet</h2>
<p style="font-size: 13px; color: #9FB3AE; margin-top: 4px; line-height: 1.5;">Talent : Fil, Explorer, Carrière, Hub (ex-Formation), Chat (ex-Messages).</p>
{rows_t}
<p style="font-size: 13px; color: #9FB3AE; margin-top: 18px;">Recruteur : Fil, Offres, Candidatures, Talents, Chat (ex-Messages).</p>
{rows_r}
</div>
<div style="display: flex; flex-direction: column; gap: 18px;">
<div style="background: #13282C; border-radius: 24px; padding: 20px 24px 10px;">
<h2 style="font-size: 19px; font-weight: 700; margin-bottom: 8px;">Le menu</h2>
{rule(1, 'Une pilule flottante, sur fond sombre flouté', 'Elle se détache du contenu qui défile dessous. Les onglets inactifs sont des ronds gris-vert, toujours lisibles.')}
{rule(2, 'L’onglet actif s’allonge en Lime avec son nom', 'Icône et nom en Vert Sapin sur Lime (jamais de blanc sur Lime). Les autres onglets restent des icônes seules.')}
{rule(3, 'Le passage d’un onglet à l’autre se voit', 'La pilule Lime se replie et se déplie sur le nouvel onglet en 0,34 s. Sans animation si le téléphone demande moins de mouvement.')}
{rule(4, 'Les pastilles restent', 'Chats non lus, nouvelles candidatures : la pastille Lime disparaît sur l’onglet actif.')}
</div>
<div style="background: #13282C; border-radius: 24px; padding: 20px 24px 10px;">
<h2 style="font-size: 19px; font-weight: 700; margin-bottom: 8px;">La publication</h2>
{rule(5, 'Titre : 60 caractères au plus, 2 lignes', 'Une phrase d’accroche courte. Conseillé : 30 à 50 caractères. Coupée à 2 lignes s’il le faut.')}
{rule(6, 'Texte : environ 120 caractères, 160 au plus', 'Une jauge aide à viser 120. Titre et texte font 220 caractères au plus, la limite déjà prévue pour le recruteur.')}
{rule(7, 'L’auteur en haut, puis tout s’aligne sur son nom', 'Photo, nom, puis l’heure, la ville ou le métier. Titre, texte et image partent de la ligne du nom.')}
{rule(8, 'L’image en forme Jumanly', 'Coins très arrondis (30 px), encoche en bas à gauche pour J’aime, Commenter, Envoyer, Enregistrer, réactions en bas à droite. Rien d’autre sur l’image.')}
{rule(9, 'Sans image', 'Les actions passent sous le texte. L’image reste conseillée, pas obligatoire.')}
</div>
</div>
</div>
</div>
"""
    page('Main.dc.html', 'Règles du menu et des publications', body, 'class Component extends DCLogic {\n  renderVals() { return {}; }\n}', 1440, 1080)

regles()

# ---------------------------------------------------------------- canvas.json
boards = {
    'Main.dc.html': dict(x=0, y=300, w=1440, h=1080, title='Règles : le menu et la publication', radius=24),
    'Fil-talent.dc.html': dict(x=0, y=1700, w=390, h=844, title='Talent · Fil avec le nouveau menu (touchez les onglets)', is_interactive=True, radius=44),
    'Publier.dc.html': dict(x=470, y=1700, w=390, h=844, title='Talent · Publier : titre, texte, image, aperçu', is_interactive=True, radius=44),
    'Fil-recruteur.dc.html': dict(x=1050, y=1700, w=390, h=844, title='Recruteur · Fil avec le nouveau menu', is_interactive=True, radius=44),
    'Publier-recruteur.dc.html': dict(x=1520, y=1700, w=390, h=844, title='Recruteur · Publier au nom de l’entreprise', is_interactive=True, radius=44),
}
canvas = {
    'v': 3, 'createdOnFiles': {'v': 1, 'at': '2026-10-26T08:32:35Z'},
    'title': 'Jumanly · Fil : menu et publication', 'launch': {'view': 'canvas'}, 'pages': [],
    'boards': boards, 'order': list(boards),
    'notes': {
        's00': dict(x=0, y=0, text='00 · Les règles', kind='title1', maxW=1440),
        's01': dict(x=0, y=1400, text='01 · Talent (à gauche) et recruteur (à droite)', kind='title1', maxW=1910),
    },
    'designSystems': [],
}
json.dump(canvas, open(os.path.join(P, 'canvas.json'), 'w'), ensure_ascii=False, indent=1)
print('ok')
