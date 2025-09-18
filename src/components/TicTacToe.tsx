import React, { useState } from 'react';
import { RotateCcw, Trophy } from 'lucide-react';

type Player = 'X' | 'O' | null;
type Board = Player[];

function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  const checkWinner = (board: Board): Player => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const makeMove = (index: number) => {
    if (board[index] || winner || isDraw) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setScores(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }));
    } else if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
  };

  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 });
    resetGame();
  };

  const getButtonClass = (index: number) => {
    const baseClass = "w-20 h-20 bg-white rounded-lg shadow-lg text-4xl font-bold transition-all duration-200 hover:shadow-xl";
    
    if (board[index] === 'X') {
      return `${baseClass} text-blue-600 hover:bg-blue-50`;
    } else if (board[index] === 'O') {
      return `${baseClass} text-red-600 hover:bg-red-50`;
    } else {
      return `${baseClass} text-gray-400 hover:bg-gray-50 hover:text-gray-600`;
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Tic Tac Toe</h2>
        
        {/* Scoreboard */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center space-x-8 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{scores.X}</div>
              <div className="text-sm">Player X</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{scores.draws}</div>
              <div className="text-sm">Draws</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{scores.O}</div>
              <div className="text-sm">Player O</div>
            </div>
          </div>
        </div>

        {/* Current player indicator */}
        {!winner && !isDraw && (
          <div className="text-white text-lg mb-4">
            Current Player: <span className={`font-bold ${currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'}`}>
              {currentPlayer}
            </span>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex space-x-2">
          <button
            onClick={resetGame}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Game</span>
          </button>
          <button
            onClick={resetScores}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reset Scores
          </button>
        </div>
      </div>

      {/* Game board */}
      <div className="bg-gray-200 p-4 rounded-xl shadow-2xl">
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => makeMove(index)}
              className={getButtonClass(index)}
              disabled={!!cell || !!winner || isDraw}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>

      {/* Game result */}
      {winner && (
        <div className={`text-center px-8 py-4 rounded-lg ${
          winner === 'X' ? 'bg-blue-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center justify-center space-x-2">
            <Trophy className="w-6 h-6" />
            <h3 className="text-xl font-bold">Player {winner} Wins!</h3>
          </div>
        </div>
      )}

      {isDraw && (
        <div className="text-center bg-gray-600 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">It's a Draw!</h3>
        </div>
      )}

      <div className="text-white/80 text-center">
        <p>Click on any empty cell to make your move. Get three in a row to win!</p>
      </div>
    </div>
  );
}

export default TicTacToe;