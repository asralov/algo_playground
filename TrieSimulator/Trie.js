/**
 * @author Abrorjon Asralov
 * @file Trie.js
 * A trie data structure - very useful to work with strings,
 * especially in real world applications widely used for autocomplete
 * and word suggestions. 
 */

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * add() -- inserts a word that is passed
   * as a parameter.
   * @param {string} word that should be inserted
   * @returns boolean; true if inserted false otherwise
   */
  add(word) {
    // for safety
    word = word.toLowerCase();
    let current = this.root;
    for (let character of word) {
      // append new child node
      if (!current.children.has(character)) {
        let child = new TrieNode();
        current.children.set(character, child);
        current = child;
      } else {
        // move to the existing
        current = current.children.get(character);
      }
    }
    // that word already exist
    if (current.isWord) {
      return false;
    }

    // make that word in the trie
    current.isWord = true;
    return true;
  }

  /**
   * findPrefix() -- helps to find the node of the
   * passed current prefix.
   * @param {string} prefix of a word
   * @returns a reference to the node that ends
   * with that prefix
   */
  findPrefix(prefix) {
    prefix = prefix.toLowerCase();
    let current = this.root;
    for (let character of prefix) {
      // that node does not exist
      if (!current.children.has(character)) {
        return null;
      }
      // move further in the trie
      current = current.children.get(character);
    }
    return current; // reference to the node
  }

  /**
   * collectWords() -- collects all words with the current
   * word.
   * @param {TrieNode} node
   * @param {string} currentWord
   * @param {Array} results
   */
  collectWords(node, currentWord, results, limit = Infinity) {
    if (results.length >= limit) return;
    if (node.isWord) {
      results.push(currentWord);
    }
    // recursively dive into other branches with new character added
    for (let [character, childNode] of [...node.children].sort(([a], [b]) => a.localeCompare(b))) {
      if (results.length >= limit) break;
      this.collectWords(childNode, currentWord + character, results, limit);
    }
  }

  /**
   * autocomplete() -- helps to find words that starts with prefix
   * @param {string} prefix
   * @returns an array of strings with words that match the prefix
   */
  autocomplete(prefix, limit = Infinity) {
    prefix = prefix.toLowerCase();
    let node = this.findPrefix(prefix);
    // cannot find any nodes
    if (!node) {
      return [];
    }
    let results = [];
    this.collectWords(node, prefix, results, limit);
    return results;
  }
}

// Classic scripts work when the playground is opened directly from disk.
if (typeof module !== 'undefined') module.exports = { Trie };
