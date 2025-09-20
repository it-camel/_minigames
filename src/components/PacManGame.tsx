import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  direction: Direction;
  color: string;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 21;
const CELL_SIZE = 20;
const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE;
const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE;

// Simple maze layout (1 = wall, 0 = empty, 2 = dot, 3 = power pellet)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0,0],
  [1,1,1,1,1,2,1,0,1,0,0,0,1,0,1,2,1,1,1,1,1],
  [0,0,0,0,1,2,1,0,1,1,1,1,1,0,1,2,1,0,0,0,0],
  [1,1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,2,1],
  [1,3,2,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,3,1],
  [1,1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1,1],
  [1,2,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function PacManGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pacman, setPacman] = useState<Position>({ x: 10, y: 15 });
  const [ghosts, setGhosts] = useState<Ghost[]>([
    { x: 10, y: 9, direction: 'UP', color: '#FF0000' },
    { x: 9, y: 10, direction: 'LEFT', color: '#FFB8FF' },
    { x: 11, y: 10, direction: 'RIGHT', color: '#00FFFF' },
    { x: 10, y: 11, direction: 'DOWN', color: '#FFB852' }
  ]);
  const [maze, setMaze] = useState(MAZE.map(row => [...row]));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  const [powerModeTimer, setPowerModeTimer] = useState(0);

  const isValidMove = (x: number, y: number): boolean => {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && maze[y][x] !== 1;
  };

  const getNextPosition = (pos: Position, dir: Direction): Position => {
    switch (dir) {
      case 'UP': return { x: pos.x, y: pos.y - 1 };
      case 'DOWN': return { x: pos.x, y: pos.y + 1 };
      case 'LEFT': return { x: pos.x - 1, y: pos.y };
      case 'RIGHT': return { x: pos.x + 1, y: pos.y };
      default: return pos;
    }
  };

  const movePacman = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    setPacman(prevPacman => {
      // Try to change direction if possible
      const nextPos = getNextPosition(prevPacman, nextDirection);
      if (isValidMove(nextPos.x, nextPos.y)) {
        setDirection(nextDirection);
        return nextPos;
      }

      // Continue in current direction
      const currentPos = getNextPosition(prevPacman, direction);
      if (isValidMove(currentPos.x, currentPos.y)) {
        return currentPos;
      }

      return prevPacman;
    });
  }, [isPlaying, isGameOver, direction, nextDirection, maze]);

  const moveGhosts = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    setGhosts(prevGhosts => 
      prevGhosts.map(ghost => {
        const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const validDirections = directions.filter(dir => {
          const nextPos = getNextPosition(ghost, dir);
          return isValidMove(nextPos.x, nextPos.y);
        });

        if (validDirections.length === 0) return ghost;

        // Simple AI: choose random valid direction, but prefer not to reverse
        const oppositeDirection = {
          'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
        }[ghost.direction] as Direction;

        const preferredDirections = validDirections.filter(dir => dir !== oppositeDirection);
        const chosenDirections = preferredDirections.length > 0 ? preferredDirections : validDirections;
        
        const newDirection = chosenDirections[Math.floor(Math.random() * chosenDirections.length)];
        const newPos = getNextPosition(ghost, newDirection);

        return {
          ...ghost,
          x: newPos.x,
          y: newPos.y,
          direction: newDirection
        };
      })
    );
  }, [isPlaying, isGameOver, maze]);

  const checkCollisions = useCallback(() => {
    // Check dot collection
    setMaze(prevMaze => {
      const newMaze = prevMaze.map(row => [...row]);
      const cell = newMaze[pacman.y][pacman.x];
      
      if (cell === 2) { // Regular dot
        newMaze[pacman.y][pacman.x] = 0;
        setScore(prev => prev + 10);
      } else if (cell === 3) { // Power pellet
        newMaze[pacman.y][pacman.x] = 0;
        setScore(prev => prev + 50);
        setPowerMode(true);
        setPowerModeTimer(200); // 200 game ticks
      }

      return newMaze;
    });

    // Check ghost collisions
    const ghostCollision = ghosts.some(ghost => 
      ghost.x === pacman.x && ghost.y === pacman.y
    );

    if (ghostCollision) {
      if (powerMode) {
        // Eat ghost
        setScore(prev => prev + 200);
        // Reset ghost position (simplified)
        setGhosts(prev => prev.map(ghost => 
          ghost.x === pacman.x && ghost.y === pacman.y 
            ? { ...ghost, x: 10, y: 9 }
            : ghost
        ));
      } else {
        // Lose life
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
          } else {
            // Reset positions
            setPacman({ x: 10, y: 15 });
            setGhosts([
              { x: 10, y: 9, direction: 'UP', color: '#FF0000' },
              { x: 9, y: 10, direction: 'LEFT', color: '#FFB8FF' },
              { x: 11, y: 10, direction: 'RIGHT', color: '#00FFFF' },
              { x: 10, y: 11, direction: 'DOWN', color: '#FFB852' }
            ]);
          }
          return newLives;
        });
      }
    }

    // Check win condition
    const dotsRemaining = maze.flat().filter(cell => cell === 2 || cell === 3).length;
    if (dotsRemaining === 0) {
      setIsPlaying(false);
      // Could add win state here
    }
  }, [pacman, ghosts, maze, powerMode]);

  const resetGame = () => {
    setPacman({ x: 10, y: 15 });
    setGhosts([
      { x: 10, y: 9, direction: 'UP', color: '#FF0000' },
      { x: 9, y: 10, direction: 'LEFT', color: '#FFB8FF' },
      { x: 11, y: 10, direction: 'RIGHT', color: '#00FFFF' },
      { x: 10, y: 11, direction: 'DOWN', color: '#FFB852' }
    ]);
    setMaze(MAZE.map(row => [...row]));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setLives(3);
    setIsPlaying(false);
    setIsGameOver(false);
    setPowerMode(false);
    setPowerModeTimer(0);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw maze
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = maze[y][x];
        const pixelX = x * CELL_SIZE;
        const pixelY = y * CELL_SIZE;

        if (cell === 1) { // Wall
          ctx.fillStyle = '#0000FF';
          ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
        } else if (cell === 2) { // Dot
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(pixelX + CELL_SIZE / 2, pixelY + CELL_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 3) { // Power pellet
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(pixelX + CELL_SIZE / 2, pixelY + CELL_SIZE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Pac-Man
    ctx.fillStyle = powerMode ? '#FFFF00' : '#FFFF00';
    ctx.beginPath();
    ctx.arc(
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw mouth
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    const mouthAngle = Math.PI / 3;
    const startAngle = direction === 'RIGHT' ? -mouthAngle/2 : 
                     direction === 'LEFT' ? Math.PI - mouthAngle/2 :
                     direction === 'UP' ? -Math.PI/2 - mouthAngle/2 :
                     Math.PI/2 - mouthAngle/2;
    ctx.arc(
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      startAngle,
      startAngle + mouthAngle
    );
    ctx.lineTo(
      pacman.x * CELL_SIZE + CELL_SIZE / 2,
      pacman.y * CELL_SIZE + CELL_SIZE / 2
    );
    ctx.fill();

    // Draw ghosts
    ghosts.forEach(ghost => {
      ctx.fillStyle = powerMode ? '#0000FF' : ghost.color;
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Ghost eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ghost.x * CELL_SIZE + 6, ghost.y * CELL_SIZE + 6, 3, 3);
      ctx.fillRect(ghost.x * CELL_SIZE + 11, ghost.y * CELL_SIZE + 6, 3, 3);
    });
  }, [pacman, ghosts, maze, direction, powerMode]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = setInterval(() => {
      movePacman();
      moveGhosts();
      checkCollisions();
      
      if (powerMode) {
        setPowerModeTimer(prev => {
          if (prev <= 1) {
            setPowerMode(false);
            return 0;
          }
          return prev - 1;
        });
      }
      
      draw();
    }, 200);

    return () => clearInterval(gameLoop);
  }, [isPlaying, movePacman, moveGhosts, checkCollisions, draw, powerMode]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setNextDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setNextDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          setNextDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Pac-Man</h2>
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-white">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-sm">Lives: {lives}</div>
            {powerMode && <div className="text-sm text-yellow-400">POWER MODE!</div>}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={isGameOver}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
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

      <div className="bg-black rounded-lg p-4 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-600 rounded"
        />
      </div>

      {isGameOver && (
        <div className="text-center bg-red-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">Game Over!</h3>
          <p>Final Score: {score}</p>
        </div>
      )}

      <div className="text-white/80 text-center">
        <p>Use arrow keys to move Pac-Man. Eat all dots while avoiding ghosts!</p>
      </div>
    </div>
  );
}

export default PacManGame;