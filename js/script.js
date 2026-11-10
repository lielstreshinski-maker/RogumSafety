
/* ==================================
   ROGUM SAFETY - SCREEN NAVIGATION
   ================================== */

document.addEventListener("DOMContentLoaded", function () {

    // Screens
    const welcomeScreen = document.getElementById("welcomeScreen");
    const introScreen = document.getElementById("introScreen");
    const preparationScreen = document.getElementById("preparationScreen");

    // Buttons
    const startBtn = document.getElementById("startBtn");
    const continueBtn = document.getElementById("continueBtn");
    const backBtn = document.getElementById("backBtn");
    const practiceBtn = document.getElementById("practiceBtn");
    const backToIntroBtn = document.getElementById("backToIntroBtn");

    // Titles
    const introTitle = document.getElementById("intro-title");
    const preparationTitle = document.getElementById("preparation-title");

    // Message
    const preparationMessage =
        document.getElementById("preparationMessage");

    // ==================================
    // SHOW SCREEN
    // ==================================

    function showScreen(screen, title) {

        welcomeScreen.hidden = true;
        introScreen.hidden = true;
        preparationScreen.hidden = true;

        screen.hidden = false;

        window.scrollTo(0, 0);

        if (title) {
            title.focus();
        }
    }

    // ==================================
    // WELCOME -> INTRODUCTION
    // ==================================

    startBtn.addEventListener("click", function () {

        showScreen(introScreen, introTitle);

    });

    // ==================================
    // INTRODUCTION -> PREPARATION
    // ==================================

    continueBtn.addEventListener("click", function () {

        preparationMessage.textContent = "";

        showScreen(preparationScreen, preparationTitle);

    });

    // ==================================
    // INTRODUCTION -> WELCOME
    // ==================================

    backBtn.addEventListener("click", function () {

        showScreen(welcomeScreen, null);

        startBtn.focus();

    });

    // ==================================
    // PREPARATION -> INTRODUCTION
    // ==================================

    backToIntroBtn.addEventListener("click", function () {

        showScreen(introScreen, introTitle);

    });

    // ==================================
    // PREPARATION -> PRACTICE
    // ==================================

    practiceBtn.addEventListener("click", function () {

        preparationMessage.textContent =
            "מצוין! בשלב הבא נתרגל זיהוי מפגעים בחדר הפעילות.";

    });

});
