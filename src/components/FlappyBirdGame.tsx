import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface Bird {
  x: number;
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 20;
const PIPE_WIDTH = 50;
const PIPE_GAP = 150;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const PIPE_SPEED = 2;

function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bird, setBird] = useState<Bird>({
    x: 100,
    y: CANVAS_HEIGHT / 2,
    velocity: 0
  });
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('flappybird-best');
    return saved ? parseInt(saved) : 0;
  });

  const generatePipe = (x: number): Pipe => {
    const topHeight = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 100) + 50;
    return {
      x,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      passed: false
    };
  };

  const resetGame = () => {
    setBird({
      x: 100,
      y: CANVAS_HEIGHT / 2,
      velocity: 0
    });
    setPipes([generatePipe(CANVAS_WIDTH)]);
    setScore(0);
    setIsPlaying(false);
    setIsGameOver(false);
  };

  const jump = useCallback(() => {
    if (isGameOver) return;
    
    if (!isPlaying) {
      setIsPlaying(true);
    }
    
    setBird(prev => ({
      ...prev,
      velocity: JUMP_FORCE
    }));
  }, [isPlaying, isGameOver]);

  const checkCollision = (bird: Bird, pipes: Pipe[]): boolean => {
    // Ground and ceiling collision
    if (bird.y <= 0 || bird.y >= CANVAS_HEIGHT - BIRD_SIZE) {
      return true;
    }

    // Pipe collision
    for (const pipe of pipes) {
      if (
        bird.x < pipe.x + PIPE_WIDTH &&
        bird.x + BIRD_SIZE > pipe.x &&
        (bird.y < pipe.topHeight || bird.y + BIRD_SIZE > pipe.bottomY)
      ) {
        return true;
      }
    }

    return false;
  };

  const updateGame = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    setBird(prevBird => {
      const newBird = {
        ...prevBird,
        velocity: prevBird.velocity + GRAVITY,
        y: prevBird.y + prevBird.velocity
      };

      return newBird;
    });

    setPipes(prevPipes => {
      let newPipes = prevPipes.map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED
      }));

      // Remove pipes that are off screen
      newPipes = newPipes.filter(pipe => pipe.x > -PIPE_WIDTH);

      // Add new pipe when needed
      if (newPipes.length === 0 || newPipes[newPipes.length - 1].x < CANVAS_WIDTH - 200) {
        newPipes.push(generatePipe(CANVAS_WIDTH));
      }

      // Check for scoring
      newPipes.forEach(pipe => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          pipe.passed = true;
          setScore(prev => prev + 1);
        }
      });

      // Check collision
      if (checkCollision(bird, newPipes)) {
        setIsGameOver(true);
        setIsPlaying(false);
        
        // Update best score
        if (score > bestScore) {
          setBestScore(score);
          localStorage.setItem('flappybird-best', score.toString());
        }
      }

      return newPipes;
    });
  }, [isPlaying, isGameOver, bird, score, bestScore]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
      const x = (i * 150 + Date.now() * 0.01) % (CANVAS_WIDTH + 50);
      ctx.beginPath();
      ctx.arc(x, 80 + i * 40, 20, 0, Math.PI * 2);
      ctx.arc(x + 20, 80 + i * 40, 25, 0, Math.PI * 2);
      ctx.arc(x + 40, 80 + i * 40, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw pipes
    ctx.fillStyle = '#228B22';
    pipes.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY);
      
      // Pipe caps
      ctx.fillStyle = '#32CD32';
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20);
      ctx.fillStyle = '#228B22';
    });

    // Draw bird
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE / 2 + 5, bird.y + BIRD_SIZE / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(bird.x + BIRD_SIZE, bird.y + BIRD_SIZE / 2);
    ctx.lineTo(bird.x + BIRD_SIZE + 8, bird.y + BIRD_SIZE / 2 - 3);
    ctx.lineTo(bird.x + BIRD_SIZE + 8, bird.y + BIRD_SIZE / 2 + 3);
    ctx.fill();

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 50);
    
    // Draw instructions
    if (!isPlaying && !isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Click or Press Space to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '16px Arial';
      ctx.fillText('Keep clicking to stay airborne!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }, [bird, pipes, score, isPlaying, isGameOver]);

  // Game loop
  useEffect(() => {
    const gameLoop = setInterval(() => {
      updateGame();
      draw();
    }, 16); // ~60 FPS

    return () => clearInterval(gameLoop);
  }, [updateGame, draw]);

  // Controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    const handleClick = () => {
      jump();
    };

    window.addEventListener('keydown', handleKeyPress);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
      }
    };
  }, [jump]);

  // Initialize game
  useEffect(() => {
    resetGame();
  }, []);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Flappy Bird</h2>
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-white">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-sm">Best: {bestScore}</div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={jump}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              disabled={isGameOver}
            >
              <Play className="w-4 h-4" />
              <span>Flap</span>
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
          className="border border-gray-600 rounded cursor-pointer"
        />
      </div>

      {isGameOver && (
        <div className="text-center bg-red-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">Game Over!</h3>
          <p>Score: {score}</p>
          {score === bestScore && score > 0 && (
            <p className="text-yellow-300">🎉 New Best Score!</p>
          )}
        </div>
      )}

      <div className="text-white/80 text-center">
        <p>Click or press spacebar to flap. Avoid the pipes!</p>
      </div>
    </div>
  );
}

export default FlappyBirdGame;