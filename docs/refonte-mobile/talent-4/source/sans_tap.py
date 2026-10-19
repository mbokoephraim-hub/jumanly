# Retire les pastilles « où l'on appuie » et les numéros qui y renvoient (demande d'Ephraïm, 19/10/2026).
import re
def sans_tap(html):
    html = re.sub(r' data-n="\d+"', '', html)
    html = re.sub(r'(class="[^"]*?)\s*\btap\b', r'\1', html)
    html = re.sub(r'<div class="legende">.*?</div>', '', html, flags=re.S)
    html = re.sub(r'<span class="n">\d+</span>', '', html)
    html = html.replace('Chaque écran porte des pastilles numérotées sur l’élément où l’on appuie. Voici les chemins.', 'Pour chaque écran, le chemin depuis la barre ou le compte.')
    def cap(m):
        k = [0]
        def r(_):
            k[0] += 1
            return '' if k[0] == 1 else ', '
        t = re.sub(r'(?:[①-⑳㉑-㉟]|\b2[12] ·)\s*', r, m.group(1))
        t = re.sub(r'\.?\s*,', ',', t)
        return f'<figcaption><b>{m.group(0).split("<b>")[1].split("</b>")[0]}</b><br><span>{t[:1].upper() + t[1:]}</span></figcaption>'
    html = re.sub(r'<figcaption><b>[^<]*</b><br><span>(.*?)</span></figcaption>', cap, html, flags=re.S)
    return html
