import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  destroyed: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const BALL_SIZE = 10;
const BRICK_ROWS = 8;
const BRICK_COLS = 10;
const BRICK_WIDTH = CANVAS_WIDTH / BRICK_COLS;
const BRICK_HEIGHT = 20;

function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    dx: 5,
    dy: -5
  });
  const [paddle, setPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  const initializeBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * BRICK_WIDTH,
          y: row * BRICK_HEIGHT + 50,
          width: BRICK_WIDTH - 2,
          height: BRICK_HEIGHT - 2,
          color: colors[row % colors.length],
          destroyed: false
        });
      }
    }
    setBricks(newBricks);
  }, []);

  const resetGame = () => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      dx: 5,
      dy: -5
    });
    setPaddle({
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 30,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    });
    setScore(0);
    setLives(3);
    setIsPlaying(false);
    setIsGameOver(false);
    setHasWon(false);
    initializeBricks();
  };

  const checkCollision = (rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const updateGame = useCallback(() => {
    if (!isPlaying || isGameOver || hasWon) return;

    setBall(prevBall => {
      let newBall = { ...prevBall };
      
      // Move ball
      newBall.x += newBall.dx;
      newBall.y += newBall.dy;

      // Wall collisions
      if (newBall.x <= 0 || newBall.x >= CANVAS_WIDTH - BALL_SIZE) {
        newBall.dx = -newBall.dx;
      }
      if (newBall.y <= 0) {
        newBall.dy = -newBall.dy;
      }

      // Bottom wall (lose life)
      if (newBall.y >= CANVAS_HEIGHT) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setIsGameOver(true);
            setIsPlaying(false);
          } else {
            // Reset ball position
            newBall = {
              x: CANVAS_WIDTH / 2,
              y: CANVAS_HEIGHT - 50,
              dx: 5,
              dy: -5
            };
          }
          return newLives;
        });
      }

      // Paddle collision
      const ballRect = { x: newBall.x, y: newBall.y, width: BALL_SIZE, height: BALL_SIZE };
      const paddleRect = { x: paddle.x, y: paddle.y, width: paddle.width, height: paddle.height };
      
      if (checkCollision(ballRect, paddleRect) && newBall.dy > 0) {
        newBall.dy = -newBall.dy;
        // Add some angle based on where ball hits paddle
        const hitPos = (newBall.x - paddle.x) / paddle.width;
        newBall.dx = 8 * (hitPos - 0.5);
      }

      // Brick collisions
      setBricks(prevBricks => {
        const newBricks = [...prevBricks];
        let brickHit = false;
        
        for (let i = 0; i < newBricks.length; i++) {
          if (!newBricks[i].destroyed && checkCollision(ballRect, newBricks[i])) {
            newBricks[i].destroyed = true;
            brickHit = true;
            setScore(prev => prev + 10);
            break;
          }
        }
        
        if (brickHit) {
          newBall.dy = -newBall.dy;
        }

        // Check win condition
        if (newBricks.every(brick => brick.destroyed)) {
          setHasWon(true);
          setIsPlaying(false);
        }
        
        return newBricks;
      });

      return newBall;
    });
  }, [isPlaying, isGameOver, hasWon, paddle]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);

    // Draw paddle
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Draw bricks
    bricks.forEach(brick => {
      if (!brick.destroyed) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Add border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });
  }, [ball, paddle, bricks]);

  // Mouse control for paddle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPlaying) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      setPaddle(prev => ({
        ...prev,
        x: Math.max(0, Math.min(CANVAS_WIDTH - prev.width, mouseX - prev.width / 2))
      }));
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      return () => canvas.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isPlaying]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateGame();
      draw();
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [updateGame, draw]);

  // Initialize game
  useEffect(() => {
    initializeBricks();
  }, [initializeBricks]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Breakout</h2>
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-white">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-sm">Lives: {lives}</div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={isGameOver || hasWon}
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
          className="border border-gray-600 rounded cursor-none"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {hasWon && (
        <div className="text-center bg-green-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">You Win!</h3>
          <p>Final Score: {score}</p>
        </div>
      )}

      {isGameOver && (
        <div className="text-center bg-red-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">Game Over!</h3>
          <p>Final Score: {score}</p>
        </div>
      )}

      <div className="text-white/80 text-center">
        <p>Move your mouse to control the paddle. Break all the bricks to win!</p>
      </div>
    </div>
  );
}

export default BreakoutGame;