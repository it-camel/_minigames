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

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 6;
const BALL_SPEED = 5;

function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: BALL_SPEED,
    dy: BALL_SPEED
  });
  const [leftPaddle, setLeftPaddle] = useState<Paddle>({
    x: 20,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });
  const [rightPaddle, setRightPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH - 30,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<'single' | 'multi'>('single');
  const [keys, setKeys] = useState({
    w: false, s: false, // Left paddle (Player 1)
    up: false, down: false // Right paddle (Player 2)
  });

  const resetBall = useCallback(() => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED,
      dy: (Math.random() - 0.5) * BALL_SPEED
    });
  }, []);

  const resetGame = () => {
    setLeftScore(0);
    setRightScore(0);
    setIsPlaying(false);
    resetBall();
    setLeftPaddle(prev => ({ ...prev, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 }));
    setRightPaddle(prev => ({ ...prev, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 }));
  };

  const checkCollision = (ball: Ball, paddle: Paddle): boolean => {
    return ball.x < paddle.x + paddle.width &&
           ball.x + BALL_SIZE > paddle.x &&
           ball.y < paddle.y + paddle.height &&
           ball.y + BALL_SIZE > paddle.y;
  };

  const updateGame = useCallback(() => {
    if (!isPlaying) return;

    // Move paddles
    setLeftPaddle(prev => {
      let newY = prev.y;
      if (keys.w && newY > 0) newY -= PADDLE_SPEED;
      if (keys.s && newY < CANVAS_HEIGHT - PADDLE_HEIGHT) newY += PADDLE_SPEED;
      return { ...prev, y: newY };
    });

    if (gameMode === 'multi') {
      setRightPaddle(prev => {
        let newY = prev.y;
        if (keys.up && newY > 0) newY -= PADDLE_SPEED;
        if (keys.down && newY < CANVAS_HEIGHT - PADDLE_HEIGHT) newY += PADDLE_SPEED;
        return { ...prev, y: newY };
      });
    } else {
      // AI for single player
      setRightPaddle(prev => {
        const paddleCenter = prev.y + PADDLE_HEIGHT / 2;
        const ballCenter = ball.y + BALL_SIZE / 2;
        const diff = ballCenter - paddleCenter;
        
        let newY = prev.y;
        if (Math.abs(diff) > 5) {
          if (diff > 0 && newY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
            newY += PADDLE_SPEED * 0.8; // AI is slightly slower
          } else if (diff < 0 && newY > 0) {
            newY -= PADDLE_SPEED * 0.8;
          }
        }
        
        return { ...prev, y: newY };
      });
    }

    // Move ball
    setBall(prevBall => {
      let newBall = { ...prevBall };
      newBall.x += newBall.dx;
      newBall.y += newBall.dy;

      // Top and bottom wall collisions
      if (newBall.y <= 0 || newBall.y >= CANVAS_HEIGHT - BALL_SIZE) {
        newBall.dy = -newBall.dy;
      }

      // Paddle collisions
      if (checkCollision(newBall, leftPaddle) && newBall.dx < 0) {
        newBall.dx = -newBall.dx;
        // Add some angle based on where ball hits paddle
        const hitPos = (newBall.y - leftPaddle.y) / PADDLE_HEIGHT;
        newBall.dy = (hitPos - 0.5) * BALL_SPEED * 2;
      }

      if (checkCollision(newBall, rightPaddle) && newBall.dx > 0) {
        newBall.dx = -newBall.dx;
        const hitPos = (newBall.y - rightPaddle.y) / PADDLE_HEIGHT;
        newBall.dy = (hitPos - 0.5) * BALL_SPEED * 2;
      }

      // Scoring
      if (newBall.x <= 0) {
        setRightScore(prev => prev + 1);
        resetBall();
        return {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          dx: BALL_SPEED,
          dy: (Math.random() - 0.5) * BALL_SPEED
        };
      }

      if (newBall.x >= CANVAS_WIDTH) {
        setLeftScore(prev => prev + 1);
        resetBall();
        return {
          x: CANVAS_WIDTH / 2,
          y: CANVAS_HEIGHT / 2,
          dx: -BALL_SPEED,
          dy: (Math.random() - 0.5) * BALL_SPEED
        };
      }

      return newBall;
    });
  }, [isPlaying, keys, gameMode, leftPaddle, rightPaddle, ball, resetBall]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = '#FFFFFF';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball
    ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);

    // Draw scores
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(leftScore.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillText(rightScore.toString(), (CANVAS_WIDTH * 3) / 4, 60);

    // Draw game mode indicator
    ctx.font = '16px Arial';
    ctx.fillText(gameMode === 'single' ? 'vs AI' : 'vs Player', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }, [ball, leftPaddle, rightPaddle, leftScore, rightScore, gameMode]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateGame();
      draw();
    }, 16);

    return () => clearInterval(gameLoop);
  }, [updateGame, draw]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys(prev => ({ ...prev, w: true }));
          break;
        case 's':
          setKeys(prev => ({ ...prev, s: true }));
          break;
        case 'arrowup':
          e.preventDefault();
          setKeys(prev => ({ ...prev, up: true }));
          break;
        case 'arrowdown':
          e.preventDefault();
          setKeys(prev => ({ ...prev, down: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          setKeys(prev => ({ ...prev, w: false }));
          break;
        case 's':
          setKeys(prev => ({ ...prev, s: false }));
          break;
        case 'arrowup':
          setKeys(prev => ({ ...prev, up: false }));
          break;
        case 'arrowdown':
          setKeys(prev => ({ ...prev, down: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Pong</h2>
        
        {/* Game mode selector */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <span className="text-white">Mode:</span>
          <button
            onClick={() => setGameMode('single')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              gameMode === 'single'
                ? 'bg-blue-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            vs AI
          </button>
          <button
            onClick={() => setGameMode('multi')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              gameMode === 'multi'
                ? 'bg-blue-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            2 Players
          </button>
        </div>

        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-white">
            <div className="text-lg font-semibold">Player 1: {leftScore}</div>
            <div className="text-lg font-semibold">
              {gameMode === 'single' ? 'AI' : 'Player 2'}: {rightScore}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
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
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      <div className="text-white/80 text-center">
        <p>Player 1: W/S keys | {gameMode === 'multi' ? 'Player 2: Arrow keys' : 'AI controlled'}</p>
        <p>First to score wins the point!</p>
      </div>
    </div>
  );
}

export default PongGame;