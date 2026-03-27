/**
 * Page Message (Chat) - EsikaTok.
 * Interface chat premium WhatsApp / Messenger.
 * Vidéo épinglée en haut, bulles avec statut, date grouping, typing indicator.
 */
const PageMessage = (() => {
    let _convId = null;
    let _intervalle = null;
    let _convData = null;
    let _lastMsgCount = 0;
    let _isTyping = false;
    let _typingTimer = null;

    /* --- Utilitaires date WhatsApp-style --- */
    function labelDate(dateStr) {
        const d = new Date(dateStr);
        const maintenant = new Date();
        const auj = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
        const hier = new Date(auj); hier.setDate(hier.getDate() - 1);
        const jour = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (jour.getTime() === auj.getTime()) return "Aujourd'hui";
        if (jour.getTime() === hier.getTime()) return 'Hier';
        const opts = { weekday: 'long', day: 'numeric', month: 'long' };
        return d.toLocaleDateString('fr-FR', opts).replace(/^\w/, c => c.toUpperCase());
    }

    function heureFormatee(dateStr) {
        return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    function separateurDate(label) {
        return `<div class="flex items-center justify-center my-4">
            <span class="px-3 py-1 bg-sombre-800/90 backdrop-blur-md rounded-lg text-[11px] text-sombre-300 font-medium shadow-sm">${label}</span>
        </div>`;
    }

    /* --- Double checkmark SVG (WhatsApp-style) --- */
    function checksStatus(estMoi, estLu) {
        if (!estMoi) return '';
        if (estLu) {
            return `<svg class="w-4 h-3 ml-1 flex-shrink-0" viewBox="0 0 20 12" fill="none"><path d="M1 6l4 4 8-8" stroke="#53bdeb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6l4 4 8-8" stroke="#53bdeb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        }
        return `<svg class="w-4 h-3 ml-1 flex-shrink-0" viewBox="0 0 20 12" fill="none"><path d="M1 6l4 4 8-8" stroke="rgba(255,255,255,0.45)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6l4 4 8-8" stroke="rgba(255,255,255,0.45)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    /* --- Typing indicator --- */
    function typingIndicator() {
        return `<div id="typing-indicator" class="hidden flex justify-start mb-2 bulle-entree">
            <div class="bulle-autre px-4 py-3 flex items-center gap-1">
                <div class="typing-dot w-2 h-2 rounded-full bg-sombre-200"></div>
                <div class="typing-dot w-2 h-2 rounded-full bg-sombre-200"></div>
                <div class="typing-dot w-2 h-2 rounded-full bg-sombre-200"></div>
            </div>
        </div>`;
    }

    /* --- Header de chat avec info interlocuteur --- */
    function chatHeader(conv, autre) {
        const online = '';
        return `
        <div class="sticky top-0 z-20 bg-sombre-900/98 backdrop-blur-lg border-b border-sombre-700/30">
            <div class="flex items-center h-14 px-2 max-w-lg mx-auto">
                <button onclick="EsikaTok.retour()" class="p-2 -ml-1 rounded-full hover:bg-sombre-800 transition flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div onclick="${conv?.bien_id ? `EsikaTok.naviguer('detail',{id:${conv.bien_id}})` : ''}" class="flex items-center gap-3 flex-1 min-w-0 ml-1 cursor-pointer">
                    <div class="relative flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primaire-500 to-primaire-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                            ${autre?.photo ? `<img src="${autre.photo}" class="w-full h-full object-cover">` : (autre?.prenom || 'U').charAt(0)}
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-white truncate">${autre?.prenom || ''} ${autre?.nom || ''}</p>
                        <p id="chat-sous-titre" class="text-[11px] text-sombre-200 truncate">${conv?.bien_titre ? '🏠 ' + conv.bien_titre : 'En ligne'}</p>
                    </div>
                </div>
            </div>
        </div>`;
    }

    /* --- Carte bien épinglée (vidéo du bien) --- */
    function carteBienEpinglee(conv) {
        if (!conv?.bien_titre) return '';
        const miniature = conv.bien_miniature || '';
        const videoUrl = conv.bien_video_url || '';
        const prix = conv.bien_prix || '';
        return `
        <div onclick="EsikaTok.naviguer('detail',{id:${conv.bien_id}})" class="mx-3 mt-3 mb-1 p-2.5 bg-sombre-800/80 border border-sombre-700/40 rounded-xl cursor-pointer hover:bg-sombre-700/60 transition group">
            <div class="flex gap-3 items-center">
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-sombre-700 flex-shrink-0 relative">
                    ${miniature ? `<img src="${miniature}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">` :
                    `<div class="w-full h-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-sombre-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </div>`}
                    ${videoUrl ? `<div class="absolute inset-0 flex items-center justify-center bg-black/20"><svg class="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>` : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-white truncate">${conv.bien_titre}</p>
                    ${prix ? `<p class="text-xs font-bold text-accent-400 mt-0.5">${prix}</p>` : ''}
                    <p class="text-[10px] text-primaire-400 mt-1 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                        Voir l'annonce
                    </p>
                </div>
                <svg class="w-4 h-4 text-sombre-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </div>
        </div>`;
    }

    function afficher(params) {
        _convId = params?.id;
        return `
        <div class="h-full flex flex-col bg-sombre-900">
            <div id="chat-header"></div>
            <!-- Carte bien épinglée -->
            <div id="bien-epingle"></div>
            <!-- Messages -->
            <div id="liste-messages" class="flex-1 overflow-y-auto chat-scroll chat-bg px-3 py-3">${Composants.loader()}</div>
            <!-- Saisie premium -->
            <div class="bg-sombre-900 border-t border-sombre-700/30 px-3 py-2 safe-bottom">
                <div class="flex items-end gap-2 max-w-lg mx-auto">
                    <div class="flex-1 relative">
                        <input type="text" id="input-message" placeholder="Message..."
                            class="w-full pl-4 pr-4 py-2.5 bg-sombre-800 border border-sombre-700/50 rounded-full text-sm text-white placeholder-sombre-200/60 focus:outline-none focus:border-primaire-500/50 focus:ring-1 focus:ring-primaire-500/20 transition"
                            onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();PageMessage.envoyer()}"
                            oninput="PageMessage.onTyping()" autocomplete="off">
                    </div>
                    <button id="btn-envoyer" onclick="PageMessage.envoyer()" class="w-10 h-10 bg-primaire-600 rounded-full flex items-center justify-center text-white hover:bg-primaire-500 active:scale-95 transition-all shadow-lg shadow-primaire-600/20 flex-shrink-0">
                        <svg class="w-5 h-5 transform rotate-45 -translate-x-px" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
        </div>`;
    }

    async function initialiser(params) {
        _convId = params?.id;
        _lastMsgCount = 0;
        if (!_convId) return;

        /* Charger les données de conversation */
        const convs = EtatApp.obtenir('conversations') || [];
        _convData = convs.find(c => c.id === _convId) || null;

        await chargerMessages();

        BadgeManager.forcer();
        _intervalle = setInterval(chargerMessages, 5000);
    }

    async function chargerMessages() {
        if (!_convId) return;
        if (!EtatApp.estConnecte()) { detruire(); return; }
        try {
            const donnees = await ApiEsikaTok.messagerie.messages(_convId);
            const msgs = donnees.messages || donnees.results || donnees || [];
            const conv = donnees.conversation || _convData;
            if (conv) _convData = conv;

            /* Render header + bien épinglé (une seule fois ou si conv change) */
            const headerEl = document.getElementById('chat-header');
            if (headerEl && headerEl.innerHTML === '') {
                const moi = EtatApp.obtenir('utilisateur');
                const autre = conv?.initiateur?.id === moi?.id ? conv?.agent : conv?.initiateur;
                headerEl.innerHTML = chatHeader(conv, autre);
            }
            const bienEl = document.getElementById('bien-epingle');
            if (bienEl && bienEl.innerHTML === '') {
                bienEl.innerHTML = carteBienEpinglee(conv);
            }

            const liste = document.getElementById('liste-messages');
            if (!liste) return;

            if (msgs.length === 0) {
                liste.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center px-6">
                    <div class="w-16 h-16 rounded-full bg-primaire-600/10 flex items-center justify-center mb-4">
                        <svg class="w-8 h-8 text-primaire-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    </div>
                    <p class="text-sombre-200 text-sm font-medium">Aucun message</p>
                    <p class="text-sombre-200/50 text-xs mt-1">Envoyez le premier message pour démarrer la discussion</p>
                </div>`;
                return;
            }

            /* Ne re-render que si les messages ont changé */
            if (msgs.length === _lastMsgCount) return;
            const isNewMessage = msgs.length > _lastMsgCount && _lastMsgCount > 0;
            _lastMsgCount = msgs.length;

            const moi = EtatApp.obtenir('utilisateur');
            let dernierLabel = '';
            let html = '';

            msgs.forEach((m, idx) => {
                const lbl = labelDate(m.date_envoi);
                if (lbl !== dernierLabel) {
                    html += separateurDate(lbl);
                    dernierLabel = lbl;
                }

                const estMoi = m.est_moi || m.expediteur_id === moi?.id;
                const heure = heureFormatee(m.date_envoi);
                const isLast = idx === msgs.length - 1;
                const animClass = isNewMessage && isLast ? 'bulle-entree' : '';

                html += `
                <div class="flex ${estMoi ? 'justify-end' : 'justify-start'} mb-1.5 ${animClass}">
                    <div class="max-w-[82%] ${estMoi ? 'bulle-moi' : 'bulle-autre'} px-3 py-2 shadow-sm">
                        <p class="text-[13.5px] leading-relaxed text-white whitespace-pre-wrap break-words">${ApiEsikaTok.echapperHtml(m.contenu)}</p>
                        <div class="flex items-center justify-end gap-0.5 -mb-0.5 mt-1">
                            <span class="text-[10px] ${estMoi ? 'text-white/40' : 'text-sombre-200/40'} leading-none">${heure}</span>
                            ${checksStatus(estMoi, m.est_lu)}
                        </div>
                    </div>
                </div>`;
            });

            html += typingIndicator();
            liste.innerHTML = html;
            liste.scrollTop = liste.scrollHeight;
        } catch (e) {
            console.error('Erreur chargement messages:', e);
        }
    }

    async function envoyer() {
        const input = document.getElementById('input-message');
        const contenu = input?.value?.trim();
        if (!contenu || !_convId) return;

        input.value = '';
        input.focus();

        /* Optimistic UI: ajouter le message immédiatement */
        const liste = document.getElementById('liste-messages');
        if (liste) {
            const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const bulleHtml = `
            <div class="flex justify-end mb-1.5 bulle-entree">
                <div class="max-w-[82%] bulle-moi px-3 py-2 shadow-sm">
                    <p class="text-[13.5px] leading-relaxed text-white whitespace-pre-wrap break-words">${ApiEsikaTok.echapperHtml(contenu)}</p>
                    <div class="flex items-center justify-end gap-0.5 -mb-0.5 mt-1">
                        <span class="text-[10px] text-white/40 leading-none">${heure}</span>
                        <svg class="w-3 h-3 ml-1 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>
                    </div>
                </div>
            </div>`;
            const typingEl = document.getElementById('typing-indicator');
            if (typingEl) typingEl.insertAdjacentHTML('beforebegin', bulleHtml);
            else liste.insertAdjacentHTML('beforeend', bulleHtml);
            liste.scrollTop = liste.scrollHeight;
        }

        try {
            await ApiEsikaTok.messagerie.envoyer(_convId, contenu);
            _lastMsgCount = 0;
            await chargerMessages();
        } catch (e) {
            Composants.afficherToast("Erreur lors de l'envoi.", 'erreur');
            _lastMsgCount = 0;
            await chargerMessages();
        }
    }

    function onTyping() {
        /* Visual feedback: pulse le bouton envoyer quand on tape */
        const btn = document.getElementById('btn-envoyer');
        const input = document.getElementById('input-message');
        if (btn && input) {
            if (input.value.trim()) {
                btn.classList.remove('bg-primaire-600', 'shadow-primaire-600/20');
                btn.classList.add('bg-green-600', 'shadow-green-600/30');
            } else {
                btn.classList.remove('bg-green-600', 'shadow-green-600/30');
                btn.classList.add('bg-primaire-600', 'shadow-primaire-600/20');
            }
        }
    }

    function detruire() {
        if (_intervalle) { clearInterval(_intervalle); _intervalle = null; }
        if (_typingTimer) { clearTimeout(_typingTimer); _typingTimer = null; }
        _convId = null;
        _convData = null;
        _lastMsgCount = 0;
        BadgeManager.forcer();
    }

    return { afficher, initialiser, envoyer, detruire, onTyping };
})();
