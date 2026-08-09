// ==UserScript==
// @name         work.ink bypass
// @namespace    http://tampermonkey.net/
// @version      2026-08-08-27
// @description  bypasses work.ink shortened links using the BypassTools relay flow
// @author       IHaxU; relay flow adapted from BypassTools
// @license      MIT
// @match        https://work.ink/*
// @exclude      https://work.ink/token/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=work.ink
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      evade.bypass.tools
// @connect      work.ink
// @downloadURL  https://github.com/IHaxU/work.ink-bypass/raw/refs/heads/main/work.ink-bypass.user.js
// @updateURL    https://github.com/IHaxU/work.ink-bypass/raw/refs/heads/main/work.ink-bypass.user.js
// ==/UserScript==

(function() {
    "use strict";

    const DEBUG = true;
    const BUILD = "2026-08-08-27";
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

    function log(...args) { if (DEBUG) oldLog("[UnShortener/Relay]", ...args); }
    function warn(...args) { if (DEBUG) oldWarn("[UnShortener/Relay]", ...args); }
    function error(...args) { if (DEBUG) oldError("[UnShortener/Relay]", ...args); }

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
        warn("Protocol mismatch", { ...mismatch, rawLength: entry.rawLength });
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

    log("Loaded build", BUILD);

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.bottom = "10px";
    container.style.left = "10px";
    container.style.zIndex = "2147483647";

    const shadow = container.attachShadow({ mode: "open" });
    const hint = document.createElement("div");
    Object.assign(hint.style, {
        background: "rgba(0,0,0,0.88)",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "sans-serif",
        pointerEvents: "none"
    });
    hint.textContent = "Connecting to the BypassTools relay...";
    shadow.appendChild(hint);
    document.documentElement.appendChild(container);

    function updateStatus(message) {
        hint.textContent = message;
        debugState.phase = message;
        debugState.status.push({ time: Date.now(), message });
        if (debugState.status.length > 100) debugState.status.shift();
        log(message);
    }

    function showError(message) {
        hint.style.background = "rgba(127,29,29,0.94)";
        updateStatus(`Error: ${message}`);
    }

    function redirect(destination) {
        if (!destination || redirectScheduled) return;
        redirectScheduled = true;
        unsafeWindow.wokeresponse = destination;

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        let remaining = Math.max(0, MINIMUM_REDIRECT_SECONDS - elapsed);

        const tick = () => {
            if (remaining <= 0) {
                updateStatus("Redirecting to the destination...");
                unsafeWindow.location.href = destination;
                return;
            }

            updateStatus(`Bypass complete. Redirecting in ${remaining}s...`);
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
                ontimeout: () => reject(new Error(`Request timed out: ${url}`))
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
                    reject(new Error(`Page request returned ${request.status}`));
                    return;
                }

                try {
                    resolve(JSON.parse(request.responseText));
                } catch (parseError) {
                    reject(parseError);
                }
            };
            request.onerror = () => reject(new Error("Page request failed"));
            request.ontimeout = () => reject(new Error(`Page request timed out: ${url}`));
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
                    reject(new Error("Bot-check token was not produced"));
                }
            }, 200);
        });
    }

    function createCaptchaPanel(id, title) {
        document.getElementById(`${id}-panel`)?.remove();

        const panel = document.createElement("div");
        panel.id = `${id}-panel`;
        panel.style.cssText = [
            "position:fixed",
            "left:50%",
            "top:50%",
            "transform:translate(-50%,-50%)",
            "z-index:2147483647",
            "display:flex",
            "flex-direction:column",
            "align-items:center",
            "gap:14px",
            "width:min(360px,calc(100vw - 32px))",
            "padding:18px",
            "box-sizing:border-box",
            "border-radius:12px",
            "background:rgba(12,12,14,0.96)",
            "border:1px solid rgba(255,255,255,0.14)",
            "box-shadow:0 20px 70px rgba(0,0,0,0.55)",
            "color:#fff",
            "font-family:Segoe UI,sans-serif",
            "text-align:center",
            "pointer-events:auto"
        ].join(";");

        const label = document.createElement("div");
        label.textContent = title;
        label.style.cssText = "font-size:14px;font-weight:700;line-height:1.35;color:#f4f4f5";

        const captchaContainer = document.createElement("div");
        captchaContainer.id = id;
        captchaContainer.style.cssText = "display:flex;align-items:center;justify-content:center;min-width:300px;min-height:65px";

        panel.append(label, captchaContainer);
        (document.body || document.documentElement).appendChild(panel);
        return panel;
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
        title = "Complete the security check",
        status = "Please complete the Turnstile check..."
    ) {
        return new Promise((resolve, reject) => {
            loadExternalScript(
                "workink-relay-turnstile-script",
                "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            );

            const captchaId = `workink-relay-turnstile-${++turnstileSolveSequence}`;
            const panel = createCaptchaPanel(
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
                    reject(new Error("Turnstile failed to load"));
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
                            reject(new Error(`Turnstile error: ${turnstileError}`));
                        }
                    };
                    if (action) options.action = action;
                    turnstile.render(`#${captchaId}`, options);
                } catch (turnstileError) {
                    panel.remove();
                    reject(turnstileError);
                }
            }, 100);
        });
    }

    function solveHcaptcha(
        title = "Complete the hCaptcha challenge",
        status = "Please complete the hCaptcha challenge..."
    ) {
        return new Promise((resolve, reject) => {
            loadExternalScript(
                "workink-relay-hcaptcha-script",
                "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=on&sentry=false"
            );

            const captchaId = `workink-relay-hcaptcha-${++hcaptchaSolveSequence}`;
            const panel = createCaptchaPanel(captchaId, title);
            updateStatus(status);

            const started = Date.now();
            const timer = setInterval(() => {
                const hcaptcha = unsafeWindow.hcaptcha;
                if (typeof hcaptcha?.render !== "function") {
                    if (Date.now() - started < 30000) return;
                    clearInterval(timer);
                    panel.remove();
                    reject(new Error("hCaptcha failed to load"));
                    return;
                }

                clearInterval(timer);
                try {
                    hcaptcha.render(captchaId, {
                        sitekey: HCAPTCHA_SITE_KEY,
                        theme: "dark",
                        callback(token) {
                            panel.remove();
                            resolve(token);
                        },
                        "error-callback"(hcaptchaError) {
                            panel.remove();
                            reject(new Error(`hCaptcha error: ${hcaptchaError}`));
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
                log("Sent relay packet", String(message).slice(0, 160));
            }
        } catch (sendError) {
            error("Failed to send relay packet", sendError);
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
            throw Object.assign(new Error("Packet envelope changed"), { stage: "envelope" });
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
                error("Server packet predicate failed", predicateError);
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
                ? String(payload?.message || "Unknown Work.ink WebSocket error")
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
        log(`Decoded WebSocket message #${sequence}`, packetSummary);

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
            const message = String(payload?.message || "Work.ink rejected the WebSocket connection");
            const invalidToken = /customer session token/i.test(message);
            const displayMessage = invalidToken
                ? "Invalid Work.ink session token. Create or sign in to a Work.ink account, then reload this page."
                : message;
            debugState.protocol.serverError = { sequence, time: Date.now(), message, displayMessage };
            if (invalidToken) clearCustomerToken(initData?.tok || "");
            if (linkInfoTimer) {
                clearTimeout(linkInfoTimer);
                linkInfoTimer = null;
            }
            finished = true;
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
        log("Work.ink premium-wall timing", debugState.premiumWall);

        let lastReported = null;
        while (!finished && Date.now() < deadline) {
            const remaining = Math.max(1, Math.ceil((deadline - Date.now()) / 1000));
            if (lastReported === null || remaining % 10 === 0 || remaining <= 5) {
                updateStatus(`Waiting for Work.ink's required timer (${remaining}s)...`);
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
        updateStatus("Synchronizing Work.ink offer state...");
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
            `Verify monetization ${index + 1}/${total}`,
            `Complete the Turnstile check for monetization ${id}...`
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
        log(`Sending monetization ${id} Turnstile packet`, {
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
                `Verify monetization ${index + 1}/${total}`,
                `Complete hCaptcha ${solve + 1}/${requestedSolves} for monetization ${id}...`
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
            log(`Sending monetization ${id} hCaptcha packet`, {
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
                warn("Could not load Work.ink monetization definitions", definitionError);
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
            log("Built current Work.ink offers locally because the relay returned none.", customOffers.map((item) => ({
                id: item.id,
                name: item.name
            })));
        }

        if (envC) sendRaw(envC);
        if (mdDism) {
            if (!await waitForPremiumWall()) return;
            log("Sending Work.ink premium-modal acknowledgement after the required timer.");
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
                updateStatus(`Completing social ${index + 1}/${sM.length}...`);
                sendRaw(sM[index].encrypted || sM[index]);
                if (flM) sendRaw(flM);
                await waitForSignal((handler) => { socialDone = handler; }, 10000);
                await sleep(10);
                if (fM) sendRaw(fM);
            }
        }

        if (Array.isArray(raM) && raM.length > 0) {
            updateStatus("Sending read-article packets...");
            for (const article of raM) sendRaw(article.encrypted || article);
            await waitForSignal((handler) => { offersDone = handler; }, 20000);
            if (finished) return;
        }

        const monetizations = [
            ...(Array.isArray(mM) ? mM.map((item) => ({ ...item, source: "monetization" })) : []),
            ...customOffers.map((item) => ({ ...item, source: "customOffer" }))
        ].sort((left, right) => left.id - right.id);

        log("Relay monetization packets", monetizations.map((item) => ({
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
            updateStatus(`Processing monetization ${index + 1}/${monetizations.length} (ID ${item.id})...`);

            if (item.source === "customOffer") {
                if (isOfferGoalReached()) {
                    log("Required offer count already reached; skipping remaining offers.", getOfferProgress());
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

                log(`Custom offer ${item.id} packet details`, {
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
                    updateStatus(`Verifying monetization ${item.id}...`);
                    const authorized = await authorizeCustomOffer(
                        item,
                        index,
                        monetizations.length,
                        tat
                    );
                    if (isOfferGoalReached()) {
                        debugMonetization.state = "not-required";
                        log(`Monetization ${item.id} became unnecessary after server synchronization.`, getOfferProgress());
                        break;
                    }
                    if (!authorized) {
                        debugMonetization.state = "authorization-failed";
                        showError(`Work.ink did not authorize monetization ${item.id}`);
                        return;
                    }
                } catch (captchaError) {
                    debugMonetization.state = "captcha-failed";
                    error(`Monetization ${item.id} CAPTCHA failed`, captchaError);
                    showError(`Could not verify monetization ${item.id}`);
                    return;
                }

                log(`Monetization ${item.id} authorized; running its one-click flow.`);
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
                    log(`Monetization ${item.id} completion update received.`, {
                        sequence: progressData.sequence,
                        type: progressData.packet.type,
                        completedOffers: progressData.packet.payload?.completedOffers ?? null,
                        neededOffers: progressData.packet.payload?.neededOffers ?? null
                    });
                } else {
                    debugMonetization.state = "completion-timeout";
                    warn(`No confirmed completion for monetization ${item.id}; trying the next offer after ${CUSTOM_OFFER_PROGRESS_TIMEOUT / 1000}s.`);
                }

                if (isOfferGoalReached()) {
                    log("Required offer count reached.", getOfferProgress());
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
                        warn("Opera GX callback failed", affiliateError);
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
            updateStatus(`Waiting for server confirmation (${latestOffersState.completedOffers}/${latestOffersState.neededOffers})...`);
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
                showError(`Server confirmed only ${progress.completedOffers}/${progress.neededOffers} offers`);
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
        updateStatus("Waiting for the destination...");

        const destination = await destinationPromise;
        debugState.destinationWait.result = destination ? "received" : "timeout";
        debugState.destinationWait.completedAt = Date.now();
        if (destination) redirect(destination);
        else if (!finished && latestOffersState?.completedOffers === 0 && latestOffersState?.neededOffers === 0) {
            showError("Work.ink confirmed no available offers but did not return the destination after the required timer");
        } else if (!finished) {
            showError("Work.ink did not send the destination after confirming the offers");
        }
    }

    function handleRelayResponse(response) {
        if (!response || finished) return;

        if (response.tat) latestTurnstileAction = response.tat;

        log("Relay response", {
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
            finished = true;
            showError(response.error);
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
            showError("VPN or proxy detected");
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
                updateStatus("Turnstile solved. Submitting response...");
                const turnstilePacket = encodeWorkinkPacket("c_turnstile_response", {
                    token: turnstileToken
                });
                log("Sending initial Turnstile packet", { packetLength: turnstilePacket.length });
                sendRaw(turnstilePacket);
            } catch (turnstileError) {
                error("Turnstile submission failed", turnstileError);
                showError("Failed to verify Turnstile");
                return;
            }

            if (response.hcr) {
                const solvesNeeded = Math.max(1, Number.parseInt(response.hcsn, 10) || 1);
                for (let solve = 0; solve < solvesNeeded; solve += 1) {
                    try {
                        const hcaptchaToken = await solveHcaptcha();
                        updateStatus(`hCaptcha solved (${solve + 1}/${solvesNeeded}). Submitting response...`);
                        const hcaptchaPacket = encodeWorkinkPacket("c_hcaptcha_response", {
                            token: hcaptchaToken
                        });
                        log("Sending initial hCaptcha packet", {
                            solve: solve + 1,
                            solvesNeeded,
                            packetLength: hcaptchaPacket.length
                        });
                        sendRaw(hcaptchaPacket);
                    } catch (hcaptchaError) {
                        error("hCaptcha submission failed", hcaptchaError);
                        showError("Failed to verify hCaptcha");
                        return;
                    }
                }
            }

            updateStatus("CAPTCHA complete. Processing monetizations...");
            await executeRelayPackets(response);
        })();
    }

    function relayIncomingMessage(data) {
        if (finished || typeof data !== "string") return;

        const sequence = ++relayMessageSequence;
        log(`Incoming WebSocket message #${sequence}`, data.slice(0, 160));

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
            warn(`Could not decode WebSocket message #${sequence}`, {
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
                log(`Processed WebSocket message #${sequence}`, {
                    status: response.status,
                    condition: relayResponse?.conditions || null,
                    keys: relayResponse ? Object.keys(relayResponse) : []
                });
                handleRelayResponse(relayResponse);
            })
            .catch((relayError) => {
                error(`Relay negotiation failed for message #${sequence}`, relayError);
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
            if (!finished) showError("Work.ink did not return link information");
        }, 15000);

        realWebSocket.onopen = () => {
            if (initData?.mcl) sendRaw(initData.mcl);
            if (initData?.pinger) sendRaw(initData.pinger);
            updateStatus("Connected. Waiting for link information...");
        };
        realWebSocket.onmessage = (event) => relayIncomingMessage(event.data);
        realWebSocket.onerror = (webSocketError) => {
            error("WebSocket error", webSocketError);
            if (!finished) showError("WebSocket connection failed");
        };
        realWebSocket.onclose = (event) => {
            warn("WebSocket closed", event.code, event.reason);
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
        log("Work.ink page WebSocket stub installed");
    }

    async function initialize() {
        installWebSocketStub();
        await waitForBody();

        const pageText = document.documentElement.innerHTML.toLowerCase();
        if (
            pageText.includes("/cdn-cgi/challenge-platform/") ||
            pageText.includes("cf-browser-verification")
        ) {
            showError("Cloudflare verification is still active; reload after it completes");
            return;
        }

        try {
            updateStatus("Waiting for Work.ink's bot-check token...");
            const monocle = await waitForMonocle();
            updateStatus("Bot-check token captured. Initializing relay...");

            const initResponse = await gmFetch(`${EVADE_BASE}/api/evade/init`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mcl: monocle, session_id: relaySession })
            });

            if (!initResponse.ok) {
                showError(`Relay initialization failed (${initResponse.status})`);
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
                unsafeWindow.WebSocket = originalWebSocket;
                showError(relayTokenInfo.expired
                    ? "Invalid Work.ink session token. Create or sign in to a Work.ink account, then reload this page."
                    : "No Work.ink session token is available. Create or sign in to a Work.ink account, then reload this page.");
                return;
            }

            initData.tok = selectedToken.token;
            persistCustomerToken(selectedToken.token);
            log("Relay initialized", {
                hasToken: true,
                tokenSource: selectedToken.source,
                relayTokenExpired: relayTokenInfo.expired,
                hasMonoclePacket: Boolean(initData?.mcl),
                hasPinger: Boolean(initData?.pinger)
            });

            updateStatus("Reading link parameters...");
            const html = await unsafeWindow.fetch(location.href).then((response) => response.text());
            const userIdMatch = html.match(/f_user_id\s*:\s*["']?(\d+)["']?/);
            if (!userIdMatch?.[1]) {
                showError("Could not extract the Work.ink user ID");
                return;
            }

            const pathParts = location.pathname.split("/").filter(Boolean);
            const custom = pathParts[1] || pathParts[0] || "";
            const serverOverride = new URLSearchParams(location.search).get("sr") || "";
            updateStatus("Opening relay WebSocket...");
            openWebSocket(userIdMatch[1], custom, serverOverride, monocle);
        } catch (initializationError) {
            error("Initialization failed", initializationError);
            showError(initializationError.message || String(initializationError));
        }
    }

    initialize();
})();
