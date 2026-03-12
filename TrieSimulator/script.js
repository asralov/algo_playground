import { Trie } from "./Trie.js";

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

async function initialize() {
    const words = await getAllWords();
    for (let word of words) {
        trie.add(word);
    }
}

const trie = new Trie();
initialize();
const searchBox = document.getElementById("searchBox");
const suggestionList = document.getElementById("suggestions");
const limitSelect = document.getElementById("limitSelect");

searchBox.addEventListener("input", () => {
    const prefix = searchBox.value.toLowerCase();
    suggestionList.innerHTML = "";
    if (prefix === "") return;
    const suggestions = trie.autocomplete(prefix);
    const limit = parseInt(limitSelect.value);
    suggestions.slice(0, limit).forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        suggestionList.appendChild(li);

    });
});

limitSelect.addEventListener("change", () => {
    searchBox.dispatchEvent(new Event("input"));
});