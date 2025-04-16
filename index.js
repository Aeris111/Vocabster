import data from "./data/vocabster_data.json" with { type: "json" };

const cards = data;

const drawCanvasContainer = document.getElementById("drawCanvasContainer");
const drawCanvas = document.getElementById("drawCanvas");
const drawCanvasCloseButton = document.getElementById("drawCanvasCloseButton");
const drawWord = document.getElementById("drawWord");
const penTool = document.getElementById("pen");
const eraserTool = document.getElementById("eraser");
const doneButton = document.getElementById("done");
const resetButton = document.getElementById("reset");

let isDrawing = false;
let context = drawCanvas.getContext("2d");
let currentTool = "pen";
let currentLives = 1;

const maxLives = 5;
const lifeContainer = document.getElementById("lifeContainer");

// Set up canvas for drawing
drawCanvas.width = 400;
drawCanvas.height = 400;
context.lineWidth = 5;
context.lineCap = "round";

/** Makes the VIcon draggable and displays it on the main interface. */
function makeVIconDraggable(imageData) {
	const cardInner = document.getElementById("card-inner");
	const vocMonContainer = document.getElementById("vocMonContainer");

	const vIcon = document.createElement("img");
	vIcon.src = imageData;
	vIcon.classList.add("draggable-vicon");
	vIcon.draggable = false; // Trick to prevent browser built-in drag behavior
	cardInner.appendChild(vIcon);

	const vIconSize = vIcon.offsetWidth;

	// Generate random position inside card-inner
	let randomLeft, randomTop;
	do {
		randomLeft = Math.random() * (cardInner.offsetWidth - vIconSize);
		randomTop = Math.random() * (cardInner.offsetHeight - vIconSize);
	} while (
		randomLeft + vIconSize > vocMonContainer.offsetLeft &&
		randomLeft < vocMonContainer.offsetLeft + vocMonContainer.offsetWidth &&
		randomTop + vIconSize > vocMonContainer.offsetTop &&
		randomTop < vocMonContainer.offsetTop + vocMonContainer.offsetHeight
	);

	vIcon.style.position = "absolute";
	vIcon.style.left = `${randomLeft}px`;
	vIcon.style.top = `${randomTop}px`;
	vIcon.style.transform = "translate(0, 0)";

	// Enable dragging
	let isDragging = false;
	let offsetX, offsetY;

	const onMouseMove = (e) => {
		if (isDragging) {
			const newLeft = e.clientX - offsetX - cardInner.getBoundingClientRect().left;
			const newTop = e.clientY - offsetY - cardInner.getBoundingClientRect().top;

			// Update position
			vIcon.style.left = `${newLeft}px`;
			vIcon.style.top = `${newTop}px`;

			// Check if VIcon touches vocMon
			const vIconRect = vIcon.getBoundingClientRect();
			const vocMonRect = vocMonContainer.getBoundingClientRect();
			if (
				vIconRect.right > vocMonRect.left &&
				vIconRect.left < vocMonRect.right &&
				vIconRect.bottom > vocMonRect.top &&
				vIconRect.top < vocMonRect.bottom
			) {
				// Trigger dissipate effect
				vIcon.classList.add("dissipate");
				setTimeout(() => {
					vIcon.remove();
					// Update data and refresh stomach
					updateDataAfterFeed();
					populateStomach();
				}, 500); // Match the duration of the dissipate effect
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			}
		}
	};

	const onMouseUp = () => {
		isDragging = false;
		vIcon.style.cursor = "grab";
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
	};

	vIcon.addEventListener("mousedown", (e) => {
		isDragging = true;
		offsetX = e.clientX - vIcon.getBoundingClientRect().left;
		offsetY = e.clientY - vIcon.getBoundingClientRect().top;
		vIcon.style.cursor = "grabbing";

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	});
}

/** Updates data after feeding Vocabster. */
function updateDataAfterFeed() {
    if (cards.length > 0) {
        const fedCard = cards.find(card => !card.image); // Find the card without an image
        if (fedCard) {
            cards.splice(cards.indexOf(fedCard), 1); // Remove the fed card from the array
            populateStomach(); // Refresh the stomach
        }
    }
	restoreLife();
}

// Update showDrawInterface to disable the button and close Tmenu after saving
function showDrawInterface(card, container) {
	if (container.classList.contains("disabled")) return;

	drawCanvasContainer.style.display = "flex";
	drawWord.textContent = card.word;
	document.getElementById("drawWordZh").textContent = card.word_zh || ""; // Set word_zh
	context.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

	const doneButtonOnClick = () => {
		// Save the drawing as an icon
		const imageData = drawCanvas.toDataURL("image/png");
		const icon = container.querySelector(".tmenu-icon");
		icon.style.backgroundImage = `url(${imageData})`;
		icon.textContent = ""; // Remove "?" text

		// Update the card's image property
		card.image = imageData;

		// Make the VIcon draggable
		makeVIconDraggable(imageData);

		// Disable the button and close Tmenu
		container.classList.add("disabled");
		document.getElementById("Tmenu-checkbox").checked = false; // Close Tmenu

		closeButtonOnClick();
	};

	const closeButtonOnClick = () => {
		drawCanvasContainer.style.display = "none";
		drawCanvas.style.cursor = "default";
		
		doneButton.removeEventListener("click", doneButtonOnClick);
		drawCanvasCloseButton.removeEventListener("click", closeButtonOnClick);
	};

	doneButton.addEventListener("click", doneButtonOnClick);
	drawCanvasCloseButton.addEventListener("click", closeButtonOnClick);	
}

// Reset the canvas
resetButton.addEventListener("click", () => {
	context.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
});

// Handle drawing
drawCanvas.addEventListener("mousedown", (e) => {
	isDrawing = true;
	context.beginPath();
	context.moveTo(e.offsetX, e.offsetY);
});
drawCanvas.addEventListener("mousemove", (e) => {
	if (isDrawing) {
		if (currentTool === "pen") {
			context.strokeStyle = "black";
			context.lineTo(e.offsetX, e.offsetY);
			context.stroke();
		} else if (currentTool === "eraser") {
			context.clearRect(e.offsetX - 10, e.offsetY - 10, 20, 20);
		}
	}
});
drawCanvas.addEventListener("mouseup", () => (isDrawing = false));
drawCanvas.addEventListener("mouseleave", () => (isDrawing = false));

// Tool selection
function setDrawCanvasCursorImage(tool) {
	drawCanvas.style.cursor = `url('res/cur/${tool}.png') 2 27, auto`; // Anchor slightly lower
	drawCanvasContainer.style.cursor = `url('res/cur/${tool}.png') 2 27, auto`; // Anchor slightly lower
}
penTool.addEventListener("click", () => {
	currentTool = "pen";
	setDrawCanvasCursorImage("pencil");
});
eraserTool.addEventListener("click", () => {
	currentTool = "eraser";
	setDrawCanvasCursorImage("eraser");
});

/** Displays the VIconDisplay div with the selected item's details. */
function showVIconDisplay(item) {
	const display = document.getElementById("VIconDisplay");
	const word = document.getElementById("VIconDisplay-word");
	const wordZh = document.getElementById("VIconDisplay-word-zh");
	const image = document.getElementById("VIconDisplay-image");

	word.textContent = item.word;
	wordZh.textContent = item.word_zh || ""; // Display word_zh if available
	image.src = item.image;

	display.style.display = "flex";
}

document.getElementById("VIconDisplayCloseButton").addEventListener("click", () => {
	document.getElementById("VIconDisplay").style.display = "none";
});

document.getElementById("VIconDisplayEditButton").addEventListener("click", () => {
	const display = document.getElementById("VIconDisplay");
	const word = document.getElementById("VIconDisplay-word").textContent;
	const wordZh = document.getElementById("VIconDisplay-word-zh").textContent;
	const imageSrc = document.getElementById("VIconDisplay-image").src;

	// Find the card being edited
	const card = cards.find((c) => c.word === word && c.word_zh === wordZh);

	if (card) {
		// Load the image into the canvas
		const img = new Image();
		img.addEventListener("load", () => {
			context.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
			context.drawImage(img, 0, 0, drawCanvas.width, drawCanvas.height);
		});
		img.src = imageSrc;

		// Show the drawing interface
		drawCanvasContainer.style.display = "flex";
		drawWord.textContent = card.word;
		document.getElementById("drawWordZh").textContent = card.word_zh || "";

		// Change the "Done" button to "Finish Editing"
		doneButton.textContent = "Finish Editing";

		const doneButtonOnClick = () => {
			const updatedImageData = drawCanvas.toDataURL("image/png");
			card.image = updatedImageData;

			// Update VIconDisplay
			document.getElementById("VIconDisplay-image").src = updatedImageData;

			// Update Stomach
			populateStomach();

			closeButtonOnClick();
		};

		const closeButtonOnClick = () => {
			// Reset and close the drawing interface
			drawCanvasContainer.style.display = "none";
			doneButton.textContent = "Done!";

			doneButton.removeEventListener("click", doneButtonOnClick);
			drawCanvasCloseButton.removeEventListener("click", closeButtonOnClick);
		};

		doneButton.addEventListener("click", doneButtonOnClick);
		drawCanvasCloseButton.addEventListener("click", closeButtonOnClick);	

		// Close the VIconDisplay
		display.style.display = "none";
	}
});

// Update populateTmenu to create clickable containers for VIcons
function populateTmenu() {
	const tmenuList = document.getElementById("TmenuList");
	tmenuList.innerHTML = ""; // Clear previous entries

	// Filter cards without images
	const cardsWithoutImages = cards.filter(card => !card.image);

	// Randomly select 5 cards
	const selectedCards = cardsWithoutImages.sort(() => 0.5 - Math.random()).slice(0, 5);

	// Create containers for each selected card
	for (const card of selectedCards) {
		const container = document.createElement("div");
		container.classList.add("tmenu-container");
		container.addEventListener("click", () => showDrawInterface(card, container));

		const icon = document.createElement("div");
		icon.classList.add("tmenu-icon");
		icon.textContent = "?"; // Placeholder text

		container.appendChild(icon);
		tmenuList.appendChild(container);
	}
}

// Close TMenu when the close button is clicked
document.getElementById("TmenuCloseButton").addEventListener("click", () => {
	document.getElementById("Tmenu-checkbox").checked = false; // Uncheck the checkbox to close TMenu
});

// Close drawCanvasContainer when the close button is clicked
document.getElementById("drawCanvasCloseButton").addEventListener("click", () => {
	document.getElementById("drawCanvasContainer").style.display = "none"; // Hide the drawing interface
});

// Close the stomach section when the close button is clicked
const magnifierCheckbox = document.getElementById("magnifier-checkbox");
document.getElementById("stomachCloseButton").addEventListener("click", () => {
	magnifierCheckbox.checked = false;
});

function populateStomach() {
	const stomachCategories = document.getElementById("stomachCategories");

	// Clear previous content
	stomachCategories.innerHTML = "";

	// Group cards by category
	const categories = Map.groupBy(cards, card => card.category);

	// Create a section for each category
	for (const [category, items] of categories) {
		const categoryTitle = document.createElement("h2");
		categoryTitle.textContent = category;

		const categoryGrid = document.createElement("div");
		categoryGrid.classList.add("stomach-grid");

		// Add images to the grid
		for (const item of items) {
			const icon = document.createElement("button");
			icon.classList.add("stomach-icon");

			if (item.image) {
				const img = document.createElement("img");
				img.src = item.image;
				img.alt = item.word;
				icon.appendChild(img);
				icon.title = item.word;
				icon.addEventListener("click", () => showVIconDisplay(item)); // Add click event
			} else {
				icon.textContent = "?"; // Set placeholder text if no image
				icon.disabled = true;
			}
			categoryGrid.appendChild(icon);
		}

		stomachCategories.appendChild(categoryTitle);
		stomachCategories.appendChild(categoryGrid);
	}
}

/** Initializes the life system display. */
function initLifeSystem() {
	lifeContainer.innerHTML = ""; // Clear existing hearts
	for (let i = 0; i < maxLives; i++) {
		const heart = document.createElement("div");
		heart.classList.add("life-heart", i < currentLives ? "full" : "empty");
		heart.style.backgroundImage = i < currentLives 
			? "url('res/img/heart-full.png')" 
			: "url('res/img/heart-empty.png')"; // Set image
		lifeContainer.appendChild(heart);
	}
}

/** Restores one life when feeding vocMon. */
function restoreLife() {
	if (currentLives < maxLives) {
		currentLives++;
		initLifeSystem();
	}
}

// Initialize on page load
setDrawCanvasCursorImage("pencil");
populateTmenu();
populateStomach();
initLifeSystem();
