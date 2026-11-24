(() => {
    "use strict";

    let scorm;
    let uiProvider;
    let savedUI = null;
    let active = false;
    let ended = false;
    let writable = false;
    let practice = false;
    let done = false;
    let nextIndex = 0;
    let queued = false;
    let saving = false;

    const startedAt = Date.now();
    const attempts = new Map();
    const pending = [];
    const requiredRoomMs = 45_000;
    const maxPendingInteractions = 12;
    const practiceMessage = "מצב תרגול מחוץ למערכת: ההתקדמות והציון אינם נשמרים ב־Moodle.";

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
    const gameIds = ids.filter((id) => id.startsWith("game_"));
    const assessmentIds = ids.filter((id) => id.startsWith("assessment_"));
    const hazardIds = gameIds.map((id) => id.slice(5));

    function roomRequirementsMet(ui) {
        return Array.isArray(ui?.reviewedHazards) &&
            hazardIds.every((id) => ui.reviewedHazards.includes(id)) &&
            ui.activeRoomMs === requiredRoomMs;
    }

    // Moodle can send the family name first, so we look after the comma.
    function learnerGreeting(rawName) {
        const fallback = "שלום! טוב שהגעת ליחידת הבטיחות.";

        if (typeof rawName !== "string") return fallback;

        const cleaned = rawName
            .normalize("NFKC")
            .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
            .trim();

        if (
            !cleaned ||
            /^(?:undefined|null|nan|unknown|guest|anonymous|לא ידוע)$/i.test(cleaned)
        ) {
            return fallback;
        }

        const givenPart = cleaned.includes(",") ? cleaned.split(",")[1] : cleaned;
        const firstName = givenPart.trim().split(/\s+/)[0];

        if (
            !firstName ||
            firstName.length > 40 ||
            !/^[\p{L}][\p{L}\p{M}'’\-]*$/u.test(firstName)
        ) {
            return fallback;
        }

        return `שלום, ${firstName}!`;
    }

    function message(text) {
        document.getElementById("lmsStatus").textContent = text;
    }

    function failure() {
        document.getElementById("lmsRetry").hidden = false;
        message(
            "השמירה במערכת לא אושרה. חשוב להשאיר את הפעילות פתוחה ולנסות לשמור שוב. " +
            "סיום היחידה יאושר רק לאחר שמירה מוצלחת."
        );
        console.warn("SCORM: save failed; state and reserved interaction indices retained.");
    }

    function read(key) {
        const value = scorm.get(key);

        if (Number(scorm.debug.getCode()) !== 0) {
            throw new Error("SCORM read rejected");
        }

        return value;
    }

    function write(key, value) {
        if (!scorm.set(key, String(value))) {
            throw new Error("SCORM write rejected");
        }
    }

    function commit() {
        if (!scorm.save()) throw new Error("SCORM commit rejected");
    }

    function normalize(id, response) {
        if (!ids.includes(id)) return null;

        const question = questions[id];
        response = String(response);

        if (question.type === "numeric") {
            return /^(?:[1-9]|10)$/.test(response) ? response : null;
        }

        if (id === "assessment_actions") {
            return /^[a-d](?:,[a-d])*$/.test(response)
                ? [...new Set(response.split(","))].sort().join(",")
                : null;
        }

        return /^[a-c]$/.test(response) ? response : null;
    }

    function isSavedResponseValid(id, response) {
        return typeof response === "string" && normalize(id, response) === response;
    }

    // We keep track of points lost on retries for each question.
    function points(id) {
        return Math.max(0, questions[id].maximum - 5 * (attempts.get(id)?.errors || 0));
    }

    function isCorrect(id) {
        return attempts.get(id)?.response === questions[id].correct;
    }

    function total() {
        return ids.reduce((sum, id) => sum + (isCorrect(id) ? points(id) : 0), 0);
    }

    function sessionTime() {
        const seconds = Math.min(
            35999999,
            Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        );

        const hours = String(Math.floor(seconds / 3600)).padStart(4, "0");
        const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, "0");
        const remainder = String(seconds % 60).padStart(2, "0");

        return `${hours}:${minutes}:${remainder}.00`;
    }

    // We save the screen and room progress together so learners can pick up where they left off.
    function snapshot(final = done, queue = pending) {
        const ui = uiProvider ? uiProvider() : savedUI;
        const data = {
            v: 3,
            done: final,
            ui,
            a: [...attempts].map(([id, attempt]) => [
                id, attempt.response, attempt.errors, attempt.count
            ]),
            p: queue,
            n: nextIndex
        };

        const json = JSON.stringify(data);

        if (json.length > 4096) {
            throw new Error("Suspend data exceeds SCORM 1.2 limit");
        }

        return {
            json,
            screen: final ? "completion" : ui?.screen || "welcome"
        };
    }

    function writeSessionFields(final) {
        write("cmi.core.session_time", sessionTime());
        write("cmi.core.exit", final ? "" : "suspend");
    }

    function store(final = done, queue = pending) {
        const data = snapshot(final, queue);

        write("cmi.suspend_data", data.json);
        write("cmi.core.lesson_location", data.screen);
        writeSessionFields(final);
        write("cmi.core.lesson_status", final ? "passed" : "incomplete");
    }

    function save() {
        if (!active || ended || !writable || practice || done || !uiProvider) {
            return true;
        }

        if (saving) return false;

        saving = true;

        try {
            // We save the queue first so a retry can use the same Moodle interaction numbers.
            store(false);
            commit();

            if (pending.length) {
                for (const [index, id, response, count, time] of pending) {
                    const question = questions[id];
                    const fields = {
                        id: `${id}_try_${String(count).padStart(2, "0")}_i${index}`,
                        type: question.type,
                        "correct_responses.0.pattern": question.correct,
                        weighting: question.maximum,
                        student_response: response,
                        result: response === question.correct ? "correct" : "wrong",
                        time
                    };

                    for (const [key, value] of Object.entries(fields)) {
                        write(`cmi.interactions.${index}.${key}`, value);
                    }
                }

                store(false, []);
                commit();
                pending.length = 0;
            }

            document.getElementById("lmsRetry").hidden = true;
            message("ההתקדמות והתשובות נשמרו ב־Moodle. אפשר לצאת ולחזור לאותו ניסיון.");
            return true;
        } catch (error) {
            failure();
            return false;
        } finally {
            saving = false;
        }
    }

    // A click can trigger several changes. We save them together.
    function scheduleSave() {
        if (queued) return;

        queued = true;
        queueMicrotask(() => {
            queued = false;
            save();
        });
    }

    function validateSaved(data) {
        if (
            !data ||
            data.v !== 3 ||
            typeof data.done !== "boolean" ||
            !Array.isArray(data.a) ||
            data.a.length > ids.length ||
            !Array.isArray(data.p) ||
            data.p.length > maxPendingInteractions ||
            !Number.isSafeInteger(data.n) ||
            data.n < 0
        ) {
            throw new Error("Invalid saved state");
        }

        const ui = data.ui;
        const screens = [
            "welcome", "intro", "preparation", "game",
            "transition", "assessment", "completion"
        ];
        const actions = ["stop", "move", "child", "report"];

        if (
            !ui ||
            !screens.includes(ui.screen) ||
            !Number.isInteger(ui.highestUnlocked) ||
            ui.highestUnlocked < 0 ||
            ui.highestUnlocked > 4 ||
            typeof ui.gameStarted !== "boolean" ||
            typeof ui.assessmentVisited !== "boolean" ||
            typeof ui.checked !== "boolean" ||
            !["", "a", "b", "c"].includes(ui.q1) ||
            !Array.isArray(ui.q2) ||
            ui.q2.length > actions.length ||
            ui.q2.some((value) => !actions.includes(value)) ||
            typeof ui.q3 !== "string" ||
            ui.q3.length > 32
        ) {
            throw new Error("Invalid saved UI");
        }

        // Older attempts can still open even if they were saved before we added the timer.
        if (
            (ui.reviewedHazards !== undefined &&
                (!Array.isArray(ui.reviewedHazards) ||
                    ui.reviewedHazards.length > hazardIds.length ||
                    new Set(ui.reviewedHazards).size !== ui.reviewedHazards.length ||
                    ui.reviewedHazards.some((id) => !hazardIds.includes(id)))) ||
            (ui.activeRoomMs !== undefined &&
                (!Number.isInteger(ui.activeRoomMs) ||
                    ui.activeRoomMs < 0 ||
                    ui.activeRoomMs > requiredRoomMs))
        ) {
            throw new Error("Invalid room progress");
        }

        const seen = new Set();

        for (const attempt of data.a) {
            if (!Array.isArray(attempt) || attempt.length !== 4) {
                throw new Error("Invalid attempt");
            }

            const [id, response, errors, count] = attempt;

            if (
                seen.has(id) ||
                !isSavedResponseValid(id, response) ||
                !Number.isSafeInteger(errors) ||
                errors < 0 ||
                !Number.isSafeInteger(count) ||
                count < 1 ||
                errors > count
            ) {
                throw new Error("Invalid attempt");
            }

            seen.add(id);
        }

        const indices = new Set();

        for (const entry of data.p) {
            if (!Array.isArray(entry) || entry.length !== 5) {
                throw new Error("Invalid queue");
            }

            const [index, id, response, count, time] = entry;

            if (
                !Number.isSafeInteger(index) ||
                index < 0 ||
                index >= data.n ||
                indices.has(index) ||
                !isSavedResponseValid(id, response) ||
                !Number.isSafeInteger(count) ||
                count < 1 ||
                typeof time !== "string" ||
                !/^\d{2}:\d{2}:\d{2}$/.test(time)
            ) {
                throw new Error("Invalid queue");
            }

            indices.add(index);
        }

        if (data.done) {
            const correctSaved = (id) => data.a.some(
                ([savedId, response]) => savedId === id && response === questions[id].correct
            );
            const legacy = ui.reviewedHazards === undefined && ui.activeRoomMs === undefined;
            const roomComplete = legacy ? gameIds.every(correctSaved) : roomRequirementsMet(ui);

            if (!ui.checked || !roomComplete || !assessmentIds.every(correctSaved)) {
                throw new Error("Invalid completion");
            }
        }
    }

    window.RogumLearning = Object.freeze({
        check(id, response) {
            response = normalize(id, response);
            if (response === null) return false;

            const previous = attempts.get(id);

            if (previous?.response === response) {
                scheduleSave();
                return true;
            }

            // Cap the queue when Moodle is unavailable so progress still fits in the saved data.
            if (pending.length >= maxPendingInteractions && !save()) return false;

            const correct = response === questions[id].correct;
            const current = {
                response,
                errors: (previous?.errors || 0) + (correct ? 0 : 1),
                count: (previous?.count || 0) + 1
            };

            attempts.set(id, current);

            if (active && writable && !practice && !done && !ended) {
                const now = new Date();
                const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
                    .map((value) => String(value).padStart(2, "0"))
                    .join(":");

                pending.push([nextIndex++, id, response, current.count, time]);
            }

            scheduleSave();
            return true;
        },

        points,

        assessmentPoints() {
            return assessmentIds.reduce((sum, id) => sum + points(id), 0);
        },

        handled() {
            return gameIds.filter(isCorrect).map((id) => id.slice(5));
        },

        restored() {
            return savedUI ? JSON.parse(JSON.stringify(savedUI)) : null;
        },

        isDone() {
            return done && !practice;
        },

        bind(provider) {
            uiProvider = provider;
            scheduleSave();
        },

        save: scheduleSave,

        // Reviewing the hazards unlocks the quiz. The quiz answers decide whether we can finish.
        complete() {
            const ui = uiProvider?.();

            if (
                !ui?.checked ||
                !roomRequirementsMet(ui) ||
                !assessmentIds.every(isCorrect)
            ) {
                return false;
            }

            if (practice || !active || !writable || done) return true;
            if (!save()) return false;

            try {
                const score = total();
                write("cmi.core.score.min", 0);
                write("cmi.core.score.max", 100);
                write("cmi.core.score.raw", score);

                store(true, []);
                commit();

                done = true;
                document.getElementById("lmsRetry").hidden = true;
                message(
                    `היחידה הושלמה בהצלחה! הציון ${score} מתוך 100 נשמר ב־Moodle, יחד עם סטטוס ההשלמה.`
                );

                return true;
            } catch (error) {
                failure();
                return false;
            }
        },

        beginPractice() {
            if (pending.length && !save()) return false;

            practice = true;
            attempts.clear();
            message(
                "מצב תרגול חוזר בלבד: התוצאה הרשמית נשמרת ללא שינוי. " +
                "כדי להתחיל ניסיון רשמי חדש, יש לפתוח ניסיון חדש ב־Moodle."
            );
            return true;
        }
    });

    function finish() {
        if (!active || ended) return;

        save();

        try {
            if (writable && !practice) {
                writeSessionFields(done);
                commit();
            }

            if (!scorm.quit()) {
                console.warn("SCORM: termination was not confirmed.");
            }
        } catch (error) {
            console.warn("SCORM: termination failed.");
        }

        ended = true;
        active = false;
    }

    document.addEventListener("DOMContentLoaded", () => {
        const learnerName = document.getElementById("learnerName");
        learnerName.textContent = learnerGreeting(null);

        document.getElementById("lmsRetry").addEventListener("click", () => {
            if (save()) {
                message(
                    "ההתקדמות נשמרה. אם התבצע ניסיון לסיים את היחידה, " +
                    "אפשר ללחוץ שוב על כפתור הסיום."
                );
            }
        });

        try {
            scorm = window.pipwerks?.SCORM;

            if (!scorm) {
                message(practiceMessage);
                return;
            }

            window.pipwerks.debug.isActive = false;
            scorm.version = "1.2";
            scorm.handleCompletionStatus = false;
            scorm.handleExitMode = false;

            if (!scorm.API.getHandle()) {
                message(practiceMessage);
                return;
            }

            if (!scorm.init()) throw new Error("Initialization failed");

            active = true;

            const mode = read("cmi.core.lesson_mode");
            const status = read("cmi.core.lesson_status");
            const count = read("cmi.interactions._count");

            if (!/^\d+$/.test(count)) {
                throw new Error("Invalid interaction count");
            }

            nextIndex = Number(count);

            const name = scorm.get("cmi.core.student_name");
            const nameReadOk = Number(scorm.debug.getCode()) === 0;
            learnerName.textContent = learnerGreeting(nameReadOk ? name : null);

            const raw = read("cmi.suspend_data");

            if (raw) {
                const data = JSON.parse(raw);
                validateSaved(data);
                savedUI = data.ui;

                for (const [id, response, errors, count] of data.a) {
                    attempts.set(id, { response, errors, count });
                }

                pending.push(...data.p);
                nextIndex = Math.max(nextIndex, data.n);
                done = data.done || status === "passed";
            } else if (nextIndex > 0 || status === "passed" || status === "completed") {
                message(
                    "זהו ניסיון מגרסה קודמת ללא נתוני שחזור מתאימים. אפשר לתרגל ללא דיווח. " +
                    "לצורך בדיקה חדשה, יש להתחיל ניסיון חדש ב־Moodle."
                );
                return;
            }

            writable = mode === "normal" && status !== "passed" && status !== "completed";

            if (mode === "review" || mode === "browse" || !writable) {
                message("מצב צפייה או תרגול בלבד: התוצאה וההתקדמות הרשמיות לא ישתנו.");
            } else if (done) {
                message("הניסיון הושלם. התוצאה השמורה מוצגת ללא התחלה מחדש.");
            } else {
                message(
                    raw
                        ? "ההתקדמות שוחזרה. אפשר להמשיך מאותה נקודה."
                        : "החיבור ל־Moodle פעיל. ההתקדמות תישמר במהלך הלמידה."
                );
            }
        } catch (error) {
            writable = false;
            savedUI = null;
            attempts.clear();
            pending.length = 0;
            message(
                "לא ניתן לקרוא או לשחזר את נתוני הניסיון. הנתונים הקיימים לא יידרסו. " +
                "אפשר לתרגל בלבד. מומלץ לפתוח מחדש את הפעילות או לפנות לצוות ההדרכה."
            );
            console.warn("SCORM: initialization or saved-state validation failed.");
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") save();
    });

    window.addEventListener("pagehide", finish);

    window.addEventListener("pageshow", (event) => {
        if (event.persisted && ended) window.location.reload();
    });
})();