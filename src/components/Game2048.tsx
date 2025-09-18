import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';

type Board = (number | null)[][];

const BOARD_SIZE = 4;

function Game2048() {
  const [board, setBoard] = useState<Board>(() => initializeBoard());
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  function initializeBoard(): Board {
    const newBoard: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    return newBoard;
  }

  function addRandomTile(board: Board): void {
    const emptyCells: { row: number; col: number }[] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!board[row][col]) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  const moveLeft = useCallback((board: Board): { newBoard: Board; moved: boolean; scoreIncrease: number } => {
    const newBoard: Board = board.map(row => [...row]);
    let moved = false;
    let scoreIncrease = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      const filteredRow = newBoard[row].filter(val => val !== null);
      const mergedRow: (number | null)[] = [];
      
      for (let i = 0; i < filteredRow.length; i++) {
        if (i < filteredRow.length - 1 && filteredRow[i] === filteredRow[i + 1]) {
          const mergedValue = filteredRow[i]! * 2;
          mergedRow.push(mergedValue);
          scoreIncrease += mergedValue;
          i++; // Skip next element
        } else {
          mergedRow.push(filteredRow[i]);
        }
      }

      // Fill with nulls
      while (mergedRow.length < BOARD_SIZE) {
        mergedRow.push(null);
      }

      // Check if row changed
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (newBoard[row][col] !== mergedRow[col]) {
          moved = true;
        }
        newBoard[row][col] = mergedRow[col];
      }
    }

    return { newBoard, moved, scoreIncrease };
  }, []);

  const rotateBoard = useCallback((board: Board): Board => {
    const rotated: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        rotated[col][BOARD_SIZE - 1 - row] = board[row][col];
      }
    }
    return rotated;
  }, []);

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (isGameOver) return;

    let currentBoard = board;
    
    // Rotate board to make all moves equivalent to left
    for (let i = 0; i < { up: 3, right: 2, down: 1, left: 0 }[direction]; i++) {
      currentBoard = rotateBoard(currentBoard);
    }

    const { newBoard, moved, scoreIncrease } = moveLeft(currentBoard);
    
    if (!moved) return;

    // Rotate back
    let finalBoard = newBoard;
    for (let i = 0; i < { up: 1, right: 2, down: 3, left: 0 }[direction]; i++) {
      finalBoard = rotateBoard(finalBoard);
    }

    addRandomTile(finalBoard);
    setBoard(finalBoard);
    setScore(prev => prev + scoreIncrease);

    // Check for 2048
    if (!hasWon && finalBoard.some(row => row.some(cell => cell === 2048))) {
      setHasWon(true);
    }

    // Check game over
    if (isGameOverCheck(finalBoard)) {
      setIsGameOver(true);
    }
  }, [board, isGameOver, hasWon, moveLeft, rotateBoard]);

  function isGameOverCheck(board: Board): boolean {
    // Check for empty cells
    if (board.some(row => row.some(cell => cell === null))) {
      return false;
    }

    // Check for possible merges
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const current = board[row][col];
        if (
          (row < BOARD_SIZE - 1 && board[row + 1][col] === current) ||
          (col < BOARD_SIZE - 1 && board[row][col + 1] === current)
        ) {
          return false;
        }
      }
    }

    return true;
  }

  const resetGame = () => {
    setBoard(initializeBoard());
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          move('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          move('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [move]);

  const getTileColor = (value: number | null): string => {
    if (!value) return 'bg-gray-300';
    
    const colors: { [key: number]: string } = {
      2: 'bg-gray-100 text-gray-800',
      4: 'bg-gray-200 text-gray-800',
      8: 'bg-orange-300 text-white',
      16: 'bg-orange-400 text-white',
      32: 'bg-orange-500 text-white',
      64: 'bg-red-400 text-white',
      128: 'bg-yellow-400 text-white',
      256: 'bg-yellow-500 text-white',
      512: 'bg-yellow-600 text-white',
      1024: 'bg-purple-500 text-white',
      2048: 'bg-purple-600 text-white'
    };
    
    return colors[value] || 'bg-purple-700 text-white';
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">2048 Game</h2>
        <div className="flex items-center justify-center space-x-8">
          <div className="text-white">
            <span className="text-lg font-semibold">Score: {score}</span>
          </div>
          <button
            onClick={resetGame}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Game</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-400 p-4 rounded-xl shadow-2xl">
        <div className="grid grid-cols-4 gap-2" style={{ width: '320px', height: '320px' }}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  ${getTileColor(cell)}
                  rounded-lg flex items-center justify-center font-bold text-xl
                  transition-all duration-150 ease-in-out
                `}
              >
                {cell}
              </div>
            ))
          )}
        </div>
      </div>

      {hasWon && !isGameOver && (
        <div className="text-center bg-yellow-500 text-white px-8 py-4 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <Trophy className="w-6 h-6" />
            <h3 className="text-xl font-bold">You Win!</h3>
          </div>
          <p>You reached 2048! Keep playing for a higher score.</p>
        </div>
      )}

      {isGameOver && (
        <div className="text-center bg-red-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">Game Over!</h3>
          <p>Final Score: {score}</p>
        </div>
      )}

      <div className="text-white/80 text-center">
        <p>Use arrow keys to move tiles. Combine tiles with the same number to reach 2048!</p>
      </div>
    </div>
  );
}

export default Game2048;