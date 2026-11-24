document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const $ = (id) => document.getElementById(id);
    const learning = window.RogumLearning;

    const screens = {
        welcome: [$("welcomeScreen"), $("welcome-title")],
        intro: [$("introScreen"), $("intro-title")],
        preparation: [$("preparationScreen"), $("preparation-title")],
        game: [$("gameScreen"), $("game-title")],
        transition: [$("gameTransitionScreen"), $("transition-title")],
        assessment: [$("assessmentScreen"), $("assessment-title")],
        completion: [$("completionScreen"), $("completion-title")]
    };

    const assessmentScreens = ["transition", "assessment", "completion"];
    const navigationOrder = [
        "welcome", "intro", "preparation", "game", "assessment"
    ];

    const navToggle = $("navToggleBtn");
    const navigation = $("mainNavigation");
    const navButtons = [...document.querySelectorAll(".nav-step")];
    const roomButtons = [...document.querySelectorAll(".room-object")];
    const roomToAssessment = $("roomToAssessmentBtn");
    const continueToAssessment = $("continueToAssessmentBtn");
    const unlockStatus = $("assessmentUnlockStatus");

    const overlay = $("feedbackOverlay");
    const feedbackTitle = $("feedbackTitle");
    const questionArea = $("questionArea");
    const answerOptions = $("answerOptions");
    const answerResult = $("answerResult");
    const hazardExplanation = $("hazardExplanation");
    const feedbackContinue = $("feedbackContinueBtn");

    const assessmentForm = $("assessmentForm");
    const assessmentSummary = $("assessmentSummary");
    const question1Inputs = [...assessmentForm.querySelectorAll('input[name="question1"]')];
    const question2Inputs = [...assessmentForm.querySelectorAll('input[name="question2"]')];
    const question3Input = $("question3");
    const checkAssessment = $("checkAssessmentBtn");
    const finishAssessment = $("finishAssessmentBtn");
    const questionFeedback = [
        $("question1Feedback"),
        $("question2Feedback"),
        $("question3Feedback")
    ];

    // One dialog uses these details to give feedback for each object in the room.
    const objects = {
        cable: {
            title: "כבל חשמל במעבר",
            sticker: "cable.png",
            description: "כבל חשמל מונח על הרצפה ועלול לגרום למעידה.",
            answers: [
                "להשאיר את הכבל ולבקש מהמשתתפים להיזהר",
                "להרחיק את המשתתפים ולדווח לרכז לטיפול בטוח",
                "למשוך את הכבל במהירות"
            ],
            correct: 1,
            explanation: "מרחיקים את המשתתפים מהסכנה ומדווחים לרכז כדי שהכבל יטופל בבטחה."
        },
        water: {
            title: "מים על הרצפה",
            sticker: "water.png",
            description: "על הרצפה יש מים שעלולים לגרום להחלקה.",
            answers: [
                "להמשיך בפעילות כרגיל",
                "לכסות את המים בתיק",
                "להרחיק משתתפים ולדאוג לטיפול במפגע"
            ],
            correct: 2,
            explanation: "יש למנוע גישה לאזור הרטוב ולדאוג לטיפול בו לפני המשך הפעילות."
        },
        bag: {
            title: "תיק שחוסם מעבר",
            sticker: "backpack.png",
            description: "תיק מונח באמצע המעבר ועלול לגרום למעידה.",
            answers: [
                "לדאוג לפינוי התיק למקום אחסון מתאים",
                "להשאיר את התיק כי הוא קטן",
                "לבקש מהמשתתפים לדלג מעליו"
            ],
            correct: 0,
            explanation: "מעברים צריכים להישאר פנויים. יש לדאוג לפינוי התיק בצורה בטוחה."
        },
        scissors: {
            title: "מספריים על השולחן",
            sticker: "scissors.png",
            description: "מספריים פתוחים הושארו על שולחן הפעילות ללא השגחה.",
            answers: [
                "להשאיר את המספריים על השולחן",
                "לזרוק את המספריים לרצפה",
                "לדאוג לאחסון סגור ובטוח לפי נהלי המרכז"
            ],
            correct: 2,
            explanation: "ציוד חד צריך להיות מאוחסן בבטחה כדי למנוע פציעות."
        },
        ball: {
            title: "כדור באזור המשחק",
            sticker: "ball.png",
            description: "הכדור מונח באזור המשחק המיועד, ואינו חוסם מעבר.",
            explanation: "במיקום הנוכחי הכדור אינו מפגע. אם הוא יתגלגל למעבר, יהיה צורך לפנות אותו."
        },
        plant: {
            title: "עציץ בפינת החדר",
            sticker: "plant.png",
            description: "העציץ יציב, נמצא בפינת החדר ואינו מפריע לתנועה.",
            explanation: "אין כאן מפגע כרגע. חשוב לוודא שהעציץ יציב ואינו חוסם מעבר."
        },
        books: {
            title: "ספרים על המדף",
            sticker: "books.png",
            description: "הספרים מסודרים על המדף ואינם עומדים ליפול.",
            explanation: "ציוד שמאוחסן בצורה מסודרת ויציבה מסייע לשמור על חדר בטוח."
        },
        pencils: {
            title: "כלי כתיבה על השולחן",
            sticker: "pencils.png",
            description: "כלי הכתיבה נמצאים על שולחן הפעילות באופן מסודר.",
            explanation: "כלי הכתיבה אינם מפגע במצבם הנוכחי. חשוב להחזיר אותם למקום בסיום השימוש."
        }
    };

    const hazardIds = Object.keys(objects).filter((id) => objects[id].answers);
    const requiredRoomMs = 45_000;
    const correctActions = ["stop", "move", "report"];
    const actionCodes = { stop: "a", move: "b", child: "c", report: "d" };

    const state = {
        screen: "welcome",
        highestUnlocked: 0,
        gameStarted: false,
        reviewedHazards: new Set(),
        activeRoomMs: 0,
        roomStartedAt: null,
        lastSavedRoomMs: 0,
        currentObject: null,
        previousFocus: null,
        assessmentVisited: false,
        assessmentCompleted: false
    };

    function focusWithoutScroll(element) {
        element?.focus({ preventScroll: true });
    }

    function gameScore() {
        return learning.handled().reduce((score, id) => {
            return score + learning.points(`game_${id}`);
        }, 0);
    }

    // We use the clock to count room time so a late timer callback does not change the total.
    function elapsedRoomMs(now = performance.now()) {
        const currentPeriod = state.roomStartedAt === null
            ? 0
            : now - state.roomStartedAt;

        return Math.min(requiredRoomMs, state.activeRoomMs + currentPeriod);
    }

    function assessmentIsAvailable() {
        return learning.isDone() || (
            state.reviewedHazards.size === hazardIds.length &&
            elapsedRoomMs() >= requiredRoomMs
        );
    }

    function updateNavigation(available = assessmentIsAvailable()) {
        const activeStep = assessmentScreens.includes(state.screen)
            ? "assessment"
            : state.screen;

        navButtons.forEach((button) => {
            const step = button.dataset.navStep;
            const unlocked = step === "assessment"
                ? available
                : navigationOrder.indexOf(step) <= state.highestUnlocked;
            const selected = step === activeStep;
            const label = button.querySelector(".nav-step-label").textContent.trim();
            const lock = button.querySelector(".nav-lock");

            button.disabled = !unlocked;
            button.classList.toggle("locked", !unlocked);
            button.classList.toggle("active", selected);
            button.setAttribute("aria-label", unlocked ? label : `${label} - השלב עדיין נעול`);

            if (selected) {
                button.setAttribute("aria-current", "step");
            } else {
                button.removeAttribute("aria-current");
            }

            if (lock) lock.hidden = unlocked;
        });
    }

    function setNavigationOpen(open) {
        navigation.classList.toggle("is-open", open);
        navToggle.setAttribute("aria-expanded", String(open));
        navToggle.setAttribute(
            "aria-label",
            open ? "סגירת תפריט הניווט" : "פתיחת תפריט הניווט"
        );
        navToggle.querySelector(".nav-toggle-icon").textContent = open ? "✕" : "☰";
    }

    function updateRoomProgress() {
        const reviewed = state.reviewedHazards.size;
        const secondsLeft = Math.ceil((requiredRoomMs - elapsedRoomMs()) / 1000);
        const available = assessmentIsAvailable();
        const progress = $("hazardProgress");

        $("hazardCounter").textContent = `${reviewed} מתוך ${hazardIds.length}`;
        $("scoreCounter").textContent = gameScore();
        $("roomTimeRemaining").textContent = secondsLeft;
        progress.style.width = `${reviewed / hazardIds.length * 100}%`;
        progress.setAttribute("aria-valuenow", String(reviewed));

        const availabilityChanged = roomToAssessment.disabled === available;
        roomToAssessment.disabled = !available;
        continueToAssessment.disabled = !available;

        if (availabilityChanged) updateNavigation(available);

        let message = "השאלון ייפתח לאחר בדיקת המפגעים והשלמת זמן הסריקה.";
        if (available) {
            message = "השאלון זמין עכשיו. אפשר להמשיך לשאלון הסיכום.";
        } else if (reviewed === hazardIds.length) {
            message = "כל המפגעים נבדקו. עד לסיום הסריקה, אפשר לבדוק היכן המעבר נשאר פנוי.";
        } else if (secondsLeft === 0) {
            message = "זמן הסריקה הושלם. עוד נותר לבדוק את המפגעים שלא סומנו.";
        }

        if (unlockStatus.textContent.trim() !== message) {
            unlockStatus.textContent = message;
        }
    }

    // Time counts while the room is visible and the browser window has focus.
    function syncRoomClock() {
        const now = performance.now();

        if (state.roomStartedAt !== null) {
            state.activeRoomMs = elapsedRoomMs(now);
        }

        const countTime = state.gameStarted &&
            state.screen === "game" &&
            document.visibilityState === "visible" &&
            document.hasFocus() &&
            state.activeRoomMs < requiredRoomMs;

        state.roomStartedAt = countTime ? now : null;
        updateRoomProgress();
    }

    function saveRoomProgress() {
        const elapsed = Math.floor(elapsedRoomMs());
        if (elapsed !== state.lastSavedRoomMs) {
            state.lastSavedRoomMs = elapsed;
            learning.save();
        }
    }

    function showScreen(name) {
        if (assessmentScreens.includes(name) && !assessmentIsAvailable()) {
            return;
        }

        Object.entries(screens).forEach(([key, [section]]) => {
            section.hidden = key !== name;
        });

        state.screen = name;
        if (name === "assessment") state.assessmentVisited = true;
        if (name === "transition") $("transitionScore").textContent = gameScore();
        if (name === "completion") {
            $("completionScore").textContent = gameScore() + learning.assessmentPoints();
        }

        setNavigationOpen(false);
        syncRoomClock();
        updateNavigation();
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        focusWithoutScroll(screens[name][1]);
        learning.save();
    }

    function visitStep(name) {
        state.highestUnlocked = Math.max(
            state.highestUnlocked,
            navigationOrder.indexOf(name)
        );
        showScreen(name);
    }

    function openAssessmentStep() {
        if (!assessmentIsAvailable()) return;

        if (learning.isDone() || state.screen === "completion") {
            showScreen("completion");
        } else if (state.assessmentVisited) {
            showScreen("assessment");
        } else {
            showScreen("transition");
        }
    }

    navToggle.addEventListener("click", () => {
        setNavigationOpen(!navigation.classList.contains("is-open"));
    });

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (button.disabled || !overlay.hidden) return;

            const target = button.dataset.navStep;
            if (target === "assessment") {
                openAssessmentStep();
            } else {
                showScreen(target);
            }
        });
    });

    $("startBtn").addEventListener("click", () => visitStep("intro"));
    $("continueBtn").addEventListener("click", () => visitStep("preparation"));
    $("backBtn").addEventListener("click", () => showScreen("welcome"));
    $("backToIntroBtn").addEventListener("click", () => showScreen("intro"));
    $("backToPreparationBtn").addEventListener("click", () => showScreen("preparation"));
    $("practiceBtn").addEventListener("click", () => {
        state.gameStarted = true;
        visitStep("game");
    });

    roomToAssessment.addEventListener("click", openAssessmentStep);
    continueToAssessment.addEventListener("click", () => showScreen("assessment"));
    $("backToGameBtn").addEventListener("click", () => showScreen("game"));

    function onRoomFocusChanged() {
        syncRoomClock();
        saveRoomProgress();
    }

    document.addEventListener("visibilitychange", onRoomFocusChanged);
    window.addEventListener("blur", onRoomFocusChanged);
    window.addEventListener("focus", onRoomFocusChanged);
    window.addEventListener("pageshow", onRoomFocusChanged);

    // Save at intervals so we can resume without asking Moodle to save on every tick.
    window.setInterval(() => {
        if (state.roomStartedAt === null) return;

        syncRoomClock();
        if (state.activeRoomMs === requiredRoomMs ||
            state.activeRoomMs - state.lastSavedRoomMs >= 5000) {
            saveRoomProgress();
        }
    }, 250);

    function renderReviewedObjects() {
        roomButtons.forEach((button) => {
            const reviewed = state.reviewedHazards.has(button.dataset.object);
            const label = button.dataset.originalLabel;

            button.classList.toggle("found", reviewed);
            button.setAttribute("aria-label", reviewed ? `${label} - נבדק` : label);
        });
    }

    function setAnswerResult(message, isError = false) {
        answerResult.textContent = message;
        answerResult.classList.toggle("error", isError);
        answerResult.hidden = false;
    }

    // Learners can read the explanation and continue after any checked answer.
    function showHazardExplanation(data) {
        $("hazardExplanationText").textContent = data.explanation;
        hazardExplanation.hidden = false;
        feedbackContinue.hidden = false;
    }

    function checkGameAnswer(id, index, selectedButton) {
        const data = objects[id];
        const response = String.fromCharCode(97 + index);

        if (!learning.check(`game_${id}`, response)) return;

        showHazardExplanation(data);

        if (index === data.correct) {
            selectedButton.classList.add("correct");
            answerOptions.querySelectorAll("button").forEach((button) => {
                button.disabled = true;
            });
            const earned = learning.points(`game_${id}`);
            setAnswerResult(`נכון! ניקוד המפגע: ${earned} מתוך 10.`);
        } else {
            selectedButton.classList.add("wrong");
            selectedButton.disabled = true;
            setAnswerResult("לא בדיוק. אפשר לקרוא את ההסבר, לנסות שוב או לחזור לחדר.", true);
        }

        updateRoomProgress();
        focusWithoutScroll(feedbackContinue);
    }

    function openFeedback(id, button) {
        const data = objects[id];
        if (!data || !overlay.hidden) return;

        state.currentObject = id;
        state.previousFocus = button;
        feedbackTitle.textContent = data.title;
        $("feedbackDescription").textContent = data.description;
        $("feedbackTag").textContent = data.answers ? "נמצא מפגע" : "בדיקת חפץ בטוח";

        const image = document.createElement("img");
        image.src = `assets/images/stickers/${data.sticker}`;
        image.alt = "";
        image.draggable = false;
        image.className = "feedback-object-image";
        $("feedbackSticker").replaceChildren(image);

        answerOptions.replaceChildren();
        answerResult.textContent = "";
        answerResult.hidden = true;
        answerResult.classList.remove("error");
        hazardExplanation.hidden = true;
        feedbackContinue.hidden = true;

        const alreadyCorrect = learning.handled().includes(id);
        questionArea.hidden = !data.answers || alreadyCorrect;

        if (!data.answers) {
            setAnswerResult(data.explanation);
            feedbackContinue.hidden = false;
        } else if (alreadyCorrect) {
            showHazardExplanation(data);
        } else {
            data.answers.forEach((answer, index) => {
                const option = document.createElement("button");
                option.type = "button";
                option.className = "answer-button";
                option.textContent = answer;
                option.addEventListener("click", () => checkGameAnswer(id, index, option));
                answerOptions.appendChild(option);
            });

            if (state.reviewedHazards.has(id)) {
                showHazardExplanation(data);
            }
        }

        overlay.hidden = false;
        document.body.classList.add("dialog-open");
        focusWithoutScroll(feedbackTitle);
    }

    function closeFeedback(confirmReview = false) {
        if (overlay.hidden) return;

        if (confirmReview && !hazardExplanation.hidden) {
            state.reviewedHazards.add(state.currentObject);
        }

        const previous = state.previousFocus;
        state.currentObject = null;
        state.previousFocus = null;
        overlay.hidden = true;
        document.body.classList.remove("dialog-open");

        renderReviewedObjects();
        syncRoomClock();
        learning.save();
        focusWithoutScroll(previous || screens.game[1]);
    }

    roomButtons.forEach((button) => {
        button.dataset.originalLabel = button.getAttribute("aria-label");
        button.addEventListener("click", () => openFeedback(button.dataset.object, button));
    });

    feedbackContinue.addEventListener("click", () => closeFeedback(true));
    $("closeFeedbackBtn").addEventListener("click", () => closeFeedback());

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        if (!overlay.hidden) {
            event.preventDefault();
            closeFeedback();
        } else if (navigation.classList.contains("is-open")) {
            setNavigationOpen(false);
            focusWithoutScroll(navToggle);
        }
    });

    // Keep Tab inside the feedback window until it is closed.
    overlay.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;

        const focusable = [...overlay.querySelectorAll("button:not([disabled])")]
            .filter((button) => button.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable.at(-1);
        const active = document.activeElement;

        if (event.shiftKey && (active === first || !focusable.includes(active))) {
            event.preventDefault();
            focusWithoutScroll(last);
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            focusWithoutScroll(first);
        }
    });

    function setQuestionFeedback(index, type, message) {
        const feedback = questionFeedback[index];
        feedback.classList.remove("correct", "partial", "incorrect", "missing");
        feedback.classList.add(type);
        feedback.textContent = message;
        feedback.hidden = false;
    }

    function clearAssessmentFeedback() {
        questionFeedback.forEach((feedback) => {
            feedback.hidden = true;
            feedback.textContent = "";
        });

        assessmentSummary.hidden = true;
        assessmentSummary.textContent = "";
        assessmentSummary.classList.remove("all-correct");
        checkAssessment.hidden = false;
        finishAssessment.hidden = true;
        state.assessmentCompleted = false;
    }

    function getDraft() {
        return {
            q1: question1Inputs.find((input) => input.checked)?.value || "",
            q2: question2Inputs.filter((input) => input.checked).map((input) => input.value),
            q3: question3Input.value.slice(0, 32)
        };
    }

    function correctActionSelection(values) {
        return values.length === correctActions.length &&
            correctActions.every((value) => values.includes(value));
    }

    function showAssessmentSummary(message, checked) {
        state.assessmentCompleted = checked;
        assessmentSummary.textContent = message;
        assessmentSummary.hidden = false;
        assessmentSummary.classList.toggle("all-correct", checked);
        checkAssessment.hidden = checked;
        finishAssessment.hidden = !checked;
    }

    assessmentForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (state.screen !== "assessment" || !assessmentIsAvailable()) return;

        const { q1, q2, q3 } = getDraft();
        const q3Value = Number(q3);
        const q3Valid = q3 !== "" && question3Input.validity.valid &&
            Number.isInteger(q3Value) && q3Value >= 1 && q3Value <= 10;

        const q1Correct = q1 === "b";
        const q2Correct = correctActionSelection(q2);
        const q3Correct = q3Valid && q3Value === 3;
        const correctCount = [q1Correct, q2Correct, q3Correct].filter(Boolean).length;
        const missingCount = [!q1, q2.length === 0, q3 === ""].filter(Boolean).length;

        if (!q1) {
            setQuestionFeedback(0, "missing", "עדיין לא נבחרה תשובה לשאלה הזאת.");
        } else if (q1Correct) {
            setQuestionFeedback(0, "correct",
                "נכון! ציוד שאינו תקין מוציאים משימוש, מונעים גישה אליו ומדווחים לרכז.");
        } else {
            setQuestionFeedback(0, "incorrect",
                "לא בדיוק. מוציאים ציוד לא תקין משימוש ומדווחים לרכז. אין לנסות לתקן אותו באופן עצמאי.");
        }

        if (q2.length === 0) {
            setQuestionFeedback(1, "missing", "יש לבחור לפחות פעולה אחת לפני בדיקת התשובות.");
        } else if (q2Correct) {
            setQuestionFeedback(1, "correct",
                "מצוין! עוצרים את הפעילות באזור המסוכן, מרחיקים את המשתתפים ומדווחים לרכז.");
        } else if (q2.some((value) => correctActions.includes(value))) {
            setQuestionFeedback(1, "partial",
                "כמעט! כדאי לבדוק אם נבחרו כל הפעולות המתאימות ואם סומנה פעולה שאינה בטוחה.");
        } else {
            setQuestionFeedback(1, "incorrect",
                "כדאי לחשוב על שלוש הפעולות המרכזיות: עצירה, הרחקה ודיווח.");
        }

        if (q3 === "") {
            setQuestionFeedback(2, "missing", "יש להזין את מספר הפעולות המרכזיות.");
        } else if (!q3Valid) {
            setQuestionFeedback(2, "incorrect", "יש להזין מספר שלם בין 1 ל־10.");
        } else if (q3Correct) {
            setQuestionFeedback(2, "correct",
                "נכון! שלוש הפעולות הן עצירת הפעילות, הרחקת המשתתפים ודיווח לרכז.");
        } else {
            setQuestionFeedback(2, "incorrect",
                "לא בדיוק. כדאי לחזור לשלוש הפעולות: עצירה, הרחקה ודיווח.");
        }

        // Send only answers we can score. Blank or invalid fields stay out of the report.
        const responses = [];
        if (q1) responses.push(["assessment_equipment", q1]);
        if (q2.length) {
            const codes = q2.map((value) => actionCodes[value]).sort().join(",");
            responses.push(["assessment_actions", codes]);
        }
        if (q3Valid) responses.push(["assessment_steps", String(q3Value)]);

        const allAccepted = responses.map(([id, response]) => learning.check(id, response)).every(Boolean);
        $("assessmentPoints").textContent = learning.assessmentPoints();

        if (!allAccepted) {
            showAssessmentSummary("חלק מהתשובות לא נקלטו. אפשר לנסות לבדוק אותן שוב.", false);
        } else if (correctCount === 3) {
            showAssessmentSummary("כל הכבוד! כל שלוש השאלות נענו נכון. אפשר לסיים את היחידה.", true);
        } else if (missingCount > 0) {
            showAssessmentSummary(
                `מספר התשובות הנכונות: ${correctCount} מתוך 3. שאלות שטרם הושלמו: ${missingCount}.`,
                false
            );
        } else {
            showAssessmentSummary(
                `מספר התשובות הנכונות: ${correctCount} מתוך 3. כדאי לקרוא את המשוב ולנסות שוב.`,
                false
            );
        }

        assessmentSummary.tabIndex = -1;
        focusWithoutScroll(assessmentSummary);
        assessmentSummary.scrollIntoView({ behavior: "auto", block: "nearest" });
        learning.save();
    });

    function onAssessmentEdited() {
        clearAssessmentFeedback();
        learning.save();
    }

    assessmentForm.addEventListener("change", (event) => {
        if (event.target !== question3Input) onAssessmentEdited();
    });
    question3Input.addEventListener("input", onAssessmentEdited);

    finishAssessment.addEventListener("click", () => {
        if (state.screen !== "assessment" ||
            !assessmentIsAvailable() ||
            !state.assessmentCompleted) {
            return;
        }

        if (learning.complete()) showScreen("completion");
    });

    $("restartBtn").addEventListener("click", () => {
        if (!learning.beginPractice()) return;

        state.highestUnlocked = navigationOrder.indexOf("game");
        state.gameStarted = true;
        state.reviewedHazards.clear();
        state.activeRoomMs = 0;
        state.roomStartedAt = null;
        state.lastSavedRoomMs = 0;
        state.assessmentVisited = false;

        assessmentForm.reset();
        clearAssessmentFeedback();
        $("assessmentPoints").textContent = learning.assessmentPoints();

        renderReviewedObjects();
        showScreen("game");
    });

    const restored = learning.restored();
    let initialScreen = restored?.screen || "welcome";

    if (restored) {
        state.highestUnlocked = Math.min(
            restored.highestUnlocked,
            navigationOrder.indexOf("game")
        );
        state.gameStarted = restored.gameStarted;
        state.assessmentVisited = restored.assessmentVisited;

        // Before we tracked reviews, a correct answer was how we marked a hazard as reviewed.
        const savedHazards = Array.isArray(restored.reviewedHazards)
            ? restored.reviewedHazards
            : learning.handled();

        state.reviewedHazards = new Set(
            savedHazards.filter((id) => hazardIds.includes(id))
        );

        if (Number.isFinite(restored.activeRoomMs)) {
            state.activeRoomMs = Math.min(requiredRoomMs, Math.max(0, restored.activeRoomMs));
        }
        state.lastSavedRoomMs = state.activeRoomMs;

        question1Inputs.forEach((input) => {
            input.checked = input.value === restored.q1;
        });
        question2Inputs.forEach((input) => {
            input.checked = restored.q2.includes(input.value);
        });
        question3Input.value = restored.q3;

        const draft = getDraft();
        if (restored.checked && draft.q1 === "b" &&
            correctActionSelection(draft.q2) && Number(draft.q3) === 3) {
            showAssessmentSummary("התשובות הנכונות שוחזרו. אפשר לסיים את היחידה.", true);
        }
    }

    if (learning.isDone()) {
        initialScreen = "completion";
    } else if (!assessmentIsAvailable() && assessmentScreens.includes(initialScreen)) {
        initialScreen = "game";
    }

    // Give lms.js the room progress and the current quiz answers for the next save.
    learning.bind(() => ({
        screen: state.screen,
        highestUnlocked: assessmentIsAvailable()
            ? navigationOrder.indexOf("assessment")
            : state.highestUnlocked,
        gameStarted: state.gameStarted,
        assessmentVisited: state.assessmentVisited,
        checked: state.assessmentCompleted,
        reviewedHazards: [...state.reviewedHazards],
        activeRoomMs: Math.floor(elapsedRoomMs()),
        ...getDraft()
    }));

    renderReviewedObjects();
    $("assessmentPoints").textContent = learning.assessmentPoints();
    showScreen(initialScreen);
});