import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Flag, Clock, Bomb } from 'lucide-react';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
};

function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [minesLeft, setMinesLeft] = useState(DIFFICULTIES[difficulty].mines);
  const [time, setTime] = useState(0);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  const { rows, cols, mines } = DIFFICULTIES[difficulty];

  const initializeBoard = useCallback((firstClickRow?: number, firstClickCol?: number) => {
    const newBoard: Cell[][] = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );

    // Place mines randomly, avoiding first click position
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      
      if (!newBoard[row][col].isMine && 
          !(firstClickRow === row && firstClickCol === col)) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbor mine counts
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (newRow >= 0 && newRow < rows && 
                  newCol >= 0 && newCol < cols && 
                  newBoard[newRow][newCol].isMine) {
                count++;
              }
            }
          }
          newBoard[row][col].neighborMines = count;
        }
      }
    }

    setBoard(newBoard);
  }, [rows, cols, mines]);

  const resetGame = () => {
    setGameState('playing');
    setMinesLeft(mines);
    setTime(0);
    setIsFirstClick(true);
    setGameStarted(false);
    initializeBoard();
  };

  const revealCell = (row: number, col: number) => {
    if (gameState !== 'playing' || board[row][col].isRevealed || board[row][col].isFlagged) {
      return;
    }

    if (isFirstClick) {
      initializeBoard(row, col);
      setIsFirstClick(false);
      setGameStarted(true);
      return;
    }

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      
      const reveal = (r: number, c: number) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || 
            newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) {
          return;
        }

        newBoard[r][c].isRevealed = true;

        if (newBoard[r][c].isMine) {
          setGameState('lost');
          // Reveal all mines
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              if (newBoard[i][j].isMine) {
                newBoard[i][j].isRevealed = true;
              }
            }
          }
          return;
        }

        // If cell has no neighboring mines, reveal neighbors
        if (newBoard[r][c].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              reveal(r + dr, c + dc);
            }
          }
        }
      };

      reveal(row, col);
      return newBoard;
    });
  };

  const toggleFlag = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    
    if (gameState !== 'playing' || board[row][col].isRevealed) {
      return;
    }

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
      
      setMinesLeft(prev => 
        newBoard[row][col].isFlagged ? prev - 1 : prev + 1
      );
      
      return newBoard;
    });
  };

  // Check win condition
  useEffect(() => {
    if (board.length === 0 || gameState !== 'playing') return;

    const revealedCells = board.flat().filter(cell => cell.isRevealed).length;
    const totalCells = rows * cols;
    
    if (revealedCells === totalCells - mines) {
      setGameState('won');
    }
  }, [board, gameState, rows, cols, mines]);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameState]);

  // Initialize board on difficulty change
  useEffect(() => {
    resetGame();
  }, [difficulty, initializeBoard]);

  const getCellClass = (cell: Cell, row: number, col: number) => {
    let baseClass = 'w-8 h-8 border border-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors ';
    
    if (cell.isRevealed) {
      if (cell.isMine) {
        baseClass += 'bg-red-500 text-white ';
      } else {
        baseClass += 'bg-gray-200 ';
        if (cell.neighborMines > 0) {
          const colors = [
            '', 'text-blue-600', 'text-green-600', 'text-red-600',
            'text-purple-600', 'text-yellow-600', 'text-pink-600',
            'text-black', 'text-gray-600'
          ];
          baseClass += colors[cell.neighborMines] + ' ';
        }
      }
    } else {
      baseClass += 'bg-gray-400 hover:bg-gray-300 ';
      if (cell.isFlagged) {
        baseClass += 'bg-yellow-400 ';
      }
    }
    
    return baseClass;
  };

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged && !cell.isRevealed) {
      return '🚩';
    }
    if (cell.isRevealed) {
      if (cell.isMine) {
        return '💣';
      }
      return cell.neighborMines > 0 ? cell.neighborMines.toString() : '';
    }
    return '';
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Minesweeper</h2>
        
        {/* Difficulty selector */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <span className="text-white">Difficulty:</span>
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                difficulty === level
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* Game stats */}
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="flex items-center space-x-2 text-white">
            <Bomb className="w-5 h-5" />
            <span className="text-lg font-semibold">{minesLeft}</span>
          </div>
          <div className="flex items-center space-x-2 text-white">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-semibold">{time}s</span>
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

      {/* Game board */}
      <div className="bg-white p-4 rounded-xl shadow-2xl overflow-auto max-w-full">
        <div 
          className="grid gap-0 border-2 border-gray-600"
          style={{ 
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: '90vw'
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => revealCell(rowIndex, colIndex)}
                onContextMenu={(e) => toggleFlag(e, rowIndex, colIndex)}
                className={getCellClass(cell, rowIndex, colIndex)}
                disabled={gameState !== 'playing'}
              >
                {getCellContent(cell)}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Game result */}
      {gameState === 'won' && (
        <div className="text-center bg-green-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">You Win! 🎉</h3>
          <p>Time: {time} seconds</p>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="text-center bg-red-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">Game Over! 💥</h3>
          <p>You hit a mine!</p>
        </div>
      )}

      <div className="text-white/80 text-center max-w-md">
        <p>Left click to reveal cells, right click to flag mines. Find all mines without exploding!</p>
      </div>
    </div>
  );
}

export default MinesweeperGame;