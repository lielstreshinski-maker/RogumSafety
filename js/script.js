
document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // 1. SCREEN ELEMENTS
    // =========================================

    const screenMap = {
        welcome: document.getElementById("welcomeScreen"),
        intro: document.getElementById("introScreen"),
        preparation: document.getElementById("preparationScreen"),
        game: document.getElementById("gameScreen"),
        transition: document.getElementById("gameTransitionScreen"),
        assessment: document.getElementById("assessmentScreen"),
        completion: document.getElementById("completionScreen")
    };

    const screenTitles = {
        welcome: document.getElementById("welcome-title"),
        intro: document.getElementById("intro-title"),
        preparation: document.getElementById("preparation-title"),
        game: document.getElementById("game-title"),
        transition: document.getElementById("transition-title"),
        assessment: document.getElementById("assessment-title"),
        completion: document.getElementById("completion-title")
    };

    // =========================================
    // 2. GUIDED NAVIGATION
    // =========================================

    const navToggleBtn = document.getElementById("navToggleBtn");
    const mainNavigation = document.getElementById("mainNavigation");
    const navStepButtons = document.querySelectorAll(".nav-step");

    const navigationOrder = [
        "welcome",
        "intro",
        "preparation",
        "game",
        "assessment"
    ];

    let highestUnlockedStep = 0;
    let currentScreenName = "welcome";
    let assessmentVisited = false;
    let assessmentCompleted = false;

    function getNavigationIndex(screenName) {
        if (screenName === "transition" || screenName === "completion") {
            return 4;
        }

        return navigationOrder.indexOf(screenName);
    }

    function updateNavigation() {
        const activeIndex = getNavigationIndex(currentScreenName);

        navStepButtons.forEach(function (button) {
            const stepName = button.dataset.navStep;
            const stepIndex = navigationOrder.indexOf(stepName);
            const isUnlocked = stepIndex <= highestUnlockedStep;
            const isActive = stepIndex === activeIndex;

            button.disabled = !isUnlocked;
            button.classList.toggle("locked", !isUnlocked);
            button.classList.toggle("active", isActive);

            if (isActive) {
                button.setAttribute("aria-current", "step");
            } else {
                button.removeAttribute("aria-current");
            }

            const lockIcon = button.querySelector(".nav-lock");

            if (lockIcon) {
                lockIcon.hidden = isUnlocked;
            }

            const label = button.querySelector(".nav-step-label");

            if (label) {
                const labelText = label.textContent.trim();

                button.setAttribute(
                    "aria-label",
                    isUnlocked
                        ? labelText
                        : labelText + " - השלב עדיין נעול"
                );
            }
        });
    }

    function unlockStep(screenName) {
        const index = navigationOrder.indexOf(screenName);

        if (index > highestUnlockedStep) {
            highestUnlockedStep = index;
        }

        updateNavigation();
    }

    function closeMobileNavigation() {
        mainNavigation.classList.remove("is-open");

        navToggleBtn.setAttribute("aria-expanded", "false");
        navToggleBtn.setAttribute(
            "aria-label",
            "פתיחת תפריט הניווט"
        );

        const icon = navToggleBtn.querySelector(".nav-toggle-icon");

        if (icon) {
            icon.textContent = "☰";
        }
    }

    function showScreen(screenName) {
        const screen = screenMap[screenName];

        if (!screen) {
            return;
        }

        Object.values(screenMap).forEach(function (item) {
            item.hidden = true;
        });

        screen.hidden = false;
        currentScreenName = screenName;

        if (screenName === "assessment") {
            assessmentVisited = true;
        }

        updateNavigation();
        closeMobileNavigation();

        window.scrollTo(0, 0);

        const title = screenTitles[screenName];

        if (title) {
            title.focus();
        }
    }

    navToggleBtn.addEventListener("click", function () {
        const isOpen = mainNavigation.classList.toggle("is-open");

        navToggleBtn.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        navToggleBtn.setAttribute(
            "aria-label",
            isOpen
                ? "סגירת תפריט הניווט"
                : "פתיחת תפריט הניווט"
        );

        const icon = navToggleBtn.querySelector(".nav-toggle-icon");

        if (icon) {
            icon.textContent = isOpen ? "✕" : "☰";
        }
    });

    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            mainNavigation.classList.contains("is-open")
        ) {
            closeMobileNavigation();
            navToggleBtn.focus();
        }
    });

    // Navigate only to unlocked learning stages.
    navStepButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const target = button.dataset.navStep;
            const targetIndex = navigationOrder.indexOf(target);

            if (
                targetIndex < 0 ||
                targetIndex > highestUnlockedStep
            ) {
                return;
            }

            if (target === "assessment") {
                if (assessmentCompleted) {
                    showScreen("completion");
                } else if (assessmentVisited) {
                    showScreen("assessment");
                } else {
                    showScreen("transition");
                }

                return;
            }

            showScreen(target);
        });
    });

    // =========================================
    // 3. BASIC NAVIGATION BUTTONS
    // =========================================

    const startBtn = document.getElementById("startBtn");
    const continueBtn = document.getElementById("continueBtn");
    const backBtn = document.getElementById("backBtn");
    const practiceBtn = document.getElementById("practiceBtn");

    const backToIntroBtn = document.getElementById("backToIntroBtn");
    const backToPreparationBtn = document.getElementById("backToPreparationBtn");

    const continueToAssessmentBtn =
        document.getElementById("continueToAssessmentBtn");

    startBtn.addEventListener("click", function () {
        unlockStep("intro");
        showScreen("intro");
    });

    continueBtn.addEventListener("click", function () {
        unlockStep("preparation");
        showScreen("preparation");
    });

    backBtn.addEventListener("click", function () {
        showScreen("welcome");
    });

    backToIntroBtn.addEventListener("click", function () {
        showScreen("intro");
    });

    practiceBtn.addEventListener("click", function () {
        // Preserve the current game when returning to this screen.
        if (!gameStarted) {
            resetGame();
            gameStarted = true;
        }

        unlockStep("game");
        showScreen("game");
    });

    backToPreparationBtn.addEventListener("click", function () {
        showScreen("preparation");
    });

    continueToAssessmentBtn.addEventListener("click", function () {
        if (foundHazards.length !== totalHazards) {
            return;
        }

        showScreen("assessment");
    });

    // =========================================
    // 4. GAME CONTENT
    // =========================================

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
            explanation:
                "נכון מאוד! מרחיקים את המשתתפים מהסכנה " +
                "ומדווחים לרכז כדי שהכבל יטופל בבטחה."
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
            explanation:
                "מצוין! יש למנוע גישה לאזור הרטוב " +
                "ולדאוג לטיפול בו לפני המשך הפעילות."
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
            explanation:
                "כל הכבוד! מעברים צריכים להישאר פנויים. " +
                "יש לדאוג לפינוי התיק בצורה בטוחה."
        },

        scissors: {
            title: "מספריים על השולחן",
            sticker: "assets/images/stickers/scissors.png",
            hazard: true,
            description:
                "מספריים פתוחים הושארו על שולחן הפעילות ללא השגחה.",
            answers: [
                "להשאיר אותם על השולחן",
                "לזרוק אותם לרצפה",
                "לדאוג לאחסון סגור ובטוח לפי נהלי המרכז"
            ],
            correct: 2,
            explanation:
                "נכון מאוד! ציוד חד צריך להיות מאוחסן בבטחה " +
                "כדי למנוע פציעות."
        },

        ball: {
            title: "כדור באזור המשחק",
            sticker: "assets/images/stickers/ball.png",
            hazard: false,
            description:
                "הכדור מונח באזור המשחק המיועד, ואינו חוסם מעבר.",
            explanation:
                "יפה שבדקתם! במיקום הנוכחי הכדור אינו מפגע. " +
                "אם הוא יתגלגל למעבר, נצטרך לפנות אותו."
        },

        plant: {
            title: "עציץ בפינת החדר",
            sticker: "assets/images/stickers/plant.png",
            hazard: false,
            description:
                "העציץ יציב, נמצא בפינת החדר ואינו מפריע לתנועה.",
            explanation:
                "נכון לעכשיו אין כאן מפגע. חשוב לוודא " +
                "שהעציץ יציב ואינו חוסם מעבר."
        },

        books: {
            title: "ספרים על המדף",
            sticker: "assets/images/stickers/books.png",
            hazard: false,
            description:
                "הספרים מסודרים על המדף ואינם עומדים ליפול.",
            explanation:
                "מעולה! ציוד שמאוחסן בצורה מסודרת ויציבה " +
                "מסייע לשמור על חדר בטוח."
        },

        pencils: {
            title: "כלי כתיבה על השולחן",
            sticker: "assets/images/stickers/pencils.png",
            hazard: false,
            description:
                "כלי הכתיבה נמצאים על שולחן הפעילות באופן מסודר.",
            explanation:
                "יפה! כלי הכתיבה אינם מהווים מפגע במצבם הנוכחי. " +
                "חשוב להחזיר אותם למקום בסיום השימוש."
        }
    };

    // =========================================
    // 5. GAME ELEMENTS AND STATE
    // =========================================

    const objectButtons = document.querySelectorAll(".room-object");

    const hazardCounter = document.getElementById("hazardCounter");
    const hazardProgress = document.getElementById("hazardProgress");
    const scoreCounter = document.getElementById("scoreCounter");

    const feedbackOverlay = document.getElementById("feedbackOverlay");
    const feedbackTitle = document.getElementById("feedbackTitle");
    const feedbackTag = document.getElementById("feedbackTag");
    const feedbackSticker = document.getElementById("feedbackSticker");
    const feedbackDescription = document.getElementById("feedbackDescription");

    const questionArea = document.getElementById("questionArea");
    const answerOptions = document.getElementById("answerOptions");
    const answerResult = document.getElementById("answerResult");

    const feedbackContinueBtn =
        document.getElementById("feedbackContinueBtn");

    const closeFeedbackBtn =
        document.getElementById("closeFeedbackBtn");

    const transitionScore = document.getElementById("transitionScore");
    const completionScore = document.getElementById("completionScore");
    const restartBtn = document.getElementById("restartBtn");

    const totalHazards = 4;

    let foundHazards = [];
    let score = 0;
    let currentObjectId = "";
    let currentButton = null;
    let lastFocusedButton = null;
    let wrongAttempt = false;
    let gameStarted = false;

    function updateProgress() {
        const count = foundHazards.length;
        const percentage = count / totalHazards * 100;

        hazardCounter.textContent = count + " מתוך " + totalHazards;
        hazardProgress.style.width = percentage + "%";
        hazardProgress.setAttribute("aria-valuenow", count);
        scoreCounter.textContent = score;
    }

    // =========================================
    // 6. GAME FEEDBACK DIALOG
    // =========================================

    function showFeedbackSticker(objectData) {
        feedbackSticker.textContent = "";

        const stickerImage = document.createElement("img");

        stickerImage.src = objectData.sticker;
        stickerImage.alt = "";
        stickerImage.draggable = false;

        // Preserve the existing sticker appearance.
        stickerImage.style.display = "block";
        stickerImage.style.width = "110px";
        stickerImage.style.height = "110px";
        stickerImage.style.objectFit = "contain";
        stickerImage.style.margin = "0 auto";
        stickerImage.style.filter =
            "drop-shadow(0 6px 5px rgba(41, 43, 64, 0.18))";

        feedbackSticker.appendChild(stickerImage);
    }

    function openFeedback(objectId, button) {
        const objectData = objects[objectId];

        currentObjectId = objectId;
        currentButton = button;
        lastFocusedButton = button;
        wrongAttempt = false;

        showFeedbackSticker(objectData);

        feedbackTitle.textContent = objectData.title;
        feedbackDescription.textContent = objectData.description;

        answerOptions.textContent = "";
        answerResult.textContent = "";
        answerResult.hidden = true;
        answerResult.classList.remove("error");

        feedbackContinueBtn.hidden = true;
        feedbackContinueBtn.textContent = "ממשיכים לחפש ←";

        if (objectData.hazard) {
            feedbackTag.textContent = "⚠️ זיהיתם מפגע";
            questionArea.hidden = false;

            objectData.answers.forEach(function (answer, index) {
                const answerButton = document.createElement("button");

                answerButton.type = "button";
                answerButton.className = "answer-button";
                answerButton.textContent = answer;

                answerButton.addEventListener("click", function () {
                    checkAnswer(index, answerButton);
                });

                answerOptions.appendChild(answerButton);
            });

        } else {
            feedbackTag.textContent = "✓ בדיקת חפץ בטוח";
            questionArea.hidden = true;

            answerResult.textContent = objectData.explanation;
            answerResult.hidden = false;
            feedbackContinueBtn.hidden = false;
        }

        feedbackOverlay.hidden = false;
        document.body.classList.add("dialog-open");
        feedbackTitle.focus();
    }

    function animateAnswer(button, correct) {
        button.style.transition =
            "transform 0.2s ease, background-color 0.2s ease";

        button.style.transform = correct
            ? "scale(1.03)"
            : "translateX(5px)";
    }

    // =========================================
    // 7. CHECK GAME ANSWERS
    // =========================================

    function checkAnswer(answerIndex, selectedButton) {
        const objectData = objects[currentObjectId];

        if (answerIndex === objectData.correct) {
            selectedButton.classList.add("correct");
            animateAnswer(selectedButton, true);

            const buttons = answerOptions.querySelectorAll("button");

            buttons.forEach(function (button) {
                button.disabled = true;
            });

            if (!foundHazards.includes(currentObjectId)) {
                foundHazards.push(currentObjectId);
                score += wrongAttempt ? 5 : 10;
            }

            currentButton.classList.add("found");

            const originalLabel =
                currentButton.getAttribute("data-original-label");

            currentButton.setAttribute(
                "aria-label",
                originalLabel + " - טופל"
            );

            answerResult.textContent =
                "✓ " + objectData.explanation +
                " +" + (wrongAttempt ? 5 : 10) +
                " נקודות!";

            answerResult.classList.remove("error");
            answerResult.hidden = false;

            feedbackTag.textContent = "🌟 המפגע טופל בהצלחה!";
            feedbackContinueBtn.hidden = false;

            if (foundHazards.length === totalHazards) {
                feedbackContinueBtn.textContent =
                    "מסיימים את משימת החדר ←";
            }

            updateProgress();
            feedbackContinueBtn.focus();

        } else {
            wrongAttempt = true;

            selectedButton.classList.add("wrong");
            selectedButton.disabled = true;
            animateAnswer(selectedButton, false);

            answerResult.textContent =
                "לא בדיוק. חשבו כיצד אפשר למנוע פגיעה " +
                "ולשמור על המשתתפים. נסו שוב.";

            answerResult.classList.add("error");
            answerResult.hidden = false;
        }
    }

    function hideHandledObject(button) {
        if (!button) {
            return;
        }

        button.style.transition =
            "opacity 0.4s ease, transform 0.4s ease";

        button.style.opacity = "0";
        button.style.transform = "scale(0.3)";
        button.style.pointerEvents = "none";

        button.disabled = true;
        button.setAttribute("aria-hidden", "true");
    }

    function closeFeedback() {
        if (feedbackOverlay.hidden) {
            return;
        }

        const handledCurrentHazard =
            foundHazards.includes(currentObjectId);

        feedbackOverlay.hidden = true;
        document.body.classList.remove("dialog-open");

        if (handledCurrentHazard) {
            hideHandledObject(currentButton);
        }

        if (foundHazards.length === totalHazards) {
            currentObjectId = "";
            currentButton = null;

            transitionScore.textContent = score;

            unlockStep("assessment");
            showScreen("transition");
            return;
        }

        if (lastFocusedButton) {
            if (lastFocusedButton.disabled) {
                screenTitles.game.focus();
            } else {
                lastFocusedButton.focus();
            }
        }

        currentObjectId = "";
        currentButton = null;
    }

    // =========================================
    // 8. ROOM OBJECT EVENTS
    // =========================================

    objectButtons.forEach(function (button) {
        button.setAttribute(
            "data-original-label",
            button.getAttribute("aria-label")
        );

        button.addEventListener("click", function () {
            const objectId = button.dataset.object;

            if (foundHazards.includes(objectId)) {
                return;
            }

            openFeedback(objectId, button);
        });
    });

    feedbackContinueBtn.addEventListener("click", closeFeedback);
    closeFeedbackBtn.addEventListener("click", closeFeedback);

    // =========================================
    // 9. MODAL KEYBOARD ACCESSIBILITY
    // =========================================

    feedbackOverlay.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeFeedback();
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusable = feedbackOverlay.querySelectorAll(
            "button:not([disabled]):not([hidden])"
        );

        const available = [];

        focusable.forEach(function (button) {
            if (button.offsetParent !== null) {
                available.push(button);
            }
        });

        if (available.length === 0) {
            return;
        }

        const first = available[0];
        const last = available[available.length - 1];

        if (
            event.shiftKey &&
            document.activeElement === first
        ) {
            event.preventDefault();
            last.focus();

        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    });

    // =========================================
    // 10. FINAL ASSESSMENT ELEMENTS
    // =========================================

    const assessmentForm = document.getElementById("assessmentForm");
    const assessmentSummary = document.getElementById("assessmentSummary");

    const question1Feedback =
        document.getElementById("question1Feedback");

    const question2Feedback =
        document.getElementById("question2Feedback");

    const question3Feedback =
        document.getElementById("question3Feedback");

    const question3Input = document.getElementById("question3");

    const checkAssessmentBtn =
        document.getElementById("checkAssessmentBtn");

    const finishAssessmentBtn =
        document.getElementById("finishAssessmentBtn");

    const backToGameBtn =
        document.getElementById("backToGameBtn");

    const assessmentFeedbackElements = [
        question1Feedback,
        question2Feedback,
        question3Feedback
    ];

    // =========================================
    // 11. ASSESSMENT FEEDBACK HELPERS
    // =========================================

    function setQuestionFeedback(element, type, message) {
        element.textContent = message;
        element.hidden = false;

        element.classList.remove(
            "correct",
            "partial",
            "incorrect",
            "missing"
        );

        element.classList.add(type);
    }

    function clearAssessmentFeedback() {
        assessmentFeedbackElements.forEach(function (element) {
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

        finishAssessmentBtn.hidden = true;
        checkAssessmentBtn.hidden = false;
        assessmentCompleted = false;
    }

    // =========================================
    // 12. CHECK FINAL ASSESSMENT
    // =========================================

    assessmentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const selectedQ1 = assessmentForm.querySelector(
            'input[name="question1"]:checked'
        );

        const selectedQ2 = assessmentForm.querySelectorAll(
            'input[name="question2"]:checked'
        );

        const q3Value = question3Input.value.trim();

        let correctCount = 0;
        let missingCount = 0;

        // -------------------------------------
        // Question 1: Single choice
        // -------------------------------------

        if (!selectedQ1) {
            missingCount++;

            setQuestionFeedback(
                question1Feedback,
                "missing",
                "⚠️ עדיין לא בחרתם תשובה לשאלה הזאת."
            );

        } else if (selectedQ1.value === "b") {
            correctCount++;

            setQuestionFeedback(
                question1Feedback,
                "correct",
                "✓ נכון מאוד! ציוד שאינו תקין מוציאים משימוש, " +
                "מונעים גישה אליו ומדווחים לרכז כדי שיטופל בבטחה. " +
                "אין להשתמש בציוד עד לטיפול מתאים."
            );

        } else {
            setQuestionFeedback(
                question1Feedback,
                "incorrect",
                "לא בדיוק. כאשר מזהים ציוד לא תקין, " +
                "יש להוציא אותו משימוש ולדווח לרכז. " +
                "לא ממשיכים להשתמש בו ולא מנסים לתקן אותו בעצמנו. " +
                "נסו שוב."
            );
        }

        // -------------------------------------
        // Question 2: Multiple choice
        // -------------------------------------

        const selectedValues = Array.from(
            selectedQ2,
            function (input) {
                return input.value;
            }
        );

        const correctValues = [
            "stop",
            "move",
            "report"
        ];

        let correctSelections = 0;
        let incorrectSelections = 0;

        selectedValues.forEach(function (value) {
            if (correctValues.includes(value)) {
                correctSelections++;
            } else {
                incorrectSelections++;
            }
        });

        const q2IsCorrect =
            correctSelections === correctValues.length &&
            incorrectSelections === 0;

        if (selectedValues.length === 0) {
            missingCount++;

            setQuestionFeedback(
                question2Feedback,
                "missing",
                "⚠️ סמנו לפחות פעולה אחת לפני בדיקת התשובות."
            );

        } else if (q2IsCorrect) {
            correctCount++;

            setQuestionFeedback(
                question2Feedback,
                "correct",
                "✓ מצוין! עוצרים את הפעילות באזור המסוכן, " +
                "מרחיקים את החניכים ומדווחים לרכז. " +
                "לא מנסים לתקן את המדף בעצמנו."
            );

        } else if (correctSelections > 0) {
            setQuestionFeedback(
                question2Feedback,
                "partial",
                "כמעט! זיהיתם חלק מהפעולות הנכונות, " +
                "אבל חסרה פעולה מתאימה או שסומנה גם פעולה " +
                "לא בטוחה. חשבו על עצירה, הרחקה ודיווח, " +
                "ובדקו את הבחירות שלכם."
            );

        } else {
            setQuestionFeedback(
                question2Feedback,
                "incorrect",
                "לא בדיוק. חשוב לעצור את הפעילות באזור, " +
                "להרחיק את החניכים ולדווח לרכז. " +
                "אין לבקש מחניך לתקן ציוד מסוכן."
            );
        }

        // -------------------------------------
        // Question 3: Numeric input
        // -------------------------------------

        if (q3Value === "") {
            missingCount++;

            setQuestionFeedback(
                question3Feedback,
                "missing",
                "⚠️ הקלידו את מספר הפעולות המרכזיות."
            );

        } else if (
            !question3Input.validity.valid ||
            !Number.isInteger(Number(q3Value))
        ) {
            setQuestionFeedback(
                question3Feedback,
                "incorrect",
                "יש להזין מספר שלם בין 1 ל־10."
            );

        } else if (Number(q3Value) === 3) {
            correctCount++;

            setQuestionFeedback(
                question3Feedback,
                "correct",
                "✓ נכון! שלוש הפעולות הן עצירת הפעילות " +
                "באזור המסוכן, הרחקת החניכים ודיווח לרכז."
            );

        } else {
            setQuestionFeedback(
                question3Feedback,
                "incorrect",
                "לא בדיוק. חזרו לשלוש הפעולות המופיעות " +
                "בשאלה: עצירה, הרחקה ודיווח."
            );
        }

        // -------------------------------------
        // Assessment summary
        // -------------------------------------

        assessmentSummary.hidden = false;
        assessmentSummary.classList.remove("all-correct");

        if (missingCount > 0) {
            assessmentSummary.textContent =
                "עניתם נכון על " +
                correctCount +
                " מתוך 3 שאלות. יש עוד " +
                missingCount +
                " שאלות שלא הושלמו. " +
                "השלימו אותן ונסו שוב.";

        } else if (correctCount === 3) {
            assessmentCompleted = true;

            assessmentSummary.classList.add("all-correct");

            assessmentSummary.textContent =
                "🎉 כל הכבוד! עניתם נכון על כל שלוש השאלות. " +
                "הראיתם שאתם יודעים ליישם את כללי הבטיחות " +
                "גם במצבים חדשים במהלך הפעילות.";

            checkAssessmentBtn.hidden = true;
            finishAssessmentBtn.hidden = false;

        } else {
            assessmentSummary.textContent =
                "עניתם נכון על " +
                correctCount +
                " מתוך 3 שאלות. " +
                "קראו את המשוב, תקנו את התשובות ונסו שוב.";
        }

        assessmentSummary.setAttribute("tabindex", "-1");
        assessmentSummary.focus();

        assessmentSummary.scrollIntoView({
            behavior: "auto",
            block: "nearest"
        });
    });

    // =========================================
    // 13. CLEAR OUTDATED ASSESSMENT FEEDBACK
    // =========================================

    assessmentForm.addEventListener("change", function () {
        if (!assessmentCompleted) {
            clearAssessmentFeedback();
        }
    });

    question3Input.addEventListener("input", function () {
        if (!assessmentCompleted) {
            clearAssessmentFeedback();
        }
    });

    // =========================================
    // 14. ASSESSMENT NAVIGATION
    // =========================================

    backToGameBtn.addEventListener("click", function () {
        showScreen("transition");
    });

    finishAssessmentBtn.addEventListener("click", function () {
        if (!assessmentCompleted) {
            return;
        }

        completionScore.textContent = score;
        showScreen("completion");
    });

    // =========================================
    // 15. RESET ASSESSMENT
    // =========================================

    function resetAssessment() {
        assessmentForm.reset();
        clearAssessmentFeedback();
        assessmentVisited = false;
    }

    // =========================================
    // 16. RESET GAME
    // =========================================

    function resetGame() {
        foundHazards = [];
        score = 0;

        currentObjectId = "";
        currentButton = null;
        lastFocusedButton = null;
        wrongAttempt = false;

        objectButtons.forEach(function (button) {
            button.classList.remove("found");

            button.style.opacity = "";
            button.style.transform = "";
            button.style.transition = "";
            button.style.pointerEvents = "";

            button.disabled = false;
            button.removeAttribute("aria-hidden");

            button.setAttribute(
                "aria-label",
                button.getAttribute("data-original-label")
            );
        });

        feedbackOverlay.hidden = true;
        document.body.classList.remove("dialog-open");

        transitionScore.textContent = "0";

        resetAssessment();
        updateProgress();
    }

    // =========================================
    // 17. RESTART GAME
    // =========================================

    restartBtn.addEventListener("click", function () {
        resetGame();

        gameStarted = true;

        // Keep previously unlocked learning stages available.
        showScreen("game");
    });

    // =========================================
    // 18. INITIALIZATION
    // =========================================

    resetGame();
    updateNavigation();
    showScreen("welcome");

});
