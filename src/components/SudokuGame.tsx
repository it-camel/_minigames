import React, { useState, useEffect } from 'react';
import { RotateCcw, Lightbulb, Check } from 'lucide-react';

type SudokuBoard = (number | null)[][];

const EMPTY_BOARD: SudokuBoard = Array(9).fill(null).map(() => Array(9).fill(null));

function SudokuGame() {
  const [board, setBoard] = useState<SudokuBoard>(EMPTY_BOARD);
  const [initialBoard, setInitialBoard] = useState<SudokuBoard>(EMPTY_BOARD);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard') => {
    // Start with a valid complete board
    const completeBoard = generateCompleteBoard();
    
    // Remove numbers based on difficulty
    const cellsToRemove = {
      easy: 40,
      medium: 50,
      hard: 60
    }[difficulty];

    const newBoard = completeBoard.map(row => [...row]);
    const positions = [];
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        positions.push([i, j]);
      }
    }
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Remove numbers
    for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
      const [row, col] = positions[i];
      newBoard[row][col] = null;
    }
    
    setBoard(newBoard);
    setInitialBoard(newBoard.map(row => [...row]));
  };

  const generateCompleteBoard = (): SudokuBoard => {
    const board: SudokuBoard = Array(9).fill(null).map(() => Array(9).fill(null));
    
    // Simple algorithm to generate a valid Sudoku
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Fill diagonal 3x3 boxes first
    for (let box = 0; box < 3; box++) {
      fillBox(board, box * 3, box * 3, [...numbers].sort(() => Math.random() - 0.5));
    }
    
    // Solve the rest
    solveSudoku(board);
    
    return board;
  };

  const fillBox = (board: SudokuBoard, row: number, col: number, nums: number[]) => {
    let index = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        board[row + i][col + j] = nums[index++];
      }
    }
  };

  const isValid = (board: SudokuBoard, row: number, col: number, num: number): boolean => {
    // Check row
    for (let j = 0; j < 9; j++) {
      if (j !== col && board[row][j] === num) return false;
    }
    
    // Check column
    for (let i = 0; i < 9; i++) {
      if (i !== row && board[i][col] === num) return false;
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if ((i !== row || j !== col) && board[i][j] === num) return false;
      }
    }
    
    return true;
  };

  const solveSudoku = (board: SudokuBoard): boolean => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === null) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, i, j, num)) {
              board[i][j] = num;
              if (solveSudoku(board)) return true;
              board[i][j] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const handleCellClick = (row: number, col: number) => {
    if (initialBoard[row][col] !== null) return; // Can't edit initial numbers
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== null) return;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);
    
    // Check for errors
    updateErrors(newBoard);
    
    // Check if complete
    checkCompletion(newBoard);
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== null) return;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = null;
    setBoard(newBoard);
    updateErrors(newBoard);
  };

  const updateErrors = (currentBoard: SudokuBoard) => {
    const newErrors = new Set<string>();
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const num = currentBoard[i][j];
        if (num && !isValid(currentBoard, i, j, num)) {
          newErrors.add(`${i}-${j}`);
        }
      }
    }
    
    setErrors(newErrors);
  };

  const checkCompletion = (currentBoard: SudokuBoard) => {
    const isFull = currentBoard.every(row => row.every(cell => cell !== null));
    const hasNoErrors = errors.size === 0;
    
    if (isFull && hasNoErrors) {
      setIsComplete(true);
    }
  };

  const resetGame = () => {
    generateSudoku(difficulty);
    setSelectedCell(null);
    setErrors(new Set());
    setIsComplete(false);
  };

  const getCellClass = (row: number, col: number) => {
    const isInitial = initialBoard[row][col] !== null;
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const hasError = errors.has(`${row}-${col}`);
    const isInSameRowCol = selectedCell && (selectedCell.row === row || selectedCell.col === col);
    const isInSameBox = selectedCell && 
      Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3);
    
    let className = 'w-10 h-10 border border-gray-400 flex items-center justify-center text-lg font-semibold cursor-pointer transition-colors ';
    
    if (isInitial) {
      className += 'bg-gray-200 text-gray-800 font-bold ';
    } else {
      className += 'bg-white text-blue-600 hover:bg-blue-50 ';
    }
    
    if (isSelected) {
      className += 'bg-blue-200 ';
    } else if (isInSameRowCol || isInSameBox) {
      className += 'bg-blue-50 ';
    }
    
    if (hasError) {
      className += 'bg-red-100 text-red-600 ';
    }
    
    // Thicker borders for 3x3 boxes
    if (row % 3 === 0) className += 'border-t-2 border-t-gray-800 ';
    if (col % 3 === 0) className += 'border-l-2 border-l-gray-800 ';
    if (row === 8) className += 'border-b-2 border-b-gray-800 ';
    if (col === 8) className += 'border-r-2 border-r-gray-800 ';
    
    return className;
  };

  useEffect(() => {
    generateSudoku(difficulty);
  }, [difficulty]);

  useEffect(() => {
    updateErrors(board);
  }, [board]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Sudoku</h2>
        
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

        <div className="flex space-x-2">
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
      <div className="bg-white p-4 rounded-xl shadow-2xl">
        <div className="grid grid-cols-9 gap-0 border-2 border-gray-800">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={getCellClass(rowIndex, colIndex)}
              >
                {cell || ''}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Number input */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className="w-12 h-12 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-lg transition-colors"
              disabled={!selectedCell || initialBoard[selectedCell.row][selectedCell.col] !== null}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClearCell}
            className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
            disabled={!selectedCell || initialBoard[selectedCell?.row][selectedCell?.col] !== null}
          >
            ✕
          </button>
        </div>
      </div>

      {isComplete && (
        <div className="text-center bg-green-500 text-white px-8 py-4 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <Check className="w-6 h-6" />
            <h3 className="text-xl font-bold">Congratulations!</h3>
          </div>
          <p>You solved the Sudoku puzzle!</p>
        </div>
      )}

      <div className="text-white/80 text-center max-w-md">
        <p>Fill the grid so each row, column, and 3×3 box contains the numbers 1-9. Click a cell and use the number buttons below.</p>
      </div>
    </div>
  );
}

export default SudokuGame;