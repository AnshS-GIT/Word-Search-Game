import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './styles/WordSearch.css';
import WordList from './components/WordList.jsx';
import GameBoard from './components/GameBoard.jsx';
import GameControls from './components/GameControls.jsx';
import { initialWords } from '../../Server/seedData.js';

const backgroundImages = [
  "https://img.freepik.com/premium-photo/nature-background-people-animal-game-architecture-logo-mockup_1086760-37566.jpg?semt=ais_hybrid",
  "https://static.vecteezy.com/system/resources/previews/003/303/295/non_2x/mountains-background-game-vector.jpg",
  "https://img.freepik.com/premium-photo/abstract-cyberpunk-city-street-gaming-wallpaper-background-3d-illustration-rendering-metaverse-virtual-reality-game_42100-4746.jpg",
  "https://t4.ftcdn.net/jpg/07/84/58/53/360_F_784585381_ak0FHBBtE6WgiztVVbZZmWiX5aMP5HGI.jpg",
  "https://img.itch.zone/aW1hZ2UvMTIxNjU4LzU2MDM4MS5wbmc=/315x250%23c/yrkGs9.png",
  "https://plus.unsplash.com/premium_photo-1681400704361-f675cdcde0f4?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Z2FtaW5nJTIwYmFja2dyb3VuZHxlbnwwfHwwfHx8MA%3D%3D",
  "https://t3.ftcdn.net/jpg/03/23/88/08/360_F_323880864_TPsH5ropjEBo1ViILJmcFHJqsBzorxUB.jpg",
  "https://media.istockphoto.com/id/485117881/vector/education-background.jpg?s=612x612&w=0&k=20&c=z1SyhfMWnIwPtUX3TJf2DlfWM9KxfzPMkBgrdZ0wZ8g="
];

const App = () => {
  const [words, setWords] = useState([]);
  const [grid, setGrid] = useState([]);
  const [gridSize, setGridSize] = useState(10);
  const [foundWords, setFoundWords] = useState([]);
  const [selection, setSelection] = useState({ start: null, current: null, end: null });
  const [gameComplete, setGameComplete] = useState(false);
  const [difficulty, setDifficulty] = useState('beginner');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [gameHistory, setGameHistory] = useState(() => {
    const savedHistory = localStorage.getItem('gameHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  const difficultyGridSizeMap = useMemo(() => ({
    beginner: 4,
    easy: 7,
    medium: 10,
    hard: 14,
    expert: 18,
    master: 22
  }), []);

  useEffect(() => {
    setGridSize(difficultyGridSizeMap[difficulty] || 10);
  }, [difficulty, difficultyGridSizeMap]);

  useEffect(() => {
    let timer;
    if (isStopwatchRunning) {
      timer = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isStopwatchRunning]);

  const canPlaceWord = useCallback((grid, word, startRow, startCol, dRow, dCol) => {
    for (let i = 0; i < word.length; i++) {
      const row = startRow + dRow * i;
      const col = startCol + dCol * i;
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize || (grid[row][col] && grid[row][col] !== word[i])) {
        return false;
      }
    }
    return true;
  }, [gridSize]);

  const placeWordsInGrid = useCallback((grid, wordList) => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]
    ];

    const newGrid = JSON.parse(JSON.stringify(grid));
    const successfullyPlacedWords = [];

    wordList.forEach(word => {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * gridSize);
        const [dRow, dCol] = directions[Math.floor(Math.random() * directions.length)];

        if (canPlaceWord(newGrid, word, row, col, dRow, dCol)) {
          for (let i = 0; i < word.length; i++) {
            newGrid[row + dRow * i][col + dCol * i] = word[i];
          }
          placed = true;
          successfullyPlacedWords.push(word);
        }
      }

      if (!placed) {
        console.warn(`Failed to place word: ${word}`);
      }
    });

    return { grid: newGrid, placedWords: successfullyPlacedWords };
  }, [gridSize, canPlaceWord]);

  const fillEmptyCells = useCallback((grid) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newGrid = JSON.parse(JSON.stringify(grid));

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    return newGrid;
  }, [gridSize]);

  const generateNewGame = useCallback((wordList, size) => {
    if (!wordList || wordList.length === 0) {
      console.error("Word list is empty!");
      return;
    }

    const emptyGrid = Array(size).fill().map(() => Array(size).fill(''));
    const { grid: filledGrid, placedWords } = placeWordsInGrid(emptyGrid, wordList);
    const finalGrid = fillEmptyCells(filledGrid);

    if (placedWords.length === 0) {
      console.warn("No words could be placed. Using fallback words.");
      const fallbackWords = ['REACT', 'HTML', 'CSS', 'NODE', 'STATE'];
      generateNewGame(fallbackWords, size);
    }

    setGrid(finalGrid);
    setWords(placedWords);
  }, [placeWordsInGrid, fillEmptyCells]);

  useEffect(() => {
    const fetchWords = () => {
      try {
        setLoading(true);

        const wordsPerDifficulty = {
          beginner: [3, 5],
          easy: [7, 10],
          medium: [12, 15],
          hard: [17, 20],
          expert: [23, 25],
          master: [28, 30],
        };

        const [minWords, maxWords] = wordsPerDifficulty[difficulty] || [7, 10];
        const numWords = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;

        let filteredWords = initialWords
          .filter(word => word.difficulty === difficulty)
          .map(word => word.text)
          .filter(word => word.length <= gridSize)
          .slice(0, numWords);

        if (filteredWords.length === 0) {
          console.warn('No words available. Using fallback.');
          filteredWords = ['REACT', 'HTML', 'CSS', 'NODE', 'STATE'];
        }

        setWords(filteredWords);
        generateNewGame(filteredWords, gridSize);
      } catch (err) {
        console.error('Error fetching words:', err.message);
        setError(err.message);

        const fallbackWords = ['REACT', 'JAVASCRIPT', 'HTML', 'CSS', 'MONGODB'];
        setWords(fallbackWords);
        generateNewGame(fallbackWords, gridSize);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [difficulty, gridSize, generateNewGame]);

  const handleCellMouseDown = (row, col) => {
    if (!isStopwatchRunning) {
      setIsStopwatchRunning(true);
    }
    setSelection({ start: { row, col }, current: { row, col }, end: null });
  };

  const handleCellMouseOver = (row, col) => {
    if (selection.start) {
      setSelection({ ...selection, current: { row, col } });
    }
  };

  const handleCellMouseUp = (row, col) => {
    if (selection.start) {
      const selectedWord = getSelectedWord(selection.start, { row, col });
      const wordIndex = words.findIndex(word =>
        word === selectedWord || word === selectedWord.split('').reverse().join('')
      );

      if (wordIndex !== -1 && !foundWords.includes(words[wordIndex])) {
        const newFoundWords = [...foundWords, words[wordIndex]];
        setFoundWords(newFoundWords);

        setScore((prevScore) => prevScore + words[wordIndex].length * 10);

        if (newFoundWords.length === words.length) {
          setGameComplete(true);
          setIsStopwatchRunning(false);

          const newHistory = [
            {
              score,
              elapsedTime,
              difficulty,
              date: new Date().toLocaleString(),
            },
            ...gameHistory,
          ].slice(0, 10);

          setGameHistory(newHistory);
          localStorage.setItem('gameHistory', JSON.stringify(newHistory));
        }
      }

      setSelection({ start: null, current: null, end: null });
    }
  };

  const getSelectedWord = (start, end) => {
    const dRow = end.row - start.row;
    const dCol = end.col - start.col;
    const length = Math.max(Math.abs(dRow), Math.abs(dCol));
    const unitRow = dRow / length;
    const unitCol = dCol / length;

    let word = '';
    for (let i = 0; i <= length; i++) {
      const row = Math.round(start.row + unitRow * i);
      const col = Math.round(start.col + unitCol * i);
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        word += grid[row][col];
      }
    }

    return word;
  };

  const restartGame = () => {
    setGameComplete(false);
    setGameStarted(false);
    setElapsedTime(0);
    setIsStopwatchRunning(false);
    setScore(0);
    setFoundWords([]);

    const wordsPerDifficulty = {
      beginner: 5,
      easy: 10,
      medium: 15,
      hard: 20,
      expert: 25,
      master: 30,
    };

    const maxWords = wordsPerDifficulty[difficulty] || 10;

    let filteredWords = initialWords
      .filter(word => word.difficulty === difficulty)
      .map(word => word.text)
      .filter(word => word.length <= gridSize)
      .slice(0, maxWords);

    if (filteredWords.length === 0) {
      console.warn('No words available. Using fallback.');
      filteredWords = ['REACT', 'HTML', 'CSS', 'NODE', 'STATE'];
    }

    setWords(filteredWords);
    generateNewGame(filteredWords, gridSize);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <p>Fallback words used.</p>
        <GameBoard
          grid={grid}
          selection={selection}
          onCellMouseDown={handleCellMouseDown}
          onCellMouseOver={handleCellMouseOver}
          onCellMouseUp={handleCellMouseUp}
        />
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="word-search-container start-screen">
        <h1>Word Search Game</h1>
        <div className="start-options">
          <div className="option-group">
            <label htmlFor="difficulty">Difficulty:</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
              <option value="master">Master</option>
            </select>
          </div>
        </div>
        <button
          className="start-button"
          onClick={() => {
            const randomImage = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
            setBackgroundImage(randomImage);
            setGameStarted(true);
            setIsStopwatchRunning(true);
          }}
        >
          Start Game
        </button>
        <a href="/About me/about.html" className="about-me-button">
          About Me
        </a>
      </div>
    );
  }

  return (
    <div
      className="word-search-container"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        backgroundColor: "#f4f4f4"
      }}
    >
      <h1>Word Search Game</h1>
      <div className="game-info">
        <div className="info-item">
          <h2>Time:</h2>
          <p>{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</p>
        </div>
        <div className="info-item">
          <h2>Score:</h2>
          <p>{score}</p>
        </div>
      </div>
      <div className="game-area">
        <WordList words={words} foundWords={foundWords} />
        <GameBoard
          grid={grid}
          selection={selection}
          onCellMouseDown={handleCellMouseDown}
          onCellMouseOver={handleCellMouseOver}
          onCellMouseUp={handleCellMouseUp}
        />
      </div>
      <GameControls onRestart={restartGame} />
      {gameComplete && (
        <div className="game-complete">
          <h2>Congrats!</h2>
          <p>Words found!</p>
          <p>Score: {score}</p>
          <p>Time: {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</p>
          <button onClick={restartGame}>Play Again</button>
        </div>
      )}
      <div className="game-history">
        <h2>Game History</h2>
        <ul>
          {gameHistory.map((game, index) => (
            <li key={index}>
              <strong>Score:</strong> {game.score}, <strong>Time:</strong> {Math.floor(game.elapsedTime / 60)}:{String(game.elapsedTime % 60).padStart(2, '0')}, <strong>Diff:</strong> {game.difficulty}, <strong>Date:</strong> {game.date}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;