/* SCORM 1.2: checked attempts, resumable progress and explicit completion. */
(() => {
    "use strict";
    let scorm, uiProvider, savedUI = null;
    let active = false, ended = false, writable = false, practice = false;
    let done = false, nextIndex = 0, queued = false, saving = false;
    const startedAt = Date.now();
    const attempts = new Map();
    const pending = [];
    const questions = {
        game_cable: { type: "choice", correct: "b", maximum: 10 },
        game_water: { type: "choice", correct: "c", maximum: 10 },
        game_bag: { type: "choice", correct: "a", maximum: 10 },
        game_scissors: { type: "choice", correct: "c", maximum: 10 },
        assessment_equipment: { type: "choice", correct: "b", maximum: 20 },
        assessment_actions: { type: "choice", correct: "a,b,d", maximum: 20 },
        assessment_steps: { type: "numeric", correct: "3", maximum: 20 }
    };
    const ids = Object.keys(questions);
    function message(text) { document.getElementById("lmsStatus").textContent = text; }
    function failure() {
        document.getElementById("lmsRetry").hidden = false;
        message("השמירה במערכת לא אושרה. אל תסגרו את הפעילות; נסו לשמור שוב. סיום היחידה יאושר רק לאחר שמירה מוצלחת.");
        console.warn("SCORM: save failed; state and reserved interaction indices retained.");
    }
    function read(key) {
        const value = scorm.get(key);
        if (Number(scorm.debug.getCode()) !== 0) throw new Error("SCORM read rejected");
        return value;
    }
    function write(key, value) {
        if (!scorm.set(key, String(value))) throw new Error("SCORM write rejected");
    }
    function commit() { if (!scorm.save()) throw new Error("SCORM commit rejected"); }
    function normalize(id, response) {
        const q = questions[id];
        if (!q) return null;
        response = String(response);
        if (q.type === "numeric") return /^(?:[1-9]|10)$/.test(response) ? response : null;
        if (id === "assessment_actions") {
            return /^[a-d](?:,[a-d])*$/.test(response) ? [...new Set(response.split(","))].sort().join(",") : null;
        }
        return /^[a-c]$/.test(response) ? response : null;
    }
    function points(id) { return Math.max(0, questions[id].maximum - 5 * (attempts.get(id)?.errors || 0)); }
    function total() { return ids.reduce((sum, id) => sum + points(id), 0); }
    function sessionTime() {
        const seconds = Math.min(35999999, Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
        return `${String(Math.floor(seconds / 3600)).padStart(4, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.00`;
    }
    function snapshot(final = done, queue = pending) {
        const ui = uiProvider ? uiProvider() : savedUI;
        const data = { v: 3, done: final, ui, a: [...attempts].map(([id, a]) => [id, a.response, a.errors, a.count]), p: queue, n: nextIndex };
        const json = JSON.stringify(data);
        // Stay within the SCORM 1.2 SPM without silently truncating state.
        if (json.length > 4096) throw new Error("Suspend data exceeds SCORM 1.2 limit");
        return { json, screen: final ? "completion" : ui?.screen || "welcome" };
    }
    function store(final = done, queue = pending) {
        const data = snapshot(final, queue);
        write("cmi.suspend_data", data.json);
        write("cmi.core.lesson_location", data.screen);
        write("cmi.core.session_time", sessionTime());
        write("cmi.core.exit", final ? "" : "suspend");
        write("cmi.core.lesson_status", final ? "passed" : "incomplete");
    }
    function save() {
        if (!active || ended || !writable || practice || done || !uiProvider) return true;
        if (saving) return false;
        saving = true;
        try {
            // Persist the queue before writing interactions, allowing idempotent replay after reload.
            store(false);
            commit();
            if (pending.length) {
                for (const [index, id, response, count, time] of pending) {
                    const q = questions[id];
                    const fields = { id: `${id}_try_${String(count).padStart(2, "0")}_i${index}`, type: q.type,
                        "correct_responses.0.pattern": q.correct, weighting: q.maximum,
                        student_response: response, result: response === q.correct ? "correct" : "wrong", time };
                    for (const [key, value] of Object.entries(fields)) write(`cmi.interactions.${index}.${key}`, value);
                }
                store(false, []);
                commit();
                pending.length = 0;
            }
            document.getElementById("lmsRetry").hidden = true;
            message("ההתקדמות והתשובות נשמרו ב־Moodle. אפשר לצאת ולחזור לאותו ניסיון.");
            return true;
        } catch (error) { failure(); return false; }
        finally { saving = false; }
    }
    function scheduleSave() {
        if (queued) return;
        queued = true;
        queueMicrotask(() => { queued = false; save(); });
    }
    function validateSaved(data) {
        if (!data || data.v !== 3 || typeof data.done !== "boolean" || !Array.isArray(data.a) || data.a.length > 7 || !Array.isArray(data.p) || data.p.length > 12 || !Number.isSafeInteger(data.n) || data.n < 0) throw new Error("Invalid saved state");
        const u = data.ui;
        const screens = ["welcome", "intro", "preparation", "game", "transition", "assessment", "completion"];
        if (!u || !screens.includes(u.screen) || !Number.isInteger(u.highestUnlocked) || u.highestUnlocked < 0 || u.highestUnlocked > 4 || typeof u.gameStarted !== "boolean" || typeof u.assessmentVisited !== "boolean" || typeof u.checked !== "boolean" || !["", "a", "b", "c"].includes(u.q1) || !Array.isArray(u.q2) || u.q2.length > 4 || u.q2.some(v => !["stop", "move", "child", "report"].includes(v)) || typeof u.q3 !== "string" || u.q3.length > 32) throw new Error("Invalid saved UI");
        const seen = new Set();
        for (const a of data.a) {
            if (!Array.isArray(a) || a.length !== 4) throw new Error("Invalid attempt");
            const [id, response, errors, count] = a;
            if (seen.has(id) || normalize(id, response) !== response || !Number.isSafeInteger(errors) || errors < 0 || !Number.isSafeInteger(count) || count < 1 || errors > count) throw new Error("Invalid attempt");
            seen.add(id);
        }
        const indices = new Set();
        for (const p of data.p) {
            if (!Array.isArray(p) || p.length !== 5) throw new Error("Invalid queue");
            const [index, id, response, count, time] = p;
            if (!Number.isSafeInteger(index) || index < 0 || index >= data.n || indices.has(index) || normalize(id, response) !== response || !Number.isSafeInteger(count) || count < 1 || typeof time !== "string" || !/^\d{2}:\d{2}:\d{2}$/.test(time)) throw new Error("Invalid queue");
            indices.add(index);
        }
        if (data.done && !ids.every(id => data.a.some(a => a[0] === id && a[1] === questions[id].correct))) throw new Error("Invalid completion");
    }
    window.RogumLearning = Object.freeze({
        check(id, response) {
            response = normalize(id, response);
            if (response === null) return false;
            const previous = attempts.get(id);
            if (previous?.response === response) { scheduleSave(); return true; }
            // Bound the retry queue; stop accepting new answers when saving cannot recover.
            if (pending.length >= 12 && !save()) return false;
            const correct = response === questions[id].correct;
            const current = { response, errors: (previous?.errors || 0) + (correct ? 0 : 1), count: (previous?.count || 0) + 1 };
            attempts.set(id, current);
            if (active && writable && !practice && !done && !ended) {
                const now = new Date();
                const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2, "0")).join(":");
                pending.push([nextIndex++, id, response, current.count, time]);
            }
            scheduleSave();
            return true;
        },
        points,
        assessmentPoints() { return ids.filter(id => id.startsWith("assessment_")).reduce((sum, id) => sum + points(id), 0); },
        handled() { return ids.filter(id => id.startsWith("game_") && attempts.get(id)?.response === questions[id].correct).map(id => id.slice(5)); },
        restored() { return savedUI ? JSON.parse(JSON.stringify(savedUI)) : null; },
        isDone() { return done && !practice; },
        bind(provider) { uiProvider = provider; scheduleSave(); },
        save: scheduleSave,
        complete() {
            const ui = uiProvider?.();
            if (!ui?.checked || !ids.every(id => attempts.get(id)?.response === questions[id].correct)) return false;
            if (practice || !active || !writable) return true;
            if (done) return true;
            if (!save()) return false;
            try {
                write("cmi.core.score.min", 0);
                write("cmi.core.score.max", 100);
                write("cmi.core.score.raw", total());
                store(true, []);
                commit();
                done = true;
                document.getElementById("lmsRetry").hidden = true;
                message(`היחידה הושלמה בהצלחה. הציון ${total()} מתוך 100 וסטטוס עבר נשמרו ב־Moodle.`);
                return true;
            } catch (error) { failure(); return false; }
        },
        beginPractice() {
            if (pending.length && !save()) return false;
            practice = true;
            attempts.clear();
            message("תרגול חוזר בלבד: התוצאה הרשמית נשמרת ללא שינוי. ניסיון רשמי חדש נפתח ב־Moodle.");
            return true;
        }
    });
    function finish() {
        if (!active || ended) return;
        save();
        try {
            if (writable && !practice) {
                write("cmi.core.session_time", sessionTime());
                write("cmi.core.exit", done ? "" : "suspend");
                commit();
            }
            if (!scorm.quit()) console.warn("SCORM: termination was not confirmed.");
        } catch (error) { console.warn("SCORM: termination failed."); }
        ended = true;
        active = false;
    }
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("lmsRetry").addEventListener("click", () => {
            if (save()) message("ההתקדמות נשמרה. אם ניסיתם לסיים, לחצו שוב על כפתור סיום היחידה.");
        });
        try {
            scorm = window.pipwerks?.SCORM;
            if (!scorm) { message("מצב תרגול מחוץ למערכת: ההתקדמות והציון אינם נשמרים ב־Moodle."); return; }
            window.pipwerks.debug.isActive = false;
            scorm.version = "1.2";
            scorm.handleCompletionStatus = false;
            scorm.handleExitMode = false;
            if (!scorm.API.getHandle()) { message("מצב תרגול מחוץ למערכת: ההתקדמות והציון אינם נשמרים ב־Moodle."); return; }
            if (!scorm.init()) throw new Error("Initialization failed");
            active = true;
            const mode = read("cmi.core.lesson_mode");
            const status = read("cmi.core.lesson_status");
            const count = read("cmi.interactions._count");
            if (!/^\d+$/.test(count)) throw new Error("Invalid interaction count");
            nextIndex = Number(count);
            const name = scorm.get("cmi.core.student_name");
            if (Number(scorm.debug.getCode()) === 0 && typeof name === "string" && name.trim()) {
                const parts = name.split(",").map(p => p.trim()).filter(Boolean);
                document.getElementById("learnerName").textContent = `שלום ${parts.length === 2 ? `${parts[1]} ${parts[0]}` : name.trim()}`;
            }
            const raw = read("cmi.suspend_data");
            if (raw) {
                const data = JSON.parse(raw);
                validateSaved(data);
                savedUI = data.ui;
                for (const [id, response, errors, count] of data.a) attempts.set(id, { response, errors, count });
                pending.push(...data.p);
                nextIndex = Math.max(nextIndex, data.n);
                done = data.done || status === "passed";
            } else if (nextIndex > 0 || status === "passed" || status === "completed") {
                message("זהו ניסיון מגרסה קודמת ללא נתוני שחזור מתאימים. אפשר לתרגל ללא דיווח; לבדיקה חדשה התחילו ניסיון חדש ב־Moodle.");
                return;
            }
            writable = mode === "normal" && status !== "passed" && status !== "completed";
            if (mode === "review" || mode === "browse" || !writable) {
                message("מצב צפייה או תרגול בלבד: התוצאה וההתקדמות הרשמיות לא ישתנו.");
            } else if (done) {
                // Recover a final snapshot when the LMS did not retain the corresponding status.
                message("הניסיון הושלם. התוצאה השמורה מוצגת ללא התחלה מחדש.");
            } else {
                message(raw ? "ההתקדמות שוחזרה. אפשר להמשיך מאותה נקודה." : "החיבור ל־Moodle פעיל. ההתקדמות תישמר במהלך הלמידה.");
            }
        } catch (error) {
            writable = false;
            savedUI = null;
            attempts.clear();
            pending.length = 0;
            message("לא ניתן לקרוא או לשחזר את נתוני הניסיון. הנתונים הקיימים לא יידרסו. אפשר לתרגל בלבד; פתחו מחדש את הפעילות או פנו למדריך.");
            console.warn("SCORM: initialization or saved-state validation failed.");
        }
    });
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });
    window.addEventListener("pagehide", finish);
    window.addEventListener("pageshow", event => { if (event.persisted && ended) window.location.reload(); });
})();
