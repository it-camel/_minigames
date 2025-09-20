import React, { useState } from 'react';
import { Home, ArrowLeft } from 'lucide-react';
import GameGrid from './components/GameGrid';
import SnakeGame from './components/SnakeGame';
import Game2048 from './components/Game2048';
import TicTacToe from './components/TicTacToe';
import MemoryGame from './components/MemoryGame';
import TetrisGame from './components/TetrisGame';
import BreakoutGame from './components/BreakoutGame';
import FlappyBirdGame from './components/FlappyBirdGame';
import SudokuGame from './components/SudokuGame';
import PacManGame from './components/PacManGame';
import SpaceInvadersGame from './components/SpaceInvadersGame';
import PongGame from './components/PongGame';
import MinesweeperGame from './components/MinesweeperGame';

type GameType = 'home' | 'snake' | '2048' | 'tictactoe' | 'memory' | 'tetris' | 'breakout' | 'flappybird' | 'sudoku' | 'pacman' | 'spaceinvaders' | 'pong' | 'minesweeper';

function App() {
  const [currentGame, setCurrentGame] = useState<GameType>('home');

  const renderGame = () => {
    switch (currentGame) {
      case 'snake':
        return <SnakeGame />;
      case '2048':
        return <Game2048 />;
      case 'tictactoe':
        return <TicTacToe />;
      case 'memory':
        return <MemoryGame />;
      case 'tetris':
        return <TetrisGame />;
      case 'breakout':
        return <BreakoutGame />;
      case 'flappybird':
        return <FlappyBirdGame />;
      case 'sudoku':
        return <SudokuGame />;
      case 'pacman':
        return <PacManGame />;
      case 'spaceinvaders':
        return <SpaceInvadersGame />;
      case 'pong':
        return <PongGame />;
      case 'minesweeper':
        return <MinesweeperGame />;
      default:
        return <GameGrid onGameSelect={setCurrentGame} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SMG</span>
            </div>
            <h1 className="text-white text-xl font-bold">Smart Mini Games</h1>
          </div>
          
          {currentGame !== 'home' && (
            <button
              onClick={() => setCurrentGame('home')}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Games</span>
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {renderGame()}
      </main>
    </div>
  );
}

export default App;