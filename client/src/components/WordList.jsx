import React from 'react';

const WordList = ({ words, foundWords }) => {
  return (
    <div className="word-list">
      <h2>Words to Find</h2>
      <ul>
        {words.map((word, index) => (
          <li key={index} className={foundWords.includes(word) ? 'found' : ''}>
            {word}
          </li>
        ))}
      </ul>
      <div className="progress">
        Found: {foundWords.length} / {words.length}
      </div>
    </div>
  );
};

export default WordList;