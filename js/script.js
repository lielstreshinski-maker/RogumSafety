
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ==========================================
    // ROGUM SAFETY — GAME CONTROLLER
    // Complete replacement for script.js
    // ==========================================

    const $ = (id) => document.getElementById(id);

    const screens = {
        welcome: $("welcomeScreen"),
        intro: $("introScreen"),
        preparation: $("preparationScreen"),
        game: $("gameScreen"),
        transition: $("gameTransitionScreen"),
        assessment: $("assessmentScreen"),
        completion: $("completionScreen")
    };

    const titles = {
        welcome: $("welcome-title"),
        intro: $("intro-title"),
        preparation: $("preparation-title"),
        game: $("game-title"),
        transition: $("transition-title"),
        assessment: $("assessment-title"),
        completion: $("completion-title")
    };

    const navigationOrder = [
        "welcome",
        "intro",
        "preparation",
        "game",
        "assessment"
    ];

    const navToggle = $("navToggleBtn");
    const navigation = $("mainNavigation");
    const navButtons = [...document.querySelectorAll(".nav-step")];

    const roomButtons = [...document.querySelectorAll(".room-object")];

    const overlay = $("feedbackOverlay");
    const feedbackTitle = $("feedbackTitle");
    const feedbackTag = $("feedbackTag");
    const feedbackSticker = $("feedbackSticker");
    const feedbackDescription = $("feedbackDescription");
    const questionArea = $("questionArea");
    const answerOptions = $("answerOptions");
    const answerResult = $("answerResult");
    const feedbackContinue = $("feedbackContinueBtn");
    const feedbackClose = $("closeFeedbackBtn");

    const hazardCounter = $("hazardCounter");
    const hazardProgress = $("hazardProgress");
    const scoreCounter = $("scoreCounter");
    const transitionScore = $("transitionScore");
    const completionScore = $("completionScore");

    const assessmentForm = $("assessmentForm");
    const assessmentSummary = $("assessmentSummary");
    const question3Input = $("question3");
    const checkAssessment = $("checkAssessmentBtn");
    const finishAssessment = $("finishAssessmentBtn");

    const questionFeedback = [
        $("question1Feedback"),
        $("question2Feedback"),
        $("question3Feedback")
    ];

    // ==========================================
    // GAME CONTENT
    // ==========================================

    const objects = {
        cable: {
            title: "כבל חשמל במעבר",
            sticker: "assets/images/stickers/cable.png",
            hazard: true,
            description: "כבל חשמל מונח על הרצפה ועלול לגרום למעידה.",
            answers: [
                "להשאיר אותו ולבקש מהחניכים להיזהר",
                "להרחיק את החניכים ולדווח לרכז לטיפול בטוח",
                "למשוך את הכבל במהירות"
            ],
            correct: 1,
            explanation: "מרחיקים את המשתתפים מהסכנה ומדווחים לרכז כדי שהכבל יטופל בבטחה."
        },

        water: {
            title: "מים על הרצפה",
            sticker: "assets/images/stickers/water.png",
            hazard: true,
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
            sticker: "assets/images/stickers/backpack.png",
            hazard: true,
            description: "תיק מונח באמצע המעבר ועלול לגרום למעידה.",
            answers: [
                "לדאוג לפינוי התיק למקום אחסון מתאים",
                "להשאיר את התיק כי הוא קטן",
                "לבקש מהחניכים לדלג מעליו"
            ],
            correct: 0,
            explanation: "מעברים צריכים להישאר פנויים. יש לדאוג לפינוי התיק בצורה בטוחה."
        },

        scissors: {
            title: "מספריים על השולחן",
            sticker: "assets/images/stickers/scissors.png",
            hazard: true,
            description: "מספריים פתוחים הושארו על שולחן הפעילות ללא השגחה.",
            answers: [
                "להשאיר אותם על השולחן",
                "לזרוק אותם לרצפה",
                "לדאוג לאחסון סגור ובטוח לפי נהלי המרכז"
            ],
            correct: 2,
            explanation: "ציוד חד צריך להיות מאוחסן בבטחה כדי למנוע פציעות."
        },

        ball: {
            title: "כדור באזור המשחק",
            sticker: "assets/images/stickers/ball.png",
            hazard: false,
            description: "הכדור מונח באזור המשחק המיועד, ואינו חוסם מעבר.",
            explanation: "במיקום הנוכחי הכדור אינו מפגע. אם הוא יתגלגל למעבר, נצטרך לפנות אותו."
        },

        plant: {
            title: "עציץ בפינת החדר",
            sticker: "assets/images/stickers/plant.png",
            hazard: false,
            description: "העציץ יציב, נמצא בפינת החדר ואינו מפריע לתנועה.",
            explanation: "אין כאן מפגע כרגע. חשוב לוודא שהעציץ יציב ואינו חוסם מעבר."
        },

        books: {
            title: "ספרים על המדף",
            sticker: "assets/images/stickers/books.png",
            hazard: false,
            description: "הספרים מסודרים על המדף ואינם עומדים ליפול.",
            explanation: "ציוד שמאוחסן בצורה מסודרת ויציבה מסייע לשמור על חדר בטוח."
        },

        pencils: {
            title: "כלי כתיבה על השולחן",
            sticker: "assets/images/stickers/pencils.png",
            hazard: false,
            description: "כלי הכתיבה נמצאים על שולחן הפעילות באופן מסודר.",
            explanation: "כלי הכתיבה אינם מפגע במצבם הנוכחי. חשוב להחזיר אותם למקום בסיום השימוש."
        }
    };

    const totalHazards = 4;

    const state = {
        screen: "welcome",
        highestUnlocked: 0,
        gameStarted: false,
        found: new Set(),
        score: 0,
        currentObject: null,
        currentButton: null,
        previousFocus: null,
        wrongAttempts: new Set(),
        assessmentVisited: false,
        assessmentCompleted: false
    };

    // ==========================================
    // ACCESSIBILITY HELPERS
    // ==========================================

    function focusWithoutScroll(element) {
        if (!element) return;

        element.focus({
            preventScroll: true
        });
    }

    function visibleFocusableElements(container) {
        return [...container.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), ' +
            'select:not([disabled]), textarea:not([disabled]), ' +
            'a[href], [tabindex]:not([tabindex="-1"])'
        )].filter((element) => {
            return !element.hidden &&
                element.getClientRects().length > 0;
        });
    }

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    // ==========================================
    // NAVIGATION
    // ==========================================

    function navigationIndex(screen) {
        if (screen === "transition" || screen === "completion") {
            return 4;
        }

        return navigationOrder.indexOf(screen);
    }

    function updateNavigation() {
        const active = navigationIndex(state.screen);

        navButtons.forEach((button) => {
            const step = button.dataset.navStep;
            const index = navigationOrder.indexOf(step);
            const unlocked = index <= state.highestUnlocked;
            const selected = index === active;

            button.disabled = !unlocked;
            button.classList.toggle("locked", !unlocked);
            button.classList.toggle("active", selected);

            if (selected) {
                button.setAttribute("aria-current", "step");
            } else {
                button.removeAttribute("aria-current");
            }

            const lock = button.querySelector(".nav-lock");
            if (lock) lock.hidden = unlocked;

            const label = button.querySelector(".nav-step-label");

            if (label) {
                const text = label.textContent.trim();

                button.setAttribute(
                    "aria-label",
                    unlocked ? text : `${text} - השלב עדיין נעול`
                );
            }
        });
    }

    function unlock(screen) {
        const index = navigationOrder.indexOf(screen);

        if (index > state.highestUnlocked) {
            state.highestUnlocked = index;
        }

        updateNavigation();
    }

    function closeNavigation() {
        if (!navigation || !navToggle) return;

        navigation.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute(
            "aria-label",
            "פתיחת תפריט הניווט"
        );

        const icon = navToggle.querySelector(".nav-toggle-icon");
        if (icon) icon.textContent = "☰";
    }

    function showScreen(name) {
        const target = screens[name];
        if (!target) return;

        Object.values(screens).forEach((screen) => {
            if (screen) screen.hidden = true;
        });

        target.hidden = false;
        state.screen = name;

        if (name === "assessment") {
            state.assessmentVisited = true;
        }

        updateNavigation();
        closeNavigation();

        // Scroll only when intentionally changing screens.
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant"
        });

        focusWithoutScroll(titles[name]);
    }

    navToggle?.addEventListener("click", () => {
        const open = navigation.classList.toggle("is-open");

        navToggle.setAttribute("aria-expanded", String(open));
        navToggle.setAttribute(
            "aria-label",
            open ? "סגירת תפריט הניווט" : "פתיחת תפריט הניווט"
        );

        const icon = navToggle.querySelector(".nav-toggle-icon");
        if (icon) icon.textContent = open ? "✕" : "☰";
    });

    navButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.navStep;
            const index = navigationOrder.indexOf(target);

            if (index < 0 || index > state.highestUnlocked) {
                return;
            }

            if (target === "assessment") {
                if (state.assessmentCompleted) {
                    showScreen("completion");
                } else if (state.assessmentVisited) {
                    showScreen("assessment");
                } else {
                    showScreen("transition");
                }
                return;
            }

            showScreen(target);
        });
    });

    // ==========================================
    // BASIC SCREEN BUTTONS
    // ==========================================

    $("startBtn")?.addEventListener("click", () => {
        unlock("intro");
        showScreen("intro");
    });

    $("continueBtn")?.addEventListener("click", () => {
        unlock("preparation");
        showScreen("preparation");
    });

    $("backBtn")?.addEventListener("click", () => {
        showScreen("welcome");
    });

    $("backToIntroBtn")?.addEventListener("click", () => {
        showScreen("intro");
    });

    $("practiceBtn")?.addEventListener("click", () => {
        if (!state.gameStarted) {
            resetGame();
            state.gameStarted = true;
        }

        unlock("game");
        showScreen("game");
    });

    $("backToPreparationBtn")?.addEventListener("click", () => {
        showScreen("preparation");
    });

    $("continueToAssessmentBtn")?.addEventListener("click", () => {
        if (state.found.size !== totalHazards) return;
        showScreen("assessment");
    });

    // ==========================================
    // GAME PROGRESS
    // ==========================================

    function updateProgress() {
        const found = state.found.size;
        const percentage = found / totalHazards * 100;

        setText(hazardCounter, `${found} מתוך ${totalHazards}`);
        setText(scoreCounter, state.score);

        if (hazardProgress) {
            hazardProgress.style.width = `${percentage}%`;
            hazardProgress.setAttribute("aria-valuenow", found);
        }
    }

    // ==========================================
    // FEEDBACK MODAL
    // ==========================================

    function renderSticker(data) {
        feedbackSticker.replaceChildren();

        const image = document.createElement("img");
        image.src = data.sticker;
        image.alt = "";
        image.draggable = false;
        image.className = "feedback-object-image";

        feedbackSticker.appendChild(image);
    }

    function setAnswerResult(message, type = "success") {
        answerResult.textContent = message;
        answerResult.hidden = false;

        answerResult.classList.toggle("error", type === "error");
        answerResult.setAttribute("role", "status");
        answerResult.setAttribute("aria-live", "polite");
    }

    function openFeedback(objectId, button) {
        const data = objects[objectId];

        if (!data || state.found.has(objectId)) return;

        state.currentObject = objectId;
        state.currentButton = button;
        state.previousFocus = document.activeElement;

        renderSticker(data);

        setText(feedbackTitle, data.title);
        setText(feedbackDescription, data.description);

        answerOptions.replaceChildren();
        answerResult.textContent = "";
        answerResult.hidden = true;
        answerResult.classList.remove("error");

        feedbackContinue.hidden = true;
        feedbackContinue.textContent = "ממשיכים לחפש ←";

        if (data.hazard) {
            setText(feedbackTag, "זיהיתם מפגע");
            questionArea.hidden = false;

            data.answers.forEach((answer, index) => {
                const option = document.createElement("button");

                option.type = "button";
                option.className = "answer-button";
                option.textContent = answer;

                option.addEventListener("click", () => {
                    checkAnswer(index, option);
                });

                answerOptions.appendChild(option);
            });

        } else {
            setText(feedbackTag, "בדיקת חפץ בטוח");
            questionArea.hidden = true;

            setAnswerResult(data.explanation);
            feedbackContinue.hidden = false;
        }

        overlay.hidden = false;
        document.body.classList.add("dialog-open");

        // Prevent the background from jumping when dialog opens.
        focusWithoutScroll(feedbackTitle);
    }

    function checkAnswer(index, selectedButton) {
        const id = state.currentObject;
        const data = objects[id];

        if (!data || !data.hazard) return;

        if (index !== data.correct) {
            state.wrongAttempts.add(id);

            selectedButton.classList.add("wrong");
            selectedButton.disabled = true;

            setAnswerResult(
                "לא בדיוק. חשבו כיצד אפשר למנוע פגיעה ולשמור על המשתתפים. נסו שוב.",
                "error"
            );

            return;
        }

        selectedButton.classList.add("correct");

        answerOptions.querySelectorAll("button").forEach((button) => {
            button.disabled = true;
        });

        const earned = state.wrongAttempts.has(id) ? 5 : 10;

        if (!state.found.has(id)) {
            state.found.add(id);
            state.score += earned;
        }

        if (state.currentButton) {
            state.currentButton.classList.add("found");

            const original = state.currentButton.dataset.originalLabel ||
                state.currentButton.getAttribute("aria-label") ||
                data.title;

            state.currentButton.setAttribute(
                "aria-label",
                `${original} - טופל`
            );
        }

        setText(feedbackTag, "המפגע טופל בהצלחה");

        setAnswerResult(
            `${data.explanation} נוספו ${earned} נקודות!`
        );

        feedbackContinue.hidden = false;

        if (state.found.size === totalHazards) {
            feedbackContinue.textContent = "מסיימים את משימת החדר ←";
        }

        updateProgress();
        focusWithoutScroll(feedbackContinue);
    }

    function hideHandledObject(button) {
        if (!button) return;

        button.classList.add("found", "is-handled");
        button.disabled = true;
        button.setAttribute("aria-hidden", "true");
    }

    function closeFeedback() {
        if (overlay.hidden) return;

        const handled = state.found.has(state.currentObject);
        const previous = state.previousFocus;

        overlay.hidden = true;
        document.body.classList.remove("dialog-open");

        if (handled) {
            hideHandledObject(state.currentButton);
        }

        state.currentObject = null;
        state.currentButton = null;
        state.previousFocus = null;

        if (state.found.size === totalHazards) {
            setText(transitionScore, state.score);
            unlock("assessment");
            showScreen("transition");
            return;
        }

        // Restore focus without scrolling the room to the top.
        if (previous && !previous.disabled && previous.isConnected) {
            focusWithoutScroll(previous);
        } else {
            focusWithoutScroll(titles.game);
        }
    }

    roomButtons.forEach((button) => {
        const original = button.getAttribute("aria-label") || "";
        button.dataset.originalLabel = original;

        button.addEventListener("click", () => {
            openFeedback(button.dataset.object, button);
        });
    });

    feedbackContinue?.addEventListener("click", closeFeedback);
    feedbackClose?.addEventListener("click", closeFeedback);

    // ==========================================
    // KEYBOARD ACCESSIBILITY
    // ==========================================

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (overlay && !overlay.hidden) {
                event.preventDefault();
                closeFeedback();
                return;
            }

            if (navigation?.classList.contains("is-open")) {
                closeNavigation();
                focusWithoutScroll(navToggle);
            }
        }
    });

    overlay?.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;

        const focusable = visibleFocusableElements(overlay);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            focusWithoutScroll(last);
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            focusWithoutScroll(first);
        }
    });

    // ==========================================
    // ASSESSMENT HELPERS
    // ==========================================

    function setQuestionFeedback(element, type, message) {
        if (!element) return;

        element.textContent = message;
        element.hidden = false;

        element.classList.remove(
            "correct",
            "partial",
            "incorrect",
            "missing"
        );

        element.classList.add(type);
        element.setAttribute("role", "status");
    }

    function clearAssessmentFeedback() {
        questionFeedback.forEach((element) => {
            if (!element) return;

            element.hidden = true;
            element.textContent = "";

            element.classList.remove(
                "correct",
                "partial",
                "incorrect",
                "missing"
            );
        });

        assessmentSummary.hidden = true;
        assessmentSummary.textContent = "";
        assessmentSummary.classList.remove("all-correct");

        finishAssessment.hidden = true;
        checkAssessment.hidden = false;

        state.assessmentCompleted = false;
    }

    // ==========================================
    // FINAL ASSESSMENT
    // ==========================================

    assessmentForm?.addEventListener("submit", (event) => {
        event.preventDefault();

        const selectedQ1 = assessmentForm.querySelector(
            'input[name="question1"]:checked'
        );

        const selectedQ2 = [
            ...assessmentForm.querySelectorAll(
                'input[name="question2"]:checked'
            )
        ].map((input) => input.value);

        const q3 = question3Input.value.trim();

        let correctCount = 0;
        let missingCount = 0;

        // Question 1 — single choice

        if (!selectedQ1) {
            missingCount++;

            setQuestionFeedback(
                questionFeedback[0],
                "missing",
                "עדיין לא בחרתם תשובה לשאלה הזאת."
            );

        } else if (selectedQ1.value === "b") {
            correctCount++;

            setQuestionFeedback(
                questionFeedback[0],
                "correct",
                "נכון! ציוד שאינו תקין מוציאים משימוש, מונעים גישה אליו ומדווחים לרכז."
            );

        } else {
            setQuestionFeedback(
                questionFeedback[0],
                "incorrect",
                "לא בדיוק. מוציאים ציוד לא תקין משימוש ומדווחים לרכז. אין לנסות לתקן אותו בעצמנו."
            );
        }

        // Question 2 — multiple choice

        const correctValues = ["stop", "move", "report"];

        const correctSelections = selectedQ2.filter((value) => {
            return correctValues.includes(value);
        }).length;

        const incorrectSelections = selectedQ2.filter((value) => {
            return !correctValues.includes(value);
        }).length;

        const q2Correct =
            correctSelections === correctValues.length &&
            incorrectSelections === 0;

        if (selectedQ2.length === 0) {
            missingCount++;

            setQuestionFeedback(
                questionFeedback[1],
                "missing",
                "סמנו לפחות פעולה אחת לפני בדיקת התשובות."
            );

        } else if (q2Correct) {
            correctCount++;

            setQuestionFeedback(
                questionFeedback[1],
                "correct",
                "מצוין! עוצרים את הפעילות באזור המסוכן, מרחיקים את החניכים ומדווחים לרכז."
            );

        } else if (correctSelections > 0) {
            setQuestionFeedback(
                questionFeedback[1],
                "partial",
                "כמעט! בדקו אם בחרתם את כל הפעולות המתאימות ואם סימנתם פעולה שאינה בטוחה."
            );

        } else {
            setQuestionFeedback(
                questionFeedback[1],
                "incorrect",
                "חשבו על שלוש הפעולות המרכזיות: עצירה, הרחקה ודיווח."
            );
        }

        // Question 3 — numeric answer

        if (q3 === "") {
            missingCount++;

            setQuestionFeedback(
                questionFeedback[2],
                "missing",
                "הקלידו את מספר הפעולות המרכזיות."
            );

        } else if (
            !question3Input.validity.valid ||
            !Number.isInteger(Number(q3)) ||
            Number(q3) < 1 ||
            Number(q3) > 10
        ) {
            setQuestionFeedback(
                questionFeedback[2],
                "incorrect",
                "יש להזין מספר שלם בין 1 ל־10."
            );

        } else if (Number(q3) === 3) {
            correctCount++;

            setQuestionFeedback(
                questionFeedback[2],
                "correct",
                "נכון! שלוש הפעולות הן עצירת הפעילות, הרחקת החניכים ודיווח לרכז."
            );

        } else {
            setQuestionFeedback(
                questionFeedback[2],
                "incorrect",
                "לא בדיוק. חזרו לשלוש הפעולות: עצירה, הרחקה ודיווח."
            );
        }

        // Summary

        assessmentSummary.hidden = false;
        assessmentSummary.classList.remove("all-correct");

        if (missingCount > 0) {
            assessmentSummary.textContent =
                `עניתם נכון על ${correctCount} מתוך 3 שאלות. ` +
                `נותרו ${missingCount} שאלות שלא הושלמו.`;

        } else if (correctCount === 3) {
            state.assessmentCompleted = true;

            assessmentSummary.classList.add("all-correct");

            assessmentSummary.textContent =
                "כל הכבוד! עניתם נכון על כל שלוש השאלות והשלמתם את משימת הבטיחות.";

            checkAssessment.hidden = true;
            finishAssessment.hidden = false;

        } else {
            assessmentSummary.textContent =
                `עניתם נכון על ${correctCount} מתוך 3 שאלות. ` +
                "קראו את המשוב, תקנו את התשובות ונסו שוב.";
        }

        assessmentSummary.setAttribute("tabindex", "-1");
        focusWithoutScroll(assessmentSummary);

        assessmentSummary.scrollIntoView({
            behavior: "auto",
            block: "nearest"
        });
    });

    assessmentForm?.addEventListener("change", () => {
        clearAssessmentFeedback();
    });

    question3Input?.addEventListener("input", () => {
        clearAssessmentFeedback();
    });

    $("backToGameBtn")?.addEventListener("click", () => {
        showScreen("transition");
    });

    finishAssessment?.addEventListener("click", () => {
        if (!state.assessmentCompleted) return;

        setText(completionScore, state.score);
        showScreen("completion");
    });

    // ==========================================
    // RESET
    // ==========================================

    function resetAssessment() {
        assessmentForm?.reset();
        clearAssessmentFeedback();
        state.assessmentVisited = false;
    }

    function resetGame() {
        state.found.clear();
        state.score = 0;
        state.currentObject = null;
        state.currentButton = null;
        state.previousFocus = null;
        state.wrongAttempts.clear();

        roomButtons.forEach((button) => {
            button.classList.remove("found", "is-handled");

            button.style.opacity = "";
            button.style.transform = "";
            button.style.transition = "";
            button.style.pointerEvents = "";

            button.disabled = false;
            button.removeAttribute("aria-hidden");

            button.setAttribute(
                "aria-label",
                button.dataset.originalLabel || ""
            );
        });

        overlay.hidden = true;
        document.body.classList.remove("dialog-open");

        setText(transitionScore, "0");
        setText(completionScore, "0");

        resetAssessment();
        updateProgress();
    }

    $("restartBtn")?.addEventListener("click", () => {
        resetGame();
        state.gameStarted = true;
        showScreen("game");
    });

    // ==========================================
    // INITIALIZATION
    // ==========================================

    resetGame();
    updateNavigation();
    showScreen("welcome");
});
