# Génère canvas/project/Application.dc.html : les 5 onglets restent montés dans une seule coque,
# le nouvel onglet apparaît par-dessus l’ancien (qui reste visible dessous) : aucun écran vide.
import os
D = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(D, 'canvas/project')

J_TRAIT = 'M70 55 V70 A19 19 0 0 1 33.15 76.50'
TYPE_D = open(os.path.join(D, 'logotype_path.txt')).read().strip()
SYMBOLE = ('<svg width="58" height="58" viewBox="0 0 120 120" aria-hidden="true" style="display: block;"><rect width="120" height="120" rx="30" fill="#A6F26B"></rect>'
           f'<g transform="translate(2.25 -4.35) scale(1.1)"><path d="{J_TRAIT}" fill="none" stroke="#0F3F37" stroke-width="17" stroke-linecap="round"></path><circle cx="70" cy="31" r="11.5" fill="#0F3F37"></circle></g></svg>')
LOGOTYPE = (f'<svg width="150" height="{round(150*997/3945,1)}" viewBox="-8 -773 3945 997" aria-label="jumanly" role="img" style="display: block;">'
            f'<path d="{TYPE_D}" fill="#F2EDE5"></path><circle cx="166.5" cy="-687.5" r="89" fill="#A6F26B"></circle></svg>')
# Images des pages profondes (profils, entreprise) : chargées dès l’ouverture, pour qu’aucune image n’arrive en retard
IMAGES = ['/_blob/7a8185bb3611a612aa729be91409f78e', '/_blob/b19fba46d85726a0c5e063a063d71f68', '/_blob/be4ce048ced74d9250b992c526b97346', '/_blob/c98cbb9a256f1018c3f5694dd11b02d5', '/_blob/d159cc907efe9558da98ea05e4859c51', '/_blob/f6752c76c7b089d8d92e5aae07109df8']

ONGLETS = [('fil', 'Fil', 'Fil', 'M4 6h16M4 12h16M4 18h10'),
           ('explorer', 'Offres', 'Explorer', 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM15.5 8.5l-2 5-5 2 2-5z'),
           ('carriere', 'Carriere', 'Carrière', 'M3.5 8.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3.5 12.5h17M12 11.5v2'),
           ('formation', 'Formation', 'Formation', 'M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11.2v4.6c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.6'),
           ('messages', 'Messages', 'Messages', 'M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.5A7.5 7.5 0 1 1 20 11.5z')]

icones_ouv = ''.join(
    f'<span class="ic" style="animation-delay: {0.35 + i * 0.24:.2f}s;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"></path></svg></span>'
    for i, (k, n, t, d) in enumerate(ONGLETS))
OUVERTURE = (
    '<sc-if value="{{ouvVisible}}" hint-placeholder-val="{{ true }}">'
    '<div class="ouv {{ouvClasse}}" role="status" aria-live="polite" aria-label="Jumanly">'
    f'<span style="display: flex; align-items: center; gap: 18px;">{SYMBOLE}{LOGOTYPE}</span>'
    '</div></sc-if>')
PRECHARGE = ('<div aria-hidden="true" style="position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none;">'
             + ''.join(f'<img src="{b}" alt="" loading="eager" decoding="async" width="1" height="1">' for b in IMAGES) + '</div>')

couches = '\n'.join(
    f'<div class="couche {{{{c_{k}}}}}" style="z-index: {{{{z_{k}}}}}; visibility: {{{{v_{k}}}}};" aria-hidden="{{{{h_{k}}}}}">'
    f'<dc-import name="{n}" coque="true" hint-size="390px,844px"></dc-import></div>'
    for k, n, t, d in ONGLETS)

HTML = '''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Jumanly Modèle B · Application</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#050D10}
.co,.co *{box-sizing:border-box}
.co{font-family:"Sora",system-ui,sans-serif;color:#F2EDE5}
.co .couche{position:absolute;inset:0}
.co .couche.entre-d{animation:entreD .32s cubic-bezier(.2,.8,.2,1) both}
.co .couche.entre-g{animation:entreG .32s cubic-bezier(.2,.8,.2,1) both}
.co .couche.sort-d{animation:sortD .32s cubic-bezier(.2,.8,.2,1) both}
.co .couche.sort-g{animation:sortG .32s cubic-bezier(.2,.8,.2,1) both}
@keyframes entreD{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:none}}
@keyframes entreG{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:none}}
@keyframes sortD{to{transform:translateX(-14px)}}
@keyframes sortG{to{transform:translateX(14px)}}
.co nav{position:absolute;left:0;right:0;bottom:0;height:84px;padding:8px 6px 22px;background:rgba(11,26,31,.86);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(255,255,255,.07);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));z-index:20}
.co nav button{font:inherit;background:none;border:0;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.co nav svg{transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.co nav button:active svg{transform:scale(.88)}
.co nav .pt{width:5px;height:5px;border-radius:50%;background:#A6F26B;transition:opacity .2s,transform .25s}
.co .ouv{position:absolute;inset:0;z-index:40;background:#0B1A1F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.co .ouv.part{animation:ouvPart .42s ease-out both;pointer-events:none}
@keyframes ouvPart{from{opacity:1}to{opacity:0;transform:scale(1.03)}}
.co .ouv .barre{width:150px;height:3px;border-radius:2px;background:rgba(242,237,229,.12);margin-top:46px;overflow:hidden}
.co .ouv .barre i{display:block;height:100%;width:100%;background:#A6F26B;border-radius:2px;transform-origin:left;animation:ouvBarre 1.6s cubic-bezier(.4,0,.2,1) both}
@keyframes ouvBarre{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.co .ouv .ics{display:flex;gap:18px;margin-top:22px;color:#8FA39E}
.co .ouv .ic{opacity:.25;animation:ouvIc .3s ease-out both}
@keyframes ouvIc{from{opacity:.25;color:#8FA39E}to{opacity:1;color:#A6F26B}}
.co .ouv .lg{font-size:12.5px;color:#8FA39E;margin-top:14px}
@media (prefers-reduced-motion: reduce){.co .couche,.co .ouv,.co .ouv *{animation:none!important}}
</style>
</helmet>
<div class="co" style="width: 390px; height: 844px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 44px;">
%COUCHES%
%PRECHARGE%
<nav aria-label="Navigation principale">
<sc-for list="{{nav}}" as="n" hint-placeholder-count="5">
<button onClick="{{n.go}}" aria-label="{{n.t}}" aria-current="{{n.cur}}" style="color: {{n.c}};"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{{n.sw}}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{n.d}}"></path></svg><span class="pt" style="opacity: {{n.dot}}; transform: scale({{n.dot}});"></span></button>
</sc-for>
</nav>
%OUVERTURE%
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"ouverture":{"editor":"boolean","default":true},"onglet":{"editor":"enum","options":["fil","explorer","carriere","formation","messages"],"default":"fil"},"$preview":{"width":390,"height":844}}'>
class Component extends DCLogic {
  renderVals() {
    const st = this.state || {};
    const p = this.props || {};
    const O = %ONGLETS%;
    const cles = O.map((o) => o[0]);
    const tab = st.tab ?? (cles.includes(p.onglet) ? p.onglet : 'fil');
    const prev = st.prev ?? null;
    const dir = st.dir || 'd';
    const aller = (k) => () => {
      if (k === tab) return;
      clearTimeout(this._fin);
      this.setState({ prev: tab, tab: k, dir: cles.indexOf(k) > cles.indexOf(tab) ? 'd' : 'g' });
      // l’ancien onglet reste dessous jusqu’à ce que le nouveau le couvre, puis se cache
      this._fin = setTimeout(() => this.setState({ prev: null }), 380);
    };
    // Ouverture : les 5 onglets et leurs images se chargent dessous pendant que le logo s’affiche,
    // puis l’ouverture s’efface sur le Fil déjà prêt. Ensuite, plus aucun chargement entre onglets.
    const avecOuv = !(p.ouverture === false || p.ouverture === 'false');
    const ouv = avecOuv ? (st.ouv || 'la') : 'fini';
    if (ouv === 'la' && !this._ouv) {
      this._ouv = setTimeout(() => {
        this.setState({ ouv: 'part' });
        this._ouv2 = setTimeout(() => this.setState({ ouv: 'fini' }), 440);
      }, 1200);
    }
    const v = { ouvVisible: ouv !== 'fini', ouvClasse: ouv === 'part' ? 'part' : '' };
    cles.forEach((k) => {
      const actif = k === tab, dessous = k === prev;
      v['c_' + k] = actif ? (prev ? 'entre-' + dir : '') : (dessous ? 'sort-' + dir : '');
      v['z_' + k] = actif ? '2' : (dessous ? '1' : '0');
      v['v_' + k] = actif || dessous ? 'visible' : 'hidden';
      v['h_' + k] = actif ? 'false' : 'true';
    });
    v.nav = O.map(([k, , t, d]) => ({ t, d, go: aller(k), cur: k === tab ? 'page' : 'false', c: k === tab ? '#A6F26B' : '#8FA39E', sw: k === tab ? '2.1' : '1.7', dot: k === tab ? '1' : '0' }));
    return v;
  }
}
</script>
</body>
</html>
'''
import json
HTML = HTML.replace('%COUCHES%', couches).replace('%PRECHARGE%', PRECHARGE).replace('%OUVERTURE%', OUVERTURE).replace('%ONGLETS%', json.dumps([[k, n, t, d] for k, n, t, d in ONGLETS], ensure_ascii=False))
open(os.path.join(P, 'Application.dc.html'), 'w').write(HTML)
print('ok')
