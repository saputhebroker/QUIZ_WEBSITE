const timePerQuestion = 20;

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const questionCount = document.getElementById("question-count");
const scoreValue = document.getElementById("score-value");
const timerValue = document.getElementById("timer-value");
const progressBar = document.getElementById("progress-bar");
const questionTag = document.getElementById("question-tag");
const questionText = document.getElementById("question-text");
const answerButtons = document.getElementById("answer-buttons");
const feedbackText = document.getElementById("feedback-text");
const finalScore = document.getElementById("final-score");
const resultMessage = document.getElementById("result-message");
const summaryList = document.getElementById("summary-list");

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let timeLeft = timePerQuestion;
let timerId = null;
let roundResults = [];

// Shuffle helper
function shuffleItems(items) {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

// Show screen
function showScreen(target) {
  [startScreen, quizScreen, resultScreen].forEach(section => {
    const isTarget = section === target;
    section.hidden = !isTarget;
    section.classList.toggle("is-visible", isTarget);
  });
}

// Start quiz → fetch from API
async function startQuiz() {
  try {
    const response = await fetch("https://opentdb.com/api.php?amount=10&type=multiple");
    const data = await response.json();

    questions = data.results.map(item => ({
      topic: item.category,
      question: decodeHTMLEntities(item.question),
      options: shuffleItems([...item.incorrect_answers, item.correct_answer]),
      answer: item.correct_answer
    }));

    currentQuestionIndex = 0;
    score = 0;
    roundResults = [];
    scoreValue.textContent = score;
    showScreen(quizScreen);
    renderQuestion();
  } catch (error) {
    console.error("Error fetching quiz:", error);
    feedbackText.textContent = "Could not load questions. Try again.";
  }
}

// Decode HTML entities (&quot;, &amp;, etc.)
function decodeHTMLEntities(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

// Render question
function renderQuestion() {
  clearInterval(timerId);
  nextBtn.disabled = true;
  nextBtn.textContent = "Next Question";
  answerButtons.innerHTML = "";
  feedbackText.textContent = "Choose the best answer to continue.";

  const currentQuestion = questions[currentQuestionIndex];
  const questionNumber = currentQuestionIndex + 1;

  questionCount.textContent = `${questionNumber} / ${questions.length}`;
  questionTag.textContent = currentQuestion.topic;
  questionText.textContent = currentQuestion.question;
  progressBar.style.width = `${(questionNumber / questions.length) * 100}%`;

  currentQuestion.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-btn";
    button.dataset.option = option;
    button.innerHTML = `<span>${String.fromCharCode(65 + optionIndex)}. ${option}</span>`;
    button.addEventListener("click", () => handleAnswer(button, option));
    answerButtons.appendChild(button);
  });

  timeLeft = timePerQuestion;
  timerValue.textContent = `${timeLeft}s`;
  timerId = setInterval(updateTimer, 1000);
}

// Timer
function updateTimer() {
  timeLeft -= 1;
  timerValue.textContent = `${timeLeft}s`;
  if (timeLeft <= 0) {
    clearInterval(timerId);
    revealAnswer(null, true);
  }
}

// Handle answer
function handleAnswer(button, selectedOption) {
  clearInterval(timerId);
  revealAnswer(button, false, selectedOption);
}

// Reveal answer
function revealAnswer(selectedButton, timedOut, selectedOption = "") {
  const currentQuestion = questions[currentQuestionIndex];
  const correctAnswer = currentQuestion.answer;
  const buttons = [...answerButtons.children];
  const isCorrect = selectedOption === correctAnswer;

  buttons.forEach(button => {
    button.disabled = true;
    if (button.dataset.option === correctAnswer) button.classList.add("correct");
    if (button === selectedButton && !isCorrect) button.classList.add("wrong");
  });

  if (timedOut) {
    feedbackText.textContent = `Time's up. Correct answer: ${correctAnswer}`;
  } else if (isCorrect) {
    score += 1;
    scoreValue.textContent = score;
    feedbackText.textContent = "Correct!";
  } else {
    feedbackText.textContent = `Wrong. Correct answer: ${correctAnswer}`;
  }

  roundResults.push({
    prompt: currentQuestion.question,
    selected: timedOut ? "No answer" : selectedOption,
    correct: correctAnswer,
    isCorrect
  });

  nextBtn.disabled = false;
  nextBtn.textContent =
    currentQuestionIndex === questions.length - 1 ? "See Results" : "Next Question";
}

// Next question
function goToNextQuestion() {
  currentQuestionIndex += 1;
  if (currentQuestionIndex < questions.length) {
    renderQuestion();
  } else {
    showResults();
  }
}

// Show results
function showResults() {
  clearInterval(timerId);
  const percentage = Math.round((score / questions.length) * 100);
  finalScore.textContent = `${percentage}%`;
  resultMessage.textContent = percentage >= 70 ? "Great job!" : "Keep practicing!";
  summaryList.innerHTML = `You got ${score} out of ${questions.length} correct.`;
  showScreen(resultScreen);
}

// Event listeners
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", goToNextQuestion);
restartBtn.addEventListener("click", startQuiz);
