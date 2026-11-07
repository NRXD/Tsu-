(function() {
    'use strict';
    if (window.__N7RCORDV2_INJECTED__) return;
    window.__N7RCORDV2_INJECTED__ = true;

    // ─── Extension base URL ────────────────────────────────────────────────
    const EXT_BASE = (() => {
        try {
            for (const s of document.scripts) {
                const src = s.src || '';
                if (src.includes('injector.js'))
                    return src.substring(0, src.lastIndexOf('/') + 1);
            }
        } catch(e) {}
        return '';
    })();
    const GIF_GOJO = EXT_BASE + 'gojo.gif';

    // ─── PARAMS ──────────────────────────────────────────────────────────
    const PARAMS = {
        masterGain: 0, gain2: 0, gain3: 0, inputBoost: 0,
        width: 0, pitch: 50,
        reverb: 0, reverbDecay: 2.5,
        eqBass: 50, eqMid: 50, eqTreble: 50,
        gateThreshold: -60,
        distortion: 0,
        noiseReduction: 0,
        vadEnabled: false, vadThreshold: -45,
        micOnly: false,
        autoLevel: true, cleanVoice: true,
        duckingEnabled: false, duckingReduction: 10,
        voiceProfile: 'auto',
        pan: 0,
        airAmount: 0,
        autotuneOn: false, autotuneSpeed: 0.3, autotuneScale: 0,
        godMode: false,
        tafleh: 0,
        satMode: false,
        musicVolume: 1.2,
        musicReverb: 70,
        selfListen: false, selfListenVolume: 80,
        megaReverb: false,
        eqBands: [0,0,0,0,0,0,0,0,0], eqLevel: 0, eqOn: true,
        eaxOn: true, eaxEnv: 'None', eaxAmount: 0, _eaxP: null, _eaxKey: '',
        karOn: false, karAmount: 0,
        theme: 'Neon Dream', quickActionsEnabled: true, statsEnabled: true
    };

    // ─── v3.9: 9-band graphic EQ, EAX-style environments, CMSS modes ───
    const EQ_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000];
    const EQ_LABELS = ['31', '62', '125', '250', '500', '1k', '2k', '4k', '8k'];
    const EQ_PRESETS = {
        'Default':        [0,0,0,0,0,0,0,0,0],
        'Acoustic':       [4,4,3,1,1,1,3,3,2],
        'Bass Boost':     [8,7,5,3,1,0,0,0,0],
        'Classical':      [0,0,0,0,0,0,-3,-3,-4],
        'Club':           [0,0,2,3,3,3,2,0,0],
        'Dance':          [6,5,2,0,0,-3,-4,-4,0],
        'Full Bass':      [7,7,7,4,1,-2,-4,-5,-5],
        'Full Treble':    [-5,-5,-5,-2,2,5,8,9,9],
        'Jazz':           [3,2,1,2,-2,-2,0,1,2],
        'Live':           [-3,0,2,3,3,3,2,1,1],
        'Loudness':       [6,4,0,0,-2,0,-1,-5,5],
        'MAX POWER':      [20,18,12,8,8,12,16,20,18],
        'ULTRA BASS':     [24,24,20,12,4,0,0,0,0],
        'ULTRA VOICE':    [-12,-8,0,8,14,18,20,16,10],
        'Pop':            [-1,2,4,5,3,0,-1,-1,-2],
        'Rock':           [5,4,3,1,-1,-2,0,2,3],
        'Treble Boost':   [0,0,0,0,0,1,3,5,7],
        'Vocal Booster':  [-2,-3,-3,1,4,4,3,1,0],
        'Voice Clarity':  [-8,-6,-3,0,2,4,5,4,2]
    };
    const fmtDb = v => { v = +v || 0; return (v % 1 ? v.toFixed(1) : String(v)) + 'dB'; };
    // ─── v3.11: THX Setup, Speaker Settings (7.1–10), Surround Mixer ───
    const THX_PRESETS = {
        'Off':   { w:0,  eq:[0,0,0,0,0,0,0,0,0] },
        'Movie': { w:45, eq:[6,5,3,0,-1,1,3,4,3] },
        'Music': { w:30, eq:[3,2,1,0,0,1,2,3,3] },
        'Game':  { w:55, eq:[2,1,0,0,2,3,4,4,2] },
        'Voice': { w:10, eq:[-6,-4,0,3,5,6,5,3,1] }
    };
    // side: -1 left, 1 right, 0 centre; rear = surround/back speaker; sub = LFE; ctr = centre
    const SPK_ALL = {
        FL:{l:'FL',side:-1}, FR:{l:'FR',side:1}, C:{l:'C',side:0,ctr:true}, SUB:{l:'SUB',side:0,sub:true},
        SL:{l:'SL',side:-1,rear:true}, SR:{l:'SR',side:1,rear:true},
        BL:{l:'BL',side:-1,rear:true}, BR:{l:'BR',side:1,rear:true}, BC:{l:'BC',side:0,rear:true},
        FLC:{l:'FLC',side:-1}, FRC:{l:'FRC',side:1}
    };
    const SPK_LAYOUTS = {
        'Headphones':   ['FL','FR'],
        '2.0 Speakers': ['FL','FR'],
        '2.1 Speakers': ['FL','FR','SUB'],
        '4.1 Speakers': ['FL','FR','BL','BR','SUB'],
        '5.1 Speakers': ['FL','FR','C','SUB','SL','SR'],
        '7.1 Speakers': ['FL','FR','C','SUB','SL','SR','BL','BR'],
        '8.1 Speakers': ['FL','FR','C','SUB','SL','SR','BL','BR','BC'],
        '9.1 Speakers': ['FL','FR','C','SUB','SL','SR','BL','BR','FLC','FRC'],
        '10 Speakers':  ['FL','FR','C','SUB','SL','SR','BL','BR','BC','FLC','FRC']
    };

    const CMSS_MODES = { 'Off':0, 'Headphone':35, 'Speaker':60, 'Surround':100 };
    // mix = reverb % at Effects Amount 100, decay = seconds, width = stereo width %
    const EAX_ENVS = {
        'None':          { mix:0,  decay:2.5, width:0 },
        'Alley':         { mix:40, decay:1.4, width:20 },
        'Auditorium':    { mix:70, decay:3.0, width:40 },
        'Ball Park':     { mix:55, decay:2.6, width:35 },
        'Bathroom':      { mix:55, decay:1.1, width:10 },
        'Cathedral':     { mix:85, decay:7.0, width:50, mega:true },
        'Cave':          { mix:80, decay:6.0, width:45 },
        'Chapel':        { mix:70, decay:4.2, width:35 },
        'Church':        { mix:75, decay:5.0, width:40 },
        'Concert Hall':  { mix:70, decay:3.4, width:50 },
        'Forest':        { mix:35, decay:2.2, width:60 },
        'Garage':        { mix:60, decay:2.0, width:15 },
        'Hallway':       { mix:50, decay:1.8, width:15 },
        'Hangar':        { mix:80, decay:5.5, width:30 },
        'Haunted Cavern':{ mix:90, decay:9.0, width:70, mega:true },
        'Indoor Arena':  { mix:80, decay:4.5, width:45 },
        'Living Room':   { mix:30, decay:0.8, width:10 },
        'Padded Cell':   { mix:10, decay:0.4, width:0 },
        'Quarry':        { mix:60, decay:3.5, width:30 },
        'Sewer Pipe':    { mix:85, decay:3.0, width:20 },
        'Stone Corridor':{ mix:65, decay:2.6, width:20 },
        'Underwater':    { mix:70, decay:2.8, width:60 }
    };

    // order shown in the Environment list (same order as the console screenshot, 'None' stays internal)
    const EAX_LIST = ['Auditorium','Ball Park','Bathroom','Cathedral','Chapel','Church','Concert Hall','Garage','Haunted Cavern','Indoor Arena']
        .concat(Object.keys(EAX_ENVS).filter(k => k !== 'None' && !['Auditorium','Ball Park','Bathroom','Cathedral','Chapel','Church','Concert Hall','Garage','Haunted Cavern','Indoor Arena'].includes(k)).sort());
    // ═════════ ReverbPresets64.dll presets (extracted from the VST's .rdata) ═════════
    // amt = default Effects Amount, room/roomHF/refl/rev in mB, delays in s, decay in s
    // echoD/echoT = echo depth/time, modD/modT = modulation depth/time (EAX 3.0 fields)
    const EAX_PRESETS = {
        'Auditorium':     { amt:50, room:-790,  roomHF:-476,  decay:4.32,  hfr:0.59, refl:-789,  reflD:0.02,  rev:-289,   revD:0.03,  size:21.6, diff:1.0,  air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:0.25 },
        'Ball Park':      { amt:65, room:-1190, roomHF:0,     decay:14.69, hfr:1.54, refl:790,   reflD:0.089, rev:-10000, revD:0.076, size:7.7,  diff:1.0,  air:-5, echoD:0.3,  echoT:0.075, modD:0,     modT:0.04 },
        'Bathroom':       { amt:50, room:-370,  roomHF:-1200, decay:1.49,  hfr:0.54, refl:-370,  reflD:0.007, rev:1030,   revD:0.011, size:1.4,  diff:1.0,  air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:0.25 },
        'Cathedral':      { amt:50, room:0,     roomHF:-1020, decay:5.9,   hfr:0.7,  refl:-4660, reflD:0.048, rev:140,    revD:0.048, size:10.0, diff:0.8,  air:-9, echoD:0.09, echoT:0.2,   modD:0,     modT:0.128 },
        'Chapel':         { amt:65, room:0,     roomHF:-490,  decay:2.03,  hfr:0.5,  refl:-7120, reflD:0.023, rev:-330,   revD:0.044, size:10.0, diff:0.5,  air:-7, echoD:0.05, echoT:0.213, modD:0,     modT:0.208 },
        'Church':         { amt:50, room:0,     roomHF:-1500, decay:2.32,  hfr:0.7,  refl:-5830, reflD:0.032, rev:-720,   revD:0.037, size:10.0, diff:0.72, air:-5, echoD:0.07, echoT:0.192, modD:0,     modT:0.128 },
        'Concert Hall':   { amt:50, room:-390,  roomHF:-500,  decay:3.92,  hfr:0.7,  refl:-1230, reflD:0.02,  rev:-2,     revD:0.029, size:19.6, diff:1.0,  air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:0.25 },
        'Garage':         { amt:50, room:0,     roomHF:-390,  decay:1.45,  hfr:0.72, refl:310,   reflD:0.025, rev:-910,   revD:0.012, size:10.0, diff:0.8,  air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:1.67 },
        'Haunted Cavern': { amt:50, room:0,     roomHF:-1500, decay:17.01, hfr:0.91, refl:790,   reflD:0.111, rev:1070,   revD:0.05,  size:10.0, diff:0.4,  air:-5, echoD:0,    echoT:0.25,  modD:0.413, modT:0.042 },
        'Indoor Arena':   { amt:60, room:-600,  roomHF:-390,  decay:4.25,  hfr:0.41, refl:-120,  reflD:0.05,  rev:830,    revD:0.021, size:10.0, diff:0.9,  air:-5, echoD:0,    echoT:0.099, modD:0.086, modT:0.2 },
        'Jazz Club':      { amt:65, room:-600,  roomHF:-530,  decay:1.26,  hfr:0.7,  refl:-170,  reflD:0.006, rev:720,    revD:0.093, size:10.0, diff:1.0,  air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:0.057 },
        'Living Room':    { amt:50, room:-1360, roomHF:-6000, decay:0.5,   hfr:0.1,  refl:-1376, reflD:0.003, rev:-1104,  revD:0.004, size:2.5,  diff:1.0,  air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:0.25 },
        'Opera House':    { amt:50, room:0,     roomHF:-300,  decay:6.2,   hfr:1.06, refl:-816,  reflD:0.083, rev:-1090,  revD:0.011, size:31.0, diff:0.95, air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:0.395 },
        'Small Room':     { amt:50, room:0,     roomHF:-440,  decay:0.4,   hfr:0.83, refl:-1620, reflD:0.002, rev:430,    revD:0.003, size:2.0,  diff:0.9,  air:-5, echoD:0,    echoT:0.25,  modD:0,     modT:0.25 },
        'Theater':        { amt:50, room:-20,   roomHF:-340,  decay:2.0,   hfr:0.7,  refl:-660,  reflD:0.01,  rev:540,    revD:0.015, size:10.0, diff:1.0,  air:-5, echoD:0,    echoT:0.128, modD:0,     modT:0.128 }
    };
    const EAX_PRESET_ORDER = Object.keys(EAX_PRESETS);

    // Builds a stereo impulse response from EAX 3.0 reverb parameters (deterministic noise, so a
    // preset always sounds the same). Returns [L, R] Float32Arrays.
    const _eaxIRCache = {};
    function eaxBuildIR(sr, p, decay, maxSec, targetRms) {
        const key = [sr, p.decay, p.room, decay.toFixed(2), maxSec, targetRms].join('|');
        if (_eaxIRCache[key]) return _eaxIRCache[key];
        const T = Math.max(0.15, decay);
        const start = p.reflD + p.revD;
        const noTail = p.rev <= -5000;                       // e.g. Ball Park: reflections + echo only
        let lenSec = noTail ? start + 1.6 : T * 1.05 + start + 0.05;
        lenSec = Math.min(maxSec, lenSec);
        const len = Math.max(256, Math.floor(sr * lenSec));
        const gER = Math.pow(10, p.refl / 2000);
        const gLR = noTail ? 0 : Math.pow(10, p.rev / 2000);
        const gHF = Math.pow(10, p.roomHF / 2000);
        const hfr = Math.max(0.1, Math.min(2, p.hfr));
        const lpA = 1 - Math.exp(-2 * Math.PI * 5000 / sr);  // HF reference = 5 kHz
        const k60 = 3 * Math.LN10;
        const dLo = Math.exp(-k60 / (T * sr));               // per-sample decay factors (recurrence, no exp() per sample)
        const dHi = Math.exp(-k60 / (T * hfr * sr));
        const out = [];
        for (let ch = 0; ch < 2; ch++) {
            let seed = (0x9E3779B1 ^ (ch * 0x85EBCA6B) ^ Math.floor(p.decay * 1000)) >>> 0;
            const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
            const y = new Float32Array(len);
            const s0 = Math.floor(start * sr);
            if (gLR > 0) {
                const ramp = Math.max(8, Math.floor(sr * 0.008));
                const q0 = 0.12 + 0.88 * p.diff;
                const growN = (0.5 + p.size * 0.02) * sr;
                let lp = 0, eLo = Math.pow(dLo, s0), eHi = Math.pow(dHi, s0);
                for (let i = s0; i < len; i++) {
                    let n = (rnd() + rnd() - 1) * 2.45;
                    if (q0 < 1) {
                        const gq = (i - s0) / growN;
                        const q = gq >= 1 ? 1 : q0 + (1 - q0) * gq;
                        if (q < 1) n = (rnd() < q) ? n / Math.sqrt(q) : 0;
                    }
                    lp += lpA * (n - lp);
                    eLo *= dLo; eHi *= dHi;
                    const on = (i - s0) < ramp ? (i - s0) / ramp : 1;
                    y[i] = (lp * eLo + (n - lp) * eHi) * on * gLR;
                }
            }
            // early reflections
            const spread = Math.max(0.012, Math.min(0.15, p.size * 0.004));
            const taps = 14;
            for (let k = 0; k < taps; k++) {
                const f = Math.pow((k + 1) / taps, 1.6);
                const tt = (p.reflD + spread * f) * (1 + (rnd() - 0.5) * 0.3);
                const idx = Math.floor(tt * sr);
                const a = gER * (0.95 - 0.55 * k / taps) * (rnd() < 0.5 ? -1 : 1);
                for (let b = 0; b < 3 && idx + b < len; b++) y[idx + b] += a * (b === 0 ? 1 : b === 1 ? 0.5 : 0.2);
            }
            // echo (feedback comb over reflections + tail)
            if (p.echoD > 0.001) {
                const n = Math.max(1, Math.round(p.echoT * sr)), fb = Math.min(0.92, p.echoD);
                const e0 = Math.floor(p.reflD * sr);
                for (let i = e0 + n; i < len; i++) y[i] += fb * y[i - n];
            }
            // room HF (applies to everything): split at 5 kHz, scale the high band
            if (gHF < 0.999) {
                let l2 = 0;
                for (let i = 0; i < len; i++) { l2 += lpA * (y[i] - l2); y[i] = l2 + gHF * (y[i] - l2); }
            }
            const fl = Math.floor(len * 0.08);                // fade the last 8 %
            for (let i = 0; i < fl; i++) y[len - 1 - i] *= i / fl;
            out.push(y);
        }
        let e = 0; for (const y of out) for (let i = 0; i < y.length; i++) e += y[i] * y[i];
        const g = e > 0 ? targetRms / Math.sqrt(e / 2) : 1;
        for (const y of out) for (let i = 0; i < y.length; i++) y[i] *= g;
        const keys = Object.keys(_eaxIRCache); if (keys.length > 4) delete _eaxIRCache[keys[0]];
        _eaxIRCache[key] = out;
        return out;
    }

    // Re-order the environment table: the 15 real presets from ReverbPresets64.dll first
    // (same order as the VST), then the old extra environments (kept, nothing removed).
    (function () {
        const legacy = Object.assign({}, EAX_ENVS);
        Object.keys(EAX_ENVS).forEach(k => delete EAX_ENVS[k]);
        EAX_ENVS['None'] = legacy['None'];
        EAX_PRESET_ORDER.forEach(n => {
            const p = EAX_PRESETS[n];
            EAX_ENVS[n] = {
                mix:   Math.max(10, Math.round(90 * Math.pow(10, p.room / 4000))),
                decay: p.decay,
                width: Math.round(Math.min(60, 10 + p.size * 1.5)),
                p: p
            };
        });
        Object.keys(legacy).forEach(k => { if (k !== 'None' && !EAX_ENVS[k]) EAX_ENVS[k] = legacy[k]; });
        EAX_LIST.length = 0;
        EAX_PRESET_ORDER.forEach(n => EAX_LIST.push(n));
        Object.keys(legacy).filter(k => k !== 'None' && !EAX_PRESETS[k]).sort().forEach(k => EAX_LIST.push(k));
    })();

    const THEMES = {
        'Neon Dream': { primary:'#ff00ff', secondary:'#00ffff', background:'#0a0a0f', text:'#ffffff' },
        'Midnight':   { primary:'#00aaff', secondary:'#aa88ff', background:'#1a1a2e', text:'#e0f0ff' },
        'Sunset':     { primary:'#ffaa00', secondary:'#ff44aa', background:'#2d1b2d', text:'#ffddaa' },
        'Forest':     { primary:'#00cc88', secondary:'#88cc44', background:'#1a2f1a', text:'#ccffcc' },
        'Ocean':      { primary:'#0066ff', secondary:'#00ccff', background:'#001a2d', text:'#aaddff' }
    };

    const VOICE_PROFILES = {
        'auto':          {},
        'Male Deep':     { eqBass:65, eqMid:45, eqTreble:35, gateThreshold:-45 },
        'Male Medium':   { eqBass:55, eqMid:50, eqTreble:45, gateThreshold:-45 },
        'Male High':     { eqBass:45, eqMid:55, eqTreble:55, gateThreshold:-40 },
        'Female Low':    { eqBass:50, eqMid:55, eqTreble:55, gateThreshold:-40 },
        'Female Medium': { eqBass:40, eqMid:55, eqTreble:65, gateThreshold:-45 },
        'Female High':   { eqBass:35, eqMid:50, eqTreble:75, gateThreshold:-45 },
        'Headset Mic':   { eqBass:45, eqMid:65, eqTreble:55, gateThreshold:-50 },
        'Studio Mic':    { eqBass:55, eqMid:50, eqTreble:50, gateThreshold:-60 }
    };

    const PRESETS = {
        'Default': { masterGain:100, gain2:0, gain3:0, inputBoost:100, eqBass:50, eqMid:50, eqTreble:50, gateThreshold:-60, noiseReduction:0, distortion:0, reverb:0, width:0, pan:0, airAmount:0, reverbDecay:2.5 },
        'Loud':    { masterGain:280, gain2:80, gain3:0, inputBoost:280, eqBass:68, eqMid:58, eqTreble:68, gateThreshold:-60, noiseReduction:0, distortion:0, reverb:0, width:0, pan:0, airAmount:20, reverbDecay:2.5 },
        'Max':     { masterGain:400, gain2:300, gain3:200, inputBoost:400, eqBass:85, eqMid:70, eqTreble:85, gateThreshold:-50, noiseReduction:20, distortion:45, reverb:22, width:20, pan:0, airAmount:35, reverbDecay:2.2 },
        'Clear':   { masterGain:300, gain2:0, gain3:0, inputBoost:300, eqBass:42, eqMid:85, eqTreble:88, gateThreshold:-60, noiseReduction:0, distortion:0, reverb:0, width:0, pan:0, airAmount:10, reverbDecay:2.5 },
        'ULTRA':   { masterGain:500, gain2:400, gain3:300, inputBoost:500, eqBass:75, eqMid:65, eqTreble:80, gateThreshold:-50, noiseReduction:25, distortion:30, reverb:45, width:30, pan:0, airAmount:50, reverbDecay:3.5 },
        'REVERB':  { masterGain:200, gain2:100, gain3:0, inputBoost:200, eqBass:55, eqMid:55, eqTreble:60, gateThreshold:-60, noiseReduction:0, distortion:0, reverb:100, width:40, pan:0, airAmount:30, reverbDecay:8.0 }
    };

    // ─── VOICE CHANGER presets (use the existing pitch/EQ/FX engine, nothing removed) ───
    const VOICE_BASE = { pitch:50, eqBass:50, eqMid:50, eqTreble:50, distortion:0, reverb:0, width:0, airAmount:0, reverbDecay:2.5, autotuneOn:false, autotuneSpeed:0.3 };
    const VOICE_FX = {
        'Normal':       { icon:'🙂', fx:{} },
        'Chipmunk':     { icon:'🐿️', fx:{ pitch:80, eqBass:35, eqTreble:68, airAmount:25 } },
        'Kid':          { icon:'🧒', fx:{ pitch:68, eqBass:42, eqTreble:60 } },
        'Girl':         { icon:'👧', fx:{ pitch:58, eqBass:32, eqMid:58, eqTreble:64, airAmount:30, distortion:0, reverb:6, reverbDecay:1.2 } },
        'Soft Girl':    { icon:'👩', fx:{ pitch:55, eqBass:30, eqMid:55, eqTreble:60, airAmount:42, reverb:10, reverbDecay:1.6, width:12 } },
        'Man':          { icon:'🧔', fx:{ pitch:38, eqBass:68, eqTreble:42 } },
        'Deep Monster': { icon:'👹', fx:{ pitch:20, eqBass:88, eqTreble:30, distortion:25, reverb:15, reverbDecay:3 } },
        'Demon':        { icon:'😈', fx:{ pitch:12, eqBass:92, eqMid:60, eqTreble:35, distortion:45, reverb:30, reverbDecay:4.5, width:25 } },
        'Robot':        { icon:'🤖', fx:{ pitch:46, eqMid:62, eqTreble:60, distortion:22, autotuneOn:true, autotuneSpeed:1 } },
        'Alien':        { icon:'👽', fx:{ pitch:68, eqTreble:62, distortion:10, reverb:35, reverbDecay:3.5, width:60, autotuneOn:true, autotuneSpeed:0.6 } },
        'Telephone':    { icon:'📞', fx:{ eqBass:8, eqMid:88, eqTreble:18, distortion:15 } },
        'Radio':        { icon:'📻', fx:{ eqBass:22, eqMid:80, eqTreble:40, distortion:12, reverb:8 } },
        'Cave':         { icon:'🕳️', fx:{ reverb:75, reverbDecay:7, width:45, eqBass:58 } },
        'Ghost':        { icon:'👻', fx:{ pitch:40, eqTreble:62, reverb:80, reverbDecay:9, width:70, airAmount:50 } },
        'Megaphone':    { icon:'📢', fx:{ eqBass:20, eqMid:90, eqTreble:55, distortion:35 } },
        'Weak':         { icon:'🥺', fx:{ pitch:54, eqBass:22, eqMid:44, eqTreble:58, airAmount:48, reverb:8, reverbDecay:1.4, width:8 } }
    };

    // ─── FIX: AudioContext — always create UNLOCKED, resume on gesture ───
    // ROOT CAUSE OF ERROR 3002: Discord creates AudioContext before user gesture.
    // Chrome auto-suspends it. Our getUserMedia override then tries to use a
    // suspended context → no audio signal → Discord fires Error 3002.
    // FIX: intercept AudioContext construction, immediately queue a resume on
    // the NEXT gesture (even if one already happened), and expose a promise
    // callers can await before touching the graph.
    // v3.15.3: Discord creates more AudioContexts after ours. DiscordContext used to be
    // overwritten by every one of them, so music/params ended up talking to a DIFFERENT
    // context than the one the graph lives in (nodes of different contexts can't connect,
    // automation times were wrong) -> songs failed / voice settings froze. Now it keeps
    // pointing at the context ツcore built its graph in, as long as that one is alive.
    let _latestCtx = null, _pinnedCtx = null;
    try {
        Object.defineProperty(window, 'DiscordContext', {
            configurable: true,
            get() { return (_pinnedCtx && _pinnedCtx.state !== 'closed') ? _pinnedCtx : _latestCtx; },
            set(v) { _latestCtx = v; }
        });
    } catch (_e) { window.DiscordContext = null; }
    let _contextReadyResolve = null;
    const _contextReady = new Promise(r => { _contextReadyResolve = r; });
    const NativeAC = window.AudioContext || window.webkitAudioContext;

    const _doResume = () => {
        const ctx = window.DiscordContext;
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                if (_contextReadyResolve) { _contextReadyResolve(); _contextReadyResolve = null; }
            }).catch(() => {});
        } else {
            if (_contextReadyResolve) { _contextReadyResolve(); _contextReadyResolve = null; }
        }
    };

    // v3.15.3 watchdog: only active once ツcore has built its graph (pinned context)
    setInterval(() => {
        try {
            const c = _pinnedCtx;
            if (c && c.state !== 'running' && c.state !== 'closed') c.resume().catch(() => {});
        } catch (_e) {}
    }, 1500);
    document.addEventListener('visibilitychange', () => {
        try { const c = _pinnedCtx; if (c && c.state !== 'running' && c.state !== 'closed') c.resume().catch(() => {}); } catch (_e) {}
    });

    // ─── v3.16.0 LITE mode (anti-cut for weak phones, e.g. Honor X6c) ───────────────
    // Why: the audio thread of a mid-range phone cannot always keep up with 'interactive' latency
    // (tiny buffers) + two long convolution reverbs + a 4x oversampled music saturator. When it falls
    // behind, voice AND song freeze for a few seconds ("the song stops 5 s then comes back").
    // LITE = bigger output buffer ('playback'), shorter reverb impulses, lighter music saturator and a
    // gate that holds longer so quiet words are not chopped. It switches on by itself for the Honor X6c /
    // weak Android phones, and also automatically if the audio clock is seen running slow.
    // Manual override: localStorage.n7r_lite = '1' (force on) or '0' (force off).
    // v3.18.1: short-tail switch for the heavy reverbs (Haunted Cavern 17 s, Cathedral ...)
    const CAV_CAP = 6;
    const PHONE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    function cavShort() {
        let f = null; try { f = localStorage.getItem('n7r_cavfull'); } catch (_e) {}
        if (f === '1') return false;
        return PHONE || (typeof LITE !== 'undefined' && LITE.on);
    }
    // v3.20.0 HAUNTED CAVERN ENGINE: same EAX cavern sound (same early reflections / modulation / density) but the long tail is made of
    // wall-bounce echoes (ping-pong delay loops, each repeat goes back through the reverb) instead of a giant 14 s convolver.
    // Starts at the maximum the device can hold and steps DOWN by itself if the audio starts to lag (and remembers it).
    const CAVT = [ { head: 0.8, pairs: 1 }, { head: 1.3, pairs: 1 }, { head: 2.2, pairs: 2 }, { head: 3.2, pairs: 3 }, { head: 7, pairs: 3 } ];
    const CAVP = [ [0.23, 0.41], [0.31, 0.57], [0.47, 0.79] ];
    const CAVN = { tier: null, g: 0.74, inG: 0.6 };
    function cavActive() { return !!(PARAMS._eaxP && /Haunted/i.test(PARAMS._eaxKey || '')); }
    function cavTier() {
        if (CAVN.tier == null) {
            let sv = NaN; try { sv = parseInt(localStorage.getItem('n7r_cavtier'), 10); } catch (_e) {}
            CAVN.tier = (sv >= 0 && sv <= 4) ? sv : ((PHONE || LITE.on) ? 3 : 4);
        }
        return CAVN.tier;
    }
    function cavNote(msg) {
        try {
            let t = document.getElementById('n7r-cavnote');
            if (!t) { t = document.createElement('div'); t.id = 'n7r-cavnote'; t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:999999;background:#000d;color:#fff;font:600 13px system-ui;padding:8px 14px;border-radius:12px'; document.body.appendChild(t); }
            t.textContent = msg; t.style.display = 'block'; clearTimeout(t._h); t._h = setTimeout(() => { t.style.display = 'none'; }, 3500);
        } catch (_e) {}
    }
    function cavStepDown() {
        if (!cavActive() || cavTier() <= 0) return;
        CAVN.tier--; try { localStorage.setItem('n7r_cavtier', String(CAVN.tier)); } catch (_e) {}
        try { Core.rebuildReverb(); } catch (_e) {}
        cavNote('⚡ Cavern power adjusted to level ' + CAVN.tier + '/4 (device limit)');
    }
    (function cavWatch() {
        let lastT = null, lastP = 0, bad = 0, cool = 0, lastU = 0;
        setInterval(() => {
            try {
                const ctx = window.DiscordContext;
                if (!ctx || ctx.state !== 'running' || document.hidden || !cavActive()) { lastT = null; bad = 0; return; }
                const now = performance.now(), ct = ctx.currentTime;
                let u = 0; try { const ps = ctx.playoutStats; if (ps && typeof ps.underrunEvents === 'number') { u = ps.underrunEvents - lastU; lastU = ps.underrunEvents; } } catch (_e) {}
                if (lastT != null) {
                    const rate = (ct - lastT) / ((now - lastP) / 1000);
                    if (cool > 0) cool--;
                    else if (rate < 0.9 || u >= 3) { if (++bad >= 2) { bad = 0; cool = 6; cavStepDown(); } }
                    else bad = 0;
                }
                lastT = ct; lastP = now;
            } catch (_e) {}
        }, 1000);
    })();
    const LITE = (function () {
        const st = { on: false, reason: '', forced: false };
        const KEY = 'n7r_lite';
        let saved = null; try { saved = localStorage.getItem(KEY); } catch (_e) {}
        const ua = navigator.userAgent || '';
        const android = /Android/i.test(ua);
        const lowEnd = android && ((navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 6));
        st.set = function (on, why, persist) {
            if (st.forced && why && /^auto/.test(why)) return;
            if (st.on === on) return;
            st.on = on; st.reason = why || '';
            if (persist) { try { localStorage.setItem(KEY, on ? 'auto' : '0'); } catch (_e) {} }
            try { Core.applyLite(); } catch (_e) {}
            try { if (on && UI && UI.toast) UI.toast('⚡ Lite mode ON (' + (why || 'weak device') + ')'); } catch (_e) {}
        };
        if (saved === '0') { st.forced = true; }
        else if (saved === '1' || saved === 'auto') { st.on = true; st.reason = saved === '1' ? 'manual' : 'saved'; st.forced = saved === '1'; }
        else if (/X6c|HONOR/i.test(ua)) { st.on = true; st.reason = 'Honor X6c'; }
        else if (lowEnd) { st.on = true; st.reason = 'weak phone'; }
        try {
            if (!st.forced && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
                navigator.userAgentData.getHighEntropyValues(['model']).then(v => {
                    if (/X6c|HONOR/i.test((v && v.model) || '')) st.set(true, 'Honor X6c', true);
                }).catch(() => {});
            }
        } catch (_e) {}
        // watchdog: is the audio clock keeping up with the real clock?
        let last = null, bad = 0;
        setInterval(() => {
            try {
                const c = _pinnedCtx;
                if (!c || c.state !== 'running' || document.hidden) { last = null; bad = 0; return; }
                const now = performance.now(), ct = c.currentTime;
                if (last && last.c === c) {
                    const dt = (now - last.t) / 1000, dct = ct - last.ct;
                    if (dt > 0.8 && dt < 2.5) {
                        if (dct / dt < 0.85) bad++; else bad = Math.max(0, bad - 1);
                        if (bad >= 2 && !st.on) { st.set(true, 'auto: audio fell behind', true); bad = 0; }
                    }
                }
                last = { c, t: now, ct };
            } catch (_e) {}
        }, 1000);
        return st;
    })();
    const _gestureEvents = ['click', 'keydown', 'mousedown', 'touchstart', 'pointerdown'];
    const _onGesture = () => { _doResume(); };
    _gestureEvents.forEach(ev => document.addEventListener(ev, _onGesture, { capture: true, once: false, passive: true }));   // v3.20.10: passive = never delays a touch

    window.AudioContext = function(opts) {
        // Force interactive latency + 48kHz to match Discord's pipeline
        const ctx = new NativeAC(Object.assign({ latencyHint: (function () { let h = null; try { h = localStorage.getItem('n7r_hint'); } catch (_e) {} if (h === 'interactive' || h === 'playback') return h; return (LITE.on || /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (/Macintosh/.test(navigator.userAgent || '') && navigator.maxTouchPoints > 1)) ? 'playback' : 'interactive'; })(), sampleRate: 48000 }, opts || {}));
        window.DiscordContext = ctx;
        // If context is already running (rare but possible), resolve immediately
        if (ctx.state === 'running') {
            if (_contextReadyResolve) { _contextReadyResolve(); _contextReadyResolve = null; }
        }
        // Watch state changes — resume fires resolve
        ctx.addEventListener('statechange', () => {
            if (ctx.state === 'running' && _contextReadyResolve) {
                _contextReadyResolve();
                _contextReadyResolve = null;
            }
            // v3.15.3: if the context ツcore is using gets suspended/interrupted mid-call
            // (tab/app focus change, Discord suspending it), restart it right away.
            if (ctx === _pinnedCtx && ctx.state !== 'running' && ctx.state !== 'closed') {
                try { ctx.resume().catch(() => {}); } catch (_e) {}
            }
        });
        return ctx;
    };
    window.AudioContext.prototype = NativeAC.prototype;
    // Also patch webkitAudioContext alias
    if (window.webkitAudioContext) window.webkitAudioContext = window.AudioContext;

    // ─── Worklet ──────────────────────────────────────────────────────────
    const WORKLET = `
// v3.15.4 ANTI-DENORMAL. When the mic goes quiet/digital-silent, filter and envelope states decay into
// "denormal" numbers and get STUCK there (x * 0.99 rounds back to x). Every sample is then computed with
// denormals, which is ~10x slower (far worse on phone CPUs). The audio thread falls behind and the whole
// context (voice AND song) stalls for seconds. Flushing tiny states to exact 0 once per block fixes it
// and is inaudible (< -300 dB).
function n7rFlush(o, keys) {
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i], v = o[k];
        if (v < 1e-15 && v > -1e-15) o[k] = 0;
    }
}
const N7R_ENGINE_STATES = ['hxL','hyL','hxR','hyR','gEnv','agEnv','vpEnvL','vpEnvR','plEnv','hpfL','hpfR','gBassL','gBassR','atSmooth','fL1','fL2','fR1','fR2'];
function softCeil(x) {
    const a = x < 0 ? -x : x;
    if (a <= 0.9) return x;
    const y = 0.9 + 0.1 * Math.tanh((a - 0.9) / 0.1);
    return x < 0 ? -y : y;
}
class N7rEngine extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name:'gain',           defaultValue:1  },
            { name:'gain2',          defaultValue:1  },
            { name:'gain3',          defaultValue:1  },
            { name:'boost',          defaultValue:1  },
            { name:'pitch',          defaultValue:1, minValue:0.5, maxValue:2 },
            { name:'gateThreshold',  defaultValue:0.001 },
            { name:'distortion',     defaultValue:0, maxValue:1 },
            { name:'noiseReduction', defaultValue:0, maxValue:1 },
            { name:'ducking',        defaultValue:0, maxValue:1 },
            { name:'autotuneOn',     defaultValue:0, maxValue:1 },
            { name:'autotuneSpeed',  defaultValue:0.3, maxValue:1 },
            { name:'godMode',        defaultValue:0, maxValue:1 },
            { name:'tafleh',         defaultValue:0, maxValue:1 },
            { name:'satMode',        defaultValue:0, maxValue:1 },
            { name:'verbGate',       defaultValue:0 },
            { name:'micOnly',        defaultValue:0, maxValue:1 },
            { name:'gainProtect',    defaultValue:1, maxValue:1 },
            { name:'autoLevel',      defaultValue:1, maxValue:1 }
        ];
    }
    constructor() {
        super();
        this.bufSize = 4096;
        this.bufL = new Float32Array(this.bufSize);
        this.bufR = new Float32Array(this.bufSize);
        this.wPos = 0; this.rPos = 0;
        this.gate = 0; this.gEnv = 0; this.gHold = 0;
        this.fL1=0; this.fL2=0; this.fR1=0; this.fR2=0;
        this.atPhase = 0; this.atSmooth = 0;
        this.limEnv = 1;
        this.gBassL = 0; this.gBassR = 0;
        this.echoBuf = new Float32Array(48000);
        this.echoW = 0;
        this.tBuf = new Float32Array(96000);
        this.tW = 0;
        this.vGate = 0;
        this.mFloor = 0.0003; this.mGate = 0; this.mHold = 0;
        // Voice protection: multi-band soft limiter state
        this.vpEnvL = 0; this.vpEnvR = 0;
        // Spectral tilt for voice preservation at high gain
        this.hpfL = 0; this.hpfR = 0;
        // Adaptive noise floor for stronger mic gate
        this.noiseFloor = 0.002; this.noiseHold = 0; this.noiseGate = 0;
        // Input high-pass (removes rumble/DC on any mic) + auto mic level
        this.hA = 1 - (2 * Math.PI * 80 / sampleRate);
        this.hxL = 0; this.hyL = 0; this.hxR = 0; this.hyR = 0;
        this.agEnv = 0; this.agG = 1;
        this.lite = false;
        this.port.onmessage = (e) => { const d = e.data; if (d && d.type === 'lite') this.lite = !!d.on; };
    }
    process(inputs, outputs, parameters) {
        const inp = inputs[0]; const out = outputs[0];
        // FIX: disconnect/underrun guard — a dropped mic (Bluetooth loss, device
        // unplug, permission revoke) can hand the worklet an empty or malformed
        // input array mid-stream. Previously this returned true (fine) but on
        // some Chrome builds the OUTPUT was never zeroed, leaving stale samples
        // looping in downstream nodes and, on next graph teardown, throwing.
        // Now we explicitly silence the output before bailing so the worklet
        // never dies and downstream nodes never get garbage.
        if (!inp || !inp.length || !inp[0] || !inp[0].length) {
            if (out && out.length) {
                for (let c = 0; c < out.length; c++) {
                    const ch = out[c];
                    for (let i = 0; i < ch.length; i++) ch[i] = 0;
                }
            }
            return true;
        }
        const gain  = parameters.gain[0];
        const gain2 = parameters.gain2[0];
        const gain3 = parameters.gain3[0];
        const boost = Math.min(parameters.boost[0], 1e6);   // v3.18: 600 dB (1e30) used to blow the signal up to Infinity/NaN
        const pitch = parameters.pitch[0];
        const gateT = parameters.gateThreshold[0];
        const dist  = parameters.distortion[0];
        const nr    = parameters.noiseReduction[0];
        const duck  = parameters.ducking[0];
        const atOn  = parameters.autotuneOn[0] > 0.5;
        const atSpd = parameters.autotuneSpeed[0];
        const god   = parameters.godMode[0] > 0.5;
        const tflAmt = Math.max(0, Math.min(1, parameters.tafleh[0]));
        const tfl   = tflAmt > 0.004;
        const sat   = parameters.satMode[0] > 0.5;
        const mOnly = parameters.micOnly[0] > 0.5;
        const vProt = parameters.gainProtect[0] > 0.5;
        const autoL = parameters.autoLevel[0] > 0.5;
        const inL   = inp[0];
        const inR   = inp[1] || inp[0];
        const outL  = out[0];
        const outR  = out[1];

        // Pre-compute gain staging: split gain across stages to preserve dynamics
        // Total gain = gain * gain2 * gain3. We apply partial gain before
        // soft-clipping so the waveshaper acts as a tone-preserving compressor
        // rather than a brickwall clipper. This lets you push x10-x20 without
        // the voice turning to noise.
        const totalGain = Math.min(gain * gain2 * gain3 * (1 - duck * 0.7), 1e9); // cap at 1e6 — prevents NaN/inf at extreme dB stacking
        // Stage 1: input boost (before gate/NR — lifts signal above noise first)
        // Stage 2: half the total gain, soft-clip, then rest of gain after
        const stg1 = boost;
        const stg2 = Math.sqrt(totalGain);  // first half before soft clip
        // Post-protection makeup is capped: re-multiplying a normalised signal by a huge
        // factor is what turned voice into a square-wave buzz. Capped = loud AND clean.
        const stg3 = (vProt && totalGain > 2) ? Math.min(Math.sqrt(totalGain), 48.0) : Math.sqrt(totalGain);

        for (let i = 0; i < inL.length; i++) {
            // 80 Hz high-pass on the raw mic (kills DC / handling rumble)
            const rawL = inL[i], rawR = inR[i];
            const hpL = this.hA * (this.hyL + rawL - this.hxL); this.hxL = rawL; this.hyL = hpL;
            const hpR = this.hA * (this.hyR + rawR - this.hxR); this.hxR = rawR; this.hyR = hpR;
            let L = hpL, R = hpR;

            // Auto mic level: lifts quiet mics (phones, cheap headsets) toward a
            // steady level. Only ever boosts (1x-6x), only adapts while you speak.
            if (autoL) {
                const a = Math.max(Math.abs(L), Math.abs(R));
                this.agEnv += (a > this.agEnv ? 0.02 : 0.0003) * (a - this.agEnv);
                if (this.agEnv > 0.003) {
                    const tg = Math.min(6, Math.max(1, 0.12 / this.agEnv));
                    this.agG += (tg - this.agG) * (tg < this.agG ? 0.01 : 0.0004);
                }
                L *= this.agG; R *= this.agG;
            }
            L *= stg1; R *= stg1;

            if (nr > 0) {
                const sig = Math.abs(L+R)*0.5;
                const fl  = nr * 0.015;
                if (sig < fl) { L *= Math.max(0,1-nr*3); R *= Math.max(0,1-nr*3); }
                else           { L *= (1-nr*0.08);        R *= (1-nr*0.08); }
            }

            // ── Stronger MIC ONLY gate — adaptive floor + hysteresis ──
            if (mOnly) {
                const sig2 = (Math.abs(L)+Math.abs(R))*0.5;
                // Adaptive noise floor — tracks background level slowly
                if (sig2 < this.noiseFloor * 2.0) {
                    this.noiseFloor += (sig2 - this.noiseFloor) * 0.0002;
                    this.noiseFloor = Math.max(0.0001, this.noiseFloor);
                }
                // Open threshold: 8x above noise floor, min 0.006 — much tighter than before
                const openThr  = Math.max(this.noiseFloor * 5, 0.003);
                // Close threshold: 3x noise floor — hysteresis so gate doesn't chatter
                const closeThr = Math.max(this.noiseFloor * 2, 0.0012);
                const open = sig2 > openThr;
                const hold = sig2 > closeThr;
                if (open) { this.noiseHold = 16000; }
                else if (this.noiseHold > 0) { this.noiseHold--; }
                const go = open || (hold && this.noiseHold > 0);
                // Faster attack (0.04), slow smooth release (0.002) — voice isn't choppy
                this.noiseGate = go
                    ? Math.min(1, this.noiseGate + 0.04)
                    : Math.max(0, this.noiseGate - 0.0006);
                L *= this.noiseGate; R *= this.noiseGate;
            }

            const lvl = Math.abs(L+R)*0.5;
            // FIX (mic cutting out): the gate used to compare ONE raw sample against
            // the threshold, so it chattered on every waveform zero-crossing and chopped
            // quiet words/endings. Now it follows an envelope, holds ~100 ms after the
            // last loud sample, then fades out slowly (~50 ms) instead of snapping shut.
            this.gEnv = lvl > this.gEnv ? lvl : this.gEnv * 0.9995;
            if (this.gEnv > gateT) this.gHold = this.lite ? 14400 : 4800;
            else if (this.gHold > 0) this.gHold--;
            this.gate = (this.gEnv > gateT || this.gHold > 0)
                ? Math.min(1, this.gate + 0.01)
                : Math.max(0, this.gate - (this.lite ? 0.00015 : 0.0004));
            L *= this.gate; R *= this.gate;

            const vOpen = lvl > gateT * 3;
            this.vGate = vOpen ? Math.min(1, this.vGate + 0.02) : Math.max(0, this.vGate - 0.004);

            if (dist > 0) {
                if (sat) {
                    const d = 1 + dist * 12;
                    L = Math.atan(L * d) * (2/Math.PI);
                    R = Math.atan(R * d) * (2/Math.PI);
                    if (dist > 0.7) {
                        L = Math.max(-0.8, Math.min(0.8, L));
                        R = Math.max(-0.8, Math.min(0.8, R));
                    }
                } else {
                    const d = 1 + dist * 8, dn = Math.tanh(d*0.5)||0.01;
                    L = Math.tanh(L*d)/dn; R = Math.tanh(R*d)/dn;
                }
            }

            if (atOn) {
                this.atPhase += atSpd * 0.01;
                if (this.atPhase > 1) this.atPhase -= 1;
                const snap = Math.round(this.atSmooth * 12) / 12;
                this.atSmooth += (snap - this.atSmooth) * 0.1;
                const atMod = 1 + this.atSmooth * 0.02;
                L *= atMod; R *= atMod;
            }

            this.bufL[this.wPos]=L; this.bufR[this.wPos]=R;
            this.wPos=(this.wPos+1)%this.bufSize;
            if (pitch > 0.998 && pitch < 1.002) {
                L=this.bufL[Math.floor(this.rPos)];
                R=this.bufR[Math.floor(this.rPos)];
                this.rPos=(this.rPos+pitch)%this.bufSize;
            } else {
                // v3.15.3: the old single read pointer slid across the write pointer every
                // fraction of a second -> a click / chunk of voice dropped. Two read heads
                // 50% apart with a crossfade: the head that wraps is always silent.
                const W = 1920, B = this.bufSize;
                this.ph = (this.ph || 0) + (1 - pitch) / W;
                if (this.ph >= 1) this.ph -= 1; else if (this.ph < 0) this.ph += 1;
                const ph2 = (this.ph + 0.5) % 1;
                const s1 = Math.sin(Math.PI * this.ph), s2 = Math.sin(Math.PI * ph2);
                const g1 = s1 * s1, g2 = s2 * s2;
                const p1 = ((this.wPos - this.ph * W) % B + B) % B, p2 = ((this.wPos - ph2 * W) % B + B) % B;
                const i1 = Math.floor(p1), f1 = p1 - i1, j1 = (i1 + 1) % B;
                const i2 = Math.floor(p2), f2 = p2 - i2, j2 = (i2 + 1) % B;
                const aL = this.bufL[i1] + (this.bufL[j1] - this.bufL[i1]) * f1, bL = this.bufL[i2] + (this.bufL[j2] - this.bufL[i2]) * f2;
                const aR = this.bufR[i1] + (this.bufR[j1] - this.bufR[i1]) * f1, bR = this.bufR[i2] + (this.bufR[j2] - this.bufR[i2]) * f2;
                L = aL * g1 + bL * g2;
                R = aR * g1 + bR * g2;
            }

            // Stage 2 gain — push signal up before voice protection
            L *= stg2; R *= stg2;

            // ── VOICE PROTECTION — multi-stage soft limiting ──
            // At high gain (x10-x20+) a hard clip turns voice to noise.
            // Instead: gentle tanh saturation → scale back → second gain stage.
            // Result: voice stays THICK and LOUD, not distorted mud.
            if (vProt && totalGain > 2) {
                const knee = 0.85;
                // Soft knee: if below knee, pass clean; above knee, tanh-compress
                const absL = Math.abs(L), absR = Math.abs(R);
                if (absL > knee) L = Math.sign(L) * (knee + (1-knee) * Math.tanh((absL-knee)/(1-knee)));
                if (absR > knee) R = Math.sign(R) * (knee + (1-knee) * Math.tanh((absR-knee)/(1-knee)));
                // High-pass: remove DC bias that builds at extreme gain
                this.hpfL = 0.995 * (this.hpfL + L - (i > 0 ? inL[i-1]*stg1*stg2 : 0));
                // Envelope follower for adaptive ceiling
                this.vpEnvL = Math.max(Math.abs(L), this.vpEnvL * 0.9998);
                this.vpEnvR = Math.max(Math.abs(R), this.vpEnvR * 0.9998);
                if (this.vpEnvL > 1) { L /= this.vpEnvL; }
                if (this.vpEnvR > 1) { R /= this.vpEnvR; }
            }

            // Stage 3 gain — final push after protection
            L *= stg3; R *= stg3;

            // v3.8 POWER LIFT: when gain is up, keep pulling the level toward full scale
            // (fast attack, slow release) so even quiet words come out LOUD and dense.
            if (totalGain > 2) {
                const pk = Math.max(Math.abs(L), Math.abs(R));
                this.plEnv = pk > (this.plEnv || 0) ? pk : (this.plEnv || 0) * 0.9997;
                if (this.plEnv > 0.02) {
                    const want = Math.min(12, Math.max(1, 0.95 / this.plEnv));
                    this.plG = (this.plG || 1) + (want - (this.plG || 1)) * (want < (this.plG || 1) ? 0.05 : 0.0006);
                } else { this.plG = (this.plG || 1) + (1 - (this.plG || 1)) * 0.0005; }
                L *= this.plG; R *= this.plG;
            }

            // God Mode: dry voice untouched. SB490 grit applied to a SEND only → feeds echo → feeds reverb wet path.
            // Your voice = clean. Reverb tail = SB490 character.
            if (god) {
                const dryL = L, dryR = R;
                // SB490 send: bass coloration + 12-bit grit on the send signal only
                let sL = L, sR = R;
                this.gBassL += 0.20 * (sL - this.gBassL);
                this.gBassR += 0.20 * (sR - this.gBassR);
                sL += this.gBassL * 1.2; sR += this.gBassR * 1.2;
                const dr = 6.0, dn = Math.tanh(dr);
                sL = Math.tanh(sL * dr) / dn;
                sR = Math.tanh(sR * dr) / dn;
                sL = Math.round(sL * 2047) / 2047;
                sR = Math.round(sR * 2047) / 2047;
                // echo on the send only
                const dLen = Math.floor(sampleRate * 0.42);
                const rIdx = (this.echoW - dLen + 48000) % 48000;
                const e = this.echoBuf[rIdx];
                { let _w = (sL + sR) * 0.5 + e * 0.65; if (_w < 1e-15 && _w > -1e-15) _w = 0; this.echoBuf[this.echoW] = _w; }
                this.echoW = (this.echoW + 1) % 48000;
                // blend echo tail back at low level — character, not domination
                L = dryL + e * 0.35;
                R = dryR + e * 0.35;
            }

            // تفله: same deal — dry voice clean, tall echo on a send, bleed at controlled level
            if (tfl) {
                const dryL2 = L, dryR2 = R;
                let sL2 = L, sR2 = R;
                const dr2 = 5.0 + 9.0 * tflAmt, dn2 = Math.tanh(dr2);
                sL2 = Math.tanh(sL2 * dr2) / dn2;
                sR2 = Math.tanh(sR2 * dr2) / dn2;
                const dL2 = Math.floor(sampleRate * 0.55);
                const rI2 = (this.tW - dL2 + 96000) % 96000;
                const e2 = this.tBuf[rI2];
                { let _w2 = (sL2 + sR2) * 0.5 + e2 * (0.4 + 0.5 * tflAmt); if (_w2 < 1e-15 && _w2 > -1e-15) _w2 = 0; this.tBuf[this.tW] = _w2; }
                this.tW = (this.tW + 1) % 96000;
                // tall echo tail bleeds in — massive reverb feel, voice stays dry underneath
                // second, shorter tap makes the tail thick; amount scales everything
                const rI3 = (this.tW - Math.floor(sampleRate * 0.27) + 96000) % 96000;
                const e3 = this.tBuf[rI3];
                const mk = 1 + 0.8 * tflAmt;
                L = (dryL2 + (e2 * 1.5 + e3 * 0.9) * tflAmt) * mk;
                R = (dryR2 + (e2 * 1.5 + e3 * 0.9) * tflAmt) * mk;
            }

            // v3.18: if stacked gains ever produce NaN/Infinity, drop that sample and reset the filters, so the voice
            // can never get stuck silent (a single NaN stays in the filters forever otherwise).
            if (!(L - L === 0) || !(R - R === 0)) {
                L = 0; R = 0;
                for (let q = 0; q < N7R_ENGINE_STATES.length; q++) this[N7R_ENGINE_STATES[q]] = 0;
                this.agG = 1; this.plG = 1; this.vGate = 0;
            }
            outL[i] = softCeil(L);
            if (outR) outR[i] = softCeil(R);
            if (outputs[1] && outputs[1][0]) {
                outputs[1][0][i] = outL[i] * this.vGate;
                if (outputs[1][1]) outputs[1][1][i] = (outR ? outR[i] : outL[i]) * this.vGate;
            }
        }
        n7rFlush(this, N7R_ENGINE_STATES);
        if (Math.random() < 0.01) this.port.postMessage({ peak: Math.abs(outL[0] || 0) });
        return true;
    }
}
registerProcessor('n7r-engine', N7rEngine);
// ── v3.15.2 De-esser: cuts the hissy "ssss / tss / spit" band (above 4.5 kHz) only while it sticks out
function n7rLR4(fc) {
    const w = 2 * Math.PI * fc / sampleRate, c = Math.cos(w), al = Math.sin(w) / (2 * 0.70710678), a0 = 1 + al;
    const lp = { b0: (1 - c) / 2 / a0, b1: (1 - c) / a0, b2: (1 - c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 };
    const hp = { b0: (1 + c) / 2 / a0, b1: -(1 + c) / a0, b2: (1 + c) / 2 / a0, a1: -2 * c / a0, a2: (1 - al) / a0 };
    return { lp, hp };
}
class N7rDeEss extends AudioWorkletProcessor {
    static get parameterDescriptors() { return [{ name: 'amount', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' }]; }
    constructor() {
        super();
        const f = n7rLR4(4500); this.f = f;
        // 4 biquads per channel (LP x2, HP x2): [z1,z2] each
        this.st = [0, 1].map(() => new Float64Array(8));
        this.hiE = 0; this.loE = 0; this.g = 1;
        this.aE = 1 - Math.exp(-1 / (0.001 * sampleRate));   // env attack 1 ms
        this.rE = 1 - Math.exp(-1 / (0.040 * sampleRate));   // env release 40 ms
        this.aG = 1 - Math.exp(-1 / (0.0006 * sampleRate));  // gain attack 0.6 ms
        this.rG = 1 - Math.exp(-1 / (0.050 * sampleRate));   // gain release 50 ms
    }
    bq(c, s, o, x) { const y = c.b0 * x + s[o]; s[o] = c.b1 * x - c.a1 * y + s[o + 1]; s[o + 1] = c.b2 * x - c.a2 * y; return y; }
    process(inputs, outputs, parameters) {
        const inp = inputs[0], out = outputs[0];
        if (!inp || !inp.length || !out || !out.length) return true;
        const amt = parameters.amount[0], n = out[0].length, f = this.f;
        if (amt <= 0.001) { for (let c = 0; c < out.length; c++) { const a = inp[c] || inp[0]; for (let i = 0; i < n; i++) out[c][i] = a[i]; } return true; }
        if (!this._lo || this._lo[0].length !== n) { this._lo = [new Float32Array(n), new Float32Array(n)]; this._hi = [new Float32Array(n), new Float32Array(n)]; }
        const nc = Math.min(out.length, 2), lo = this._lo, hi = this._hi;
        for (let c = 0; c < nc; c++) {
            const a = inp[c] || inp[0], s = this.st[c];
            for (let i = 0; i < n; i++) {
                let x = a[i], l = this.bq(f.lp, s, 0, x); l = this.bq(f.lp, s, 2, l);
                let h = this.bq(f.hp, s, 4, x); h = this.bq(f.hp, s, 6, h);
                lo[c][i] = l; hi[c][i] = h;
            }
        }
        const maxDb = 20 * amt;
        for (let i = 0; i < n; i++) {
            let h = 0, l = 0;
            for (let c = 0; c < nc; c++) { h = Math.max(h, Math.abs(hi[c][i])); l = Math.max(l, Math.abs(lo[c][i])); }
            this.hiE += (h - this.hiE) * (h > this.hiE ? this.aE : this.rE);
            this.loE += (l - this.loE) * (l > this.loE ? this.aE : this.rE);
            const hd = 20 * Math.log10(this.hiE + 1e-9), ld = 20 * Math.log10(this.loE + 1e-9);
            let gr = 0;
            if (hd > -52) gr = Math.min(maxDb, Math.max(0, (hd - ld + 8) * 1.0));
            const tg = Math.pow(10, -gr / 20);
            this.g += (tg - this.g) * (tg < this.g ? this.aG : this.rG);
            for (let c = 0; c < nc; c++) out[c][i] = lo[c][i] + hi[c][i] * this.g;
        }
        for (let c = nc; c < out.length; c++) out[c].set(out[0]);
        for (let c = 0; c < 2; c++) { const a = this.st[c]; for (let j = 0; j < 8; j++) { const v = a[j]; if (v < 1e-15 && v > -1e-15) a[j] = 0; } }
        if (this.hiE < 1e-15) this.hiE = 0;
        if (this.loE < 1e-15) this.loE = 0;
        return true;
    }
}
registerProcessor('n7r-deess', N7rDeEss);

`;

    // ─── Stats ────────────────────────────────────────────────────────────
    const Stats = {
        speakingTime:0, speakingStart:null, peakVolume:-60, samples:[],
        update(lvl) {
            if (!PARAMS.statsEnabled) return;
            this.samples.push(lvl); if (this.samples.length>100) this.samples.shift();
            if (lvl > PARAMS.vadThreshold) { if (!this.speakingStart) this.speakingStart=Date.now(); }
            else if (this.speakingStart) { this.speakingTime+=(Date.now()-this.speakingStart)/1000; this.speakingStart=null; }
            this.peakVolume=Math.max(this.peakVolume,lvl);
        },
        get() {
            const avg=this.samples.reduce((a,b)=>a+b,0)/(this.samples.length||1);
            const t=this.speakingTime;
            return { time:`${Math.floor(t/3600)}h ${Math.floor((t%3600)/60)}m ${Math.floor(t%60)}s`, avg:avg.toFixed(1)+' dB', peak:this.peakVolume.toFixed(1)+' dB' };
        },
        reset() { this.speakingTime=0; this.peakVolume=-60; this.samples=[]; }
    };

    // ─── Music Player ────────────────────────────────────────────────────
    const Music = {
        source: null, gainNode: null, buffer: null, fileName: '', playing: false, pending: false,
        // FIX: seek support. Web Audio BufferSource nodes can't be seeked in
        // place — the only way to "jump" is to stop the current source and
        // start a fresh one at a new offset. startTime + offset let us derive
        // "where are we right now" for the progress bar without polling the
        // source itself (which has no currentTime property).
        startTime: 0, offset: 0, rate: 1,
        setRate(r) {
            const ctx = window.DiscordContext;
            r = Math.max(0.25, Math.min(4, +r || 1));
            const t = ctx ? this.getCurrentTime(ctx) : 0;
            this.rate = r;
            if (ctx && this.playing) this.startTime = ctx.currentTime - t / r;
            if (this.source) { try { this.source.playbackRate.setTargetAtTime(r, ctx.currentTime, 0.02); } catch (e) {} }
        },
        init(ctx) {
            if (this.gainNode && this.gainNode.context === ctx) return; // already inited (same context)
            this.gainNode = ctx.createGain();
            this.gainNode.gain.value = PARAMS.musicVolume;
        },
        async load(file, ctx) {
            this.stop();
            const data = await file.arrayBuffer();
            this.buffer = await ctx.decodeAudioData(data);
            this.fileName = file.name;
            this.offset = 0;
            this._start(ctx, 0);
            return file.name;
        },
        _start(ctx, offset) {
            if (!this.buffer) return;
            if (!Core.musicBass) { this.pending = true; this.playing = false; return; }
            this.pending = false;
            if (!this.gainNode) this.init(ctx);
            // FIX: gainNode used to get re-connected to Core.musicBass on
            // every _start() without ever being disconnected first. Harmless
            // on its own (Web Audio de-dupes identical edges), but it left a
            // stale reference to whatever the *previous* Core.musicBass was
            // hanging around — now explicit, so the graph stays exactly one
            // edge deep no matter how many times play/stop/seek fires.
            try { this.gainNode.disconnect(); } catch(e){}
            const off = Math.max(0, Math.min(offset || 0, this.buffer.duration - 0.005));
            const src = ctx.createBufferSource();
            src.buffer = this.buffer;
            src.loop = true;
            try { src.playbackRate.value = this.rate || 1; } catch (e) {}
            src.connect(this.gainNode);
            this.gainNode.connect(Core.karIn || Core.musicBass);
            src.start(0, off);
            this.source = src;
            this.startTime = ctx.currentTime - off / (this.rate || 1);
            this.offset = off;
            this.playing = true;
        },
        stop() {
            // Remember where we were so "seek while stopped" still lands
            // in the right place if play is pressed again.
            if (this.playing) this.offset = this.getCurrentTime(window.DiscordContext);
            if (this.source) {
                try { this.source.stop(); } catch(e){}
                try { this.source.disconnect(); } catch(e){}
                this.source = null;
            }
            this.playing = false;
        },
        // Jump to `time` seconds. Works whether playing or stopped.
        seek(ctx, time) {
            if (!this.buffer) return;
            const wasPlaying = this.playing;
            const t = Math.max(0, Math.min(time, this.buffer.duration - 0.005));
            if (this.source) {
                try { this.source.stop(); } catch(e){}
                try { this.source.disconnect(); } catch(e){}
                this.source = null;
            }
            this.playing = false;
            this.offset = t;
            if (wasPlaying) this._start(ctx, t);
        },
        getCurrentTime(ctx) {
            if (!this.buffer) return 0;
            if (!this.playing || !ctx) return this.offset || 0;
            const dur = this.buffer.duration;
            let t = ((ctx.currentTime - this.startTime) * (this.rate || 1)) % dur;
            if (t < 0) t += dur;
            return t;
        },
        getDuration() {
            return this.buffer ? this.buffer.duration : 0;
        },
        setVolume(v) {
            PARAMS.musicVolume = v;
            if (this.gainNode) this.gainNode.gain.value = v;
            // Re-apply gain scale so music volume slider stays in sync with gain sliders
            Core.updateMusicGain();
        },
        applyMax() {
            PARAMS.musicVolume = 2.6;
            if (this.gainNode) this.gainNode.gain.value = 2.6;
            const t = window.DiscordContext.currentTime;
            // Bass boost stays sane — was 9 which slammed the convolver
            if (Core.musicBass)     Core.musicBass.gain.setTargetAtTime(5, t, 0.05);
            if (Core.musicPresence) Core.musicPresence.gain.setTargetAtTime(3, t, 0.05);
            if (Core.musicComp) {
                Core.musicComp.ratio.setTargetAtTime(6, t, 0.05);
                Core.musicComp.threshold.setTargetAtTime(-8, t, 0.05);
                Core.musicComp.knee.setTargetAtTime(12, t, 0.05);
            }
            // Tighten send limiter further at max volume — reverb stays clean
            if (Core.musicSendLim) {
                Core.musicSendLim.threshold.setTargetAtTime(-18, t, 0.05);
                Core.musicSendLim.ratio.setTargetAtTime(15, t, 0.05);
            }
            const el = document.getElementById('n7r-musicVolume');
            if (el) { el.value = 2.6; el.dispatchEvent(new Event('input')); }
        }
    };

    // ─── Self-listen monitor context ─────────────────────────────────────
    // Separate AudioContext → default audio output so you can hear
    // your own processed voice (and music) without affecting Discord's send.
    // ─── Self-listen monitor ──────────────────────────────────────────────
    // How it works: we add a dedicated monitorGain node inside DiscordContext
    // (built during inject()) and wire it in parallel with the output limiter.
    // Then a hidden <audio> element plays Core.monitorDest.stream — that's
    // what actually hits your speakers. Volume is controlled by monitorGain.
    // This avoids cross-context MediaStream source issues entirely.
    const Monitor = {
        audioEl: null, active: false,

        // Called once inject() has built Core.monitorGain + Core.monitorDest
        start() {
            try {
                this.stop();
                if (!Core.monitorDest) {
                    console.warn('[ツcore] Monitor: no monitorDest yet — join voice first');
                    return false;
                }
                // Hidden <audio> element — plays monitor stream to default output
                const el = document.createElement('audio');
                el.srcObject  = Core.monitorDest.stream;
                el.volume     = Math.min(1, PARAMS.selfListenVolume / 100);
                el.muted      = false;
                el.autoplay   = true;
                el.style.display = 'none';
                document.body.appendChild(el);
                const play = () => el.play().catch(e => console.warn('[ツcore] Monitor play failed:', e));
                if (el.readyState >= 2) { play(); }
                else { el.addEventListener('canplay', play, { once: true }); }
                // If browser blocks autoplay, resume on next gesture
                const resume = () => { if (el.paused) el.play().catch(()=>{}); };
                document.addEventListener('click', resume, { once: true });
                this.audioEl = el;
                // Sync gain node volume
                if (Core.monitorGain) Core.monitorGain.gain.value = PARAMS.selfListenVolume / 100;
                this.active = true;
                return true;
            } catch(e) {
                console.warn('[ツcore] Monitor start failed:', e);
                this.active = false;
                return false;
            }
        },

        stop() {
            if (this.audioEl) {
                try { this.audioEl.pause(); this.audioEl.srcObject = null; } catch(_){}
                try { this.audioEl.remove(); } catch(_){}
                this.audioEl = null;
            }
            // Silence the gain node — graph stays connected, just muted
            if (Core.monitorGain) Core.monitorGain.gain.setTargetAtTime(0, window.DiscordContext?.currentTime || 0, 0.05);
            this.active = false;
        },

        setVolume(v) {
            PARAMS.selfListenVolume = v;
            if (this.audioEl) this.audioEl.volume = Math.min(1, v / 100);
            // Drive anything above 1.0 through the gain node (amplifies monitor signal)
            if (Core.monitorGain) {
                const boost = v > 100 ? v / 100 : 1;
                Core.monitorGain.gain.setTargetAtTime(boost, window.DiscordContext?.currentTime || 0, 0.05);
            }
        }
    };

    // ─── Core ────────────────────────────────────────────────────────────
    const Core = {
        node:null, analyser:null,
        eqBass:null, eqMid:null, eqTreble:null,
        reverbConv:null, reverbSend:null, reverbWet:null, reverbDry:null, reverbMix:null, reverbModDelay:null, reverbLfo:null, reverbLfoGain:null,
        widthSplit:null, widthMerge:null, widthDelL:null, widthDelR:null,
        panner:null, airGain:null, dest:null,
        outputLimiter:null,
        monitorGain:null, monitorDest:null,
        musicBass:null, musicPresence:null, musicComp:null, musicMasterGain:null,
        // music reverb send nodes — separate from voice reverb path
        musicDryGain:null, musicOutputGain:null, // music dry+wet merge → outputLimiter direct
        musicSendLim:null,      // pre-limiter before convolver — stops loud music cooking reverb
        musicReverbSend:null,   // controlled send gain (capped 0.28)
        musicReverbWet:null,    // music wet gain — independent of voice wet level

        _makeImpulse(ctx, decay, mega=false, music=false) {
            // v3.17.0: reverb is ALWAYS the full original 3.15 impulse (LITE no longer shortens it).
            // Real EAX preset (from ReverbPresets64.dll) active -> build the IR from its parameters
            if (PARAMS._eaxP) {
                try {
                    // v3.18.1 CAVERN LAG FIX: a 14 s stereo impulse (x2: voice + music) is too heavy for phones / web views.
                    // On phones (or LITE) the tail is squeezed so it still dies out (-60 dB) inside CAV_CAP seconds.
                    // Same early reflections, same density, same loudness (IR is re-normalised), only the tail is shorter.
                    // Desktop keeps the full 14 s. Force full on any device: localStorage.n7r_cavfull='1'.
                    if (cavActive()) {
                        const irc = eaxBuildIR(ctx.sampleRate, PARAMS._eaxP, Math.max(0.15, PARAMS.reverbDecay), CAVT[cavTier()].head, music ? 0.05 : 0.043);
                        const cb = ctx.createBuffer(2, irc[0].length, ctx.sampleRate);
                        cb.getChannelData(0).set(irc[0]); cb.getChannelData(1).set(irc[1]);
                        return cb;
                    }
                    let _dec = Math.max(0.15, PARAMS.reverbDecay), _cap = 14;
                    if (cavShort()) { _cap = CAV_CAP; if (_dec * 1.05 + 0.2 > _cap) _dec = Math.max(0.15, (_cap - 0.25) / 1.05); }
                    const irs = eaxBuildIR(ctx.sampleRate, PARAMS._eaxP, _dec, _cap, 0.05);
                    const eb = ctx.createBuffer(2, irs[0].length, ctx.sampleRate);
                    eb.getChannelData(0).set(irs[0]); eb.getChannelData(1).set(irs[1]);
                    return eb;
                } catch (e) { console.warn('[ツcore] EAX IR failed, using classic IR', e); }
            }
            const sr  = ctx.sampleRate;
            const d   = Math.max(0.1, Math.min(decay, mega ? 25 : 12));
            const len = Math.floor(sr * d);
            const buf = ctx.createBuffer(2, len, sr);

            // ── SB0490 / EAX reverb model ─────────────────────────────────
            // Creative's EAX engine on the SB0490 has a specific character:
            //   1. 5ms pre-delay before any reflection hits — gives that
            //      "space" gap that makes the reverb feel like a room.
            //   2. Dense early reflection cluster (16 taps, tight spacing) —
            //      EAX used a denser cluster than basic room models. The
            //      cluster gives it that warm, slightly blurred "hall" feel.
            //   3. HF damping on the late tail — highs die ~2x faster.
            //      This is the SB0490 warmth: the tail gets darker over time,
            //      never sounds harsh or metallic like cheap digital reverb.
            //   4. Warm mid body — the late tail has a slight mid emphasis
            //      (LP1 + LP2 blend) that makes voice sit inside the reverb
            //      instead of floating on top of it.
            //
            // The fix for "reverb lowers voice volume": we boosted the impulse
            // gain here AND fixed the crossfade law in updateReverb() to use
            // constant-loudness (1/sqrt) — so at any reverb level, perceived
            // loudness stays the same.

            // Pre-delay offset: 5ms — EAX signature gap
            const preDelay = Math.floor(sr * 0.005);

            // EAX-style dense ER cluster: 16 taps, tighter spacing, both channels
            // slightly offset for stereo width. Gains follow a warm rolloff curve.
            const erTapsL = [5, 10, 14, 19, 24, 31, 38, 46, 55, 65, 76, 88, 100, 115, 130, 148]; // ms
            const erTapsR = [6, 11, 16, 21, 27, 34, 42, 51, 61, 72, 84, 97, 110, 126, 143, 162];
            const erGains = [0.88, 0.78, 0.72, 0.66, 0.60, 0.55, 0.50, 0.45,
                             0.40, 0.36, 0.32, 0.28, 0.24, 0.20, 0.17, 0.14];

            for (let ch = 0; ch < 2; ch++) {
                const data  = buf.getChannelData(ch);
                const taps  = ch === 0 ? erTapsL : erTapsR;

                // Time constant: how fast the late tail decays
                // Tuned so at 2.5s decay you get roughly -60dB at end
                const tau   = sr * d / (mega ? 1.05 : 1.85);
                const tauCh = tau * (mega ? (ch === 0 ? 1.0 : 0.88) : (ch === 0 ? 1.0 : 0.96));

                // HF time constant — highs decay ~1.8x faster than lows (EAX damping)
                const tauHF = tauCh / 1.85;

                // ── Stage 1: Early reflections ────────────────────────────
                for (let t = 0; t < taps.length; t++) {
                    // pre-delay shifts every tap forward by 5ms
                    const tapSample = preDelay + Math.floor(taps[t] * sr / 1000);
                    if (tapSample >= len) continue;
                    const tapGain  = erGains[t] * (mega ? 1.4 : 1.05);
                    // 4ms burst per tap (slightly longer = warmer, less clicky)
                    const burstLen = Math.floor(sr * 0.004);
                    for (let b = 0; b < burstLen && tapSample + b < len; b++) {
                        const env  = Math.exp(-b / (sr * 0.002)); // 2ms burst decay
                        // Alternate sign per tap for stereo decorrelation
                        const sign = (t % 2 === 0) ? 1 : (ch === 0 ? 1 : -1);
                        data[tapSample + b] += (Math.random() * 2 - 1) * tapGain * env * sign;
                    }
                }

                // ── Stage 2: Late diffuse tail ────────────────────────────
                // Starts at 160ms (after the denser ER cluster settles)
                // Dual-LP for normal, triple for mega — HF component dies faster
                const startSample = preDelay + Math.floor(sr * 0.160);

                // Two LP streams: lpLo = warm/low, lpHi = bright/high
                // lpLo decays at tauCh, lpHi decays at tauHF (faster)
                // We blend them: early in the tail there's brightness, then
                // it rolls dark — exactly what EAX does
                const lpCLo = mega ? (0.022 + ch * 0.011) : (0.055 + ch * 0.030);
                const lpCHi = mega ? (0.085 + ch * 0.020) : (0.22  + ch * 0.08);
                const lpC2  = mega ? (0.055 + ch * 0.010) : 0;
                const lpC3  = mega ? (0.110 + ch * 0.008) : 0;
                let lpLo = 0, lpHi = 0, lp2 = 0, lp3 = 0;

                // Blend: how much brightness fades in the tail
                // At start: 40% bright. At 1/3 of tail: ~10%. Smooth.
                const brightFadeLen = len / 3.0;

                for (let i = startSample; i < len; i++) {
                    const n = Math.random() * 2 - 1;
                    lpLo += lpCLo * (n    - lpLo);
                    lpHi += lpCHi * (n    - lpHi);
                    if (mega) {
                        lp2  += lpC2  * (lpLo - lp2);
                        lp3  += lpC3  * (lp2  - lp3);
                    }

                    // Brightness fades over the first third of the tail
                    const brightFade = Math.max(0, 1 - (i - startSample) / brightFadeLen);
                    const src = mega
                        ? (lpLo * 0.55 + lp2 * 0.30 + lp3 * 0.15) * (1 + brightFade * 0.2)
                        : (lpLo * 0.72 + lpHi * 0.28 * brightFade);

                    // 30ms crossfade from ER into tail
                    const join = Math.min(1, (i - startSample) / (sr * 0.030));

                    // Two-rate envelope: lows use tauCh, but overall is amplitude-blended
                    // so the tail sounds darker as it decays (EAX warmth)
                    const envLo = join * Math.exp(-(i - startSample) / tauCh);
                    const envHi = join * Math.exp(-(i - startSample) / tauHF);
                    const env   = envLo * (1 - brightFade * 0.35) + envHi * brightFade * 0.35;

                    // Subtle modulation prevents metallic flutter
                    const mod = mega
                        ? (1 + 0.04 * Math.sin(i / sr * (1.1 + ch * 0.4)) + 0.02 * Math.sin(i / sr * (3.7 + ch * 0.6)))
                        : (1 + 0.025 * Math.sin(i / sr * (2.3 + ch * 0.5)));

                    data[i] += src * env * mod * (mega ? 5.2 : 3.1);
                }
            }
            return buf;
        },

        _makeAirNoise(ctx) {
            const len=ctx.sampleRate*2;
            const buf=ctx.createBuffer(2,len,ctx.sampleRate);
            for(let ch=0;ch<2;ch++){
                const d=buf.getChannelData(ch);
                let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
                for(let i=0;i<len;i++){
                    const w=Math.random()*2-1;
                    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
                    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
                    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
                    d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;
                    b6=w*0.115926;
                }
            }
            return buf;
        },

        // ── FIX: inject() now awaits context ready before building graph ──
        async inject(stream) {
            const ctx = window.DiscordContext;
            if (!ctx) return stream;

            // FIX (the actual "run music, close it, voice goes laggy" bug):
            // Discord calls getUserMedia again on plenty of things that
            // aren't "joining voice" — mute/unmute, deafen, switching
            // channels, reconnecting. Every one of those re-entered this
            // function and built a WHOLE NEW graph (EQ, realtime-convolution
            // reverb x2, the entire music bus, an always-on air-noise
            // oscillator, a worklet node) on top of the previous one.
            // teardown() used to only run in the catch-block on failure —
            // on the normal success path the old graph was simply
            // abandoned, still fully connected, still being pulled every
            // render quantum by its own MediaStreamDestination nodes
            // forever. Every call added a duplicate, permanently-running
            // graph. That's the compounding lag. Tearing down unconditionally
            // before building the new one fixes it at the source.
            // v3.15.3: teardown() stops the song; remember it so we can resume it below.
            const _musicWasPlaying = !!(Music.playing && Music.buffer);
            try { Music._wasPlayingBeforeHeal = _musicWasPlaying; } catch (_e) {}
            this.teardown();
            _pinnedCtx = ctx;

            // WAIT for AudioContext to be running before touching Web Audio API.
            // This is the core Error 3002 fix — no suspended context, no dead graph.
            if (ctx.state !== 'running') {
                await _contextReady;
            }

            const source = ctx.createMediaStreamSource(stream);
            this.source = source;
            this.rawStream = stream;
            try { this.micTrack = stream.getAudioTracks()[0] || null; } catch(e) { this.micTrack = null; }

            // FIX: mic-disconnect crash guard. Without this, a track ending
            // mid-call (Bluetooth headset drop, USB mic unplug, OS permission
            // revoke, tab backgrounded on some Android builds) leaves the
            // AudioWorkletNode's upstream source silently dead — Discord's own
            // renegotiation logic then tries to touch nodes we already
            // half-tore-down and throws, killing the whole audio graph until
            // a full page reload. Instead: on end/mute, we disconnect our own
            // nodes cleanly (never touch Discord's side of the graph) and flip
            // a status flag the UI reads, so ツcore fails soft instead of hard.
            this._micLost = false;
            const handleMicLost = () => {
                if (this._micLost) return; // idempotent — end/mute can both fire
                this._micLost = true;
                try {
                    if (this.node) this.node.port.postMessage && this.node.port.postMessage({type:'mic-lost'});
                } catch(e) {}
                try { window.__N7R_MIC_LOST__ = true; } catch(e) {}
                // Surface it in the existing status badge — no new UI element,
                // reuses the same n7r-status node ACTIVE/BASIC already toggle.
                try {
                    const badge = document.getElementById('n7r-status');
                    if (badge) { badge.classList.remove('active','basic'); badge.title = 'MIC LOST — reconnecting'; }
                    UI.toast('🎤 Mic disconnected — reconnecting…');
                } catch(e) {}
                // v3.17.0: do not wait for Discord — open the mic again by ourselves and keep going.
                try { setTimeout(() => { Core.heal('mic ended'); }, 400); } catch(e) {}
                // Do NOT disconnect(source)/node here synchronously inside the
                // event handler — Chrome can still be mid-callback on some
                // versions and a disconnect() there throws. Defer one tick.
                setTimeout(() => {
                    try { source.disconnect(); } catch(e) {}
                    // Leave this.node connected to dest — process() now zero-fills
                    // on empty input, so downstream (Discord) just hears silence
                    // instead of a crash. If the user regrants mic access,
                    // Discord's own getUserMedia call re-enters our override
                    // and rebuilds a fresh graph from scratch.
                }, 0);
            };
            // FIX (mic cutting out): 'mute' is a TEMPORARY state on Android — it fires
            // when the OS/another app briefly takes the mic, when a headset is
            // plugged/switched, or when audio focus changes (e.g. music starts).
            // It used to be treated like 'ended' and permanently disconnected the
            // mic source, so the headset mic went silent until you rejoined voice.
            // Now only a real 'ended' tears the source down; mute/unmute just
            // update the status badge and the audio resumes by itself.
            this._micEndedFn  = handleMicLost;
            this._micMuteFn   = () => {
                try { const b = document.getElementById('n7r-status'); if (b) b.title = 'MIC MUTED BY SYSTEM (will resume)'; } catch(e) {}
            };
            this._micUnmuteFn = () => {
                try { const b = document.getElementById('n7r-status'); if (b) b.title = ''; } catch(e) {}
                try { Core._mutedFor = 0; } catch(e) {}
            };
            try {
                if (this.micTrack) {
                    this.micTrack.addEventListener('ended',  this._micEndedFn);
                    this.micTrack.addEventListener('mute',   this._micMuteFn);
                    this.micTrack.addEventListener('unmute', this._micUnmuteFn);
                }
            } catch(e) {}
            this.dest = ctx.createMediaStreamDestination();
            this.analyser = ctx.createAnalyser();
            this.analyser.fftSize = 256;

            // EQ
            this.eqBass = ctx.createBiquadFilter(); this.eqBass.type='lowshelf'; this.eqBass.frequency.value=200; this.eqBass.gain.value=(PARAMS.eqBass-50)*0.24;
            this.eqMid  = ctx.createBiquadFilter(); this.eqMid.type='peaking'; this.eqMid.frequency.value=1000; this.eqMid.Q.value=1.0; this.eqMid.gain.value=(PARAMS.eqMid-50)*0.24;
            this.eqTreble=ctx.createBiquadFilter(); this.eqTreble.type='highshelf'; this.eqTreble.frequency.value=8000; this.eqTreble.gain.value=(PARAMS.eqTreble-50)*0.24;

            // Reverb
            this.reverbConv = ctx.createConvolver(); this.reverbConv.buffer = this._makeImpulse(ctx, PARAMS.reverbDecay);
            // Initial gains use equal-power law matching updateReverb()
            const _rv0     = PARAMS.reverb / 100;
            const _theta0  = _rv0 * (Math.PI / 2);
            const _convMU  = 2.2; // convolver makeup constant
            this.reverbDry  = ctx.createGain(); this.reverbDry.gain.value  = Math.cos(_theta0);
            this.reverbSend = ctx.createGain(); this.reverbSend.gain.value = Math.sin(_theta0) * _convMU; this.reverbSend.connect(this.reverbConv);
            this.reverbWet  = ctx.createGain(); this.reverbWet.gain.value  = 1;   // constant: level is set on the SEND, so old tail is never cut
            // reverbMix at 1.0 — equal-power law already handles loudness
            this.reverbMix  = ctx.createGain(); this.reverbMix.gain.value  = 1.0;
            try { this.syncCavern(); } catch (_) {}

            // Width
            this.widthSplit = ctx.createChannelSplitter(2);
            this.widthMerge = ctx.createChannelMerger(2);
            this.widthDelL  = ctx.createDelay(0.05); this.widthDelL.delayTime.value=(PARAMS.width/100)*0.020;
            this.widthDelR  = ctx.createDelay(0.05); this.widthDelR.delayTime.value=(PARAMS.width/100)*0.015;

            // Pan
            this.panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
            if (this.panner) this.panner.pan.value = PARAMS.pan/100;

            // Air
            try {
                const nSrc = ctx.createBufferSource();
                nSrc.buffer = this._makeAirNoise(ctx); nSrc.loop = true;
                const nHPF = ctx.createBiquadFilter(); nHPF.type='highpass'; nHPF.frequency.value=8000;
                this.airGain = ctx.createGain(); this.airGain.gain.value=(PARAMS.airAmount/100)*0.025;
                nSrc.connect(nHPF); nHPF.connect(this.airGain); nSrc.start();
                // FIX: this loops forever and was never stored, so teardown()
                // could disconnect it but never .stop() it — a disconnected
                // looping BufferSource keeps rendering on the audio thread
                // until GC'd, which on a live AudioContext can take a while.
                // Storing the ref lets teardown stop it immediately.
                this.airNoiseSrc = nSrc;
            } catch(e) { this.airGain = null; }

            // ── Music chain ──────────────────────────────────────────────
            // Voice and music use the SAME convolver for reverb tail.
            // But their paths are completely separate so they don't
            // contaminate each other's levels:
            //
            //   VOICE: eqTreble → worklet → reverbDry → reverbMix
            //                             → reverbConv → reverbWet → reverbMix
            //
            //   MUSIC: musicMasterGain → musicDryGain ──────────────────→ musicOutputGain → outputLimiter
            //                         → musicSendGain → musicConv → musicReverbWet → musicOutputGain
            //
            // musicSendLim clamps the signal hitting the convolver at -12dBFS
            // so cranking music volume CANNOT cook the reverb tail.
            // musicReverbWet is independent of reverbWet — voice and music
            // wet levels are controlled separately.
            this.musicBass     = ctx.createBiquadFilter();
            this.musicBass.type = 'lowshelf'; this.musicBass.frequency.value = 150; this.musicBass.gain.value = 6;
            this.musicPresence = ctx.createBiquadFilter();
            this.musicPresence.type = 'highshelf'; this.musicPresence.frequency.value = 6000; this.musicPresence.gain.value = 2;
            this.musicComp = ctx.createDynamicsCompressor();
            this.musicComp.threshold.value = -24; this.musicComp.knee.value = 10;
            this.musicComp.ratio.value = 12; this.musicComp.attack.value = 0.001; this.musicComp.release.value = 0.10;
            this.musicBass.connect(this.musicPresence);
            // v3.9 Karaoke vocal remover (centre-channel cancel) in front of the music chain
            this.karIn = ctx.createGain(); this.karDry = ctx.createGain();
            this.karSplit = ctx.createChannelSplitter(2);
            this.karInv = ctx.createGain(); this.karInv.gain.value = -1;
            this.karCancel = ctx.createGain(); this.karWet = ctx.createGain();
            this.karIn.connect(this.karDry); this.karDry.connect(this.musicBass);
            this.karIn.connect(this.karSplit);
            this.karSplit.connect(this.karCancel, 0);
            this.karSplit.connect(this.karInv, 1); this.karInv.connect(this.karCancel);
            this.karCancel.connect(this.karWet); this.karWet.connect(this.musicBass);
            this.updateKaraoke();
            this.musicPresence.connect(this.musicComp);
            this.musicMasterGain = ctx.createGain();
            this.musicMasterGain.gain.value = 1.0;
            this.musicComp.connect(this.musicMasterGain);
            // Music soft-saturator: loud music rounds off instead of slamming the shared limiter
            this.musicSatPre = ctx.createGain(); this.musicSatPre.gain.value = 0.25;
            this.musicSat = ctx.createWaveShaper();
            const _mc = new Float32Array(4097);
            for (let _i = 0; _i < _mc.length; _i++) { const u = (_i / 2048) - 1; _mc[_i] = 0.85 * Math.tanh(4 * u); }
            this.musicSat.curve = _mc; this.musicSat.oversample = '4x';
            this.musicSatOut = ctx.createGain(); this.musicSatOut.gain.value = 1.0;
            this.musicMasterGain.connect(this.musicSatPre);
            this.musicSatPre.connect(this.musicSat);
            this.musicSat.connect(this.musicSatOut);

            // Music gets its OWN convolver + its OWN output bus.
            // musicOutputGain merges dry+wet and feeds DIRECTLY into outputLimiter,
            // bypassing voice reverbMix entirely — so music reverb slider is fully
            // independent and 0% = truly dry, 100% = fully wet with no voice bleed.
            const _mrv0    = PARAMS.musicReverb / 100;
            const _mtheta0 = _mrv0 * (Math.PI / 2);
            const _mConvMU = 4.0;
            this.musicConv      = ctx.createConvolver();
            this.musicConv.buffer = this._makeImpulse(ctx, PARAMS.reverbDecay, false, true);
            this.musicDryGain   = ctx.createGain();
            this.musicSendGain  = ctx.createGain();
            this.musicReverbWet = ctx.createGain();
            this.musicOutputGain = ctx.createGain(); // final bus — goes to outputLimiter
            this.musicOutputGain.gain.value = 1.0;
            this.musicDryGain.gain.value   = Math.cos(_mtheta0);
            this.musicSendGain.gain.value  = Math.sin(_mtheta0) * Math.sin(_mtheta0);
            this.musicReverbWet.gain.value = _mConvMU;
            // Music dry path → musicOutputGain (NOT reverbMix)
            this.musicSatOut.connect(this.musicDryGain);
            this.musicDryGain.connect(this.musicOutputGain);
            // Music wet path → musicConv → musicReverbWet → musicOutputGain
            this.musicSatOut.connect(this.musicSendGain);
            this.musicSendGain.connect(this.musicConv);
            this.musicConv.connect(this.musicReverbWet);
            this.musicReverbWet.connect(this.musicOutputGain);
            // musicOutputGain connects to outputLimiter after graph is built (see below)

            // ── Reverb wiring ────────────────────────────────────────────
            // Voice dry
            this.reverbDry.connect(this.reverbMix);
            // Voice wet — only voice reverbConv here, no music bleed
            // EAX modulation: a tiny LFO-modulated delay on the wet path (modDepth / modTime of the preset)
            try {
                this.reverbModDelay = ctx.createDelay(0.05); this.reverbModDelay.delayTime.value = 0.004;
                this.reverbLfo = ctx.createOscillator(); this.reverbLfo.type = 'sine'; this.reverbLfo.frequency.value = 1;
                this.reverbLfoGain = ctx.createGain(); this.reverbLfoGain.gain.value = 0;
                this.reverbLfo.connect(this.reverbLfoGain); this.reverbLfoGain.connect(this.reverbModDelay.delayTime);
                this.reverbLfo.start();
                this.reverbConv.connect(this.reverbModDelay); this.reverbModDelay.connect(this.reverbWet);
                this.updateReverbMod();
            } catch (e) { try { this.reverbConv.connect(this.reverbWet); } catch (_) {} }
            this.reverbWet.connect(this.reverbMix);
            if (this.airGain) this.airGain.connect(this.reverbMix);

            // ── Width wiring ─────────────────────────────────────────────
            this.reverbMix.connect(this.widthSplit);
            this.widthSplit.connect(this.widthDelL, 0); this.widthDelL.connect(this.widthMerge, 0, 0);
            this.widthSplit.connect(this.widthDelR, 1); this.widthDelR.connect(this.widthMerge, 0, 1);

            // ── Output limiter → Discord mic send ────────────────────────
            this.outputLimiter = ctx.createDynamicsCompressor();
            this.outputLimiter.threshold.value = -1.5;
            this.outputLimiter.knee.value       = 0;
            this.outputLimiter.ratio.value      = 20;
            this.outputLimiter.attack.value     = 0.001;
            this.outputLimiter.release.value    = 0.1;

            // v3.15.2: de-esser slot (pass-through until the worklet is loaded, see below)
            this.deEssIn = ctx.createGain();
            if (this.panner) { this.widthMerge.connect(this.panner); this.panner.connect(this.deEssIn); }
            else { this.widthMerge.connect(this.deEssIn); }
            this.deEssIn.connect(this.analyser);
            this.analyser.connect(this.outputLimiter);
            // v3.20.9 LOUD MODE chain: limiter -> makeup gain -> soft clip (never passes full scale) -> send
            this.loudGain = ctx.createGain(); this.loudGain.gain.value = 1;
            this.loudClip = ctx.createWaveShaper();
            { const N = 2048, c = new Float32Array(N), k = 0.89;
              for (let i = 0; i < N; i++) { const x = (i / (N - 1)) * 2 - 1, a = Math.abs(x); c[i] = a < k ? x : Math.sign(x) * (k + (1 - k) * Math.tanh((a - k) / (1 - k))); }
              this.loudClip.curve = c; }
            this.outputLimiter.connect(this.loudGain); this.loudGain.connect(this.loudClip); this.loudClip.connect(this.dest);
            try { this.setLoud(localStorage.getItem('n7r_loud') === '1'); } catch (_e) {}

            // Music output bus → outputLimiter directly (bypasses voice reverb)
            if (this.musicOutputGain) this.musicOutputGain.connect(this.outputLimiter);

            // ── Monitor (self-listen) tap ─────────────────────────────────
            // Sits AFTER the limiter, BEFORE dest — same point you hear on Discord.
            // monitorGain controls volume; monitorDest is a separate stream
            // that a hidden <audio> element plays to your speakers.
            this.monitorGain = ctx.createGain();
            this.monitorGain.gain.value = PARAMS.selfListen ? (PARAMS.selfListenVolume / 100) : 0;
            this.monitorDest = ctx.createMediaStreamDestination();
            this.outputLimiter.connect(this.monitorGain);
            this.monitorGain.connect(this.monitorDest);

            // EQ chain → worklet
            // v3.9: 9-band graphic EQ + level in front of the old Bass/Mid/Treble
            this.eqBands = EQ_FREQS.map((f, i) => {
                const b = ctx.createBiquadFilter();
                b.type = i === 0 ? 'lowshelf' : 'peaking';          // plugin: all 7 bands (125..8k) are peaking, 8k too
                b.frequency.value = f; b.Q.value = i >= 2 ? 1.4142 : 0.9;   // ReverbPresets64.dll: 2Q = 2.828
                b.gain.value = PARAMS.eqOn === false ? 0 : (+(PARAMS.eqBands && PARAMS.eqBands[i]) || 0);
                return b;
            });
            this.eqLevel = ctx.createGain(); this.eqLevel.gain.value = PARAMS.eqOn === false ? 1 : dbToGain(+PARAMS.eqLevel || 0);
            { let _p = source; this.eqBands.forEach(b => { _p.connect(b); _p = b; }); _p.connect(this.eqLevel); this.eqLevel.connect(this.eqBass); }
            this.eqBass.connect(this.eqMid); this.eqMid.connect(this.eqTreble);

            // Worklet — blob first, data URI fallback for WebKit/Orion, then basic
            try {
                // v3.15.3: the processors can only be registered ONCE per context. Every
                // re-inject (mute/unmute, channel change) used to add the module again, which
                // throws "already registered" -> fell into BASIC mode (no gain/gate/de-esser).
                let loaded = !!ctx.__n7rWorkletLoaded;
                if (!loaded) try {
                    const blob = new Blob([WORKLET], { type: 'application/javascript' });
                    const blobURL = URL.createObjectURL(blob);
                    await ctx.audioWorklet.addModule(blobURL);
                    URL.revokeObjectURL(blobURL);
                    loaded = true; ctx.__n7rWorkletLoaded = true;
                } catch(_) {
                    try {
                        const b64 = btoa(unescape(encodeURIComponent(WORKLET)));
                        await ctx.audioWorklet.addModule('data:application/javascript;base64,' + b64);
                        loaded = true; ctx.__n7rWorkletLoaded = true;
                    } catch(_2) {}
                }
                if (!loaded) throw new Error('worklet unavailable');
                this.node = new AudioWorkletNode(ctx, 'n7r-engine', { numberOfOutputs:2, outputChannelCount:[2,2] });
                this.node.port.onmessage = e => { if (e.data?.peak != null) UI.updateMeter(e.data.peak); };
                try { this.node.port.postMessage({ type: 'lite', on: !!LITE.on }); } catch (_) {}
                this.eqTreble.connect(this.node);
                this.node.connect(this.reverbDry, 0);  // dry path
                this.node.connect(this.reverbSend, 1); // gated voice → reverb only
                // v3.15.2 De-esser on the voice + reverb (music bypasses it): cuts hiss / "ssss" / spit above 4.5 kHz
                try {
                    const _de = new AudioWorkletNode(ctx, 'n7r-deess', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
                    this.deEssIn.disconnect(this.analyser); this.deEssIn.connect(_de); _de.connect(this.analyser);
                    this.deEss = _de;
                } catch (_de2) { try { this.deEssIn.connect(this.analyser); } catch (_) {} }
                this.update();
                UI.setStatus('ACTIVE');
                try { window.__N7R_MIC_LOST__ = false; } catch(e) {}
            } catch(e) {
                this.eqTreble.connect(this.reverbDry);
                this.eqTreble.connect(this.reverbSend);
                UI.setStatus('BASIC');
            }

            // Init music player and flush any pending music
            Music.init(ctx);
            if (Music.buffer && (Music.pending || _musicWasPlaying)) Music._start(ctx, Music.offset);

            // Start self-listen if it was already enabled before joining voice
            if (PARAMS.selfListen) Monitor.start();

            // FIX (headset mic fights itself): the raw capture stream was never
            // stopped, so every re-join/mute left another live capture of the
            // headset open (and the OS kept it in call mode). When Discord stops
            // the track we handed it, release the raw mic as well.
            try {
                const outTrack = this.dest.stream.getAudioTracks()[0];
                if (outTrack) {
                    outTrack.__n7rRaw = stream;           // v3.17.0: heal() may replace this with a fresh capture
                    const origStop = outTrack.stop.bind(outTrack);
                    outTrack.stop = () => {
                        try { origStop(); } catch(e) {}
                        const rawStream = outTrack.__n7rRaw;
                        try { rawStream && rawStream.getTracks().forEach(t => { try { t.stop(); } catch(e) {} }); } catch(e) {}
                        if (Core.rawStream === rawStream) { Core.rawStream = null; try { Core.source && Core.source.disconnect(); } catch(e) {} Core.source = null; }
                    };
                }
            } catch(e) {}

            return this.dest.stream;
        },


        // ═══ v3.17.0 SELF-HEAL ═══════════════════════════════════════════════════════════
        // Mic unplugged / headset switched / Discord mute-unmute / leave room + rejoin / audio context
        // suspended: ツcore now reconnects by itself and keeps going (no need to rejoin voice).
        // Nothing here touches any sound value — it only re-opens the mic and re-plugs it into the SAME graph.
        async heal(reason, force) {
            if (this._healing) return false;
            const ctx = _pinnedCtx;
            const say = m => { try { if (force) UI.toast(m); } catch (_e) {} };
            if (!ctx || ctx.state === 'closed' || !this.dest || !this.eqBands) { say('⚠ Join a voice channel first!'); return false; }
            const out = this.dest.stream.getAudioTracks()[0];
            if (!out || out.readyState === 'ended') { say('⚠ Join a voice channel first!'); return false; }
            this._healing = true;
            try {
                try { if (ctx.state !== 'running') await ctx.resume(); } catch (_e) {}
                const t0 = this.micTrack;
                const need = force || this._micLost || !t0 || t0.readyState === 'ended';
                if (!need) { say('✅ Audio is fine'); return true; }
                const cons = this.lastGUM || { tuned: { audio: true }, original: { audio: true } };
                let s = null;
                for (let i = 0; i < 6 && !s; i++) {
                    try { s = await nativeGUM(cons.tuned); }
                    catch (e) { try { s = await nativeGUM(cons.original); } catch (e2) { s = null; } }
                    if (s && !(s.getAudioTracks()[0])) { try { s.getTracks().forEach(t => t.stop()); } catch (_e) {} s = null; }
                    if (!s) await new Promise(r => setTimeout(r, 1500));
                    if (out.readyState === 'ended' || ctx.state === 'closed') break;
                }
                // the graph may have been rebuilt / the room left while we were waiting
                const stillSame = this.dest && this.dest.stream.getAudioTracks()[0] === out && out.readyState !== 'ended' && ctx.state !== 'closed' && this.eqBands;
                if (!s || !stillSame) {
                    if (s) { try { s.getTracks().forEach(t => t.stop()); } catch (_e) {} }
                    this._healFails = (this._healFails || 0) + 1;
                    if (stillSame && this._healFails < 1000) setTimeout(() => { Core.heal('retry'); }, Math.min(8000, 1500 + this._healFails * 500));   // keep trying (e.g. headset still unplugged)
                    return false;
                }
                const t = s.getAudioTracks()[0];
                try {
                    if (t0 && t0.removeEventListener) {
                        if (this._micEndedFn)  t0.removeEventListener('ended',  this._micEndedFn);
                        if (this._micMuteFn)   t0.removeEventListener('mute',   this._micMuteFn);
                        if (this._micUnmuteFn) t0.removeEventListener('unmute', this._micUnmuteFn);
                    }
                } catch (_e) {}
                const oldRaw = this.rawStream, oldSrc = this.source;
                const src = ctx.createMediaStreamSource(s);
                src.connect(this.eqBands[0]);                 // exactly where the first source was plugged
                try { if (oldSrc) oldSrc.disconnect(); } catch (_e) {}
                this.source = src; this.rawStream = s; this.micTrack = t; this._micLost = false; this._healFails = 0;
                out.__n7rRaw = s;
                try {
                    t.addEventListener('ended',  this._micEndedFn);
                    t.addEventListener('mute',   this._micMuteFn);
                    t.addEventListener('unmute', this._micUnmuteFn);
                } catch (_e) {}
                try { if (oldRaw && oldRaw !== s) oldRaw.getTracks().forEach(x => { try { x.stop(); } catch (_e) {} }); } catch (_e) {}
                try { window.__N7R_MIC_LOST__ = false; } catch (_e) {}
                try { UI.setStatus(this.node ? 'ACTIVE' : 'BASIC'); } catch (_e) {}
                try { const b = document.getElementById('n7r-status'); if (b) b.title = ''; } catch (_e) {}
                try { UI.toast('🎤 Mic reconnected'); } catch (_e) {}
                // song: if the context hiccuped and the song stopped, continue it from where it was
                try { if (Music.buffer && !Music.playing && Music._wasPlayingBeforeHeal) { Music._start(ctx, Music.offset); } } catch (_e) {}
                return true;
            } catch (e) {
                console.warn('[ツcore] heal failed', e);
                return false;
            } finally { this._healing = false; }
        },

        // FIX: disconnect-crash guard. Called when getUserMedia's post-inject
        // step throws (e.g. race between mic disconnect and graph build).
        // Disconnects every node we own — never touches anything belonging to
        // Discord's own audio pipeline — so a failed build doesn't leave dead
        // references around that throw on the *next* getUserMedia call.
        teardown() {
            // Stop sources FIRST. disconnect() alone does not stop an
            // oscillator/BufferSource — it keeps generating audio into
            // nothing, still consuming an audio-thread render slot, until
            // GC'd. That was the real leak.
            try { if (this.airNoiseSrc) { this.airNoiseSrc.stop(); this.airNoiseSrc.disconnect(); } } catch(e) {}
            this.airNoiseSrc = null;
            try { Music.stop(); } catch(e) {}
            try { Monitor.stop(); } catch(e) {}

            // FIX: this list was missing the output stage, the monitor
            // stage, and the ENTIRE music chain (musicBass through
            // musicOutputGain) — meaning those nodes never got disconnected
            // on a normal successful re-inject, only on an outright crash.
            // That's why the leak scaled specifically with music use: the
            // music bus was the biggest, most CPU-heavy part of the graph
            // (its own convolution reverb, waveshaper, compressor) and it
            // was the part most reliably left orphaned and running.
            try { (this.eqBands || []).forEach(b => { try { b.disconnect(); } catch(e) {} }); } catch(e) {}
            this.eqBands = null;
            const nodes = [
                'eqLevel','karIn','karDry','karSplit','karInv','karCancel','karWet',
                'eqBass','eqMid','eqTreble',
                'reverbSend','reverbConv','reverbDry','reverbWet','reverbMix','reverbModDelay','reverbLfoGain',
                'widthSplit','widthMerge','widthDelL','widthDelR',
                'panner','airGain','node','deEssIn','deEss','analyser','dest',
                'outputLimiter','loudGain','loudClip','monitorGain','monitorDest',
                'musicBass','musicPresence','musicComp','musicMasterGain',
                'musicSatPre','musicSat','musicSatOut',
                'musicConv','musicDryGain','musicSendGain','musicReverbWet',
                'musicOutputGain','musicSendLim'
            ];
            try { if (this.reverbLfo) { this.reverbLfo.stop(); this.reverbLfo.disconnect(); } } catch(e) {}
            this.reverbLfo = null;
            for (const key of nodes) {
                try {
                    const n = this[key];
                    if (n && typeof n.disconnect === 'function') n.disconnect();
                } catch(e) {}
            }
            try {
                if (this.node && this.node.port) this.node.port.onmessage = null;
            } catch(e) {}
            try {
                if (this.micTrack && this.micTrack.removeEventListener) {
                    if (this._micEndedFn)  this.micTrack.removeEventListener('ended',  this._micEndedFn);
                    if (this._micMuteFn)   this.micTrack.removeEventListener('mute',   this._micMuteFn);
                    if (this._micUnmuteFn) this.micTrack.removeEventListener('unmute', this._micUnmuteFn);
                }
            } catch(e) {}
            try { if (this.source) this.source.disconnect(); } catch(e) {}
            this.source = null;
            // Release the previous raw mic capture so only ONE capture of the headset is live.
            try { if (this.rawStream) this.rawStream.getTracks().forEach(t => { try { t.stop(); } catch(e) {} }); } catch(e) {}
            this.rawStream = null;
            this._micLost = false;
        },

        update() {
            if (!this.node) return;
            const p = this.node.parameters;
            const t = window.DiscordContext.currentTime;
            const set = (k,v) => { try{ if(p.has(k)) p.get(k).setTargetAtTime(v,t,0.05); }catch(_){} };
            set('gain',           dbToGain(PARAMS.masterGain));
            set('gain2',          dbToGain(PARAMS.gain2));
            set('gain3',          dbToGain(PARAMS.gain3));
            set('boost',          dbToGain(PARAMS.inputBoost));
            set('pitch',          Math.pow(2,(PARAMS.pitch-50)/25));
            set('gateThreshold',  dbToGain(PARAMS.gateThreshold));
            set('distortion',     PARAMS.distortion/100);
            set('noiseReduction', PARAMS.noiseReduction/100);
            set('ducking',        PARAMS.duckingEnabled ? PARAMS.duckingReduction/20 : 0);
            set('autotuneOn',     PARAMS.autotuneOn ? 1 : 0);
            set('autotuneSpeed',  PARAMS.autotuneSpeed);
            set('godMode',        PARAMS.godMode ? 1 : 0);
            set('tafleh',         Math.max(0, Math.min(100, +PARAMS.tafleh || 0)) / 100);
            set('satMode',        PARAMS.satMode ? 1 : 0);
            set('micOnly',        PARAMS.micOnly ? 1 : 0);
            set('gainProtect',    PARAMS.gainProtect !== false ? 1 : 0);
            set('autoLevel',      PARAMS.autoLevel !== false ? 1 : 0);
            this.updateEQ(); this.updateEQBands(); this.updateKaraoke(); this.updateReverb(); this.updateWidth(); this.updatePan(); this.updateAir(); this.updateMusicGain();
        },

        updateEQBands() {
            if (!this.eqBands || !window.DiscordContext) return;
            const t = window.DiscordContext.currentTime;
            this.eqBands.forEach((b, i) => { try { b.gain.setTargetAtTime(PARAMS.eqOn === false ? 0 : (+(PARAMS.eqBands && PARAMS.eqBands[i]) || 0), t, 0.02); } catch(e) {} });
            if (this.eqLevel) this.eqLevel.gain.setTargetAtTime(PARAMS.eqOn === false ? 1 : dbToGain(+PARAMS.eqLevel || 0), t, 0.02);
        },
        updateKaraoke() {
            if (!this.karDry || !window.DiscordContext) return;
            const t = window.DiscordContext.currentTime;
            const k = PARAMS.karOn ? Math.max(0, Math.min(1, (+PARAMS.karAmount || 0) / 100)) : 0;
            this.karDry.gain.setTargetAtTime(1 - k, t, 0.03);
            this.karWet.gain.setTargetAtTime(k * 1.25, t, 0.03);
        },
        updateEQ() {
            if (!this.eqBass) return;
            const t = window.DiscordContext.currentTime;
            this.eqBass.gain.setTargetAtTime((PARAMS.eqBass-50)*0.24, t, 0.02);
            this.eqMid.gain.setTargetAtTime((PARAMS.eqMid-50)*0.24, t, 0.02);
            this.eqTreble.gain.setTargetAtTime((PARAMS.eqTreble-50)*0.24, t, 0.02);
        },
        updateReverb() {
            if (!this.reverbWet) return;
            const t  = window.DiscordContext.currentTime;
            const rv = PARAMS.reverb / 100;
            const dry = 1 - rv;

            // ── CONSTANT-LOUDNESS crossfade ───────────────────────────────
            // Standard linear dry=(1-rv)/wet=rv crossfade loses up to -3dB at
            // 50/50 and sounds even quieter because the convolver attenuates
            // the wet signal on its way out.
            //
            // Fix: equal-power law. Angle theta maps rv → [0, PI/2].
            // dry = cos(theta), wet = sin(theta).
            // cos²+sin²=1 → constant perceived power at any rv.
            // Then makeup compensates for the convolver's own level loss
            // (convolver output is ~0.5–0.7x the input depending on the IR).
            //
            // Result: voice at 300 gain with reverb 100% sounds JUST AS LOUD
            // as with reverb at 0. The reverb adds space, doesn't steal level.
            const theta  = rv * (Math.PI / 2);
            // Real EAX preset active (plugin behaviour): dry voice stays, reverb is ADDED on top.
            const dryG   = PARAMS._eaxP ? Math.cos(theta * 0.3) : Math.cos(theta);
            const wetG   = Math.sin(theta);

            // Convolver makeup: the IR doesn't preserve unity gain.
            // Empirically the wet output needs ~2.2x boost to match dry level.
            // This is the main fix for "reverb makes music/voice lower".
            const convMakeup = 3.2;

            this.reverbDry.gain.setTargetAtTime(dryG,             t, 0.05);
            // Level goes to the send (before the convolver): turning the slider down only affects NEW sound,
            // the reverb that already left the mic keeps ringing out and fades by itself.
            if (this.reverbSend) this.reverbSend.gain.setTargetAtTime(wetG * convMakeup, t, 0.05);
            this.reverbWet.gain.setTargetAtTime(1, t, 0.05);

            if (this.reverbMix) this.reverbMix.gain.setTargetAtTime(1.0, t, 0.05);
        },
        updateReverbMod() {
            if (!this.reverbLfoGain || !this.reverbLfo) return;
            const p = PARAMS._eaxP, t = window.DiscordContext.currentTime;
            const depth = p ? Math.min(1, p.modD) * 0.0012 : 0;         // seconds of delay swing
            const freq  = p ? Math.max(0.25, Math.min(30, 1 / Math.max(0.03, p.modT))) : 1;
            this.reverbLfoGain.gain.setTargetAtTime(depth, t, 0.05);
            this.reverbLfo.frequency.setTargetAtTime(freq, t, 0.05);
        },
        applyLite() {
            // v3.17.0: LITE only touches buffering / gate hold. Reverb + music saturator are never changed.
            try { if (this.node) this.node.port.postMessage({ type: 'lite', on: !!LITE.on }); } catch (_) {}
            // v3.18.1: LITE switched on (audio fell behind) while a long reverb is active -> rebuild it with the shorter tail
            try { if (cavActive()) { if (CAVN.tier != null && CAVN.tier > 3) CAVN.tier = 3; this.rebuildReverb(); } else if (PARAMS._eaxP && PARAMS.reverbDecay > 4.5) this.rebuildReverb(); } catch (_) {}
        },
        // v3.20.10: the rebuild is heavy (builds 2 impulses, swaps convolver buffers). For every reverb EXCEPT Haunted Cavern it now waits
        // until you stop moving a slider (160 ms) and runs once. Haunted Cavern keeps the original instant behaviour.
        rebuildReverb() {
            // Haunted Cavern: EXACTLY the original behaviour (runs right away, untouched).
            let cav = false; try { cav = !!cavActive(); } catch (_e) {}
            clearTimeout(this._rbT);
            if (cav) return this._rebuildReverbNow();
            this._rbT = setTimeout(() => { try { this._rebuildReverbNow(); } catch (_e) {} }, 160);
        },
        _rebuildReverbNow() {
            if (!this.reverbConv) return;
            this.updateReverbMod();
            try { this.reverbConv.buffer = this._makeImpulse(window.DiscordContext, PARAMS.reverbDecay, PARAMS.megaReverb); } catch(_){}
            try { if (this.musicConv) this.musicConv.buffer = this._makeImpulse(window.DiscordContext, PARAMS.reverbDecay, false, true); } catch(_){}
            try { this.syncCavern(); } catch(_){}
        },
        syncCavern() {
            const ctx = window.DiscordContext;
            try {
                if (this._cav) {
                    this._cav.nodes.forEach(n => { try { n.disconnect(); } catch (_e) {} });
                    this._cav.ins.forEach(n => { try { if (this.reverbSend) this.reverbSend.disconnect(n); } catch (_e) {} });
                    this._cav = null;
                }
            } catch (_e) { this._cav = null; }
            if (!ctx || !this.reverbSend || !this.reverbConv || !cavActive()) return;
            const T = CAVT[cavTier()], nodes = [], ins = [];
            const out = ctx.createGain(); out.gain.value = 1; out.connect(this.reverbConv); nodes.push(out);
            for (let i = 0; i < T.pairs; i++) {
                const a = CAVP[i][0], b = CAVP[i][1];
                const inG = ctx.createGain(); inG.gain.value = CAVN.inG;
                const dL = ctx.createDelay(2), dR = ctx.createDelay(2); dL.delayTime.value = a; dR.delayTime.value = b;
                const lpL = ctx.createBiquadFilter(), lpR = ctx.createBiquadFilter();
                lpL.type = lpR.type = 'lowpass'; lpL.frequency.value = lpR.frequency.value = 3400 - i * 600; lpL.Q.value = lpR.Q.value = 0.5;
                const gL = ctx.createGain(), gR = ctx.createGain(); gL.gain.value = gR.gain.value = CAVN.g;
                const mg = ctx.createChannelMerger(2);
                this.reverbSend.connect(inG); inG.connect(dL);
                dL.connect(lpL); lpL.connect(gL); gL.connect(dR);      // left wall -> right wall
                dR.connect(lpR); lpR.connect(gR); gR.connect(dL);      // right wall -> left wall (each bounce doubles again)
                lpL.connect(mg, 0, 0); lpR.connect(mg, 0, 1); mg.connect(out);
                nodes.push(inG, dL, dR, lpL, lpR, gL, gR, mg); ins.push(inG);
            }
            this._cav = { nodes, ins };
        },
        updateWidth() {
            if (!this.widthDelL) return;
            const t = window.DiscordContext.currentTime;
            this.widthDelL.delayTime.setTargetAtTime((PARAMS.width/100)*0.020, t, 0.05);
            this.widthDelR.delayTime.setTargetAtTime((PARAMS.width/100)*0.015, t, 0.05);
        },
        updatePan() {
            if (!this.panner) return;
            this.panner.pan.setTargetAtTime(PARAMS.pan/100, window.DiscordContext.currentTime, 0.05);
        },
        updateAir() {
            if (!this.airGain) return;
            this.airGain.gain.setTargetAtTime((PARAMS.airAmount/100)*0.025, window.DiscordContext.currentTime, 0.05);
        },
        updateMusicGain() {
            if (!this.musicMasterGain) return;
            const t      = window.DiscordContext.currentTime;
            const mrv    = PARAMS.musicReverb / 100;
            const theta  = mrv * (Math.PI / 2);
            // Equal-power crossfade: at 0% reverb dry=1/wet=0, at 100% dry=0/wet=1
            const dryG   = Math.cos(theta);
            const wetG   = Math.sin(theta);
            const convMU = 4.0;
            // Music volume scales with master gain — same boost your voice gets
            // Clamp to 8.0 max so music doesn't cook the limiter at extreme gain
            const gainScale = Math.min(120.0, dbToGain((+PARAMS.masterGain || 0) + (+PARAMS.gain2 || 0) + (+PARAMS.gain3 || 0) + (+PARAMS.inputBoost || 0)));
            this.musicMasterGain.gain.setTargetAtTime(PARAMS.musicVolume * gainScale * 1.6, t, 0.05);
            if (this.musicDryGain)   this.musicDryGain.gain.setTargetAtTime(dryG,          t, 0.05);
            if (this.musicSendGain)  this.musicSendGain.gain.setTargetAtTime(wetG * wetG,  t, 0.05);
            if (this.musicReverbWet) this.musicReverbWet.gain.setTargetAtTime(convMU,      t, 0.05);
        },
        setLoud(on) {
            this.loudOn = !!on;
            try {
                const t = this.ctx.currentTime;
                this.outputLimiter.threshold.setTargetAtTime(on ? -12 : -1.5, t, 0.05);
                this.loudGain.gain.setTargetAtTime(on ? 3.0 : 1, t, 0.05);
            } catch (_e) {}
            try { localStorage.setItem('n7r_loud', on ? '1' : '0'); } catch (_e) {}
        },
        getSpectrum() {
            if (!this.analyser) return new Uint8Array(0);
            const d = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(d); return d;
        }
    };

    function dbToGain(db) { return Math.pow(10, db/20); }
    function fmtTime(s) {
        if (!isFinite(s) || s < 0) s = 0;
        const m = Math.floor(s / 60), sec = Math.floor(s % 60);
        return m + ':' + String(sec).padStart(2, '0');
    }

    // ─── getUserMedia override ─────────────────────────────────────────────
    // FIX: constraints preserve echoCancellation:false etc. so Discord doesn't
    // layer its own processing on top of ours — that double-processing was
    // another cause of no-signal / Error 3002 on some hardware.
    const nativeGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
        const original = constraints;
        let tuned = constraints;
        if (constraints && constraints.audio) {
            // Build a NEW constraints object (never mutate Discord's), so a failed
            // attempt can fall back to exactly what Discord asked for — including the
            // headset deviceId it selected.
            const baseAudio = typeof constraints.audio === 'object' ? constraints.audio : {};
            tuned = Object.assign({}, constraints, {
                audio: Object.assign({}, baseAudio,
                    PARAMS.micOnly
                        ? { echoCancellation:true, noiseSuppression:true, autoGainControl:false }
                        : { echoCancellation:false, noiseSuppression:PARAMS.cleanVoice !== false, autoGainControl:false },
                    { googHighpassFilter:true },
                    // 48 kHz mono matches the AudioContext so the browser doesn't resample.
                    // (The old 10 ms latency request and sampleSize pin are gone: tiny
                    // capture buffers cause underruns/dropouts on mid-range phones.)
                    { sampleRate: 48000, channelCount: 1 }
                )
            });
        }
        let stream;
        try { if (constraints && constraints.audio) Core.lastGUM = { tuned, original }; } catch (_e) {}
        try {
            stream = await nativeGUM(tuned);
        } catch(e) {
            // FIX: the old fallback used {audio:true}, which DROPPED the selected
            // device and could silently switch you off your headset mic.
            stream = await nativeGUM(original);
        }
        try {
            return await Core.inject(stream);
        } catch(e) {
            // FIX: if injection fails — including a mic that disconnected
            // mid-build (getAudioTracks() returns empty, or createMediaStream-
            // Source throws on an already-ended track) — tear down whatever
            // partial graph Core.inject managed to construct before the throw,
            // so the next getUserMedia call starts clean instead of stacking
            // dead nodes that eventually crash the AudioContext outright.
            console.warn('[ツcore] inject failed, passing raw stream:', e);
            // Never stop the raw stream here: we're about to hand it to Discord as-is.
            try { Core.rawStream = null; Core.source = null; Core.teardown && Core.teardown(); } catch(e2) {}
            return stream;
        }
    };


    // ─── v3.17.0 watchdog: keeps voice + song alive through mute / unmute / disconnect / room change ───
    setInterval(() => {
        try {
            const ctx = _pinnedCtx;
            if (!ctx || ctx.state === 'closed' || !Core.dest) return;
            const out = Core.dest.stream.getAudioTracks()[0];
            if (!out || out.readyState === 'ended') return;            // Discord left the room: it will call getUserMedia again when you rejoin
            if (ctx.state !== 'running') { ctx.resume().catch(() => {}); return; }
            const t = Core.micTrack;
            if (t && t.readyState === 'ended') { if (!Core._healing && !Core._healTimer) Core.heal('watchdog: mic ended'); }
            else if (t && t.muted) {                                    // system mute that never comes back
                Core._mutedFor = (Core._mutedFor || 0) + 2;
                if (Core._mutedFor >= 8 && !Core._healing) { Core._mutedFor = 0; Core.heal('watchdog: mic muted too long', true); }
            } else Core._mutedFor = 0;
        } catch (_e) {}
    }, 2000);
    try {   // headset plugged / unplugged -> try to reconnect right away if the mic was lost
        navigator.mediaDevices.addEventListener('devicechange', () => {
            try { if (Core._micLost) setTimeout(() => Core.heal('devicechange'), 600); } catch (_e) {}
        });
    } catch (_e) {}

    // ─── v3.18.0 VOICE CHECK every 5 seconds ─────────────────────────────────────────
    // 1) is the mic track alive / un-muted / really delivering sound?  2) is the audio context running?
    // 3) is Discord's own connection actually SENDING our voice (RTCPeerConnection outbound-rtp packets grow)?
    // Anything wrong -> reconnect the mic by itself (Core.heal), with a back-off so it never spams.
    try {   // remember Discord's peer connections so we can look at their send stats (subclass: nothing else changes)
        const NativePC = window.RTCPeerConnection;
        if (NativePC && !NativePC.__n7rWrapped) {
            const pcs = (window.__n7rPCs = window.__n7rPCs || []);
            class N7rPC extends NativePC { constructor(...a) { super(...a); try { pcs.push(this); } catch (_e) {} } }
            N7rPC.__n7rWrapped = true;
            window.RTCPeerConnection = N7rPC;
        }
    } catch (_e) {}
    const VoiceCheck = {
        an: null, buf: null, srcFor: null, win: 0, quiet: 0, lastBytes: -1, stalls: 0, backoff: 0, lastHeal: 0, deadHeals: 0,
        sample() {          // called ~7x per second: peak of the raw mic signal
            try {
                const ctx = _pinnedCtx;
                if (!ctx || ctx.state !== 'running' || !Core.source) return;
                if (!this.an || this.an.context !== ctx) { this.an = ctx.createAnalyser(); this.an.fftSize = 2048; this.buf = new Float32Array(2048); this.srcFor = null; }
                if (this.srcFor !== Core.source) { try { Core.source.connect(this.an); this.srcFor = Core.source; } catch (_e) { return; } }
                this.an.getFloatTimeDomainData(this.buf);
                let m = 0; for (let i = 0; i < this.buf.length; i++) { const a = this.buf[i] < 0 ? -this.buf[i] : this.buf[i]; if (a > m) m = a; }
                if (m > this.win) this.win = m;
            } catch (_e) {}
        },
        async sendStats() {  // bytes Discord has sent for OUR audio (null = cannot tell)
            try {
                const pcs = (window.__n7rPCs || []).filter(pc => pc.connectionState !== 'closed' && pc.connectionState !== 'failed');
                let best = null;
                for (const pc of pcs) {
                    const rep = await pc.getStats();
                    rep.forEach(r => { if (r.type === 'outbound-rtp' && (r.kind === 'audio' || r.mediaType === 'audio') && r.bytesSent != null) best = Math.max(best == null ? 0 : best, r.bytesSent); });
                }
                return best;
            } catch (_e) { return null; }
        },
        async check() {
            try {
                const ctx = _pinnedCtx;
                if (!ctx || ctx.state === 'closed' || !Core.dest) { this.win = 0; return; }
                const out = Core.dest.stream.getAudioTracks()[0];
                if (!out || out.readyState === 'ended') { this.win = 0; return; }   // not in a voice channel
                if (ctx.state !== 'running') { try { await ctx.resume(); } catch (_e) {} this.win = 0; return; }
                const peak = this.win; this.win = 0;
                const t = Core.micTrack;
                let why = '';
                if (!t || t.readyState === 'ended') why = 'mic ended';
                else if (Core._micLost) why = 'mic lost';
                else if (!t.muted && t.enabled !== false && peak === 0) { this.quiet++; if (this.quiet >= 2) why = 'mic silent 10s'; }   // a live mic is never *exactly* 0 for 10 s
                else this.quiet = 0;
                // is Discord's connection really sending? only judged while you are actually talking
                const bytes = await this.sendStats();
                if (!why && bytes != null) {
                    if (peak > 0.03 && this.lastBytes >= 0 && bytes <= this.lastBytes) { this.stalls++; if (this.stalls >= 2) why = 'Discord not sending voice'; }
                    else if (peak > 0.03) this.stalls = 0;
                    this.lastBytes = bytes;
                } else if (bytes != null) this.lastBytes = bytes;
                if (!why) { this.deadHeals = 0; this.backoff = 0; return; }
                const now = Date.now();
                if (Core._healing || now - this.lastHeal < this.backoff) return;
                this.lastHeal = now; this.quiet = 0; this.stalls = 0;
                this.deadHeals++;
                this.backoff = Math.min(60000, 5000 * this.deadHeals);   // 5s, 10s, 15s ... max 60s between auto-reconnects
                console.warn('[ツcore] voice check: ' + why + ' -> reconnecting mic');
                await Core.heal('voice check: ' + why, true);
            } catch (_e) {}
        }
    };
    setInterval(() => VoiceCheck.sample(), 300);
    setInterval(() => { VoiceCheck.check(); }, 5000);
    try {   // network back / tab visible again / window focused -> check right away
        const quick = () => setTimeout(() => { VoiceCheck.backoff = 0; VoiceCheck.check(); }, 700);
        window.addEventListener('online', quick);
        window.addEventListener('focus', quick);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) quick(); });
    } catch (_e) {}

    // ─── VU meter ────────────────────────────────────────────────────────
    let vuPeak = 0;
    let musicScrubbing = false;
    let uiVisible = false, lastFrameTime = 0;
    const FRAME = 1000 / 30;

    // ─── Slider builder ───────────────────────────────────────────────────
    function sl(id, label, min, max, def, fmt, rebuild=false, step=null) {
        const stepA = step != null ? `step="${step}"` : '';
        return `<div class="n7r-srow">
  <span class="n7r-slbl">${label}</span>
  <input type="range" class="n7r-slider" id="n7r-${id}" min="${min}" max="${max}" value="${def}" ${stepA}>
  <span class="n7r-sval" id="n7r-v-${id}">—</span>
</div>`;
    }

    // ─── UI ──────────────────────────────────────────────────────────────
    const UI = {
        panel:null, button:null, quickBar:null,

        init() {
            this.applyTheme(PARAMS.theme);
            this.injectCSS();
            this.createButton();
            this.createPanel();
            this.createQuickBar();
            this.bindEvents();
            this.bindEAX();
            (function(){ const t0 = Date.now(); setInterval(() => { const el = document.getElementById('n7r-lcd'); if (!el || !uiVisible) return; const x = Math.floor((Date.now()-(window.__N7R_REC_T0__||t0))/1000), p = n => String(n).padStart(2,'0'); el.textContent = p(Math.floor(x/3600))+':'+p(Math.floor(x/60)%60)+':'+p(x%60); }, 1000); })();
            requestAnimationFrame(function loop(ts){
                if (uiVisible && ts - lastFrameTime > FRAME) {
                    UI.drawSpectrum(); UI.drawEQ(); UI.updateStats(); UI.updateVU(); UI.updateMusicProgress(); lastFrameTime = ts;
                }
                requestAnimationFrame(loop);
            });
            document.addEventListener('keydown', e => {
                if (e.altKey && e.key === 'e') { e.preventDefault(); this.togglePanel(); }
            });
        },

        createButton() {
            this.button = document.createElement('div');
            this.button.id = 'n7r-btn';
            this.button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg><span class="n7r-label">ツcore</span>`;
            document.body.appendChild(this.button);
            this.makeDraggable(this.button, this.button);
        },

        createQuickBar() {
            this.quickBar = document.createElement('div');
            this.quickBar.id = 'n7r-quickbar';
            this.quickBar.innerHTML = `
                <button class="qb-btn" data-action="miconly" title="Mic Only">🎯</button>
                <button class="qb-btn" data-action="mute" title="Mute/Unmute">🔇</button>
                <button class="qb-btn" data-action="god" title="God Mode">👑</button>
                <button class="qb-btn" data-action="listen" title="Self Listen (hear yourself)">👂</button>
                <button class="qb-btn" data-action="save" title="Save Preset">💾</button>
                <button class="qb-btn" data-action="picture" title="Change picture (add your own image)">🖼</button>
                <button class="qb-btn" data-action="reconnect" title="Reconnect mic / fix audio now">🔄</button>
            `;
            document.body.appendChild(this.quickBar);
            this.makeDraggable(this.quickBar, this.quickBar);
        },

        createPanel() {
            this.panel = document.createElement('div');
            this.panel.id = 'n7r-panel';
            this.panel.style.display = 'none';
            this.panel.innerHTML = `
<div class="n7r-header" id="n7r-header">
  <div class="n7r-hL">
    <img class="n7r-gojo" src="${GIF_GOJO}" onerror="this.style.display='none'">
    <div class="n7r-logo"><span class="n7r-logo-main">ツcore</span><span class="n7r-logo-adv">ADVANCED <i>HD</i></span></div>
    <div class="n7r-console">CONSOLE</div>
  </div>
  <div class="n7r-hdev"><select id="n7r-hdrDev" class="n7r-select" disabled><option id="n7r-hdrDevOpt">SB Live! 24-bit External</option></select></div>
  <div class="n7r-hR">
    <span class="n7r-status-badge" id="n7r-status" title="Status">●</span>
    <button class="n7r-hbtn n7r-hq" id="n7r-help" title="Help">?<i>▾</i></button>
    <button class="n7r-hbtn n7r-hmin" id="n7r-min" title="Minimize">—</button>
    <button class="n7r-close" id="n7r-close">✕</button>
  </div>
</div>
<div class="n7r-vu-wrap"><div class="n7r-vu-bar" id="n7r-vu-bar"></div></div>
<div class="n7r-tabs">
  <button class="n7r-tarrow" id="n7r-tl" title="Previous page">◀</button>
  <button class="n7r-tabbar" id="n7r-tabbar" title="Pick a page"><span class="n7r-tbico"></span><span id="n7r-tabbar-name">Effects</span></button>
  <div class="n7r-tabscroll" id="n7r-tabscroll">
    <button class="n7r-tab active" data-tab="eax"><span class="n7r-ti">🎛️</span>Effects</button>
    <button class="n7r-tab" data-tab="kar"><span class="n7r-ti">🎤</span>Karaoke</button>
    <button class="n7r-tab" data-tab="cmss"><span class="n7r-ti">🌐</span>CMSS 3D</button>
    <button class="n7r-tab" data-tab="thx"><span class="n7r-ti">🎬</span>THX Setup</button>
    <button class="n7r-tab" data-tab="spk"><span class="n7r-ti">🔲</span>Speakers</button>
    <button class="n7r-tab" data-tab="mix"><span class="n7r-ti">🎚️</span>Surround Mixer</button>
    <button class="n7r-tab" data-tab="skin"><span class="n7r-ti">🖼️</span>EAX Windows</button>
    <button class="n7r-tab" data-tab="clean"><span class="n7r-ti">🧹</span>Clean-up</button>
    <button class="n7r-tab" data-tab="eqz"><span class="n7r-ti">🎚️</span>Tone</button>
    <button class="n7r-tab" data-tab="gain"><span class="n7r-ti">🔊</span>Gain</button>
    <button class="n7r-tab" data-tab="fx"><span class="n7r-ti">⚡</span>FX</button>
    <button class="n7r-tab" data-tab="music"><span class="n7r-ti">🎵</span>Music</button>
    <button class="n7r-tab" data-tab="voice"><span class="n7r-ti">🎭</span>Voice</button>
    <button class="n7r-tab" data-tab="pre"><span class="n7r-ti">💾</span>Presets</button>
    <button class="n7r-tab" data-tab="stats"><span class="n7r-ti">📊</span>Stats</button>
    <button class="n7r-tab" data-tab="credits"><span class="n7r-ti">ℹ️</span>Credits</button>
  </div>
  <button class="n7r-tarrow" id="n7r-tr" title="Next page">▶</button>
  <div class="n7r-tabmenu" id="n7r-tabmenu" style="display:none"></div>
</div>
<div class="n7r-body">

  <!-- EFFECTS TAB -->
  <div class="n7r-tc active" data-tab="eax">
    <div class="n7r-pad">
      <p class="n7r-desc">Audio Effects are high quality music enhancement effects created by the powerful audio engine in your sound device.</p>
      <div class="n7r-chkrow"><label class="n7r-tog"><input type="checkbox" id="n7r-eaxOn" checked><span class="n7r-tslide"></span></label><span>Enable Audio Effects</span></div>
      <div class="n7r-eaxbox" id="n7r-eaxbox">
        <div class="n7r-eaxcols">
          <div class="n7r-ecol n7r-ecol-env">Environment</div>
          <div class="n7r-ecol n7r-ecol-mid">
            <div class="n7r-elbl">Active Preset</div>
            <div class="n7r-eactive" id="n7r-eaxActive">None</div>
            <ul class="n7r-elist" id="n7r-eaxList">
              ${EAX_LIST.map(k=>`<li data-env="${k}">${k}</li>`).join('')}
            </ul>
          </div>
          <div class="n7r-ecol n7r-ecol-amt">
            <div class="n7r-elbl">Effects Amount <span class="n7r-eval" id="n7r-eaxAmtVal">0</span></div>
            <div class="n7r-eamt"><span>0</span><input type="range" class="n7r-slider" id="n7r-eaxAmount" min="0" max="100" value="0"><span>100</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="n7r-sec">
      <div class="n7r-section-title">REVERB FINE-TUNE</div>
      ${sl('reverb','MIX',0,100,0,v=>`${v}%`)}
      ${sl('reverbDecay','DECAY',0.1,20,2.5,v=>`${parseFloat(v).toFixed(1)}s`,true,0.1)}
      <div class="n7r-tog-row">
        <span>MEGA REVERB 🌊 — cathedral mode</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-megaReverb"><span class="n7r-tslide"></span></label>
      </div>
      <div class="n7r-hint">MEGA: decay up to 20s, denser tail — sounds like a massive hall.</div>
    </div>
  </div>

  <!-- KARAOKE TAB -->
  <div class="n7r-tc" data-tab="kar">
    <div class="n7r-pad">
      <p class="n7r-desc">Karaoke removes the lead vocals from the song you are playing so you can sing over it. Load a song in the Music tab first.</p>
      <div class="n7r-chkrow"><label class="n7r-tog"><input type="checkbox" id="n7r-karOn"><span class="n7r-tslide"></span></label><span>Enable Vocal Remover</span></div>
    </div>
    <div class="n7r-sec">
      ${sl('karAmount','VOCAL REMOVER',0,100,0,v=>`${v}%`)}
      <div class="n7r-hint">Cancels whatever is centred in the stereo mix (usually the singer). 100% = strongest removal. Bass and kick can get thinner at high values. Works on mono files only as a pass-through.</div>
    </div>
  </div>

  <!-- CMSS 3D TAB -->
  <div class="n7r-tc" data-tab="cmss">
    <div class="n7r-pad">
      <p class="n7r-desc">CMSS 3D spreads your voice and music across the stereo field for a wider, more immersive sound.</p>
      <div class="n7r-row-label">MODE</div>
      <select id="n7r-cmss" class="n7r-select">
        ${Object.keys(CMSS_MODES).map(k=>`<option value="${k}">${k}</option>`).join('')}<option value="Custom">Custom</option>
      </select>
    </div>
    <div class="n7r-sec">
      ${sl('width','STEREO WIDTH',0,100,0,v=>`${v}%`)}
      ${sl('pan','PAN',-100,100,0,v=>+v===0?'C':+v<0?'L'+Math.abs(+v):'R'+ +v)}
    </div>
  </div>

  <!-- THX SETUP TAB -->
  <div class="n7r-tc" data-tab="thx">
    <div class="n7r-pad">
      <p class="n7r-desc">THX Setup Console: one-click listening modes. Each mode sets stereo width and the 9-band equalizer together.</p>
      <div class="n7r-row-label">DEVICE</div>
      <select id="n7r-thxDev" class="n7r-select"><option>SB Live! 24 bit External</option><option>SB Live! 64 bit External</option></select>
      <div class="n7r-row-label" style="margin-top:10px">THX MODE</div>
      <div class="n7r-thxgrid" id="n7r-thxgrid">${Object.keys(THX_PRESETS).map(k=>`<button class="n7r-thxb${k==='Off'?' on':''}" data-thx="${k}">${k}</button>`).join('')}</div>
    </div>
    <div class="n7r-sec">
      ${sl('thxAmt','THX AMOUNT',0,100,100,v=>`${v}%`)}
    </div>
  </div>

  <!-- SPEAKER SETTINGS TAB -->
  <div class="n7r-tc" data-tab="spk">
    <div class="n7r-pad">
      <p class="n7r-desc">Speaker Settings: pick a layout, then tap the squares to switch each speaker on or off. The sound is folded down to stereo, so rear speakers widen the image and side balance pans it.</p>
      <div class="n7r-row-label">LAYOUT</div>
      <select id="n7r-spkLayout" class="n7r-select">${Object.keys(SPK_LAYOUTS).map(k=>`<option value="${k}">${k}</option>`).join('')}</select>
      <div class="n7r-spkgrid" id="n7r-spkgrid"></div>
      <div class="n7r-hint" id="n7r-spkInfo">All speakers on.</div>
    </div>
  </div>

  <!-- SURROUND MIXER TAB -->
  <div class="n7r-tc" data-tab="mix">
    <div class="n7r-pad">
      <p class="n7r-desc">Surround Mixer: balance the front, centre, surround, sub and rear ambience.</p>
    </div>
    <div class="n7r-sec">
      ${sl('mxPan','FRONT BALANCE',-100,100,0,v=>+v===0?'C':+v<0?'L'+Math.abs(+v):'R'+ +v)}
      ${sl('mxCen','CENTER',0,100,50,v=>`${v}`)}
      ${sl('mxSur','SURROUND',0,100,0,v=>`${v}%`)}
      ${sl('mxSub','SUBWOOFER',0,100,50,v=>`${v}`)}
      ${sl('mxRear','REAR AMBIENCE',0,100,0,v=>`${v}%`)}
      <button class="n7r-thxb" id="n7r-mxReset" style="margin-top:8px">Reset mixer</button>
    </div>
  </div>

  <!-- EXE SKIN LAUNCHER TAB -->
  <div class="n7r-tc" data-tab="skin">
    <div class="n7r-pad">
      <p class="n7r-desc">The original EAX Console windows (artwork taken from the exe). Tap one to open it; drag it by its title bar, close it with the X.</p>
      <div class="n7r-thxgrid" id="n7r-skingrid">
        <button class="n7r-thxb" data-skin="effects">EAX Console</button>
        <button class="n7r-thxb" data-skin="eq">Graphic EQ</button>
        <button class="n7r-thxb" data-skin="mixer">Surround Mixer</button>
        <button class="n7r-thxb" data-skin="speaker">Speaker Settings</button>
        <button class="n7r-thxb" data-skin="thx">THX Setup</button>
        <button class="n7r-thxb" data-skin="cmss">CMSS 3D</button>
        <button class="n7r-thxb" data-skin="cleanup">Clean-up</button>
        <button class="n7r-thxb" data-skin="time">Time Scaling</button>
      </div>
    </div>
  </div>

  <!-- CLEAN-UP TAB -->
  <div class="n7r-tc" data-tab="clean">
    <div class="n7r-pad">
      <p class="n7r-desc">Clean-up removes noise and background sound so only your voice goes out.</p>
      <div class="n7r-chkrow"><label class="n7r-tog"><input type="checkbox" id="n7r-cleanVoice" checked><span class="n7r-tslide"></span></label><span>Clean voice (browser noise suppression)</span></div>
      <div class="n7r-hint">Applies the next time you join voice.</div>
    </div>
    <div class="n7r-sec">
      <div class="n7r-section-title">MIC &amp; DYNAMICS</div>
      <div class="n7r-tog-row" style="background:rgba(0,255,170,.08);border-radius:6px;padding:6px 8px;">
        <span>🎯 MIC ONLY — friend's voice OUT of your mic</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-miconly"><span class="n7r-tslide"></span></label>
      </div>
      <div class="n7r-hint">ON = only YOUR voice is sent. Turn ON, then join voice. Lower speaker = cleaner. Headphones = perfect.</div>
      <div class="n7r-tog-row" style="background:rgba(255,180,0,.08);border-radius:6px;padding:6px 8px;margin-top:6px;">
        <span>🛡 VOICE PROTECT — keep voice clean at extreme gain</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-gainProtect" checked><span class="n7r-tslide"></span></label>
      </div>
      <div class="n7r-hint">ON = multi-stage soft limiter preserves voice texture at x10-x20+ gain. OFF = raw clip (louder but harsher).</div>
      ${sl('noiseReduction','NOISE REDUCE',0,100,0,v=>`${v}%`)}
      <div class="n7r-tog-row">
        <span>NOISE GATE</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-gate"><span class="n7r-tslide"></span></label>
      </div>
      ${sl('gateThreshold','GATE THRESH',-60,0,-60,v=>`${v} dB`)}
      <div class="n7r-tog-row">
        <span>DUCKING</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-duck"><span class="n7r-tslide"></span></label>
      </div>
      ${sl('duckingReduction','DUCK AMOUNT',1,20,10,v=>`${v} dB`)}
    </div>
  </div>

  <!-- EQUALIZER TAB -->
  <div class="n7r-tc" data-tab="eqz">
    <div class="n7r-eqwin" id="n7r-eqwin">
      <div class="n7r-eqhead">
        <span class="n7r-eqwt">Graphic Equalizer</span>
        <select id="n7r-eqDev" class="n7r-select" disabled><option id="n7r-eqDevOpt">SB Live! 24-bit External</option></select>
        <span class="n7r-eqwb"><button class="n7r-eqwbtn q" id="n7r-eqHelp" title="Help">?</button><button class="n7r-eqwbtn" id="n7r-eqReset" title="Minimize"></button><button class="n7r-eqwbtn x" id="n7r-eqClose" title="Back to Effects">X</button></span>
      </div>
      <div class="n7r-eqtitle">Equalizer</div>
      <div class="n7r-eqen">
        <label class="n7r-eqchk"><input type="checkbox" id="n7r-eqOn" checked> Enable Equalizer</label>
        <span class="n7r-eqprel">Presets</span>
        <select id="n7r-eqPreset" class="n7r-select"></select>
        <button class="n7r-eqibtn" id="n7r-eqSave" title="Save preset">💾</button>
        <button class="n7r-eqibtn" id="n7r-eqDel" title="Delete preset">✖</button>
      </div>
      <div class="n7r-eqsliders">
        ${EQ_LABELS.map((l,i)=>`<div class="n7r-eqb"><span class="n7r-eqtop">24dB</span><div class="n7r-eqtrk"><input type="range" class="n7r-vslider" id="n7r-eqb${i}" min="-24" max="24" step="0.5" value="0"></div><span class="n7r-eql">${l}</span></div>`).join('')}
        <div class="n7r-eqb n7r-eqlv">
          <span class="n7r-eqtop" id="n7r-eqLevelVal">0dB</span>
          <div class="n7r-eqtrk"><input type="range" class="n7r-vslider" id="n7r-eqLevel" min="-24" max="24" step="0.5" value="0"></div>
          <span class="n7r-eql n7r-eqlow">-24dB</span>
        </div>
      </div>
    </div>
    <div class="n7r-vis"><canvas id="n7r-eq" width="330" height="60"></canvas></div>
    <div class="n7r-sec">
      <div class="n7r-section-title">TONE</div>
      ${sl('eqBass','BASS',0,100,50,v=>`${Math.round((v-50)*0.24)} dB`)}
      ${sl('eqMid','MID',0,100,50,v=>`${Math.round((v-50)*0.24)} dB`)}
      ${sl('eqTreble','TREBLE',0,100,50,v=>`${Math.round((v-50)*0.24)} dB`)}
      ${sl('airAmount','AIR',0,100,0,v=>`${v}%`)}
    </div>
  </div>

  <!-- GAIN TAB -->
  <div class="n7r-tc active" data-tab="gain">
    <div class="n7r-vis"><canvas id="n7r-spec" width="330" height="36"></canvas></div>
    <div class="n7r-sec">
      ${sl('masterGain','MASTER GAIN',0,600,0,v=>`+${v} dB`)}
      ${sl('gain2','GAIN 2',0,600,0,v=>`+${v} dB`)}
      ${sl('gain3','GAIN 3',0,600,0,v=>`+${v} dB`)}
      ${sl('inputBoost','INPUT BOOST',0,600,0,v=>`+${v} dB`)}
      ${sl('pitch','PITCH SHIFT',0,100,50,v=>`${Math.round((v-50)*2)}%`)}
    </div>
    <div class="n7r-sec">
      <div class="n7r-row-label">VOICE PROFILE</div>
      <div class="n7r-selrow">
        <select id="n7r-vp" class="n7r-select">
          ${Object.keys(VOICE_PROFILES).map(k=>`<option value="${k}">${k}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="n7r-sec">
      <div class="n7r-tog-row">
        <span>GOD MODE 👑 — SB490 كرت فضي</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-god"><span class="n7r-tslide"></span></label>
      </div>
    </div>
    <div class="n7r-sec">
      ${sl('tafleh','تفله 💦',0,100,0,v=>`${v}%`)}
      <div class="n7r-hint">TALL SPIT ECHO — حرّك الشريط عشان تتحكم بقوة التفله (0 = طافي، 100 = أقوى شي، صدى تقيل ومرررة قوي).</div>
    </div>
    <div class="n7r-sep"></div>
    <div class="n7r-sec">
      <div class="n7r-section-title">🎧 SELF LISTEN</div>
      <div class="n7r-tog-row" style="background:rgba(0,200,255,.08);border-radius:6px;padding:6px 8px;">
        <span>👂 HEAR YOURSELF — processed voice + music in your speakers</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-selfListen"><span class="n7r-tslide"></span></label>
      </div>
      ${sl('selfListenVolume','LISTEN VOL',0,500,80,v=>`${v}%`)}
      <div class="n7r-hint">Join a voice channel first. Hear your boosted voice + music exactly as Discord sends it. Use headphones or enable Mic Only to avoid feedback.</div>
    </div>
  </div>

  <!-- FX TAB -->
  <div class="n7r-tc" data-tab="fx">
    <div class="n7r-sec">
      <div class="n7r-section-title">SATURATION</div>
      ${sl('distortion','AMOUNT',0,100,0,v=>`${v}%`)}
      <div class="n7r-tog-row">
        <span>DUYANH MODE ⚡</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-satmode"><span class="n7r-tslide"></span></label>
      </div>
      <div class="n7r-hint">OFF = Lucac (tanh/soft) | ON = Duyanh (arctan/hardclip)</div>
    </div>
    <div class="n7r-sep"></div>
    <div class="n7r-sec">
      <div class="n7r-section-title">AUTOTUNE</div>
      <div class="n7r-tog-row">
        <span>AUTOTUNE 🎵</span>
        <label class="n7r-tog"><input type="checkbox" id="n7r-at"><span class="n7r-tslide"></span></label>
      </div>
      ${sl('autotuneSpeed','SPEED',0.05,1,0.3,v=>`${(v*100).toFixed(0)}%`,false,0.05)}
    </div>
  </div>

  <!-- MUSIC TAB -->
  <div class="n7r-tc" data-tab="music">
    <div class="n7r-sec">
      <div class="n7r-section-title">🎵 MUSIC TO MIC</div>
      <div id="n7r-music-status" class="n7r-music-status-bar">
        <span id="n7r-music-dot">⏸</span>
        <span id="n7r-music-info" class="n7r-music-info-text">No file loaded...</span>
      </div>
      <div class="n7r-music-progress-wrap">
        <span id="n7r-music-time-cur" class="n7r-music-time">0:00</span>
        <div id="n7r-music-progress-bar" class="n7r-music-progress-bar">
          <div id="n7r-music-progress-fill" class="n7r-music-progress-fill"></div>
          <div id="n7r-music-progress-handle" class="n7r-music-progress-handle"></div>
        </div>
        <span id="n7r-music-time-dur" class="n7r-music-time">0:00</span>
      </div>
      <div class="n7r-music-btns">
        <button id="n7r-music-select" class="n7r-mbtn">📁 Load File</button>
        <button id="n7r-music-play" class="n7r-mbtn n7r-mbtn-play" disabled>▶ Play</button>
        <button id="n7r-music-stop" class="n7r-mbtn n7r-mbtn-stop" disabled>⏹ Stop</button>
        <input type="file" id="n7r-music-input" accept=".mp3,.wav,.flac,.ogg,.aac,.m4a,.opus" style="display:none">
      </div>
      <button id="n7r-music-max" class="n7r-mbtn n7r-max-btn">🔥 MAX MUSIC</button>
      ${sl('musicVolume','MUSIC VOLUME',0,8,1.2,v=>`${Math.round(v*100)}%`,false,0.01)}
      ${sl('musicReverb','MUSIC REVERB',0,100,70,v=>`${v}%`)}
      <div class="n7r-hint">Music runs its own clean chain (Bass + Presence EQ → Compressor → Reverb mix) — loud and clear, no gate chopping. 🔥 MAX MUSIC makes it hit HARD. Join a voice channel first!</div>
    </div>
  </div>

  <!-- PRESETS TAB -->
  <div class="n7r-tc" data-tab="voice">
    <div class="n7r-sec">
      <div class="n7r-section-title">🎭 VOICE CHANGER</div>
      <div class="n7r-vgrid">
        ${Object.keys(VOICE_FX).map(n=>`<button class="n7r-vbtn" data-voice="${n}"><span class="n7r-vico">${VOICE_FX[n].icon}</span><span>${n}</span></button>`).join('')}
      </div>
      <div class="n7r-hint">Tap a voice to change how you sound. It only touches pitch / EQ / FX — your gain stays as you set it. Tap Normal to go back. Tweak the PITCH slider in GAIN for fine control. Join voice first.</div>
    </div>
  </div>
  <div class="n7r-tc" data-tab="pre">
    <div class="n7r-pgrid">
      ${Object.keys(PRESETS).map(n=>`<button class="n7r-pbtn" data-preset="${n}">${n}</button>`).join('')}
    </div>
    <div class="n7r-sel-wrap">
      <div class="n7r-row-label">THEME</div>
      <select id="n7r-theme" class="n7r-select">
        ${Object.keys(THEMES).map(t=>`<option value="${t}">${t}</option>`).join('')}
      </select>
    </div>
    <div class="n7r-pfooter">
      <button class="n7r-abtn" id="n7r-save">💾 Save</button>
      <button class="n7r-abtn" id="n7r-reset">↺ Reset</button>
    </div>
  </div>

  <!-- STATS TAB -->
  <div class="n7r-tc" data-tab="stats">
    <div class="n7r-stats-box">
      <div class="n7r-section-title">📊 VOICE STATS</div>
      <div id="n7r-stats">–</div>
      <button class="n7r-abtn" id="n7r-sreset">Reset Stats</button>
    </div>
  </div>

  <!-- CREDITS TAB -->
  <div class="n7r-tc" data-tab="credits">
    <div class="n7r-credits">
      <img class="n7r-gojo n7r-credits-gif" src="${GIF_GOJO}" onerror="this.style.display='none'">
      <div class="n7r-credits-title">ツcore</div>
      <div class="n7r-row-label">MADE BY</div>
      <div class="n7r-credits-name">ツ <span class="n7r-credits-alt">/ __518_</span></div>
      <div class="n7r-row-label">GROUP</div>
      <div class="n7r-credits-name">C0za</div>
      <a class="n7r-credits-btn" href="https://discord.gg/tq8zT463yq" target="_blank" rel="noopener">💬 Join C0za on Discord</a>
      <div class="n7r-credits-ver">v3.9.2 — console look matched to screenshots, 7-band EQ, environments, karaoke, CMSS, clean-up, recorder</div>
    </div>
  </div>

</div>
<div class="n7r-footer">
  <div class="n7r-frow1">
    <button class="n7r-fb n7r-fb-round" id="n7r-fb-mute" title="Mute / Unmute">🔇</button>
    <span class="n7r-lcd" id="n7r-lcd">00:00:00</span>
    <button class="n7r-fb n7r-fb-rec" id="n7r-fb-rec" title="Record processed output"><b>●</b> REC<small>▾</small></button>
    <button class="n7r-fb" id="n7r-fb-prev" title="Back 10s">⏮</button>
    <button class="n7r-fb n7r-fb-play" id="n7r-fb-play" title="Play music">▶</button>
    <button class="n7r-fb" id="n7r-fb-stop" title="Stop music">⏹</button>
    <button class="n7r-fb" id="n7r-fb-next" title="Forward 10s">⏭</button>
  </div>
  <div class="n7r-frow2">
    <button class="n7r-fpill" id="n7r-fb-profile" title="Current profile">Default</button>
    <button class="n7r-fi" data-open="eq" title="Graphic Equalizer"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3a3a3a" stroke-width="1.4"><path d="M4 2v14M9 2v14M14 2v14"/><rect x="2" y="5" width="4" height="3" fill="#fff"/><rect x="7" y="10" width="4" height="3" fill="#fff"/><rect x="12" y="4" width="4" height="3" fill="#fff"/></svg></button>
    <button class="n7r-fi" data-goto="eax" title="Effects"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3a3a3a" stroke-width="1.4"><ellipse cx="9" cy="9" rx="7" ry="5.5" fill="#fff" transform="rotate(-30 9 9)"/><path d="M3 11c4-1 8-5 12-5"/></svg></button>
    <button class="n7r-fi" data-goto="cmss" title="CMSS 3D"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3a3a3a" stroke-width="1.4"><ellipse cx="8" cy="10" rx="6.5" ry="5" fill="#fff" transform="rotate(-30 8 10)"/><path d="M14 1v6M11 4h6"/></svg></button>
    <button class="n7r-fi" id="n7r-fi-more" title="Recorder / transport"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#3a3a3a" stroke-width="1.4"><rect x="2" y="2" width="14" height="14" fill="#fff"/><path d="M5 6h8M5 9h8M5 12h8"/></svg></button>
    <span class="n7r-brand" title="by ツ / __518_ — C0za">ツCORE</span>
  </div>
</div>`;
            document.body.appendChild(this.panel);
            this.makeDraggable(this.panel.querySelector('#n7r-header'), this.panel);
            this.eqPanel = document.createElement('div');
            this.eqPanel.id = 'n7r-eqpanel';
            this.eqPanel.style.display = 'none';
            this.eqPanel.appendChild(this.panel.querySelector('#n7r-eqwin'));
            document.body.appendChild(this.eqPanel);
            this.makeDraggable(this.eqPanel.querySelector('.n7r-eqhead'), this.eqPanel);
        },

        injectCSS() {
            const s = document.createElement('style');
            s.textContent = `
#n7r-btn{position:fixed;top:20px;right:20px;background:#0a0a0a;border:1px solid rgba(255,255,255,.2);border-radius:30px;padding:8px 16px;display:flex;align-items:center;gap:8px;color:#fff;font:600 12px 'Segoe UI',sans-serif;cursor:pointer;z-index:999999;box-shadow:0 4px 20px rgba(0,0,0,.8);backdrop-filter:blur(10px);transition:all .2s;user-select:none;}
#n7r-btn:hover{border-color:rgba(255,255,255,.4);transform:translateY(-1px);}
#n7r-btn.active{border-color:rgba(255,255,255,.5);}
.n7r-label{letter-spacing:.03em;}
#n7r-quickbar{position:fixed;bottom:20px;right:20px;background:#0a0a0a;border:1px solid rgba(255,255,255,.15);border-radius:40px;padding:8px;display:flex;gap:5px;z-index:999998;backdrop-filter:blur(10px);user-select:none;}
.qb-btn{width:38px;height:38px;border:1px solid rgba(255,255,255,.15);background:transparent;border-radius:50%;color:#fff;font-size:18px;cursor:pointer;transition:all .2s;}
.qb-btn:hover{background:rgba(255,255,255,.1);}
.qb-btn.active{background:rgba(0,255,170,.2);border-color:rgba(0,255,170,.5);}
#n7r-panel{position:fixed;top:70px;right:20px;width:380px;background:#0a0a0a;border:1px solid rgba(255,255,255,.14);border-radius:14px;color:#fff;font:400 12px 'Segoe UI',sans-serif;z-index:999999;box-shadow:0 20px 60px rgba(0,0,0,.9);backdrop-filter:blur(20px);overflow:hidden;}
.n7r-header{padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center;cursor:move;background:#0e0e0e;user-select:none;}
.n7r-hL{display:flex;align-items:center;gap:10px;}
.n7r-gojo{height:44px;width:44px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,.15);}
.n7r-title{font:700 16px 'Segoe UI',sans-serif;letter-spacing:-.01em;}
.n7r-subtitle{font-size:9px;color:rgba(255,255,255,.4);letter-spacing:.08em;margin-top:2px;}
.n7r-hR{display:flex;align-items:center;gap:8px;}
.n7r-status-badge{font-size:10px;color:#444;transition:color .3s;}
.n7r-status-badge.active{color:#0f0;text-shadow:0 0 6px #0f0;}
.n7r-status-badge.basic{color:#fa0;text-shadow:0 0 6px #fa0;}
.n7r-close{background:none;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:4px 8px;color:#888;cursor:pointer;font-size:13px;}
.n7r-close:hover{border-color:#f44;color:#f44;}
.n7r-vu-wrap{height:3px;background:#111;overflow:hidden;}
.n7r-vu-bar{height:100%;width:0%;background:linear-gradient(90deg,#0f0,#ff0,#f00);transition:width .08s ease-out;}
.n7r-tabs{display:flex;background:#0e0e0e;border-bottom:1px solid rgba(255,255,255,.08);padding:0 6px;}
.n7r-tab{flex:1;padding:10px 4px;background:transparent;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,.35);cursor:pointer;font:600 9px 'Segoe UI',sans-serif;letter-spacing:.06em;transition:all .2s;}
.n7r-tab:hover{color:rgba(255,255,255,.7);}
.n7r-tab.active{color:#fff;border-bottom-color:#fff;background:rgba(255,255,255,.03);}
.n7r-body{max-height:520px;overflow-y:auto;}
.n7r-tc{display:none;} .n7r-tc.active{display:block;}
.n7r-vis{margin:0 14px 12px;border:1px solid rgba(255,255,255,.07);border-radius:8px;overflow:hidden;background:#0a0a0a;padding:6px;}
#n7r-spec{width:100%;height:36px;display:block;}
#n7r-eq{width:100%;height:60px;display:block;}
.n7r-sec{padding:10px 14px 6px;}
.n7r-section-title{font:600 9px 'Segoe UI',sans-serif;letter-spacing:.1em;color:#555;text-transform:uppercase;margin:0 0 10px;}
.n7r-sep{height:1px;background:rgba(255,255,255,.06);margin:4px 14px;}
.n7r-srow{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid rgba(255,255,255,.07);border-radius:10px;margin-bottom:6px;background:#0e0e0e;}
.n7r-slbl{font:600 9px 'Segoe UI',sans-serif;letter-spacing:.06em;color:rgba(255,255,255,.7);min-width:90px;}
.n7r-slider{flex:1;height:3px;background:rgba(255,255,255,.1);border-radius:2px;-webkit-appearance:none;appearance:none;}
.n7r-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:#fff;border-radius:50%;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.5);}
.n7r-slider:disabled{opacity:0.3;cursor:not-allowed;}
.n7r-sval{font:500 10px monospace;color:#666;min-width:48px;text-align:right;}
.n7r-selrow{margin-bottom:10px;}
.n7r-row-label{font:600 9px 'Segoe UI',sans-serif;letter-spacing:.06em;color:#555;margin-bottom:6px;}
.n7r-select{width:100%;padding:6px 8px;background:#111;border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#fff;font-size:11px;}
.n7r-sel-wrap{padding:6px 14px 10px;}
.n7r-tog-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;margin-bottom:4px;font:600 9px 'Segoe UI',sans-serif;letter-spacing:.06em;color:#888;}
.n7r-tog{position:relative;display:inline-block;width:36px;height:18px;}
.n7r-tog input{opacity:0;width:0;height:0;}
.n7r-tslide{position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,.1);border-radius:18px;transition:.2s;}
.n7r-tslide:before{position:absolute;content:"";height:12px;width:12px;left:2px;bottom:2px;background:#555;border-radius:50%;transition:.2s;}
input:checked+.n7r-tslide{background:rgba(255,255,255,.25);}
input:checked+.n7r-tslide:before{background:#fff;transform:translateX(18px);}
.n7r-hint{font-size:9px;color:#444;margin-top:6px;line-height:1.5;}
.n7r-music-status-bar{display:flex;align-items:center;gap:8px;padding:8px;background:#0e0e0e;border:1px solid rgba(255,255,255,.07);border-radius:6px;margin-bottom:8px;}
#n7r-music-dot{font-size:14px;}
.n7r-music-info-text{font:500 10px monospace;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
.n7r-music-progress-wrap{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.n7r-music-time{font:600 9px monospace;color:#666;min-width:28px;text-align:center;user-select:none;}
.n7r-music-progress-bar{position:relative;flex:1;height:6px;background:#161616;border:1px solid rgba(255,255,255,.08);border-radius:4px;cursor:pointer;}
.n7r-music-progress-fill{position:absolute;top:0;left:0;height:100%;width:0%;background:linear-gradient(90deg,#5865f2,#8d7bff);border-radius:4px;pointer-events:none;}
.n7r-music-progress-handle{position:absolute;top:50%;left:0%;width:11px;height:11px;background:#fff;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 4px rgba(0,0,0,.6);pointer-events:none;transition:opacity .15s;opacity:0;}
.n7r-music-progress-bar:hover .n7r-music-progress-handle,.n7r-music-progress-bar.n7r-scrubbing .n7r-music-progress-handle{opacity:1;}
.n7r-music-btns{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
.n7r-mbtn{flex:1;padding:8px;background:#111;border:1px solid rgba(255,255,255,.15);border-radius:6px;color:#fff;font:600 10px 'Segoe UI',sans-serif;cursor:pointer;transition:all .2s;}
.n7r-mbtn:hover:not(:disabled){border-color:rgba(255,255,255,.4);}
.n7r-mbtn:disabled{opacity:0.35;cursor:not-allowed;}
.n7r-mbtn-stop{color:#888;border-color:rgba(255,255,255,.08);}
.n7r-mbtn-play{color:#0f0;border-color:rgba(0,255,0,.2);}
.n7r-max-btn{width:100%;margin-bottom:8px;border-color:rgba(255,80,0,.5);color:#ff8833;background:linear-gradient(135deg,rgba(255,80,0,.15),rgba(255,0,80,.1));}
.n7r-max-btn:hover{border-color:#ff5500;color:#fff;box-shadow:0 0 12px rgba(255,80,0,.4);}
.n7r-credits{padding:24px 14px;text-align:center;}
.n7r-credits-gif{width:72px;height:72px;border-radius:12px;margin-bottom:10px;}
.n7r-credits-title{font:700 18px 'Segoe UI',sans-serif;letter-spacing:-.01em;margin-bottom:12px;}
.n7r-credits-name{font:700 14px 'Segoe UI',sans-serif;color:#fff;margin:2px 0 12px;}
.n7r-credits-alt{color:rgba(255,255,255,.45);font-weight:500;}
.n7r-credits-btn{display:block;margin:14px auto 0;padding:10px;background:#0e0e0e;border:1px solid rgba(88,101,242,.6);border-radius:8px;color:#8b9dff;text-decoration:none;font:600 11px 'Segoe UI',sans-serif;transition:all .2s;}
.n7r-credits-btn:hover{border-color:#5865F2;color:#fff;box-shadow:0 0 14px rgba(88,101,242,.45);}
.n7r-credits-ver{margin-top:14px;font-size:9px;color:rgba(255,255,255,.25);letter-spacing:.08em;}
.n7r-stats-box{padding:14px;}
#n7r-stats{font:11px/1.8 monospace;color:#666;margin-bottom:10px;white-space:pre;}
.n7r-pgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:14px 14px 8px;}
.n7r-pbtn{padding:10px 8px;background:#0e0e0e;border:1px solid rgba(255,255,255,.08);border-radius:8px;color:#888;cursor:pointer;font:600 10px 'Segoe UI',sans-serif;transition:all .2s;}
.n7r-pbtn:hover{border-color:rgba(255,255,255,.3);color:#fff;}
.n7r-pfooter{display:flex;gap:8px;padding:0 14px 14px;}
.n7r-abtn{flex:1;padding:8px;background:#0e0e0e;border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#888;cursor:pointer;font-size:11px;transition:all .2s;}
.n7r-abtn:hover{border-color:rgba(255,255,255,.3);color:#fff;}
.n7r-footer{text-align:center;padding:8px;font:600 9px 'Segoe UI',sans-serif;letter-spacing:.1em;color:rgba(255,255,255,.2);border-top:1px solid rgba(255,255,255,.05);background:#0e0e0e;}
.n7r-body::-webkit-scrollbar{width:4px;}
.n7r-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}
.n7r-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#111;border:1px solid rgba(255,255,255,.3);border-radius:30px;padding:8px 16px;color:#fff;z-index:1000000;font:600 12px 'Segoe UI',sans-serif;pointer-events:none;animation:toastIn .2s ease;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

#n7r-panel .n7r-thxgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px;}
#n7r-panel .n7r-thxb{padding:7px 6px;border:1px solid #6d7d92;border-radius:6px;background:linear-gradient(180deg,#0f0f0f,#181818);font:700 11px Tahoma,Verdana,sans-serif;color:#c1d0ef;cursor:pointer;}
#n7r-panel .n7r-thxb.on{background:linear-gradient(180deg,#5aa8ff,#0a63d1);color:#fff;border-color:#0a4aa0;}
#n7r-panel .n7r-spkgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 6px;}
#n7r-panel .n7r-spkb{aspect-ratio:1/1;border:2px solid #6d7d92;border-radius:4px;background:#d9d9d9;color:#555;font:700 12px Tahoma,Verdana,sans-serif;cursor:pointer;padding:0;}
#n7r-panel .n7r-spkb.on{background:linear-gradient(180deg,#5aa8ff,#0a63d1);color:#fff;border-color:#0a4aa0;box-shadow:inset 0 0 6px rgba(255,255,255,.5);}
`;
            document.head.appendChild(s);

            const s2 = document.createElement('style');
            s2.id = 'n7r-newlook';
            s2.textContent = `
:root{--n7a:var(--primary,#ff2bd6);--n7b:var(--secondary,#22e6ff);--n7bg:var(--background,#0a0a0f);--n7t:var(--text,#fff);}
#n7r-btn{top:18px;right:18px;padding:16px 30px;gap:12px;border-radius:50px;font:800 18px 'Segoe UI',system-ui,sans-serif;letter-spacing:.04em;background:linear-gradient(135deg,var(--n7a),var(--n7b));border:2px solid rgba(255,255,255,.55);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);box-shadow:0 0 26px color-mix(in srgb,var(--n7a) 70%,transparent),0 8px 28px rgba(0,0,0,.7);animation:n7pulse 2.6s ease-in-out infinite;}
#n7r-btn svg{width:30px;height:30px;stroke-width:2.4;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6));}
#n7r-btn:hover{transform:scale(1.07);border-color:#fff;}
@keyframes n7pulse{0%,100%{box-shadow:0 0 18px color-mix(in srgb,var(--n7a) 55%,transparent),0 8px 28px rgba(0,0,0,.7)}50%{box-shadow:0 0 34px color-mix(in srgb,var(--n7b) 75%,transparent),0 8px 28px rgba(0,0,0,.7)}}
#n7r-quickbar{padding:12px;gap:10px;border-radius:60px;background:linear-gradient(180deg,#14141f,#08080d);border:1.5px solid color-mix(in srgb,var(--n7a) 55%,transparent);box-shadow:0 0 22px color-mix(in srgb,var(--n7a) 35%,transparent),0 10px 30px rgba(0,0,0,.8);}
.qb-btn{width:58px;height:58px;font-size:26px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#262638,#0d0d15);border:1.5px solid rgba(255,255,255,.2);}
.qb-btn:hover{transform:scale(1.1);border-color:var(--n7b);box-shadow:0 0 16px color-mix(in srgb,var(--n7b) 60%,transparent);}
.qb-btn.active{background:radial-gradient(circle at 30% 25%,var(--n7a),#14001a);border-color:#fff;box-shadow:0 0 18px color-mix(in srgb,var(--n7a) 70%,transparent);}
#n7r-panel{width:430px;top:84px;border-radius:26px;border:1.5px solid color-mix(in srgb,var(--n7a) 55%,transparent);background:radial-gradient(120% 60% at 50% 0%,color-mix(in srgb,var(--n7a) 16%,#0b0b12),#07070c 70%);box-shadow:0 0 40px color-mix(in srgb,var(--n7a) 30%,transparent),0 24px 70px rgba(0,0,0,.95);}
.n7r-header{background:linear-gradient(90deg,color-mix(in srgb,var(--n7a) 28%,#0c0c14),color-mix(in srgb,var(--n7b) 22%,#0c0c14));border-bottom:1px solid rgba(255,255,255,.12);padding:16px 18px;}
.n7r-gojo{height:52px;width:52px;border-radius:14px;border:2px solid var(--n7b);box-shadow:0 0 14px color-mix(in srgb,var(--n7b) 60%,transparent);}
.n7r-title{font-size:21px;font-weight:800;background:linear-gradient(90deg,#fff,var(--n7b));-webkit-background-clip:text;background-clip:text;color:transparent;}
.n7r-subtitle{color:rgba(255,255,255,.55);}
.n7r-close{width:34px;height:34px;border-radius:50%;font-size:15px;color:#fff;background:rgba(255,255,255,.08);}
.n7r-vu-wrap{height:6px;background:#050508;}
.n7r-tabs{padding:8px 8px 6px;gap:4px;background:#0a0a11;border-bottom:none;}
.n7r-tab{padding:11px 4px;font-size:11px;border-radius:12px;border:1px solid transparent;background:rgba(255,255,255,.04);}
.n7r-tab.active{background:linear-gradient(135deg,var(--n7a),var(--n7b));color:#fff;border-color:rgba(255,255,255,.4);box-shadow:0 0 14px color-mix(in srgb,var(--n7a) 55%,transparent);}
.n7r-body{max-height:560px;}
.n7r-vis{border-radius:14px;border-color:color-mix(in srgb,var(--n7b) 35%,transparent);background:#06060a;}
.n7r-section-title{color:var(--n7b);font-size:11px;}
.n7r-srow{border-radius:14px;padding:10px 14px;background:linear-gradient(180deg,#12121c,#0b0b12);border-color:rgba(255,255,255,.1);}
.n7r-slbl{font-size:10px;color:#fff;min-width:96px;}
.n7r-slider{height:8px;border-radius:6px;background:linear-gradient(90deg,var(--n7a),var(--n7b));opacity:.55;}
.n7r-slider:hover{opacity:1;}
.n7r-slider::-webkit-slider-thumb{width:22px;height:22px;background:radial-gradient(circle at 35% 30%,#fff,#c9c9d9);border:2px solid var(--n7a);box-shadow:0 0 10px color-mix(in srgb,var(--n7a) 70%,transparent);}
.n7r-sval{color:var(--n7b);font-size:11px;font-weight:700;}
.n7r-tog{width:46px;height:24px;}
.n7r-tslide{border-radius:24px;background:rgba(255,255,255,.12);}
.n7r-tslide:before{height:18px;width:18px;left:3px;bottom:3px;}
input:checked+.n7r-tslide{background:linear-gradient(135deg,var(--n7a),var(--n7b));}
input:checked+.n7r-tslide:before{transform:translateX(22px);}
.n7r-tog-row{font-size:11px;color:#ddd;}
.n7r-select{padding:9px 10px;border-radius:10px;background:#12121c;font-size:12px;}
.n7r-pbtn,.n7r-abtn,.n7r-mbtn{padding:13px 8px;border-radius:12px;font-size:12px;background:linear-gradient(180deg,#16162200,#0c0c14);background-color:#12121c;}
.n7r-pbtn:hover,.n7r-abtn:hover,.n7r-mbtn:hover:not(:disabled){border-color:var(--n7b);box-shadow:0 0 12px color-mix(in srgb,var(--n7b) 40%,transparent);}
.n7r-max-btn{padding:15px;font-size:14px;}
.n7r-footer{background:#0a0a11;color:rgba(255,255,255,.35);}
.n7r-vgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:6px;}
.n7r-vbtn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px 4px;border-radius:16px;background:linear-gradient(180deg,#171724,#0c0c14);border:1.5px solid rgba(255,255,255,.12);color:#ddd;font:700 11px 'Segoe UI',sans-serif;cursor:pointer;transition:all .18s;}
.n7r-vico{font-size:30px;line-height:1;}
.n7r-vbtn:hover{transform:translateY(-2px);border-color:var(--n7b);color:#fff;box-shadow:0 0 14px color-mix(in srgb,var(--n7b) 45%,transparent);}
.n7r-vbtn.active{background:linear-gradient(135deg,var(--n7a),var(--n7b));color:#fff;border-color:#fff;box-shadow:0 0 18px color-mix(in srgb,var(--n7a) 60%,transparent);}
`;
            document.head.appendChild(s2);

            const s3 = document.createElement('style');
            s3.id = 'n7r-eax';
            s3.textContent = `
/* ===== EAX Advanced HD console look (v3.7) ===== */
:root{--eaxB1:#2f86e8;--eaxB2:#0b4aa8;--eaxB3:#06295f;--eaxLine:#7f93b5;--eaxBg:#0f1116;--eaxTxt:#e7e7e7;--eaxAcc:#b0c8ec;}
#n7r-panel{width:440px;top:84px;border-radius:6px;border:2px solid var(--eaxB3);background:var(--eaxBg);color:var(--eaxTxt);font:400 12px Tahoma,Verdana,'Segoe UI',sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.65);backdrop-filter:none;}
#n7r-panel .n7r-header{background:linear-gradient(180deg,#14397a 0%,#0a1f4d 55%,#06143a 100%);border-bottom:2px solid #000;padding:8px 10px;}
#n7r-panel .n7r-gojo{height:40px;width:40px;border-radius:3px;border:1px solid #171f2f;box-shadow:inset 0 0 0 1px #000;}
#n7r-panel .n7r-title{font:italic 800 20px Tahoma,Verdana,sans-serif;letter-spacing:.02em;background:none;-webkit-background-clip:initial;background-clip:initial;color:#fff;text-shadow:0 1px 0 #000;}
#n7r-panel .n7r-subtitle{color:#9fc2ff;font-size:9px;letter-spacing:.14em;font-weight:700;}
#n7r-panel .n7r-close{width:24px;height:24px;border-radius:50%;padding:0;color:#e7e7e7;font-weight:700;background:linear-gradient(180deg,#0f0f0f,#181c24);border:1px solid #1d2f55;}
#n7r-panel .n7r-close:hover{background:linear-gradient(180deg,#0f0f0f,#2c0b0b);color:#f2b3b3;border-color:#600;}
#n7r-panel .n7r-vu-wrap{height:6px;background:#06143a;border-bottom:1px solid #000;}
#n7r-panel .n7r-tabs{background:linear-gradient(180deg,#0d0d13,#12161c);border-bottom:1px solid var(--eaxLine);padding:5px 4px 0;gap:2px;align-items:flex-end;}
#n7r-panel .n7r-tabs::before{content:"\u25C0";font-size:10px;color:#ededed;align-self:center;padding:0 5px 4px 3px;}
#n7r-panel .n7r-tabs::after{content:"\u25B6";font-size:10px;color:#ededed;align-self:center;padding:0 3px 4px 5px;}
#n7r-panel .n7r-tab{padding:7px 2px 6px;font:600 10px Tahoma,Verdana,sans-serif;letter-spacing:0;color:#e1e1e1;background:transparent;border:1px solid transparent;border-bottom:none;border-radius:4px 4px 0 0;box-shadow:none;}
#n7r-panel .n7r-tab:hover{background:rgba(255,255,255,.7);color:#ededed;border-color:#1a1d24;}
#n7r-panel .n7r-tab.active{background:#0f0f0f;color:#ededed;border-color:var(--eaxLine);box-shadow:none;position:relative;top:1px;}
#n7r-panel .n7r-body{background:#0f0f0f;max-height:540px;}
#n7r-panel .n7r-body::-webkit-scrollbar{width:12px;}
#n7r-panel .n7r-body::-webkit-scrollbar-track{background:#111419;}
#n7r-panel .n7r-body::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#0c0f16,#1a1f26);border:1px solid #7f93b5;border-radius:2px;}
#n7r-panel .n7r-vis{background:#08142e;border:2px inset #222833;border-radius:2px;}
#n7r-panel .n7r-section-title{color:var(--eaxAcc);font:700 11px Tahoma,Verdana,sans-serif;letter-spacing:.04em;border-bottom:1px solid #171b22;padding-bottom:3px;}
#n7r-panel .n7r-sep{background:#14181e;}
#n7r-panel .n7r-srow{background:#0c0f16;border:1px solid #181c24;border-radius:2px;padding:7px 10px;}
#n7r-panel .n7r-slbl{color:#ededed;font:700 10px Tahoma,Verdana,sans-serif;letter-spacing:.02em;}
#n7r-panel .n7r-slider{height:6px;border-radius:1px;background:linear-gradient(180deg,#1e2127,#101317);border:1px solid #6f7d96;box-shadow:inset 0 1px 2px rgba(0,0,0,.35);opacity:1;}
#n7r-panel .n7r-slider::-webkit-slider-thumb{width:14px;height:18px;border-radius:2px;background:linear-gradient(180deg,#0f0f0f 0%,#171a1e 50%,#22252b 100%);border:1px solid #333;box-shadow:0 1px 2px rgba(0,0,0,.5);}
#n7r-panel .n7r-slider:hover::-webkit-slider-thumb{background:linear-gradient(180deg,#0f0f0f,#091425 55%,#142034);}
#n7r-panel .n7r-sval{color:var(--eaxAcc);font:700 11px Tahoma,Verdana,monospace;}
#n7r-panel .n7r-row-label{color:#dbdbdb;font:700 10px Tahoma,Verdana,sans-serif;}
#n7r-panel .n7r-tog-row{color:#e7e7e7;font:600 11px Tahoma,Verdana,sans-serif;letter-spacing:0;}
#n7r-panel .n7r-tog{width:16px;height:16px;flex:none;}
#n7r-panel .n7r-tslide{border-radius:2px;background:#0f0f0f;border:1px solid #1c3f73;box-shadow:inset 1px 1px 2px rgba(0,0,0,.35);}
#n7r-panel .n7r-tslide:before{content:"\u2713";position:absolute;left:1px;top:-2px;bottom:auto;width:auto;height:auto;background:none;color:transparent;font:700 14px/16px Tahoma,Arial,sans-serif;border-radius:0;transform:none;}
#n7r-panel input:checked+.n7r-tslide{background:#0f0f0f;}
#n7r-panel input:checked+.n7r-tslide:before{background:none;color:#c2d2ef;transform:none;}
#n7r-panel .n7r-hint{color:#c3c3ca;font-size:10px;}
#n7r-panel .n7r-select{background:#0f0f0f;color:#ededed;border:1px solid #7f93b5;border-radius:0;box-shadow:inset 1px 1px 2px rgba(0,0,0,.2);font:12px Tahoma,Verdana,sans-serif;}
#n7r-panel .n7r-pbtn,#n7r-panel .n7r-abtn,#n7r-panel .n7r-mbtn,#n7r-panel .n7r-vbtn{background:linear-gradient(180deg,#0f0f0f 0%,#10141b 48%,#171c24 52%,#11161d 100%);color:#e7e7e7;border:1px solid #4e6288;border-radius:5px;box-shadow:0 1px 2px rgba(0,0,0,.35),inset 0 1px 0 #fff;font-family:Tahoma,Verdana,sans-serif;}
#n7r-panel .n7r-pbtn:hover,#n7r-panel .n7r-abtn:hover,#n7r-panel .n7r-mbtn:hover:not(:disabled),#n7r-panel .n7r-vbtn:hover{background:linear-gradient(180deg,#07121b 0%,#091525 48%,#101e30 52%,#0c1827 100%);color:#ededed;border-color:#0b4aa8;box-shadow:0 0 0 1px #5aa0f0,0 1px 3px rgba(0,0,0,.4);transform:none;}
#n7r-panel .n7r-vbtn.active,#n7r-panel .n7r-pbtn.active{background:linear-gradient(180deg,#0f243d 0%,#2f86e8 48%,#0b4aa8 52%,#2a74d6 100%);color:#fff;border-color:#052a66;text-shadow:0 1px 0 rgba(0,0,0,.5);box-shadow:inset 0 1px 3px rgba(0,0,0,.45);}
#n7r-panel .n7r-mbtn-play{color:#c3efce;}
#n7r-panel .n7r-mbtn-stop{color:#ecbebe;}
#n7r-panel .n7r-max-btn{border-color:#8a2a00;color:#f3ccbc;background:linear-gradient(180deg,#1f1608,#2f1f0c 50%,#402910 52%,#32220d);}
#n7r-panel .n7r-max-btn:hover{color:#ededed;border-color:#c34a00;box-shadow:0 0 0 1px #ff9a3d;}
#n7r-panel .n7r-music-status-bar{background:#0e1117;border:1px solid #181c24;border-radius:2px;}
#n7r-panel .n7r-music-info-text,#n7r-panel .n7r-music-time{color:#d4d4dc;}
#n7r-panel .n7r-music-progress-bar{background:#11141a;border:1px solid #6f7d96;border-radius:2px;box-shadow:inset 0 1px 2px rgba(0,0,0,.3);}
#n7r-panel .n7r-music-progress-fill{background:linear-gradient(180deg,#0f243d,#0b4aa8);border-radius:1px;}
#n7r-panel .n7r-credits-title,#n7r-panel .n7r-credits-name{color:#ccd7f0;}
#n7r-panel .n7r-credits-alt{color:#c3c3ca;}
#n7r-panel .n7r-credits-btn{background:linear-gradient(180deg,#0f0f0f,#11161d);border:1px solid #4e6288;color:#b0c8ec;border-radius:5px;}
#n7r-panel .n7r-credits-ver{color:#889;}
#n7r-panel #n7r-stats{color:#dadae3;}
#n7r-panel .n7r-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 10px;background:linear-gradient(180deg,#152d46 0%,#1d63c4 45%,#0b3f94 100%);border-top:2px solid #06295f;color:#fff;letter-spacing:0;}
#n7r-panel .n7r-lcd{font:700 13px 'Courier New',monospace;color:#ccd7f0;background:linear-gradient(180deg,#0e121a,#0f0f0f);border:2px inset #6f84ad;border-radius:3px;padding:3px 12px;letter-spacing:.08em;min-width:84px;text-align:center;}
#n7r-panel .n7r-fby{font:600 9px Tahoma,Verdana,sans-serif;color:#cfe3ff;letter-spacing:.06em;flex:1;text-align:center;}
#n7r-panel .n7r-brand{font:800 17px Tahoma,Verdana,sans-serif;letter-spacing:.2em;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6);}
/* main button + quick bar = glossy Creative blue transport buttons */
#n7r-btn{top:18px;right:18px;padding:12px 26px;gap:10px;border-radius:9px;font:800 17px Tahoma,Verdana,sans-serif;letter-spacing:.14em;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6);background:linear-gradient(180deg,#0f243a 0%,#2f86e8 46%,#0b4aa8 52%,#1d63c4 100%);border:2px solid #052a66;box-shadow:0 0 0 1px #9fc6f7,0 5px 16px rgba(0,0,0,.65);animation:none;backdrop-filter:none;}
#n7r-btn:hover{transform:translateY(-1px);border-color:#000;background:linear-gradient(180deg,#0c1f30 0%,#152d46 46%,#1257c0 52%,#2a74d6 100%);}
#n7r-btn.active{background:linear-gradient(180deg,#0b4aa8,#2f86e8);box-shadow:inset 0 2px 5px rgba(0,0,0,.6);}
#n7r-quickbar{padding:8px 10px;gap:7px;border-radius:10px;background:linear-gradient(180deg,#152d46 0%,#1d63c4 45%,#0b3f94 100%);border:2px solid #06295f;box-shadow:0 0 0 1px #9fc6f7,0 6px 20px rgba(0,0,0,.65);backdrop-filter:none;}
.qb-btn{width:56px;height:44px;border-radius:7px;font-size:23px;background:linear-gradient(180deg,#0f0f0f 0%,#10141b 48%,#171c24 52%,#11161d 100%);border:1px solid #1d2f55;box-shadow:inset 0 1px 0 #fff,0 1px 3px rgba(0,0,0,.5);}
.qb-btn:hover{transform:none;border-color:#000;background:linear-gradient(180deg,#07121b 0%,#091525 48%,#101e30 52%,#0c1827 100%);box-shadow:0 0 0 1px #fff,0 1px 3px rgba(0,0,0,.5);}
.qb-btn.active{background:linear-gradient(180deg,#0b2b13 0%,#4fd47a 48%,#16913f 52%,#3fc46a 100%);border-color:#04401a;box-shadow:inset 0 2px 4px rgba(0,0,0,.45);}
.n7r-toast{background:linear-gradient(180deg,#2f86e8,#0b3f94);border:2px solid #06295f;border-radius:8px;color:#fff;}
`;
            document.head.appendChild(s3);

            const s4 = document.createElement('style');
            s4.id = 'n7r-console39';
            s4.textContent = `
/* ===== v3.9 console look (matches the Effects / Equalizer screenshots) ===== */
:root{--cB1:#122c47;--cB2:#1f6fd6;--cB3:#0a3f94;--cNavy:#0a2a6e;--cLine:#222833;}
#n7r-panel{width:480px;border-radius:7px;border:2px solid #1b6fe0;background:#0f0f0f;box-shadow:0 0 0 1px #0a3f94,0 14px 44px rgba(0,0,0,.6);}
#n7r-panel.n7r-collapsed .n7r-vu-wrap,#n7r-panel.n7r-collapsed .n7r-tabs,#n7r-panel.n7r-collapsed .n7r-body,#n7r-panel.n7r-collapsed .n7r-footer{display:none;}
#n7r-panel .n7r-header{background:linear-gradient(180deg,#0f0f0f 0%,#0e1118 60%,#11151c 100%);border-bottom:1px solid #1d222b;padding:6px 8px 6px 10px;}
#n7r-panel .n7r-hL{gap:9px;}
#n7r-panel .n7r-gojo{height:34px;width:34px;border-radius:50%;border:2px solid #1b6fe0;box-shadow:none;}
#n7r-panel .n7r-logo{display:flex;flex-direction:column;line-height:1;}
#n7r-panel .n7r-logo-main{font:italic 900 22px Tahoma,Verdana,sans-serif;color:#d3dcf0;letter-spacing:.01em;}
#n7r-panel .n7r-logo-adv{font:700 8px Tahoma,Verdana,sans-serif;color:#b3c6e4;letter-spacing:.18em;margin-top:2px;}
#n7r-panel .n7r-logo-adv i{font-style:italic;color:#9fbce3;}
#n7r-panel .n7r-console{font:700 15px Tahoma,Verdana,sans-serif;color:#dadae3;letter-spacing:.14em;margin-left:6px;}
#n7r-panel .n7r-hbtn,#n7r-panel .n7r-close{width:26px;height:22px;border-radius:5px;padding:0;margin-left:2px;font:700 12px Tahoma,Verdana,sans-serif;color:#e7e7e7;background:linear-gradient(180deg,#0f0f0f,#13171f);border:1px solid #6b7fa5;box-shadow:inset 0 1px 0 #fff;cursor:pointer;}
#n7r-panel .n7r-hbtn:hover{background:linear-gradient(180deg,#07121b,#101d2d);border-color:#0b4aa8;}
#n7r-panel .n7r-close:hover{background:linear-gradient(180deg,#0f0f0f,#2c0b0b);color:#f2b3b3;border-color:#600;}
#n7r-panel .n7r-status-badge{margin-right:4px;}
#n7r-panel .n7r-vu-wrap{height:4px;background:#13171e;border-bottom:1px solid #1d222b;}
#n7r-panel .n7r-tabs{display:flex;align-items:stretch;padding:0;gap:0;background:linear-gradient(180deg,#0f0f0f,#0e121a);border-bottom:1px solid var(--cLine);}
#n7r-panel .n7r-tabs::before,#n7r-panel .n7r-tabs::after{content:none;display:none;}
#n7r-panel .n7r-tarrow{flex:none;width:22px;background:linear-gradient(180deg,#0f0f0f,#11151c);border:none;border-right:1px solid #1a1d24;color:#ededed;font-size:10px;cursor:pointer;padding:0;}
#n7r-panel .n7r-tarrow:last-child{border-right:none;border-left:1px solid #1a1d24;}
#n7r-panel .n7r-tarrow:hover{background:linear-gradient(180deg,#07121b,#0f1b2a);}
#n7r-panel .n7r-tabscroll{flex:1;display:flex;overflow-x:hidden;scroll-behavior:smooth;padding:5px 3px 0;gap:2px;align-items:flex-end;}
#n7r-panel .n7r-tab{flex:none;display:flex;align-items:center;gap:5px;padding:6px 10px 6px;font:600 11px Tahoma,Verdana,sans-serif;white-space:nowrap;}
#n7r-panel .n7r-ti{font-size:13px;line-height:1;}
#n7r-panel .n7r-body{max-height:480px;background:#0f0f0f;}
#n7r-panel .n7r-pad{padding:10px 12px 4px;}
#n7r-panel .n7r-desc{margin:0 0 10px;font:12px/1.4 Tahoma,Verdana,sans-serif;color:#e7e7e7;}
#n7r-panel .n7r-chkrow{display:flex;align-items:center;gap:8px;margin:0 0 8px;font:12px Tahoma,Verdana,sans-serif;color:#e7e7e7;}
#n7r-panel .n7r-eaxbox{background:#101216;border:1px solid #191d22;padding:12px 10px 14px;margin-top:6px;}
#n7r-panel .n7r-eaxbox.off{opacity:.5;pointer-events:none;}
#n7r-panel .n7r-eaxcols{display:grid;grid-template-columns:92px 1fr 130px;gap:10px;align-items:start;}
#n7r-panel .n7r-ecol-env{font:12px Tahoma,Verdana,sans-serif;color:#e7e7e7;padding-top:2px;}
#n7r-panel .n7r-elbl{font:12px Tahoma,Verdana,sans-serif;color:#e7e7e7;margin-bottom:2px;}
#n7r-panel .n7r-eactive{font:700 12px Tahoma,Verdana,sans-serif;color:#ededed;margin-bottom:8px;}
#n7r-panel .n7r-elist{list-style:none;margin:0;padding:0;height:134px;overflow-y:auto;background:#0f0f0f;border:2px inset #22272f;font:12px Tahoma,Verdana,sans-serif;}
#n7r-panel .n7r-elist li{padding:2px 8px;cursor:default;color:#e7e7e7;}
#n7r-panel .n7r-elist li:hover{background:#0b131e;}
#n7r-panel .n7r-elist li.sel{background:#3a3a3a;color:#fff;}
#n7r-panel .n7r-elist::-webkit-scrollbar{width:12px;}
#n7r-panel .n7r-elist::-webkit-scrollbar-track{background:#111419;}
#n7r-panel .n7r-elist::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#0c0f16,#1a1f26);border:1px solid #7f93b5;}
#n7r-panel .n7r-eamt{display:flex;align-items:center;gap:6px;font:11px Tahoma,Verdana,sans-serif;color:#e7e7e7;margin-top:6px;}
#n7r-panel .n7r-eamt .n7r-slider{flex:1;min-width:0;}
#n7r-panel .n7r-select:disabled{opacity:1;color:#e1e1e1;}
/* equalizer window */
#n7r-eqpanel .n7r-eqwin{margin:10px 10px 8px;border:3px solid #1d8cff;border-radius:6px;background:#0f0f0f;box-shadow:0 0 0 1px #0a4aa8;}
#n7r-eqpanel .n7r-eqdev{padding:6px 8px;background:linear-gradient(180deg,#07111e,#091525);border-bottom:1px solid #162233;}
#n7r-eqpanel .n7r-eqdev .n7r-select{height:24px;padding:0 6px;}
#n7r-eqpanel .n7r-eqtitle{margin:8px 10px 0;text-align:center;font:12px Tahoma,Verdana,sans-serif;padding:3px;background:linear-gradient(180deg,#0f0f0f,#10141a);border:1px solid #1b1f26;border-radius:3px;}
#n7r-eqpanel .n7r-eqpre{display:flex;align-items:center;gap:6px;padding:8px 10px;font:12px Tahoma,Verdana,sans-serif;}
#n7r-eqpanel .n7r-eqpre .n7r-select{flex:1;height:24px;padding:0 4px;}
#n7r-eqpanel .n7r-eqibtn{width:42px;height:26px;padding:0;border-radius:4px;background:linear-gradient(180deg,#0d2435,#2f8ee8 50%,#1565c9 52%,#4aa6f2);border:1px solid #0a3f94;color:#fff;font-size:13px;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
#n7r-eqpanel .n7r-eqibtn:hover{filter:brightness(1.12);}
#n7r-eqpanel .n7r-eqsliders{display:flex;gap:4px;padding:2px 8px 10px;justify-content:space-between;}
#n7r-eqpanel .n7r-eqb{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;}
#n7r-eqpanel .n7r-eqtrk{position:relative;width:100%;height:166px;display:flex;justify-content:center;background:
  repeating-linear-gradient(180deg,transparent 0 6px,#21242b 6px 7px) left 3px top 12px/6px 142px no-repeat,
  repeating-linear-gradient(180deg,transparent 0 6px,#21242b 6px 7px) right 3px top 12px/6px 142px no-repeat,
  linear-gradient(180deg,#0c0f16,#0f131b);border:1px solid #181c24;border-radius:3px;}
#n7r-eqpanel .n7r-eqtrk::before{content:'';position:absolute;left:3px;right:3px;top:6px;height:2px;background:linear-gradient(90deg,#e22 0 28%,transparent 28% 72%,#e22 72% 100%);}
#n7r-eqpanel .n7r-eqtrk::after{content:'';position:absolute;right:2px;top:calc(50% + 1px);border-right:6px solid #000;border-top:4px solid transparent;border-bottom:4px solid transparent;}
#n7r-eqpanel .n7r-eqlv{flex:1.45;margin-left:8px;}
#n7r-eqpanel .n7r-vslider{-webkit-appearance:none;appearance:none;writing-mode:vertical-lr;direction:rtl;width:24px;height:150px;margin:8px 0 0;padding:0;background:transparent;cursor:pointer;position:relative;z-index:1;}
#n7r-eqpanel .n7r-vslider::-webkit-slider-runnable-track{width:7px;border:1px solid #5b6a86;border-radius:4px;background:linear-gradient(90deg,#6c7a93,#15181e);box-shadow:inset 1px 1px 2px rgba(0,0,0,.45);}
#n7r-eqpanel .n7r-vslider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:13px;margin-left:-9px;border-radius:3px;border:1px solid #3d4c68;background:linear-gradient(180deg,#0f0f0f 0,#11151c 38%,#2f86e8 42%,#2f86e8 58%,#11151c 62%,#1d2028 100%);box-shadow:0 1px 2px rgba(0,0,0,.45);}
#n7r-eqpanel .n7r-vslider:hover::-webkit-slider-thumb{filter:brightness(1.08);}
#n7r-eqpanel .n7r-eql{font:700 11px Tahoma,Verdana,sans-serif;color:#e7e7e7;}
#n7r-eqpanel .n7r-eqlv{position:relative;}
#n7r-eqpanel .n7r-eqscale{position:absolute;left:4px;top:15px;height:138px;display:flex;flex-direction:column;justify-content:space-between;font:11px Tahoma,Verdana,sans-serif;color:#e7e7e7;pointer-events:none;z-index:2;}
#n7r-eqpanel .n7r-eqlv .n7r-eqtrk{justify-content:flex-end;padding-right:12px;}
/* footer: bright-blue transport row + navy row */
#n7r-panel .n7r-footer{display:block;padding:0;background:none;border-top:2px solid #06295f;}
#n7r-panel .n7r-frow1{display:flex;align-items:center;gap:5px;padding:7px 8px;background:linear-gradient(180deg,#102a42 0%,#2a82ea 48%,#1260cf 52%,#2f86e8 100%);}
#n7r-panel .n7r-frow2{display:flex;align-items:center;gap:6px;padding:5px 8px 6px;background:linear-gradient(180deg,#123e8f 0%,#0a2a6e 55%,#071c4d 100%);}
#n7r-panel .n7r-fb{height:26px;min-width:34px;padding:0 8px;border-radius:5px;background:linear-gradient(180deg,#0f0f0f 0%,#0f141d 48%,#171c26 52%,#10151e 100%);border:1px solid #17356f;color:#c1d0ef;font:700 12px Tahoma,Verdana,sans-serif;cursor:pointer;box-shadow:inset 0 1px 0 #fff,0 1px 2px rgba(0,0,0,.4);}
#n7r-panel .n7r-fb:hover{background:linear-gradient(180deg,#07121b,#091525 48%,#101e30 52%,#0c1827);}
#n7r-panel .n7r-fb:active{box-shadow:inset 0 2px 4px rgba(0,0,0,.4);}
#n7r-panel .n7r-fb-round{border-radius:50%;width:28px;min-width:28px;height:28px;padding:0;}
#n7r-panel .n7r-fb-rec{color:#e7e7e7;}
#n7r-panel .n7r-fb-rec b{color:#e7a0a0;margin-right:3px;}
#n7r-panel .n7r-fb-rec small{font-size:8px;margin-left:4px;}
#n7r-panel .n7r-fb-rec.rec{background:linear-gradient(180deg,#320d0d,#e22 50%,#b00 52%,#e44);color:#fff;animation:n7recblink 1s steps(2) infinite;}
#n7r-panel .n7r-fb-rec.rec b{color:#fff;}
@keyframes n7recblink{50%{filter:brightness(1.35);}}
#n7r-panel .n7r-fb-play{color:#c3efce;}
#n7r-panel .n7r-lcd{flex:1;max-width:130px;margin:0 3px;}
#n7r-panel .n7r-fpill{padding:3px 22px;border-radius:7px 7px 0 0;background:#0f0f0f;border:1px solid #17356f;border-bottom:none;font:600 12px Tahoma,Verdana,sans-serif;color:#e7e7e7;cursor:pointer;margin-bottom:-6px;padding-bottom:6px;}
#n7r-panel .n7r-fi{width:34px;height:24px;border-radius:4px;background:linear-gradient(180deg,#2d5db3,#173c85);border:1px solid #5f86cf;color:#fff;font-size:14px;cursor:pointer;padding:0;}
#n7r-panel .n7r-fi:hover{background:linear-gradient(180deg,#4a82e0,#2455b3);}
#n7r-panel .n7r-brand{margin-left:auto;font:800 18px Tahoma,Verdana,sans-serif;letter-spacing:.2em;color:#6fb4ff;text-shadow:0 0 6px rgba(80,160,255,.45);}

/* ===== v3.9.2 pixel-match to the EAX Console / Graphic Equalizer screenshot ===== */
#n7r-panel{width:520px;border:2px solid #19c6ea;box-shadow:0 0 0 1px #0a7aa6,0 14px 44px rgba(0,0,0,.6);}
#n7r-panel .n7r-hdev{flex:1;min-width:0;max-width:178px;margin:0 8px;}
#n7r-panel .n7r-hdev .n7r-select{width:100%;height:22px;padding:0 4px;font:11px Tahoma,Verdana,sans-serif;color:#e7e7e7;background:linear-gradient(180deg,#0f0f0f,#101319);border:1px solid #6b7fa5;border-radius:3px;}
#n7r-panel .n7r-console{font-size:14px;letter-spacing:.1em;}
#n7r-panel .n7r-elist li.sel{background:#0a63d1;color:#fff;}
#n7r-panel .n7r-eactive{font-size:13px;}
#n7r-panel .n7r-eval{display:inline-block;min-width:26px;padding:1px 5px;margin-left:6px;background:#121212;border:1px solid #1d1d1d;text-align:center;font:11px Tahoma,Verdana,sans-serif;color:#e7e7e7;}
#n7r-eqpanel .n7r-eqwin{margin:10px 10px 8px;border:1px solid #21211e;border-radius:8px;background:#161613;box-shadow:0 2px 10px rgba(0,0,0,.25);overflow:hidden;}
#n7r-eqpanel .n7r-eqhead{display:flex;align-items:center;gap:10px;padding:8px 10px;background:#161613;}
#n7r-eqpanel .n7r-eqwt{font:700 12px Tahoma,Verdana,sans-serif;color:#ededed;white-space:nowrap;}
#n7r-eqpanel .n7r-eqhead .n7r-select{flex:1;min-width:0;height:22px;padding:0 4px;font:11px Tahoma,Verdana,sans-serif;color:#e7e7e7;background:#0f0f0f;border:1px solid #8a8a84;border-radius:3px;}
#n7r-eqpanel .n7r-eqwb{display:flex;gap:4px;margin-left:4px;}
#n7r-eqpanel .n7r-eqwbtn{width:22px;height:22px;padding:0;border:1px solid #1e1e1e;background:#0f0f0f;color:#ededed;font:700 11px/20px Tahoma,Verdana,sans-serif;cursor:pointer;}
#n7r-eqpanel .n7r-eqwbtn.q{background:#0a78d7;border-color:#0a78d7;color:#fff;}
#n7r-eqpanel .n7r-eqwbtn.x{background:#000;border-color:#000;color:#fff;}
#n7r-eqpanel .n7r-eqwbtn:hover{filter:brightness(.93);}
#n7r-eqpanel .n7r-eqtitle{margin:0;padding:6px 0;border:0;border-radius:0;border-top:1px solid #1b1b18;border-bottom:1px solid #1b1b18;background:#191916;color:#cfcfcf;text-align:center;font:12px Tahoma,Verdana,sans-serif;}
#n7r-eqpanel .n7r-eqen{display:flex;align-items:center;gap:8px;padding:8px 10px;font:12px Tahoma,Verdana,sans-serif;color:#e7e7e7;}
#n7r-eqpanel .n7r-eqchk{display:flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap;margin-right:6px;}
#n7r-eqpanel .n7r-eqprel{white-space:nowrap;}
#n7r-eqpanel .n7r-eqen .n7r-select{flex:1;min-width:0;height:24px;padding:0 4px;font:12px Tahoma,Verdana,sans-serif;color:#e7e7e7;background:#0f0f0f;border:1px solid #7a7a74;border-radius:3px;}
#n7r-eqpanel .n7r-eqen .n7r-eqibtn{width:28px;height:24px;}
#n7r-eqpanel .n7r-eqsliders{display:flex;gap:7px;padding:4px 10px 12px;justify-content:space-between;}
#n7r-eqpanel .n7r-eqwin.eqoff .n7r-eqsliders{opacity:.55;}
#n7r-eqpanel .n7r-eqb{flex:1;display:flex;flex-direction:column;align-items:center;gap:0;min-width:0;padding:6px 0 4px;background:#141411;border:1px solid #242422;border-radius:2px;}
#n7r-eqpanel .n7r-eqlv{flex:1.45;margin-left:10px;}
#n7r-eqpanel .n7r-eqtop{height:15px;font:11px Tahoma,Verdana,sans-serif;color:#e7e7e7;}
#n7r-eqpanel .n7r-eqtrk{position:relative;width:100%;height:156px;display:flex;justify-content:center;padding:0;border:0;border-radius:0;background:
  repeating-linear-gradient(180deg,transparent 0 11px,#8e8e88 11px 12px) left 8px top 6px/7px 144px no-repeat,
  repeating-linear-gradient(180deg,transparent 0 11px,#8e8e88 11px 12px) right 8px top 6px/7px 144px no-repeat;}
#n7r-eqpanel .n7r-eqtrk::before,#n7r-eqpanel .n7r-eqtrk::after{content:none;display:none;}
#n7r-eqpanel .n7r-eqlv .n7r-eqtrk{justify-content:center;padding-right:0;}
#n7r-eqpanel .n7r-vslider{margin:3px 0 0;}
#n7r-eqpanel .n7r-eql{margin-top:2px;font:700 10px Tahoma,Verdana,sans-serif;color:#e7e7e7;}
#n7r-eqpanel .n7r-eqlow{font-weight:400;font-size:11px;}

/* ===== v3.10 exact console look: two floating windows ===== */
#n7r-panel{width:500px;padding:0 3px;border:0;border-radius:8px 8px 0 0;background:linear-gradient(90deg,#10d6f4,#0fc1ea 50%,#10d6f4);box-shadow:0 8px 30px rgba(0,0,0,.65);font:12px Tahoma,Verdana,sans-serif;}
#n7r-panel .n7r-header{margin:0 -3px;padding:5px 6px 5px 8px;background:linear-gradient(180deg,#0f0f0f,#121417 55%,#15171a);border-bottom:1px solid #262a2f;border-radius:8px 8px 0 0;}
#n7r-panel .n7r-gojo{display:none;}
#n7r-panel .n7r-logo-main{background:#0b1a33;color:#e8f1ff;padding:0 6px;border-radius:3px;font:italic 900 19px Tahoma,Verdana,sans-serif;letter-spacing:0;line-height:24px;}
#n7r-panel .n7r-logo-adv{margin-top:2px;font-size:7px;}
#n7r-panel .n7r-console{margin-left:4px;font:italic 700 13px Tahoma,Verdana,sans-serif;color:#cfcfcf;letter-spacing:.04em;}
#n7r-panel .n7r-hdev{max-width:170px;}
#n7r-panel .n7r-hR{display:flex;align-items:center;gap:3px;}
#n7r-panel .n7r-status-badge{display:none;}
#n7r-panel .n7r-hq{width:auto;min-width:34px;padding:0 4px;height:22px;border-radius:4px;font:700 14px Tahoma,Verdana,sans-serif;background:linear-gradient(180deg,#0f0f0f,#17191c);border:1px solid #7b8798;}
#n7r-panel .n7r-hq i{font-style:normal;font-size:8px;margin-left:3px;border-left:1px solid #8a94a4;padding-left:3px;}
#n7r-panel .n7r-hmin,#n7r-panel .n7r-close{width:22px;height:22px;background:none;border:0;box-shadow:none;font:700 15px Tahoma,Verdana,sans-serif;color:#e1e1e1;}
#n7r-panel .n7r-hmin:hover,#n7r-panel .n7r-close:hover{background:#0e1520;color:#ededed;}
#n7r-panel .n7r-vu-wrap{height:3px;margin:0 -3px;background:#171b22;border:0;}
#n7r-panel .n7r-tabs{display:flex;gap:3px;padding:4px 0 4px;background:none;border:0;position:relative;}
#n7r-panel .n7r-tabscroll{display:none;}
#n7r-panel .n7r-tabbar{flex:1;height:24px;display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid #6d7d92;border-radius:6px;background:linear-gradient(180deg,#0f0f0f,#141414 50%,#1a1a1a);font:700 12px Tahoma,Verdana,sans-serif;color:#c1d0ef;cursor:pointer;padding:0;}
#n7r-panel .n7r-tabbar:hover{background:linear-gradient(180deg,#0f0f0f,#08131f 50%,#0c1824);}
#n7r-panel .n7r-tbico{width:14px;height:14px;border-radius:50%;border:3px solid #3b7fd8;border-top-color:#122031;box-sizing:border-box;}
#n7r-panel .n7r-tarrow{width:24px;height:24px;border:1px solid #6d7d92;border-radius:6px;background:linear-gradient(180deg,#0f0f0f,#1a1a1a);color:#d3dbe4;font-size:9px;}
#n7r-panel .n7r-tarrow:last-of-type{border-left:1px solid #6d7d92;}
#n7r-panel .n7r-tabmenu{position:absolute;left:30px;right:30px;top:30px;z-index:20;max-height:210px;overflow-y:auto;background:#0f0f0f;border:1px solid #5b6a86;box-shadow:0 4px 12px rgba(0,0,0,.4);}
#n7r-panel .n7r-tabmenu div{padding:4px 10px;font:12px Tahoma,Verdana,sans-serif;color:#e7e7e7;cursor:default;}
#n7r-panel .n7r-tabmenu div:hover{background:#0a63d1;color:#fff;}
#n7r-panel .n7r-body{height:268px;max-height:268px;margin-bottom:3px;background:#0f0f0f;border:1px solid #22272e;}
#n7r-panel .n7r-footer{margin:0 -3px;border-top:0;background:linear-gradient(90deg,#2257e6,#2b46cc 55%,#3a35b8);}
#n7r-panel .n7r-frow1{display:none;border-top:1px solid #0a2a6e;}
#n7r-panel .n7r-footer.show1 .n7r-frow1{display:flex;}
#n7r-panel .n7r-frow2{background:none;padding:6px 10px 6px 12px;gap:7px;align-items:center;}
#n7r-panel .n7r-fpill{margin:0;padding:3px 24px;border:1px solid #272c34;border-radius:8px;background:linear-gradient(180deg,#0f0f0f,#161616);font:600 12px Tahoma,Verdana,sans-serif;}
#n7r-panel .n7r-fi{width:28px;height:26px;border-radius:4px;background:linear-gradient(180deg,#111111,#1b1c1f);border:1px solid #2a2f40;display:flex;align-items:center;justify-content:center;}
#n7r-panel .n7r-fi:hover{background:linear-gradient(180deg,#0f0f0f,#0a1829);}
#n7r-panel .n7r-brand{font:900 italic 20px Tahoma,Verdana,sans-serif;letter-spacing:.06em;color:#eaffff;text-shadow:0 0 5px #2de0ff,0 0 2px #00b4e6;}
#n7r-eqpanel{position:fixed;width:520px;z-index:999999;font:12px Tahoma,Verdana,sans-serif;}
#n7r-eqpanel .n7r-eqwin{margin:0;box-shadow:0 8px 30px rgba(0,0,0,.65);}
#n7r-eqpanel.min .n7r-eqtitle,#n7r-eqpanel.min .n7r-eqen,#n7r-eqpanel.min .n7r-eqsliders{display:none;}
#n7r-eqpanel .n7r-eqhead{cursor:move;}
`;
            document.head.appendChild(s4);
        },


        // ═════════ v3.9 console features ═════════
        softSet(id, val, fmt) {
            const el = document.getElementById('n7r-' + id); if (el) el.value = val;
            const vEl = document.getElementById('n7r-v-' + id); if (vEl) vEl.textContent = fmt(+val);
        },

        applyEAX() {
            const env = EAX_ENVS[PARAMS.eaxEnv] || EAX_ENVS['None'];
            const a = (+PARAMS.eaxAmount || 0) / 100;
            const prevDecay = PARAMS.reverbDecay, prevMega = !!PARAMS.megaReverb, prevKey = PARAMS._eaxKey || '';
            if (PARAMS.eaxOn && env.mix > 0 && a > 0) {
                if (!PARAMS._eaxSaved) PARAMS._eaxSaved = { r: PARAMS.reverb, d: PARAMS.reverbDecay, w: PARAMS.width, m: !!PARAMS.megaReverb };
                PARAMS.reverb = Math.round(env.mix * a);
                PARAMS.reverbDecay = env.decay;
                PARAMS.width = Math.round(env.width * a);
                PARAMS.megaReverb = env.p ? false : !!env.mega;
                PARAMS._eaxP = env.p || null;
                PARAMS._eaxKey = env.p ? PARAMS.eaxEnv : '';
            } else if (PARAMS._eaxSaved) {
                const sv = PARAMS._eaxSaved; PARAMS._eaxSaved = null;
                PARAMS.reverb = sv.r; PARAMS.reverbDecay = sv.d; PARAMS.width = sv.w; PARAMS.megaReverb = sv.m;
                PARAMS._eaxP = null; PARAMS._eaxKey = '';
            } else { PARAMS._eaxP = null; PARAMS._eaxKey = ''; }
            const mg = document.getElementById('n7r-megaReverb'); if (mg) mg.checked = !!PARAMS.megaReverb;
            const box = document.getElementById('n7r-eaxbox'); if (box) box.classList.toggle('off', !PARAMS.eaxOn);
            this.softSet('reverb', PARAMS.reverb, v => v + '%');
            this.softSet('reverbDecay', PARAMS.reverbDecay, v => parseFloat(v).toFixed(1) + 's');
            this.softSet('width', PARAMS.width, v => v + '%');
            this.syncEAX();
            Core.update();
            if (PARAMS.reverbDecay !== prevDecay || !!PARAMS.megaReverb !== prevMega || (PARAMS._eaxKey || '') !== prevKey) Core.rebuildReverb();
            else Core.updateReverbMod();
        },

        syncEAX() {
            const $ = id => document.getElementById(id);
            const on = $('n7r-eaxOn'); if (on) on.checked = !!PARAMS.eaxOn;
            const am = $('n7r-eaxAmount'); if (am) am.value = PARAMS.eaxAmount || 0;
            const av = $('n7r-eaxAmtVal'); if (av) av.textContent = String(Math.round(PARAMS.eaxAmount || 0));
            const ac = $('n7r-eaxActive'); if (ac) ac.textContent = PARAMS.eaxEnv;
            const li = document.querySelectorAll('#n7r-eaxList li');
            li.forEach(x => x.classList.toggle('sel', x.dataset.env === PARAMS.eaxEnv));
            const box = $('n7r-eaxbox'); if (box) box.classList.toggle('off', !PARAMS.eaxOn);
            const ko = $('n7r-karOn'); if (ko) ko.checked = !!PARAMS.karOn;
            const cv = $('n7r-cleanVoice'); if (cv) cv.checked = PARAMS.cleanVoice !== false;
            const w = Math.round(+PARAMS.width || 0);
            const cm = $('n7r-cmss');
            if (cm) { const hit = Object.keys(CMSS_MODES).find(k => CMSS_MODES[k] === w); cm.value = hit || 'Custom'; }
            (PARAMS.eqBands || []).forEach((v, i) => { const e = $('n7r-eqb' + i); if (e) e.value = v; });
            const lv = $('n7r-eqLevel'); if (lv) lv.value = PARAMS.eqLevel || 0;
            const lvv = $('n7r-eqLevelVal'); if (lvv) lvv.textContent = fmtDb(PARAMS.eqLevel);
            const eo = $('n7r-eqOn'); if (eo) eo.checked = PARAMS.eqOn !== false;
            const ew = $('n7r-eqwin'); if (ew) ew.classList.toggle('eqoff', PARAMS.eqOn === false);
        },

        bindEAX() {
            const $ = id => document.getElementById(id);
            const P = this.panel;
            const sc = $('n7r-tabscroll');
            const tabList = () => Array.from(P.querySelectorAll('.n7r-tab'));
            const tabIdx = () => tabList().findIndex(t => t.classList.contains('active'));
            const labelTab = () => { const t = tabList()[tabIdx()]; if (t) $('n7r-tabbar-name').textContent = t.lastChild.textContent.trim(); };
            const stepTab = d => { const a = tabList(); a[(tabIdx() + d + a.length) % a.length].click(); };
            $('n7r-tl').addEventListener('click', () => stepTab(-1));
            $('n7r-tr').addEventListener('click', () => stepTab(1));
            sc.addEventListener('click', () => setTimeout(labelTab, 0));
            const menu = $('n7r-tabmenu');
            const openEQ = () => { this.eqPanel.style.display = 'block'; this.eqPanel.classList.remove('min'); };
            this.openEQ = openEQ;
            $('n7r-tabbar').addEventListener('click', e => {
                e.stopPropagation();
                if (menu.style.display !== 'none') { menu.style.display = 'none'; return; }
                menu.innerHTML = tabList().map(t => '<div data-t="' + t.dataset.tab + '">' + t.lastChild.textContent.trim() + '</div>').join('') + '<div data-eq="1">Graphic Equalizer</div>';
                menu.style.display = 'block';
            });
            menu.addEventListener('click', e => {
                const d = e.target.closest('div[data-t],div[data-eq]'); if (!d) return;
                menu.style.display = 'none';
                if (d.dataset.eq) openEQ(); else { const b = P.querySelector('.n7r-tab[data-tab="' + d.dataset.t + '"]'); if (b) b.click(); }
            });
            document.addEventListener('click', () => { menu.style.display = 'none'; });
            const moreBtn = $('n7r-fi-more');
            moreBtn.addEventListener('click', () => P.querySelector('.n7r-footer').classList.toggle('show1'));
            P.querySelector('.n7r-fi[data-open="eq"]').addEventListener('click', openEQ);
            const goTab = t => {
                const b = P.querySelector('.n7r-tab[data-tab="' + t + '"]');
                if (!b) return;
                b.click();
                sc.scrollLeft = Math.max(0, b.offsetLeft - 60);
                P.classList.remove('n7r-collapsed');
            };
            P.querySelectorAll('.n7r-fi').forEach(b => b.addEventListener('click', () => goTab(b.dataset.goto)));
            $('n7r-fb-profile').addEventListener('click', () => goTab('pre'));
            P.querySelectorAll('.n7r-pbtn').forEach(b => b.addEventListener('click', () => { $('n7r-fb-profile').textContent = b.dataset.preset; }));
            P.querySelectorAll('.n7r-vbtn').forEach(b => b.addEventListener('click', () => { $('n7r-fb-profile').textContent = b.dataset.voice; }));
            $('n7r-help').addEventListener('click', () => this.toast('ツcore — Alt+E opens / closes the console'));
            $('n7r-min').addEventListener('click', () => {
                P.classList.toggle('n7r-collapsed');
            });

            // small helper for the new sliders
            const bindSl = (id, fmt, cb) => {
                const el = $('n7r-' + id); if (!el) return;
                const vEl = $('n7r-v-' + id);
                const run = () => { const v = parseFloat(el.value); if (vEl) vEl.textContent = fmt(v); cb(v); };
                el.addEventListener('input', run);
                if (vEl) vEl.textContent = fmt(parseFloat(el.value));
            };

            // ── Effects (environments) ──
            $('n7r-eaxOn').addEventListener('change', e => { PARAMS.eaxOn = e.target.checked; this.applyEAX(); });
            $('n7r-eaxList').addEventListener('click', e => {
                const li = e.target.closest('li'); if (!li) return;
                PARAMS.eaxEnv = li.dataset.env;
                if (PARAMS.eaxEnv !== 'None' && !(PARAMS.eaxAmount > 0)) PARAMS.eaxAmount = (EAX_PRESETS[PARAMS.eaxEnv] ? EAX_PRESETS[PARAMS.eaxEnv].amt : 50);
                this.syncEAX(); this.applyEAX();
            });
            $('n7r-eaxAmount').addEventListener('input', e => {
                PARAMS.eaxAmount = +e.target.value;
                $('n7r-eaxAmtVal').textContent = String(Math.round(PARAMS.eaxAmount));
                this.applyEAX();
            });

            // ── Karaoke ──
            $('n7r-karOn').addEventListener('change', e => {
                PARAMS.karOn = e.target.checked;
                if (PARAMS.karOn && !(PARAMS.karAmount > 0)) {
                    PARAMS.karAmount = 100; const k = $('n7r-karAmount'); if (k) { k.value = 100; } const kv = $('n7r-v-karAmount'); if (kv) kv.textContent = '100%';
                }
                Core.updateKaraoke();
            });
            bindSl('karAmount', v => v + '%', v => { PARAMS.karAmount = v; Core.updateKaraoke(); });

            // ── CMSS 3D ──
            $('n7r-cmss').addEventListener('change', e => {
                const m = CMSS_MODES[e.target.value];
                if (m === undefined) return;
                if (PARAMS._eaxSaved) PARAMS._eaxSaved.w = m;
                PARAMS.width = m; this.softSet('width', m, v => v + '%'); Core.update();
            });

            // ── THX Setup ──
            {
                let thxMode = 'Off', thxSaved = null;
                const applyThx = () => {
                    const pr = THX_PRESETS[thxMode]; if (!pr) return;
                    if (thxMode === 'Off') {
                        if (thxSaved) { PARAMS.width = thxSaved.w; PARAMS.eqBands = thxSaved.eq.slice(); thxSaved = null; }
                    } else {
                        if (!thxSaved) thxSaved = { w: +PARAMS.width || 0, eq: (PARAMS.eqBands || []).slice() };
                        const a = (+$('n7r-thxAmt').value || 0) / 100;
                        PARAMS.width = Math.round(pr.w * a);
                        PARAMS.eqBands = pr.eq.map(x => Math.round(x * a * 10) / 10);
                    }
                    if (PARAMS._eaxSaved) PARAMS._eaxSaved.w = PARAMS.width;
                    this.softSet('width', PARAMS.width, v => v + '%');
                    this.syncEAX(); Core.updateEQBands(); Core.update();
                };
                $('n7r-thxgrid').addEventListener('click', e => {
                    const b = e.target.closest('button[data-thx]'); if (!b) return;
                    thxMode = b.dataset.thx;
                    $('n7r-thxgrid').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
                    applyThx();
                    const pf = $('n7r-fb-profile'); if (pf) pf.textContent = thxMode === 'Off' ? 'Default' : 'THX ' + thxMode;
                });
                bindSl('thxAmt', v => v + '%', () => { if (thxMode !== 'Off') applyThx(); });
            }

            // ── Speaker Settings ──
            {
                const grid = $('n7r-spkgrid'), info = $('n7r-spkInfo');
                let off = {}, subCut = false, cenCut = false, hpBonus = 0;
                const render = () => {
                    const names = SPK_LAYOUTS[$('n7r-spkLayout').value] || [];
                    grid.innerHTML = names.map(k => `<button class="n7r-spkb${off[k] ? '' : ' on'}" data-k="${k}" title="${k}">${SPK_ALL[k].l}</button>`).join('');
                };
                const apply = () => {
                    const layout = $('n7r-spkLayout').value;
                    const names = SPK_LAYOUTS[layout] || [];
                    const sp = names.map(k => ({ k, d: SPK_ALL[k], on: !off[k] }));
                    const rear = sp.filter(x => x.d.rear), rearOn = rear.filter(x => x.on).length;
                    const sideL = sp.filter(x => x.d.side < 0), sideR = sp.filter(x => x.d.side > 0);
                    const lOn = sideL.filter(x => x.on).length, rOn = sideR.filter(x => x.on).length;
                    const hp = layout === 'Headphones' ? 25 : 0;
                    const w = Math.max(0, Math.min(100, (rear.length ? Math.round(70 * rearOn / rear.length) : 0) + hp));
                    const tot = sideL.length + sideR.length;
                    const pan = tot ? Math.round(100 * (rOn - lOn) / tot) : 0;
                    PARAMS.width = w; PARAMS.pan = pan;
                    if (PARAMS._eaxSaved) PARAMS._eaxSaved.w = w;
                    const sub = sp.find(x => x.d.sub), cen = sp.find(x => x.d.ctr);
                    const subOff = !!(sub && !sub.on), cenOff = !!(cen && !cen.on);
                    if (subOff !== subCut) { PARAMS.eqBass = Math.max(0, Math.min(100, PARAMS.eqBass + (subOff ? -25 : 25))); subCut = subOff; }
                    if (cenOff !== cenCut) { PARAMS.eqMid = Math.max(0, Math.min(100, PARAMS.eqMid + (cenOff ? -20 : 20))); cenCut = cenOff; }
                    this.softSet('width', w, v => v + '%');
                    this.softSet('pan', pan, v => +v === 0 ? 'C' : +v < 0 ? 'L' + Math.abs(+v) : 'R' + +v);
                    this.softSet('eqBass', PARAMS.eqBass, v => v); this.softSet('eqMid', PARAMS.eqMid, v => v);
                    const nOn = sp.filter(x => x.on).length;
                    info.textContent = nOn + ' of ' + sp.length + ' speakers on — width ' + w + '%, pan ' + (pan === 0 ? 'center' : pan < 0 ? 'L' + Math.abs(pan) : 'R' + pan);
                    Core.update();
                };
                $('n7r-spkLayout').addEventListener('change', () => { off = {}; render(); apply(); });
                grid.addEventListener('click', e => {
                    const b = e.target.closest('button[data-k]'); if (!b) return;
                    off[b.dataset.k] = !off[b.dataset.k];
                    b.classList.toggle('on', !off[b.dataset.k]);
                    apply();
                });
                render();
            }

            // ── Surround Mixer ──
            {
                const setPan = v => { PARAMS.pan = v; this.softSet('pan', v, x => +x === 0 ? 'C' : +x < 0 ? 'L' + Math.abs(+x) : 'R' + +x); Core.update(); };
                bindSl('mxPan', v => +v === 0 ? 'C' : +v < 0 ? 'L' + Math.abs(+v) : 'R' + +v, v => setPan(v));
                bindSl('mxCen', v => v, v => { PARAMS.eqMid = v; this.softSet('eqMid', v, x => x); Core.update(); });
                bindSl('mxSur', v => v + '%', v => { PARAMS.width = v; if (PARAMS._eaxSaved) PARAMS._eaxSaved.w = v; this.softSet('width', v, x => x + '%'); Core.update(); });
                bindSl('mxSub', v => v, v => { PARAMS.eqBass = v; this.softSet('eqBass', v, x => x); Core.update(); });
                bindSl('mxRear', v => v + '%', v => { PARAMS.reverb = v; this.softSet('reverb', v, x => x + '%'); Core.update(); });
                $('n7r-mxReset').addEventListener('click', () => {
                    [['mxPan',0],['mxCen',50],['mxSur',0],['mxSub',50],['mxRear',0]].forEach(([id, d]) => {
                        const el = $('n7r-' + id); if (el) { el.value = d; el.dispatchEvent(new Event('input')); }
                    });
                });
            }

            // ── EAX skin launcher ──
            $('n7r-skingrid').addEventListener('click', e => {
                const b = e.target.closest('button[data-skin]'); if (b && typeof SKIN !== 'undefined') SKIN.open(b.dataset.skin);
            });

            // ── Clean-up ──
            $('n7r-cleanVoice').addEventListener('change', e => { PARAMS.cleanVoice = e.target.checked; this.toast(e.target.checked ? '🧹 Clean voice ON (next join)' : '🧹 Clean voice OFF (next join)'); });

            // ── 9-band equalizer ──
            const sel = $('n7r-eqPreset');
            let user = {};
            try { user = JSON.parse(localStorage.getItem('n7r_eq_user') || '{}') || {}; } catch(e) { user = {}; }
            const saveUser = () => { try { localStorage.setItem('n7r_eq_user', JSON.stringify(user)); } catch(e) {} };
            const fillSel = (pick) => {
                sel.innerHTML = '';
                const add = (n, label) => { const o = document.createElement('option'); o.value = n; o.textContent = label || n; sel.appendChild(o); };
                add('Custom', '<Custom>');
                Object.keys(EQ_PRESETS).forEach(n => add(n));
                Object.keys(user).forEach(n => add('u:' + n, n));
                sel.value = pick || 'Default';
            };
            fillSel('Custom');
            const setBands = (arr, lvl) => {
                arr = arr.length > EQ_FREQS.length ? arr.slice(-EQ_FREQS.length) : arr.slice(); while (arr.length < EQ_FREQS.length) arr.unshift(0);
                PARAMS.eqBands = arr; PARAMS.eqLevel = lvl || 0;
                this.syncEAX(); Core.updateEQBands();
            };
            sel.addEventListener('change', () => {
                const v = sel.value;
                if (v === 'Custom') return;
                if (v.startsWith('u:')) { const u = user[v.slice(2)]; if (u) setBands(u.b, u.l); }
                else if (EQ_PRESETS[v]) setBands(EQ_PRESETS[v], /^(MAX POWER|ULTRA)/.test(v) ? 6 : 0);
            });
            EQ_FREQS.forEach((f, i) => {
                const el = $('n7r-eqb' + i);
                el.addEventListener('input', () => {
                    if (!Array.isArray(PARAMS.eqBands)) PARAMS.eqBands = EQ_FREQS.map(() => 0);
                    PARAMS.eqBands[i] = parseFloat(el.value); Core.updateEQBands(); sel.value = 'Custom';
                });
                el.addEventListener('dblclick', () => { el.value = 0; el.dispatchEvent(new Event('input')); });
            });
            $('n7r-eqLevel').addEventListener('input', e => { PARAMS.eqLevel = parseFloat(e.target.value); $('n7r-eqLevelVal').textContent = fmtDb(PARAMS.eqLevel); Core.updateEQBands(); });
            $('n7r-eqOn').addEventListener('change', e => { PARAMS.eqOn = e.target.checked; $('n7r-eqwin').classList.toggle('eqoff', !PARAMS.eqOn); Core.updateEQBands(); });
            $('n7r-eqHelp').addEventListener('click', () => this.toast('Graphic Equalizer — double-click a slider to reset it, blank button = shrink'));
            $('n7r-eqReset').addEventListener('click', () => this.eqPanel.classList.toggle('min'));
            $('n7r-eqClose').addEventListener('click', () => { this.eqPanel.style.display = 'none'; });
            $('n7r-eqLevel').addEventListener('dblclick', e => { e.target.value = 0; e.target.dispatchEvent(new Event('input')); });
            $('n7r-eqSave').addEventListener('click', () => {
                let n = null;
                try { n = prompt('Equalizer preset name:'); } catch(e) { n = null; }
                if (n === null || n === undefined) { if (typeof prompt === 'function') return; }
                n = (n || '').trim() || ('User ' + (Object.keys(user).length + 1));
                user[n] = { b: (PARAMS.eqBands || []).slice(), l: +PARAMS.eqLevel || 0 };
                saveUser(); fillSel('u:' + n); this.toast('💾 Saved EQ: ' + n);
            });
            $('n7r-eqDel').addEventListener('click', () => {
                const v = sel.value;
                if (!v.startsWith('u:')) { this.toast('Only your own presets can be deleted'); return; }
                delete user[v.slice(2)]; saveUser(); fillSel('Default'); setBands(EQ_PRESETS['Default'], 0);
            });
            setInterval(() => {
                if (!uiVisible) return;
                const o = $('n7r-eqDevOpt'); if (!o) return;
                const o2 = $('n7r-hdrDevOpt');
                let lbl = '';
                try { const t = Core.rawStream && Core.rawStream.getAudioTracks && Core.rawStream.getAudioTracks()[0]; lbl = t ? (t.label || 'Microphone') : ''; } catch(e) {}
                const txt = lbl || 'SB Live! 24-bit External';
                if (o.textContent !== txt) o.textContent = txt;
                if (o2 && o2.textContent !== txt) o2.textContent = txt;
            }, 1500);

            // ── footer: mute / recorder / transport ──
            $('n7r-fb-mute').addEventListener('click', () => {
                const b = this.quickBar && this.quickBar.querySelector('[data-action="mute"]'); if (b) b.click();
            });
            const ctxOK = () => window.DiscordContext && Core.dest;
            const needSong = () => { if (!Music.buffer) { this.toast('🎵 Load a song in the Music tab first'); return true; } return false; };
            $('n7r-fb-play').addEventListener('click', () => { if (needSong()) return; const p = $('n7r-music-play'); if (p) p.click(); });
            $('n7r-fb-stop').addEventListener('click', () => { if (needSong()) return; const p = $('n7r-music-stop'); if (p) p.click(); });
            const skip = d => {
                if (needSong() || !window.DiscordContext) return;
                const dur = Music.getDuration() || 0;
                const t = Math.max(0, Math.min(dur - 0.05, Music.getCurrentTime(window.DiscordContext) + d));
                Music.seek(window.DiscordContext, t);
            };
            $('n7r-fb-prev').addEventListener('click', () => skip(-10));
            $('n7r-fb-next').addEventListener('click', () => skip(10));

            // recorder: taps the processed output (voice + music) before the limiter's speaker monitor
            let rec = null, recDest = null, chunks = [];
            const stopRec = () => { try { rec && rec.state !== 'inactive' && rec.stop(); } catch(e) {} };
            $('n7r-fb-rec').addEventListener('click', () => {
                const btn = $('n7r-fb-rec');
                if (rec && rec.state !== 'inactive') { stopRec(); return; }
                if (!ctxOK() || !Core.outputLimiter) { this.toast('⚠ Join a voice channel first!'); return; }
                if (typeof MediaRecorder === 'undefined') { this.toast('Recording is not supported here'); return; }
                try {
                    recDest = window.DiscordContext.createMediaStreamDestination();
                    Core.outputLimiter.connect(recDest);
                    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find(m => MediaRecorder.isTypeSupported(m));
                    chunks = [];
                    rec = new MediaRecorder(recDest.stream, mime ? { mimeType: mime } : undefined);
                    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
                    rec.onstop = () => {
                        try { Core.outputLimiter.disconnect(recDest); } catch(e) {}
                        window.__N7R_REC_T0__ = 0; btn.classList.remove('rec');
                        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
                        chunks = [];
                        if (!blob.size) return;
                        const a = document.createElement('a');
                        const d = new Date(), p2 = n => String(n).padStart(2, '0');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'tsucore-rec-' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds()) + '.webm';
                        document.body.appendChild(a); a.click();
                        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
                        this.toast('⏺ Recording saved');
                    };
                    rec.start(1000);
                    window.__N7R_REC_T0__ = Date.now(); btn.classList.add('rec');
                    this.toast('⏺ Recording… tap REC again to stop & save');
                } catch(e) { this.toast('Could not start recording'); try { Core.outputLimiter.disconnect(recDest); } catch(_) {} }
            });

            this.syncEAX();
        },

        applyTheme(n) {
            const t = THEMES[n] || THEMES['Neon Dream'];
            Object.entries(t).forEach(([k,v]) => document.documentElement.style.setProperty('--'+k, v));
        },

        bindEvents() {
            let drag = false;
            this.button.addEventListener('mousedown', () => drag = false);
            this.button.addEventListener('mousemove', () => drag = true);
            this.button.addEventListener('click', () => { if (!drag) this.togglePanel(); });
            document.getElementById('n7r-close').addEventListener('click', () => this.togglePanelAdv());

            // Tabs
            this.panel.querySelectorAll('.n7r-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    this.panel.querySelectorAll('.n7r-tab').forEach(t => t.classList.remove('active'));
                    this.panel.querySelectorAll('.n7r-tc').forEach(c => c.classList.remove('active'));
                    tab.classList.add('active');
                    this.panel.querySelector(`.n7r-tc[data-tab="${tab.dataset.tab}"]`).classList.add('active');
                });
            });

            // Quick bar
            this.quickBar.querySelectorAll('.qb-btn').forEach(b => {
                b.addEventListener('click', () => {
                    if (b.dataset.action === 'picture') { try { SKIN.picMenu(); } catch (_e) {} return; }
                    if (b.dataset.action === 'reconnect') { try { Core.heal('manual', true); } catch (_e) {} return; }
                    if (b.dataset.action === 'miconly') {
                        const on = !PARAMS.micOnly;
                        const cb = document.getElementById('n7r-miconly');
                        if (cb) cb.checked = on;
                        this.setMicOnly(on);
                    } else
                    if (b.dataset.action === 'mute') {
                        PARAMS.masterGain = PARAMS.masterGain > 0 ? 0 : 300;
                        this.syncSliders(); Core.update(); this.toast(PARAMS.masterGain > 0 ? '🔊 Live' : '🔇 Muted');
                    } else if (b.dataset.action === 'god') {
                        const on = !PARAMS.godMode;
                        document.getElementById('n7r-god').checked = on;
                        this.setGodMode(on);
                        this.toast(on ? '👑 SB490 كرت فضي — SPIT IT!' : '👑 God Mode OFF');
                    } else if (b.dataset.action === 'listen') {
                        const on = !PARAMS.selfListen;
                        PARAMS.selfListen = on;
                        const cb = document.getElementById('n7r-selfListen');
                        if (cb) cb.checked = on;
                        if (on) {
                            if (Core.monitorDest) {
                                const ok = Monitor.start();
                                this.toast(ok ? '👂 Self Listen ON — you hear yourself!' : '⚠ Join a voice channel first!');
                                if (!ok) { PARAMS.selfListen = false; if (cb) cb.checked = false; }
                            } else { this.toast('⚠ Join a voice channel first!'); PARAMS.selfListen = false; if (cb) cb.checked = false; }
                        } else { Monitor.stop(); this.toast('👂 Self Listen OFF'); }
                        b.classList.toggle('active', PARAMS.selfListen);
                    } else if (b.dataset.action === 'save') {
                        this.savePreset();
                    }
                });
            });

            // Voice profile
            document.getElementById('n7r-vp').addEventListener('change', e => {
                const p = VOICE_PROFILES[e.target.value];
                if (p && e.target.value !== 'auto') { Object.assign(PARAMS, p); this.syncSliders(); Core.update(); }
            });

            // Theme
            document.getElementById('n7r-theme').addEventListener('change', e => {
                PARAMS.theme = e.target.value; this.applyTheme(PARAMS.theme);
            });

            // God mode
            document.getElementById('n7r-god').addEventListener('change', e => { this.setGodMode(e.target.checked); });

            // Sat mode
            document.getElementById('n7r-satmode').addEventListener('change', e => { PARAMS.satMode = e.target.checked; Core.update(); });

            // Autotune
            document.getElementById('n7r-at').addEventListener('change', e => { PARAMS.autotuneOn = e.target.checked; Core.update(); });

            // Mega Reverb
            document.getElementById('n7r-megaReverb').addEventListener('change', e => {
                PARAMS.megaReverb = e.target.checked;
                if (e.target.checked) {
                    // Force high reverb + long decay when mega kicks in
                    if (PARAMS.reverb < 60) { PARAMS.reverb = 80; }
                    if (PARAMS.reverbDecay < 6) { PARAMS.reverbDecay = 9; }
                    this.syncSliders();
                    this.toast('🌊 MEGA REVERB — cathedral engaged');
                } else {
                    this.toast('🌊 Mega Reverb OFF');
                }
                Core.update(); Core.rebuildReverb();
            });

            // Self Listen checkbox
            document.getElementById('n7r-selfListen').addEventListener('change', e => {
                PARAMS.selfListen = e.target.checked;
                if (e.target.checked) {
                    if (Core.monitorDest) {
                        const ok = Monitor.start();
                        this.toast(ok ? '👂 Self Listen ON — hearing yourself!' : '⚠ Join a voice channel first!');
                        if (!ok) { PARAMS.selfListen = false; e.target.checked = false; }
                    } else { this.toast('⚠ Join a voice channel first!'); PARAMS.selfListen = false; e.target.checked = false; }
                } else { Monitor.stop(); this.toast('👂 Self Listen OFF'); }
            });

            // Voice Protect
            document.getElementById('n7r-gainProtect').addEventListener('change', e => {
                PARAMS.gainProtect = e.target.checked;
                Core.update();
                this.toast(e.target.checked ? '🛡 Voice Protect ON' : '🛡 Voice Protect OFF — raw gain');
            });

            // Gate toggle — FIX: synced visual state on init
            const gateToggle = document.getElementById('n7r-gate');
            const gateSlider = document.getElementById('n7r-gateThreshold');
            gateToggle.addEventListener('change', e => {
                gateSlider.disabled = !e.target.checked;
                if (!e.target.checked) { PARAMS.gateThreshold = -60; Core.update(); }
            });
            gateSlider.disabled = !gateToggle.checked; // init state

            // Ducking toggle
            document.getElementById('n7r-duck').addEventListener('change', e => { PARAMS.duckingEnabled = e.target.checked; Core.update(); });
            document.getElementById('n7r-miconly').addEventListener('change', e => { this.setMicOnly(e.target.checked); });

            // Music player — FIX: proper state management
            document.getElementById('n7r-music-select').addEventListener('click', () => {
                document.getElementById('n7r-music-input').click();
            });
            document.getElementById('n7r-music-input').addEventListener('change', async e => {
                const file = e.target.files[0];
                if (!file) return;
                if (!window.DiscordContext || !Core.dest) {
                    this.toast('⚠ Join a voice channel first!'); return;
                }
                const info = document.getElementById('n7r-music-info');
                const dot  = document.getElementById('n7r-music-dot');
                info.textContent = '⏳ Loading: ' + file.name;
                dot.textContent = '⏳';
                try {
                    await Music.load(file, window.DiscordContext);
                    info.textContent = Music.fileName;
                    dot.textContent = '▶';
                    document.getElementById('n7r-music-play').disabled = false;
                    document.getElementById('n7r-music-stop').disabled = false;
                    this.toast('🎵 Now playing: ' + Music.fileName.substring(0, 30));
                } catch(err) {
                    info.textContent = '❌ Failed — try MP3/WAV';
                    dot.textContent = '✖';
                    this.toast('⚠ Music failed — try MP3/WAV');
                }
                e.target.value = '';
            });
            document.getElementById('n7r-music-play').addEventListener('click', () => {
                if (!window.DiscordContext || !Core.dest) { this.toast('⚠ Join a voice channel first!'); return; }
                if (!Music.playing && Music.buffer) {
                    Music._start(window.DiscordContext, Music.offset);
                    document.getElementById('n7r-music-dot').textContent = '▶';
                    this.toast('▶ Playing');
                }
            });
            document.getElementById('n7r-music-stop').addEventListener('click', () => {
                Music.stop();
                Music.offset = 0; // hard stop — full reset, unlike a mid-song pause
                document.getElementById('n7r-music-info').textContent = 'Stopped.';
                document.getElementById('n7r-music-dot').textContent = '⏸';
                this.toast('⏹ Music stopped');
            });

            // ── Seek bar: click to jump, drag to scrub ─────────────────────
            (() => {
                const bar = document.getElementById('n7r-music-progress-bar');
                if (!bar) return;
                const ratioAt = clientX => {
                    const rect = bar.getBoundingClientRect();
                    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                };
                const previewAt = clientX => {
                    if (!Music.buffer) return;
                    const pct = ratioAt(clientX) * 100;
                    const fill = document.getElementById('n7r-music-progress-fill');
                    const handle = document.getElementById('n7r-music-progress-handle');
                    const curEl = document.getElementById('n7r-music-time-cur');
                    if (fill) fill.style.width = pct + '%';
                    if (handle) handle.style.left = pct + '%';
                    if (curEl) curEl.textContent = fmtTime(ratioAt(clientX) * Music.getDuration());
                };
                const commitAt = clientX => {
                    if (!Music.buffer || !window.DiscordContext) return;
                    Music.seek(window.DiscordContext, ratioAt(clientX) * Music.getDuration());
                };
                bar.addEventListener('mousedown', e => {
                    if (!Music.buffer) return;
                    musicScrubbing = true;
                    bar.classList.add('n7r-scrubbing');
                    previewAt(e.clientX);
                    const onMove = ev => previewAt(ev.clientX);
                    const onUp = ev => {
                        commitAt(ev.clientX);
                        musicScrubbing = false;
                        bar.classList.remove('n7r-scrubbing');
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });
            })();
            document.getElementById('n7r-music-max').addEventListener('click', () => {
                if (!window.DiscordContext || !Core.dest) { this.toast('⚠ Join a voice channel first!'); return; }
                Music.applyMax(); this.toast('🔥 MAX MUSIC — loud & clean!');
            });

            // Presets
            this.panel.querySelectorAll('.n7r-pbtn').forEach(b => {
                b.addEventListener('click', () => {
                    const p = PRESETS[b.dataset.preset];
                    if (p) { Object.assign(PARAMS, p); this.syncSliders(); Core.update(); Core.rebuildReverb(); this.toast('Loaded: ' + b.dataset.preset); }
                });
            });
            // Voice changer buttons
            this.panel.querySelectorAll('.n7r-vbtn').forEach(b => {
                b.addEventListener('click', () => {
                    const v = VOICE_FX[b.dataset.voice]; if (!v) return;
                    Object.assign(PARAMS, VOICE_BASE, v.fx);
                    const at = document.getElementById('n7r-at'); if (at) at.checked = !!PARAMS.autotuneOn;
                    this.panel.querySelectorAll('.n7r-vbtn').forEach(x => x.classList.toggle('active', x === b));
                    this.syncSliders(); Core.update(); Core.rebuildReverb();
                    this.toast(v.icon + ' ' + b.dataset.voice);
                });
            });
            document.getElementById('n7r-save').addEventListener('click', () => this.savePreset());
            document.getElementById('n7r-reset').addEventListener('click', () => {
                Object.assign(PARAMS, PRESETS['Default']); this.syncSliders(); Core.update(); Core.rebuildReverb(); this.toast('Reset to Default');
            });
            document.getElementById('n7r-sreset').addEventListener('click', () => { Stats.reset(); });

            // All sliders
            const sliders = [
                {id:'masterGain', fn:v=>`+${v} dB`},
                {id:'gain2',      fn:v=>`+${v} dB`},
                {id:'gain3',      fn:v=>`+${v} dB`},
                {id:'inputBoost', fn:v=>`+${v} dB`},
                {id:'pitch',      fn:v=>`${Math.round((v-50)*2)}%`},
                {id:'pan',        fn:v=>+v===0?'C':+v<0?'L'+Math.abs(+v):'R'+ +v},
                {id:'eqBass',     fn:v=>`${Math.round((v-50)*0.24)} dB`},
                {id:'eqMid',      fn:v=>`${Math.round((v-50)*0.24)} dB`},
                {id:'eqTreble',   fn:v=>`${Math.round((v-50)*0.24)} dB`},
                {id:'airAmount',  fn:v=>`${v}%`},
                {id:'reverb',     fn:v=>`${v}%`},
                {id:'reverbDecay',fn:v=>`${parseFloat(v).toFixed(1)}s`,rebuild:true},
                {id:'distortion', fn:v=>`${v}%`},
                {id:'tafleh',     fn:v=>`${v}%`, tafleh:true},
                {id:'autotuneSpeed',fn:v=>`${(v*100).toFixed(0)}%`},
                {id:'width',      fn:v=>`${v}%`},
                {id:'noiseReduction',fn:v=>`${v}%`},
                {id:'gateThreshold',fn:v=>`${v} dB`},
                {id:'duckingReduction',fn:v=>`${v} dB`},
                {id:'musicVolume',fn:v=>`${Math.round(v*100)}%`,music:true},
                {id:'musicReverb',fn:v=>`${v}%`,musicReverb:true},
                {id:'selfListenVolume',fn:v=>`${v}%`,listen:true}
            ];
            sliders.forEach(s => {
                const el = document.getElementById('n7r-' + s.id);
                if (!el) return;
                const run = () => {
                    const v = parseFloat(el.value);
                    if (s.music) { Music.setVolume(v); }
                    else if (s.musicReverb) { PARAMS.musicReverb = v; Core.updateMusicGain(); }
                    else if (s.listen) { Monitor.setVolume(v); }
                    else if (s.tafleh) { if (v !== (+PARAMS.tafleh || 0)) UI.setTafleh(v); }
                    else { PARAMS[s.id] = v; Core.update(); if (s.rebuild) Core.rebuildReverb(); }
                    const vEl = document.getElementById('n7r-v-' + s.id);
                    if (vEl) vEl.textContent = s.fn(v);
                };
                el.addEventListener('input', run);
                run();
            });
        },

        syncSliders() {
            const ids = ['masterGain','gain2','gain3','inputBoost','pitch','pan',
                         'eqBass','eqMid','eqTreble','airAmount','reverb','reverbDecay',
                         'distortion','width','noiseReduction','gateThreshold','duckingReduction','autotuneSpeed',
                         'selfListenVolume'];
            ids.forEach(id => {
                const el = document.getElementById('n7r-' + id);
                if (el) { el.value = PARAMS[id] ?? 0; el.dispatchEvent(new Event('input')); }
            });
            try { if (UI.syncEAX) UI.syncEAX(); } catch(e) {}
        },

        updateMeter(peak) {
            const db = peak < 0.001 ? -60 : 20 * Math.log10(peak);
            Stats.update(db);
            vuPeak = Math.max(vuPeak, Math.min(1, peak));
        },

        updateVU() {
            const bar = document.getElementById('n7r-vu-bar');
            if (bar) { bar.style.width = (vuPeak * 100) + '%'; }
            vuPeak *= 0.9;
        },

        // Progress/seek bar for the music player. Skipped entirely while the
        // user is actively dragging the handle so our own render loop doesn't
        // fight their mouse.
        updateMusicProgress() {
            if (musicScrubbing) return;
            const fill = document.getElementById('n7r-music-progress-fill');
            const handle = document.getElementById('n7r-music-progress-handle');
            const curEl = document.getElementById('n7r-music-time-cur');
            const durEl = document.getElementById('n7r-music-time-dur');
            if (!fill || !Music.buffer) {
                if (fill) fill.style.width = '0%';
                if (handle) handle.style.left = '0%';
                if (curEl) curEl.textContent = '0:00';
                if (durEl) durEl.textContent = '0:00';
                return;
            }
            const dur = Music.getDuration();
            const cur = Music.getCurrentTime(window.DiscordContext);
            const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
            fill.style.width = pct + '%';
            if (handle) handle.style.left = pct + '%';
            if (curEl) curEl.textContent = fmtTime(cur);
            if (durEl) durEl.textContent = fmtTime(dur);
        },

        drawSpectrum() {
            const c = document.getElementById('n7r-spec'); if (!c) return;
            const ctx = c.getContext('2d'); const d = Core.getSpectrum();
            ctx.clearRect(0, 0, c.width, c.height);
            const bw = c.width / 64;
            for (let i = 0; i < 64; i++) {
                const v = d[i] / 255;
                ctx.fillStyle = `hsl(${200 + v*120},100%,60%)`;
                ctx.fillRect(i*bw, c.height - v*c.height, bw-1, v*c.height);
            }
        },

        drawEQ() {
            const c = document.getElementById('n7r-eq'); if (!c) return;
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
            const b = PARAMS.eqBass/50, m = PARAMS.eqMid/50, t = PARAMS.eqTreble/50;
            for (let x = 0; x < c.width; x++) {
                const p = x / c.width;
                let g = p < .33 ? b*(1-p/.33)+1*(p/.33) : p < .66 ? 1*(1-(p-.33)/.33)+m*((p-.33)/.33) : m*(1-(p-.66)/.34)+t*((p-.66)/.34);
                const y = c.height - (g * c.height / 2.5);
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.beginPath(); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
            ctx.moveTo(0, c.height - c.height/2.5); ctx.lineTo(c.width, c.height - c.height/2.5); ctx.stroke();
        },

        updateStats() {
            const el = document.getElementById('n7r-stats'); if (!el) return;
            const s = Stats.get();
            el.textContent = `🎤 Speaking: ${s.time}\n📊 Avg Level: ${s.avg}\n📈 Peak Level: ${s.peak}`;
        },

        skinOn: false,
        togglePanel() {
            if (typeof SKIN === 'undefined') return this.togglePanelAdv();
            this.skinOn = !this.skinOn;
            this.button.classList.toggle('active', this.skinOn);
            if (!this.skinOn) { SKIN.ids.forEach(id => SKIN.close(id)); return; }
            const vw = window.innerWidth, sc = Math.min(1, (vw - 8) / 500);
            const w = 500 * sc, side = vw >= 2 * w + 24;
            SKIN.open('effects', { left: Math.max(4, side ? (vw - 2 * w - 12) / 2 : (vw - w) / 2), top: 56 });
            SKIN.open('eq', side ? { left: (vw - 2 * w - 12) / 2 + w + 12, top: 56 }
                                 : { left: Math.max(4, (vw - w) / 2), top: 56 + 368 * sc + 8 });
        },
        togglePanelAdv() {
            uiVisible = !uiVisible;
            this.panel.style.display = uiVisible ? 'block' : 'none';
            this.button.classList.toggle('active', uiVisible);
            if (!uiVisible && this.eqPanel) this.eqPanel.style.display = 'none';
            if (uiVisible) {
                const r = this.button.getBoundingClientRect();
                const rt = Math.max(8, window.innerWidth - r.right);
                this.panel.style.top  = (r.bottom + 10) + 'px';
                this.panel.style.right = rt + 'px';
                this.panel.style.left = 'auto';
                if (this.eqPanel) {
                    this.eqPanel.style.top = (r.bottom + 10) + 'px';
                    const rr = rt + 500 + 14;
                    if (window.innerWidth - rr - 520 >= 0) { this.eqPanel.style.right = rr + 'px'; this.eqPanel.style.left = 'auto'; }
                    else { this.eqPanel.style.left = '10px'; this.eqPanel.style.right = 'auto'; this.eqPanel.style.top = (r.bottom + 40) + 'px'; }
                    this.eqPanel.style.display = 'block';
                }
                const lt = document.getElementById('n7r-tabbar-name'); if (lt) { const t = this.panel.querySelector('.n7r-tab.active'); if (t) lt.textContent = t.lastChild.textContent.trim(); }
            }
        },

        setStatus(s) {
            const badge = document.getElementById('n7r-status');
            if (!badge) return;
            badge.classList.toggle('active', s === 'ACTIVE');
            badge.classList.toggle('basic',  s === 'BASIC');
            badge.title = s;
        },

        toast(msg) {
            const t = document.createElement('div'); t.className = 'n7r-toast'; t.textContent = msg;
            document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
        },

        setTafleh(amt) {
            amt = Math.max(0, Math.min(100, +amt || 0));
            const was = +PARAMS.tafleh || 0;
            PARAMS.tafleh = amt;
            if (amt > 0) {
                if (!PARAMS._tafSavedReverb) PARAMS._tafSavedReverb = { r: PARAMS.reverb, d: PARAMS.reverbDecay };
                PARAMS.reverb = Math.max(PARAMS._tafSavedReverb.r, Math.min(100, amt * 1.4));
                PARAMS.reverbDecay = Math.max(PARAMS._tafSavedReverb.d, 1 + amt * 0.11);
            } else if (PARAMS._tafSavedReverb) {
                PARAMS.reverb = PARAMS._tafSavedReverb.r;
                PARAMS.reverbDecay = PARAMS._tafSavedReverb.d;
                PARAMS._tafSavedReverb = null;
            }
            Core.update();
            if (Math.abs(amt - was) >= 3 || amt === 0) { Core.rebuildReverb(); }
            this.syncSliders();
        },
        setMicOnly(on) {
            PARAMS.micOnly = on;
            // FIX: no live applyConstraints() here. Changing echoCancellation on a running
            // capture makes Android restart the mic (and switch the headset between
            // call/media modes), which is an audible dropout. The gate still switches
            // instantly; the browser's echo-cancel setting applies the next time you join voice.
            Core.update();
            this.toast(on ? "🎯 MIC ONLY ON — only YOUR voice passes" : "🎯 Mic Only OFF");
        },


        setGodMode(on) {
            PARAMS.godMode = on;
            if (on) {
                PARAMS._godSavedReverb = { r: PARAMS.reverb, d: PARAMS.reverbDecay };
                PARAMS.reverb = 100; PARAMS.reverbDecay = 10;
            } else if (PARAMS._godSavedReverb) {
                PARAMS.reverb = PARAMS._godSavedReverb.r;
                PARAMS.reverbDecay = PARAMS._godSavedReverb.d;
                PARAMS._godSavedReverb = null;
            }
            Core.update(); Core.rebuildReverb(); this.syncSliders();
        },

        savePreset() {
            let n = null;
            try { n = prompt('Preset name:'); } catch(e) { n = null; }
            if (n === null || n === undefined) { if (typeof prompt === 'function') return; }
            if (!n) n = 'Custom ' + (Object.keys(PRESETS).length + 1);
            const p = {};
            Object.keys(PARAMS).forEach(k => { if (typeof PARAMS[k] === 'number') p[k] = PARAMS[k]; });
            PRESETS[n] = p;
            const grid = this.panel.querySelector('.n7r-pgrid');
            if (grid) {
                grid.innerHTML = Object.keys(PRESETS).map(name => `<button class="n7r-pbtn" data-preset="${name}">${name}</button>`).join('');
                grid.querySelectorAll('.n7r-pbtn').forEach(b => {
                    b.addEventListener('click', () => {
                        const pr = PRESETS[b.dataset.preset];
                        if (pr) { Object.assign(PARAMS, pr); this.syncSliders(); Core.update(); Core.rebuildReverb(); this.toast('Loaded: ' + b.dataset.preset); }
                    });
                });
            }
            this.toast('Saved: ' + n);
        },

        // FIX: makeDraggable takes explicit target to move — no more wrong parent grab
        makeDraggable(handle, target) {
            let sx, sy, on = false;
            handle.addEventListener('mousedown', e => {
                if (e.target.closest('button,select,input,label,a')) return;
                on = true;
                const r = target.getBoundingClientRect();
                sx = e.clientX - r.left; sy = e.clientY - r.top;
                e.preventDefault();
            });
            document.addEventListener('mousemove', e => {
                if (!on) return;
                target.style.left  = (e.clientX - sx) + 'px';
                target.style.top   = (e.clientY - sy) + 'px';
                target.style.right = 'auto';
            });
            document.addEventListener('mouseup', () => on = false);
        }
    };


    // ─── EXE artwork (embedded so Discord's CSP can never block it) ───
    const SKIN_IMG = {"ex_cleanup.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAFQCAMAAAB+hXxAAAADAFBMVEXo6OgLCwvn5+cQAHoWFBUC2f4kIyQAR/7o6Ojo6OgAOfo4Nzn+/f7o6OgpAP/o6Ojo6OgPBo4BxvADJtQBttYBtv+0tLQIFrBZWFSLioXZ2dp76v834v4IAVMIHMbKycsBpP8AbP9GRkd3d3jo6OghFY2Eeb9KPJxCb/9lZmapqKMSU/+VlpYqJxb/AAB7nP0Jev8o0e2Fovs4lP6eoaE2yvlaAADOAAAGiP551fx0jesFmP8oiak3Z/p7xP8ROENUs/8NFCpCVdXM5e+CgX3I2eY3qP+3yeIQIimtq8sTRVQSqMaFg9MUmrk3c/k4tv/Y9/1IR7NRp/4ShqO2w8seJbEplbATJ0UTVW8VZ4F7uP+61eUottImwdkJBzBOQZwSdYo3PUyYrN8VNmoYNdMB6/8kpr52ZvWftMCtudOgtOMUSYEzI5EjeIxPevlThu9I4/yDm/P+swBOYm8KFEwGaL1Q2O97fPuPmLKGn9HdcAANF2kPJmNKW4A3YpMypsRsLQxjVah4bbhkjNyN7f3DUAHykwD5owAkVnMjZXNadZBehJ5Ny+JjTvX/0gb/6RwQXaUTatkuCyshR3cnZbJlb4p3fKCHNAqPyee5/P8YPIwmcqUuhuVWFhVQrcNnxdtz9f+QQxCM2ueX/P+hnZ+55fThsSP/7lgpGUZSIiFVWGpOda17nsZ8q713ou9pu96UZSWhNgC1YQDOYAD/+aEAUZt7HBhgXF5jlrWEXTGPenQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACELkbxAAABAHRSTlMB//7//////7hv////Mf+STv/////////////////////////L////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF4qpiAAAIrtJREFUeNrtnYeD1EaWxqUa0dONpun2nNGpte4TSO2gRrtm7OHOjGFZbhjPAAaPlznAO4ANPmPAa5McwGmdc/Y67G28zXlvw8W/7qoUq0qlzkHd/T6YbrVy1a/eq1clqSTJkfaroDHW/pi0RCHP5RTQmCqn7t+/n4NuqSpZAholtWHmxJ5zEXYfupUD4uPMPOCeC6hLAXPIw9GDbrWsAHtInUC3GDM3UXMZjZcCkAxaOkUdQ9/P1uYGRmqYREZLiAUaRhbooyK5ZXqWbnEOukvoIXUMXWXrc8PJ4d2r55b9/Z7Gq2q4FBiRfFeA55jeVF0z4uJhGnVzSNAroyFFTrppNcWUHXqBqqvdMvepE+j7Fc7SdVmuaK5tu/ZSTpWVFVnWUEVZXFxcIlpcxD+xLGVxRXHxhC3jPXmz8Foryoo2LOhyFsU3nZLQVT2niDfN2Qr9S9e7h46pY1OXZKZx7lk6pno652qfz5u2fXVxcV0xUUVeWomOP4/5zssK+Wd41PG5meE8rSfuvf2GKIaevdaxLHM8dQyda0A7uYirpTuObkWbMNDxUodteHdu6pLKZ7Bhqehh2TXVyum6q+jakoyhu8ra8rzmerIxYGNJWdVXF2UbedR/oeBQwJRXFxXP4w8jfzML/au0ktBVPSSbs+Zx7pmulRNbuqN3D52Y0/79ksqfqOEoSFPQOVuTlVW38t9aTibQl9fpUK0ir8gG+fAg6/KyYpk5JfD8KC7Ftk32b9m2RX57ZdX/COfQS/zfttpX6JpglqY1WL/Rwh5A19XIsLEHdRzsMFUhdJXNmE48vO9EVVUAfV7+HCnX3GuavLjqINd2vTp9bemqNj8/f7Vieo0yRdaRIa/KDgqory6uLMkuoqFbBt7YUBTXtCuGjWfU8XaKZvtzTIta4lb8Gg9XKK7VHXSNYNJiVhw0LYldi7cLGNOfSn+hOzFY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", "ex_cmss.png": "data:image/png;base64,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", "ex_effects.png": "data:image/png;base64,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", "ex_eq.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAEuCAMAAABPrRDxAAADAFBMVEXo6OgSExLo6OgUAnro6OglJSUF2Pvo6OgESPvn5+fo6OgEOvb5+vk6OTosAvyrqqkFxu4UB41ZWFQFttPY19jo6OiLiIWXl5dIR0jIxsgMAlV76Pt4eXg74vsKJMm6ubro6OgkF42Eer1nZWRMPpxEcPz8AgQUU/t7mvo5lvwNe/wMGbINiPwEAgSEovx2uPYMHsQFaPsJuPsJqPsy1/UJmPw1yPAEXtR61/oqiKgGY9V8yPxSqPw6aPgbNs1EVtNVtPuMxPo7ufwQFTIVPUo8qPx7rfwYmritqssWRlR8it5KSLEWND4Tp8eFg844dPYhKLIXVnAR5fctla8VdYkWhqNQQpwUKEQqudJI4/uQ9vwOCTP4qgQYN2sZZ3kso7x3Z/I2JZEmWfxIdazL1fIzZZkleIpPzebXawTc7PzR+PwOFVFpjvSkzPwXSoUE/Pwpq8NVhfR0jacRGWwTKGQaaZo0hPlOYsxS3PFkVqeqvNSt+/zBUQXvkwREXoFch65mlq6HNg2Ec9z86B8cPowESNAUW6YkZnIkZr5kTPh4bLRwmMiQpcCUsvyL6/mm5Pr8ugQcSXExETEsPnQsVoQvdadUIhxMrtRIstBkLhd3MQlmdoZ8ffxkwtSOYyyEmvyM2eTfsSf8zQf87VkEGPwwDBA0GEwgLmAnSXQkWGhUECBIlOR8crx4pMxw9vyQRBSEhvyEnsSgOAS0YgT82BD8+KAcQrQEgswEmtQ0Xsw8YsxUPix8HhyMalSUusy80tzcegQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABZrn0CAAABAHRSTlMA/yX/cv//lf/8s/////////////9L/////////////8v/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABtHoYAAAH4RJREFUeNrtnYdj3MaVxneXBKmhCGENgigr6EAbdmgppHVUYSTFzjmWEolnyj5KolUdyZZlyXKvZzt2bMeJS4rj9N57vVzK9fan3cygzaDPLrC7AOZR2l0s3gyx+OF7894AWLbavh0TudXYjgWkWwRyQWjDf9zqaIJ47NixEHRdFNEablUyBpkjMQs+dge6LnDidWbuchdc6i2XOd+H1YOu5zYXu0cdQddJmcsv747YyzLfxZVXOkEdQj9Gjub2nd2piHXvtMd+F8hVsXZuerqshwL0gNA96hC6SAr9mb3d7e9NncWsz56dOjd1fQeEvv+Z8YeuVsOiyZOoiwlStskVoiwOytyhjqDjKO93dXn/3gNfuuv6nut3HbjqvvjSgb1LlysAvRKlUxS6KCeVyYJJLcny4NAhdSj1Vpv+lZdXlnY/vvORpUd2Pr7bf7G0cnns92Y1oEe3UrADALps27KeAL2t23Th3b/UW2II+uLKxx9/4ZGVR154/OP+i5VFDr2srRRlH6OuGQAYmi7EK92WB4eO6vVjx1oivQ2Xt2x57It3PLT40B1ffMx/sWVrfaBLA/wOqq0kJXeVuC66lbIPQNAAsG0ANDEWumhSqPqJ8HhYaItiGPozH4+1Z/zDzTRR/DGhuS1NvGm66axwYhA6KJ1XsvO229R2n9GxLNv4kzifTvZaoSfYwEa/wAxaoe7lfNAltMelYLeH9r8Ug91zlpxmQeO0thLV0n/tvpMbOgEWAPTLAYgN74JIN81Vx4vks2uwpzD0hD3rvm0rmqkpkAEw4TNuqjsbqUmmqsDNUvGnBdBfg5ssWOht7CfCpqbmdCEpkLqmoY+M3U2AnwzntxgOdBVoQStJMk1DzQOdgJAALlbAUjzYlLYS+V/yXkvh/jKgi8RADeG0ZQDcpgKCDtM820YDvSjINit0U0MJvyhrGgW9HQtdj/y4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", "ex_mixer.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAEuCAMAAABPrRDxAAADAFBMVEXo6OgMCwwQAHoXFhYC2f7o5+gAR/7o6Ojo6OgnJycAOv39/f04NzghHyHo6OgAtv8pAP/o6OgPBY4IFbDo6OgBx/AAov8Aa/0AtdUALuUEJM+srKzY2NiLioUIAFR66f7o6Og54/9WVlZGRkbJyMkhFI2Eeb5gXE9KPJx4eHi5uLr+AAZCb/9mZmUOU/15mfsFePoDh/qVlpX/92OHo/s3k/0u1fXOAAAFlf172f6foJ9aAAAONdQ5uP9UtP40y/R7uv84Z/rS5v+90/goiKqS1v0nT084pP57y//W/v9CV9rfurgLEi4VeI0URlL8iowQPEkTmLdSqP+tqs57iuGUu/ONxvczd/Uokq4YTXkfJK5KQ62Fg9C9w/QYYXMRJTj9394XwNuccmmLmOu65///sQATMTzO2/gUbYYA5P/6ur1CS8CXAACttu8iWvMGHMgYiZwToL0gEA8lpr4iwNpQd/X/z84IDC4QKl8QqsoyI5ClICH/ICH/MDFCx951ZvSyAABjpu/ZbAD1mJUIFEoUOG8Fac5C4/+9TQD/EBAhZb0leZlGW3hW3e/3ogAQHHMxYZxjed7eZWPcq6f/RUL/VVIxgt5OQZxfUaX/dXMxpMIxvtZ7ff+MEBCEcd+9RULSmpz6qq0QQZRjS/t3a7Vjw9bGMDHaiozvjgBKrs61EBC9iozWEBDGy/f/ZWNrXa17cb3WRULWVVIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABnGkkfAAABAHRSTlMB//////3/by///////5L//0r//8z//////////////7P//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmxQbEwAAJARJREFUeNrtnYuD28SZwOX1DrKzWm3MeZO0sh0jC4q8KMkqIYHlERoIhSPZJM0RkivkASQNHHChCa+mLSlQoLwLbWlLKX2/79rrX3jfjCRbkm3pG1mStfZ82fghjWbG+s33Go1sqdST44qQKZbjfdKSD/niYlnIlMqicvz48RD0jqLQPYvVAsqikOHCoeZV0OdqD7sDvVOlxIvJXMgIDeA078C96lJn0DuLDLnDvDNUxOkunCgdtLjYy4sOdQq946i5g70JG6gTCD6WGsK8b2DrrgSpA/Tj5RB05REQpdp/7GwA6F/ZKFJC0+vonZCB9ktVSUwdoCt95lAVQN+5Y3V1xz330sc97PEFgF70cf+V5saQ8gB0paMMHdhVxfLtqCq6MqaiM+pVBv14ueynDtD3rN7/+psnDqze/+Dqw+xx54aAXiqihFOnQeiKXi0PP3TRLPvf6fr40JXFMqi6VKoG8zk4d/fcevbxiw8c2HL/g7edYI/fB+hFT0QBevE6BayCIL8C0EMJtFXtce3olqV3eocEoMNeK5h4J1d1SQnNyAD079/90OOHbz+wdP+DW06wRwF9DOihXoahK7pHdrGzZhBi2J3F4Zpu6eNDr4KKHz8uKeUB6Hff5UFfYtCXpgm6NmSTpkWUj9qZAnRd8bBWNUIsi5A1d0u5GoCumAFUNL/mRw5hcVlRYqEvB6B3TJOONzbodDA3uulsKFvwouMv4itjuS8UKNPruWKWy/19VXawDtuqFju+VzE3dI1i0vqsQtC0Qexa/ziXsf+xnC10qw+WEK1UAvLlIdBBs5uB41B5vOJ/dlMhqElSSoPQ//LJ428eZLippr/+5t0edNswmwbgaVBWmknPi2kaNrwhttlkW2mRBgXaL9OoOi9MwzRt4nomk0A91QY9o7ZZ7mjQgAWblIYNhXwV80LXeo/aCOjDld9/nP8xY+iK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", "ex_speaker.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAFQCAMAAAB+hXxAAAADAFBMVEXo6OgVEhXo6Oj/+r4SAH7+6bHo6Oj//9Dn5+cD2P4mJSbo6Ojo6Ojo6OgBSP8APfz49Pj92qW6s6stAP85Ojn/0JwCxO/+x5USB4umm4dGREYAtdbo6Oh/6f9XVlc94P/X2NeLioN5eHbHyMgJAVT6t4epqKmamZYYUf8JH8AkFoqAesBlW0pJP5tAcP/KwatpZ2EFJ9AzPUPVm3eOi35+nPytlHwKfP/mo3wAAAA00vOyhmoJGbSAoP4GpP/b0L/Gj2zrrYEAZ/4/kf9DOCerelsHlP8Us+Q/QU5/gIMGhv9+1P5AVdKHalZ/w/9Tsvssh6g/o/8UOUQ9xPk+aPo/tP98iuXZpnwOFDMbM7UbOdYow9yBgc6uqsi+yM4URVMUdIYtkq9Sp/+Sd2IWl7cVo8BHRrC3ucbRp4EZLDiAm/L5AgJ/uP8VhaITVHIRJ2Qso70LCjXNt44XSoMkZXQnd40qs8x5Z/QNFl04JI5qTkI2dfWTOTSNSUPymABShvRkVafacAD+rQAXOGwNas3aDg0pVXk0ZJpSYHZS1el/cL+sNDDBUAIkQHYkZbxJyd1vLw5/ff+INwmGVkmH09+F7/20IB3/0Qf/5x8SX6QYZ4UzDDBkTftkwNLGYAD/ugAgL2BSIRtKVmOOQxKPYyq3FRSh9vzKHRvesCf/7Vg2GElSECBOda1H4ft0PTp7bbZndYZkkM5y9f+kNQDFv+HA9f8tP3Y2g/JOiM1/HxtklbYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00bYOAAABAHRSTlMA/2z///8m//3//422S///////////////////z///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdlOrggAAMZtJREFUeNrtnYlj28aZ6ElQJMc8EhOmxJJhERIUwbzGXXMlhZHNNpayViylT9usezjvufGxtmsnWTuJczZ30qb3fd/X2+127317vOuve3MCM4PBRYKyJM4nmwcwGID44fvmm+ubTNaVp1qtlfq+lJUIqc+PtCaWpzzSGRd5/T9KpayWQyql0lNPPSVB3z5Twnu0HCCJbx/OIH32sBPo2yVN/OBJfNOOSkDIvUSpZyjz8Iz0Dd6Pip6oSIfcXeoIestTc0ddInT0Ld5/stKalDqE/hRXmg9woV8vHTzoxw+KKMpRdfWktW1tt/g6igx9YuoQOl+eQ+iW0wOgY9qlAwa9ezDE7zzVW/UAVR7yO1asluzHrSQT5NBB6gj6U1lB0+sOgMw78MWpHyzoB6Lq5Ie+YgXVlEu28M2yhOPOTFDLR148VPVMVjjlIGv3QM+2LMs2AXDvY2f/382DAd1/laWhB6BlDYdWKwB6dnsoHHfmzJkJmGNVz7RE6PVuD9hDy9peqW87oNPS0Gd8lSuWi3F7AAvW3mC7pNb0oSW2tpQQ90SCjoE+3FOZlnAJA6vrANseIuz1ugUfAB56y7bRiW0o2PTX4Qd8vI2TWTZ+KeGEKIWbkKTFdqwEt0E7wks9i7KlR9PzYJeCni9V6GZ8QqZpTrQv0VVaKy5GWLAOhwAMAqDbdRn6RJIttWTo290uGAwRdKvVqrdMQp1AH/Tsbg9S6AzsAUCYOl27i1EBgMsreB9sdEC3Z9sDC26Gb9RY2DCtCXfV4cFwn20D+E7fSlmUq9OBPxYlKZnwcPSBnS/Z7TQRD9ODItExFdhZYpMcxg42hX3uZ37v9NA5sNCNgtmSe+mDXlrpZpNBP9PaXiFOw3Y9HHq9O+x1hoQ6wu5g6hj6CsCami2BFQK4xwoZ00HPACLW7cBtJUCe1WGHbMSPjYWPzQ4G9JpJGvqG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", "ex_thx.png": "data:image/png;base64,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ZfHAAw/w6KOPEgQB9957LzvvvDMzZszg6quv5rzzzuPzn/882WyWE088sSJh+5prruHqq6/mD3/4A8cffzy33347AwcORNM07r33Xvr168ecOXP43ve+xznnnMMJJ5xAPB5n3bp1nHXWWQRBwFe+8hWOPfZYFEXhS1/6EoVCgYMPPpjvfOc7cn4/8cQTaW5u5t5770VVVa677jpee+01HnroIQYNGsTjjz/OnDlzuPrqq/nGN77B8uXLaW5u5q677gLglltuYfLkyfz+97+nqakJ3/d57rnnuOWWW1izZg333HMPS5Ys4etf/7p0aLe1w9iX0nA0JBP9Ec6ucFaCwKdYqNRsUdDLwCxcz/RotYyqqnLhisUSZfrWKycFxTF0Hcd2URVVbi92HJWb3dY3TGTvi3JHy7Jobm5myZIlZDIZCUb+/ve/S8rutdde46c//Sl1dXVcf/31NDY2snz5cn784x+Ty+W46qqr2HfffSkUCpx11lkkk0mZm/G73/2OSy65hIEDB3LllVeiqiqPPfYYjzzyCI8++iiPP/44hxxyCJdeeimDBg2is7OTUaNG8f777+N5Hu3t7RQKBYYMGcK1115LJpNh9erVXHzxxaTTaUzTpDHTwD333IOqqsycOZPbbruNWCzGL37xC0aOHMnLL7/M22+/zemnn87Ul6dwxRVXcM4553DBBRdwyimncNZZZ2GaJt///vdZsmQJf/nLX2hrayMej3P33Xfz1FNPkclkPkQ3xx2DIZGIPAj+p5JaqyeLIAiwLIvOzk5GjhzJnDlzME1TVjYIJ+T5559n1qxZDBw4kDvuuIOXXnoJz/PYc889yWazBEHAFVdcQUdHB1/96lf54he/SCaT4e677+bMM8/E8zzmzJnDz372MxzH4Z577uGmm26ira2NL3/5y3R3d3P55ZezcOFCfvzjH3PJJZdQLBb5zne+Q6FQoKmpiRtvvJH33nuPL33pS/zwhz/k2muvJZFIyLi6qGKo2Y4frnEch/Hjx/Piiy8Sj8e5+eabeeONN/B9n5tuuomOjg4uueQSenp6mDRpEk8++SRTp04ln8/zve99j/r6ek477TRM0ySVSkngmk6naW1tpaGhgUGDBpHJZPjggw8YNmwYnudx991343kehx56KFdeeSXpdJp//vOfPP744+yyyy48+uijnHLKKUyePJmlS5di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//79aWhoYMiQIXKi7t+/P9dddx0bNmygpaWFZ555huOPP54XXniBuro65s6dy6677sp1111HIpFg/PjxXH/99bz66qv86le/4o9//KMsi3/ooYe47bbbwiaense8efP42te+JsdeU1MTmUxGhl+7u7uJx+M1UPIxMZH0OWbMGH784x8Ti8V49913eeedd3jggQe47bbb6Ojo4KijjuL+++/n61//Orvvvjtvv/02Cxcu5IQTTuCYY45h6dKl3HXXXcRiMXRdp62tjQEDBpBKpSiVSnzve9/Dsiwsy2LcuHHcfvvtXHrppaxdu5YJEyYwd+5c6urqJFMYj8cZNWoUd911F1/+8pdlCH/MmDEsXLiQZcuW8Ytf/IIgCBg+fDirV69m2rRp3HjjjRQKBQYNGsStt95KQ0MDjY2NJBIJGhoaUFWVfv364fs+L730EjfddBOFQoGhQ4dy8803M3z4cMlYWpbFiBEj+M1vfsM3v/lN1q5dy+23305TU5NkGLc1oIyGWgQjK6QGhFNUncZR3e8nWjIdBSbKIYeMDxTCxlOaalAqunywZDnNzf1IpdM4jo2ua+hmWeIclSCgQpgmGr7ZHjxE8a9I2lQUhWuvvZYgCMjn83R3d/PrX/+a3/zmN7S1tdHZ2UmpVOL+++9nwIABnHHGGZRKJZqbm7nnnntobW3lvPPOIxaLydLcl19+mfHjx3P2/53Feed+jYkTJzJr1iwOPfRQWaFw9913c9ddd3H66adLPRLXdcnn89xwww3E43GJgu+66y6am5u58MILpUru3Xffzdlnn83bb7/NokWLJG2ZSqW45ZZbSKfTfPGLX0RVVZYuXcrDDz/MueeeS0NDA3feeSd33nknZ555JpMmTWLUqFE4jsNbb73FrFmzuOGGGzjllFPo6uriT3/6Ew888ADTpk2Tuis7uhcmMuBFGV84Lj7+IRvP82QpoZj4heNgGAYrV67klFNOYejQoXiex8qVK3n88cc56qij2GOPPVAURU6+zc3NqKrKxo0b2WOPPejfvz+GYTBnzhxeeOEFTjjhBObOnUtPTw/FYpERI0Zw9NFHyzH9+OOPE4/HOfHEE3nzzTdpampi6dKlrFq1inPOOQfP85g5cyYLFizgc5/7HDNmzGDjxo3stddepFIpZsyYIRVhRVl7Tal1xzbhKCaTSY455hjJ5r344ous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ZJa+/t///d8IIXjyk59MvV7n8Y9/PLOzs8RxzMzMDKef/gaCoMBdd93Dc597kmktDQ7SaLRYtmwZL3vZy7jrrru49JJL2bZtB+1Wi6c85USe9KQncettt/G85z2PW269lbEVq/jzP/9zJicn+e53v8umTZs47olPolarpco2kyR/8otfyvDwMH19fVTKJf72b0/jBS94QXYP+77P//zP/2RtklarxbHHHsvY2Bi33XYbL33pSzn88MPRWrNx40a+//0LieMEx/Go15sceuhhvOQlL+Pcc8/lCU/4Cx73uMcxPz/P2NgK/vu//5sVK1bwvOc9n/7+foaHf8bc3BwnnXQSIyMjfPrTn2Z+fp6ZmRne9773cc011zAxMcFJJ53E7bffzsc//nGklJlCplAosGPHDk455RSWL1/Ou971Lo466ijqdUMKLpfLzM7O8pa3vIWbbrqJgYEBTj31VJrNZtbm2bZtGy9+8Yt5znOew/vf/36aTRMxMj8/zwknnMCqVav48Y9/zPLlyznllFMol8uMjIzwve99j5NPPpmD169HqYSDDjqIH/7gh8wvzGdjUD7U9Y81T8rfdwLdVxWV70Uv9b6LOQpLPR6I9tEjZeI9sO0dFrRbvt9qU1Yt6c0iDtbwz17PSinm5uayVkWcxFnbxRrgWRXF4uj4/Pexg4p15rR9XMugP+aYYzjjjDOyVdSKFSt429vexoc//GHe9a53ZcTTMAx7FBOdToeVK1fywr96YdY+qtfr/P0Zf88b3/RGTnnVKYyOjnLmmWdmZnqlYokXvvCFHHzwwZx44okATO6e5PWnv97wEFpNyqUyMzMzvOQlL+GjH/0op7/hdBr1Rravj7R2pt3HmZkZVq9eTbFYpNEw5ENj2mVadlu2bOH5z38+pVKJV596Kn/zN3/Djh07GBoa4p3vfCdf/epXueCCC1i1ahVzc3MceeSRPPOZz+Tkl7yEV7ziFTz72c9m/fr1bNp0I2eccQYvednLGBsb48QTT8z8kJrNJps3b84MFc866x309fUBMDc3x2te8xoOPvhgTjvtNF57+umUSiWuueYqXvWa1/Da176WZzzjGWzcuJE3vekMxsfHufHGGzn11Ndx7LHHsnnzZjZv3szWrVvZsGEDz3rWs5iZmeGss85iZmaG//t//y+nnHIKGzZsYOvWrWzfvp1PfeozTE9N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", "ex_time.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAFQCAMAAAB+hXxAAAADAFBMVEXo6OgLCwsQAHrn5+cWFBYC2f4lJCUAR/7o6OgAOfr+/f45NzkpAP/o6Ojo6OgPBo4BxvADJtQBttZZV1MIFrCsrKyKiYXo6OjZ2dp76v834v7o6OgIAVMIHMbKyctHR0d3eHchFY24uLlKPJyEeb1Cb/9mZmYTU/6VlpYqJxZ7nP4Jev+Fo/0o0e3o6Og4lP6doqIGqP82yvkFmP8Ftv4GiP551fwAZ/0oial7xP8ROEN2jvA3Z/oOFClUs/9CVdW6w8fM5e8QIik3qP+3yeStq8sTRVTI2OUSqMaFe8sUmrk4tv/Y9/1IR7NRp/41c/sShqMeJbETVW87QUUplbAVZ4FteYl5it17uP+61eUottImwdmFg9OMmKkJBzBOQZwQJkISdYqfs+Gwu9pRevQUNmqftMAYNdMB6/8kpr53ZfMUSYEzI5EjeIxI4/z+swCEm+8KFEwQJ2EGaL1Rhu5Q2O/dcAANF2kypsRjVahzabV+ePSN7f3ykwD5owAjZG4xY5ZWWG5NYm9Ny+JpLg5jTvVxmcr/0gb/6RwQXaUTatkuCyshR3cmVngnZbKKiqaPyee5/P/DTAAYPIwsOmUmcqUuhuVSIBlCXYFVc4tQrcNjbpFnxdtz9f+ELQCMOAyM2ueX/P+6XAOpmqO55fTOWgDhsSP/7lgpGUYrLkBSDh1Oda1ehJ58q713ou9pu96QQxCUZSWlNAD/+aEAUZshLGt7HBhjWl1jlrWEXTGQgX8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB78L7xAAABAHRSTlMA///+/////2//////kiz//////////0v////O////////////////////////sv//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdQm2MgAAH8tJREFUeNrtnYlj28aVxgENTDOCyWiDBYiGLIAgKYTGFkM7ie1a9q6kyJabKI3XcrSVXTuO7XjjHHbuNGnuoznbpNne930fu+3ef92+GVwzOCiJIiWKeJ9sEsTgnN+8N28GwECSYx1VUSOsowlpiUNeqSioEVWlcvTo0RR0mwGvoLaT1m7lFYo3wS6FzJH4KEMPwFPsCXRgjlm4/Zjba1aIPaJOoduCmVtkdZndUxHI8Bk6Tx2gHxVrcxOQmhaVuSbEOdqKLNC2i+Q147M1O10zbwx6RB2gp+pz02NbvDxfUX8H30uwLxdKgRkrcAUwx2JTumsmxcMydWuLoBvbQ4qcddNqgSl7fIKqqRuHTqlT6EeVlKVrsmy4Z53lj5YXKhVZmZNllywrs7OzC1Szs/ATpCmzc4oPEw6UmorOmPvKnDLnbhV0eRiVbjploataRclfteIo/C9N6wP0igKmLskVsTlXMTtAdaniu8sdy3HOzs6uKBYx5IW5eP8d4NuRFfpnMupwbFY0z+2Le19/QxSgD1/rWJZTPDWAnmpAe5WYq615nmbHqwjQIdVLkar0wJyZuqSmM9i0K+Qh2bcqhqv7iuYuyADdV2bmO7rP5ABgc0FZ1BZnZYcw6r9UIBSw5MVZhXn8rcjfoYX+WV5Z6KoWka3YHcg9y7cr+ZbuaWnovZnT0aOSmj5Q01OIq5DLjisri2eN/3YrMoU+v8KHaoY8J5v0g0HW5HnFtirKrBy4+aQUOw7dvu047IA1L/qI5ggpwW9HHSh0PWeWrndZvltiH6BramzY4EE9DxxmAXQxY3p3ohU1B3pHXibKWf+sK88uesR3fHD3YOmzZ5c6nc7ZZYs1yhRZI6a8CJ8h9cXZuQXZJzz0JRNWNhXFtxzDdGBGB9ZTdCeYY2lcim8ENR5UKL62Meg6xaQnrFLQ9Cx2PVkvZMx/KoOF7iVg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", "thumb_eq.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaCAYAAACtv5zzAAACXUlEQVR42rWVzU7bQBSFv0SBjCNEBlaoLECthJQNJbtuo0pkg/oorcSuL4HUPkrFnm3fICZqC6nU1q3AuSbFvg4/6SI4bRLbmEpcySvPzLnnnDl3SudnvyhSb17vjzaebQDQ+9zj3fuDUpF9FR6pOp3uCKCUxiDSId53bySBAGCMST1EVQGwdcvak7WSYxaLMXA77sj76bG5sYmpGoyTARApEghu10UCGTWb26ViAMcuO893sNZiHJPNwFGMY9BYcY9dms3teQaJVkk1GlulQAJM1RTW29YtgQTMngVQaTS25miFcTjW/k6aROu8CuOQRmOrmAehnAHg/fDGQBlsNNYJeLKn8DXVWCce5JVGiud5/5cDz/MwxuQykEBS/3c63XwAUzVTDGZv0iQD1qYySPzIZSAimGicA430r+mRTuUg6xrfC3Dw7QWrtVvWzDW2VoHgH/DwGk8r+GGZ/fWP2QBpOUiu6OEJrFTKPDWL4MzOk0W+KPSvYX99Wvd7c5DU7acu58D51W36goXy2J+XZkr3QhIZx+C+hRW7zNJyPXXN74uAvlwgfpgpUZlHrlyT87oHWFquE+kwNYz35iB5FyDIlShrTiV+5EqU9oDMeWXMJBeFJRpc3iC+IL5gVy2RDufAIh2iqogvaKwMLm8elgMJBFu3aKTjb0bnSZrv5tGDciCDgNPe6d2gG2GclYxJ2kfjEiKCDALSzkqVSPw+J70TAGrVGvA185FJ3gLx+8U9aLVaHB0dYVfHnZuF6nz3V/FUQ61WqzhAe7dNGIccfjgsFKa9V3u0d9up//4AiJ4yDJcnsCkAAAAASUVORK5CYII=", "thumb_h.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAASCAYAAABFGc6jAAACiUlEQVR42r2VP2/TUBTFf0YleS+U2A5S5SAYkgUJlgqkAuUTAEMFhYUODPAF4HsgJhA7EkiIDbUdYYJP0MBSp3+gvonaOAnC79kRMkPaQFsqBEi9y5P9rnXeOfe8Y8d8NRxGHeGQ6tCAxn59iNpR3o272NRizN9LaqzBJjHXr95y9u45OzNaXg3zfq9H2XUpaY3W+u+BjEFECJshszOzzj5Gy6th3hKhVqvh+2U8/8Q/S+T75YOla4ngez7ViSpqXP3XLOK4/3szLK+GubEGz/f+G6Qbb5EcMNuxlsg+yktLjZ8sT1ZH2quiwvM9AGT7uyAIqE5UsYNvxHGflgiNTx8JgiDfBdRca3L2zFkA0sGAPP1Ov9fjybOnrDSbzL+ZR0RYWFxgYXGBhw8eUq/Vef/hPS9evuDmzE3uzN0ZMTHWsL62zsyNmd2MvPEiZddFHT1GvLmFMQZVVIzrY6OmsuuiCkNZPc8jCAKCIABAlX7KndkUaQvtdpupqYu77f361fP8/IUrnDx9io31zwCj052oVDDGkBhDZlM830NrzVanQ2ZTCqpISWu6cXdohG7M23dvybIB5fHjuxmpko/WmnhzCxGhE3cAqPgVMptiUzs8eVEhIpRdd/TeppZ+r8fGl2Xq9XNEEhGJMDk5yc7sR0BaDS9mo9GgudYc6pxYbBIDYDMHEcEmQ0C34qFLClVQqEK+LZ9PGC4h0iL5lnD96rX9roskQm8nwY4p9la9Vh9F0t7EMMYQdzaI2j3CsMn0lWmqE9V9ETS2Eq5gM4sqqNG6Uzazf46dxNLrdNmQiErF5/7de87v+hzz1fDo8aN86WPjny5pOkjxPZ/L05eYuz3nHNTnHNaP7wer6j2M1gHfHwAAAABJRU5ErkJggg==", "thumb_mx.png": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAC8klEQVR42q2WzW4bVRSAv6nt3B819oxVEo/b4Bkj4YQ+AAbWkZpNLVYsiboDFiz6EBWb8gphR4XUkAVILNq8AFKlLpIKpbGRmsyYxcydBHlmSiqzcOpunNh1e1ZXRzr3O//3WulpyjQ57h8PO192+LTdxl/xSF+m3Nm8Q325bk2ztS4CPNx5OPQbPvFpDGfDsV5qBUDNrdH8sDkf4Lc/fh9ev1Gn9XGLPM0RShAEAb3nXcxJgl2ujGHTQMVJSrUgWLq2RHmxDItQKBZwHAfXdQmCgDAICcMQThKylxnA8CLIRIDUCq00hWKBwWCALmoAhBBU7SpSSPRVzdGLY0xk6NG7EHJlWg611uNznufYZZuaW8Nb8fjis88RUvLkzyfcv//j7CmaJIfPD9n+dRu35tJut9FKE5kIx7axqzbmaTwf4NXZKwrFAv2gz9ZPWwA8+PkBvV6P2Bjqyy5SScSCeLcIADa/3sStueRpjhKKMAun2kwFFIoFAPymj1WyWLq2RJZn5Gc5aZ5ilS4fhSuzej9IBxweHPJsb5+qXUUUBVmaMfxv+G4RvJbEJNz74R4AO9s7xCbGRIY0T98PIEszOp0OakGRmATHdmaymxmwenMVq2SNphtIogSpJUqo9wPI0xxvxRvXI8xD3Jo71W6mIsdxTBAErN9aZ/3WOlpp9FWNkHJqFxVnvTw2Ma1WC7EgiEzE4N/Bm+V4SZomb1OhiExEZCKSKKFSreB5Hne/v4tUcgQ2hjAMuH6jPl8Eu7u7mMiw+snaSFGFZXf5jRNaIpWcbw78pj/aOb9swd75y1Syxo+PFBJn0SEIAqySdeksTCyyXbYtv+lz+/ZXSC3p9boc7B0Q/BNwcnpClmdUqhX8hs/Ri2PCo/DtU2SXbcvzvCFA9+8u/ahPP+pjOzbuBzWkVuM6ACil376Lzn8NoyQ3RiATG7rdLgCO7ZANMkxi+O6bb+dr09eQj/5q8qjxGBqw/2wfgODc+42NDdZaaxMH4n8wLik/j6OHRQAAAABJRU5ErkJggg=="};
    // ═══════════════════════════════════════════════════════════════════
    // v3.12 — EXE SKIN WINDOWS: real artwork from EAX Console_SVT.exe,
    // with live controls laid on top of it.
    // ═══════════════════════════════════════════════════════════════════
    const SKIN = (function () {
        const BASE = EXT_BASE + 'skin/';
        const IMG = f => SKIN_IMG[f] || (BASE + f);
        // ── v3.17.0 PICTURE THEME: the window body shows this picture (change it by replacing POSTER with any image data-URI / url) ──
        let POSTER = "data:image/jpeg;base64,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";
        let POSTER_W = 669, POSTER_H = 355, POSTER_DIM = 0.62;   // dim = how dark the picture is behind the controls
        const POSTER_DEFAULT = { src: POSTER, w: POSTER_W, h: POSTER_H, dim: POSTER_DIM };
        const DIMf = () => 'linear-gradient(rgba(0,0,0,' + POSTER_DIM + '),rgba(0,0,0,' + POSTER_DIM + '))';
        const BODY_COL = new Set(['#0c0c0c', '#111211', '#151115', '#171117', '#1c1c1c', '#1e1d1b', '#232323', '#2a2a2a']);
        const pbox = (w, h) => { const k = Math.max(w / POSTER_W, h / POSTER_H), pw = POSTER_W * k, ph = POSTER_H * k; return { w: pw, h: ph, x: (w - pw) / 2, y: (h - ph) / 2 }; };
        // v3.17.0: picture is repainted live when you pick another one
        function paintEl(d, win, x, y) {
            const P = pbox(win.w, win.h);
            d.style.background = 'none';
            d.style.backgroundImage = DIMf() + ',url("' + POSTER + '")';
            d.style.backgroundRepeat = 'no-repeat';
            d.style.backgroundSize = win.w + 'px ' + win.h + 'px,' + P.w + 'px ' + P.h + 'px';
            d.style.backgroundPosition = (-x) + 'px ' + (-y) + 'px,' + (P.x - x) + 'px ' + (P.y - y) + 'px';
        }
        function paintWin(win) {
            if (win.id === 'thx' || !win.img) return;
            const P = pbox(win.w, win.h), el = win.el;
            el.style.backgroundImage = `url(${IMG(win.img)}), ${DIMf()}, url("${POSTER}")`;
            el.style.backgroundSize = `auto, 100% 100%, ${P.w}px ${P.h}px`;
            el.style.backgroundPosition = `0 0, 0 0, ${P.x}px ${P.y}px`;
        }
        function repaintAll() {
            Object.keys(wins).forEach(k => { const w = wins[k]; try { paintWin(w); (w.pEls || []).forEach(o => paintEl(o.d, w, o.x, o.y)); } catch (e) {} });
        }
        const wins = {};
        let zTop = 1000000;
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        const toast = m => { try { UI.toast(m); } catch (e) {} };
        const upd = () => { try { Core.update(); } catch (e) {} };
        const sync = () => { try { UI.syncEAX(); } catch (e) {} };
        const setP = (k, v) => { PARAMS[k] = v; try { UI.softSet(k, v, x => x); } catch (e) {} upd(); };
        const EQ_I = [2, 3, 4, 5, 6, 7, 8];      // the 7 bands drawn in the exe → indices of the 9-band EQ

        function css() {
            if (document.getElementById('n7r-skin-css')) return;
            const s = document.createElement('style'); s.id = 'n7r-skin-css';
            s.textContent = `
.sk-win{position:fixed;z-index:1000000;display:none;background-repeat:no-repeat;background-color:#e8e8e8;user-select:none;-webkit-user-select:none;font:11px Tahoma,Verdana,sans-serif;color:#e8e8e8;box-shadow:0 2px 6px rgba(0,0,0,.5);touch-action:none;}
.sk-win *{box-sizing:border-box;}
.sk-a{position:absolute;}
.sk-hot{position:absolute;cursor:pointer;}
.sk-hot:hover{background:rgba(255,255,255,.18);}
.sk-vg{position:absolute;width:5px;background:linear-gradient(90deg,#888888,#484848 45%,#151515);border:1px solid #6f6f6f;border-radius:2px;}
.sk-hg{position:absolute;height:5px;background:linear-gradient(180deg,#888888,#484848 45%,#151515);border:1px solid #6f6f6f;border-radius:2px;}
.sk-fill{position:absolute;background:#2f86e0;border-radius:2px;}
.sk-th{position:absolute;background-repeat:no-repeat;cursor:grab;}
.sk-chk{position:absolute;width:14px;height:14px;background:#0c0c0c;border:1px solid #1c5180;font:bold 12px/12px Arial;text-align:center;color:#21a121;cursor:pointer;}
.sk-rad{position:absolute;width:13px;height:13px;background:#0c0c0c;border:1px solid #1c5180;border-radius:50%;cursor:pointer;}
.sk-rad.on::after{content:'';position:absolute;left:3px;top:3px;width:5px;height:5px;border-radius:50%;background:#21a121;}
.sk-sel{position:absolute;font:11px Tahoma,Verdana,sans-serif;border:1px solid #7f9db9;background:#0c0c0c;color:#e8e8e8;padding:0 2px;}
.sk-lst{position:absolute;background:#0c0c0c;border:1px solid #7f9db9;overflow-y:auto;font:11px Tahoma,Verdana,sans-serif;}
.sk-lst div{height:16px;line-height:16px;padding:0 4px;cursor:default;white-space:nowrap;}
.sk-lst div.on{background:#ff8c00;color:#fff;}
.sk-txt{position:absolute;white-space:nowrap;}
.sk-btn{position:absolute;border:1px solid #5b6a86;border-radius:3px;background:linear-gradient(180deg,#0c0c0c,#2a2a2a);font:700 11px Tahoma,Verdana,sans-serif;color:#cfe3ff;cursor:pointer;padding:0;}
.sk-btn.on{background:linear-gradient(180deg,#5aa8ff,#0a63d1);color:#fff;}
.sk-spk{position:absolute;width:34px;height:34px;border-radius:50%;cursor:pointer;}
.sk-spk.off{background:rgba(0,0,0,.62);}
.sk-spk.na{background:rgba(20,20,20,.8);cursor:default;}
.sk-spk.on:hover{box-shadow:0 0 0 2px #1fe0ff inset;}
.sk-mute{position:absolute;width:22px;height:18px;border:1px solid #1c5180;border-radius:3px;background:linear-gradient(180deg,#8fc7ff,#2f86e0);color:#fff;font:12px/16px Arial;text-align:center;cursor:pointer;}
.sk-mute.m{background:linear-gradient(180deg,#ff9a9a,#d02020);}
`;
            document.head.appendChild(s);
        }

        // ── tiny builders ──
        function mk(win, cls, x, y, w, h, st) {
            const d = document.createElement('div'); d.className = cls;
            d.style.left = x + 'px'; d.style.top = y + 'px';
            if (w != null) d.style.width = w + 'px'; if (h != null) d.style.height = h + 'px';
            if (st) Object.assign(d.style, st);
            if (st && typeof st.background === 'string' && win.id !== 'thx' && BODY_COL.has(st.background.toLowerCase())) {
                paintEl(d, win, x, y);
                (win.pEls || (win.pEls = [])).push({ d, x, y });
            }
            win.el.appendChild(d); return d;
        }
        const cover = (win, x, y, w, h, c) => mk(win, 'sk-a', x, y, w, h, { background: c });
        const text = (win, x, y, t, st) => { const d = mk(win, 'sk-txt', x, y, null, null, st); d.textContent = t; return d; };
        const hot = (win, x, y, w, h, fn, title) => { const d = mk(win, 'sk-hot', x, y, w, h); if (title) d.title = title; d.addEventListener('click', fn); return d; };

        function drag(win, handle) {
            let sx, sy, ox, oy, on = false;
            handle.addEventListener('pointerdown', e => {
                on = true; sx = e.clientX; sy = e.clientY; ox = win.el.offsetLeft; oy = win.el.offsetTop;
                win.el.style.zIndex = ++zTop; handle.setPointerCapture(e.pointerId); e.preventDefault();
            });
            handle.addEventListener('pointermove', e => {
                if (!on) return;
                win.el.style.left = clamp(ox + e.clientX - sx, -win.w + 80, innerWidth - 80) + 'px';
                win.el.style.top = clamp(oy + e.clientY - sy, 0, innerHeight - 30) + 'px';
            });
            const end = () => { on = false; };
            handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
        }

        function vslider(win, o) {
            const H = o.bottom - o.top;
            mk(win, 'sk-a', o.x - 15, o.top - 12, 30, H + 24, { background: o.bg });
            if (o.ticks) {
                const t = 'repeating-linear-gradient(180deg,#717171 0 1px,transparent 1px 5px)';
                mk(win, 'sk-a', o.x - 13, o.top, 5, H, { background: t });
                mk(win, 'sk-a', o.x + 8, o.top, 5, H, { background: t });
            }
            mk(win, 'sk-vg', o.x - 3, o.top - 4, 5, H + 8);
            const fill = o.fill ? mk(win, 'sk-fill', o.x - 2, 0, 3, 0) : null;
            const th = mk(win, 'sk-th', o.x - o.tw / 2, 0, o.tw, o.th, { backgroundImage: `url(${IMG(o.thumb)})` });
            const draw = () => {
                const v = clamp(o.get(), 0, 1), y = o.bottom - H * v;
                th.style.top = (y - o.th / 2) + 'px';
                if (fill) { fill.style.top = y + 'px'; fill.style.height = (o.bottom - y + 4) + 'px'; }
            };
            const mv = e => {
                const r = win.el.getBoundingClientRect(), y = (e.clientY - r.top) * (win.h / r.height);
                o.set(clamp((o.bottom - y) / H, 0, 1)); draw();
            };
            const grab = mk(win, 'sk-a', o.x - 15, o.top - 12, 30, H + 24); grab.style.cursor = 'grab';
            let on = false;
            grab.addEventListener('pointerdown', e => { on = true; grab.setPointerCapture(e.pointerId); mv(e); e.preventDefault(); });
            grab.addEventListener('pointermove', e => { if (on) mv(e); });
            grab.addEventListener('pointerup', () => { on = false; });
            grab.addEventListener('dblclick', () => { if (o.reset != null) { o.set(o.reset); draw(); } });
            win.draws.push(draw); draw();
        }

        function hslider(win, o) {
            const L = o.right - o.left;
            mk(win, 'sk-a', o.left - 12, o.y - 10, L + 24, 20, { background: o.bg });
            mk(win, 'sk-hg', o.left - 2, o.y - 3, L + 4, 5);
            const fill = o.fill ? mk(win, 'sk-fill', o.left, o.y - 2, 0, 3, { background: o.fill }) : null;
            const th = mk(win, 'sk-th', 0, o.y - o.th / 2, o.tw, o.th, { backgroundImage: `url(${IMG(o.thumb)})` });
            const draw = () => {
                const v = clamp(o.get(), 0, 1), x = o.left + L * v;
                th.style.left = (x - o.tw / 2) + 'px';
                if (fill) fill.style.width = (x - o.left) + 'px';
            };
            const mv = e => {
                const r = win.el.getBoundingClientRect(), x = (e.clientX - r.left) * (win.w / r.width);
                o.set(clamp((x - o.left) / L, 0, 1)); draw();
            };
            const grab = mk(win, 'sk-a', o.left - 12, o.y - 10, L + 24, 20); grab.style.cursor = 'grab';
            let on = false;
            grab.addEventListener('pointerdown', e => { on = true; grab.setPointerCapture(e.pointerId); mv(e); e.preventDefault(); });
            grab.addEventListener('pointermove', e => { if (on) mv(e); });
            grab.addEventListener('pointerup', () => { on = false; });
            win.draws.push(draw); draw();
        }

        function check(win, x, y, get, set, bg) {
            cover(win, x - 2, y - 2, 18, 18, bg);
            const c = mk(win, 'sk-chk', x, y, 14, 14);
            const draw = () => { c.textContent = get() ? '✔' : ''; };
            c.addEventListener('click', () => { set(!get()); draw(); });
            win.draws.push(draw); draw(); return c;
        }
        function radio(win, x, y, bg, group, idx, get, set) {
            cover(win, x - 2, y - 2, 17, 17, bg);
            const r = mk(win, 'sk-rad', x, y, 13, 13);
            r.addEventListener('click', () => { set(idx); group.forEach(f => f()); });
            const draw = () => r.classList.toggle('on', get() === idx);
            group.push(draw); win.draws.push(draw); draw();
        }
        function select(win, x, y, w, h, opts, get, set, bg) {
            cover(win, x - 2, y - 2, w + 4, h + 4, bg);
            const s = mk(win, 'sk-sel', x, y, w, h);
            opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; s.appendChild(op); });
            s.addEventListener('change', () => set(s.value));
            const draw = () => { const v = get(); if (v != null && s.value !== v) s.value = v; };
            win.draws.push(draw); draw(); return s;
        }
        function btn(win, x, y, w, h, label, fn, cls) {
            const b = mk(win, 'sk-btn' + (cls ? ' ' + cls : ''), x, y, w, h); b.textContent = label;
            b.addEventListener('click', fn); return b;
        }

        function create(id, img, w, h, build) {
            css();
            const el = document.createElement('div');
            el.className = 'sk-win'; el.style.width = w + 'px'; el.style.height = h + 'px';
            el.style.backgroundImage = `url(${IMG(img)})`;
            const n = Object.keys(wins).length;
            el.style.left = (60 + n * 28) + 'px'; el.style.top = (50 + n * 28) + 'px';
            document.body.appendChild(el);
            const win = { id, el, w, h, draws: [], pEls: [], img };
            wins[id] = win;
            paintWin(win);
            el.addEventListener('pointerdown', () => { el.style.zIndex = ++zTop; });
            const tb = mk(win, 'sk-hot', 0, 0, w - 122, 28); tb.style.cursor = 'move'; tb.style.background = 'none';
            tb.addEventListener('mouseenter', () => { tb.style.background = 'none'; });
            drag(win, tb);
            hot(win, w - 56, 4, 52, 24, () => api.close(id), 'Close');
            hot(win, w - 120, 4, 46, 24, () => { try { UI.togglePanelAdv(); } catch (e) {} }, 'Advanced (voice changer, music, presets...)');
            if (id !== 'thx') { const pb = hot(win, w - 152, 4, 28, 24, () => { try { api.picMenu(); } catch (e) {} }, 'Change picture'); pb.textContent = '🖼'; pb.style.cssText += ';font:15px/24px Arial;text-align:center;color:#fff;'; }
            build(win);
            win.refresh = () => win.draws.forEach(f => { try { f(); } catch (e) {} });
            return win;
        }

        function footer(win, xs, selfId) {
            let order = ['effects', 'mixer', 'cmss', 'cleanup', 'eq', 'speaker', 'thx', 'time'].filter(k => k !== selfId);
            // v3.15.1: first three footer icons = Gain / Songs / Echo & Amplify (from ucore Tsu 3.11)
            const NAV = ['gain', 'songs', 'echo'];
            if (selfId === 'effects') order = NAV.concat(['eq']);
            else if (selfId === 'eq') order = NAV.concat(['cleanup', 'speaker']);
            else if (NAV.indexOf(selfId) >= 0) order = NAV.concat(['effects', 'eq']);
            xs.forEach((x, i) => hot(win, x - 13, win.h - 36, 26, 28, () => api.open(order[i]), order[i]));
            hot(win, 12, win.h - 36, 100, 28, () => {
                if (selfId === 'eq') { PARAMS.eqBands = [0,0,0,0,0,0,0,0,0]; PARAMS.eqLevel = 0; sync(); try { Core.updateEQBands(); } catch (e) {} win.refresh(); }
                else if (selfId === 'mixer') { ['masterGain','gain2','gain3','inputBoost'].forEach(k => PARAMS[k] = 0); PARAMS.eqBass = 50; PARAMS.eqTreble = 50; PARAMS.pan = 0; upd(); win.refresh(); }
                else toast('Default');
            }, 'Default');
        }

        // ── shared speaker / THX state ──
        const spk = { layout: '7.1 Speakers', off: {}, subCut: false, cenCut: false };
        const SPK_POS = { C:[371,108], FL:[318,128], FR:[422,128], SUB:[396,139], SL:[297,187], SR:[443,187], BL:[325,234], BR:[413,232] };
        function spkApply() {
            const names = SPK_LAYOUTS[spk.layout] || [];
            const sp = names.map(k => ({ d: SPK_ALL[k], on: !spk.off[k], k })).filter(x => SPK_POS[x.k]);
            const rear = sp.filter(x => x.d.rear), rearOn = rear.filter(x => x.on).length;
            const sideL = sp.filter(x => x.d.side < 0), sideR = sp.filter(x => x.d.side > 0);
            const lOn = sideL.filter(x => x.on).length, rOn = sideR.filter(x => x.on).length;
            const w = clamp((rear.length ? Math.round(70 * rearOn / rear.length) : 0) + (spk.layout === 'Headphones' ? 25 : 0), 0, 100);
            const tot = sideL.length + sideR.length, pan = tot ? Math.round(100 * (rOn - lOn) / tot) : 0;
            PARAMS.width = w; PARAMS.pan = pan; if (PARAMS._eaxSaved) PARAMS._eaxSaved.w = w;
            const sub = sp.find(x => x.d.sub), cen = sp.find(x => x.d.ctr);
            const subOff = !!(sub && !sub.on), cenOff = !!(cen && !cen.on);
            if (subOff !== spk.subCut) { PARAMS.eqBass = clamp(PARAMS.eqBass + (subOff ? -25 : 25), 0, 100); spk.subCut = subOff; }
            if (cenOff !== spk.cenCut) { PARAMS.eqMid = clamp(PARAMS.eqMid + (cenOff ? -20 : 20), 0, 100); spk.cenCut = cenOff; }
            ['width', 'pan', 'eqBass', 'eqMid'].forEach(k => { try { UI.softSet(k, PARAMS[k], x => x); } catch (e) {} });
            upd();
        }
        const thx = { mode: 'Off', saved: null, amt: 100 };
        function thxApply() {
            const pr = THX_PRESETS[thx.mode]; if (!pr) return;
            if (thx.mode === 'Off') { if (thx.saved) { PARAMS.width = thx.saved.w; PARAMS.eqBands = thx.saved.eq.slice(); thx.saved = null; } }
            else {
                if (!thx.saved) thx.saved = { w: +PARAMS.width || 0, eq: (PARAMS.eqBands || []).slice() };
                const a = thx.amt / 100;
                PARAMS.width = Math.round(pr.w * a); PARAMS.eqBands = pr.eq.map(x => Math.round(x * a * 10) / 10);
            }
            if (PARAMS._eaxSaved) PARAMS._eaxSaved.w = PARAMS.width;
            try { UI.softSet('width', PARAMS.width, v => v + '%'); } catch (e) {}
            sync(); try { Core.updateEQBands(); } catch (e) {} upd();
        }

        // ════════════ WINDOWS ════════════
        const BUILD = {};

        BUILD.eq = () => create('eq', 'ex_eq.png', 500, 302, win => {
            const bg = '#1e1d1b', gb = '#111211';
            // labels (relabelled for the ±24 dB range)
            cover(win, 36, 106, 38, 134, gb);
            text(win, 40, 110, '+24dB', { font: '11px Tahoma', color: '#e8e8e8' });
            text(win, 46, 165, '0dB', { font: '11px Tahoma', color: '#e8e8e8' });
            text(win, 38, 220, '-24dB', { font: '11px Tahoma', color: '#e8e8e8' });
            const xs = [86, 131, 176, 224, 268, 314, 361];
            xs.forEach((x, k) => vslider(win, {
                x, top: 116, bottom: 226, bg, ticks: true, thumb: 'thumb_eq.png', tw: 24, th: 26, reset: .5,
                get: () => ((+(PARAMS.eqBands || [])[EQ_I[k]] || 0) + 24) / 48,
                set: v => { PARAMS.eqBands[EQ_I[k]] = Math.round((v * 48 - 24) * 2) / 2; sel.value = 'Custom'; sync(); try { Core.updateEQBands(); } catch (e) {} }
            }));
            // level
            cover(win, 405, 106, 40, 130, gb);
            text(win, 410, 116, '+24dB', { font: '11px Tahoma' }); text(win, 418, 165, '0dB', { font: '11px Tahoma' }); text(win, 410, 212, '-24dB', { font: '11px Tahoma' });
            vslider(win, {
                x: 457, top: 125, bottom: 215, bg: gb, ticks: false, thumb: 'thumb_eq.png', tw: 24, th: 26, reset: .5,
                get: () => ((+PARAMS.eqLevel || 0) + 24) / 48,
                set: v => { PARAMS.eqLevel = Math.round((v * 48 - 24) * 2) / 2; sel.value = 'Custom'; sync(); try { Core.updateEQBands(); } catch (e) {} }
            });
            check(win, 19, 70, () => PARAMS.eqOn !== false, v => { PARAMS.eqOn = v; sync(); try { Core.updateEQBands(); } catch (e) {} }, gb);
            // v3.15.1: Presets dropdown deleted (label + list) - painted over with the window background
            const sel = { value: 'Custom' };
            cover(win, 210, 64, 208, 26, gb);
            hot(win, 424, 67, 22, 20, () => toast('Presets are saved from the main EQ window'), 'Save');
            footer(win, [132, 165, 195, 228, 260], 'eq');
        });

        BUILD.mixer = () => create('mixer', 'ex_mixer.png', 500, 302, win => {
            const bg = '#151115';
            const mutes = {};
            const defs = [
                // x, label, key, scale-to-param get/set, fill
                { x: 43,  k: 'masterGain', max: 600, fill: true },
                { x: 91,  k: 'eqBass', max: 100 },
                { x: 131, k: 'eqTreble', max: 100 },
                { x: 199, k: 'musicVolume', max: 8, fill: true },
                { x: 238, k: 'airAmount', max: 100, fill: true },
                { x: 280, k: 'width', max: 100, fill: true },
                { x: 322, k: 'inputBoost', max: 600, fill: true },
                { x: 364, k: 'gain2', max: 600, fill: true },
                { x: 406, k: 'reverb', max: 100, fill: true },
                { x: 466, k: 'pan', min: -100, max: 100, fill: true, top: 150 }
            ];
            defs.forEach(d => {
                const mn = d.min || 0;
                vslider(win, {
                    x: d.x, top: d.top || 122, bottom: 216, bg, thumb: 'thumb_mx.png', tw: 24, th: 24, fill: d.fill, reset: d.k === 'pan' ? .5 : null,
                    get: () => ((+PARAMS[d.k] || 0) - mn) / (d.max - mn),
                    set: v => { if (mutes[d.k]) return; setP(d.k, Math.round((mn + v * (d.max - mn)) * 100) / 100); }
                });
            });
            [43, 199, 238, 280, 322, 364, 406].forEach((x, i) => {
                const d = defs[[0, 3, 4, 5, 6, 7, 8][i]];
                cover(win, x - 14, 234, 28, 24, bg);
                const m = mk(win, 'sk-mute', x - 11, 237, 22, 18); m.textContent = '🔊';
                m.addEventListener('click', () => {
                    if (mutes[d.k] == null) { mutes[d.k] = PARAMS[d.k] || 0; setP(d.k, 0); m.classList.add('m'); m.textContent = '🔇'; }
                    else { setP(d.k, mutes[d.k]); delete mutes[d.k]; m.classList.remove('m'); m.textContent = '🔊'; }
                    win.refresh();
                });
            });
            footer(win, [132, 165, 195], 'mixer');
        });

        BUILD.speaker = () => create('speaker', 'ex_speaker.png', 500, 336, win => {
            const pn = '#151115';
            select(win, 38, 94, 185, 16, Object.keys(SPK_LAYOUTS), () => spk.layout, v => { spk.layout = v; spk.off = {}; spkApply(); win.refresh(); }, pn);
            check(win, 19, 117, () => true, () => {}, pn);
            check(win, 19, 270, () => false, () => toast('Digital output only: not available in a browser'), pn);
            btn(win, 38, 213, 90, 20, 'Calibrate...', () => toast('Calibration is not needed here'));
            btn(win, 133, 213, 90, 20, 'Summary', () => toast(spk.layout + ' — ' + Object.keys(SPK_POS).filter(k => (SPK_LAYOUTS[spk.layout] || []).includes(k) && !spk.off[k]).join(' ')));
            const rings = {};
            Object.keys(SPK_POS).forEach(k => {
                const [x, y] = SPK_POS[k];
                const d = mk(win, 'sk-spk', x - 17, y - 17, 34, 34); d.title = k;
                d.addEventListener('click', () => {
                    if (!(SPK_LAYOUTS[spk.layout] || []).includes(k)) return;
                    spk.off[k] = !spk.off[k]; spkApply(); win.refresh();
                });
                rings[k] = d;
            });
            win.draws.push(() => Object.keys(rings).forEach(k => {
                const inL = (SPK_LAYOUTS[spk.layout] || []).includes(k);
                rings[k].className = 'sk-spk ' + (!inL ? 'na' : spk.off[k] ? 'off' : 'on');
            }));
            btn(win, 273, 258, 90, 20, 'Channel', () => toast('Tap a speaker in the room to switch it on / off'));
            btn(win, 373, 258, 90, 20, 'Noise', () => toast('Tap a speaker in the room to switch it on / off'));
            hot(win, 6, 38, 170, 22, () => {}, '');
            footer(win, [132, 165, 195, 228, 260], 'speaker');
        });

        BUILD.thx = () => create('thx', 'ex_thx.png', 548, 356, win => {
            const pn = '#1c1c1c';
            select(win, 14, 120, 154, 16, ['2/2.1 Speakers', '4.1 Speakers', '5.1 Speakers', '7.1 Speakers'], () => null, v => {
                const m = { '2/2.1 Speakers': '2.1 Speakers', '4.1 Speakers': '4.1 Speakers', '5.1 Speakers': '5.1 Speakers', '7.1 Speakers': '7.1 Speakers' }[v];
                spk.layout = m; spk.off = {}; spkApply(); if (wins.speaker) wins.speaker.refresh();
            }, pn);
            const g = [];
            let out = 1;
            radio(win, 16, 171, pn, g, 0, () => out, v => { out = v; });
            radio(win, 16, 186, pn, g, 1, () => out, v => { out = v; });
            select(win, 14, 230, 154, 16, ['48 kHz', '44.1 kHz', '96 kHz'], () => null, () => {}, pn);
            // THX modes (extra row in the dark header)
            const bs = [];
            Object.keys(THX_PRESETS).forEach((k, i) => {
                const b = btn(win, 140 + i * 66, 36, 60, 20, k, () => { thx.mode = k; thxApply(); win.refresh(); });
                bs.push([k, b]);
            });
            win.draws.push(() => bs.forEach(([k, b]) => b.classList.toggle('on', thx.mode === k)));
            btn(win, 350, 252, 84, 18, 'Assignment', () => toast('Assignment: tap a speaker in the Speakers window'));
            btn(win, 440, 252, 84, 18, 'Polarity', () => toast('Polarity: all speakers in phase'));
            footer(win, [125, 152, 180, 208, 236], 'thx');
        });

        BUILD.effects = () => create('effects', 'ex_effects.png', 500, 368, win => {
            const pn = '#171117';
            check(win, 19, 117, () => PARAMS.eaxOn !== false, v => { PARAMS.eaxOn = v; try { UI.applyEAX(); } catch (e) {} }, '#0c0c0c');
            const lbl = (() => { cover(win, 176, 166, 160, 16, pn); return text(win, 177, 167, '', { font: 'bold 11px Tahoma' }); })();
            const names = Object.keys(EAX_ENVS);
            const list = mk(win, 'sk-lst', 178, 186, 152, 106);
            names.forEach(n => {
                const r = document.createElement('div'); r.textContent = n; r.dataset.env = n;
                r.addEventListener('click', () => {
                    PARAMS.eaxEnv = n; if (n !== 'None' && !(PARAMS.eaxAmount > 0)) PARAMS.eaxAmount = (EAX_PRESETS[n] ? EAX_PRESETS[n].amt : 50);
                    try { UI.syncEAX(); UI.applyEAX(); } catch (e) {} win.refresh();
                });
                list.appendChild(r);
            });
            win.draws.push(() => {
                lbl.textContent = PARAMS.eaxEnv || 'None';
                list.querySelectorAll('div').forEach(r => r.classList.toggle('on', r.dataset.env === PARAMS.eaxEnv));
            });
            cover(win, 352, 168, 40, 14, pn);
            hslider(win, {
                left: 371, right: 456, y: 177, bg: pn, thumb: 'thumb_h.png', tw: 26, th: 18, fill: '#2f86e0',
                get: () => (+PARAMS.eaxAmount || 0) / 100,
                set: v => { PARAMS.eaxAmount = Math.round(v * 100); try { UI.applyEAX(); UI.syncEAX(); } catch (e) {} }
            });
            // v3.15.1: tab bar (Effects / Karaoke / CMSS 3D / Clean-up + arrows) deleted - painted over
            cover(win, 6, 39, 486, 25, '#0c0c0c');
            cover(win, 5, 39, 1, 25, '#737378'); cover(win, 492, 39, 1, 25, '#737378');
            // transport row → old console buttons
            const clk = id => () => { const b = document.getElementById(id); if (b) b.click(); };
            hot(win, 24, 310, 28, 22, clk('n7r-fb-mute'), 'Mute');
            hot(win, 236, 310, 44, 22, clk('n7r-fb-rec'), 'REC');
            hot(win, 288, 310, 26, 22, clk('n7r-fb-prev'), 'Back');
            hot(win, 348, 310, 26, 22, clk('n7r-fb-play'), 'Play');
            hot(win, 382, 310, 26, 22, clk('n7r-fb-stop'), 'Stop');
            hot(win, 416, 310, 26, 22, clk('n7r-fb-next'), 'Forward');
            footer(win, [132, 165, 195, 228], 'effects');
        });

        BUILD.cleanup = () => create('cleanup', 'ex_cleanup.png', 500, 336, win => {
            const pn = '#151115';
            check(win, 19, 117, () => PARAMS.cleanVoice !== false, v => { PARAMS.cleanVoice = v; toast(v ? '🧹 Clean voice ON (next join)' : '🧹 Clean voice OFF (next join)'); }, '#0c0c0c');
            select(win, 40, 157, 182, 17, ['Analog Mix (Line/CD/Aux/TAD/PC)'], () => null, () => {}, pn);
            hslider(win, { left: 305, right: 424, y: 160, bg: pn, thumb: 'thumb_h.png', tw: 26, th: 18, fill: '#d02020',
                get: () => (+PARAMS.inputBoost || 0) / 600, set: v => setP('inputBoost', Math.round(v * 600)) });
            hslider(win, { left: 66, right: 184, y: 215, bg: pn, thumb: 'thumb_h.png', tw: 26, th: 18, fill: '#2f86e0',
                get: () => (+PARAMS.noiseReduction || 0) / 100, set: v => setP('noiseReduction', Math.round(v * 100)) });
            hslider(win, { left: 305, right: 424, y: 215, bg: pn, thumb: 'thumb_h.png', tw: 26, th: 18, fill: '#2f86e0',
                get: () => ((+PARAMS.gateThreshold || -60) + 60) / 60, set: v => setP('gateThreshold', Math.round(v * 60 - 60)) });
            hslider(win, { left: 66, right: 184, y: 258, bg: pn, thumb: 'thumb_h.png', tw: 26, th: 18, fill: '#2f86e0',
                get: () => ((+PARAMS.vadThreshold || -80) + 80) / 70, set: v => { PARAMS.vadEnabled = v > 0.02; setP('vadThreshold', Math.round(v * 70 - 80)); } });
            hot(win, 45, 40, 64, 20, () => api.open('effects'), 'Effects');
            hot(win, 150, 40, 84, 20, () => api.open('cmss'), 'CMSS 3D');
            hot(win, 374, 40, 86, 20, () => api.open('time'), 'Time Scaling');
            footer(win, [132, 165, 195], 'cleanup');
        });

        BUILD.cmss = () => create('cmss', 'ex_cmss.png', 500, 336, win => {
            const pn = '#151115';
            let mode = 1;
            check(win, 19, 117, () => (+PARAMS.width || 0) > 0, v => { if (!v) setP('width', 0); else setP('width', mode ? 100 : 60); }, '#0c0c0c');
            const g = [];
            radio(win, 68, 181, pn, g, 0, () => mode, v => { mode = v; if ((+PARAMS.width || 0) > 0) setP('width', 60); });
            radio(win, 68, 231, pn, g, 1, () => mode, v => { mode = v; if ((+PARAMS.width || 0) > 0) setP('width', 100); });
            cover(win, 268, 196, 74, 38, pn);
            const t1 = text(win, 276, 198, 'Stereo Focus:', { font: '11px Tahoma' });
            const t2 = text(win, 298, 214, '', { font: '11px Tahoma' });
            vslider(win, { x: 361, top: 178, bottom: 266, bg: pn, thumb: 'thumb_mx.png', tw: 24, th: 24,
                get: () => 1 - (+PARAMS.width || 0) / 100, set: v => setP('width', Math.round((1 - v) * 100)) });
            win.draws.push(() => { t2.textContent = Math.round(+PARAMS.width || 0) + '%'; });
            hot(win, 45, 40, 64, 20, () => api.open('effects'), 'Effects');
            hot(win, 262, 40, 76, 20, () => api.open('cleanup'), 'Clean-up');
            hot(win, 374, 40, 86, 20, () => api.open('time'), 'Time Scaling');
            footer(win, [132, 165, 195], 'cmss');
        });

        BUILD.time = () => create('time', 'ex_time.png', 500, 336, win => {
            const pn = '#151115';
            const log = r => Math.log2(Math.max(0.5, Math.min(2, r)));
            const rate = () => (Music && Music.rate) || 1;
            check(win, 19, 117, () => !!PARAMS.timeOn, v => { PARAMS.timeOn = v; Music.setRate(v ? (PARAMS.timeRate || 1) : 1); }, '#0c0c0c');
            cover(win, 226, 170, 50, 24, pn);
            const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'sk-sel';
            Object.assign(inp.style, { left: '232px', top: '172px', width: '38px', height: '18px', textAlign: 'center' });
            win.el.appendChild(inp);
            const apply = r => { PARAMS.timeRate = r; if (PARAMS.timeOn) Music.setRate(r); };
            inp.addEventListener('change', () => { const r = Math.max(0.5, Math.min(2, parseFloat(inp.value) || 1)); apply(r); win.refresh(); });
            win.draws.push(() => { if (document.activeElement !== inp) inp.value = (PARAMS.timeRate || 1).toFixed(2); });
            hslider(win, { left: 125, right: 378, y: 224, bg: pn, thumb: 'thumb_h.png', tw: 26, th: 18,
                get: () => (log(PARAMS.timeRate || 1) + 1) / 2,
                set: v => { let r = Math.pow(2, v * 2 - 1); if (Math.abs(r - 1) < 0.03) r = 1; apply(Math.round(r * 100) / 100); inp.value = (PARAMS.timeRate || 1).toFixed(2); } });
            hot(win, 45, 40, 64, 20, () => api.open('effects'), 'Effects');
            hot(win, 150, 40, 84, 20, () => api.open('cmss'), 'CMSS 3D');
            hot(win, 262, 40, 76, 20, () => api.open('cleanup'), 'Clean-up');
            hot(win, 214, 232, 74, 22, () => { apply(1); win.refresh(); }, 'Original Speed');
            footer(win, [132, 165, 195], 'time');
        });


        // ═══════════════════════════════════════════════════════════════
        // v3.15.1 - GAIN / SONGS / ECHO & AMPLIFY windows (taken from ucore Tsu 3.11).
        // Same Creative look as the Graphic Equalizer window. The controls drive the SAME
        // sliders/buttons of the old console, so they behave exactly like Tsu's Gain and Music tabs.
        // ═══════════════════════════════════════════════════════════════
        const HDR_G = ['#2a2a2a','#232323','#232323','#232323','#232323','#1e1d1b','#1e1d1b','#1e1d1b','#1e1d1b','#1e1d1b','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211','#111211'];
        const BODY = '#111211';
        const ui = (k, v) => {
            const el = document.getElementById('n7r-' + k);
            if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
            else { PARAMS[k] = v; upd(); }
        };
        const clk2 = id => () => { const b = document.getElementById(id); if (b) b.click(); };
        function plain(win, title) {
            const hdr = cover(win, 38, 4, 334, 27, 'linear-gradient(180deg,' + HDR_G.map((c, i) => c + ' ' + i + 'px,' + c + ' ' + (i + 1) + 'px').join(',') + ')');
            hdr.style.pointerEvents = 'none';
            const t = text(win, 42, 8, title, { font: 'italic 700 15px Tahoma,Verdana,sans-serif', color: '#e8e8e8', letterSpacing: '.5px', pointerEvents: 'none' });
            cover(win, 7, 40, 486, 227, BODY);
            return t;
        }
        function rowSl(win, y, label, o) {
            text(win, 18, y - 7, label, { font: 'bold 11px Tahoma,Verdana,sans-serif', color: '#e8e8e8' });
            const val = text(win, 402, y - 7, '', { font: 'bold 11px Tahoma,Verdana,sans-serif', color: '#7fd0ff' });
            const show = () => { val.textContent = o.fmt(o.get()); };
            hslider(win, { left: 150, right: 384, y, bg: BODY, thumb: 'thumb_h.png', tw: 26, th: 18, fill: o.fill || '#2f86e0',
                get: () => (clamp(+o.get() || 0, o.min, o.max) - o.min) / (o.max - o.min),
                set: v => { o.set(o.min + v * (o.max - o.min)); show(); } });
            win.draws.push(show);
        }
        const nbtn = (...a) => { const b = btn(...a); b.style.lineHeight = (a[4] - 2) + 'px'; return b; };
        const fmtDb = v => '+' + Math.round(v) + ' dB';
        const fmtPct = v => Math.round(v) + '%';

        BUILD.gain = () => create('gain', 'ex_eq.png', 500, 302, win => {
            plain(win, 'GAIN');
            const G = (y, label, k, fmt, fill) => rowSl(win, y, label, { min: 0, max: k === 'pitch' || k === 'tafleh' ? 100 : 600, fmt, fill,
                get: () => PARAMS[k] != null ? PARAMS[k] : (k === 'pitch' ? 50 : 0), set: v => ui(k, Math.round(v)) });
            G(66, 'MASTER GAIN', 'masterGain', fmtDb);
            G(100, 'GAIN 2', 'gain2', fmtDb);
            G(134, 'GAIN 3', 'gain3', fmtDb);
            G(168, 'INPUT BOOST', 'inputBoost', fmtDb, '#d02020');
            G(202, 'PITCH SHIFT', 'pitch', v => Math.round((v - 50) * 2) + '%');
            G(236, 'تفله', 'tafleh', fmtPct);
            footer(win, [132, 165, 195, 228, 260], 'gain');
        });

        BUILD.songs = () => create('songs', 'ex_eq.png', 500, 302, win => {
            plain(win, 'SONGS');
            const fmtT = t => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); };
            // file name "LCD"
            cover(win, 18, 46, 464, 24, '#0a1f4d');
            const info = text(win, 26, 51, '', { font: 'bold 12px Tahoma,Verdana,sans-serif', color: '#7fd0ff', maxWidth: '448px', overflow: 'hidden', textOverflow: 'ellipsis' });
            win.draws.push(() => { const el = document.getElementById('n7r-music-info'); info.textContent = (el && el.textContent) || 'No file loaded...'; });
            // seek bar
            const tc = text(win, 18, 86, '0:00', { font: 'bold 11px Tahoma,Verdana,sans-serif', color: '#7fd0ff' });
            const td = text(win, 452, 86, '0:00', { font: 'bold 11px Tahoma,Verdana,sans-serif', color: '#7fd0ff' });
            let pend = null, tmr = null;
            hslider(win, { left: 70, right: 430, y: 93, bg: BODY, thumb: 'thumb_h.png', tw: 26, th: 18, fill: '#2f86e0',
                get: () => {
                    if (pend != null) return pend;
                    const d = Music.getDuration(); return d ? Music.getCurrentTime(window.DiscordContext) / d : 0;
                },
                set: v => {
                    if (!Music.buffer) return;
                    pend = v; tc.textContent = fmtT(v * Music.getDuration());
                    clearTimeout(tmr);
                    tmr = setTimeout(() => { if (window.DiscordContext) Music.seek(window.DiscordContext, v * Music.getDuration()); pend = null; }, 160);
                } });
            win.draws.push(() => { const d = Music.getDuration(); td.textContent = fmtT(d); if (pend == null) tc.textContent = fmtT(Music.getCurrentTime(window.DiscordContext)); });
            // buttons (same buttons as Tsu's Music tab)
            nbtn(win, 18, 116, 112, 28, '📁 Load File', clk2('n7r-music-select'));
            nbtn(win, 136, 116, 106, 28, '▶ Play', clk2('n7r-music-play'));
            nbtn(win, 248, 116, 106, 28, '⏹ Stop', clk2('n7r-music-stop'));
            nbtn(win, 360, 116, 122, 28, '🔥 MAX MUSIC', clk2('n7r-music-max'));
            // music gain + music reverb + SPEED live in this same window (v3.18: compact rows so the speed bar fits under the reverb)
            rowSl(win, 164, 'MUSIC GAIN', { min: 0, max: 8, fmt: v => Math.round(v * 100) + '%', fill: '#d02020',
                get: () => PARAMS.musicVolume != null ? PARAMS.musicVolume : 1.2, set: v => ui('musicVolume', Math.round(v * 100) / 100) });
            rowSl(win, 190, 'MUSIC REVERB', { min: 0, max: 100, fmt: fmtPct,
                get: () => PARAMS.musicReverb || 0, set: v => ui('musicReverb', Math.round(v)) });
            // v3.18 SPEED: 0.25x (very slow) .. 3.00x (very fast), snaps to 1.00x near the middle
            const setSpeed = r => {
                r = Math.max(0.25, Math.min(3, Math.round(r * 100) / 100));
                PARAMS.timeRate = r; PARAMS.timeOn = Math.abs(r - 1) > 0.001;
                try { Music.setRate(r); } catch (e) {}
            };
            const spdPos = r => (Math.max(0.25, Math.min(3, r)) - 0.25) / 2.75;
            { const tkm = cover(win, 213, 221, 2, 7, '#ffffff'); tkm.style.pointerEvents = 'none'; }   // tick mark at 1.00x
            rowSl(win, 216, 'MUSIC SPEED', { min: 0, max: 1, fmt: () => (Music.rate || 1).toFixed(2) + 'x', fill: '#2fb04a',
                get: () => spdPos(Music.rate || 1),
                set: v => { let r = 0.25 + v * 2.75; if (Math.abs(r - 1) < 0.12) r = 1; setSpeed(r); } });   // strong snap to 1.00x
            nbtn(win, 150, 232, 74, 24, '\u23E9 Fast', () => { setSpeed(1.5); win.refresh(); });
            nbtn(win, 232, 232, 74, 24, '\uD83D\uDC22 Slow', () => { setSpeed(0.75); win.refresh(); });
            nbtn(win, 314, 232, 74, 24, '\u25B6 Normal', () => { setSpeed(1); win.refresh(); });
            const tk = setInterval(() => { if (win.el.style.display !== 'none') win.refresh(); }, 500); win._tk = tk;
            footer(win, [132, 165, 195, 228, 260], 'songs');
        });

        BUILD.echo = () => create('echo', 'ex_eq.png', 500, 302, win => {
            plain(win, 'ECHO & AMPLIFY');
            rowSl(win, 80, 'AMPLIFY (VOLUME)', { min: 0, max: 8, fmt: v => Math.round(v * 100) + '%', fill: '#d02020',
                get: () => PARAMS.musicVolume != null ? PARAMS.musicVolume : 1.2, set: v => ui('musicVolume', Math.round(v * 100) / 100) });
            rowSl(win, 130, 'ECHO (REVERB)', { min: 0, max: 100, fmt: fmtPct,
                get: () => PARAMS.musicReverb || 0, set: v => ui('musicReverb', Math.round(v)) });
            nbtn(win, 18, 180, 464, 28, '🔥 MAX MUSIC', clk2('n7r-music-max'));
            text(win, 18, 222, 'Echo and amplification of the song you play (same as the Music tab).', { font: '10px Tahoma,Verdana,sans-serif', color: '#858596' });
            footer(win, [132, 165, 195, 228, 260], 'echo');
        });


        // ═══ v3.17.0 PICTURE MANAGER ═════════════════════════════════════════════════════
        // Order of use:  1) picture you chose with the 🖼 button (saved in the browser, survives restart)
        //                2) skin/picture.jpg|png|webp|gif inside the extension folder
        //                3) the built-in poster
        const PIC = { custom: null, folder: null, menu: null };
        const idb = (function () {
            let dbp = null;
            const open = () => dbp || (dbp = new Promise((res, rej) => {
                try {
                    const r = indexedDB.open('ucore_pic', 1);
                    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); };
                    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
                } catch (e) { rej(e); }
            }));
            return {
                get: k => open().then(db => new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); })).catch(() => { try { return localStorage.getItem('ucore_pic_' + k); } catch (e) { return null; } }),
                set: (k, v) => open().then(db => new Promise((res, rej) => { const q = db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); q.onsuccess = () => res(); q.onerror = () => rej(q.error); })).catch(() => { try { localStorage.setItem('ucore_pic_' + k, v); } catch (e) {} }),
                del: k => open().then(db => new Promise((res, rej) => { const q = db.transaction('kv', 'readwrite').objectStore('kv').delete(k); q.onsuccess = () => res(); q.onerror = () => rej(q.error); })).catch(() => { try { localStorage.removeItem('ucore_pic_' + k); } catch (e) {} })
            };
        })();
        function probe(src) {   // -> { w, h, lum }
            return new Promise((res, rej) => {
                const im = new Image();
                im.onload = () => {
                    let lum = 0.3;
                    try {
                        const c = document.createElement('canvas'); c.width = c.height = 24;
                        const g = c.getContext('2d'); g.drawImage(im, 0, 0, 24, 24);
                        const d = g.getImageData(0, 0, 24, 24).data; let s = 0;
                        for (let i = 0; i < d.length; i += 4) s += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
                        lum = s / (d.length / 4);
                    } catch (e) {}
                    res({ w: im.naturalWidth || 669, h: im.naturalHeight || 355, lum });
                };
                im.onerror = () => rej(new Error('bad image'));
                im.src = src;
            });
        }
        const autoDim = lum => Math.max(0.5, Math.min(0.85, 1 - 0.26 / Math.max(0.05, lum)));   // bright picture -> darker veil so the controls stay readable
        function showPicture(src, w, h, dim) {
            POSTER = src; POSTER_W = w; POSTER_H = h; POSTER_DIM = dim;
            repaintAll();
            try { const s = document.getElementById('n7r-pic-dim'); if (s) s.value = Math.round(dim * 100); } catch (e) {}
        }
        async function applyBest() {
            try {
                if (PIC.custom) { const d = PIC.customDim != null ? PIC.customDim : autoDim((await probe(PIC.custom)).lum); const p = await probe(PIC.custom); showPicture(PIC.custom, p.w, p.h, d); return; }
                if (PIC.folder) { const p = await probe(PIC.folder); showPicture(PIC.folder, p.w, p.h, PIC.folderDim != null ? PIC.folderDim : autoDim(p.lum)); return; }
            } catch (e) { console.warn('[ツcore] picture failed, using default', e); }
            showPicture(POSTER_DEFAULT.src, POSTER_DEFAULT.w, POSTER_DEFAULT.h, POSTER_DEFAULT.dim);
        }
        function shrink(file) {   // File -> data URI (max 1600 px, JPEG) ; small GIFs stay as they are
            return new Promise((res, rej) => {
                const fr = new FileReader();
                fr.onerror = () => rej(fr.error);
                fr.onload = () => {
                    const raw = fr.result;
                    if (/gif$/i.test(file.type) && file.size < 3 * 1024 * 1024) return res(raw);
                    const im = new Image();
                    im.onerror = () => rej(new Error('not an image'));
                    im.onload = () => {
                        const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
                        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
                        const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
                        res(c.toDataURL('image/jpeg', 0.92));
                    };
                    im.src = raw;
                };
                fr.readAsDataURL(file);
            });
        }
        async function chooseFile(file) {
            try {
                if (!file || !/^image\//.test(file.type)) { toast('⚠ Pick an image file'); return; }
                const data = await shrink(file);
                const p = await probe(data);
                PIC.custom = data; PIC.customDim = autoDim(p.lum);
                await idb.set('picture', data); await idb.set('dim', String(PIC.customDim));
                showPicture(data, p.w, p.h, PIC.customDim);
                toast('🖼 Picture changed and saved');
            } catch (e) { toast('⚠ Could not load that image'); }
        }
        async function resetPicture() {
            PIC.custom = null; PIC.customDim = null;
            await idb.del('picture'); await idb.del('dim');
            await applyBest();
            toast(PIC.folder ? '🖼 Picture from the skin folder' : '🖼 Default picture');
        }
        function picMenu() {
            let m = PIC.menu;
            if (!m) {
                m = PIC.menu = document.createElement('div'); m.id = 'n7r-picmenu';
                m.style.cssText = 'position:fixed;right:16px;top:80px;width:250px;background:#0f0f0f;color:#e8e8e8;border:2px solid #1b6fe0;border-radius:8px;padding:10px;font:12px Tahoma,Verdana,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.7);display:none;';
                const b = 'display:block;width:100%;margin:6px 0;padding:8px;border:1px solid #4e6288;border-radius:5px;background:linear-gradient(180deg,#0f0f0f,#171c24);color:#e7e7e7;font:700 12px Tahoma,Verdana,sans-serif;cursor:pointer;';
                m.innerHTML = '<div style="font-weight:700;margin-bottom:4px">🖼 PICTURE</div>' +
                    '<button id="n7r-pic-choose" style="' + b + '">➕ Choose image…</button>' +
                    '<button id="n7r-pic-reset" style="' + b + '">↩ Reset (folder / default)</button>' +
                    '<div style="margin-top:6px">Darkness: <span id="n7r-pic-dv"></span></div>' +
                    '<input id="n7r-pic-dim" type="range" min="0" max="90" value="62" style="width:100%">' +
                    '<div style="margin-top:6px;color:#9aa;font-size:10px;line-height:1.35">Your picture is saved in this browser. You can also drop <b>picture.jpg / png / webp / gif</b> into the <b>skin</b> folder of the extension.</div>' +
                    '<button id="n7r-pic-close" style="' + b + '">Close</button>' +
                    '<input id="n7r-pic-file" type="file" accept="image/*" style="display:none">';
                document.body.appendChild(m);
                const $ = id => m.querySelector('#' + id);
                $('n7r-pic-choose').onclick = () => $('n7r-pic-file').click();
                $('n7r-pic-file').onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; chooseFile(f); };
                $('n7r-pic-reset').onclick = resetPicture;
                $('n7r-pic-close').onclick = () => { m.style.display = 'none'; };
                const sl = $('n7r-pic-dim');
                sl.oninput = () => {
                    POSTER_DIM = sl.value / 100; $('n7r-pic-dv').textContent = sl.value + '%'; repaintAll();
                    if (PIC.custom) { PIC.customDim = POSTER_DIM; idb.set('dim', String(POSTER_DIM)); } else { PIC.folderDim = POSTER_DIM; }
                };
            }
            m.style.display = m.style.display === 'none' ? 'block' : 'none';
            m.style.zIndex = ++zTop + 10;
            const sl = m.querySelector('#n7r-pic-dim'); sl.value = Math.round(POSTER_DIM * 100); m.querySelector('#n7r-pic-dv').textContent = sl.value + '%';
        }
        // saved picture + picture from the skin folder (content.js sends it)
        idb.get('picture').then(async v => { if (v) { PIC.custom = v; const d = await idb.get('dim'); PIC.customDim = d != null && d !== '' ? parseFloat(d) : null; applyBest(); } });
        window.addEventListener('message', e => {
            try {
                if (e.source !== window || !e.data || !e.data.n7rPicture) return;
                PIC.folder = e.data.n7rPicture; if (!PIC.custom) applyBest();
            } catch (_e) {}
        });
        try { window.postMessage({ n7rNeedPicture: 1 }, '*'); } catch (_e) {}

        const api = {
            wins,
            picMenu,
            open(id, pos) {
                let w = wins[id];
                if (!w) { if (!BUILD[id]) return; w = BUILD[id](); }
                const sc = Math.min(1, (window.innerWidth - 8) / w.w);
                w.el.style.transformOrigin = '0 0'; w.el.style.transform = sc < 1 ? 'scale(' + sc + ')' : '';
                if (pos) { w.el.style.left = pos.left + 'px'; w.el.style.top = pos.top + 'px'; }
                else if (sc < 1) { w.el.style.left = '4px'; }
                w.el.style.display = 'block'; w.el.style.zIndex = ++zTop; w.refresh();
                if (!w._t) w._t = setInterval(() => { if (w.el.style.display !== 'none') w.refresh(); }, 700);
            },
            close(id) { if (wins[id]) wins[id].el.style.display = 'none'; },
            ids: ['effects', 'eq', 'mixer', 'speaker', 'thx', 'cmss', 'cleanup', 'time', 'gain', 'songs', 'echo']
        };
        return api;
    })();

    // v3.20.9 LOUD button (under Fake Deafen)
    (function loudBtn() {
        function mount() {
            if (!document.body) return setTimeout(mount, 400);
            if (document.getElementById('n7r-loudbtn')) return;
            const st = document.createElement('style');
            st.textContent = `#n7r-loudbtn{position:fixed;top:calc(84px + env(safe-area-inset-top,0px));left:18px;z-index:999998;min-height:46px;padding:10px 20px;border-radius:50px;border:2px solid rgba(255,255,255,.5);color:#fff;font:800 15px 'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,#2b2f3a,#12141a);box-shadow:0 6px 18px rgba(0,0,0,.7);cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#n7r-loudbtn.on{background:linear-gradient(135deg,#ffb020,#c25a00);border-color:#fff}`;
            document.head.appendChild(st);
            const b = document.createElement('button'); b.id = 'n7r-loudbtn'; b.type = 'button';
            const paint = () => { const on = !!Core.loudOn; b.classList.toggle('on', on); b.textContent = '\u{1F50A} LOUD ' + (on ? 'ON' : 'OFF'); };
            b.addEventListener('click', () => {
                if (!Core.loudGain) { try { UI.toast('Join a voice channel first, then press again'); } catch (_e) {} return; }
                Core.setLoud(!Core.loudOn); paint();
            });
            document.body.appendChild(b); paint(); setInterval(paint, 1000);
        }
        mount();
    })();

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', () => UI.init());
    else
        UI.init();
})();
