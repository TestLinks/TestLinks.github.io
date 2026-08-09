// ==UserScript==
// @name         Bypass de work.ink
// @namespace    http://tampermonkey.net/
// @version      1.67
// @description  Haz bypass a workInk usando un Bypass Tool. EASx Nigger lmao. Skipped on Top
// @author       TheRealBanHammer
// @license      MIT
// @match        https://work.ink/*
// @exclude      https://work.ink/token/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=work.ink
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      evade.bypass.tools
// @connect      work.ink
// @homepageURL  https://antihambreadoscriptteam.github.io/
// @supportURL   https://discord.gg/rTGF5xhe3h
// ==/UserScript==

(function() {
    "use strict";

    const DEBUG = true;
    const BUILD = "2026-09-08-01";
    const EVADE_BASE = "https://evade.bypass.tools";
    const TURNSTILE_SITE_KEY = "0x4AAAAAAAJoXhmMXwq7jgK9";
    const HCAPTCHA_SITE_KEY = "74184788-498a-4910-ba14-be9c2acc3f98";
    const WORKINK_OUTER_KEY = "FOyWLycLacw35PbZpwK8Q3N6ouw6PBQ2snZHMIDmXrUXoCUXv7XgOiVlrl9NMn2p";
    const WORKINK_INNER_KEY = "FMEB197nNpP8ge1zElwAHAqufR3U7KZ4jIDqBPQzous0k5cUkjQ96994zIM0qSFd";
    const SERVER_PACKET = Object.freeze({
        ERROR: "s_errx",
        HCAPTCHA_OKAY: "s_hcok",
        LINK_DESTINATION: "s_lkds",
        LINK_INFO: "s_lkif",
        MONETIZATION: "s_mntz",
        MONETIZATION_DATA: "s_mntd",
        OFFERS_STATE: "s_ofst",
        OFFER_URLS: "s_ofur",
        START_HCAPTCHA_CHECK: "s_sthc",
        START_TURNSTILE_CHECK: "s_tstc",
        TURNSTILE_ACTION: "s_tsac"
    });
    const PACKET_SCHEMA = Object.freeze({
        [SERVER_PACKET.LINK_INFO]: { monetizations: "array", monetizationsNeeded: "number" },
        [SERVER_PACKET.OFFER_URLS]: { urlOverrides: "object", authorized: "array" },
        [SERVER_PACKET.OFFERS_STATE]: { completedOffers: "number", neededOffers: "number" },
        [SERVER_PACKET.LINK_DESTINATION]: { url: "string" },
        [SERVER_PACKET.MONETIZATION]: { type: "string", payload: "object" }
    });
    const MINIMUM_REDIRECT_SECONDS = 30;
    const CUSTOM_OFFER_READY_TIMEOUT = 20000;
    const CUSTOM_OFFER_PROGRESS_TIMEOUT = 45000;
    const OFFER_GOAL_GRACE_TIMEOUT = 30000;
    const OFFER_STATE_SYNC_TIMEOUT = 5000;
    const DESTINATION_TIMEOUT = 60000;
    const PREMIUM_WALL_GRACE_MS = 1500;

    if (location.pathname.startsWith("/token/")) return;

    const oldLog = unsafeWindow.console.log.bind(unsafeWindow.console);
    const oldWarn = unsafeWindow.console.warn.bind(unsafeWindow.console);
    const oldError = unsafeWindow.console.error.bind(unsafeWindow.console);

    function log(...args) { if (DEBUG) oldLog("[Desacortador/Transmisión]", ...args); }
    function warn(...args) { if (DEBUG) oldWarn("[Desacortador/Transmisión]", ...args); }
    function error(...args) { if (DEBUG) oldError("[Desacortador/Transmisión]", ...args); }

    const document = unsafeWindow.document;
    const startTime = Date.now();
    const relaySession = Math.random().toString(36).substring(2, 15);
    const originalWebSocket = unsafeWindow.WebSocket;

    let realWebSocket = null;
    let initData = null;
    let finished = false;
    let executionStarted = false;
    let socialDone = null;
    let monetizationDone = null;
    let offersDone = null;
    let destinationResolve = null;
    let linkInfoTimer = null;
    let pingTimer = null;
    let redirectScheduled = false;
    let relayMessageSequence = 0;
    let relayNegotiationQueue = Promise.resolve();
    let monetizationDefinitionsPromise = null;
    let latestTurnstileAction = null;
    let latestOffersState = null;
    let linkInfoReceivedAt = null;
    let offersStateSynced = false;
    let turnstileSolveSequence = 0;
    let hcaptchaSolveSequence = 0;
    const serverPacketHistory = [];
    const serverPacketWaiters = new Set();
    const debugState = {
        build: BUILD,
        phase: "initializing",
        status: [],
        sent: [],
        packets: [],
        protocol: {
            schemas: {},
            mismatches: [],
            decodeFailures: [],
            relayExecution: null,
            sessionToken: null,
            serverError: null
        },
        monetizations: [],
        latestOffersState: null,
        linkInfo: null,
        monetizationData: null,
        offerAuthorization: null,
        offerSync: null,
        premiumWall: null,
        destinationWait: null
    };

    function packetShape(payload) {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return Array.isArray(payload) ? "array" : typeof payload;
        }
        return Object.fromEntries(Object.keys(payload).sort().map((key) => [
            key,
            Array.isArray(payload[key]) ? "array" : payload[key] === null ? "null" : typeof payload[key]
        ]));
    }

    function recordProtocolMismatch(mismatch, raw = null) {
        if (debugState.protocol.mismatches.some((item) =>
            item.type === mismatch.type && item.kind === mismatch.kind
        )) return;
        const entry = {
            time: Date.now(),
            ...mismatch,
            raw: raw?.slice(0, 25000) || null,
            rawLength: raw?.length || null
        };
        debugState.protocol.mismatches.push(entry);
        if (debugState.protocol.mismatches.length > 20) debugState.protocol.mismatches.shift();
        warn("Incompatibilidad de protocolo", { ...mismatch, rawLength: entry.rawLength });
    }

    function inspectPacket(packet, sequence, raw) {
        const expected = PACKET_SCHEMA[packet.type];
        if (!expected) return;
        const current = packetShape(packet.payload);
        const changed = Object.entries(expected)
            .filter(([key, type]) => current[key] !== type)
            .map(([key, type]) => ({ key, expected: type, received: current[key] || "missing" }));
        debugState.protocol.schemas[packet.type] = { sequence, shape: current };
        if (changed.length > 0) {
            recordProtocolMismatch({ type: packet.type, kind: "schema-changed", sequence, changed, current }, raw);
        }
    }

    debugState.packetReport = () => JSON.parse(JSON.stringify(debugState.protocol));

    unsafeWindow.__workinkRelayDebug = debugState;

    log("Compilación cargada", BUILD);

    const previousOverflow = document.documentElement.style.overflow;
    const container = document.createElement("div");
    container.id = "trbh-workink-interface";
    Object.assign(container.style, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483647"
    });

    const shadow = container.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
        :host {
            all: initial;
        }

        *, *::before, *::after {
            box-sizing: border-box;
        }

        .overlay {
            --background: #000000;
            --surface: rgba(18, 18, 20, 0.72);
            --accent: #ef4444;
            --accent-strong: #dc2626;
            --border: rgba(255, 255, 255, 0.14);
            --text: #fffafa;
            --muted: #b6b3b5;
            position: fixed;
            inset: 0;
            isolation: isolate;
            display: grid;
            place-items: center;
            width: 100vw;
            min-height: 100vh;
            min-height: 100dvh;
            padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
            overflow: auto;
            background:
                radial-gradient(circle at 84% 12%, rgba(239, 68, 68, 0.16), transparent 30%),
                radial-gradient(circle at 12% 88%, rgba(127, 29, 29, 0.2), transparent 34%),
                linear-gradient(145deg, #050505, var(--background) 56%);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI Variable", "Segoe UI", sans-serif;
        }

        .overlay::before,
        .overlay::after {
            content: "";
            position: fixed;
            z-index: -1;
            width: 360px;
            height: 360px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.16);
            filter: blur(90px);
            opacity: 0.9;
        }

        .overlay::before {
            top: -170px;
            right: -90px;
        }

        .overlay::after {
            left: -130px;
            bottom: -200px;
            width: 440px;
            height: 440px;
            background: rgba(127, 29, 29, 0.2);
        }

        .card {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: min(520px, calc(100vw - 40px));
            min-height: 420px;
            padding: 34px;
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 32px;
            background:
                radial-gradient(circle at 82% 0%, rgba(255, 255, 255, 0.12), transparent 34%),
                linear-gradient(145deg, rgba(38, 36, 38, 0.76), rgba(12, 12, 14, 0.62));
            -webkit-backdrop-filter: blur(30px) saturate(165%);
            backdrop-filter: blur(30px) saturate(165%);
            box-shadow:
                0 32px 100px rgba(0, 0, 0, 0.62),
                inset 0 1px 0 rgba(255, 255, 255, 0.19),
                inset 0 -1px 0 rgba(255, 255, 255, 0.04);
            text-align: center;
            animation: enter 0.68s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card::before {
            content: "";
            position: absolute;
            inset: 1px;
            border-radius: 31px;
            background:
                linear-gradient(115deg, rgba(255, 255, 255, 0.12), transparent 28%),
                radial-gradient(circle at 18% 10%, rgba(239, 68, 68, 0.12), transparent 38%);
            pointer-events: none;
        }

        .card::after {
            content: "";
            position: absolute;
            top: 0;
            left: 14%;
            width: 72%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
            opacity: 0.54;
            pointer-events: none;
        }

        .card > * {
            position: relative;
            z-index: 1;
        }

        .brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            margin-bottom: 34px;
        }

        .mark {
            display: grid;
            flex: 0 0 auto;
            place-items: center;
            width: 42px;
            height: 42px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 14px;
            background:
                linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.035)),
                rgba(239, 68, 68, 0.08);
            -webkit-backdrop-filter: blur(14px) saturate(150%);
            backdrop-filter: blur(14px) saturate(150%);
            box-shadow:
                0 10px 28px rgba(0, 0, 0, 0.28),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .mark img {
            display: block;
            width: 28px;
            height: 28px;
            filter: drop-shadow(0 8px 16px rgba(239, 68, 68, 0.22));
        }

        .wordmark {
            display: inline-flex;
            align-items: baseline;
            font-size: 1.25rem;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.045em;
            white-space: nowrap;
        }

        .wordmark span:first-child {
            color: var(--accent);
        }

        .wordmark span:last-child {
            color: var(--text);
        }

        .title {
            margin: 0 0 14px;
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI Variable", "Segoe UI", sans-serif;
            font-size: clamp(2rem, 3.5vw, 3rem);
            font-weight: 800;
            line-height: 1.05;
            letter-spacing: -0.035em;
        }

        .subtitle {
            margin: 0 0 1.8rem;
            color: var(--muted);
            font-size: 1rem;
            line-height: 1.65;
        }

        .status {
            width: 100%;
            margin: 20px 0 0;
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.09);
            border-radius: 20px;
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.065), rgba(255, 255, 255, 0.022));
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.08),
                0 12px 28px rgba(0, 0, 0, 0.18);
        }

        .progress-track {
            width: 100%;
            height: 10px;
            overflow: hidden;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.055);
            background: rgba(0, 0, 0, 0.42);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.56);
        }

        .progress-bar {
            width: 5%;
            height: 100%;
            border-radius: inherit;
            background: linear-gradient(90deg, var(--accent), #dc2626);
            box-shadow: 0 0 22px rgba(239, 68, 68, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transition: width 0.3s ease, background 0.2s ease;
        }

        .status-detail {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            min-height: 44px;
            padding: 15px 2px 0;
            color: #e4e4e7;
            font-size: 0.9rem;
            font-weight: 650;
            line-height: 1.35;
            text-align: left;
        }

        .status-main {
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }

        .spinner {
            flex: 0 0 auto;
            width: 24px;
            height: 24px;
            border: 3px solid var(--border);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .runtime {
            flex: 0 0 auto;
            color: #ffb4ae;
            font-weight: 850;
            white-space: nowrap;
        }

        .captcha-host:not(:empty) {
            display: grid;
            place-items: center;
            width: 100%;
            margin-top: 18px;
            padding: 18px;
            overflow-x: auto;
            border: 1px solid rgba(255, 255, 255, 0.11);
            border-radius: 22px;
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025));
            -webkit-backdrop-filter: blur(18px) saturate(145%);
            backdrop-filter: blur(18px) saturate(145%);
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                0 14px 34px rgba(0, 0, 0, 0.22);
            animation: captcha-in 0.32s ease-out;
        }

        .captcha-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            min-width: 0;
            color: var(--text);
        }

        .captcha-label {
            color: #f4f4f5;
            font-size: 0.875rem;
            font-weight: 700;
            line-height: 1.35;
        }

        .captcha-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 300px;
            min-height: 65px;
        }

        .footer {
            margin-top: auto;
            padding-top: 26px;
            color: #6f6b6e;
            font-size: 0.78rem;
        }

        .footer a {
            color: #8d888b;
            text-decoration: none;
        }

        .footer a:hover,
        .footer a:focus-visible {
            color: var(--accent);
            outline: none;
        }

        .card[data-state="error"] .progress-bar {
            background: #ef4444;
            box-shadow: 0 0 24px rgba(239, 68, 68, 0.42);
        }

        .card[data-state="error"] .spinner {
            border-color: rgba(239, 68, 68, 0.28);
            border-top-color: #ef4444;
            animation: none;
        }

        .card[data-state="error"] .status-detail,
        .card[data-state="error"] .runtime {
            color: #fda4af;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @keyframes enter {
            0% { opacity: 0; transform: translateY(28px) scale(0.96); filter: blur(10px); }
            60% { opacity: 1; transform: translateY(-2px) scale(1.01); filter: blur(0); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes captcha-in {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
            .overlay {
                padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
            }

            .card {
                width: calc(100vw - 16px);
                min-height: auto;
                padding: 22px 16px;
                border-radius: 28px;
                -webkit-backdrop-filter: blur(22px) saturate(150%);
                backdrop-filter: blur(22px) saturate(150%);
            }

            .card::before {
                border-radius: 27px;
            }

            .brand {
                margin-bottom: 26px;
            }

            .title {
                font-size: 2rem;
            }

            .status-detail {
                align-items: flex-start;
                font-size: 0.84rem;
            }

            .status {
                padding: 14px;
                border-radius: 18px;
            }

            .captcha-host:not(:empty) {
                padding: 14px 4px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .card,
            .spinner,
            .captcha-host:not(:empty) {
                animation: none;
            }

            .progress-bar {
                transition: none;
            }
        }

        @media (prefers-reduced-transparency: reduce) {
            .card,
            .mark,
            .captcha-host:not(:empty) {
                background: #171719;
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }

        @supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
            .card {
                background: #171719;
            }

            .mark,
            .captcha-host:not(:empty) {
                background: #202023;
            }
        }
    `;

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "trbh-interface-title");
    overlay.setAttribute("aria-describedby", "trbh-interface-subtitle");

    const card = document.createElement("section");
    card.className = "card";
    card.dataset.state = "working";

    const brand = document.createElement("div");
    brand.className = "brand";
    const mark = document.createElement("div");
    mark.className = "mark";
    const logo = document.createElement("img");
    logo.src = "https://bypass.tools/favicon-96x96.png";
    logo.alt = "";
    logo.setAttribute("aria-hidden", "true");
    const wordmark = document.createElement("div");
    wordmark.className = "wordmark";
    const wordmarkFirst = document.createElement("span");
    wordmarkFirst.textContent = "Bypass";
    const wordmarkLast = document.createElement("span");
    wordmarkLast.textContent = "Tools";
    mark.appendChild(logo);
    wordmark.append(wordmarkFirst, wordmarkLast);
    brand.append(mark, wordmark);

    const title = document.createElement("h1");
    title.id = "trbh-interface-title";
    title.className = "title";
    title.textContent = "Bypass de Work.ink";

    const subtitle = document.createElement("p");
    subtitle.id = "trbh-interface-subtitle";
    subtitle.className = "subtitle";
    subtitle.textContent = "Procesando el enlace de forma segura.";

    const status = document.createElement("div");
    status.className = "status";
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    const progressTrack = document.createElement("div");
    progressTrack.className = "progress-track";
    progressTrack.setAttribute("role", "progressbar");
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", "100");
    progressTrack.setAttribute("aria-valuenow", "5");
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressTrack.appendChild(progressBar);
    const statusDetail = document.createElement("div");
    statusDetail.className = "status-detail";
    const statusMain = document.createElement("span");
    statusMain.className = "status-main";
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    const statusText = document.createElement("span");
    statusText.textContent = "Conectando con la retransmisión de BypassTools...";
    const runtimeText = document.createElement("span");
    runtimeText.className = "runtime";
    runtimeText.textContent = "Transcurrido 0s";
    statusMain.append(spinner, statusText);
    statusDetail.append(statusMain, runtimeText);
    status.append(progressTrack, statusDetail);

    const captchaHost = document.createElement("div");
    captchaHost.className = "captcha-host";

    const footer = document.createElement("div");
    footer.className = "footer";
    const footerLink = document.createElement("a");
    footerLink.href = "https://bypass.tools";
    footerLink.target = "_blank";
    footerLink.rel = "noopener noreferrer";
    footerLink.textContent = "BypassTools";
    footer.append("Impulsado por ", footerLink, ` · ${BUILD}`);

    card.append(brand, title, subtitle, status, captchaHost, footer);
    overlay.appendChild(card);
    shadow.append(style, overlay);
    document.documentElement.appendChild(container);
    document.documentElement.style.overflow = "hidden";

    let statusProgress = 5;
    let interfaceDismissed = false;
    let loginPromptShown = false;
    const runtimeTimer = setInterval(() => {
        if (interfaceDismissed || card.dataset.state === "error") return;
        runtimeText.textContent = `Transcurrido ${Math.floor((Date.now() - startTime) / 1000)}s`;
    }, 1000);

    function dismissInterface() {
        if (interfaceDismissed) return;
        interfaceDismissed = true;
        clearInterval(runtimeTimer);
        container.remove();
        document.documentElement.style.overflow = previousOverflow;
    }

    function isLoginError(message) {
        const normalized = String(message || "").toLowerCase();
        return normalized.includes("customer session token") ||
            normalized.includes("session token") ||
            normalized.includes("not logged in") ||
            normalized.includes("not signed in") ||
            normalized.includes("inicia sesión");
    }

    function showLoginRequired() {
        if (loginPromptShown) return;
        loginPromptShown = true;
        finished = true;
        if (linkInfoTimer) clearTimeout(linkInfoTimer);
        if (pingTimer) clearTimeout(pingTimer);
        try { realWebSocket?.close(); } catch {}
        unsafeWindow.WebSocket = originalWebSocket;
        dismissInterface();
        setTimeout(() => {
            unsafeWindow.alert("Debes iniciar sesión en Work.ink para continuar. Inicia sesión y vuelve a cargar esta página.");
        }, 25);
    }

    function updateStatus(message, progress = null) {
        if (!interfaceDismissed) {
            statusProgress = progress === null
                ? Math.min(92, statusProgress + (statusProgress < 30 ? 4 : 2))
                : Math.max(5, Math.min(100, progress));
            card.dataset.state = "working";
            statusText.textContent = message;
            progressBar.style.width = `${statusProgress}%`;
            progressTrack.setAttribute("aria-valuenow", String(statusProgress));
        }
        debugState.phase = message;
        debugState.status.push({ time: Date.now(), message });
        if (debugState.status.length > 100) debugState.status.shift();
        log(message);
    }

    function showError(message) {
        updateStatus(`Error: ${message}`, 100);
        if (!interfaceDismissed) {
            card.dataset.state = "error";
            runtimeText.textContent = "Error";
        }
    }

    function redirect(destination) {
        if (!destination || redirectScheduled) return;
        redirectScheduled = true;
        unsafeWindow.wokeresponse = destination;

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        let remaining = Math.max(0, MINIMUM_REDIRECT_SECONDS - elapsed);

        const tick = () => {
            if (remaining <= 0) {
                updateStatus("Redirigiendo al destino...", 100);
                unsafeWindow.location.href = destination;
                return;
            }

            updateStatus(`Bypass completado. Redirigiendo en ${remaining}s...`, 100);
            remaining -= 1;
            setTimeout(tick, 1000);
        };

        tick();
    }

    function gmFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: options.method || "GET",
                url,
                headers: options.headers || {},
                data: options.body,
                timeout: options.timeout || 30000,
                onload(response) {
                    resolve({
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        headers: response.responseHeaders || "",
                        text: () => Promise.resolve(response.responseText),
                        json: () => Promise.resolve(JSON.parse(response.responseText))
                    });
                },
                onerror: reject,
                ontimeout: () => reject(new Error(`La solicitud agotó el tiempo de espera: ${url}`))
            });
        });
    }

    function pageFetchJson(url, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const request = new unsafeWindow.XMLHttpRequest();
            request.open("GET", url, true);
            request.withCredentials = true;
            request.timeout = timeout;
            request.onload = () => {
                if (request.status < 200 || request.status >= 300) {
                    reject(new Error(`La solicitud de la página devolvió ${request.status}`));
                    return;
                }

                try {
                    resolve(JSON.parse(request.responseText));
                } catch (parseError) {
                    reject(parseError);
                }
            };
            request.onerror = () => reject(new Error("La solicitud de la página falló"));
            request.ontimeout = () => reject(new Error(`La solicitud de la página agotó el tiempo de espera: ${url}`));
            request.send();
        });
    }

    function sleep(milliseconds) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    function waitForBody() {
        if (document.body) return Promise.resolve(document.body);

        return new Promise((resolve) => {
            const timer = setInterval(() => {
                if (!document.body) return;
                clearInterval(timer);
                resolve(document.body);
            }, 50);
        });
    }

    function waitForMonocle() {
        return new Promise((resolve, reject) => {
            const started = Date.now();
            const timer = setInterval(() => {
                const input = document.querySelector('form.monocle-enriched input[name="monocle"]');
                if (input?.value?.length > 0) {
                    clearInterval(timer);
                    resolve(input.value);
                    return;
                }

                if (Date.now() - started >= 60000) {
                    clearInterval(timer);
                    reject(new Error("No se generó el token de verificación del bot"));
                }
            }, 200);
        });
    }

    function createCaptchaPanel(id, title) {
        shadow.getElementById(`${id}-panel`)?.remove();

        const panel = document.createElement("div");
        panel.id = `${id}-panel`;
        panel.className = "captcha-panel";

        const label = document.createElement("div");
        label.className = "captcha-label";
        label.textContent = title;

        const captchaContainer = document.createElement("div");
        captchaContainer.id = id;
        captchaContainer.className = "captcha-container";

        panel.append(label, captchaContainer);
        captchaHost.replaceChildren(panel);
        return { panel, captchaContainer };
    }

    function loadExternalScript(id, source) {
        if (document.getElementById(id)) return;

        const script = document.createElement("script");
        script.id = id;
        script.src = source;
        script.async = true;
        script.defer = true;
        (document.head || document.documentElement).appendChild(script);
    }

    function solveTurnstile(
        action,
        title = "Completa la verificación de seguridad",
        status = "Completa la verificación de Turnstile..."
    ) {
        return new Promise((resolve, reject) => {
            loadExternalScript(
                "workink-relay-turnstile-script",
                "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            );

            const captchaId = `workink-relay-turnstile-${++turnstileSolveSequence}`;
            const { panel, captchaContainer } = createCaptchaPanel(
                captchaId,
                title
            );
            updateStatus(status);

            const started = Date.now();
            const timer = setInterval(() => {
                const turnstile = unsafeWindow.turnstile;
                if (typeof turnstile?.render !== "function") {
                    if (Date.now() - started < 30000) return;
                    clearInterval(timer);
                    panel.remove();
                    reject(new Error("No se pudo cargar Turnstile"));
                    return;
                }

                clearInterval(timer);
                try {
                    const options = {
                        sitekey: TURNSTILE_SITE_KEY,
                        theme: "dark",
                        callback(token) {
                            panel.remove();
                            resolve(token);
                        },
                        "error-callback"(turnstileError) {
                            panel.remove();
                            reject(new Error(`Error de Turnstile: ${turnstileError}`));
                        }
                    };
                    if (action) options.action = action;
                    turnstile.render(captchaContainer, options);
                } catch (turnstileError) {
                    panel.remove();
                    reject(turnstileError);
                }
            }, 100);
        });
    }

    function solveHcaptcha(
        title = "Completa el desafío de hCaptcha",
        status = "Completa el desafío de hCaptcha..."
    ) {
        return new Promise((resolve, reject) => {
            loadExternalScript(
                "workink-relay-hcaptcha-script",
                "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=on&sentry=false"
            );

            const captchaId = `workink-relay-hcaptcha-${++hcaptchaSolveSequence}`;
            const { panel, captchaContainer } = createCaptchaPanel(captchaId, title);
            updateStatus(status);

            const started = Date.now();
            const timer = setInterval(() => {
                const hcaptcha = unsafeWindow.hcaptcha;
                if (typeof hcaptcha?.render !== "function") {
                    if (Date.now() - started < 30000) return;
                    clearInterval(timer);
                    panel.remove();
                    reject(new Error("No se pudo cargar hCaptcha"));
                    return;
                }

                clearInterval(timer);
                try {
                    hcaptcha.render(captchaContainer, {
                        sitekey: HCAPTCHA_SITE_KEY,
                        theme: "dark",
                        callback(token) {
                            panel.remove();
                            resolve(token);
                        },
                        "error-callback"(hcaptchaError) {
                            panel.remove();
                            reject(new Error(`Error de hCaptcha: ${hcaptchaError}`));
                        }
                    });
                } catch (hcaptchaError) {
                    panel.remove();
                    reject(hcaptchaError);
                }
            }, 100);
        });
    }

    function persistCustomerToken(token) {
        if (!token) return;

        for (const storageName of ["localStorage", "sessionStorage"]) {
            for (const key of ["customerToken", "customerSessionToken"]) {
                try {
                    unsafeWindow[storageName]?.setItem(key, token);
                } catch {}
            }
        }

        try { unsafeWindow.customerToken = token; } catch {}
        try { unsafeWindow.customerSessionToken = token; } catch {}
    }

    function inspectCustomerToken(token) {
        const info = {
            present: Boolean(token),
            length: typeof token === "string" ? token.length : 0,
            issuedAt: null,
            expiresAt: null,
            expired: false
        };
        if (!token || typeof token !== "string") return info;

        try {
            const encoded = token.split(".")[1];
            if (!encoded) return info;
            const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/")
                .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
            const payload = JSON.parse(unsafeWindow.atob(normalized));
            info.issuedAt = Number.isFinite(Number(payload.iat)) ? Number(payload.iat) : null;
            info.expiresAt = Number.isFinite(Number(payload.exp)) ? Number(payload.exp) : null;
            info.expired = info.expiresAt !== null && info.expiresAt * 1000 <= Date.now() + 30000;
        } catch {}

        return info;
    }

    function getStoredCustomerToken() {
        for (const storageName of ["localStorage", "sessionStorage"]) {
            for (const key of ["customerToken", "customerSessionToken"]) {
                try {
                    const token = unsafeWindow[storageName]?.getItem(key) || "";
                    const info = inspectCustomerToken(token);
                    if (token && !info.expired) return { token, source: `${storageName}.${key}`, info };
                } catch {}
            }
        }
        return null;
    }

    function clearCustomerToken(token) {
        if (!token) return;

        for (const storageName of ["localStorage", "sessionStorage"]) {
            for (const key of ["customerToken", "customerSessionToken"]) {
                try {
                    if (unsafeWindow[storageName]?.getItem(key) === token) {
                        unsafeWindow[storageName].removeItem(key);
                    }
                } catch {}
            }
        }

        try { if (unsafeWindow.customerToken === token) unsafeWindow.customerToken = ""; } catch {}
        try { if (unsafeWindow.customerSessionToken === token) unsafeWindow.customerSessionToken = ""; } catch {}
    }

    function sendRaw(message) {
        try {
            if (realWebSocket?.readyState === originalWebSocket.OPEN) {
                realWebSocket.send(message);
                const sent = { time: Date.now(), length: String(message).length };
                try {
                    const packet = decodeWorkinkPacket(String(message));
                    sent.type = packet.type;
                    sent.payloadKeys = packet.payload && typeof packet.payload === "object"
                        ? Object.keys(packet.payload)
                        : [];
                    sent.monetizationId = packet.payload?.monetizationId ?? null;
                } catch {}
                debugState.sent.push(sent);
                if (debugState.sent.length > 200) debugState.sent.shift();
                log("Paquete de retransmisión enviado", String(message).slice(0, 160));
            }
        } catch (sendError) {
            error("No se pudo enviar el paquete de retransmisión", sendError);
        }
    }

    function waitForSignal(register, timeout) {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                register(null);
                resolve(null);
            }, timeout);
            register((value) => {
                clearTimeout(timer);
                register(null);
                resolve(value);
            });
        });
    }

    function encodePacketPart(value, key) {
        const keyBytes = [...key].map((character) => character.charCodeAt(0) & 255);
        const valueBytes = new TextEncoder().encode(value);
        let seed = Date.now() % 256;
        let encoded = seed.toString(16).padStart(2, "0");

        for (let index = 0; index < valueBytes.length; index += 1) {
            const keyByte = keyBytes[(index * 2 + seed) % keyBytes.length];
            const encrypted = ((valueBytes[index] ^ keyByte) + index % 8) % 256;
            encoded += encrypted.toString(16).padStart(2, "0");
            seed = (seed * 19 + 29) % 256;
        }

        return encoded;
    }

    function decodePacketPart(value, key) {
        const keyBytes = [...key].map((character) => character.charCodeAt(0) & 255);
        const decoded = [];
        let seed = Number.parseInt(value.slice(0, 2), 16);

        for (let position = 2, index = 0; position < value.length; position += 2, index += 1) {
            const encrypted = Number.parseInt(value.slice(position, position + 2), 16);
            const keyByte = keyBytes[(index * 2 + seed) % keyBytes.length];
            const adjusted = (encrypted - index % 8 + 256) % 256;
            decoded.push((adjusted ^ keyByte) & 255);
            seed = (seed * 19 + 29) % 256;
        }

        return new TextDecoder().decode(Uint8Array.from(decoded));
    }

    function encodeWorkinkPacket(type, payload) {
        const encryptedPayload = encodePacketPart(JSON.stringify(payload), WORKINK_INNER_KEY);
        return encodePacketPart(JSON.stringify({ type, payload: encryptedPayload }), WORKINK_OUTER_KEY);
    }

    function decodeWorkinkPacket(value) {
        const parse = (data, key, stage) => {
            try {
                return JSON.parse(decodePacketPart(data, key));
            } catch (decodeError) {
                decodeError.stage = stage;
                throw decodeError;
            }
        };
        const packet = parse(value, WORKINK_OUTER_KEY, "outer");
        if (typeof packet?.type !== "string" || typeof packet?.payload !== "string") {
            throw Object.assign(new Error("Cambió la estructura del paquete"), { stage: "envelope" });
        }
        packet.payload = parse(packet.payload, WORKINK_INNER_KEY, "inner");
        return packet;
    }

    function waitForServerPacket(afterSequence, predicate, timeout) {
        const existing = serverPacketHistory.find((entry) =>
            entry.sequence > afterSequence && predicate(entry.packet)
        );
        if (existing) return Promise.resolve(existing);

        return new Promise((resolve) => {
            const waiter = {
                afterSequence,
                predicate,
                resolve(value) {
                    clearTimeout(waiter.timer);
                    serverPacketWaiters.delete(waiter);
                    resolve(value);
                },
                timer: null
            };
            waiter.timer = setTimeout(() => waiter.resolve(null), timeout);
            serverPacketWaiters.add(waiter);
        });
    }

    function publishServerPacket(packet, sequence) {
        const entry = { packet, sequence };
        serverPacketHistory.push(entry);
        if (serverPacketHistory.length > 100) serverPacketHistory.shift();

        for (const waiter of [...serverPacketWaiters]) {
            if (sequence <= waiter.afterSequence) continue;
            try {
                if (waiter.predicate(packet)) waiter.resolve(entry);
            } catch (predicateError) {
                error("Falló el filtro del paquete del servidor", predicateError);
                waiter.resolve(null);
            }
        }
    }

    function getOfferIds(packet) {
        if (packet.type !== SERVER_PACKET.OFFER_URLS) return [];
        if (Array.isArray(packet.payload)) return packet.payload;
        const authorized =
            packet.payload?.authorized ||
            packet.payload?.ids ||
            packet.payload?.offerIds ||
            packet.payload?.monetizationIds ||
            [];
        if (Array.isArray(authorized)) return authorized;
        if (authorized && typeof authorized === "object") {
            return Object.keys(authorized).filter((id) => authorized[id]);
        }
        return [];
    }

    function isOfferAuthorized(packet, id) {
        return getOfferIds(packet).some((offerId) => String(offerId) === String(id));
    }

    function handleDecodedServerPacket(packet, sequence, raw) {
        inspectPacket(packet, sequence, raw);
        const payload = packet.payload;
        const offerIds = getOfferIds(packet);
        const packetSummary = {
            sequence,
            time: Date.now(),
            type: packet.type,
            errorMessage: packet.type === SERVER_PACKET.ERROR
                ? String(payload?.message || "Error desconocido de WebSocket de Work.ink")
                : null,
            payloadKeys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 20) : [],
            monetizationId: payload?.monetizationId ?? null,
            offerIds,
            completedOffers: payload?.completedOffers ?? null,
            neededOffers: payload?.neededOffers ?? null,
            hasDestination: Boolean(payload?.url)
        };
        debugState.packets.push(packetSummary);
        if (debugState.packets.length > 300) debugState.packets.shift();
        log(`Mensaje de WebSocket decodificado #${sequence}`, packetSummary);

        if (packet.type === SERVER_PACKET.TURNSTILE_ACTION && payload) {
            latestTurnstileAction = typeof payload === "string" ? payload : payload.action || latestTurnstileAction;
        }

        if (packet.type === SERVER_PACKET.LINK_INFO && payload) {
            if (!linkInfoReceivedAt) linkInfoReceivedAt = Date.now();
            debugState.linkInfo = JSON.parse(JSON.stringify(payload));
            const neededOffers = Number(payload.monetizationsNeeded);
            if (!latestOffersState && Number.isFinite(neededOffers)) {
                latestOffersState = { completedOffers: 0, neededOffers, sequence };
                debugState.latestOffersState = { ...latestOffersState };
            }
        }

        if (packet.type === SERVER_PACKET.OFFER_URLS && payload) {
            debugState.offerAuthorization = JSON.parse(JSON.stringify(payload));
        }

        if (packet.type === SERVER_PACKET.MONETIZATION_DATA && payload) {
            debugState.monetizationData = JSON.parse(JSON.stringify(payload));
        }

        if (packet.type === SERVER_PACKET.OFFERS_STATE && payload) {
            const completedOffers = Number(payload.completedOffers);
            const neededOffers = Number(payload.neededOffers);
            if (Number.isFinite(completedOffers) && Number.isFinite(neededOffers)) {
                offersStateSynced = true;
                latestOffersState = { completedOffers, neededOffers, sequence };
                debugState.latestOffersState = { ...latestOffersState };
            }
        }

        publishServerPacket(packet, sequence);

        if (packet.type === SERVER_PACKET.ERROR) {
            const message = String(payload?.message || "Work.ink rechazó la conexión WebSocket");
            const invalidToken = isLoginError(message);
            const displayMessage = invalidToken
                ? "El token de sesión de Work.ink no es válido. Crea una cuenta o inicia sesión en Work.ink y vuelve a cargar esta página."
                : message;
            debugState.protocol.serverError = { sequence, time: Date.now(), message, displayMessage };
            if (invalidToken) clearCustomerToken(initData?.tok || "");
            if (linkInfoTimer) {
                clearTimeout(linkInfoTimer);
                linkInfoTimer = null;
            }
            finished = true;
            if (invalidToken) {
                showLoginRequired();
                return;
            }
            showError(displayMessage);
            try { realWebSocket?.close(); } catch {}
            return;
        }

        if (packet.type === SERVER_PACKET.LINK_DESTINATION && payload?.url && !redirectScheduled) {
            finished = true;
            if (destinationResolve) destinationResolve(payload.url);
            else redirect(payload.url);
        }
    }

    function getOfferProgress() {
        if (!latestOffersState) return null;
        return {
            completedOffers: latestOffersState.completedOffers,
            neededOffers: latestOffersState.neededOffers
        };
    }

    function isOfferGoalReached() {
        const progress = getOfferProgress();
        return Boolean(progress && progress.completedOffers >= progress.neededOffers);
    }

    function isOfferGoalPacket(packet) {
        return packet.type === SERVER_PACKET.OFFERS_STATE &&
            Number(packet.payload?.completedOffers) >= Number(packet.payload?.neededOffers);
    }

    function getPremiumWallSeconds() {
        const configuredSeconds = Number(debugState.linkInfo?.premiumWallSeconds);
        let visitCount = 0;
        try {
            visitCount = Number.parseInt(unsafeWindow.localStorage?.getItem("visitCount") || "0", 10) || 0;
        } catch {}
        const clientSeconds = Math.min(120, 60 + Math.max(0, visitCount) * 10);
        return Math.max(clientSeconds, Number.isFinite(configuredSeconds) ? configuredSeconds : 0);
    }

    async function waitForPremiumWall() {
        const seconds = getPremiumWallSeconds();
        const startedAt = linkInfoReceivedAt || Date.now();
        const deadline = startedAt + seconds * 1000 + PREMIUM_WALL_GRACE_MS;
        debugState.premiumWall = { seconds, startedAt, deadline, sentAt: null };
        log("Temporización del muro premium de Work.ink", debugState.premiumWall);

        let lastReported = null;
        while (!finished && Date.now() < deadline) {
            const remaining = Math.max(1, Math.ceil((deadline - Date.now()) / 1000));
            if (lastReported === null || remaining % 10 === 0 || remaining <= 5) {
                updateStatus(`Esperando el temporizador requerido de Work.ink (${remaining}s)...`);
                lastReported = remaining;
            }
            await sleep(Math.min(1000, Math.max(1, deadline - Date.now())));
        }
        return !finished;
    }

    async function waitForOfferStateSync() {
        if (offersStateSynced || finished) return;
        const afterSequence = relayMessageSequence;
        debugState.offerSync = { startedAt: Date.now(), afterSequence, result: "waiting" };
        updateStatus("Sincronizando el estado de ofertas de Work.ink...");
        const result = await waitForServerPacket(
            afterSequence,
            (packet) =>
                packet.type === SERVER_PACKET.OFFERS_STATE ||
                packet.type === SERVER_PACKET.LINK_DESTINATION ||
                packet.type === SERVER_PACKET.ERROR,
            OFFER_STATE_SYNC_TIMEOUT
        );
        debugState.offerSync.result = result?.packet?.type || (offersStateSynced ? "already-synced" : "timeout");
        debugState.offerSync.completedAt = Date.now();
    }

    async function authorizeCustomOffer(item, index, total, action) {
        if (isOfferGoalReached()) return true;
        const id = item.id;
        const turnstileToken = await solveTurnstile(
            latestTurnstileAction || action,
            `Verifica la monetización ${index + 1}/${total}`,
            `Completa la verificación de Turnstile para la monetización ${id}...`
        );
        const afterTurnstile = relayMessageSequence;
        const turnstileResult = waitForServerPacket(
            afterTurnstile,
            (packet) =>
                isOfferAuthorized(packet, id) ||
                isOfferGoalPacket(packet) ||
                packet.type === SERVER_PACKET.ERROR ||
                packet.type === SERVER_PACKET.START_TURNSTILE_CHECK &&
                    String(packet.payload?.monetizationId) === String(id) ||
                packet.type === SERVER_PACKET.START_HCAPTCHA_CHECK &&
                    String(packet.payload?.monetizationId) === String(id),
            CUSTOM_OFFER_READY_TIMEOUT
        );

        const turnstilePacket = encodeWorkinkPacket("c_turnstile_response", {
            token: turnstileToken,
            monetizationId: Number(id)
        });
        log(`Enviando el paquete de Turnstile de la monetización ${id}`, {
            packetLength: turnstilePacket.length,
            payloadKeys: ["token", "monetizationId"]
        });
        sendRaw(turnstilePacket);

        let result = await turnstileResult;
        if (!result || result.packet.type === SERVER_PACKET.ERROR) return false;
        if (isOfferGoalPacket(result.packet) || isOfferGoalReached()) return true;
        if (isOfferAuthorized(result.packet, id)) return true;
        if (result.packet.type === SERVER_PACKET.START_TURNSTILE_CHECK) return false;

        const requestedSolves = Math.max(1, Number.parseInt(result.packet.payload?.solvesNeeded, 10) || 1);
        for (let solve = 0; solve < requestedSolves; solve += 1) {
            const hcaptchaToken = await solveHcaptcha(
                `Verifica la monetización ${index + 1}/${total}`,
                `Completa hCaptcha ${solve + 1}/${requestedSolves} para la monetización ${id}...`
            );
            const afterHcaptcha = relayMessageSequence;
            const hcaptchaResult = waitForServerPacket(
                afterHcaptcha,
                (packet) =>
                    isOfferAuthorized(packet, id) ||
                    isOfferGoalPacket(packet) ||
                    packet.type === SERVER_PACKET.ERROR ||
                    packet.type === SERVER_PACKET.HCAPTCHA_OKAY,
                CUSTOM_OFFER_READY_TIMEOUT
            );
            const hcaptchaPacket = encodeWorkinkPacket("c_hcaptcha_response", {
                token: hcaptchaToken,
                monetizationId: Number(id)
            });
            log(`Enviando el paquete de hCaptcha de la monetización ${id}`, {
                solve: solve + 1,
                solvesNeeded: requestedSolves,
                packetLength: hcaptchaPacket.length
            });
            sendRaw(hcaptchaPacket);
            result = await hcaptchaResult;
            if (!result || result.packet.type === SERVER_PACKET.ERROR) return false;
            if (isOfferGoalPacket(result.packet) || isOfferGoalReached()) return true;
            if (isOfferAuthorized(result.packet, id)) return true;
        }

        const authorization = await waitForServerPacket(
            result?.sequence || relayMessageSequence,
            (packet) =>
                isOfferAuthorized(packet, id) ||
                isOfferGoalPacket(packet) ||
                packet.type === SERVER_PACKET.ERROR,
            CUSTOM_OFFER_READY_TIMEOUT
        );
        return Boolean(authorization && (
            isOfferAuthorized(authorization.packet, id) ||
            isOfferGoalPacket(authorization.packet)
        ));
    }

    function findOfferUrl(urlMap, offer, offerIndex) {
        const readUrl = (entry) => {
            if (typeof entry === "string") return entry;
            if (!entry || typeof entry !== "object") return null;
            return entry.OfferUrl || entry.offerUrl || entry.offerURL || entry.URL || entry.url || entry.href || null;
        };

        const matches = (entry, fallbackId) => {
            if (!entry || typeof entry !== "object") return String(fallbackId) === String(offer.id);
            const entryId = entry.ID ?? entry.id ?? entry.Id ?? entry.offerID ?? entry.offerId ?? entry.monetizationId ?? fallbackId;
            const entryName = entry.Name ?? entry.name;
            return String(entryId) === String(offer.id) || Boolean(entryName && offer.name && entryName === offer.name);
        };

        if (Array.isArray(urlMap)) {
            for (const entry of urlMap) {
                if (!matches(entry)) continue;
                const url = readUrl(entry);
                if (url) return url;
            }

            return readUrl(urlMap[offerIndex]);
        }

        if (!urlMap || typeof urlMap !== "object") return null;

        const direct = urlMap[offer.id] ?? urlMap[String(offer.id)] ?? urlMap[offer.name];
        const directUrl = readUrl(direct);
        if (directUrl) return directUrl;

        for (const [key, entry] of Object.entries(urlMap)) {
            if (!matches(entry, key)) continue;
            const url = readUrl(entry);
            if (url) return url;
        }

        return null;
    }

    async function getMonetizationDefinition(id) {
        if (!monetizationDefinitionsPromise) {
            monetizationDefinitionsPromise = pageFetchJson(
                "/_api/v2/redirection/monetizationData"
            ).catch((definitionError) => {
                warn("No se pudieron cargar las definiciones de monetización de Work.ink", definitionError);
                return {};
            });
        }

        const definitions = await monetizationDefinitionsPromise;
        return definitions?.[String(id)] || definitions?.[id] || null;
    }

    async function buildLocalCustomOffers(ids) {
        const offers = [];
        for (const id of ids) {
            const definition = await getMonetizationDefinition(id);
            if (!definition?.name) continue;
            const packetPayload = (event) => ({
                type: definition.name,
                payload: { event },
                s: WORKINK_OUTER_KEY
            });
            offers.push({
                id: Number(id),
                name: definition.name,
                definition,
                initEncrypted: encodeWorkinkPacket("c_monetization", packetPayload("init")),
                startEncrypted: encodeWorkinkPacket("c_monetization", packetPayload("start"))
            });
        }
        return offers;
    }

    async function executeRelayPackets(data) {
        const {
            fM, flM, sM, sU, raM, mM, coM, pinger, envC, mUrl, tat, mdDism, monetIds
        } = data;

        let customOffers = Array.isArray(coM) ? coM : [];
        let builtLocalCustomOffers = false;
        const currentMonetizationIds = Array.isArray(monetIds)
            ? monetIds
            : debugState.linkInfo?.monetizations;
        if (customOffers.length === 0 && Array.isArray(currentMonetizationIds)) {
            customOffers = await buildLocalCustomOffers(currentMonetizationIds);
            builtLocalCustomOffers = customOffers.length > 0;
            log("Se crearon localmente las ofertas actuales de Work.ink porque la retransmisión no devolvió ninguna.", customOffers.map((item) => ({
                id: item.id,
                name: item.name
            })));
        }

        if (envC) sendRaw(envC);
        if (mdDism) {
            if (!await waitForPremiumWall()) return;
            log("Enviando la confirmación del modal premium de Work.ink después del temporizador requerido.");
            sendRaw(mdDism.encrypted || mdDism);
            debugState.premiumWall.sentAt = Date.now();
            await sleep(250);
        }
        if (pinger) sendRaw(pinger);
        if (builtLocalCustomOffers) await waitForOfferStateSync();
        if (finished) return;

        if (Array.isArray(sM)) {
            for (let index = 0; index < sM.length; index += 1) {
                if (finished) return;
                updateStatus(`Completando la tarea social ${index + 1}/${sM.length}...`);
                sendRaw(sM[index].encrypted || sM[index]);
                if (flM) sendRaw(flM);
                await waitForSignal((handler) => { socialDone = handler; }, 10000);
                await sleep(10);
                if (fM) sendRaw(fM);
            }
        }

        if (Array.isArray(raM) && raM.length > 0) {
            updateStatus("Enviando paquetes de artículos leídos...");
            for (const article of raM) sendRaw(article.encrypted || article);
            await waitForSignal((handler) => { offersDone = handler; }, 20000);
            if (finished) return;
        }

        const monetizations = [
            ...(Array.isArray(mM) ? mM.map((item) => ({ ...item, source: "monetization" })) : []),
            ...customOffers.map((item) => ({ ...item, source: "customOffer" }))
        ].sort((left, right) => left.id - right.id);

        log("Paquetes de monetización de la retransmisión", monetizations.map((item) => ({
            id: item.id,
            event: item.event,
            source: item.source
        })));
        debugState.monetizations = monetizations.map((item) => ({
            id: item.id,
            event: item.event,
            source: item.source,
            state: "pending"
        }));

        for (let index = 0; index < monetizations.length; index += 1) {
            if (finished) return;

            const item = monetizations[index];
            const debugMonetization = debugState.monetizations[index];
            const raw = item.encrypted || JSON.stringify(item);
            updateStatus(`Procesando la monetización ${index + 1}/${monetizations.length} (ID ${item.id})...`);

            if (item.source === "customOffer") {
                if (isOfferGoalReached()) {
                    log("Ya se alcanzó la cantidad de ofertas requerida; se omitirán las restantes.", getOfferProgress());
                    break;
                }

                const customOfferIndex = customOffers.findIndex((candidate) =>
                    String(candidate.id) === String(item.id)
                );
                const relayOfferUrl =
                    findOfferUrl(mUrl, item, customOfferIndex) ||
                    findOfferUrl(sU, item, customOfferIndex);
                const definition = item.definition || await getMonetizationDefinition(item.id);
                let offerUrl = relayOfferUrl || definition?.offerUrl || null;
                if (offerUrl === "https://example.com" || offerUrl === "http://example.com") offerUrl = null;

                log(`Detalles del paquete de la oferta personalizada ${item.id}`, {
                    keys: Object.keys(item),
                    urlMapType: Array.isArray(mUrl) ? "array" : typeof mUrl,
                    urlMapKeys: mUrl && typeof mUrl === "object" ? Object.keys(mUrl).slice(0, 12) : [],
                    urlMapEntryKeys: Array.isArray(mUrl) && mUrl[0] && typeof mUrl[0] === "object"
                        ? Object.keys(mUrl[0])
                        : [],
                    secondaryUrlMapType: Array.isArray(sU) ? "array" : typeof sU,
                    secondaryUrlMapKeys: sU && typeof sU === "object" ? Object.keys(sU).slice(0, 12) : [],
                    secondaryUrlMapEntryKeys: Array.isArray(sU) && sU[0] && typeof sU[0] === "object"
                        ? Object.keys(sU[0])
                        : [],
                    hasOfferUrl: Boolean(offerUrl),
                    offerUrlSource: relayOfferUrl ? "relay" : definition?.offerUrl ? "workink-definition" : null,
                    definitionTemplate: definition?.template || null,
                    definitionName: definition?.name || null,
                    hasCompletionPacket: Boolean(
                        item.completeEncrypted ||
                        item.finishEncrypted ||
                        item.doneEncrypted ||
                        item.encrypted
                    )
                });

                try {
                    debugMonetization.state = "captcha";
                    updateStatus(`Verificando la monetización ${item.id}...`);
                    const authorized = await authorizeCustomOffer(
                        item,
                        index,
                        monetizations.length,
                        tat
                    );
                    if (isOfferGoalReached()) {
                        debugMonetization.state = "not-required";
                        log(`La monetización ${item.id} dejó de ser necesaria después de sincronizar con el servidor.`, getOfferProgress());
                        break;
                    }
                    if (!authorized) {
                        debugMonetization.state = "authorization-failed";
                        showError(`Work.ink no autorizó la monetización ${item.id}`);
                        return;
                    }
                } catch (captchaError) {
                    debugMonetization.state = "captcha-failed";
                    error(`Falló el CAPTCHA de la monetización ${item.id}`, captchaError);
                    showError(`No se pudo verificar la monetización ${item.id}`);
                    return;
                }

                log(`Monetización ${item.id} autorizada; ejecutando su flujo de un clic.`);
                debugMonetization.state = "authorized";

                const authorizedOfferUrl = findOfferUrl(
                    debugState.offerAuthorization?.urlOverrides,
                    item,
                    customOfferIndex
                );
                if (authorizedOfferUrl) offerUrl = authorizedOfferUrl;

                const baselineCompleted = getOfferProgress()?.completedOffers ?? 0;
                const progressAfterSequence = relayMessageSequence;
                const progress = waitForServerPacket(
                    progressAfterSequence,
                    (packet) =>
                        packet.type === SERVER_PACKET.LINK_DESTINATION ||
                        packet.type === SERVER_PACKET.OFFERS_STATE &&
                            Number(packet.payload?.completedOffers) > baselineCompleted,
                    CUSTOM_OFFER_PROGRESS_TIMEOUT
                );
                sendRaw(item.initEncrypted);

                if (offerUrl) {
                    const frame = document.createElement("iframe");
                    frame.style.cssText = "position:absolute;width:0;height:0;border:0;visibility:hidden";
                    frame.src = offerUrl;
                    (document.body || document.documentElement).appendChild(frame);
                    setTimeout(() => frame.remove(), 5000);
                }

                sendRaw(item.startEncrypted);
                if (flM) sendRaw(flM);

                await sleep(500);
                if (fM) sendRaw(fM);
                const progressData = await progress;

                if (finished) return;
                if (progressData) {
                    debugMonetization.state = progressData.packet.type === SERVER_PACKET.LINK_DESTINATION
                        ? "destination"
                        : "completed";
                    log(`Se recibió la actualización de finalización de la monetización ${item.id}.`, {
                        sequence: progressData.sequence,
                        type: progressData.packet.type,
                        completedOffers: progressData.packet.payload?.completedOffers ?? null,
                        neededOffers: progressData.packet.payload?.neededOffers ?? null
                    });
                } else {
                    debugMonetization.state = "completion-timeout";
                    warn(`No se confirmó la finalización de la monetización ${item.id}; se probará la siguiente oferta después de ${CUSTOM_OFFER_PROGRESS_TIMEOUT / 1000}s.`);
                }

                if (isOfferGoalReached()) {
                    log("Se alcanzó la cantidad de ofertas requerida.", getOfferProgress());
                    break;
                }
                await sleep(250);
                continue;
            }

            if (item.id === 80) {
                sendRaw(raw);
                await waitForSignal((handler) => { monetizationDone = handler; }, 140000);
                continue;
            }

            if ((item.id === 25 || item.id === 34) && item.event === "start") {
                sendRaw(raw);
                const clicked = monetizations.find((candidate) =>
                    candidate.id === item.id && candidate.event === "installClicked"
                );
                if (clicked) sendRaw(clicked.encrypted || JSON.stringify(clicked));

                if (item.id === 25) {
                    try {
                        const affiliateResponse = await gmFetch(
                            "https://work.ink/_api/v2/affiliate/operaGX",
                            { method: "HEAD", timeout: 3000 }
                        );
                        const cookieMatch = affiliateResponse.headers.match(/__cf_bm=([^;\s]+)/);
                        await gmFetch("https://work.ink/_api/v2/callback/operaGX", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(cookieMatch ? { Cookie: `__cf_bm=${cookieMatch[1]}` } : {})
                            },
                            body: JSON.stringify({ noteligible: true }),
                            timeout: 3000
                        });
                        await sleep(1200);
                    } catch (affiliateError) {
                        warn("Falló la devolución de Opera GX", affiliateError);
                    }
                }

                if (finished) return;
                if (flM) sendRaw(flM);
                await waitForSignal((handler) => { monetizationDone = handler; }, 300000);
                if (fM) sendRaw(fM);
                continue;
            }

            // This is the BypassTools path used for current IDs such as 126-130:
            // send the encrypted relay packet directly instead of guessing an event.
            sendRaw(raw);
            await sleep(500);
        }

        if (finished) return;

        if (latestOffersState && !isOfferGoalReached()) {
            const goalAfterSequence = relayMessageSequence;
            updateStatus(`Esperando la confirmación del servidor (${latestOffersState.completedOffers}/${latestOffersState.neededOffers})...`);
            const goal = await waitForServerPacket(
                goalAfterSequence,
                (packet) =>
                    packet.type === SERVER_PACKET.LINK_DESTINATION ||
                    packet.type === SERVER_PACKET.OFFERS_STATE &&
                        Number(packet.payload?.completedOffers) >= Number(packet.payload?.neededOffers),
                OFFER_GOAL_GRACE_TIMEOUT
            );

            if (finished) return;
            if (!goal && !isOfferGoalReached()) {
                const progress = getOfferProgress();
                showError(`El servidor confirmó solo ${progress.completedOffers}/${progress.neededOffers} ofertas`);
                return;
            }
        }

        const destinationPromise = new Promise((resolve) => {
            const timer = setTimeout(() => {
                destinationResolve = null;
                resolve(null);
            }, DESTINATION_TIMEOUT);
            destinationResolve = (destination) => {
                clearTimeout(timer);
                destinationResolve = null;
                resolve(destination);
            };
        });

        if (fM) sendRaw(fM);
        debugState.destinationWait = {
            startedAt: Date.now(),
            timeout: DESTINATION_TIMEOUT,
            offerState: getOfferProgress(),
            premiumWall: debugState.premiumWall ? { ...debugState.premiumWall } : null,
            result: "waiting"
        };
        updateStatus("Esperando el destino...");

        const destination = await destinationPromise;
        debugState.destinationWait.result = destination ? "received" : "timeout";
        debugState.destinationWait.completedAt = Date.now();
        if (destination) redirect(destination);
        else if (!finished && latestOffersState?.completedOffers === 0 && latestOffersState?.neededOffers === 0) {
            showError("Work.ink confirmó que no hay ofertas disponibles, pero no devolvió el destino después del temporizador requerido");
        } else if (!finished) {
            showError("Work.ink no envió el destino después de confirmar las ofertas");
        }
    }

    function handleRelayResponse(response) {
        if (!response || finished) return;

        if (response.tat) latestTurnstileAction = response.tat;

        log("Respuesta de la retransmisión", {
            conditions: response.conditions || null,
            hasTurnstileAction: Boolean(response.tat),
            requiresHcaptcha: Boolean(response.hcr),
            hcaptchaSolvesNeeded: response.hcsn ?? null,
            socials: response.sM?.length || 0,
            articles: response.raM?.length || 0,
            monetizations: response.mM?.length || 0,
            customOffers: response.coM?.length || 0,
            hasDestination: Boolean(response.destinationURL)
        });

        if (response.success === false && response.error) {
            const responseError = String(response.error);
            if (isLoginError(responseError)) {
                showLoginRequired();
            } else {
                finished = true;
                showError(responseError);
            }
            return;
        }

        if (response.conditions === "destination" && response.destinationURL) {
            finished = true;
            if (destinationResolve) {
                destinationResolve(response.destinationURL);
            } else {
                redirect(response.destinationURL);
            }
            return;
        }

        if (response.conditions === "prxd" && Date.now() - startTime < 9000) {
            finished = true;
            showError("Se detectó una VPN o un proxy");
            return;
        }

        if (response.conditions === "social_done") socialDone?.();
        if (response.conditions === "monetization_done") monetizationDone?.();
        if (response.conditions === "monetization_ack") monetizationDone?.(response);
        if (response.conditions === "offers_state") offersDone?.(response);

        if (response.conditions === "ping" && response.pingMsg && !pingTimer) {
            pingTimer = setTimeout(() => {
                pingTimer = null;
                sendRaw(response.pingMsg);
            }, 2000);
        }

        if (response.em) sendRaw(response.em);

        const hasExecutionData =
            response.sM?.length ||
            response.raM?.length ||
            response.mM?.length ||
            response.coM?.length ||
            Object.prototype.hasOwnProperty.call(response, "sM");

        if (executionStarted || !hasExecutionData) return;

        const advertised = debugState.linkInfo?.monetizations || [];
        const relayExecution = {
            keys: Object.keys(response).sort(),
            advertised,
            values: {
                monetIds: response.monetIds ?? null,
                mdDism: response.mdDism ?? null,
                sU: response.sU ?? null
            },
            mM: {
                length: response.mM?.length || 0,
                itemKeys: response.mM?.[0] ? Object.keys(response.mM[0]).sort() : []
            },
            coM: {
                length: response.coM?.length || 0,
                itemKeys: response.coM?.[0] ? Object.keys(response.coM[0]).sort() : []
            }
        };
        debugState.protocol.relayExecution = relayExecution;
        if (advertised.length > 0 && relayExecution.mM.length + relayExecution.coM.length === 0) {
            recordProtocolMismatch({
                type: "relay-execution",
                kind: "monetizations-missing",
                current: relayExecution
            });
        }

        executionStarted = true;

        if (linkInfoTimer) {
            clearTimeout(linkInfoTimer);
            linkInfoTimer = null;
        }

        (async () => {
            try {
                const turnstileToken = await solveTurnstile(response.tat);
                updateStatus("Turnstile resuelto. Enviando la respuesta...");
                const turnstilePacket = encodeWorkinkPacket("c_turnstile_response", {
                    token: turnstileToken
                });
                log("Enviando el paquete inicial de Turnstile", { packetLength: turnstilePacket.length });
                sendRaw(turnstilePacket);
            } catch (turnstileError) {
                error("Falló el envío de Turnstile", turnstileError);
                showError("No se pudo verificar Turnstile");
                return;
            }

            if (response.hcr) {
                const solvesNeeded = Math.max(1, Number.parseInt(response.hcsn, 10) || 1);
                for (let solve = 0; solve < solvesNeeded; solve += 1) {
                    try {
                        const hcaptchaToken = await solveHcaptcha();
                        updateStatus(`hCaptcha resuelto (${solve + 1}/${solvesNeeded}). Enviando la respuesta...`);
                        const hcaptchaPacket = encodeWorkinkPacket("c_hcaptcha_response", {
                            token: hcaptchaToken
                        });
                        log("Enviando el paquete inicial de hCaptcha", {
                            solve: solve + 1,
                            solvesNeeded,
                            packetLength: hcaptchaPacket.length
                        });
                        sendRaw(hcaptchaPacket);
                    } catch (hcaptchaError) {
                        error("Falló el envío de hCaptcha", hcaptchaError);
                        showError("No se pudo verificar hCaptcha");
                        return;
                    }
                }
            }

            updateStatus("CAPTCHA completado. Procesando las monetizaciones...");
            await executeRelayPackets(response);
        })();
    }

    function relayIncomingMessage(data) {
        if (finished || typeof data !== "string") return;

        const sequence = ++relayMessageSequence;
        log(`Mensaje de WebSocket entrante #${sequence}`, data.slice(0, 160));

        try {
            handleDecodedServerPacket(decodeWorkinkPacket(data), sequence, data);
        } catch (decodeError) {
            const failure = {
                time: Date.now(),
                sequence,
                stage: decodeError.stage || "unknown",
                message: decodeError.message || String(decodeError),
                raw: data.slice(0, 25000),
                rawLength: data.length
            };
            debugState.protocol.decodeFailures.push(failure);
            if (debugState.protocol.decodeFailures.length > 10) debugState.protocol.decodeFailures.shift();
            warn(`No se pudo decodificar el mensaje de WebSocket #${sequence}`, {
                stage: failure.stage,
                message: failure.message,
                rawLength: failure.rawLength
            });
        }

        if (finished) return;

        relayNegotiationQueue = relayNegotiationQueue
            .then(async () => {
                if (finished) return;

                const response = await gmFetch(`${EVADE_BASE}/api/evade/negotiate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        demands: data,
                        direction: "incoming",
                        session_id: relaySession,
                        client_timestamp: Date.now()
                    }),
                    timeout: 15000
                });

                const relayResponse = response.ok ? await response.json() : null;
                log(`Mensaje de WebSocket procesado #${sequence}`, {
                    status: response.status,
                    condition: relayResponse?.conditions || null,
                    keys: relayResponse ? Object.keys(relayResponse) : []
                });
                handleRelayResponse(relayResponse);
            })
            .catch((relayError) => {
                error(`Falló la negociación de la retransmisión para el mensaje #${sequence}`, relayError);
            });
    }

    function openWebSocket(userId, custom, serverOverride, monocle) {
        const token = initData?.tok || "";
        const webSocketUrl = [
            "wss://work.ink/_api/v2/ws",
            `?userId=${encodeURIComponent(userId)}`,
            `&custom=${encodeURIComponent(custom)}`,
            "&referrer=https://work.ink/",
            "&toLink=",
            `&serverOverride=${encodeURIComponent(serverOverride)}`,
            `&customerSessionToken=${encodeURIComponent(token)}`,
            `&monocleAssessment=${encodeURIComponent(monocle || "")}`
        ].join("");

        realWebSocket = new originalWebSocket(webSocketUrl);
        linkInfoTimer = setTimeout(() => {
            if (!finished) showError("Work.ink no devolvió la información del enlace");
        }, 15000);

        realWebSocket.onopen = () => {
            if (initData?.mcl) sendRaw(initData.mcl);
            if (initData?.pinger) sendRaw(initData.pinger);
            updateStatus("Conectado. Esperando la información del enlace...");
        };
        realWebSocket.onmessage = (event) => relayIncomingMessage(event.data);
        realWebSocket.onerror = (webSocketError) => {
            error("Error de WebSocket", webSocketError);
            if (!finished) showError("Falló la conexión WebSocket");
        };
        realWebSocket.onclose = (event) => {
            warn("WebSocket cerrado", event.code, event.reason);
        };
    }

    function installWebSocketStub() {
        const fakeWebSocket = () => ({
            readyState: originalWebSocket.CLOSED,
            send() {},
            close() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() { return false; },
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null
        });

        unsafeWindow.WebSocket = new Proxy(originalWebSocket, {
            construct(target, args) {
                const url = String(args?.[0] || "");
                if (url.includes("work.ink")) return fakeWebSocket();
                return Reflect.construct(target, args);
            },
            apply(target, thisArgument, args) {
                const url = String(args?.[0] || "");
                if (url.includes("work.ink")) return fakeWebSocket();
                return Reflect.apply(target, thisArgument, args);
            }
        });
        log("Stub de WebSocket de la página de Work.ink instalado");
    }

    async function initialize() {
        installWebSocketStub();
        await waitForBody();

        const pageText = document.documentElement.innerHTML.toLowerCase();
        if (
            pageText.includes("/cdn-cgi/challenge-platform/") ||
            pageText.includes("cf-browser-verification")
        ) {
            showError("La verificación de Cloudflare sigue activa; vuelve a cargar la página cuando termine");
            return;
        }

        try {
            updateStatus("Esperando el token de verificación del bot de Work.ink...");
            const monocle = await waitForMonocle();
            updateStatus("Token de verificación del bot capturado. Inicializando la retransmisión...");

            const initResponse = await gmFetch(`${EVADE_BASE}/api/evade/init`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mcl: monocle, session_id: relaySession })
            });

            if (!initResponse.ok) {
                showError(`Falló la inicialización de la retransmisión (${initResponse.status})`);
                return;
            }

            initData = await initResponse.json();
            const relayToken = initData?.tok || "";
            const relayTokenInfo = inspectCustomerToken(relayToken);
            const storedToken = getStoredCustomerToken();
            const selectedToken = storedToken || (relayToken && !relayTokenInfo.expired
                ? { token: relayToken, source: "relay", info: relayTokenInfo }
                : null);
            debugState.protocol.sessionToken = {
                source: selectedToken?.source || null,
                relay: relayTokenInfo,
                stored: storedToken?.info || null
            };

            if (!selectedToken) {
                clearCustomerToken(relayToken);
                showLoginRequired();
                return;
            }

            initData.tok = selectedToken.token;
            persistCustomerToken(selectedToken.token);
            log("Retransmisión inicializada", {
                hasToken: true,
                tokenSource: selectedToken.source,
                relayTokenExpired: relayTokenInfo.expired,
                hasMonoclePacket: Boolean(initData?.mcl),
                hasPinger: Boolean(initData?.pinger)
            });

            updateStatus("Leyendo los parámetros del enlace...");
            const html = await unsafeWindow.fetch(location.href).then((response) => response.text());
            const userIdMatch = html.match(/f_user_id\s*:\s*["']?(\d+)["']?/);
            if (!userIdMatch?.[1]) {
                showError("No se pudo extraer el ID de usuario de Work.ink");
                return;
            }

            const pathParts = location.pathname.split("/").filter(Boolean);
            const custom = pathParts[1] || pathParts[0] || "";
            const serverOverride = new URLSearchParams(location.search).get("sr") || "";
            updateStatus("Abriendo el WebSocket de la retransmisión...");
            openWebSocket(userIdMatch[1], custom, serverOverride, monocle);
        } catch (initializationError) {
            error("Falló la inicialización", initializationError);
            showError(initializationError.message || String(initializationError));
        }
    }

    initialize();
})();
