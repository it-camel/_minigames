import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type Board = (string | null)[][];

interface Tetromino {
  shape: number[][];
  color: string;
  type: TetrominoType;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY_BOARD: Board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));

const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 'bg-cyan-500',
    type: 'I'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-500',
    type: 'O'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: 'bg-purple-500',
    type: 'T'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: 'bg-green-500',
    type: 'S'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: 'bg-red-500',
    type: 'Z'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: 'bg-blue-500',
    type: 'J'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: 'bg-orange-500',
    type: 'L'
  }
};

function TetrisGame() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const getRandomTetromino = (): Tetromino => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    return TETROMINOES[randomType];
  };

  const rotatePiece = (piece: number[][]): number[][] => {
    const rows = piece.length;
    const cols = piece[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = piece[i][j];
      }
    }
    
    return rotated;
  };

  const isValidPosition = (piece: Tetromino, position: { x: number; y: number }, board: Board): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const placePiece = (piece: Tetromino, position: { x: number; y: number }, board: Board): Board => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && position.y + y >= 0) {
          newBoard[position.y + y][position.x + x] = piece.color;
        }
      }
    }
    
    return newBoard;
  };

  const clearLines = (board: Board): { newBoard: Board; linesCleared: number } => {
    const newBoard = board.filter(row => row.some(cell => cell === null));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }
    
    return { newBoard, linesCleared };
  };

  const spawnNewPiece = useCallback(() => {
    const piece = nextPiece || getRandomTetromino();
    const position = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
    
    if (!isValidPosition(piece, position, board)) {
      setIsGameOver(true);
      setIsPlaying(false);
      return;
    }
    
    setCurrentPiece(piece);
    setCurrentPosition(position);
    setNextPiece(getRandomTetromino());
  }, [nextPiece, board]);

  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || isGameOver) return;
    
    const newPosition = { ...currentPosition };
    
    switch (direction) {
      case 'left':
        newPosition.x -= 1;
        break;
      case 'right':
        newPosition.x += 1;
        break;
      case 'down':
        newPosition.y += 1;
        break;
    }
    
    if (isValidPosition(currentPiece, newPosition, board)) {
      setCurrentPosition(newPosition);
    } else if (direction === 'down') {
      // Piece has landed
      const newBoard = placePiece(currentPiece, currentPosition, board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + linesCleared * 100 * level);
      setLevel(Math.floor(lines / 10) + 1);
      
      spawnNewPiece();
    }
  }, [currentPiece, currentPosition, board, isGameOver, lines, level, spawnNewPiece]);

  const rotatePieceHandler = () => {
    if (!currentPiece || isGameOver) return;
    
    const rotatedShape = rotatePiece(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    
    if (isValidPosition(rotatedPiece, currentPosition, board)) {
      setCurrentPiece(rotatedPiece);
    }
  };

  const resetGame = () => {
    setBoard(EMPTY_BOARD);
    setCurrentPiece(null);
    setCurrentPosition({ x: 0, y: 0 });
    setNextPiece(null);
    setScore(0);
    setLevel(1);
    setLines(0);
    setIsPlaying(false);
    setIsGameOver(false);
  };

  const startGame = () => {
    if (!isPlaying && !currentPiece) {
      spawnNewPiece();
    }
    setIsPlaying(!isPlaying);
  };

  // Game loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    
    const interval = setInterval(() => {
      movePiece('down');
    }, Math.max(100, 1000 - (level - 1) * 100));
    
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, level, movePiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece('right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece('down');
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotatePieceHandler();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, movePiece]);

  const renderBoard = () => {
    let displayBoard = board.map(row => [...row]);
    
    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x] && currentPosition.y + y >= 0) {
            displayBoard[currentPosition.y + y][currentPosition.x + x] = currentPiece.color;
          }
        }
      }
    }
    
    return displayBoard;
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Tetris</h2>
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-white">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-sm">Level: {level}</div>
            <div className="text-sm">Lines: {lines}</div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={startGame}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={isGameOver}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={rotatePieceHandler}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={!isPlaying || isGameOver}
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate</span>
            </button>
            <button
              onClick={resetGame}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-8">
        {/* Game Board */}
        <div className="bg-black rounded-lg p-4 shadow-2xl">
          <div 
            className="grid gap-0 bg-gray-900 rounded border-2 border-gray-700"
            style={{ 
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
              width: '300px',
              height: '600px'
            }}
          >
            {renderBoard().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`border border-gray-800 ${
                    cell ? cell : 'bg-gray-900'
                  }`}
                />
              ))
            )}
          </div>
        </div>

        {/* Next Piece Preview */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <h3 className="text-white font-bold mb-4">Next Piece</h3>
          <div className="bg-black rounded p-2">
            <div 
              className="grid gap-0"
              style={{ 
                gridTemplateColumns: 'repeat(4, 1fr)',
                width: '80px',
                height: '80px'
              }}
            >
              {Array.from({ length: 16 }, (_, i) => {
                const x = i % 4;
                const y = Math.floor(i / 4);
                const isActive = nextPiece?.shape[y]?.[x];
                
                return (
                  <div
                    key={i}
                    className={`border border-gray-800 ${
                      isActive ? nextPiece.color : 'bg-gray-900'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isGameOver && (
        <div className="text-center bg-red-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">Game Over!</h3>
          <p>Final Score: {score}</p>
          <p>Lines Cleared: {lines}</p>
        </div>
      )}

      <div className="text-white/80 text-center">
        <p>Use arrow keys to move and rotate pieces. Clear lines to score points!</p>
      </div>
    </div>
  );
}

export default TetrisGame;