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

const drawCanvasContainer = document.getElementById("drawCanvasContainer");
const drawCanvas = document.getElementById("drawCanvas");
const drawWord = document.getElementById("drawWord");
const penTool = document.getElementById("pen");
const eraserTool = document.getElementById("eraser");
const doneButton = document.getElementById("done");
const resetButton = document.getElementById("reset");

let isDrawing = false;
let context = drawCanvas.getContext("2d");
let currentTool = "pen";

// Set up canvas for drawing
drawCanvas.width = 400;
drawCanvas.height = 400;
context.lineWidth = 5;
context.lineCap = "round";

/** Makes the VIcon draggable and displays it on the main interface. */
function makeVIconDraggable(imageData) {
	const vIcon = document.createElement("img");
	vIcon.src = imageData;
	vIcon.classList.add("draggable-vicon");
	vIcon.style.position = "absolute";
	vIcon.style.left = "50%";
	vIcon.style.top = "50%";
	vIcon.style.transform = "translate(-50%, -50%)";
	document.body.appendChild(vIcon);

	// Enable dragging
	let isDragging = false;
	let offsetX, offsetY;

	vIcon.addEventListener("mousedown", (e) => {
		isDragging = true;
		offsetX = e.clientX - vIcon.getBoundingClientRect().left;
		offsetY = e.clientY - vIcon.getBoundingClientRect().top;
		vIcon.style.cursor = "grabbing";
	});

	document.addEventListener("mousemove", (e) => {
		if (isDragging) {
			vIcon.style.left = `${e.clientX - offsetX}px`;
			vIcon.style.top = `${e.clientY - offsetY}px`;
		}
	});

	document.addEventListener("mouseup", () => {
		isDragging = false;
		vIcon.style.cursor = "grab";
	});
}

// Update showDrawInterface to disable the button and close Tmenu after saving
function showDrawInterface(card, container) {
	drawCanvasContainer.style.display = "flex";
	drawWord.textContent = card.word;
	document.getElementById("drawWordZh").textContent = card.word_zh || ""; // Set word_zh
	context.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

	// Handle drawing
	drawCanvas.onmousedown = (e) => {
		isDrawing = true;
		context.beginPath();
		context.moveTo(e.offsetX, e.offsetY);
	};
	drawCanvas.onmousemove = (e) => {
		if (isDrawing) {
			if (currentTool === "pen") {
				context.strokeStyle = "black";
				context.lineTo(e.offsetX, e.offsetY);
				context.stroke();
			} else if (currentTool === "eraser") {
				context.clearRect(e.offsetX - 10, e.offsetY - 10, 20, 20);
			}
		}
	};
	drawCanvas.onmouseup = () => (isDrawing = false);
	drawCanvas.onmouseleave = () => (isDrawing = false);

	// Save the drawing as an icon
	doneButton.onclick = () => {
		const imageData = drawCanvas.toDataURL("image/png");
		const icon = container.querySelector(".tmenu-icon");
		icon.style.backgroundImage = `url(${imageData})`;
		icon.textContent = ""; // Remove "?" text
		drawCanvasContainer.style.display = "none";

		// Make the VIcon draggable
		makeVIconDraggable(imageData);

		// Disable the button and close Tmenu
		container.classList.add("disabled");
		container.removeEventListener("click", () => showDrawInterface(card, container));
		document.getElementById("Tmenu-checkbox").checked = false; // Close Tmenu
	};
}

// Reset the canvas
resetButton.onclick = () => {
	context.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
};

// Tool selection
penTool.onclick = () => {
	currentTool = "pen";
	drawCanvas.style.cursor = "url('pen-cursor.png'), auto";
};
eraserTool.onclick = () => {
	currentTool = "eraser";
	drawCanvas.style.cursor = "url('eraser-cursor.png'), auto";
};

// Update populateTmenu to create clickable containers for VIcons
function populateTmenu() {
	const tmenuList = document.getElementById("TmenuList");
	tmenuList.innerHTML = ""; // Clear previous entries

	// Filter cards without images
	const cardsWithoutImages = cards.filter(card => !card.image);

	// Randomly select 5 cards
	const selectedCards = cardsWithoutImages.sort(() => 0.5 - Math.random()).slice(0, 5);

	// Create containers for each selected card
	selectedCards.forEach(card => {
		const container = document.createElement("div");
		container.classList.add("tmenu-container");
		container.addEventListener("click", () => showDrawInterface(card, container));

		const icon = document.createElement("div");
		icon.classList.add("tmenu-icon");
		icon.textContent = "?"; // Placeholder text

		container.appendChild(icon);
		tmenuList.appendChild(container);
	});
}

// Call populateTmenu on page load
populateTmenu();

// Initial render
initEntries();
renderCard();

