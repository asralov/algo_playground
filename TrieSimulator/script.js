import { Trie } from "./Trie.js";

//============== Functions ===================//
/**
 * getAllWords() -- opens a file words.txt to get all words and returns a set of
 * all words (set to avoid duplicates)
 * @returns set of all words in english
 */
async function getAllWords() {
  const allWords = new Set();
  const response = await fetch("words.txt");
  const text = await response.text();
  const words = text.split("\n");
  for (let word of words) {
    word = word.trim().toLowerCase();
    if (word) {
      allWords.add(word);
    }
  }
  return allWords;
}

/**
 * init function to get all words and add it
 * to the trie data structure.
 */
async function initialize() {
  const words = await getAllWords();
  for (let word of words) {
    trie.add(word);
  }
}

//================ Body ================//
const trie = new Trie();
initialize();

// get all items in the layout
const searchBox = document.getElementById("searchBox");
const suggestionList = document.getElementById("suggestions");
const limitSelect = document.getElementById("limitSelect");

searchBox.addEventListener("input", () => {
  const prefix = searchBox.value.toLowerCase();
  suggestionList.innerHTML = "";
  if (prefix === "") return;
  const suggestions = trie.autocomplete(prefix);
  const limit = parseInt(limitSelect.value);
  suggestions.slice(0, limit).forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    suggestionList.appendChild(li);
  });
});

limitSelect.addEventListener("change", () => {
  searchBox.dispatchEvent(new Event("input"));
});
