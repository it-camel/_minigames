import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface Bullet {
  x: number;
  y: number;
  speed: number;
}

interface Invader {
  x: number;
  y: number;
  alive: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const INVADER_WIDTH = 30;
const INVADER_HEIGHT = 20;
const INVADER_ROWS = 5;
const INVADER_COLS = 10;

function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<Position>({ x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 50 });
  const [playerBullets, setPlayerBullets] = useState<Bullet[]>([]);
  const [invaderBullets, setInvaderBullets] = useState<Bullet[]>([]);
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [invaderDirection, setInvaderDirection] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [wave, setWave] = useState(1);
  const [keys, setKeys] = useState({ left: false, right: false, space: false });

  const initializeInvaders = useCallback(() => {
    const newInvaders: Invader[] = [];
    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        newInvaders.push({
          x: col * (INVADER_WIDTH + 10) + 100,
          y: row * (INVADER_HEIGHT + 10) + 50,
          alive: true
        });
      }
    }
    setInvaders(newInvaders);
  }, []);

  const resetGame = () => {
    setPlayer({ x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 50 });
    setPlayerBullets([]);
    setInvaderBullets([]);
    setInvaderDirection(1);
    setScore(0);
    setLives(3);
    setIsPlaying(false);
    setIsGameOver(false);
    setWave(1);
    initializeInvaders();
  };

  const checkCollisions = useCallback(() => {
    // Player bullets vs invaders
    setPlayerBullets(prevBullets => {
      const remainingBullets: Bullet[] = [];
      
      prevBullets.forEach(bullet => {
        let hit = false;
        setInvaders(prevInvaders => 
          prevInvaders.map(invader => {
            if (invader.alive && 
                bullet.x < invader.x + INVADER_WIDTH &&
                bullet.x + 5 > invader.x &&
                bullet.y < invader.y + INVADER_HEIGHT &&
                bullet.y + 10 > invader.y) {
              hit = true;
              setScore(prev => prev + 10);
              return { ...invader, alive: false };
            }
            return invader;
          })
        );
        
        if (!hit) {
          remainingBullets.push(bullet);
        }
      });
      
      return remainingBullets;
    });

    // Invader bullets vs player
    setInvaderBullets(prevBullets => {
      const remainingBullets: Bullet[] = [];
      
      prevBullets.forEach(bullet => {
        if (bullet.x < player.x + PLAYER_WIDTH &&
            bullet.x + 5 > player.x &&
            bullet.y < player.y + PLAYER_HEIGHT &&
            bullet.y + 10 > player.y) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setIsGameOver(true);
              setIsPlaying(false);
            }
            return newLives;
          });
        } else {
          remainingBullets.push(bullet);
        }
      });
      
      return remainingBullets;
    });

    // Check if all invaders are destroyed
    const aliveInvaders = invaders.filter(invader => invader.alive);
    if (aliveInvaders.length === 0) {
      setWave(prev => prev + 1);
      initializeInvaders();
    }

    // Check if invaders reached the bottom
    const lowestInvader = aliveInvaders.reduce((lowest, invader) => 
      invader.y > lowest ? invader.y : lowest, 0);
    
    if (lowestInvader > CANVAS_HEIGHT - 100) {
      setIsGameOver(true);
      setIsPlaying(false);
    }
  }, [player, invaders, initializeInvaders]);

  const updateGame = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    // Move player
    setPlayer(prev => {
      let newX = prev.x;
      if (keys.left && newX > 0) newX -= 5;
      if (keys.right && newX < CANVAS_WIDTH - PLAYER_WIDTH) newX += 5;
      return { ...prev, x: newX };
    });

    // Player shooting
    if (keys.space) {
      setPlayerBullets(prev => {
        const lastBullet = prev[prev.length - 1];
        if (!lastBullet || lastBullet.y < player.y - 50) {
          return [...prev, { x: player.x + PLAYER_WIDTH / 2, y: player.y, speed: -8 }];
        }
        return prev;
      });
    }

    // Move bullets
    setPlayerBullets(prev => 
      prev.map(bullet => ({ ...bullet, y: bullet.y + bullet.speed }))
          .filter(bullet => bullet.y > 0)
    );

    setInvaderBullets(prev => 
      prev.map(bullet => ({ ...bullet, y: bullet.y + bullet.speed }))
          .filter(bullet => bullet.y < CANVAS_HEIGHT)
    );

    // Move invaders
    setInvaders(prev => {
      const aliveInvaders = prev.filter(invader => invader.alive);
      if (aliveInvaders.length === 0) return prev;

      const leftmost = Math.min(...aliveInvaders.map(inv => inv.x));
      const rightmost = Math.max(...aliveInvaders.map(inv => inv.x + INVADER_WIDTH));

      let newDirection = invaderDirection;
      let moveDown = false;

      if (rightmost >= CANVAS_WIDTH - 10 && invaderDirection > 0) {
        newDirection = -1;
        moveDown = true;
      } else if (leftmost <= 10 && invaderDirection < 0) {
        newDirection = 1;
        moveDown = true;
      }

      setInvaderDirection(newDirection);

      return prev.map(invader => {
        if (!invader.alive) return invader;
        
        return {
          ...invader,
          x: invader.x + (moveDown ? 0 : newDirection * 2),
          y: invader.y + (moveDown ? 20 : 0)
        };
      });
    });

    // Invader shooting
    if (Math.random() < 0.02) {
      const aliveInvaders = invaders.filter(invader => invader.alive);
      if (aliveInvaders.length > 0) {
        const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        setInvaderBullets(prev => [
          ...prev,
          { x: shooter.x + INVADER_WIDTH / 2, y: shooter.y + INVADER_HEIGHT, speed: 4 }
        ]);
      }
    }

    checkCollisions();
  }, [isPlaying, isGameOver, keys, player, invaders, invaderDirection, checkCollisions]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = (i * 73) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 1, 1);
    }

    // Draw player
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    
    // Player cannon
    ctx.fillRect(player.x + PLAYER_WIDTH / 2 - 2, player.y - 10, 4, 10);

    // Draw invaders
    invaders.forEach(invader => {
      if (invader.alive) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(invader.x, invader.y, INVADER_WIDTH, INVADER_HEIGHT);
        
        // Simple invader design
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(invader.x + 5, invader.y + 5, 5, 5);
        ctx.fillRect(invader.x + 20, invader.y + 5, 5, 5);
      }
    });

    // Draw bullets
    ctx.fillStyle = '#FFFF00';
    playerBullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, 3, 10);
    });

    ctx.fillStyle = '#FF0000';
    invaderBullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, 3, 10);
    });
  }, [player, invaders, playerBullets, invaderBullets]);

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
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setKeys(prev => ({ ...prev, left: true }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setKeys(prev => ({ ...prev, right: true }));
          break;
        case ' ':
          e.preventDefault();
          setKeys(prev => ({ ...prev, space: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setKeys(prev => ({ ...prev, left: false }));
          break;
        case 'ArrowRight':
          setKeys(prev => ({ ...prev, right: false }));
          break;
        case ' ':
          setKeys(prev => ({ ...prev, space: false }));
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

  // Initialize game
  useEffect(() => {
    initializeInvaders();
  }, [initializeInvaders]);

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Space Invaders</h2>
        <div className="flex items-center justify-center space-x-8 mb-4">
          <div className="text-white">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-sm">Lives: {lives}</div>
            <div className="text-sm">Wave: {wave}</div>
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
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {isGameOver && (
        <div className="text-center bg-red-500 text-white px-8 py-4 rounded-lg">
          <h3 className="text-xl font-bold">Game Over!</h3>
          <p>Final Score: {score}</p>
          <p>Wave Reached: {wave}</p>
        </div>
      )}

      <div className="text-white/80 text-center">
        <p>Use arrow keys to move, spacebar to shoot. Defend Earth from the alien invasion!</p>
      </div>
    </div>
  );
}

export default SpaceInvadersGame;