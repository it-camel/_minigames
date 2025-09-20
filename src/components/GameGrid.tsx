import {
  Gamepad2,
  Grid3X3,
  Zap,
  Brain,
  Box,
  Target,
  Bird,
  Hash,
  Ghost,
  Rocket,
  Palette as Paddle,
  Bomb
} from 'lucide-react';

type GameGridProps = {
  onGameSelect: (game: 'snake' | '2048' | 'tictactoe' | 'memory' | 'tetris' | 'breakout' | 'flappybird' | 'sudoku' | 'pacman' | 'spaceinvaders' | 'pong' | 'minesweeper') => void;
};

const games = [
  {
    id: 'snake' as const,
    title: 'Snake Game',
    description: 'Classic snake game with smooth controls',
    icon: Gamepad2,
    color: 'from-green-500 to-emerald-600',
    hoverColor: 'hover:from-green-400 hover:to-emerald-500'
  },
  {
    id: '2048' as const,
    title: '2048 Puzzle',
    description: 'Combine numbers to reach 2048',
    icon: Grid3X3,
    color: 'from-orange-500 to-red-600',
    hoverColor: 'hover:from-orange-400 hover:to-red-500'
  },
  {
    id: 'tictactoe' as const,
    title: 'Tic Tac Toe',
    description: 'Classic X and O strategy game',
    icon: Zap,
    color: 'from-blue-500 to-cyan-600',
    hoverColor: 'hover:from-blue-400 hover:to-cyan-500'
  },
  {
    id: 'memory' as const,
    title: 'Memory Cards',
    description: 'Test your memory with card matching',
    icon: Brain,
    color: 'from-purple-500 to-pink-600',
    hoverColor: 'hover:from-purple-400 hover:to-pink-500'
  },
  {
    id: 'tetris' as const,
    title: 'Tetris',
    description: 'Classic block-stacking puzzle game',
    icon: Box,
    color: 'from-indigo-500 to-purple-600',
    hoverColor: 'hover:from-indigo-400 hover:to-purple-500'
  },
  {
    id: 'breakout' as const,
    title: 'Breakout',
    description: 'Break all the bricks with the ball',
    icon: Target,
    color: 'from-yellow-500 to-orange-600',
    hoverColor: 'hover:from-yellow-400 hover:to-orange-500'
  },
  {
    id: 'flappybird' as const,
    title: 'Flappy Bird',
    description: 'Navigate through pipes by flapping',
    icon: Bird,
    color: 'from-teal-500 to-green-600',
    hoverColor: 'hover:from-teal-400 hover:to-green-500'
  },
  {
    id: 'sudoku' as const,
    title: 'Sudoku',
    description: 'Fill the grid with numbers 1-9',
    icon: Hash,
    color: 'from-rose-500 to-pink-600',
    hoverColor: 'hover:from-rose-400 hover:to-pink-500'
  },
  {
    id: 'pacman' as const,
    title: 'Pac-Man',
    description: 'Eat dots and avoid ghosts',
    icon: Ghost,
    color: 'from-yellow-500 to-amber-600',
    hoverColor: 'hover:from-yellow-400 hover:to-amber-500'
  },
  {
    id: 'spaceinvaders' as const,
    title: 'Space Invaders',
    description: 'Defend Earth from alien invasion',
    icon: Rocket,
    color: 'from-green-500 to-emerald-600',
    hoverColor: 'hover:from-green-400 hover:to-emerald-500'
  },
  {
    id: 'pong' as const,
    title: 'Pong',
    description: 'Classic table tennis game',
    icon: Paddle,
    color: 'from-gray-500 to-slate-600',
    hoverColor: 'hover:from-gray-400 hover:to-slate-500'
  },
  {
    id: 'minesweeper' as const,
    title: 'Minesweeper',
    description: 'Find all mines without exploding',
    icon: Bomb,
    color: 'from-red-500 to-rose-600',
    hoverColor: 'hover:from-red-400 hover:to-rose-500'
  }
];

function GameGrid({ onGameSelect }: GameGridProps) {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Smart Mini Games Collection</h2>
      <p className="text-white/80 text-lg mb-12">Play classic games online for free - No downloads required!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {games.map((game) => {
          const IconComponent = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => onGameSelect(game.id)}
              className={`bg-gradient-to-br ${game.color} ${game.hoverColor} rounded-xl p-8 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group`}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">{game.title}</h3>
                <p className="text-white/90 text-sm leading-relaxed">{game.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-16 text-center">
        <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-md rounded-full px-6 py-3">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
          </div>
          <span className="text-white/80 text-sm">More games coming soon!</span>
        </div>
      </div>
    </div>
  );
}

export default GameGrid;