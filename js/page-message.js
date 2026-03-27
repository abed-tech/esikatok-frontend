/**
 * Page Message (Chat) - EsikaTok.
 * Interface chat premium — couleurs plateforme (bleu primaire).
 * Vidéo du bien épinglée en miniature, bulles, double-check, zone de saisie fixe.
 */
const PageMessage = (() => {
    let _convId = null;
    let _intervalle = null;
    let _convData = null;
    let _lastMsgCount = 0;
    let _typingTimer = null;

    /* --- Utilitaires date --- */
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

    /* --- Double checkmark (bleu = lu, gris = envoyé) --- */
    function checksStatus(estMoi, estLu) {
        if (!estMoi) return '';
        const color = estLu ? '#60a5fa' : 'rgba(255,255,255,0.35)';
        return `<svg class="w-4 h-3 ml-1 flex-shrink-0" viewBox="0 0 20 12" fill="none"><path d="M1 6l4 4 8-8" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6l4 4 8-8" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    /* --- Typing indicator --- */
    function typingIndicator() {
        return `<div id="typing-indicator" class="hidden flex justify-start mb-2 bulle-entree">
            <div class="bulle-autre px-4 py-3 flex items-center gap-1.5">
                <div class="typing-dot w-2 h-2 rounded-full bg-primaire-400"></div>
                <div class="typing-dot w-2 h-2 rounded-full bg-primaire-400"></div>
                <div class="typing-dot w-2 h-2 rounded-full bg-primaire-400"></div>
            </div>
        </div>`;
    }

    /* --- Header de chat --- */
    function chatHeader(conv, autre) {
        return `
        <div class="flex-shrink-0 bg-sombre-900 border-b border-sombre-700/40">
            <div class="flex items-center h-14 px-2 max-w-lg mx-auto">
                <button onclick="EsikaTok.retour()" class="p-2 -ml-1 rounded-full hover:bg-sombre-800 transition flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div onclick="${conv?.bien_id ? `EsikaTok.naviguer('detail',{id:${conv.bien_id}})` : ''}" class="flex items-center gap-3 flex-1 min-w-0 ml-1 cursor-pointer">
                    <div class="relative flex-shrink-0">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primaire-500 to-primaire-700 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                            ${autre?.photo ? `<img src="${autre.photo}" class="w-full h-full object-cover">` : (autre?.prenom || 'U').charAt(0)}
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-white truncate">${autre?.prenom || ''} ${autre?.nom || ''}</p>
                        <p class="text-[11px] text-sombre-200 truncate">${conv?.bien_titre ? '🏠 ' + conv.bien_titre : ''}</p>
                    </div>
                </div>
            </div>
        </div>`;
    }

    /* --- Carte bien épinglée avec miniature vidéo --- */
    function carteBienEpinglee(conv) {
        if (!conv || !conv.bien_id) return '';
        const titre = conv.bien_titre || 'Bien immobilier';
        const miniature = conv.bien_miniature || '';
        const videoUrl = conv.bien_video_url || '';
        const prix = conv.bien_prix || '';
        return `
        <div class="flex-shrink-0">
            <div onclick="EsikaTok.naviguer('detail',{id:${conv.bien_id}})" class="mx-3 mt-2 mb-1 p-2.5 bg-sombre-800 border border-sombre-700/50 rounded-xl cursor-pointer hover:bg-sombre-800/80 active:bg-sombre-700 transition group">
                <div class="flex gap-3 items-center">
                    <div class="w-14 h-14 rounded-lg overflow-hidden bg-sombre-700 flex-shrink-0 relative">
                        ${miniature ? `<img src="${miniature}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full bg-gradient-to-br from-primaire-900/60 to-sombre-700 flex items-center justify-center">
                            <svg class="w-6 h-6 text-primaire-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>`}
                        ${(videoUrl || !miniature) ? `<div class="absolute inset-0 flex items-center justify-center bg-black/30"><svg class="w-5 h-5 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>` : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[13px] font-medium text-white truncate">${titre}</p>
                        ${prix ? `<p class="text-xs font-bold text-accent-400 mt-0.5">${prix}</p>` : ''}
                        <p class="text-[10px] text-primaire-400 mt-1 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            Voir l'annonce
                        </p>
                    </div>
                    <svg class="w-4 h-4 text-sombre-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>
            </div>
        </div>`;
    }

    /* ================================================================
       AFFICHER — structure HTML de la page chat
       Layout: flex-col h-full, zone de saisie TOUJOURS visible en bas
       ================================================================ */
    function afficher(params) {
        _convId = params?.id;
        return `
        <div class="h-full flex flex-col bg-sombre-900" style="max-height:100%;overflow:hidden">
            <!-- Header -->
            <div id="chat-header" class="flex-shrink-0"></div>
            <!-- Carte bien épinglée (miniature vidéo) -->
            <div id="bien-epingle" class="flex-shrink-0"></div>
            <!-- Zone messages (prend tout l'espace restant) -->
            <div id="liste-messages" class="flex-1 min-h-0 overflow-y-auto chat-scroll chat-bg px-3 py-3">
                ${Composants.loader()}
            </div>
            <!-- ====== ZONE DE SAISIE (toujours visible) ====== -->
            <div class="chat-saisie bg-sombre-900 border-t border-sombre-700/40 px-3 py-2.5 safe-bottom">
                <div class="flex items-center gap-2 max-w-lg mx-auto">
                    <input type="text" id="input-message" placeholder="Écrire un message..."
                        class="flex-1 h-11 pl-4 pr-4 bg-sombre-800 border border-sombre-700/50 rounded-full text-sm text-white placeholder-sombre-200/50 focus:outline-none focus:border-primaire-500 focus:ring-2 focus:ring-primaire-500/20 transition-all"
                        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();PageMessage.envoyer()}"
                        oninput="PageMessage.onTyping()" autocomplete="off">
                    <button id="btn-envoyer" onclick="PageMessage.envoyer()"
                        class="w-11 h-11 bg-primaire-600 rounded-full flex items-center justify-center text-white hover:bg-primaire-500 active:scale-95 transition-all shadow-lg shadow-primaire-600/25 flex-shrink-0">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
        </div>`;
    }

    async function initialiser(params) {
        _convId = params?.id;
        _lastMsgCount = 0;
        if (!_convId) return;

        /* Charger les données de conversation depuis le cache */
        const convs = EtatApp.obtenir('conversations') || [];
        _convData = convs.find(c => c.id === _convId) || null;

        await chargerMessages();

        BadgeManager.forcer();
        _intervalle = setInterval(chargerMessages, 5000);

        /* Focus automatique sur l'input */
        setTimeout(() => {
            const input = document.getElementById('input-message');
            if (input) input.focus();
        }, 300);
    }

    async function chargerMessages() {
        if (!_convId) return;
        if (!EtatApp.estConnecte()) { detruire(); return; }
        try {
            const donnees = await ApiEsikaTok.messagerie.messages(_convId);
            const msgs = donnees.messages || donnees.results || donnees || [];
            const conv = donnees.conversation || _convData;
            if (conv) _convData = conv;

            /* Header + carte bien épinglée (render une seule fois) */
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
                    <p class="text-white text-sm font-medium">Aucun message</p>
                    <p class="text-sombre-200/60 text-xs mt-1">Envoyez le premier message !</p>
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
                    <div class="max-w-[80%] ${estMoi ? 'bulle-moi' : 'bulle-autre'} px-3.5 py-2 shadow-sm">
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
        onTyping();

        /* Optimistic UI: message apparaît immédiatement */
        const liste = document.getElementById('liste-messages');
        if (liste) {
            const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const bulleHtml = `
            <div class="flex justify-end mb-1.5 bulle-entree">
                <div class="max-w-[80%] bulle-moi px-3.5 py-2 shadow-sm opacity-80">
                    <p class="text-[13.5px] leading-relaxed text-white whitespace-pre-wrap break-words">${ApiEsikaTok.echapperHtml(contenu)}</p>
                    <div class="flex items-center justify-end gap-0.5 -mb-0.5 mt-1">
                        <span class="text-[10px] text-white/40 leading-none">${heure}</span>
                        <svg class="w-3.5 h-3 ml-1" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/></svg>
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
        const btn = document.getElementById('btn-envoyer');
        const input = document.getElementById('input-message');
        if (btn && input) {
            if (input.value.trim()) {
                btn.classList.remove('bg-primaire-600', 'shadow-primaire-600/25');
                btn.classList.add('bg-primaire-500', 'shadow-primaire-500/40', 'scale-105');
            } else {
                btn.classList.remove('bg-primaire-500', 'shadow-primaire-500/40', 'scale-105');
                btn.classList.add('bg-primaire-600', 'shadow-primaire-600/25');
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
