# Transitions douces Jumanly : à lancer sur chaque page .dc.html après sa génération (idempotent).
# 1. Chaque écran qui apparaît « approche » (léger zoom + fondu partiel sur le même fond Nuit) : jamais de vide.
# 2. Les voiles s'assombrissent en fondu, les feuilles montent.
# 3. La barre du bas peut être masquée (prop coque="true") quand la page vit dans la coque Application.
import re, sys, os

MARQUE = '/* mvt-jumanly 2 */'
ANCIENNE = '/* mvt-jumanly */'
# Les 6 transitions retenues. Une seule animation d'entrée pour chaque écran ; son point de départ
# (variables --mvt-*) dépend de ce qu'on vient de toucher : un retour, une carte, Orbi ou un autre bouton.
# Les variables ne servent que dans « from » : changer leur valeur ne rejoue jamais un écran déjà affiché.
CSS = MARQUE + """
:root{--mvt-o:.4;--mvt-s:.975;--mvt-tx:0px;--mvt-r:150%;--mvt-x:50%;--mvt-y:50%}
[data-ecran]{animation:mvtEcran .34s cubic-bezier(.2,.8,.2,1) both;transform-origin:var(--mvt-x) var(--mvt-y)}
.voile,.shb{animation:mvtVoile .26s ease-out both}
.voile+div,.shb+div,.voile+.feuille,.shb+.shp,[style*="z-index: 10"]>button:first-child+div{animation:mvtMonte .34s cubic-bezier(.2,.8,.2,1) both}
@keyframes mvtEcran{from{opacity:var(--mvt-o);transform:translateX(var(--mvt-tx)) scale(var(--mvt-s));clip-path:circle(var(--mvt-r) at var(--mvt-x) var(--mvt-y))}to{opacity:1;transform:none;clip-path:circle(150% at var(--mvt-x) var(--mvt-y))}}
@keyframes mvtVoile{from{opacity:0}to{opacity:1}}
@keyframes mvtMonte{from{transform:translateY(56px);opacity:.6}to{transform:none;opacity:1}}
@media (prefers-reduced-motion: reduce){[data-ecran],.voile,.shb,.voile+div,.shb+div{animation:none!important}}
/* fin mvt */
"""
# Détection du geste, une fois par page : chevron retour, disque Orbi, grande carte, ou bouton ordinaire.
JS = """    if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__mvtJ) {
      window.__mvtJ = 1;
      const R = document.documentElement.style;
      const pose = (o, s, tx, r) => { R.setProperty('--mvt-o', o); R.setProperty('--mvt-s', s); R.setProperty('--mvt-tx', tx); R.setProperty('--mvt-r', r); };
      document.addEventListener('pointerdown', (e) => {
        const b = e.target && e.target.closest && e.target.closest('button, a, [role="button"]');
        if (!b) return;
        const ec = b.closest('[data-ecran]') || document.body;
        const z = ec.getBoundingClientRect(), k = b.getBoundingClientRect();
        R.setProperty('--mvt-x', Math.round(e.clientX - z.left) + 'px');
        R.setProperty('--mvt-y', Math.round(e.clientY - z.top) + 'px');
        const lab = (b.getAttribute('aria-label') || '') + ' ' + (b.textContent || '').slice(0, 40);
        if (b.querySelector('path[d^="M15 5 8 12"]') || /^\\s*retour/i.test(lab)) pose('.6', '1', '-22px', '150%');
        else if (b.querySelector('circle[fill="#2FD3A6"]') || /orbi/i.test(b.getAttribute('aria-label') || '')) pose('1', '1', '0px', '22px');
        else if (k.height >= 64 && k.width >= 160) pose('.5', '.92', '0px', '150%');
        else pose('.4', '.975', '0px', '150%');
        clearTimeout(window.__mvtT);
        window.__mvtT = setTimeout(() => { pose('.4', '.975', '0px', '150%'); }, 700);
      }, true);
    }
"""
VUE = re.compile(r'(<sc-if value="\{\{[A-Za-z]+\}\}" hint-placeholder-val="\{\{ (?:true|false) \}\}">\s*<div)((?: class="[^"]*")?(?: style="([^"]*)")?)')

def entree_page(s):
    # Page sans vues plein écran (profils) : son contenu défilant fait l’entrée.
    if 'data-ecran=""' not in s and '<div class="scroll" style="position: absolute; inset: 0;' in s:
        s = s.replace('<div class="scroll" style="position: absolute; inset: 0;', '<div class="scroll" data-ecran="" style="position: absolute; inset: 0;', 1)
    return s

def fix(s):
    s = entree_page(s)
    if MARQUE in s:
        return s
    if ANCIENNE in s:
        a = s.index(ANCIENNE)
        b = s.index('animation:none!important}}', a) + len('animation:none!important}}') + 1
        s = s[:a] + CSS + s[b:]
    else:
        i = s.index('</style>')
        s = s[:i] + CSS + s[i:]
    if 'window.__mvtJ' not in s:
        sc = s.index('class Component extends DCLogic')
        m = re.search(r'renderVals\(\)\s*\{\n', s[sc:])
        pos = sc + m.end()
        s = s[:pos] + JS + s[pos:]
    # écrans : un bloc plein écran sous un sc-if de premier niveau (pas les calques de feuilles)
    def mark(m):
        attrs, style = m.group(2), m.group(3) or ''
        plein = 'inset: 0' in style or ' pg' in attrs or '"pg' in attrs
        if not plein or 'z-index' in style:
            return m.group(0)
        return m.group(1) + ' data-ecran=""' + attrs
    s = VUE.sub(mark, s)
    # barre du bas masquable
    a = s.find('<nav aria-label="Navigation principale"')
    if a >= 0 and '{{avecNav}}' not in s:
        b = s.index('</nav>', a) + len('</nav>')
        s = s[:a] + '<sc-if value="{{avecNav}}" hint-placeholder-val="{{ true }}">' + s[a:b] + '</sc-if>' + s[b:]
        sc = s.index('class Component extends DCLogic')
        AV = "!(this.props && (this.props.coque === true || this.props.coque === 'true'))"
        rv = re.search(r'\n(\s*)return vals;', s[sc:])
        if rv:
            pos = sc + rv.start() + 1
            s = s[:pos] + rv.group(1) + 'vals.avecNav = ' + AV + ';\n' + s[pos:]
        else:
            m = list(re.finditer(r'\n(\s*)return \{\n', s[sc:]))[-1]
            pos = sc + m.end()
            s = s[:pos] + m.group(1) + '  avecNav: ' + AV + ',\n' + s[pos:]
    return s

if __name__ == '__main__':
    for f in sys.argv[1:]:
        t = open(f).read()
        u = fix(t)
        if u != t:
            open(f, 'w').write(u)
        print(os.path.basename(f), 'écrans', u.count('data-ecran=""'), 'nav', '{{avecNav}}' in u)
