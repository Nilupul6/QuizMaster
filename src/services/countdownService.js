import { db, ref, onValue, update } from "./firebase";

let listenerInitialized = false;
let unsubscribeListener = null;

export const startCountdownListener = () => {
  if (listenerInitialized) {
    console.log("Countdown listener already initialized, skipping.");
    return;
  }

  listenerInitialized = true;
  console.log("Initializing countdown listener...");

  const quizzesRef = ref(db, "quizzes");

  unsubscribeListener = onValue(
    quizzesRef,
    (snapshot) => {
      console.log("Countdown listener fired, processing quizzes...");
      const quizzesData = snapshot.val();
      if (!quizzesData) {
        console.log("No quizzes found in Firebase.");
        return;
      }

      Object.entries(quizzesData).forEach(([quizKey, quizData]) => {
        console.log(`Processing quiz ${quizKey}:`, {
          countdownActive: quizData.countdownActive,
          countdownStartTime: quizData.countdownStartTime,
          active: quizData.active,
          countdownDuration: quizData.countdownDuration,
        });

        if (
          quizData.countdownActive &&
          quizData.countdownStartTime &&
          !quizData.active &&
          quizData.countdownDuration
        ) {
          const startTime = new Date(quizData.countdownStartTime).getTime();
          const currentTime = Date.now();
          const elapsedTime = Math.floor((currentTime - startTime) / 1000);
          const remainingCountdown = quizData.countdownDuration - elapsedTime;

          console.log(`Quiz ${quizKey} countdown:`, {
            elapsedTime,
            remainingCountdown,
            countdownDuration: quizData.countdownDuration,
          });

          if (remainingCountdown <= 0) {
            console.log(`Countdown for quiz ${quizKey} ended, starting quiz...`);
            const quizRef = ref(db, `quizzes/${quizKey}`);
            update(quizRef, {
              active: true,
              startTime: new Date().toISOString(),
              countdownActive: false,
              countdownStartTime: null,
            })
              .then(() => {
                console.log(`Quiz ${quizKey} successfully started.`);
              })
              .catch((error) => {
                console.error(`Failed to start quiz ${quizKey}:`, error.message);
              });
          } else {
            console.log(`Quiz ${quizKey} countdown still running: ${remainingCountdown} seconds left.`);
          }
        } else {
          console.log(`Quiz ${quizKey} not eligible for countdown start:`, {
            countdownActive: quizData.countdownActive,
            countdownStartTime: !!quizData.countdownStartTime,
            active: quizData.active,
            countdownDuration: !!quizData.countdownDuration,
          });
        }
      });
    },
    (error) => {
      console.error("Countdown listener error:", error.message);
    }
  );

  console.log("Countdown listener successfully started.");
};

// Optional: Cleanup listener (if needed for hot-reloading or app shutdown)
export const stopCountdownListener = () => {
  if (listenerInitialized && unsubscribeListener) {
    unsubscribeListener();
    listenerInitialized = false;
    console.log("Countdown listener stopped.");
  }
};