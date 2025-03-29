import React from 'react';

const GameBoard = ({ grid, selection, onCellMouseDown, onCellMouseOver, onCellMouseUp }) => {
  // Checking if cell is selected
  const isSelected = (row, col) => {
    if (!selection.start || !selection.current) return false;

    const start = selection.start;
    const current = selection.current;
    const dRow = current.row - start.row;
    const dCol = current.col - start.col;

    const length = Math.max(Math.abs(dRow), Math.abs(dCol));
    if (length === 0) return row === start.row && col === start.col;

    const unitRow = dRow / length;
    const unitCol = dCol / length;

    for (let i = 0; i <= length; i++) {
      const checkRow = Math.round(start.row + unitRow * i);
      const checkCol = Math.round(start.col + unitCol * i);

      if (row === checkRow && col === checkCol) {
        return true;
      }
    }

    return false;
  };

  // Rendering game board
  return (
    <div className="game-board">
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className={`board-cell ${isSelected(rowIndex, colIndex) ? 'selected' : ''}`}
              onMouseDown={() => onCellMouseDown(rowIndex, colIndex)}
              onMouseOver={() => onCellMouseOver(rowIndex, colIndex)}
              onMouseUp={() => onCellMouseUp(rowIndex, colIndex)}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;