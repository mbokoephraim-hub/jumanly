    const st = this.state || {};
    const p = this.props || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(st, k);
    const S = (o) => this.setState(o);
    const flash = (t) => { S({ toast: t }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ toast: null }), 2300); };
    const val = (e) => (e && e.target ? e.target.value : '');
    const oui = (x) => x === true || x === 'true';
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const prop = (k, d) => (has(k) ? st[k] : (p[k] !== undefined && p[k] !== '' && p[k] !== 'aucune' ? p[k] : d));
    const chiffre = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    // pastilles de choix (filtres, sous-onglets)
    const pills = (liste, actif, cle) => liste.map(([k, t]) => ({ t, pick: () => S({ [cle]: k }), bg: k === actif ? '#F2EDE5' : 'transparent', col: k === actif ? '#0B1A1F' : '#F2EDE5', bd: k === actif ? '#F2EDE5' : 'rgba(255,255,255,.22)' }));
    const onglets = (liste, actif, cle, extra) => liste.map(([k, t, n]) => ({ t, n: n || '', aN: !!n, sel: k === actif ? 'true' : 'false', on: k === actif, fw: k === actif ? '700' : '500', col: k === actif ? '#F2EDE5' : '#8FA39E', pick: () => S({ [cle]: k, ...(extra || {}) }) }));
    // bande de score (doc 08) : jamais de rouge
    const bande = (s) => (s >= 85 ? ['Très compatible', '#0B1A1F', '#A6F26B'] : s >= 70 ? ['Compatible', '#0B1A1F', '#9FE8D2'] : s >= 50 ? ['Partiellement compatible', '#0B1A1F', '#F4D59A'] : ['Peu compatible', '#0B1A1F', '#C9D6D2']);
    // Orbi : questions propres à la page, réponse, action
    const orbiKit = (OQ, sous, titre, bulleK) => {
      const ouvert = has('orbi') ? st.orbi : oui(p.orbi);
      const rep = has('oRep') ? st.oRep : (p.orbiRep && p.orbiRep !== 'aucune' ? p.orbiRep : null);
      const r = rep && OQ[rep] ? OQ[rep] : null;
      const oq = st.oq ?? '';
      const cles = Object.keys(OQ);
      return {
        orbi: !!ouvert, ouvrirOrbi: () => S({ orbi: true, oRep: null }), fermerOrbi: () => S({ orbi: false }), autresQ: () => S({ oRep: null }),
        aRep: !!r, sansRep: !r, orbiTitre: titre, orbiSous: sous,
        questionsOrbi: cles.map((k) => ({ t: OQ[k].q, go: () => S({ oRep: k }) })),
        ra: r ? { q: r.q, t: r.t, actT: r.actT || '', act: r.act || (() => S({ orbi: false })), aAct: !!r.act, aLien: !!r.href, href: r.href || '' } : { q: '', t: '', actT: '', act: () => {}, aAct: false, aLien: false, href: '' },
        oq, ecrireOrbi: (e) => S({ oq: val(e) }), envoyerOrbi: () => { if (!oq.trim()) return flash('Écrivez votre question à Orbi'); S({ oRep: cles[0], oq: '' }); },
        aBulle: !!bulleK, bulle: bulleK ? OQ[bulleK].q : '', bulleGo: () => S({ orbi: true, oRep: bulleK }),
        aToast: !!st.toast, toast: st.toast || ''
      };
    };
