# Modèles du lot recruteur 4 (19/10/2026) : e-mails (retenu, non retenu, demande pour rejoindre) et rapport PDF.
# Chaque fonction rend un fragment autonome (styles en ligne ou préfixés), réutilisé dans la planche et dans les fichiers servis.

SAPIN, LIME, CREME, TXT, TXT2 = '#0F3F37', '#A6F26B', '#F2EDE5', '#1A2724', '#5D6B66'
LOGO = (f'<span style="display:inline-flex;align-items:center;gap:8px;font-family:Sora,Arial,sans-serif;font-weight:700;font-size:22px;color:#fff;letter-spacing:-.02em">'
        f'<span style="width:30px;height:30px;border-radius:9px;background:{LIME};color:{SAPIN};display:inline-grid;place-items:center;font-size:17px">J</span>jumanly'
        f'<span style="width:7px;height:7px;border-radius:50%;background:{LIME};margin-left:-6px;margin-top:10px"></span></span>')
ANNEAUX = (f'<svg width="220" height="140" viewBox="0 0 220 140" style="position:absolute;right:-30px;top:-40px" aria-hidden="true"><g fill="none" stroke="{LIME}" stroke-opacity=".35">'
           '<circle cx="150" cy="40" r="34"/><circle cx="150" cy="40" r="62"/><circle cx="150" cy="40" r="92"/></g><circle cx="150" cy="40" r="11" fill="#A6F26B"/></svg>')

def _pied(raison='vous avez postulé sur Jumanly'):
    return (f'<div style="padding:22px 36px 28px;background:{CREME};color:{TXT2};font-size:12px;line-height:1.6">'
            f'<b style="color:{SAPIN}">Jumanly</b> · Learn. Grow. Connect.<br>Une question : <a style="color:{SAPIN}" href="mailto:assistant@jumanly.io">assistant@jumanly.io</a> · <a style="color:{SAPIN}" href="mailto:infojumanly@gmail.com">infojumanly@gmail.com</a><br>'
            f'Vous recevez cet e-mail parce que {raison}. Préférences d’e-mail dans votre compte.<br>Une plateforme développée par The Growth Lab.</div>')

def _cadre(entete, corps, raison='vous avez postulé sur Jumanly'):
    return (f'<div class="mail" style="width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 50px -24px rgba(15,63,55,.35);font-family:Sora,Arial,sans-serif;color:{TXT}">'
            f'{entete}<div style="padding:30px 36px 8px;font-size:14.5px;line-height:1.65">{corps}</div>{_pied(raison)}</div>')

def _entete(titre, sous, badge, badge_bg, badge_c):
    return (f'<div style="position:relative;overflow:hidden;background:{SAPIN};padding:26px 36px 30px">{ANNEAUX}{LOGO}'
            f'<div style="margin-top:26px"><span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 11px;border-radius:99px;background:{badge_bg};color:{badge_c}">{badge}</span></div>'
            f'<div style="margin-top:12px;font-size:26px;font-weight:700;color:#fff;line-height:1.2">{titre}</div><div style="margin-top:6px;font-size:14px;color:#CFE9DF">{sous}</div></div>')

def _offre():
    return (f'<div style="display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:14px;background:{CREME};margin:18px 0">'
            f'<span style="width:44px;height:44px;border-radius:12px;background:{SAPIN};color:{LIME};display:grid;place-items:center;font-weight:700;font-size:13px">BF</span>'
            f'<div style="font-size:13px;color:{TXT2}"><b style="display:block;font-size:15px;color:{TXT}">Analyste de données junior</b>Baobab Fintech · Kinshasa · CDI · Hybride</div></div>')

def _bouton(t):
    return f'<div style="margin:22px 0 26px"><a style="display:inline-block;padding:14px 26px;border-radius:99px;background:{LIME};color:{SAPIN};font-weight:700;font-size:14.5px;text-decoration:none">{t}</a></div>'

def _etapes(lignes):
    li = ''.join(f'<div style="display:flex;gap:12px;align-items:flex-start;margin:10px 0"><span style="flex:none;width:26px;height:26px;border-radius:50%;background:{c};color:{SAPIN};display:grid;place-items:center;font-size:12px;font-weight:700">{n}</span><div><b>{t}</b><br><span style="color:{TXT2};font-size:13.5px">{s}</span></div></div>' for n, c, t, s in lignes)
    return f'<div style="padding:6px 0">{li}</div>'

def mail_retenu():
    corps = ('<p style="margin:0 0 14px">Bonjour Grâce,</p>'
             '<p style="margin:0 0 14px">Merci pour votre candidature au poste d’<b>Analyste de données junior</b>. Nous avons lu votre dossier avec attention, et votre projet de tableau de bord Power BI pour trois agences a particulièrement retenu notre attention.</p>'
             '<p style="margin:0 0 14px">Nous avons le plaisir de vous inviter à un entretien. Il durera environ 45 minutes, en visio, avec Nadia Kabeya (Responsable recrutement) et Olivier B. (Analyste de données).</p>'
             + _offre() +
             '<p style="margin:0 0 6px"><b>Les prochaines étapes</b></p>'
             + _etapes([('1', LIME, 'Choisissez un créneau', 'Mardi 22 octobre à 10:00 ou à 14:30 (heure de Kinshasa).'), ('2', '#C8F0E2', 'Recevez le lien de visio', 'Il vous est envoyé dès votre confirmation.'), ('3', '#FBE3B0', 'Préparez-vous', 'Nous parlerons de vos projets, de SQL et de Power BI. Aucun test technique n’est prévu.')]) +
             _bouton('Choisir mon créneau') +
             '<p style="margin:0 0 14px">Si aucun créneau ne vous convient, répondez simplement depuis Jumanly : nous trouverons une autre date ensemble.</p>'
             '<p style="margin:0 0 22px">À très bientôt,<br><b>Nadia Kabeya</b><br><span style="color:#5D6B66">Responsable recrutement · Baobab Fintech</span></p>')
    return _cadre(_entete('Vous êtes invitée à un entretien', 'Analyste de données junior · Baobab Fintech', 'Candidature retenue', LIME, SAPIN), corps)

def mail_refus():
    corps = ('<p style="margin:0 0 14px">Bonjour Joël,</p>'
             '<p style="margin:0 0 14px">Merci pour l’intérêt que vous portez à Baobab Fintech et pour le temps consacré à votre candidature au poste de <b>Chargé de clientèle</b>.</p>'
             '<p style="margin:0 0 14px">Après avoir étudié l’ensemble des dossiers, nous avons retenu d’autres profils pour la suite de ce recrutement. Cette décision a été prise par notre équipe, poste par poste ; elle ne remet pas en cause la qualité de votre parcours.</p>'
             f'<div style="padding:16px 18px;border-radius:14px;background:{CREME};margin:18px 0"><b style="color:{SAPIN}">Ce que vous pouvez faire maintenant</b>'
             + _etapes([('1', LIME, 'Gardez votre profil visible', 'Les recruteurs peuvent vous proposer une offre directement.'), ('2', '#C8F0E2', 'Découvrez les offres proches', '12 offres de relation client sont ouvertes à Kinshasa.'), ('3', '#FBE3B0', 'Renforcez une compétence', 'Les formations Jumanly délivrent une attestation vérifiable.')]) + '</div>'
             + _bouton('Voir les offres proches') +
             '<p style="margin:0 0 14px">Nous conservons votre candidature et pourrons revenir vers vous si un poste correspondant s’ouvre, avec votre accord.</p>'
             '<p style="margin:0 0 22px">Avec nos remerciements et tous nos vœux de réussite,<br><b>Nadia Kabeya</b><br><span style="color:#5D6B66">Responsable recrutement · Baobab Fintech</span></p>')
    return _cadre(_entete('Merci pour votre candidature', 'Chargé de clientèle · Baobab Fintech', 'Réponse à votre candidature', '#E8E2D8', SAPIN), corps)

def mail_admin():
    corps = ('<p style="margin:0 0 14px">Bonjour Nadia,</p>'
             '<p style="margin:0 0 14px"><b>Merveille Tshala</b> souhaite rejoindre l’espace recruteur de <b>Baobab Fintech</b> sur Jumanly.</p>'
             f'<div style="display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:14px;background:{CREME};margin:18px 0">'
             f'<span style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#D4FA9E,#A6F26B 48%,#5FE0B8);color:{SAPIN};display:grid;place-items:center;font-weight:700">MT</span>'
             f'<div style="font-size:13px;color:{TXT2}"><b style="display:block;font-size:15px;color:{TXT}">Merveille Tshala</b>Chargée RH · m.tshala@baobab-fintech.example<br>E-mail sur le domaine de l’organisation : confirmé</div></div>'
             '<p style="margin:0 0 6px"><b>Si vous acceptez</b></p>'
             + _etapes([('1', LIME, 'Choisissez son rôle', 'Recruteur par défaut. Admin ou Lecteur possibles.'), ('2', '#C8F0E2', 'Un siège est utilisé', 'Sièges : 2 sur 3 après acceptation.'), ('3', '#FBE3B0', 'Elle est prévenue', 'Elle accède aux offres selon son rôle.')]) +
             '<div style="display:flex;gap:10px;margin:22px 0 26px">'
             f'<a style="padding:14px 24px;border-radius:99px;background:{LIME};color:{SAPIN};font-weight:700;font-size:14.5px;text-decoration:none">Examiner la demande</a>'
             f'<a style="padding:14px 22px;border-radius:99px;background:#fff;border:1.5px solid #D8D2C7;color:{SAPIN};font-weight:600;font-size:14.5px;text-decoration:none">Ce n’est pas une collègue</a></div>'
             '<p style="margin:0 0 22px;color:#5D6B66;font-size:13px">Sans réponse sous 7 jours, la demande expire. Personne n’accède à votre organisation sans votre accord.</p>')
    return _cadre(_entete('Une collègue demande à rejoindre votre organisation', 'Baobab Fintech · espace recruteur', 'Action demandée', '#FBE3B0', SAPIN), corps, 'vous êtes admin principale de Baobab Fintech sur Jumanly')

# ---------- Rapport PDF (A4, 794 × 1123 px à 96 dpi) ----------
RCSS = '''
.rp-p{width:794px;height:1123px;background:#fff;position:relative;overflow:hidden;font-family:Sora,Arial,sans-serif;color:#1A2724;box-shadow:0 30px 60px -30px rgba(15,63,55,.45);page-break-after:always}
.rp-h{position:relative;overflow:hidden;background:#0F3F37;color:#fff;padding:38px 48px 40px}
.rp-h .k{display:inline-block;margin-top:34px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0F3F37;background:#A6F26B;padding:5px 12px;border-radius:99px}
.rp-h h1{margin:14px 0 6px;font-size:34px;line-height:1.1;letter-spacing:-.02em}
.rp-h p{margin:0;color:#CFE9DF;font-size:14px}
.rp-b{padding:30px 48px}
.rp-t{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5D6B66;margin:0 0 12px;display:flex;align-items:center;gap:10px}
.rp-t:after{content:"";flex:1;height:1px;background:#E5E0D7}
.rp-k{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.rp-k div{border-radius:16px;padding:16px;background:#F7F5F1;font-size:12px;color:#5D6B66}
.rp-k div:nth-child(1){background:#EEF8E4}.rp-k div:nth-child(2){background:#E3F7F0}.rp-k div:nth-child(3){background:#FEF4DE}.rp-k div:nth-child(4){background:#EEF3FB}
.rp-k b{display:block;font-size:30px;color:#0F3F37;letter-spacing:-.02em}
.rp-k em{font-style:normal;font-size:11px;color:#2E8540;font-weight:700}
.rp-g{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-bottom:28px}
.rp-c{border:1px solid #E5E0D7;border-radius:16px;padding:18px}
.rp-c h3{margin:0 0 12px;font-size:14px;color:#0F3F37}
.rp-f div{display:flex;align-items:center;gap:10px;font-size:12px;margin:8px 0}.rp-f span{width:110px}.rp-f i{flex:1;height:12px;border-radius:9px;background:#EFEBE4;overflow:hidden}.rp-f i b{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#A6F26B,#2FD3A6)}.rp-f strong{width:40px;text-align:right;white-space:nowrap}
.rp-w{display:flex;align-items:flex-end;gap:12px;height:130px;padding-top:6px}
.rp-w div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%;font-size:11px;color:#5D6B66}
.rp-w i{width:100%;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,#A6F26B,#2FD3A6)}.rp-w div:last-child i{background:#0F3F37}
.rp-tb{width:100%;border-collapse:collapse;font-size:12px}
.rp-tb th{text-align:left;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#5D6B66;padding:8px 6px;border-bottom:2px solid #A6F26B}
.rp-tb td{padding:10px 6px;border-bottom:1px solid #EFEBE4}
.rp-tb td.n{text-align:right;font-weight:700}
.rp-tb .dot{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px;vertical-align:-1px}
.rp-n{display:flex;gap:14px;align-items:flex-start;padding:16px 18px;border-radius:16px;background:linear-gradient(140deg,#F2FCE6,#DDF6EE);font-size:12.5px;line-height:1.55}
.rp-n .o{flex:none;width:34px;height:34px;border-radius:50%;background:#0F3F37;display:grid;place-items:center}
.rp-n .o i{width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px #0F3F37,0 0 0 6px #A6F26B}
.rp-pied{position:absolute;left:48px;right:48px;bottom:26px;display:flex;justify-content:space-between;font-size:10.5px;color:#8A948F;border-top:1px solid #E5E0D7;padding-top:10px}
.rp-pied b{color:#0F3F37}
.rp-mini{display:flex;align-items:center;justify-content:space-between;padding:22px 48px;background:#0F3F37;color:#fff}
.rp-mini span{font-size:12px;color:#CFE9DF}
'''

def _pied_rp(n):
    return f'<div class="rp-pied"><span><b>Jumanly Hire</b> · Rapport généré le 31 octobre 2026 · chiffres réels, aucune donnée personnelle</span><span>Page {n} sur 2</span></div>'

def rapport_p1():
    return f'''<div class="rp-p"><div class="rp-h">{ANNEAUX.replace('width="220" height="140"','width="420" height="260"').replace('right:-30px;top:-40px','right:-90px;top:-70px')}{LOGO}
<span class="k">Rapport de recrutement</span><h1>Baobab Fintech<br>Octobre 2026</h1><p>Du 1er au 31 octobre · 4 offres actives · préparé pour l’équipe recrutement</p></div>
<div class="rp-b"><div class="rp-t">L’essentiel</div>
<div class="rp-k"><div><b>35</b>candidatures reçues<br><em>+ 40 % sur septembre</em></div><div><b>3 j</b>délai moyen de première réponse</div><div><b>5</b>entretiens réalisés</div><div><b>1</b>recrutement conclu</div></div>
<div class="rp-g"><div class="rp-c"><h3>Où en sont les candidatures</h3><div class="rp-f">
<div><span>Reçues</span><i><b style="width:100%"></b></i><strong>35</strong></div><div><span>Examinées</span><i><b style="width:74%"></b></i><strong>26</strong></div><div><span>Présélectionnées</span><i><b style="width:23%"></b></i><strong>8</strong></div><div><span>Entretien</span><i><b style="width:14%"></b></i><strong>5</strong></div><div><span>Recrutées</span><i><b style="width:3%"></b></i><strong>1</strong></div></div></div>
<div class="rp-c"><h3>Candidatures par semaine</h3><div class="rp-w"><div><i style="height:40%"></i>S1</div><div><i style="height:62%"></i>S2</div><div><i style="height:48%"></i>S3</div><div><i style="height:92%"></i>S4</div></div></div></div>
<div class="rp-t">Par offre</div>
<table class="rp-tb"><tr><th>Offre</th><th>Statut</th><th style="text-align:right">Vues</th><th style="text-align:right">Candidatures</th><th style="text-align:right">Entretiens</th><th style="text-align:right">Délai</th></tr>
<tr><td><span class="dot" style="background:#A6F26B"></span>Analyste de données junior</td><td>Publiée</td><td class="n">1 240</td><td class="n">24</td><td class="n">2</td><td class="n">2 j</td></tr>
<tr><td><span class="dot" style="background:#2FD3A6"></span>Chargé de clientèle</td><td>Publiée</td><td class="n">610</td><td class="n">11</td><td class="n">1</td><td class="n">3 j</td></tr>
<tr><td><span class="dot" style="background:#F5B83D"></span>Comptable confirmé</td><td>Publiée</td><td class="n">380</td><td class="n">7</td><td class="n">0</td><td class="n">4 j</td></tr>
<tr><td><span class="dot" style="background:#9DB8E8"></span>Responsable conformité</td><td>En validation</td><td class="n">—</td><td class="n">—</td><td class="n">—</td><td class="n">—</td></tr></table>
</div>{_pied_rp(1)}</div>'''

def rapport_p2():
    return f'''<div class="rp-p"><div class="rp-mini">{LOGO}<span>Baobab Fintech · octobre 2026</span></div>
<div class="rp-b"><div class="rp-t">D’où viennent les candidatures</div>
<div class="rp-g"><div class="rp-c"><h3>Sources</h3><div style="display:flex;height:16px;border-radius:99px;overflow:hidden;margin:6px 0 14px"><i style="width:60%;background:#2FD3A6"></i><i style="width:26%;background:#A6F26B"></i><i style="width:14%;background:#F5B83D"></i></div>
<div class="rp-f"><div><span>Offres Jumanly</span><strong style="width:auto">21</strong></div><div><span>Lien partagé</span><strong style="width:auto">9</strong></div><div><span>Offre proposée</span><strong style="width:auto">5</strong></div></div></div>
<div class="rp-c"><h3>Délais de réponse</h3><div class="rp-f"><div><span>Sous 48 h</span><i><b style="width:62%"></b></i><strong>62 %</strong></div><div><span>3 à 7 jours</span><i><b style="width:30%"></b></i><strong>30 %</strong></div><div><span>Plus de 7 jours</span><i><b style="width:8%;background:#F5B83D"></b></i><strong>8 %</strong></div></div></div></div>
<div class="rp-t">Entretiens et décisions</div>
<div class="rp-k"><div><b>5</b>entretiens<br><em>4 en visio, 1 sur site</em></div><div><b>4,2</b>note moyenne des grilles</div><div><b>1</b>retenue</div><div><b>19</b>réponses envoyées aux non retenus</div></div>
<div class="rp-t">Orbi ce mois-ci</div>
<div class="rp-k" style="grid-template-columns:repeat(3,1fr)"><div><b>24</b>CV analysés</div><div><b>11</b>messages rédigés puis relus</div><div><b>36</b>crédits utilisés sur 100</div></div>
<div class="rp-n"><span class="o"><i></i></span><div><b>Lecture d’Orbi</b><br>Le partage du lien de l’offre « Analyste de données junior » en semaine 4 a presque doublé les candidatures. Les offres sans salaire indiqué reçoivent moins de candidatures : pensez à ajouter une fourchette. Ces constats décrivent vos chiffres ; ils ne classent aucune personne.</div></div>
</div>{_pied_rp(2)}</div>'''

def doc(titre, corps, css=''):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>{titre}</title>'
            '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet">'
            f'<style>body{{margin:0;background:#F2EDE5;display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px}}@page{{size:A4;margin:0}}@media print{{body{{padding:0;gap:0;background:#fff}}.rp-p{{box-shadow:none}}}}{css}</style></head><body>{corps}</body></html>')
