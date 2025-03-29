import React from 'react';

const GameControls = ({ onRestart }) => {
  return (
    <div className="game-controls">
      <button onClick={onRestart}>New Game</button>
    </div>
  );
};

export default GameControls;