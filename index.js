import data from "./data/vocabster_data.json" with { type: "json" };

/** Loads flashcard progress from local storage if available. */
function loadProgress() {
	const stored = localStorage.getItem("flashcardProgress");
	return stored ? JSON.parse(stored) : {};
}

/** Saves the current progress back to local storage. */
function saveProgress(progress) {
	localStorage.setItem("flashcardProgress", JSON.stringify(progress));
}

// Sorts the flashcards by their due date to prioritise learning.
const progressData = loadProgress();
const cards = data
	.sort((a, b) => {
		// Put cards without a dueDate at the last
		const dateA = progressData[a.id]?.dueDate ? new Date(progressData[a.id].dueDate) : Infinity;
		const dateB = progressData[b.id]?.dueDate ? new Date(progressData[b.id].dueDate) : Infinity;
		return dateA - dateB;
	});

let currentIndex = 0;

const entriesBody = document.getElementById("entries-body");

/** Creates a table row for each card, allowing quick navigation. */
function initEntries() {
	// Build table rows
	cards.forEach((card, i) => {
		const row = document.createElement("tr");
		row.addEventListener("click", () => {
			currentIndex = i;
			renderCard();
		});
		const cellId = document.createElement("td");
		cellId.textContent = card.id;
		const cellWord = document.createElement("td");
		cellWord.textContent = card.word;
		const cellDue = document.createElement("td");
		cellDue.textContent = progressData[card.id]?.dueDate || "Unseen"; // If the card has not been learnt before, mark it as "Unseen"

		row.appendChild(cellId);
		row.appendChild(cellWord);
		row.appendChild(cellDue);
		entriesBody.appendChild(row);
	});
}

/** Updates highlighted row and due dates each time we render or change data. */
function updateEntries() {
	// Update row highlight and due dates
	cards.forEach((card, i) => {
		const row = entriesBody.children[i];
		row.classList.toggle("row-highlight", i === currentIndex);

		const cellDue = row.children[row.childElementCount - 1];
		const dueDateString = progressData[card.id]?.dueDate;
		if (dueDateString) {
			cellDue.textContent = dueDateString;
			// If the due date is earlier than today, mark it as overdue
			const dueDate = new Date(dueDateString);
			const today = new Date();
			cellDue.classList.toggle("overdue-date", dueDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0));
		} else {
			cellDue.textContent = "Unseen";
			cellDue.classList.remove("overdue-date");
		}
	});
}

/**
 * Mapping between abbreviated and full forms of parts of speech.
 * You can use the same technique to transform your data.
 */
const posMapping = {
	n: "noun",
	v: "verb",
	adj: "adjective",
	// Add more mappings as needed
};

// Grabs references to the flashcard UI elements needed to display data.
const frontWord = document.getElementById("front-word");
const backPos = document.getElementById("back-pos");
const backDefinition = document.getElementById("back-definition");
const backImage = document.getElementById("back-image");
const backAudio = document.getElementById("back-audio");
const backVideo = document.getElementById("back-video");

const flipCardCheckbox = document.getElementById("flip-card-checkbox");
const cardInner = document.getElementById("card-inner");
const transitionHalfDuration = parseFloat(getComputedStyle(cardInner).transitionDuration) * 1000 / 2;

/** Renders the current card on both front and back. */
function renderCard() {
	// STUDENTS: Start of recommended modifications
	// If there are more fields in the dataset (e.g., synonyms, example sentences),
	// display them here (e.g., backSynonym.textContent = currentCard.synonym).

	// Update the front side with the current card's word
	const currentCard = cards[currentIndex];
	// frontWord.textContent = currentCard.word;

	
	// STUDENTS: End of recommended modifications

	updateEntries();
}

/** Navigates to the previous card. */
function previousCard() {
	currentIndex = (currentIndex - 1 + cards.length) % cards.length;
}

/** Navigates to the next card. */
function nextCard() {
	currentIndex = (currentIndex + 1) % cards.length;
}

document.getElementById("btn-back").addEventListener("click", () => {
	previousCard();
	renderCard();
});
document.getElementById("btn-skip").addEventListener("click", () => {
	nextCard();
	renderCard();
});

/**
 * Mapping between the user's selection (Again, Good, Easy) and the number of days to wait before reviewing the card again.
 */
const dayOffset = { again: 1, good: 3, easy: 7 };

/**
 * Records learning progress by updating the card's due date based on the user's selection (Again, Good, Easy).
 */
function updateDueDate(type) {
	const card = cards[currentIndex];
	const today = new Date();
	const dueDate = new Date(today.setDate(today.getDate() + dayOffset[type]) - today.getTimezoneOffset() * 60 * 1000);
	(progressData[card.id] ||= {}).dueDate = dueDate.toISOString().split("T")[0]; // Print the date in YYYY-MM-DD format
	saveProgress(progressData);
	updateEntries();
}

document.getElementById("btn-again").addEventListener("click", () => {
	updateDueDate("again");
	nextCard();
	renderCard();
});
document.getElementById("btn-good").addEventListener("click", () => {
	updateDueDate("good");
	nextCard();
	renderCard();
});
document.getElementById("btn-easy").addEventListener("click", () => {
	updateDueDate("easy");
	nextCard();
	renderCard();
});

// Initial render
initEntries();
renderCard();

