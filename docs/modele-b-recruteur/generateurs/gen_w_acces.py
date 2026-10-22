# Canvas web : site public (recruteurs, tarifs), ouverture, connexion et les deux parcours d’inscription, sur ordinateur (1440 × 900).
import os, json as _j
from rkit import *
from r_web_pil_tpl import SW, PILLX
PW = os.path.join(D, 'w/canvas/project'); os.makedirs(PW, exist_ok=True)
ic = lambda k, s=20, sw='1.8': ico(I[k], s, sw)
CHEV = ico(I['chev'], 16, '2', '#8FA39E')
IF = lambda c, inner, d='false': f'<sc-if value="{{{{{c}}}}}" hint-placeholder-val="{{{{ {d} }}}}">{inner}</sc-if>'
B = lambda h, t, cls='btn2', st='': f'<button onClick="{{{{{h}}}}}" class="{cls}" style="{st}">{t}</button>'
A = lambda href, t, cls='btn', st='': f'<a href="{href}" class="{cls}" style="{st}">{t}</a>'
SWV = lambda h, o, lab: (f'<button onClick="{{{{{h}}}}}" role="switch" aria-checked="{{{{{o}.etat}}}}" aria-label="{lab}" class="sw" style="background: {{{{{o}.fond}}}};"><span style="transform: translateX({{{{{o}.x}}}});"></span></button>')
INP = lambda v, h, lab, typ='text', ph='': f'<input class="in" type="{typ}" value="{{{{{v}}}}}" onChange="{{{{{h}}}}}" aria-label="{lab}" placeholder="{ph or lab}">'
LAB = lambda t: f'<span class="lab">{t}</span>'
LOGO = '<span style="display: flex; align-items: center; gap: 6px; font-size: 26px; font-weight: 800; letter-spacing: -.5px; color: #F2EDE5;">jumanly<i style="width: 9px; height: 9px; border-radius: 50%; background: #A6F26B; display: block; margin-top: 11px;"></i></span>'
G = lambda k: {'google': '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4285F4"></path><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853"></path><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" fill="#FBBC05"></path><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z" fill="#EA4335"></path></svg>',
             'apple': '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.8A4.8 4.8 0 0 0 4 9.4c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.1-1.2 2.9-2.4a10 10 0 0 0 1.3-2.7 4.2 4.2 0 0 1-2.4-3.9zM14 5.3a4.4 4.4 0 0 0 1-3.3 4.5 4.5 0 0 0-3 1.5 4.2 4.2 0 0 0-1 3.2A3.7 3.7 0 0 0 14 5.3z" fill="#F2EDE5"></path></svg>',
             'linkedin': '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="4" fill="#0A66C2"></rect><path d="M7 10h2.5v7.5H7zM8.2 6.2a1.4 1.4 0 1 1 0 2.9 1.4 1.4 0 0 1 0-2.9zM11 10h2.4v1c.4-.7 1.3-1.2 2.4-1.2 2.4 0 2.9 1.5 2.9 3.6v4.1h-2.5v-3.6c0-.9 0-2-1.2-2s-1.5 1-1.5 2v3.6H11z" fill="#FFFFFF"></path></svg>'}[k]
FOURN = ''.join(f'<button onClick="{{{{fournisseur}}}}" class="btn2" style="flex: 1; justify-content: center; height: 50px;">{G(k)}{t}</button>' for k, t in [('google', 'Google'), ('apple', 'Apple'), ('linkedin', 'LinkedIn')])

ACSS = '''
.fd .btn{height:50px;padding:0 22px;border-radius:25px;background:#A6F26B;color:#0B1A1F;font-size:15px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;text-align:center}
.fd .btn2{height:50px;padding:0 20px;border-radius:25px;border:1px solid rgba(255,255,255,.2);color:#F2EDE5;font-size:14.5px;font-weight:600;display:inline-flex;align-items:center;gap:10px;white-space:nowrap;text-align:center}
.fd .sw{width:50px;height:30px;border-radius:15px;padding:3px;flex:none}.fd .sw span{display:block;width:24px;height:24px;border-radius:50%;background:#0B1A1F;transition:transform .2s}
.fd .gauche{width:620px;flex:none;position:relative;overflow:hidden;background:#09161A;border-right:1px solid rgba(255,255,255,.06)}
.fd .droiteA{flex:1;min-width:0;overflow-y:auto;display:flex;justify-content:center;padding:56px 40px 60px;scrollbar-width:none}.fd .droiteA::-webkit-scrollbar{display:none}
.fd .form{width:460px}
.fd .orb{position:absolute;border-radius:50%;border:1px dashed rgba(166,242,107,.22)}
.fd .rot{animation:rot 40s linear infinite}.fd .rot2{animation:rot 60s linear infinite reverse}
.fd .rot .av,.fd .rot2 .av{animation:rot 40s linear infinite reverse}
@keyframes rot{to{transform:rotate(360deg)}}
.fd .flot{position:absolute;background:#13282C;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:12px 14px;box-shadow:0 20px 40px -18px rgba(0,0,0,.8);animation:flot 6s ease-in-out infinite}
@keyframes flot{50%{transform:translateY(-8px)}}
.fd .opt2{display:flex;align-items:center;gap:14px;width:100%;padding:16px 18px;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:#13282C}
.fd .opt2:hover{border-color:rgba(166,242,107,.6)}
.fd .pulse{animation:pulse 1.2s ease-in-out infinite}@keyframes pulse{50%{transform:scale(1.35)}}
.fd .entree{animation:entree 1.1s cubic-bezier(.2,.8,.2,1) both}@keyframes entree{from{opacity:0;transform:scale(.86)}}
.fd .spin{animation:rot 1s linear infinite}
@media (prefers-reduced-motion: reduce){.fd .rot,.fd .rot2,.fd .rot .av,.fd .rot2 .av,.fd .flot,.fd .pulse,.fd .entree,.fd .spin{animation:none}}
'''

# ---------- Colonne de gauche : scène (accès) ou aperçu (profil, entreprise) ----------
AVS = [('GM', '#DDF6EE', '#14745F'), ('BT', '#F9E3C8', '#8A4B12'), ('EK', '#FBE3EF', '#8A2D5C'), ('MD', '#E3E8FB', '#2D3F8A'), ('NI', '#E8F0D8', '#4F6B12'), ('RK', '#EDE3FB', '#5A2D8A')]
def orbite(r, items, cls):
    h = f'<div class="{cls}" style="position: absolute; left: 50%; top: 50%; width: {2*r}px; height: {2*r}px; margin: -{r}px 0 0 -{r}px;"><span class="orb" style="inset: 0;"></span>'
    import math
    for i, (t, bg, fg) in enumerate(items):
        a = 2 * math.pi * i / len(items)
        x, y = r + r * math.cos(a) - 24, r + r * math.sin(a) - 24
        h += f'<span class="av" style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; width: 48px; height: 48px; font-size: 14px; background: {bg}; color: {fg}; border: 3px solid #09161A;">{t}</span>'
    return h + '</div>'
SCENE = ('<div style="position: absolute; inset: 0;">' + orbite(170, AVS[:3], 'rot') + orbite(260, AVS[3:], 'rot2')
  + '<div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center;"><span class="mini" style="width: 92px; height: 92px; border-radius: 28px; background: #0F3F37; margin: 0 auto; font-size: 34px; font-weight: 800; color: #F2EDE5;">j<i style="width: 10px; height: 10px; border-radius: 50%; background: #A6F26B; display: block; margin: 18px 0 0 2px;"></i></span></div>'
  + '<div class="flot" style="left: 60px; top: 150px; width: 230px;"><span style="display: flex; align-items: center; gap: 10px;"><span class="av" style="width: 36px; height: 36px; font-size: 12px; background: #DDF6EE; color: #14745F;">GM</span><span style="flex: 1;"><b style="display: block; font-size: 13px;">Grâce Mbuyi</b><span class="meta" style="font-size: 11px;">Analyste de données</span></span><span class="sc" style="background: #A6F26B; color: #0B1A1F; font-size: 11.5px; font-weight: 800; padding: 3px 7px; border-radius: 8px;">93 %</span></span><span style="display: block; font-size: 11.5px; color: #5FE0B8; font-weight: 700; margin-top: 8px;">Pourquoi ? 8 critères, rien de personnel</span></div>'
  + '<div class="flot" style="right: 50px; top: 300px; animation-delay: -2s;"><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700;">' + ic('cal', 18) + 'Entretien · vendredi 10 h</span></div>'
  + '<div class="flot" style="left: 90px; bottom: 170px; animation-delay: -4s;"><span style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700;">' + ico(I['check'], 18, '2.6', '#A6F26B') + 'Chaque candidat reçoit une réponse</span></div>'
  + '<div style="position: absolute; left: 56px; right: 56px; bottom: 56px;"><p style="font-size: 30px; font-weight: 700; line-height: 1.2; letter-spacing: -.02em;">{{accroche}}</p><p class="meta" style="margin-top: 12px; font-size: 14px;">Learn. Grow. Connect.</p></div></div>')
PREV_R = ('<div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 0 70px;"><p class="meta" style="font-weight: 700; margin-bottom: 14px;">Aperçu de votre profil recruteur</p>'
  '<div class="carte" style="padding: 24px; border-radius: 26px;"><div style="display: flex; align-items: center; gap: 16px;">'
  + IF('aPhoto', '<span style="width: 76px; height: 76px; border-radius: 50%; overflow: hidden; display: block; flex: none;">' + PORTRAIT(76) + '</span>') + IF('sansPhoto', '<span class="av" style="width: 76px; height: 76px; font-size: 24px;">{{ini}}</span>', 'true')
  + '<span style="flex: 1; min-width: 0;"><b style="display: block; font-size: 20px;">{{f.nom}}</b><span class="meta">{{posteT}}</span></span></div>'
  '<div style="display: flex; align-items: center; gap: 12px; margin-top: 18px; padding: 12px 14px; border-radius: 16px; background: #0F2226;">'
  + IF('logoOk', '<span class="mini" style="width: 40px; height: 40px; background: #14745F; font-size: 12px;">BF</span>') + IF('logoAttente', '<span class="mini" style="width: 40px; height: 40px; background: transparent; border: 1.5px dashed rgba(255,255,255,.3); color: #8FA39E; font-size: 12px;">?</span>', 'true')
  + '<span style="flex: 1;"><b style="display: block; font-size: 14px;">{{entT}}</b>' + IF('logoAttente', '<span class="meta" style="font-size: 12px;">Logo affiché dès que l’administrateur valide</span>', 'true') + IF('logoOk', '<span style="font-size: 12px; color: #A6F26B; font-weight: 700;">Rattachement validé par Joseph Ilunga</span>') + '</span></div>'
  '<p class="meta" style="margin-top: 14px;">{{f.ville}} · {{paysT}}</p><div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px;"><sc-for list="{{metiersT}}" as="m" hint-placeholder-count="2"><span class="tag">{{m.t}}</span></sc-for></div>'
  '<p style="font-size: 14px; line-height: 1.55; margin-top: 14px; color: #C9D6D2;">{{accrocheA}}</p></div></div>')
PREV_A = ('<div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 0 60px;"><p class="meta" style="font-weight: 700; margin-bottom: 14px;">Aperçu de la page entreprise</p>'
  '<div class="carte" style="padding: 0; overflow: hidden; border-radius: 26px;"><div style="height: 130px; background: {{bannFond}};"></div><div style="padding: 0 22px 22px;"><div style="display: flex; align-items: flex-end; gap: 14px; margin-top: -36px;">'
  + IF('aLogo', '<span style="width: 78px; height: 78px; border-radius: 22px; background: #14745F; border: 4px solid #13282C; color: #FFFFFF; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span>')
  + IF('sansLogo', '<span style="width: 78px; height: 78px; border-radius: 22px; background: #13282C; border: 2px dashed rgba(255,255,255,.3); color: #8FA39E; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{orgIni}}</span>', 'true')
  + '</div><b style="display: block; font-size: 21px; margin-top: 12px;">{{f.org}}</b><p class="meta" style="margin-top: 2px;">{{secteurT}} · {{f.ville}} · {{tailleT}}</p><p style="font-size: 13.5px; line-height: 1.5; margin-top: 12px; color: #C9D6D2;">{{f.apropos}}</p>'
  '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px;"><span class="tag">{{verifT}}</span><span class="tag" style="background: rgba(166,242,107,.14); color: #DFF7C6;">Formule {{planT}}</span><span class="tag">{{nInv}} invitations</span></div></div></div></div>')
GAUCHE = ('<div class="gauche"><div style="position: absolute; left: 48px; top: 40px; z-index: 2;">' + LOGO + '</div>' + IF('scene', SCENE, 'true') + IF('prevR', PREV_R) + IF('prevA', PREV_A) + '</div>')

# ---------- Formulaires ----------
ENTETE = (IF('etapeAff', '<div><div style="display: flex; align-items: center; gap: 12px;"><button onClick="{{precedent}}" class="rond" aria-label="Retour" style="width: 40px; height: 40px; background: #13282C;">' + ic('retour', 18, '2') + '</button><span class="meta" style="font-weight: 700;">{{etapeT}}</span></div><span class="barre" style="margin-top: 14px;"><i style="width: {{pct}};"></i></span>'
  '<h1 style="font-size: 30px; margin-top: 28px; letter-spacing: -.02em;">{{titre}}</h1><p class="meta" style="font-size: 14.5px; margin-top: 6px;">{{sous}}</p></div>'))
SUITE = '<div style="display: flex; gap: 10px; margin-top: 30px;">' + B('suivant', '{{suivT}}', 'btn', 'flex: 1;') + '</div>'
F_CONNEXION = IF('eConnexion', '<div><h1 style="font-size: 32px; letter-spacing: -.02em;">Se connecter</h1><p class="meta" style="font-size: 14.5px; margin-top: 6px;">Espace recruteur et entreprise</p>'
  '<div style="display: flex; gap: 10px; margin-top: 28px;">' + FOURN + '</div><div style="display: flex; align-items: center; gap: 12px; margin: 22px 0 4px;"><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span><span class="meta">ou</span><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span></div>'
  + LAB('E-mail professionnel') + INP('cMail', 'ecrireCmail', 'E-mail professionnel', 'email') + LAB('Mot de passe') + '<input class="in" type="password" value="motdepasse" aria-label="Mot de passe" readonly>'
  + '<button onClick="{{goOubli}}" style="display: block; margin-top: 12px; font-size: 13.5px; font-weight: 700; color: #A6F26B; min-height: 32px;">Mot de passe oublié ?</button>'
  + A('{{entrerHref}}', 'Se connecter', 'btn', 'width: 100%; margin-top: 18px;')
  + '<p class="meta" style="font-size: 12.5px; margin-top: 10px; text-align: center;">Écrivez joseph.ilunga@… pour entrer comme administrateur.</p>'
  + '<p style="text-align: center; margin-top: 26px; font-size: 14px;">Pas encore de compte ? <button onClick="{{goProfil}}" style="font-weight: 700; color: #A6F26B;">Créer un compte</button></p></div>', 'true')
F_OUBLI = IF('eOubli', '<div><button onClick="{{goConnexion}}" class="rond" aria-label="Retour" style="width: 40px; height: 40px; background: #13282C;">' + ic('retour', 18, '2') + '</button><h1 style="font-size: 30px; margin-top: 24px;">Mot de passe oublié</h1>'
  + IF('pasEnvoye', '<div><p class="meta" style="font-size: 14.5px; margin-top: 6px;">Recevez un lien pour en choisir un nouveau.</p>' + LAB('E-mail professionnel') + INP('cMail', 'ecrireCmail', 'E-mail professionnel', 'email') + B('envoyerLien', 'Envoyer le lien', 'btn', 'width: 100%; margin-top: 22px;') + '</div>', 'true')
  + IF('envoye', '<div style="margin-top: 22px; padding: 20px; border-radius: 20px; background: #13282C;">' + ico(I['check'], 28, '2.6', '#A6F26B') + '<b style="display: block; font-size: 17px; margin-top: 10px;">Lien envoyé à {{cMail}}</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">Il est valable une heure. Pensez à regarder dans les courriers indésirables.</p>' + B('goConnexion', 'Retour à la connexion', 'btn2', 'margin-top: 16px;') + '</div>') + '</div>')
OPT = lambda h, ic_, t, s: f'<button onClick="{{{{{h}}}}}" class="opt2"><span class="rond" style="width: 48px; height: 48px; background: #1B3338; color: #A6F26B;">{ic(ic_, 22)}</span><span style="flex: 1;"><b style="display: block; font-size: 16px;">{t}</b><span class="meta" style="font-size: 13px;">{s}</span></span>{CHEV}</button>'
F_PROFIL = IF('eProfil', '<div><button onClick="{{goConnexion}}" class="rond" aria-label="Retour" style="width: 40px; height: 40px; background: #13282C;">' + ic('retour', 18, '2') + '</button><h1 style="font-size: 30px; margin-top: 24px;">Vous êtes…</h1><p class="meta" style="font-size: 14.5px; margin-top: 6px;">Un compte personnel, puis l’espace qui vous correspond</p>'
  '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 24px;">' + OPT('choixR', 'candidatures', 'Recruteur ou consultant RH', 'Je rejoins l’équipe de mon entreprise, ou je recrute seul·e') + OPT('choixA', 'bat', 'Entreprise', 'Je crée l’espace de mon entreprise et j’invite mon équipe')
  + OPT('choixTalent', 'talents', 'Talent', 'Je cherche un emploi ou je me forme') + OPT('choixP', 'equipe', 'Institution partenaire', 'Banque, université, fondation, ONG') + '</div></div>')
F_COMPTE = IF('eRcompte', '<div>' + '<div style="display: flex; gap: 10px; margin-top: 26px;">' + FOURN + '</div><div style="display: flex; align-items: center; gap: 12px; margin: 22px 0 0;"><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span><span class="meta">ou avec votre e-mail</span><span style="flex: 1; height: 1px; background: rgba(255,255,255,.1);"></span></div>'
  + LAB('Prénom et nom') + INP('f.nom', 'eNom', 'Prénom et nom') + IF('eAcompte', '<div>' + LAB('Nom de l’entreprise') + INP('f.org', 'eOrg', 'Nom de l’entreprise') + '</div>') + LAB('E-mail professionnel') + INP('f.mail', 'eMail', 'E-mail professionnel', 'email') + LAB('Mot de passe') + INP('f.mdp', 'eMdp', 'Mot de passe', 'password', '10 caractères au moins')
  + '<button onClick="{{basculerCond}}" style="display: flex; gap: 12px; align-items: flex-start; margin-top: 18px; text-align: left;"><span class="case" style="background: {{condBg}};">{{condSym}}</span><span style="font-size: 13.5px; line-height: 1.5; color: #C9D6D2;">J’accepte les conditions d’utilisation et la politique de confidentialité, dont l’engagement de répondre à chaque candidature.</span></button>' + SUITE + '</div>')
F_CODE = IF('eCode', '<div><p style="font-size: 14.5px; margin-top: 22px;">Envoyé à <b>{{codeMail}}</b></p>' + LAB('Code reçu') + '<input class="in" value="{{f.code}}" onChange="{{eCode2}}" aria-label="Code à 6 chiffres" style="font-size: 26px; letter-spacing: 12px; text-align: center; height: 64px;">'
  + '<button onClick="{{renvoyer}}" style="display: block; margin-top: 12px; font-size: 13.5px; font-weight: 700; color: #A6F26B; min-height: 32px;">Renvoyer le code</button>' + SUITE + '</div>')
F_PHOTO = IF('ePhoto', '<div><div style="display: flex; align-items: center; gap: 20px; margin-top: 26px;">' + IF('aPhoto', '<span style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; display: block; flex: none;">' + PORTRAIT(120) + '</span>') + IF('sansPhoto', '<span class="av" style="width: 120px; height: 120px; font-size: 36px; border: 2px dashed rgba(255,255,255,.25); background: transparent;">{{ini}}</span>', 'true')
  + '<div style="display: flex; flex-direction: column; gap: 10px;">' + IF('sansPhoto', B('importerPhoto', ic('photo', 18) + 'Importer une photo', 'btn'), 'true') + IF('aPhoto', B('retirerPhoto', 'Retirer la photo')) + '</div></div>'
  + '<p class="meta" style="font-size: 13px; margin-top: 18px; line-height: 1.5;">Votre photo n’apparaît qu’à côté de votre nom. Côté talents, la photo ne compte jamais dans le score.</p>' + '<div style="display: flex; gap: 10px; margin-top: 30px;">' + B('suivant', 'Plus tard') + B('suivant', '{{suivT}}', 'btn', 'flex: 1;') + '</div></div>')
F_PAYS = IF('ePays', '<div>' + LAB('Pays') + PILLX('paysP', 5) + LAB('Ville') + INP('f.ville', 'eVille', 'Ville')
  + LAB('Téléphone professionnel (facultatif)') + '<div style="display: flex; gap: 10px;"><span class="in" style="width: 96px; flex: none; display: flex; align-items: center; justify-content: center; font-weight: 700;">{{indicatif}}</span>' + INP('f.tel', 'eTel', 'Numéro professionnel', 'tel', 'Numéro professionnel') + '</div>'
  + LAB('Qui voit ce numéro') + PILLX('telVisP') + LAB('Profil LinkedIn (facultatif)') + INP('f.linkedin', 'eLinkedin', 'Lien LinkedIn', 'url', 'linkedin.com/in/…') + SUITE + '</div>')
F_ROLE = IF('eRole', '<div>' + LAB('Intitulé de votre poste') + INP('f.poste', 'ePoste', 'Intitulé du poste') + LAB('Service') + PILLX('servicesP', 4) + LAB('Dans le recrutement')
  + '<div style="display: flex; flex-direction: column; gap: 8px;"><sc-for list="{{rolesR}}" as="r" hint-placeholder-count="3"><button onClick="{{r.pick}}" style="padding: 14px 16px; border-radius: 16px; border: 1px solid {{r.bord}}; background: {{r.bg}};"><b style="display: block; font-size: 15px;">{{r.t}}</b><span class="meta" style="font-size: 12.5px;">{{r.s}}</span></button></sc-for></div>' + SUITE + '</div>')
F_ENT = IF('eEnt', '<div>' + IF('entPasChoisie', '<div>' + LAB('Rechercher l’entreprise') + '<label class="champ" style="border-color: rgba(255,255,255,.16);">' + LOUPE + '<input value="{{rq}}" onChange="{{ecrireRq}}" aria-label="Rechercher l’entreprise" placeholder="Nom de l’entreprise"></label>'
    + IF('rVide', '<div style="display: flex; gap: 8px; align-items: center; margin-top: 12px;"><span class="meta" style="font-size: 13px;">Essayez</span><button onClick="{{essayer}}" class="pill" style="border: 1px solid rgba(255,255,255,.22);">Baobab</button></div>', 'true')
    + IF('aRes', '<div style="margin-top: 12px;"><sc-for list="{{resultats}}" as="r" hint-placeholder-count="1"><button onClick="{{r.pick}}" class="opt2"><span class="mini" style="background: #14745F;">BF</span><span style="flex: 1;"><b style="display: flex; align-items: center; gap: 6px; font-size: 16px;">{{r.t}}' + ico(I['check'], 16, '2.6', '#A6F26B') + '</b><span class="meta" style="font-size: 13px;">{{r.s}}</span></span><span class="btn" style="height: 38px; font-size: 13px;">Demander à rejoindre</span></button></sc-for></div>')
    + IF('sansRes', '<p class="meta" style="margin-top: 14px;">Aucune entreprise à ce nom sur Jumanly.</p>')
    + '<button onClick="{{creerPage}}" class="opt2" style="margin-top: 18px;"><span class="rond" style="width: 44px; height: 44px; background: #1B3338; color: #A6F26B;">' + ic('plus', 20, '2.2') + '</span><span style="flex: 1;"><b style="display: block; font-size: 15px;">Mon entreprise n’est pas sur Jumanly</b><span class="meta" style="font-size: 12.5px;">Créer sa page et devenir son administrateur</span></span>' + CHEV + '</button></div>', 'true')
  + IF('entChoisie', '<div style="margin-top: 24px;"><div class="opt2" style="border-color: #A6F26B;"><span class="mini" style="background: #14745F;">BF</span><span style="flex: 1;"><b style="display: block; font-size: 16px;">Baobab Fintech</b><span class="meta" style="font-size: 13px;">Administrateur : Joseph Ilunga · formule Company</span></span>' + B('changerEnt', 'Changer', 'btn2', 'height: 38px;') + '</div>'
    + '<p class="meta" style="font-size: 13px; margin-top: 14px; line-height: 1.5;">Votre e-mail @baobabfintech.cd correspond au domaine de l’entreprise : Joseph Ilunga reçoit votre demande à l’étape suivante.</p></div>')
  + SUITE + '</div>')
F_DEMANDE = IF('eDemande', '<div><div class="opt2" style="margin-top: 24px;"><span class="av" style="background: #14745F; color: #FFFFFF;">JI</span><span style="flex: 1;"><b style="display: block; font-size: 15px;">Joseph Ilunga</b><span class="meta" style="font-size: 12.5px;">Responsable RH · administrateur de Baobab Fintech</span></span></div>'
  + LAB('Votre message') + '<textarea class="ta" style="min-height: 120px; font-size: 14.5px;" onChange="{{eMsg}}" aria-label="Message à l’administrateur">{{f.msg}}</textarea>'
  + '<p class="meta" style="font-size: 13px; margin-top: 12px; line-height: 1.5;">Tant qu’il n’a pas répondu, vous pouvez explorer Jumanly ; le logo de Baobab Fintech s’affiche sur votre profil dès qu’il accepte.</p>' + SUITE.replace('{{suivT}}', 'Envoyer la demande') + '</div>')
F_RECRUTE = IF('eRecrute', '<div>' + LAB('Métiers') + PILLX('metiersP', 5) + LAB('Villes') + PILLX('villesP')
  + '<div style="display: flex; align-items: center; gap: 12px; margin-top: 24px; padding: 16px; border-radius: 18px; background: #13282C;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Badge « Recrute en ce moment »</b><span class="meta" style="font-size: 12.5px;">Affiché sur votre profil et dans Explorer</span></span>' + SWV('basculerRecrute', 'recruteSw', 'Recrute en ce moment') + '</div>' + SUITE + '</div>')
F_PROFILR = IF('eProfilR', '<div><div style="display: flex; align-items: center; margin: 24px 0 10px;"><span class="lab" style="margin: 0; flex: 1;">Votre accroche</span><button onClick="{{orbiAccroche}}" style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #5FE0B8; min-height: 34px;">' + ORBI(22) + 'Orbi propose une accroche</button></div>'
  + '<textarea class="ta" style="min-height: 120px; font-size: 14.5px;" maxlength="220" onChange="{{eAccroche}}" aria-label="Votre accroche" placeholder="Ce que vous recrutez, et votre engagement envers les candidats">{{f.accroche}}</textarea>'
  + '<p class="meta" style="font-size: 13px; margin-top: 12px;">220 caractères au plus. Vous la modifiez quand vous voulez dans Compte.</p>' + SUITE + '</div>')
F_ATTENTE = IF('eAttente', '<div style="padding-top: 70px;">' + IF('attente', '<div><span class="rond" style="width: 64px; height: 64px; background: #13282C;">' + ic('horl', 30) + '</span><h1 style="font-size: 30px; margin-top: 22px;">Demande envoyée à Joseph Ilunga</h1><p class="meta" style="font-size: 14.5px; margin-top: 8px; line-height: 1.55;">Votre profil est prêt. En attendant sa réponse, vous pouvez explorer Jumanly et préparer une offre.</p>'
    + '<div style="display: flex; align-items: center; gap: 12px; margin-top: 24px; padding: 16px; border-radius: 18px; background: #13282C;"><span style="flex: 1;"><b style="display: block; font-size: 15px;">Me prévenir dès qu’il répond</b><span class="meta" style="font-size: 12.5px;">Par e-mail et dans le navigateur</span></span>' + SWV('basculerNotif', 'notifSw', 'Me prévenir') + '</div>'
    + '<div style="display: flex; gap: 10px; margin-top: 26px;">' + A('Web-N-accueil.dc.html', 'Explorer en attendant', 'btn2') + B('voirAcceptation', 'Voir la réponse de Joseph', 'btn', 'flex: 1;') + '</div></div>', 'true')
  + IF('accepte', '<div><span class="mini" style="width: 72px; height: 72px; border-radius: 22px; background: #14745F; font-size: 22px;">BF</span><h1 style="font-size: 30px; margin-top: 22px;">Joseph a accepté votre demande</h1><p class="meta" style="font-size: 14.5px; margin-top: 8px; line-height: 1.55;">Vous faites partie de l’équipe de recrutement de Baobab Fintech, avec le rôle Recruteur. Le logo s’affiche sur votre profil.</p>'
    + A('Web-N-accueil-bienvenue.dc.html', 'Entrer dans l’espace Baobab Fintech', 'btn', 'width: 100%; margin-top: 28px;') + '</div>') + '</div>')
# administrateur
F_FORFAIT = IF('eForfait', '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 24px;"><sc-for list="{{plansL}}" as="x" hint-placeholder-count="4"><button onClick="{{x.pick}}" style="display: flex; gap: 14px; align-items: flex-start; width: 100%; padding: 16px 18px; border-radius: 18px; border: 1.5px solid {{x.bord}}; background: {{x.bg}};">'
  '<span class="case" style="background: {{x.cbg}}; border-radius: 50%; margin-top: 2px;">{{x.sym}}</span><span style="flex: 1;"><span style="display: flex; justify-content: space-between; gap: 10px;"><b style="font-size: 16px;">{{x.t}}</b><b style="font-size: 14.5px; color: #A6F26B; white-space: nowrap;">{{x.prix}}</b></span><span class="meta" style="display: block; font-size: 12.5px; margin-top: 4px; line-height: 1.45;">{{x.s}}</span>'
  '<sc-if value="{{x.reco}}" hint-placeholder-val="{{ false }}"><span class="tag" style="margin-top: 8px; background: rgba(166,242,107,.14); color: #DFF7C6;">Pour recruter en équipe</span></sc-if></span></button></sc-for>'
  '<p class="meta" style="font-size: 12.5px; margin-top: 6px;">Candidater reste gratuit pour tous les talents, quelle que soit votre formule.</p>' + SUITE + '</div>')
F_AROLE = IF('eArole', '<div>' + LAB('Intitulé de votre poste') + INP('f.poste', 'ePoste', 'Intitulé du poste')
  + '<div style="margin-top: 22px; padding: 18px; border-radius: 18px; background: #13282C; border: 1px solid rgba(166,242,107,.3);"><b style="display: block; font-size: 15.5px;">Vous êtes administrateur</b>'
  + ''.join(f'<div class="li"><i></i><span>{t}</span></div>' for t in ['Vous invitez l’équipe et donnez un rôle à chacun', 'Vous attribuez les tâches et suivez leur avancement', 'Vous gérez la page, la formule et les factures', 'Vous seul·e voyez le journal des consultations'])
  + '</div><p class="meta" style="font-size: 13px; margin-top: 14px;">Vous recrutez aussi : les offres, l’ATS et l’agenda vous sont ouverts.</p>' + SUITE + '</div>')
F_AENT = IF('eAent', '<div>' + LAB('Secteur') + PILLX('secteursP', 5) + LAB('Taille') + PILLX('taillesP', 4) + LAB('Ville du siège') + INP('f.ville', 'eVille', 'Ville') + LAB('Site') + INP('f.site', 'eSite', 'Site')
  + LAB('À propos') + '<textarea class="ta" style="font-size: 14.5px;" onChange="{{eApropos}}" aria-label="À propos">{{f.apropos}}</textarea>' + SUITE + '</div>')
F_LOGO = IF('eLogo', '<div><div style="display: flex; align-items: center; gap: 18px; margin-top: 24px;">' + IF('aLogo', '<span style="width: 96px; height: 96px; border-radius: 26px; background: #14745F; color: #FFFFFF; font-size: 28px; font-weight: 800; display: flex; align-items: center; justify-content: center;">BF</span>') + IF('sansLogo', '<span style="width: 96px; height: 96px; border-radius: 26px; border: 2px dashed rgba(255,255,255,.3); color: #8FA39E; font-size: 28px; font-weight: 800; display: flex; align-items: center; justify-content: center;">{{orgIni}}</span>', 'true')
  + '<div><b style="display: block; font-size: 15px;">Logo</b><p class="meta" style="font-size: 12.5px; margin: 4px 0 10px;">Carré, 400 × 400 px conseillé</p>' + B('importerLogo', ic('photo', 18) + 'Importer le logo', 'btn2', 'height: 42px;') + '</div></div>'
  + LAB('Bannière') + '<div style="display: flex; gap: 10px;"><sc-for list="{{bannP}}" as="b" hint-placeholder-count="4"><button onClick="{{b.pick}}" aria-label="Bannière {{b.t}}" style="flex: 1; height: 64px; border-radius: 14px; background: {{b.fond}}; border: 3px solid {{b.bord}};"></button></sc-for></div>'
  + '<p class="meta" style="font-size: 12.5px; margin-top: 10px;">Ou importez une image de 1 600 × 400 px depuis la page entreprise.</p>' + SUITE + '</div>')
F_VERIF = IF('eVerif', '<div><div class="opt2" style="margin-top: 24px;">' + ico(I['check'], 22, '2.6', '#A6F26B') + '<span style="flex: 1;"><b style="display: block; font-size: 15px;">E-mail sur le domaine {{domaine}}</b><span class="meta" style="font-size: 12.5px;">Confirmé par le code reçu</span></span></div>'
  + '<div class="opt2" style="margin-top: 10px;">' + ic('pdf', 22) + '<span style="flex: 1;"><b style="display: block; font-size: 15px;">Registre du commerce ou équivalent</b><span class="meta" style="font-size: 12.5px;">Facultatif, accélère la vérification</span></span>' + IF('sansDoc', B('importerDoc', 'Importer', 'btn2', 'height: 38px;'), 'true') + IF('aDoc', '<span class="tag">Ajouté</span>') + '</div>'
  + '<p class="meta" style="font-size: 13px; margin-top: 16px; line-height: 1.5;">Jumanly vérifie la page ; le badge « vérifiée » apparaît ensuite sur la page et sur chaque offre. Vous pouvez publier dès maintenant.</p>' + SUITE + '</div>')
F_PAY = IF('ePay', '<div>' + IF('gratuit', '<div style="margin-top: 24px; padding: 18px; border-radius: 18px; background: #13282C;"><b style="display: block; font-size: 16px;">RH Free : rien à payer</b><p class="meta" style="margin-top: 6px;">Passez à Company quand votre équipe grandit.</p></div>' + SUITE)
  + IF('payant', '<div><div style="margin-top: 22px; padding: 16px 18px; border-radius: 18px; background: #13282C; display: flex; align-items: center;"><span style="flex: 1;"><b style="display: block; font-size: 16px;">Formule {{planT}}</b><span class="meta" style="font-size: 12.5px;">1 mois prépayé · rappel avant chaque échéance</span></span><b style="font-size: 20px; color: #A6F26B;">{{payMontant}}</b></div>'
    + IF('payForm', '<div>' + LAB('Moyen de paiement') + PILLX('payOps', 4) + IF('payMm', '<div>' + LAB('Numéro du compte {{payOpT}} qui paie') + '<input class="in" value="+243 81 ••• •• 47" aria-label="Numéro Mobile Money" readonly></div>', 'true') + IF('payCarte', '<div>' + LAB('Carte bancaire') + '<input class="in" value="•••• •••• •••• 4012" aria-label="Carte bancaire" readonly></div>')
      + B('payer', 'Payer {{payMontant}}', 'btn', 'width: 100%; margin-top: 24px;') + '<button onClick="{{enFree}}" style="display: block; margin: 14px auto 0; font-size: 13.5px; font-weight: 700; color: #A6F26B; min-height: 32px;">Commencer en RH Free et payer plus tard</button></div>', 'true')
    + IF('payAttente', '<div style="text-align: center; padding: 30px 0 0;"><span class="spin" style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; border: 4px solid #2A3B3E; border-top-color: #A6F26B;"></span><b style="display: block; font-size: 17px; margin-top: 16px;">Confirmez sur votre téléphone</b><p class="meta" style="margin-top: 6px; line-height: 1.5;">{{payOpT}} vous demande votre code secret. Sans réponse dans 15 minutes, le paiement expire.</p><div style="display: flex; gap: 10px; justify-content: center; margin-top: 22px;">' + B('payRetry', 'Réessayer') + B('payConfirme', 'J’ai confirmé', 'btn') + '</div></div>')
    + IF('payOk', '<div><div style="margin-top: 18px; padding: 18px; border-radius: 18px; background: rgba(166,242,107,.1); display: flex; align-items: center; gap: 12px;">' + ico(I['check'], 26, '2.6', '#A6F26B') + '<span><b style="display: block; font-size: 16px;">Paiement reçu</b><span class="meta" style="font-size: 12.5px;">Formule active jusqu’au 22 novembre · facture envoyée par e-mail</span></span></div>' + SUITE + '</div>')
    + '</div>', 'true') + '</div>')
F_EQUIPE = IF('eEquipe', '<div><div style="margin-top: 22px; display: flex; flex-direction: column; gap: 10px;"><sc-for list="{{invitesL}}" as="v" hint-placeholder-count="3"><div style="padding: 12px 14px; border-radius: 16px; background: #13282C;"><div style="display: flex; align-items: center; gap: 10px;"><b style="flex: 1; min-width: 0; font-size: 14px; overflow: hidden; text-overflow: ellipsis;">{{v.m}}</b><button onClick="{{v.retirer}}" aria-label="Retirer" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #8FA39E;">' + ic('croix', 16, '2') + '</button></div>'
  '<div style="display: flex; gap: 6px; margin-top: 8px;"><sc-for list="{{v.roles}}" as="f" hint-placeholder-count="3"><button onClick="{{f.pick}}" class="pill" style="height: 32px; font-size: 12.5px; border: 1px solid {{f.bd}}; background: {{f.bg}}; color: {{f.col}};">{{f.t}}</button></sc-for></div></div></sc-for></div>'
  '<div style="display: flex; gap: 10px; margin-top: 14px;"><label class="champ" style="flex: 1; border-color: rgba(255,255,255,.16);"><input value="{{f.invMail}}" onChange="{{eInv}}" aria-label="E-mail à inviter" placeholder="prenom.nom@entreprise.cd"></label>' + B('ajouterInv', 'Ajouter', 'btn2', 'height: 52px;') + '</div>'
  '<p class="meta" style="font-size: 13px; margin-top: 12px;">{{placesT}}</p>' + SUITE.replace('{{suivT}}', 'Envoyer les invitations') + '</div>')
F_PRET = IF('ePret', '<div style="padding-top: 70px;"><span class="mini" style="width: 72px; height: 72px; border-radius: 22px; background: #14745F; font-size: 22px;">BF</span><h1 style="font-size: 30px; margin-top: 22px;">L’espace {{f.org}} est prêt</h1>'
  '<div style="margin-top: 20px;">' + ''.join(f'<div class="li" style="padding: 7px 0;"><i></i><span>{t}</span></div>' for t in ['Page entreprise créée, vérification en cours', 'Formule {{planT}} active', '{{nInv}} invitations envoyées']) + '</div>'
  + A('Web-J-accueil-bienvenue.dc.html', 'Entrer dans l’espace administrateur', 'btn', 'width: 100%; margin-top: 28px;') + '</div>')
OUV = IF('ouv', '<button onClick="{{passer}}" aria-label="Continuer" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #0B1A1F;"><span class="entree" style="display: flex; align-items: center; gap: 10px; font-size: 64px; font-weight: 800; letter-spacing: -1.5px; color: #F2EDE5;">jumanly<i class="pulse" style="width: 20px; height: 20px; border-radius: 50%; background: #A6F26B; display: block; margin-top: 28px;"></i></span></button>')
CORPS_A = (OUV + IF('split', '<div style="position: absolute; inset: 0; display: flex;">' + GAUCHE + '<div class="droiteA"><div class="form">' + ENTETE + F_CONNEXION + F_OUBLI + F_PROFIL + F_COMPTE + F_CODE + F_PHOTO + F_PAYS + F_ROLE + F_ENT + F_DEMANDE + F_RECRUTE + F_PROFILR + F_ATTENTE
  + F_FORFAIT + F_AROLE + F_AENT + F_LOGO + F_VERIF + F_PAY + F_EQUIPE + F_PRET + '</div></div></div>', 'true')
  + TOAST.replace('left: 20px; right: 20px; top: 54px;', 'left: 50%; transform: translateX(-50%); width: 520px; top: 18px;'))

# ---------- Site public : page recruteurs et tarifs ----------
SCSS = '''
.fd .site{position:absolute;inset:0;overflow-y:auto;scrollbar-width:none}.fd .site::-webkit-scrollbar{display:none}
.fd .hdr{position:sticky;top:0;z-index:5;height:76px;display:flex;align-items:center;gap:28px;padding:0 64px;background:rgba(11,26,31,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.06)}
.fd .hdr .ln{font-size:14.5px;font-weight:600;min-height:40px;display:flex;align-items:center}
.fd .sec2{padding:0 64px}
.fd .kc2{background:#13282C;border-radius:14px;padding:10px;margin-bottom:8px;font-size:12px}
'''
KC = lambda ini, bg, fg, nom, s: f'<div class="kc2"><span style="display: flex; align-items: center; gap: 8px;"><span class="av" style="width: 28px; height: 28px; font-size: 10px; background: {bg}; color: {fg};">{ini}</span><b style="flex: 1; font-size: 12px;">{nom}</b></span><span style="display: flex; justify-content: space-between; margin-top: 8px;"><span style="font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: #A6F26B; color: #0B1A1F;">{s}</span><span style="font-size: 11px; color: #5FE0B8; font-weight: 700;">Pourquoi ?</span></span></div>'
MOCK = ('<div style="border-radius: 22px; background: #09161A; border: 1px solid rgba(255,255,255,.08); padding: 16px; box-shadow: 0 40px 80px -30px rgba(0,0,0,.9);"><div style="display: flex; gap: 6px; margin-bottom: 12px;"><i style="width: 10px; height: 10px; border-radius: 50%; background: #2A3B3E;"></i><i style="width: 10px; height: 10px; border-radius: 50%; background: #2A3B3E;"></i><i style="width: 10px; height: 10px; border-radius: 50%; background: #2A3B3E;"></i></div>'
  '<b style="display: block; font-size: 14px; margin-bottom: 10px;">Analyste de données junior · 38 candidatures</b><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">'
  '<div><p class="meta" style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">Nouvelles</p>' + KC('EK', '#FBE3EF', '#8A2D5C', 'Esther K.', '85 %') + KC('AK', '#DDF6EE', '#14745F', 'Amani K.', '74 %') + '</div>'
  '<div><p class="meta" style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">Présélection</p>' + KC('DL', '#E8F0D8', '#4F6B12', 'Didier L.', '82 %') + '</div>'
  '<div><p class="meta" style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">Entretien</p>' + KC('GM', '#E3E8FB', '#2D3F8A', 'Grâce M.', '93 %') + '</div></div></div>')
PIL3 = lambda icone, t, s: f'<div class="carte" style="padding: 24px; border-radius: 24px;"><span class="rond" style="width: 48px; height: 48px; background: #1B3338; color: #A6F26B;">{ic(icone, 22)}</span><b style="display: block; font-size: 18px; margin-top: 16px;">{t}</b><p class="meta" style="font-size: 14px; line-height: 1.55; margin-top: 8px;">{s}</p></div>'
PLAN_C = lambda t, prix, s, href, bt, mis=False: (f'<div class="carte" style="padding: 22px; border-radius: 22px; display: flex; flex-direction: column; border: 1px solid {"#A6F26B" if mis else "rgba(255,255,255,.1)"};"><b style="font-size: 17px;">{t}</b><b style="font-size: 24px; color: #A6F26B; margin-top: 8px;">{prix}</b><p class="meta" style="font-size: 13px; line-height: 1.55; margin: 10px 0 18px; flex: 1;">{s}</p>'
  + (f'<a href="{href}" class="{"btn" if mis else "btn2"}" style="justify-content: center;">{bt}</a>' if href else f'<button onClick="{{{{devis}}}}" class="btn2" style="justify-content: center;">{bt}</button>') + '</div>')
SITE = ('<div class="site"><header class="hdr">' + LOGO + '<span style="flex: 1;"></span>'
  '<button onClick="{{goRec}}" class="ln" style="color: {{lnRec}};">Recruter</button><button onClick="{{goTarifs}}" class="ln" style="color: {{lnTar}};">Tarifs</button>'
  + A('Web-acces-connexion.dc.html', 'Se connecter', 'btn2', 'height: 44px;') + A('Web-acces-profil.dc.html', 'Créer un compte', 'btn', 'height: 44px;') + '</header>'
  + IF('pgRec', '<div><div class="sec2" style="display: flex; align-items: center; gap: 56px; padding-top: 70px;"><div style="flex: 1;"><span class="tag" style="background: rgba(166,242,107,.14); color: #DFF7C6;">Jumanly pour les recruteurs et les entreprises</span>'
    '<h1 style="font-size: 54px; line-height: 1.08; letter-spacing: -.03em; margin-top: 18px;">Recrutez les bons profils, plus vite.</h1><p style="font-size: 18px; line-height: 1.6; color: #C9D6D2; margin-top: 18px; max-width: 560px;">Publiez vos offres, recevez des candidatures classées par compatibilité avec leur « Pourquoi ? », et décidez en équipe. Candidater reste gratuit pour tous.</p>'
    '<div style="display: flex; gap: 12px; margin-top: 28px;">' + A('Web-acces-profil.dc.html', 'Créer un compte recruteur') + A('Web-acces-connexion.dc.html', 'Se connecter', 'btn2') + '</div></div><div style="width: 560px; flex: none;">' + MOCK + '</div></div>'
    '<div class="sec2" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 80px;">'
    + PIL3('offres', 'Publier en 5 étapes', 'Le poste, les compétences, les conditions, les questions, puis l’aperçu. Les talents compatibles sont prévenus.')
    + PIL3('candidatures', 'Trier sans écarter', 'Un score sur 8 critères fixes, toujours expliqué. Le nom, l’âge, le genre, la photo ou la nationalité ne comptent jamais.')
    + PIL3('equipe', 'Recruter à plusieurs', 'Des rôles pour chacun, des tâches suivies, un agenda partagé et un rapport PDF chaque mois.') + '</div>'
    '<div class="sec2" style="margin-top: 80px;"><h2 style="font-size: 32px; letter-spacing: -.02em;">Pour chaque taille d’équipe</h2><div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 24px;">'
    + PLAN_C('RH Free', 'Gratuit', '1 utilisateur · 1 offre en ligne · candidatures et messages', 'Web-acces-a-forfait.dc.html', 'Commencer') + PLAN_C('RH Pro', '19,9 USD par mois', '2 utilisateurs · 5 offres · recherche de talents · statistiques', 'Web-acces-a-forfait.dc.html', 'Choisir')
    + PLAN_C('Company', '79,9 USD par mois', '5 utilisateurs · 20 offres · ATS avancé · grilles d’évaluation · page vérifiée', 'Web-acces-a-forfait.dc.html', 'Choisir', True) + PLAN_C('Company Plus', '179,9 USD par mois', '15 utilisateurs · 50 offres · plusieurs équipes · export des rapports', 'Web-acces-a-forfait.dc.html', 'Choisir') + '</div>'
    '<button onClick="{{goTarifs}}" style="margin-top: 16px; font-size: 14px; font-weight: 700; color: #A6F26B; min-height: 36px;">Comparer toutes les formules</button></div></div>', 'true')
  + IF('pgTar', '<div class="sec2" style="padding-top: 60px;"><h1 style="font-size: 44px; letter-spacing: -.03em;">Tarifs recruteurs et entreprises</h1><p class="meta" style="font-size: 16px; margin-top: 10px;">Prix en USD, prépayés chaque mois par Mobile Money ou carte. Candidater est toujours gratuit pour les talents.</p>'
    '<h2 style="font-size: 22px; margin-top: 40px;">Jumanly for RH</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px;">'
    + PLAN_C('RH Free', 'Gratuit', '1 utilisateur · 1 offre en ligne · réception et consultation des candidatures · étapes simples · messagerie · tableau de bord élémentaire', 'Web-acces-a-forfait.dc.html', 'Commencer')
    + PLAN_C('RH Pro', '19,9 USD par mois', '2 utilisateurs · 5 offres · recherche avancée de talents · suggestions de matching · analyse des CV · rendez-vous · statistiques', 'Web-acces-a-forfait.dc.html', 'Choisir')
    + PLAN_C('RH Premium', '49,9 USD par mois', '3 utilisateurs · 15 offres · ATS avancé · matching explicable · collaboration · grilles d’évaluation · historique des décisions · support prioritaire', 'Web-acces-a-forfait.dc.html', 'Choisir') + '</div>'
    '<h2 style="font-size: 22px; margin-top: 40px;">Jumanly for Companies</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px;">'
    + PLAN_C('Company', '79,9 USD par mois', '5 utilisateurs · 20 offres · profil entreprise vérifié · tableau de bord partagé · ATS avancé · organisation des entretiens · grilles d’évaluation · statistiques', 'Web-acces-a-forfait.dc.html', 'Choisir', True)
    + PLAN_C('Company Plus', '179,9 USD par mois', '15 utilisateurs · 50 offres · plusieurs équipes · permissions avancées · viviers partagés · rapports consolidés et export · assistance prioritaire', 'Web-acces-a-forfait.dc.html', 'Choisir')
    + PLAN_C('Company Premium', 'Sur devis', '30 utilisateurs et plus · filiales · workflows configurables · intégrations · accompagnement', '', 'Demander un devis') + '</div></div>')
  + '<footer class="sec2" style="margin-top: 90px; padding-top: 40px; padding-bottom: 50px; border-top: 1px solid rgba(255,255,255,.06); display: flex; align-items: flex-start; gap: 40px;"><div style="flex: 1;">' + LOGO + '<p class="meta" style="margin-top: 10px;">Learn. Grow. Connect.</p><p class="meta" style="margin-top: 6px; font-size: 12.5px;">Une plateforme développée par The Growth Lab</p></div>'
  '<div><b style="display: block; font-size: 14px;">Nous écrire</b><p class="meta" style="margin-top: 8px; font-size: 13.5px;">assistant@jumanly.io</p><p class="meta" style="margin-top: 4px; font-size: 13.5px;">infojumanly@gmail.com</p></div></footer></div>'
  + TOAST.replace('left: 20px; right: 20px; top: 54px;', 'left: 50%; transform: translateX(-50%); width: 520px; top: 90px;'))
SITE_JS = '''class Component extends DCLogic {
  renderVals() {
/*PRELUDE*/
    const pg = prop('pg', 'recruteurs');
    return { pgRec: pg === 'recruteurs', pgTar: pg === 'tarifs', goRec: () => S({ pg: 'recruteurs' }), goTarifs: () => S({ pg: 'tarifs' }), lnRec: pg === 'recruteurs' ? '#A6F26B' : '#F2EDE5', lnTar: pg === 'tarifs' ? '#A6F26B' : '#F2EDE5',
      devis: () => flash('Demande de devis : écrivez à assistant@jumanly.io, réponse sous 48 h ouvrées'), aToast: !!st.toast, toast: st.toast || '' };
  }
}
'''.replace(', réponse sous 48 h ouvrées', '')

def ecrire(nom, titre, corps, js, props, css):
    props = dict(props); props['$preview'] = {'width': 1440, 'height': 900}
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
<style>{CSS}{css}</style>
</helmet>
<div class="fd" style="width: 1440px; height: 900px; position: relative; overflow: hidden; background: #0B1A1F; border-radius: 14px;">
{corps}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{_j.dumps(props, ensure_ascii=False)}'>
{js.replace('/*PRELUDE*/', PRELUDE)}
</script>
</body>
</html>
'''
    open(os.path.join(PW, nom + '.dc.html'), 'w').write(html)
def imp(nom, fn, titre, props):
    attrs = ' '.join(f'{k}="{v}"' for k, v in props.items())
    open(os.path.join(PW, fn), 'w').write(f'''<!doctype html>
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
<div style="width: 1440px; height: 900px; font-family: Sora, system-ui, sans-serif; color: #F2EDE5;">
<dc-import name="{nom}" {attrs} hint-size="1440px,900px"></dc-import>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":900}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{ oui: true }}; }}
}}
</script>
</body>
</html>
''')

ETAPES = ['ouverture', 'connexion', 'oubli', 'profil'] + ['r-compte', 'r-code', 'r-photo', 'r-pays', 'r-role', 'r-entreprise', 'r-demande', 'r-recrute', 'r-profil', 'r-attente', 'r-accepte'] + ['a-forfait', 'a-compte', 'a-code', 'a-role', 'a-entreprise', 'a-logo', 'a-verif', 'a-paiement', 'a-equipe', 'a-pret']
ecrire('Web-Acces', 'Jumanly · Accès sur ordinateur : connexion et inscriptions (prototype cliquable)', CORPS_A, open(os.path.join(D, 'w_acces_logic.js')).read(), {'etape': {'editor': 'enum', 'options': ETAPES, 'default': 'connexion'}, 'rq': {'editor': 'string', 'default': ''}}, ACSS)
ecrire('Web-Site', 'Jumanly · Site public · Recruter (prototype cliquable)', SITE, SITE_JS, {'pg': {'editor': 'enum', 'options': ['recruteurs', 'tarifs'], 'default': 'recruteurs'}}, ACSS + SCSS)
T = {'ouverture': 'Ouverture · logo animé', 'connexion': 'Se connecter', 'oubli': 'Mot de passe oublié', 'profil': 'Créer un compte · Vous êtes…',
     'r-compte': 'Recruteur 1/9 · compte', 'r-code': 'Recruteur 2/9 · code reçu', 'r-photo': 'Recruteur 3/9 · photo', 'r-pays': 'Recruteur 4/9 · pays et contacts', 'r-role': 'Recruteur 5/9 · rôle', 'r-entreprise': 'Recruteur 6/9 · rechercher l’entreprise', 'r-demande': 'Recruteur 7/9 · demande de rattachement', 'r-recrute': 'Recruteur 8/9 · ce que vous recrutez', 'r-profil': 'Recruteur 9/9 · accroche et profil', 'r-attente': 'Recruteur · demande envoyée', 'r-accepte': 'Recruteur · rattachement accepté',
     'a-forfait': 'Administrateur 1/9 · formule', 'a-compte': 'Administrateur 2/9 · compte de l’entreprise', 'a-code': 'Administrateur 3/9 · code reçu', 'a-role': 'Administrateur 4/9 · rôle', 'a-entreprise': 'Administrateur 5/9 · l’entreprise', 'a-logo': 'Administrateur 6/9 · logo et bannière', 'a-verif': 'Administrateur 7/9 · vérification', 'a-paiement': 'Administrateur 8/9 · paiement Mobile Money', 'a-equipe': 'Administrateur 9/9 · inviter l’équipe', 'a-pret': 'Administrateur · espace prêt'}
L = [['Web-Site.dc.html', 'Site public · page Recruter'], ['Web-Site-tarifs.dc.html', 'Site public · tarifs']]
imp('Web-Site', 'Web-Site-tarifs.dc.html', 'Site public · tarifs', {'pg': 'tarifs'})
for e in ETAPES:
    fn = f'Web-acces-{e}.dc.html'; imp('Web-Acces', fn, T[e], {'etape': e}); L.append([fn, T[e]])
imp('Web-Acces', 'Web-acces-r-entreprise-trouvee.dc.html', 'Recruteur 6/9 · entreprise trouvée', {'etape': 'r-entreprise', 'rq': 'Baobab'})
L.insert([x[0] for x in L].index('Web-acces-r-demande.dc.html'), ['Web-acces-r-entreprise-trouvee.dc.html', 'Recruteur 6/9 · entreprise trouvée'])
_j.dump(L, open(os.path.join(D, 'w_acces_pages.json'), 'w'), ensure_ascii=False)
print('ok', len(L))
