!function() {
    "use strict";

    if (location.pathname.startsWith("/_api/v2/destination/")) {
        const MountDestinationRecovery = () => {
            if (document.getElementById("workink-destination-recovery")) return;
            const Host = document.createElement("div"), Shadow = Host.attachShadow({
                mode: "open"
            });
            Host.id = "workink-destination-recovery", Host.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:block;isolation:isolate";
            Shadow.innerHTML = `
                <style>
                    :host{all:initial;color-scheme:dark}*{box-sizing:border-box}
                    .Screen{position:absolute;inset:0;display:grid;place-items:center;overflow:auto;padding:24px 16px;background:#000;color:#f5f5f7;font-family:Inter,"SF Pro Display","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
                    .Panel{width:min(720px,100%)}.TitleLockup{display:flex;align-items:flex-end;gap:14px;min-width:0;margin-bottom:10px}
                    h1{min-width:0;margin:0;font-size:clamp(2rem,7vw,4.5rem);font-weight:720;letter-spacing:-.055em;line-height:1}
                    .Title{position:relative;display:inline-block;color:transparent;background:linear-gradient(180deg,#fff 0%,#c7c7cc 34%,#5a5a60 67%,#080808 100%);background-clip:text;-webkit-background-clip:text}
                    .Title::after{position:absolute;inset:0;content:attr(data-title);color:transparent;background:linear-gradient(108deg,transparent 38%,rgba(255,255,255,.98) 49%,transparent 60%);background-size:230% 100%;background-position:180% 0;background-clip:text;-webkit-background-clip:text;animation:Reflection 5s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}
                    .Ahst{display:flex;flex:0 0 auto;flex-direction:column;gap:4px;padding-bottom:3px}.Ahst strong{color:#d1d1d6;font-size:17px;letter-spacing:.13em;line-height:1}.Ahst span{max-width:132px;color:rgba(235,235,245,.34);font-size:9px;font-weight:600;letter-spacing:.055em;line-height:1.25}
                    .Author{margin:0 0 22px;color:#636366;font:650 11px/1.4 "SFMono-Regular",Consolas,monospace;letter-spacing:.08em;text-transform:uppercase}
                    .Console{overflow:hidden;border:1px solid #1c1c1e;border-radius:16px;background:#050505}.ConsoleHead{display:flex;align-items:center;gap:10px;padding:12px 15px;border-bottom:1px solid #1c1c1e;background:#080808}.Dots{display:flex;gap:5px}.Dots i{display:block;width:7px;height:7px;border-radius:50%;opacity:.78}.Dots i:nth-child(1){background:#ff5f57}.Dots i:nth-child(2){background:#febc2e}.Dots i:nth-child(3){background:#28c840}.ConsoleName{color:#8e8e93;font:700 10px/1 "SFMono-Regular",Consolas,monospace;letter-spacing:.14em;text-transform:uppercase}
                    .ConsoleBody{display:grid;place-items:center;min-height:190px;padding:24px}.Open{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:1px solid #62e8cb;border-radius:11px;background:#62e8cb;color:#00130f;font-size:12px;font-weight:800;letter-spacing:.075em;text-decoration:none;transition:transform 140ms ease,filter 140ms ease}.Open:hover{filter:brightness(1.08)}.Open:active{transform:scale(.975)}
                    @keyframes Reflection{0%,70%{background-position:180% 0}100%{background-position:-130% 0}}
                    @media(max-width:620px){.Screen{place-items:start center}.TitleLockup{gap:9px}h1{font-size:clamp(1.65rem,9.3vw,2.35rem)}.Ahst{gap:3px;padding-bottom:2px}.Ahst strong{font-size:13px}.Ahst span{max-width:78px;font-size:7.5px;letter-spacing:.035em}.Console{border-radius:13px}.ConsoleBody{min-height:170px;padding:20px 14px}.Open{width:100%;font-size:11px}}
                    @media(prefers-reduced-motion:reduce){.Title::after{animation:none;background:none}.Open{transition:none}}
                </style>
                <main class="Screen"><section class="Panel"><div class="TitleLockup"><h1><span class="Title" data-title="Work.Ink Bypass">Work.Ink Bypass</span></h1><span class="Ahst"><strong>AHST</strong><span>Anti-Hambreado Script team</span></span></div><p class="Author">TheRealBanHammer</p><section class="Console" aria-label="Destino final"><div class="ConsoleHead"><span class="Dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ConsoleName">Destino final</span></div><div class="ConsoleBody"><a class="Open" href="#">ABRIR DESTINO FINAL</a></div></section></section></main>`;
            const OpenDestination = Shadow.querySelector(".Open");
            OpenDestination.href = location.href, OpenDestination.addEventListener("click", () => {
                OpenDestination.textContent = "ABRIENDO…";
            }), (document.documentElement || document).appendChild(Host);
        };
        "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", MountDestinationRecovery, {
            once: !0
        }) : MountDestinationRecovery();
        return;
    }

    if (location.pathname.startsWith("/token/")) return;

    const Build = "2026-08-24-45", Window = unsafeWindow, Document = Window.document, NativeWebSocket = Window.WebSocket, StartTime = Date.now(), WorkinkOuterKey = "FOyWLycLacw35PbZpwk8Q3N6ouw6PBQ2snZHMIDmXrUXoCUXv7XgOiVlrl9NMn2p", WorkinkInnerKey = "FMEB197nNpP8ge1zElwAHAqufR3U7kZ4jIDqBPQzous0k5cUkjQ96994zIM0qSFd", TurnstileSiteKey = "0x4AAAAAAAJoXhmMXwq7jgK9", HcaptchaSiteKey = "74184788-498a-4910-ba14-be9c2acc3f98", ServerPacket = Object.freeze({
        ERROR: "s_errx",
        HCAPTCHA_OKAY: "s_hcok",
        LINK_DESTINATION: "s_lkds",
        LINK_INFO: "s_lkif",
        LINK_NOT_FOUND: "s_lknf",
        MONETIZATION: "s_mntz",
        MONETIZATION_DATA: "s_mntd",
        OFFERS_STATE: "s_ofst",
        OFFER_URLS: "s_ofur",
        PREMIUM_ONLY: "s_prmo",
        PROXY_DETECTED: "s_prxd",
        SOCIAL_DONE: "s_scdn",
        START_HCAPTCHA_CHECK: "s_sthc",
        START_TURNSTILE_CHECK: "s_tstc",
        TURNSTILE_ACTION: "s_tsac"
    });
    const MonetizationNames = Object.freeze({
        34: "norton",
        74: "testOffer",
        75: "testOffer2",
        76: "offer_1767377436151_zqh6ea",
        77: "installMelonvpn_1767378976299",
        78: "installMelonvpnIos_1767379828404",
        79: "mcafeeAdvancedIndividual_1767409130213",
        80: "signUpForStake_1767466116754",
        81: "gewinneEinApplePaket_1767512467882",
        82: "installClaritytab_1767548080172",
        83: "privateInstagramViewer_1767613815343",
        84: "exploreGadgets_1767680938977",
        85: "win750CashappGiftcard_1767709388374",
        86: "get550HuggiesRewards_1767710250989",
        87: "winAmazonGiftCard_1767711077326",
        88: "getWalmartGiftcard_1767712011143",
        89: "win250McdonaldsGiftcard_1767712464782",
        90: "win1000CashappGiftcard_1767712702603",
        91: "win500AmazonGiftcard_1767713149924",
        92: "get1000WalmartGiftcard_1767713419798",
        93: "verifikasiNomirTeleponAnda_1767797710831",
        98: "imperialwinsSignup_1767866777849",
        99: "solarPanelsSignup_1767867612893",
        100: "spouwmuurisolatieSignup_1767867781810",
        101: "signupSpinsHouseCasino_1767868003038",
        102: "signupLuckyDaysCasion_1767868269945",
        103: "winParknsaveVoucher_1767868919946",
        104: "revolutionCasinoSignup_1767869341749",
        105: "installZenlessZoneZero_1767870648897",
        106: "casinoSignup_1767976954178",
        107: "installWizard101_1768594816484",
        108: "getRobuxForCheap_1768646330283",
        109: "installBuff_1768999192811",
        110: "installOperagx_1769163387258",
        111: "pippitAiSignup_1769165803308",
        112: "createYourAiGirlfriend_1769182106594",
        113: "playHerowars_1769704862601",
        114: "saveUpTo50OnAliexpress_1769775489551",
        115: "freecashSignup_1769815034764",
        116: "myappfreeSignup_1769816761937",
        117: "installCapcut_1769817665085",
        118: "friendshipQuiz_1769862460585",
        119: "popaiGoogleSignup_1770036505132",
        120: "girokontoFRStudentenUndAzubis_1770048065176",
        121: "testOneclickOffer",
        122: "testOverrides",
        123: "smartdeals_1770682519804",
        124: "smartdeals_1770682519805",
        125: "smartdeals_1770682519806",
        126: "smartdeals_1770682519807",
        127: "smartdeals_1770682519808",
        128: "smartdeals_1770682519809",
        129: "smartdeals_1770682519810",
        130: "smartdeals_1770682519811",
        132: "googleSucheAbschlieEn_1775573599632"
    });
    const SmartdealsBaseId = 123, SmartdealsBaseStamp = 1770682519804;
    const UserIdCacheKey = "workinkBypassUserId";
    const OfferDwellMs = 5e3;
    const PacketHistory = [], PacketWaiters = new Set, AuthorizedOffers = new Set;
    let Socket = null, PingTimer = null, ServerSequence = 0, FlowStarted = !1, Finished = !1, RedirectScheduled = !1, LinkInfo = null, LinkInfoAt = null, LatestTurnstileAction = "", LatestOffersState = null, MonetizationData = null, OfferUrlOverrides = {}, CatalogPromise = null, CaptchaSequence = 0, SelectedToken = null, UiMounted = !1, UiSecurityHidden = !1, SessionRecoveryActive = !1;
    const DebugState = {
        build: Build,
        phase: "inicializando",
        status: [],
        logs: [],
        runtimeErrors: [],
        sent: [],
        packets: [],
        connection: {
            openedAt: null,
            closedAt: null,
            closeCode: null,
            closeReason: null,
            serverSequence: 0
        },
        token: null,
        userId: null,
        linkInfo: null,
        monetizationData: null,
        offersState: null,
        offerAuthorization: null,
        offers: [],
        unresolvedOffers: [],
        destination: null,
        failure: null
    };
    const OldLog = Window.console.log.bind(Window.console), OldWarn = Window.console.warn.bind(Window.console), OldError = Window.console.error.bind(Window.console);

    function Normalize(Value) {
        if (Value instanceof Error) return {
            name: Value.name,
            message: Value.message,
            stack: Value.stack || null
        };
        try {
            const Seen = new WeakSet, Text = JSON.stringify(Value, (Key, Item) => {
                if (/token|assessment/i.test(Key) && "string" == typeof Item) return `[redactado:${Item.length}]`;
                if (Item instanceof Error) return {
                    name: Item.name,
                    message: Item.message,
                    stack: Item.stack || null
                };
                if (Item && "object" == typeof Item) {
                    if (Seen.has(Item)) return "[circular]";
                    Seen.add(Item);
                }
                return "bigint" == typeof Item ? Item.toString() : Item;
            });
            return void 0 === Text ? String(Value) : JSON.parse(Text);
        } catch {
            return String(Value);
        }
    }

    function RecordLog(Level, Args) {
        DebugState.logs.push({
            time: Date.now(),
            level: Level,
            values: Args.map(Normalize)
        }), DebugState.logs.length > 300 && DebugState.logs.shift();
    }

    function Log(...Args) {
        RecordLog("log", Args), OldLog("[WorkinkBypass ES]", ...Args);
    }

    function Warn(...Args) {
        RecordLog("warn", Args), OldWarn("[WorkinkBypass ES]", ...Args);
    }

    function LogError(...Args) {
        RecordLog("error", Args), OldError("[WorkinkBypass ES]", ...Args);
    }

    Window.addEventListener("error", Event => {
        DebugState.runtimeErrors.push({
            time: Date.now(),
            type: "error",
            message: String(Event.message || Event.target?.src || "Error desconocido"),
            source: Event.filename || Event.target?.src || null,
            line: Event.lineno || null,
            column: Event.colno || null,
            error: Normalize(Event.error)
        }), DebugState.runtimeErrors.length > 100 && DebugState.runtimeErrors.shift();
    }, !0), Window.addEventListener("unhandledrejection", Event => {
        DebugState.runtimeErrors.push({
            time: Date.now(),
            type: "unhandledrejection",
            message: String(Event.reason?.message || Event.reason || "Rechazo desconocido"),
            error: Normalize(Event.reason)
        }), DebugState.runtimeErrors.length > 100 && DebugState.runtimeErrors.shift();
    }, !0), Window.__workinkBypassDebug = DebugState;

    const Container = Document.createElement("div"), Shadow = Container.attachShadow({
        mode: "open"
    }), ExportButton = Document.createElement("button"), ReduceMotion = Window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    Container.id = "workink-bypass-es", Container.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:block;pointer-events:auto;isolation:isolate";
    Shadow.innerHTML = `
        <style>
            :host{all:initial;color-scheme:dark}
            *{box-sizing:border-box}
            button,input{font:inherit}
            .App{--accent:#62e8cb;position:absolute;inset:0;min-width:280px;min-height:100%;overflow:auto;background:#000;color:#f5f5f7;font-family:Inter,"SF Pro Display","Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
            .Stage{display:grid;place-items:center;min-height:100dvh;padding:max(24px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left))}
            .Glass{position:relative;width:min(900px,100%);transform-origin:50% 50%;will-change:transform,opacity}
            .Inner{position:relative}
            .Hero{margin:0 0 24px}
            .TitleLockup{display:flex;align-items:flex-end;gap:14px;min-width:0}
            h1{min-width:0;margin:0;font-size:clamp(2.35rem,7vw,5rem);font-weight:720;letter-spacing:-.055em;line-height:1}
            .TitleText{position:relative;display:inline-block;color:transparent;background:linear-gradient(180deg,#fff 0%,#c7c7cc 34%,#5a5a60 67%,#080808 100%);background-clip:text;-webkit-background-clip:text}
            .TitleText::after{position:absolute;inset:0;content:attr(data-title);color:transparent;background:linear-gradient(108deg,transparent 38%,rgba(255,255,255,.98) 49%,transparent 60%);background-size:230% 100%;background-position:180% 0;background-clip:text;-webkit-background-clip:text;animation:TitleReflection 5s cubic-bezier(.4,0,.2,1) infinite;pointer-events:none}
            .AhstLockup{display:flex;flex:0 0 auto;flex-direction:column;gap:4px;padding-bottom:4px}
            .AhstName{color:#d1d1d6;font-size:17px;font-weight:760;letter-spacing:.13em;line-height:1}
            .AhstLong{max-width:132px;color:rgba(235,235,245,.34);font-size:9px;font-weight:600;letter-spacing:.055em;line-height:1.25}
            .Subtitle{margin:10px 0 0;color:#636366;font:650 11px/1.4 "SFMono-Regular",Consolas,monospace;letter-spacing:.08em;text-transform:uppercase}
            .Console{overflow:hidden;border:1px solid #1c1c1e;border-radius:16px;background:#050505}
            .ConsoleHead{display:flex;align-items:center;gap:10px;padding:12px 15px;border-bottom:1px solid #1c1c1e;background:#080808}
            .TerminalDots{display:flex;align-items:center;gap:5px}.TerminalDots i{display:block;width:7px;height:7px;border-radius:50%;opacity:.78}.TerminalDots i:nth-child(1){background:#ff5f57}.TerminalDots i:nth-child(2){background:#febc2e}.TerminalDots i:nth-child(3){background:#28c840}
            .ConsoleTitle{color:#8e8e93;font:700 10px/1 "SFMono-Regular",Consolas,monospace;letter-spacing:.14em;text-transform:uppercase}
            .ConsoleBody{height:clamp(300px,50vh,480px);overflow:auto;padding:14px 16px;scrollbar-width:thin;scrollbar-color:#2c2c2e transparent}
            .Empty{display:grid;place-items:center;height:100%;color:#48484a;font:500 12px/1.6 "SFMono-Regular",Consolas,monospace;text-align:center}
            .Line{display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:9px;padding:5px 0;color:#d1d1d6;font:500 12px/1.55 "SFMono-Regular",Consolas,monospace;word-break:break-word;will-change:transform,opacity}
            .Prompt{color:var(--accent)}.Time{color:#48484a}.Message{color:#d1d1d6}
            .DestinationAction{display:flex;padding:16px 0 4px}.DestinationButton{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 18px;border:1px solid var(--accent);border-radius:10px;background:var(--accent);color:#00130f;font:800 11px/1 "SFMono-Regular",Consolas,monospace;letter-spacing:.065em;text-decoration:none;transition:transform 140ms ease,filter 140ms ease}.DestinationButton:hover{filter:brightness(1.08)}.DestinationButton:active{transform:scale(.975)}
            .ModalLayer{position:absolute;z-index:10;inset:0;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.92)}
            .ModalLayer[hidden]{display:none}.Modal{width:min(500px,100%);padding:22px;border:1px solid #242426;border-radius:16px;background:#080808;box-shadow:0 24px 70px rgba(0,0,0,.8)}
            .ModalKicker{margin:0 0 9px;color:var(--accent);font:700 10px/1.2 "SFMono-Regular",Consolas,monospace;letter-spacing:.14em;text-transform:uppercase}.ModalTitle{margin:0;color:#f5f5f7;font-size:22px;line-height:1.15}.ModalText{margin:12px 0 18px;color:#8e8e93;font-size:13px;line-height:1.6}.ModalLabel{display:block;margin:0 0 8px;color:#d1d1d6;font-size:12px;font-weight:700}.ModalInput{width:100%;border:1px solid #2c2c2e;border-radius:10px;padding:13px 14px;outline:none;background:#000;color:#f5f5f7;font-size:14px}.ModalInput:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(98,232,203,.08)}.ModalError{min-height:18px;margin:8px 0 0;color:#ff6961;font-size:11px}.ModalActions{display:flex;justify-content:flex-end;gap:9px;margin-top:14px}.ModalButton{appearance:none;border:1px solid #2c2c2e;border-radius:10px;padding:10px 13px;background:#0c0c0c;color:#d1d1d6;font-weight:700;font-size:11px;cursor:pointer;transform-origin:50% 50%;will-change:transform}.ModalButton:hover{border-color:#48484a;color:#fff}.ModalButton.Primary{border-color:var(--accent);background:var(--accent);color:#00130f}.ModalButton.Secondary{color:#8e8e93}
            @keyframes TitleReflection{0%,70%{background-position:180% 0}100%{background-position:-130% 0}}
            @media(max-width:620px){.Stage{place-items:start center;padding:24px 14px}.Hero{margin-bottom:20px}.TitleLockup{gap:9px}h1{font-size:clamp(1.65rem,9.3vw,2.35rem)}.AhstLockup{gap:3px;padding-bottom:2px}.AhstName{font-size:13px}.AhstLong{max-width:78px;font-size:7.5px;letter-spacing:.035em}.Console{border-radius:13px}.ConsoleBody{height:58dvh;padding:12px 13px}.DestinationButton{width:100%}.Modal{padding:19px}.ModalActions{flex-direction:column-reverse}.ModalButton{width:100%}}
            @media(max-height:720px) and (min-width:621px){.Stage{place-items:start center}.ConsoleBody{height:52vh}}
            @media(prefers-reduced-motion:reduce){.Glass,.Line{will-change:auto}.TitleText::after{animation:none;background:none}}
        </style>
        <div class="App" data-state="active" role="dialog" aria-modal="true" aria-labelledby="wb-title">
            <main class="Stage">
                <section class="Glass">
                    <div class="Inner">
                        <header class="Hero HfEnter"><div class="TitleLockup"><h1 id="wb-title"><span class="TitleText" data-title="Work.Ink Bypass">Work.Ink Bypass</span></h1><span class="AhstLockup"><strong class="AhstName">AHST</strong><span class="AhstLong">Anti-Hambreado Script team</span></span></div><p class="Subtitle">TheRealBanHammer</p></header>
                        <section class="Console HfEnter" aria-label="Consola de progreso"><div class="ConsoleHead"><span class="TerminalDots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ConsoleTitle">Consola</span></div><div class="ConsoleBody" aria-live="polite"><div class="Empty">Esperando…</div></div></section>
                    </div>
                    <div class="ModalLayer" hidden></div>
                </section>
            </main>
        </div>`;
    ExportButton.type = "button";
    const Ui = {
        root: Shadow.querySelector(".App"),
        glass: Shadow.querySelector(".Glass"),
        consoleBody: Shadow.querySelector(".ConsoleBody"),
        modalLayer: Shadow.querySelector(".ModalLayer")
    };

    function WireButtonMotion(Button) {
        if (ReduceMotion || !Button) return;
        const Release = () => Button.animate([ {
            transform: "scale(.965)"
        }, {
            transform: "scale(1)"
        } ], {
            duration: 360,
            easing: "cubic-bezier(.16,1.3,.3,1)",
            fill: "both"
        });
        Button.addEventListener("pointerdown", () => Button.animate([ {
            transform: "scale(1)"
        }, {
            transform: "scale(.965)"
        } ], {
            duration: 90,
            easing: "linear",
            fill: "both"
        })), Button.addEventListener("pointerup", Release), Button.addEventListener("pointercancel", Release), Button.addEventListener("pointerleave", Event => 0 !== Event.buttons && Release());
    }

    function AnimateUiEntry() {
        if (ReduceMotion) return;
        Ui.root.animate([ {
            opacity: 0
        }, {
            opacity: 1
        } ], {
            duration: 420,
            easing: "cubic-bezier(.2,0,0,1)",
            fill: "both"
        }), Ui.glass.animate([ {
            opacity: 0,
            transform: "translateY(24px) scale(.94)"
        }, {
            opacity: 1,
            transform: "translateY(0) scale(1)"
        } ], {
            duration: 680,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "both"
        }), Shadow.querySelectorAll(".HfEnter").forEach((Element, Index) => Element.animate([ {
            opacity: 0,
            transform: "translateY(16px) scale(.985)"
        }, {
            opacity: 1,
            transform: "translateY(0) scale(1)"
        } ], {
            duration: 520,
            delay: 110 + 65 * Index,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "both"
        }));
    }

    function AnimateLogEntry(Element) {
        ReduceMotion || Element.animate([ {
            opacity: 0,
            transform: "translateY(8px) scale(.99)"
        }, {
            opacity: 1,
            transform: "translateY(0) scale(1)"
        } ], {
            duration: 360,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "both"
        });
    }

    function SetUiState(State) {
        Ui.root.dataset.state = State;
    }

    function RenderStatusEntry(Entry, Animate = !0) {
        Ui.consoleBody.querySelector(".Empty")?.remove();
        const Line = Document.createElement("div"), Prompt = Document.createElement("span"), Time = Document.createElement("span"), Message = Document.createElement("span");
        Line.className = "Line", Prompt.className = "Prompt", Prompt.textContent = ">", Time.className = "Time", Time.textContent = `[${new Date(Entry.time).toLocaleTimeString("es-MX", {
            hour12: !1,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        })}]`, Message.className = "Message", Message.textContent = Entry.message, Line.append(Prompt, Time, Message), Ui.consoleBody.append(Line);
        for (;Ui.consoleBody.querySelectorAll(".Line").length > 100;) Ui.consoleBody.querySelector(".Line")?.remove();
        Ui.consoleBody.scrollTop = Ui.consoleBody.scrollHeight, Animate && AnimateLogEntry(Line);
    }

    function IsInitialCloudflareChallengeVisible() {
        if (/\/cdn-cgi\/(?:challenge-platform|images\/trace)/i.test(location.pathname)) return !0;
        const Title = String(Document.title || ""), Text = String(Document.body?.innerText || Document.body?.textContent || "").slice(0, 2400);
        return /just a (?:moment|second)|un momento/i.test(Title) || /you are not a robot, right|verifique que es un ser humano|checking your browser|comprobando (?:su|tu) navegador/i.test(Text) || Boolean(Document.querySelector("#challenge-running,#cf-challenge-running,[data-testid='challenge-stage'],.main-wrapper #challenge-body-text,iframe[src*='/cdn-cgi/challenge-platform/']"));
    }

    function MountUiIfSafe() {
        if (UiMounted) return !0;
        if (IsInitialCloudflareChallengeVisible()) return !1;
        (Document.documentElement || Document).appendChild(Container), UiMounted = !0;
        DebugState.status.forEach(Entry => RenderStatusEntry(Entry, !1)), AnimateUiEntry();
        return !0;
    }

    async function MountUiWhenSafe() {
        for (let Attempt = 0; Attempt < 1200 && !UiMounted; Attempt += 1) {
            if (MountUiIfSafe()) return !0;
            await Sleep(250);
        }
        return UiMounted;
    }

    function SetUiSuspended(Suspended) {
        UiSecurityHidden = Suspended;
        if (!UiMounted) return;
        Container.style.display = Suspended ? "none" : "block";
        !Suspended && !ReduceMotion && Ui.root.animate([ {
            opacity: 0
        }, {
            opacity: 1
        } ], {
            duration: 320,
            easing: "cubic-bezier(.2,0,0,1)",
            fill: "both"
        });
    }

    async function PromptForValue(Options) {
        if (!UiMounted && !await MountUiWhenSafe()) throw new Error("No se pudo mostrar el formulario de inicio de sesión");
        SetUiSuspended(!1), Ui.modalLayer.replaceChildren(), Ui.modalLayer.hidden = !1;
        return new Promise((Resolve, Reject) => {
            const Modal = Document.createElement("form"), Kicker = Document.createElement("p"), Title = Document.createElement("h2"), Text = Document.createElement("p"), Label = Document.createElement("label"), Input = Document.createElement("input"), ErrorText = Document.createElement("p"), Actions = Document.createElement("div"), Cancel = Document.createElement("button"), Submit = Document.createElement("button");
            Modal.className = "Modal", Kicker.className = "ModalKicker", Kicker.textContent = "Cuenta Work.ink", Title.className = "ModalTitle", Title.textContent = Options.title, Text.className = "ModalText", Text.textContent = Options.message, Label.className = "ModalLabel", Label.textContent = Options.label, Input.className = "ModalInput", Input.type = Options.type || "text", Input.placeholder = Options.placeholder || "", Input.autocomplete = Options.autocomplete || "off", ErrorText.className = "ModalError", Actions.className = "ModalActions", Cancel.className = "ModalButton Secondary", Cancel.type = "button", Cancel.textContent = "Cancelar", Submit.className = "ModalButton Primary", Submit.type = "submit", Submit.textContent = Options.button || "Continuar", Actions.append(Cancel, Submit), Modal.append(Kicker, Title, Text, Label, Input, ErrorText, Actions), Ui.modalLayer.append(Modal), WireButtonMotion(Cancel), WireButtonMotion(Submit);
            const Close = () => {
                Ui.modalLayer.hidden = !0, Ui.modalLayer.replaceChildren();
            }, CancelPrompt = () => {
                Close(), Reject(new Error("Inicio de sesión cancelado por el usuario"));
            };
            Cancel.addEventListener("click", CancelPrompt), Modal.addEventListener("submit", Event => {
                Event.preventDefault();
                const Value = Input.value.trim(), ValidationError = Options.validate?.(Value);
                if (ValidationError) return void (ErrorText.textContent = ValidationError);
                Close(), Resolve(Value);
            }), ReduceMotion || Modal.animate([ {
                opacity: 0,
                transform: "translateY(18px) scale(.95)"
            }, {
                opacity: 1,
                transform: "translateY(0) scale(1)"
            } ], {
                duration: 520,
                easing: "cubic-bezier(.16,1,.3,1)",
                fill: "both"
            }), setTimeout(() => Input.focus(), 0);
        });
    }

    function UpdateStatus(Message) {
        const Entry = {
            time: Date.now(),
            message: Message
        };
        DebugState.phase = Message, DebugState.status.push(Entry), DebugState.status.length > 100 && DebugState.status.shift(), UiMounted && !UiSecurityHidden && RenderStatusEntry(Entry), Log(Message);
    }

    function CloseConnection() {
        PingTimer && (clearInterval(PingTimer), PingTimer = null);
        try {
            Socket?.close();
        } catch {}
    }

    function Fail(Message, ErrorValue = null) {
        if (Finished || RedirectScheduled) return;
        Finished = !0, DebugState.failure = {
            time: Date.now(),
            message: Message,
            error: Normalize(ErrorValue)
        }, SetUiState("error", "Atención requerida"), UpdateStatus(`Error: ${Message}`), void MountUiWhenSafe(), ErrorValue && LogError(Message, ErrorValue),
        CloseConnection();
    }

    function Redirect(Destination) {
        if (!Destination || RedirectScheduled) return;
        RedirectScheduled = !0, Finished = !0, DebugState.destination = {
            receivedAt: Date.now(),
            url: Destination
        }, Window.wokeresponse = Destination, CloseConnection();
        Document.querySelectorAll("[id^='workink-direct-'][id$='-panel']").forEach(Panel => Panel.remove()), SetUiSuspended(!1), SetUiState("success"), UpdateStatus("Bypass completado. El destino final está listo.");
        const RenderDestinationAction = () => {
            if (!UiMounted) return;
            Ui.consoleBody.querySelector(".DestinationAction")?.remove();
            const Action = Document.createElement("div"), Link = Document.createElement("a");
            Action.className = "DestinationAction", Link.className = "DestinationButton", Link.textContent = "ABRIR DESTINO FINAL", Link.href = Destination, Link.addEventListener("click", () => {
                Link.textContent = "ABRIENDO…";
            }), Action.append(Link), Ui.consoleBody.append(Action), Ui.consoleBody.scrollTop = Ui.consoleBody.scrollHeight, AnimateLogEntry(Action);
        };
        UiMounted ? RenderDestinationAction() : void MountUiWhenSafe().then(Mounted => Mounted && RenderDestinationAction());
    }

    function InspectToken(Token) {
        const Info = {
            present: Boolean(Token),
            length: "string" == typeof Token ? Token.length : 0,
            issuedAt: null,
            expiresAt: null,
            expired: !1
        };
        if (!Token || "string" != typeof Token) return Info;
        try {
            const Encoded = Token.split(".")[1], Normalized = Encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(4 * Math.ceil(Encoded.length / 4), "="), Payload = JSON.parse(Window.atob(Normalized));
            Info.issuedAt = Number.isFinite(Number(Payload.iat)) ? Number(Payload.iat) : null,
            Info.expiresAt = Number.isFinite(Number(Payload.exp)) ? Number(Payload.exp) : null,
            Info.expired = null !== Info.expiresAt && 1e3 * Info.expiresAt <= Date.now() + 3e4;
        } catch {}
        return Info;
    }

    function GetCustomerToken() {
        const Candidates = [];
        for (const StorageName of [ "localStorage", "sessionStorage" ]) for (const Key of [ "customerToken", "customerSessionToken" ]) try {
            Candidates.push({
                source: `${StorageName}.${Key}`,
                token: Window[StorageName]?.getItem(Key) || ""
            });
        } catch {}
        for (const Key of [ "customerToken", "customerSessionToken" ]) try {
            Candidates.push({
                source: `window.${Key}`,
                token: Window[Key] || ""
            });
        } catch {}
        for (const Candidate of Candidates) {
            const Info = InspectToken(Candidate.token);
            if (Info.present && !Info.expired) return DebugState.token = {
                source: Candidate.source,
                ...Info
            }, {
                ...Candidate,
                info: Info
            };
        }
        DebugState.token = Candidates.map(Candidate => ({
            source: Candidate.source,
            ...InspectToken(Candidate.token)
        }));
        return null;
    }

    function ClearCustomerToken(Token) {
        if (!Token) return;
        for (const StorageName of [ "localStorage", "sessionStorage" ]) for (const Key of [ "customerToken", "customerSessionToken" ]) try {
            Window[StorageName]?.getItem(Key) === Token && Window[StorageName].removeItem(Key);
        } catch {}
    }

    async function FetchJson(Url, Options = {}) {
        const Response = await Window.fetch(Url, {
            credentials: "include",
            ...Options,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...Options.headers
            }
        }), Text = await Response.text();
        let Body = null;
        try {
            Body = JSON.parse(Text);
        } catch {}
        return {
            ok: Response.ok,
            status: Response.status,
            body: Body,
            text: Text
        };
    }

    async function RequestPremiumSession() {
        SetUiState("error", "Inicio de sesión requerido"), UpdateStatus("No hay una sesión premium activa. Inicia sesión para continuar.");
        const Email = await PromptForValue({
            title: "Inicia sesión en Work.ink",
            message: "Escribe un correo de Gmail o cualquier correo al que tengas acceso. Work.ink enviará allí un código de verificación.",
            label: "Correo electrónico",
            placeholder: "tuusuario@gmail.com",
            type: "email",
            autocomplete: "email",
            button: "Continuar con el correo",
            validate: Value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(Value) ? "" : "Escribe una dirección de correo válida."
        });
        UpdateStatus("Completa la verificación de seguridad para solicitar el código 2FA…");
        const TurnstileToken = await SolveTurnstile("premium_login", "Verifica el inicio de sesión", "Esperando la verificación Turnstile de la cuenta…");
        UpdateStatus("Solicitando el código de inicio de sesión a Work.ink…");
        const MailResponse = await FetchJson("https://work.ink/_api/v2/premium/sendLoginCode", {
            method: "POST",
            body: JSON.stringify({
                email: Email,
                turnstileToken: TurnstileToken
            })
        });
        if (!MailResponse.ok || !0 !== MailResponse.body?.mailSent) throw new Error(`Work.ink no pudo enviar el código de acceso (HTTP ${MailResponse.status})`);
        UpdateStatus("Código enviado. Revisa tu correo e introdúcelo para continuar.");
        const Code = await PromptForValue({
            title: "Verifica tu correo",
            message: `Work.ink envió un código a ${Email}. Pégalo aquí para crear la sesión premium.`,
            label: "Código de verificación",
            placeholder: "123456",
            type: "text",
            autocomplete: "one-time-code",
            button: "Verificar e iniciar sesión",
            validate: Value => Value.length >= 4 && Value.length <= 16 ? "" : "Escribe el código que recibiste por correo."
        });
        UpdateStatus("Validando el código e iniciando la sesión premium…");
        const LoginResponse = await FetchJson("https://work.ink/_api/v2/premium/login", {
            method: "POST",
            body: JSON.stringify({
                email: Email,
                code: Code
            })
        }), Token = LoginResponse.body?.token;
        if (!LoginResponse.ok || "string" != typeof Token || Token.length < 20) throw new Error(`Work.ink rechazó el inicio de sesión (HTTP ${LoginResponse.status})`);
        try {
            Window.localStorage.setItem("customerToken", Token), Window.localStorage.setItem("customerTokenSource", "inicio-sesion-manual");
        } catch {}
        try {
            const Expiration = new Date;
            Expiration.setHours(Expiration.getHours() + 47), Document.cookie = `wpsession=${encodeURIComponent(Token)}; expires=${Expiration.toUTCString()}; path=/; Secure; SameSite=Lax`;
        } catch {}
        try {
            await Window.fetch(`https://work.ink/_api/v2/premium/paymentProvider?token=${encodeURIComponent(Token)}`, {
                method: "GET",
                credentials: "include"
            });
        } catch (ActivationError) {
            Warn("No se pudo precargar la sesión premium", ActivationError);
        }
        const Session = GetCustomerToken() || {
            source: "inicio-sesion-manual",
            token: Token,
            info: InspectToken(Token)
        };
        SetUiState("active", "Sesión iniciada"), UpdateStatus("Sesión premium iniciada correctamente. Continuando con el bypass…");
        return Session;
    }

    async function RecoverPremiumSession(Message) {
        if (SessionRecoveryActive || Finished || RedirectScheduled) return;
        SessionRecoveryActive = !0, ClearCustomerToken(SelectedToken?.token), SetUiState("error", "Cuenta premium requerida"), UpdateStatus(`Error de cuenta premium: ${Message}`), CloseConnection();
        try {
            SelectedToken = await RequestPremiumSession(), UpdateStatus("Cuenta recuperada. Reiniciando el enlace de forma segura…"), await Sleep(700), Window.location.reload();
        } catch (RecoveryError) {
            SessionRecoveryActive = !1, Fail(RecoveryError.message || String(RecoveryError), RecoveryError);
        }
    }

    function EncodePart(Value, Key) {
        const KeyBytes = [ ...Key ].map(Character => 255 & Character.charCodeAt(0)), ValueBytes = (new TextEncoder).encode(Value);
        let Seed = Date.now() % 256, Encoded = Seed.toString(16).padStart(2, "0");
        for (let Index = 0; Index < ValueBytes.length; Index += 1) {
            const KeyByte = KeyBytes[(2 * Index + Seed) % KeyBytes.length];
            Encoded += (((ValueBytes[Index] ^ KeyByte) + Index % 8) % 256).toString(16).padStart(2, "0"), Seed = (19 * Seed + 29) % 256;
        }
        return Encoded;
    }

    function DecodePart(Value, Key) {
        const KeyBytes = [ ...Key ].map(Character => 255 & Character.charCodeAt(0)), Decoded = [];
        let Seed = Number.parseInt(Value.slice(0, 2), 16);
        for (let Position = 2, Index = 0; Position < Value.length; Position += 2, Index += 1) {
            const Encrypted = Number.parseInt(Value.slice(Position, Position + 2), 16), KeyByte = KeyBytes[(2 * Index + Seed) % KeyBytes.length], Adjusted = (Encrypted - Index % 8 + 256) % 256;
            Decoded.push(255 & (Adjusted ^ KeyByte)), Seed = (19 * Seed + 29) % 256;
        }
        return (new TextDecoder).decode(Uint8Array.from(Decoded));
    }

    function EncodePacket(Type, Payload) {
        return EncodePart(JSON.stringify({
            type: Type,
            payload: EncodePart(JSON.stringify(Payload), WorkinkInnerKey)
        }), WorkinkOuterKey);
    }

    function DecodePacket(Value) {
        const Packet = JSON.parse(DecodePart(Value, WorkinkOuterKey));
        if ("string" != typeof Packet?.type || "string" != typeof Packet?.payload) throw new Error("Cambió la estructura de los paquetes de Work.ink");
        return Packet.payload = JSON.parse(DecodePart(Packet.payload, WorkinkInnerKey)), Packet;
    }

    function Send(Type, Payload = {}) {
        if (Socket?.readyState !== NativeWebSocket.OPEN) throw new Error(`No se puede enviar ${Type}: el WebSocket no está abierto`);
        const Raw = EncodePacket(Type, Payload);
        Socket.send(Raw), DebugState.sent.push({
            time: Date.now(),
            type: Type,
            length: Raw.length,
            payload: Normalize(Payload)
        }), DebugState.sent.length > 250 && DebugState.sent.shift(), Log("Paquete enviado", Type, Normalize(Payload));
    }

    function GetOfferIds(Payload) {
        if (Array.isArray(Payload)) return Payload;
        const Values = Payload?.authorized || Payload?.ids || Payload?.offerIds || Payload?.monetizationIds || [];
        return Array.isArray(Values) ? Values : Values && "object" == typeof Values ? Object.keys(Values).filter(Id => Values[Id]) : [];
    }

    function GetProgress() {
        const AdvertisedNeeded = Number(LinkInfo?.monetizationsNeeded), ServerNeeded = Number(LatestOffersState?.neededOffers), Needed = ServerNeeded > 0 ? ServerNeeded : Number.isFinite(AdvertisedNeeded) ? AdvertisedNeeded : 0;
        return {
            completed: Number(LatestOffersState?.completedOffers) || 0,
            needed: Needed
        };
    }

    function GoalReached() {
        const Progress = GetProgress();
        return Progress.needed <= 0 || Progress.completed >= Progress.needed;
    }

    function RecordPacket(Packet, Raw) {
        const Entry = {
            sequence: ++ServerSequence,
            time: Date.now(),
            packet: Packet
        };
        DebugState.connection.serverSequence = ServerSequence, PacketHistory.push(Entry), PacketHistory.length > 200 && PacketHistory.shift(),
        DebugState.packets.push({
            sequence: Entry.sequence,
            time: Entry.time,
            type: Packet.type,
            length: Raw.length,
            payload: Normalize(Packet.payload)
        }), DebugState.packets.length > 250 && DebugState.packets.shift();
        for (const Waiter of [ ...PacketWaiters ]) if (Entry.sequence > Waiter.after) try {
            Waiter.predicate(Packet) && Waiter.resolve(Entry);
        } catch (PredicateError) {
            LogError("Falló la comprobación del paquete", PredicateError), Waiter.resolve(null);
        }
        return Entry;
    }

    function WaitForPacket(After, Predicate, Timeout) {
        const Existing = PacketHistory.find(Entry => Entry.sequence > After && Predicate(Entry.packet));
        return Existing ? Promise.resolve(Existing) : new Promise(Resolve => {
            const Waiter = {
                after: After,
                predicate: Predicate,
                timer: null,
                resolve(Value) {
                    clearTimeout(Waiter.timer), PacketWaiters.delete(Waiter), Resolve(Value);
                }
            };
            Waiter.timer = setTimeout(() => Waiter.resolve(null), Timeout), PacketWaiters.add(Waiter);
        });
    }

    function HandlePacket(Packet, Raw) {
        const Payload = Packet.payload;
        if (Packet.type === ServerPacket.LINK_INFO) LinkInfo = Payload, LinkInfoAt = Date.now(), LatestTurnstileAction = Payload.turnstileAction || LatestTurnstileAction,
        DebugState.linkInfo = Normalize(Payload);
        if (Packet.type === ServerPacket.TURNSTILE_ACTION && Payload?.action) LatestTurnstileAction = Payload.action;
        if (Packet.type === ServerPacket.MONETIZATION_DATA && Payload && "object" == typeof Payload) MonetizationData = Payload,
        DebugState.monetizationData = Normalize(Payload);
        if (Packet.type === ServerPacket.OFFERS_STATE) LatestOffersState = {
            completedOffers: Number(Payload?.completedOffers) || 0,
            neededOffers: Number(Payload?.neededOffers) || 0
        }, DebugState.offersState = {
            ...LatestOffersState
        };
        if (Packet.type === ServerPacket.OFFER_URLS) {
            for (const Id of GetOfferIds(Payload)) AuthorizedOffers.add(Number(Id));
            OfferUrlOverrides = Payload?.urlOverrides && "object" == typeof Payload.urlOverrides ? Payload.urlOverrides : OfferUrlOverrides,
            DebugState.offerAuthorization = Normalize(Payload);
        }
        const Entry = RecordPacket(Packet, Raw);
        Log("Paquete recibido", Entry.sequence, Packet.type, Normalize(Payload));
        if (Packet.type === ServerPacket.ERROR) {
            const Message = String(Payload?.error || Payload?.message || "Work.ink rechazó la conexión"), InvalidToken = /customer session token|session token|premium/i.test(Message);
            return void (InvalidToken ? RecoverPremiumSession("La sesión guardada es inválida o ha caducado.") : Fail(Message));
        }
        if (Packet.type === ServerPacket.LINK_NOT_FOUND) return void Fail("Work.ink no pudo encontrar este enlace");
        if (Packet.type === ServerPacket.PROXY_DETECTED) return void Fail("Work.ink detectó una VPN o un proxy");
        if (Packet.type === ServerPacket.PREMIUM_ONLY) return void RecoverPremiumSession("Este enlace necesita una cuenta premium activa.");
        if (Packet.type === ServerPacket.LINK_DESTINATION && Payload?.url) return void Redirect(Payload.url);
        if (Packet.type === ServerPacket.LINK_INFO && !FlowStarted) FlowStarted = !0, RunFlow(Payload).catch(FlowError => Fail(FlowError.message || String(FlowError), FlowError));
    }

    function Sleep(Milliseconds) {
        return new Promise(Resolve => setTimeout(Resolve, Milliseconds));
    }

    function CreateCaptchaPanel(Id, Title) {
        Document.getElementById(`${Id}-panel`)?.remove();
        SetUiSuspended(!0);
        const Panel = Document.createElement("div"), Card = Document.createElement("div"), Label = Document.createElement("div"), Slot = Document.createElement("div");
        Panel.id = `${Id}-panel`, Panel.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:8px;box-sizing:border-box;background:#000;font-family:Inter,'Segoe UI',system-ui,sans-serif;color:#fff;text-align:center;pointer-events:auto",
        Card.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:14px;width:min(380px,calc(100vw - 16px));padding:18px 10px;box-sizing:border-box;border-radius:16px;background:#050505;border:1px solid #1c1c1e",
        Label.textContent = Title, Label.style.cssText = "font-size:15px;font-weight:700;line-height:1.35", Slot.id = Id, Slot.style.cssText = "display:flex;align-items:center;justify-content:center;width:100%;min-width:0;min-height:70px;overflow:visible", Card.append(Label, Slot), Panel.append(Card),
        (Document.body || Document.documentElement).appendChild(Panel), ReduceMotion || Card.animate([ {
            opacity: 0,
            transform: "translateY(18px) scale(.95)"
        }, {
            opacity: 1,
            transform: "translateY(0) scale(1)"
        } ], {
            duration: 520,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "both"
        });
        return {
            panel: Panel,
            slot: Slot
        };
    }

    function LoadScript(Id, Source) {
        if (Document.getElementById(Id)) return;
        const Script = Document.createElement("script");
        Script.id = Id, Script.src = Source, Script.async = !0, Script.defer = !0, (Document.head || Document.documentElement).appendChild(Script);
    }

    function SolveTurnstile(Action, Title, Status) {
        return new Promise((Resolve, Reject) => {
            LoadScript("workink-direct-turnstile", "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
            const Id = `workink-direct-turnstile-${++CaptchaSequence}`, Captcha = CreateCaptchaPanel(Id, Title || "Completa la verificación de seguridad");
            UpdateStatus(Status || "Completa la verificación Turnstile…");
            let Done = !1, Widget = null;
            const Finish = (ErrorValue, Token) => {
                if (Done) return;
                Done = !0, clearInterval(Loader), clearTimeout(Timeout), Captcha.panel.remove(), SetUiSuspended(!1);
                try {
                    null !== Widget && Window.turnstile?.remove?.(Widget);
                } catch {}
                ErrorValue ? Reject(ErrorValue) : Resolve(Token);
            }, Timeout = setTimeout(() => Finish(new Error("La verificación Turnstile agotó el tiempo de espera")), 24e4), Started = Date.now(), Loader = setInterval(() => {
                if ("function" != typeof Window.turnstile?.render) return void (Date.now() - Started > 3e4 && Finish(new Error("Turnstile no pudo cargar")));
                clearInterval(Loader);
                try {
                    const Options = {
                        sitekey: TurnstileSiteKey,
                        theme: "dark",
                        callback: Token => Finish(null, Token),
                        "error-callback": ErrorValue => Finish(new Error(`Error de Turnstile: ${ErrorValue}`)),
                        "expired-callback": () => Finish(new Error("El token de Turnstile caducó"))
                    };
                    Action && (Options.action = Action), Widget = Window.turnstile.render(Captcha.slot, Options);
                } catch (RenderError) {
                    Finish(RenderError);
                }
            }, 100);
        });
    }

    function SolveHcaptcha(Title, Status) {
        return new Promise((Resolve, Reject) => {
            LoadScript("workink-direct-hcaptcha", "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=on&sentry=false");
            const Id = `workink-direct-hcaptcha-${++CaptchaSequence}`, Captcha = CreateCaptchaPanel(Id, Title || "Completa la verificación hCaptcha");
            UpdateStatus(Status || "Completa la verificación hCaptcha…");
            let Done = !1, Widget = null;
            const Finish = (ErrorValue, Token) => {
                if (Done) return;
                Done = !0, clearInterval(Loader), clearTimeout(Timeout), Captcha.panel.remove(), SetUiSuspended(!1);
                try {
                    null !== Widget && Window.hcaptcha?.remove?.(Widget);
                } catch {}
                ErrorValue ? Reject(ErrorValue) : Resolve(Token);
            }, Timeout = setTimeout(() => Finish(new Error("La verificación hCaptcha agotó el tiempo de espera")), 24e4), Started = Date.now(), Loader = setInterval(() => {
                if ("function" != typeof Window.hcaptcha?.render) return void (Date.now() - Started > 3e4 && Finish(new Error("hCaptcha no pudo cargar")));
                clearInterval(Loader);
                try {
                    Widget = Window.hcaptcha.render(Captcha.slot, {
                        sitekey: HcaptchaSiteKey,
                        theme: "dark",
                        callback: Token => Finish(null, Token),
                        "error-callback": ErrorValue => Finish(new Error(`Error de hCaptcha: ${ErrorValue}`)),
                        "expired-callback": () => Finish(new Error("El token de hCaptcha caducó"))
                    });
                } catch (RenderError) {
                    Finish(RenderError);
                }
            }, 100);
        });
    }

    async function VerifyInitialCaptcha(Info) {
        Send("c_env_check", {
            flags: [ "e2b", "e7" ]
        });
        if (Info.requireTurnstile) {
            const Token = await SolveTurnstile(LatestTurnstileAction || Info.turnstileAction, "Completa la verificación de Work.ink", "Esperando la verificación Turnstile inicial…");
            if (Finished) return;
            const After = ServerSequence;
            Send("c_turnstile_response", {
                token: Token
            }), UpdateStatus("Turnstile completado. Esperando la confirmación del servidor…");
            const Result = await WaitForPacket(After, Packet => Packet.type === ServerPacket.TURNSTILE_ACTION || Packet.type === ServerPacket.START_HCAPTCHA_CHECK || Packet.type === ServerPacket.HCAPTCHA_OKAY || Packet.type === ServerPacket.OFFER_URLS || Packet.type === ServerPacket.ERROR, 2e4);
            if (!Result) throw new Error("Work.ink no confirmó la respuesta de Turnstile");
            if (Result.packet.type === ServerPacket.ERROR) return;
        }
        if (!Info.requireHcaptcha && !PacketHistory.some(Entry => Entry.packet.type === ServerPacket.START_HCAPTCHA_CHECK)) return;
        const Requested = Math.max(1, Number.parseInt(Info.hcaptchaSolvesNeeded, 10) || 1);
        for (let Solve = 0; Solve < Requested; Solve += 1) {
            const Token = await SolveHcaptcha("Completa el hCaptcha de Work.ink", `Esperando hCaptcha ${Solve + 1}/${Requested}…`);
            if (Finished) return;
            const After = ServerSequence;
            Send("c_hcaptcha_response", {
                token: Token
            }), UpdateStatus(`hCaptcha enviado (${Solve + 1}/${Requested}). Esperando confirmación…`);
            const Result = await WaitForPacket(After, Packet => Packet.type === ServerPacket.HCAPTCHA_OKAY || Packet.type === ServerPacket.OFFER_URLS || Packet.type === ServerPacket.START_HCAPTCHA_CHECK || Packet.type === ServerPacket.ERROR, 3e4);
            if (!Result) throw new Error("Work.ink no confirmó la respuesta de hCaptcha");
            if (Result.packet.type === ServerPacket.ERROR) return;
            if (Result.packet.type === ServerPacket.HCAPTCHA_OKAY && !1 === Result.packet.payload?.done && Solve + 1 >= Requested) throw new Error("Work.ink solicitó resolver otro hCaptcha");
        }
    }

    async function CompleteSocials(Socials) {
        if (!Array.isArray(Socials) || 0 === Socials.length) return;
        for (let Index = 0; Index < Socials.length; Index += 1) {
            if (Finished) return;
            const Social = Socials[Index], After = ServerSequence;
            UpdateStatus(`Completando tarea social ${Index + 1}/${Socials.length}…`), Send("c_social_started", {
                url: Social.url
            }), Send("c_focus_lost", {}), await Sleep(750), Send("c_focus", {});
            const Result = await WaitForPacket(After, Packet => Packet.type === ServerPacket.SOCIAL_DONE || Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.ERROR, 1e4);
            Result || Warn("No se recibió confirmación de la tarea social", Social.type, Social.url);
        }
    }

    async function CompletePremiumWall(Info) {
        const Seconds = Math.max(0, Number(Info.premiumWallSeconds) || 0), Deadline = (LinkInfoAt || Date.now()) + 1e3 * Seconds + 1200;
        DebugState.premiumWall = {
            seconds: Seconds,
            startedAt: LinkInfoAt,
            deadline: Deadline,
            sentAt: null
        };
        let LastShown = null;
        while (!Finished && Date.now() < Deadline) {
            const Remaining = Math.max(1, Math.ceil((Deadline - Date.now()) / 1e3));
            if (Remaining !== LastShown) UpdateStatus(`Esperando el temporizador obligatorio de Work.ink (${Remaining} s)…`), LastShown = Remaining;
            await Sleep(Math.min(1e3, Math.max(1, Deadline - Date.now())));
        }
        if (Finished) return;
        Send("c_premium_modal_done", {}), DebugState.premiumWall.sentAt = Date.now(), UpdateStatus("Temporizador obligatorio completado. Sincronizando ofertas…");
    }

    async function SynchronizeOffers() {
        const Deadline = Date.now() + 25e3;
        let After = ServerSequence;
        while (!Finished && Date.now() < Deadline && (!LatestOffersState || !MonetizationData || 0 === Object.keys(MonetizationData).length)) {
            const Result = await WaitForPacket(After, Packet => Packet.type === ServerPacket.MONETIZATION_DATA || Packet.type === ServerPacket.OFFERS_STATE || Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.ERROR, Math.max(1, Deadline - Date.now()));
            if (!Result) break;
            After = Result.sequence;
        }
        if (!Finished && !LatestOffersState) Warn("Work.ink no envió el estado de las ofertas antes de la inicialización");
    }

    function ResolveOfferName(Id, Definition) {
        if ("string" == typeof Definition?.name && Definition.name) return {
            name: Definition.name,
            source: "packet"
        };
        if (MonetizationNames[Id]) return {
            name: MonetizationNames[Id],
            source: "catalog"
        };
        if ("oneclick" === Definition?.template && Id >= SmartdealsBaseId) return {
            name: `smartdeals_${SmartdealsBaseStamp + Id - SmartdealsBaseId}`,
            source: "derived"
        };
        return null;
    }

    function FetchCatalog() {
        CatalogPromise || (CatalogPromise = Window.fetch("/_api/v2/redirection/monetizationData", {
            credentials: "include"
        }).then(Response => Response.ok ? Response.json() : {}).catch(CatalogError => (Warn("No se pudo cargar el catálogo de monetización", CatalogError), {})));
        return CatalogPromise;
    }

    async function BuildOffers(Ids) {
        const Offers = [], Unresolved = [];
        let Catalog = null;
        for (const RawId of [ ...new Set(Ids.map(Number).filter(Number.isFinite)) ]) {
            const Definition = MonetizationData?.[String(RawId)] || MonetizationData?.[RawId] || null;
            let Resolved = ResolveOfferName(RawId, Definition);
            if (!Resolved) {
                Catalog = Catalog || await FetchCatalog();
                const Remote = Catalog?.[String(RawId)] || Catalog?.[RawId];
                if ("string" == typeof Remote?.name && Remote.name) Resolved = {
                    name: Remote.name,
                    source: "catalog-live",
                    template: Remote.template || null
                };
            }
            if (!Resolved) {
                Unresolved.push({
                    id: RawId,
                    template: Definition?.template || null,
                    hasPacketData: Boolean(Definition)
                });
                continue;
            }
            Offers.push({
                id: RawId,
                name: Resolved.name,
                nameSource: Resolved.source,
                url: Definition?.offerUrl || null,
                definition: Definition || {
                    template: Resolved.template || null
                }
            });
        }
        DebugState.unresolvedOffers = Unresolved;
        Unresolved.length && Warn("Identificadores de monetización desconocidos", Unresolved);
        DebugState.offers = Offers.map(Offer => ({
            id: Offer.id,
            name: Offer.name,
            nameSource: Offer.nameSource,
            template: Offer.definition.template || null,
            hasUrl: Boolean(Offer.url),
            state: "pending"
        }));
        return Offers;
    }

    function FindOfferUrl(Offer) {
        const Direct = OfferUrlOverrides?.[Offer.id] ?? OfferUrlOverrides?.[String(Offer.id)] ?? OfferUrlOverrides?.[Offer.name];
        if ("string" == typeof Direct) return Direct;
        if (Direct && "object" == typeof Direct) return Direct.url || Direct.offerUrl || Direct.href || Offer.url;
        return Offer.url;
    }

    async function AuthorizeOffer(Offer, Index, Total) {
        if (GoalReached()) return !0;
        const TurnstileToken = await SolveTurnstile(LatestTurnstileAction || LinkInfo?.turnstileAction, `Verifica la monetización ${Index + 1}/${Total}`, `Completa Turnstile para la monetización ${Offer.id}…`);
        if (Finished) return !1;
        const After = ServerSequence;
        Send("c_turnstile_response", {
            token: TurnstileToken,
            monetizationId: Offer.id
        });
        let Result = await WaitForPacket(After, Packet => GetOfferIds(Packet.payload).some(Id => Number(Id) === Offer.id) || Packet.type === ServerPacket.START_HCAPTCHA_CHECK && Number(Packet.payload?.monetizationId) === Offer.id || Packet.type === ServerPacket.START_TURNSTILE_CHECK && Number(Packet.payload?.monetizationId) === Offer.id || Packet.type === ServerPacket.ERROR || Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.OFFERS_STATE && GoalReached(), 25e3);
        if (Finished || Result?.packet.type === ServerPacket.ERROR || Result?.packet.type === ServerPacket.START_TURNSTILE_CHECK) return !1;
        if (AuthorizedOffers.has(Offer.id) || GoalReached()) return !0;
        if (Result?.packet.type !== ServerPacket.START_HCAPTCHA_CHECK) return !1;
        const SolvesNeeded = Math.max(1, Number.parseInt(Result.packet.payload?.solvesNeeded, 10) || 1);
        for (let Solve = 0; Solve < SolvesNeeded; Solve += 1) {
            const HcaptchaToken = await SolveHcaptcha(`Verifica la monetización ${Index + 1}/${Total}`, `Completa hCaptcha ${Solve + 1}/${SolvesNeeded} para la monetización ${Offer.id}…`);
            if (Finished) return !1;
            const HcaptchaAfter = ServerSequence;
            Send("c_hcaptcha_response", {
                token: HcaptchaToken,
                monetizationId: Offer.id
            }), Result = await WaitForPacket(HcaptchaAfter, Packet => GetOfferIds(Packet.payload).some(Id => Number(Id) === Offer.id) || Packet.type === ServerPacket.HCAPTCHA_OKAY || Packet.type === ServerPacket.START_HCAPTCHA_CHECK || Packet.type === ServerPacket.ERROR || Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.OFFERS_STATE && GoalReached(), 3e4);
            if (Finished || Result?.packet.type === ServerPacket.ERROR) return !1;
            if (AuthorizedOffers.has(Offer.id) || GoalReached()) return !0;
        }
        const Authorization = await WaitForPacket(ServerSequence, Packet => GetOfferIds(Packet.payload).some(Id => Number(Id) === Offer.id) || Packet.type === ServerPacket.ERROR || Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.OFFERS_STATE && GoalReached(), 2e4);
        return Boolean(AuthorizedOffers.has(Offer.id) || GoalReached() || Authorization && GetOfferIds(Authorization.packet.payload).some(Id => Number(Id) === Offer.id));
    }

    function OpenOffer(Url, DebugOffer) {
        const Methods = [];
        DebugOffer.offerOpen = Methods;
        if (!Url || Url.startsWith("https://example.com") || Url.startsWith("http://example.com")) return Methods.push("none"), null;
        let Popup = null;
        try {
            Popup = Window.open(Url, "_blank");
        } catch (OpenError) {
            Warn("No se pudo abrir la ventana de la oferta", OpenError);
        }
        if (Popup) {
            Methods.push("window");
            setTimeout(() => {
                try {
                    Popup.close();
                } catch {}
            }, OfferDwellMs + 5e3);
        } else {
            const Frame = Document.createElement("iframe");
            Frame.style.cssText = "position:fixed;width:320px;height:240px;left:-9999px;top:-9999px;border:0;pointer-events:none", Frame.src = Url,
            (Document.body || Document.documentElement).appendChild(Frame), Methods.push("iframe"), setTimeout(() => Frame.remove(), OfferDwellMs + 1e4);
        }
        Window.fetch(Url, {
            mode: "no-cors",
            credentials: "include",
            redirect: "follow"
        }).then(() => Methods.push("fetch")).catch(FetchError => (Methods.push("fetch-failed"), Warn("Falló la solicitud de la oferta", Url, FetchError)));
        return Popup;
    }

    async function RunOffer(Offer, Index, Total) {
        const DebugOffer = DebugState.offers.find(Item => Item.id === Offer.id), Baseline = GetProgress().completed;
        DebugOffer.state = "captcha";
        if (!await AuthorizeOffer(Offer, Index, Total)) return DebugOffer.state = "authorization-failed", !1;
        if (GoalReached() || Finished) return DebugOffer.state = "not-required", !0;
        DebugOffer.state = "authorized";
        const After = ServerSequence, Payload = Event => ({
            type: Offer.name,
            payload: {
                event: Event
            },
            s: WorkinkOuterKey
        }), Url = FindOfferUrl(Offer);
        DebugOffer.offerUrl = Url || null, DebugOffer.startedAt = Date.now();
        UpdateStatus(`Procesando monetización ${Index + 1}/${Total} (ID ${Offer.id})…`), Send("c_monetization", Payload("init")), OpenOffer(Url, DebugOffer), await Sleep(100), Send("c_monetization", Payload("start")), Send("c_focus_lost", {}), DebugOffer.state = "dwell";
        const DwellUntil = Date.now() + OfferDwellMs;
        while (!Finished && Date.now() < DwellUntil && GetProgress().completed <= Baseline) {
            UpdateStatus(`Procesando monetización ${Index + 1}/${Total} (${Math.max(1, Math.ceil((DwellUntil - Date.now()) / 1e3))} s)…`), await Sleep(1e3);
        }
        if (Finished) return !1;
        DebugOffer.dwellMs = Date.now() - DebugOffer.startedAt, Send("c_focus", {}), DebugOffer.state = "waiting", UpdateStatus(`Esperando confirmación de la monetización ${Index + 1}/${Total}…`);
        let Result = await WaitForPacket(After, Packet => Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.ERROR || Packet.type === ServerPacket.OFFERS_STATE && Number(Packet.payload?.completedOffers) > Baseline || Packet.type === ServerPacket.MONETIZATION && Packet.payload?.type === Offer.name && "done" === Packet.payload?.payload?.event, 45e3);
        if (Finished || Result?.packet.type === ServerPacket.ERROR) return !1;
        if (Result?.packet.type === ServerPacket.MONETIZATION && !GoalReached()) Result = await WaitForPacket(Result.sequence, Packet => Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.ERROR || Packet.type === ServerPacket.OFFERS_STATE && Number(Packet.payload?.completedOffers) > Baseline, 15e3);
        return Result ? (DebugOffer.state = Result.packet.type === ServerPacket.LINK_DESTINATION ? "destination" : "completed", !0) : (DebugOffer.state = "completion-timeout", Warn("No se recibió confirmación de finalización", Offer.id), !1);
    }

    async function RunFlow(Info) {
        UpdateStatus("Información del enlace recibida. Iniciando el flujo directo de Work.ink…"), await VerifyInitialCaptcha(Info);
        if (Finished) return;
        UpdateStatus("CAPTCHA inicial verificado. Completando los pasos del enlace…"), await CompleteSocials(Info.socials), await CompletePremiumWall(Info), await SynchronizeOffers();
        if (Finished) return;
        const AssignedIds = MonetizationData && "object" == typeof MonetizationData && Object.keys(MonetizationData).length > 0 ? Object.keys(MonetizationData).map(Number) : Array.isArray(Info.monetizations) ? Info.monetizations.map(Number) : [], Offers = await BuildOffers(AssignedIds);
        if (Finished) return;
        if (0 === Offers.length && GetProgress().needed > 0) {
            const After = ServerSequence;
            Send("c_offers_skipped", {}), await WaitForPacket(After, Packet => Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.OFFERS_STATE || Packet.type === ServerPacket.MONETIZATION_DATA || Packet.type === ServerPacket.ERROR, 1e4);
            if (!Finished && GetProgress().needed > 0) throw new Error("Work.ink no devolvió ofertas de monetización utilizables. Desactiva el bloqueador de anuncios y recarga, o inténtalo más tarde.");
        }
        for (let Index = 0; Index < Offers.length && !Finished && !GoalReached(); Index += 1) await RunOffer(Offers[Index], Index, Offers.length);
        if (Finished) return;
        if (!GoalReached()) {
            const Progress = GetProgress(), After = ServerSequence;
            UpdateStatus(`Esperando la confirmación de las ofertas (${Progress.completed}/${Progress.needed})…`);
            await WaitForPacket(After, Packet => Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.ERROR || Packet.type === ServerPacket.OFFERS_STATE && GoalReached(), 3e4);
        }
        if (Finished) return;
        const Progress = GetProgress();
        if (!GoalReached()) throw new Error(`Work.ink solo confirmó ${Progress.completed}/${Progress.needed} ofertas`);
        const After = ServerSequence;
        Send("c_focus", {}), UpdateStatus("Esperando la URL de destino…");
        const Destination = await WaitForPacket(After, Packet => Packet.type === ServerPacket.LINK_DESTINATION || Packet.type === ServerPacket.ERROR, 6e4);
        if (!Destination && !Finished) throw new Error("Work.ink no envió el destino después de confirmar todas las ofertas");
    }

    function InstallSocketStub() {
        const FakeSocket = () => ({
            readyState: NativeWebSocket.CLOSED,
            send() {},
            close() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent: () => !1,
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null
        }), IsWorkinkSocket = Url => String(Url || "").includes("work.ink/_api/v2/ws");
        Window.WebSocket = new Proxy(NativeWebSocket, {
            construct: (Target, Args) => IsWorkinkSocket(Args?.[0]) ? FakeSocket() : Reflect.construct(Target, Args),
            apply: (Target, ThisValue, Args) => IsWorkinkSocket(Args?.[0]) ? FakeSocket() : Reflect.apply(Target, ThisValue, Args)
        });
    }

    async function WaitForMonocle() {
        const Deadline = Date.now() + 6e4;
        while (Date.now() < Deadline) {
            const Input = Document.querySelector('form.monocle-enriched input[name="monocle"],input[name="monocle"]');
            if (Input?.value?.length > 100) return Input.value;
            await Sleep(200);
        }
        throw new Error("Work.ink no generó el token de comprobación del navegador");
    }

    async function GetUserId() {
        const Patterns = [ /f_user_id\s*:\s*["']?(\d+)/, /["']userId["']\s*:\s*(\d+)/, /userId%22%3A(\d+)/i ], Extract = Source => {
            for (const Pattern of Patterns) {
                const Match = Source.match(Pattern);
                if (Match?.[1]) return Match[1];
            }
            return null;
        }, Remember = Value => {
            try {
                Window.localStorage.setItem(UserIdCacheKey, Value);
            } catch {}
            return DebugState.userId = {
                value: Value,
                source: "page"
            }, Value;
        };
        const FromDom = Extract(Document.documentElement?.outerHTML || "");
        if (FromDom) return Remember(FromDom);
        let Source = "";
        try {
            Source = await Window.fetch(location.href, {
                credentials: "include"
            }).then(Response => Response.text());
        } catch (FetchError) {
            Warn("No se pudo volver a leer la página del enlace", FetchError);
        }
        const FromPage = Extract(Source);
        if (FromPage) return Remember(FromPage);
        const Challenged = /Just a second|cf-browser-verification|__cf_chl/i.test(Source);
        let Cached = "";
        try {
            Cached = Window.localStorage.getItem(UserIdCacheKey) || "";
        } catch {}
        if (Cached) return DebugState.userId = {
            value: Cached,
            source: "cache",
            challenged: Challenged
        }, Cached;
        throw new Error(Challenged ? "Cloudflare está verificando esta página. Completa la comprobación o recarga Work.ink una vez y vuelve a intentarlo." : "No se pudo extraer el identificador de usuario de Work.ink");
    }

    function OpenSocket(UserId, Custom, ServerOverride, Token, Monocle) {
        const Parameters = new URLSearchParams({
            userId: UserId,
            custom: Custom,
            referrer: Document.referrer || "https://work.ink/",
            toLink: "",
            serverOverride: ServerOverride,
            customerSessionToken: Token,
            monocleAssessment: Monocle
        });
        Socket = new NativeWebSocket(`wss://work.ink/_api/v2/ws?${Parameters}`), Socket.onopen = () => {
            DebugState.connection.openedAt = Date.now(), UpdateStatus("Conexión directa con Work.ink establecida. Esperando la información del enlace…"), Send("c_monocle", {
                assessment: Monocle
            }), PingTimer = setInterval(() => {
                if (!Finished && Socket?.readyState === NativeWebSocket.OPEN) try {
                    Send("c_ping", {
                        timestamp: Date.now()
                    });
                } catch (PingError) {
                    Warn("Falló el ping", PingError);
                }
            }, 2e3);
        }, Socket.onmessage = Event => {
            if (Finished || "string" != typeof Event.data) return;
            try {
                HandlePacket(DecodePacket(Event.data), Event.data);
            } catch (DecodeError) {
                DebugState.runtimeErrors.push({
                    time: Date.now(),
                    type: "packet-decode",
                    message: DecodeError.message || String(DecodeError),
                    length: Event.data.length,
                    prefix: Event.data.slice(0, 160)
                }), Warn("No se pudo decodificar el paquete de Work.ink", DecodeError);
            }
        }, Socket.onerror = Event => {
            LogError("Error de WebSocket", Event), Finished || SessionRecoveryActive || Fail("Falló la conexión WebSocket de Work.ink");
        }, Socket.onclose = Event => {
            DebugState.connection.closedAt = Date.now(), DebugState.connection.closeCode = Event.code, DebugState.connection.closeReason = Event.reason || null,
            Finished || SessionRecoveryActive || Fail(`El WebSocket de Work.ink se cerró inesperadamente (${Event.code})`);
        }, setTimeout(() => {
            !Finished && !SessionRecoveryActive && !LinkInfo && Fail("Work.ink no devolvió la información del enlace");
        }, 2e4);
    }

    ExportButton.addEventListener("click", () => {
        try {
            const Report = {
                format: "workink-direct-debug",
                exportedAt: (new Date).toISOString(),
                runtimeMs: Date.now() - StartTime,
                page: {
                    href: location.href,
                    title: Document.title,
                    referrer: Document.referrer,
                    visibilityState: Document.visibilityState,
                    online: navigator.onLine
                },
                browser: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.userAgentData?.platform || navigator.platform,
                    mobile: navigator.userAgentData?.mobile ?? null,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    viewport: {
                        width: Window.innerWidth,
                        height: Window.innerHeight,
                        devicePixelRatio: Window.devicePixelRatio
                    }
                },
                state: Normalize(DebugState)
            }, BlobValue = new Blob([ JSON.stringify(Report, null, 2) ], {
                type: "application/json"
            }), DownloadUrl = URL.createObjectURL(BlobValue), Link = Document.createElement("a");
            Link.href = DownloadUrl, Link.download = `workink-debug-${Build}-${Date.now()}.json`, (Document.body || Document.documentElement).appendChild(Link), Link.click(), Link.remove(),
            setTimeout(() => URL.revokeObjectURL(DownloadUrl), 1e3), ExportButton.textContent = "Diagnóstico JSON exportado", setTimeout(() => ExportButton.textContent = "Exportar diagnóstico JSON", 2e3);
        } catch (ExportError) {
            LogError("No se pudo exportar el diagnóstico JSON", ExportError), ExportButton.textContent = "Falló la exportación";
        }
    });

    InstallSocketStub(), Log("Versión cargada", Build), async function() {
        try {
            UpdateStatus("Esperando el token de comprobación del navegador de Work.ink…");
            const Monocle = await WaitForMonocle();
            await MountUiWhenSafe(), SelectedToken = GetCustomerToken() || await RequestPremiumSession();
            UpdateStatus("Leyendo los parámetros del enlace…");
            const UserId = await GetUserId(), PathParts = location.pathname.split("/").filter(Boolean), Custom = PathParts[1] || PathParts[0] || "", ServerOverride = new URLSearchParams(location.search).get("sr") || "";
            UpdateStatus("Abriendo una conexión WebSocket directa con Work.ink…"), OpenSocket(UserId, Custom, ServerOverride, SelectedToken.token, Monocle);
        } catch (InitializationError) {
            Fail(InitializationError.message || String(InitializationError), InitializationError);
        }
    }();
}();
