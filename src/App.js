import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, RotateCcw, User, Zap } from 'lucide-react';

const WORLD_SIZE = 3000;
const CELL_SIZE = 10;
const INITIAL_LENGTH = 10;
const SNAKE_SPEED = 3;
const FOOD_COUNT = 300;
const BOT_COUNT = 15;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const SnakesizeGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [snake, setSnake] = useState([]);
  const [angle, setAngle] = useState(0);
  const [food, setFood] = useState([]);
  const [bots, setBots] = useState([]);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [mousePos, setMousePos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  const generateFood = useCallback(() => {
    const newFood = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      newFood.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4
      });
    }
    return newFood;
  }, []);

  const generateBots = useCallback(() => {
    const botNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Zeta', 'Theta', 'Sigma', 'Kappa', 'Lambda', 'Epsilon', 'Rho', 'Tau', 'Phi', 'Psi'];
    const newBots = [];
    for (let i = 0; i < BOT_COUNT; i++) {
      const startX = Math.random() * WORLD_SIZE;
      const startY = Math.random() * WORLD_SIZE;
      const botAngle = Math.random() * Math.PI * 2;
      const body = [];
      for (let j = 0; j < INITIAL_LENGTH; j++) {
        body.push({
          x: startX - Math.cos(botAngle) * CELL_SIZE * j,
          y: startY - Math.sin(botAngle) * CELL_SIZE * j
        });
      }
      newBots.push({
        id: i,
        name: botNames[i % botNames.length],
        body,
        angle: botAngle,
        color: COLORS[i % COLORS.length],
        score: INITIAL_LENGTH,
        alive: true
      });
    }
    return newBots;
  }, []);

  const checkSnakeCollision = useCallback((head, otherBodies) => {
    for (let snakeBody of otherBodies) {
      for (let segment of snakeBody) {
        const dx = head.x - segment.x;
        const dy = head.y - segment.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CELL_SIZE) {
          return true;
        }
      }
    }
    return false;
  }, []);

  const spawnFoodFromSnake = useCallback((snakeBody) => {
    const newFood = [];
    for (let i = 0; i < snakeBody.length; i += 3) {
      const segment = snakeBody[i];
      newFood.push({
        x: segment.x + (Math.random() - 0.5) * 20,
        y: segment.y + (Math.random() - 0.5) * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5
      });
    }
    return newFood;
  }, []);

  const startGame = () => {
    if (!playerName.trim()) return;
    
    const startX = WORLD_SIZE / 2;
    const startY = WORLD_SIZE / 2;
    const initialAngle = Math.random() * Math.PI * 2;
    const initialBody = [];
    
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      initialBody.push({
        x: startX - Math.cos(initialAngle) * CELL_SIZE * i,
        y: startY - Math.sin(initialAngle) * CELL_SIZE * i
      });
    }
    
    setGameState('playing');
    setSnake(initialBody);
    setAngle(initialAngle);
    setScore(INITIAL_LENGTH);
    setFood(generateFood());
    setBots(generateBots());
    setCamera({ x: startX - CANVAS_WIDTH / 2, y: startY - CANVAS_HEIGHT / 2 });
    lastUpdateRef.current = Date.now();
  };

  const gameOver = useCallback(() => {
    setGameState('gameover');
    
    const newEntry = { name: playerName, score };
    const currentLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    setLeaderboard(currentLeaderboard);

    try {
      localStorage.setItem('snakesize-leaderboard', JSON.stringify(currentLeaderboard));
    } catch (error) {
      console.log('Could not save to localStorage:', error);
    }
  }, [playerName, score, leaderboard]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('snakesize-leaderboard');
      if (saved) {
        setLeaderboard(JSON.parse(saved));
      }
    } catch (error) {
      console.log('No existing leaderboard found');
    }
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      setMousePos({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 16.67;
      lastUpdateRef.current = now;

      setSnake(prevSnake => {
        if (prevSnake.length === 0) return prevSnake;
        
        const head = prevSnake[0];
        const dx = mousePos.x - CANVAS_WIDTH / 2;
        const dy = mousePos.y - CANVAS_HEIGHT / 2;
        const targetAngle = Math.atan2(dy, dx);
        
        setAngle(targetAngle);

        const newHead = {
          x: head.x + Math.cos(targetAngle) * SNAKE_SPEED * delta,
          y: head.y + Math.sin(targetAngle) * SNAKE_SPEED * delta
        };

        if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
          gameOver();
          return prevSnake;
        }

        const otherBodies = bots.filter(b => b.alive).map(b => b.body);
        if (checkSnakeCollision(newHead, otherBodies)) {
          gameOver();
          return prevSnake;
        }

        const newSnake = [newHead];
        for (let i = 0; i < prevSnake.length - 1; i++) {
          const curr = prevSnake[i];
          const next = prevSnake[i + 1];
          const dx2 = curr.x - next.x;
          const dy2 = curr.y - next.y;
          const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          
          if (dist > 0) {
            const ratio = CELL_SIZE / dist;
            newSnake.push({
              x: curr.x - dx2 * ratio,
              y: curr.y - dy2 * ratio
            });
          } else {
            newSnake.push({ ...next });
          }
        }

        setFood(prevFood => {
          let updatedFood = [...prevFood];
          let foodEaten = 0;
          
          updatedFood = updatedFood.filter(f => {
            const dx3 = newHead.x - f.x;
            const dy3 = newHead.y - f.y;
            const dist = Math.sqrt(dx3 * dx3 + dy3 * dy3);
            if (dist < CELL_SIZE) {
              foodEaten++;
              return false;
            }
            return true;
          });

          if (foodEaten > 0) {
            setScore(s => s + foodEaten);
            for (let i = 0; i < foodEaten; i++) {
              newSnake.push({ ...newSnake[newSnake.length - 1] });
            }
            
            for (let i = 0; i < foodEaten; i++) {
              updatedFood.push({
                x: Math.random() * WORLD_SIZE,
                y: Math.random() * WORLD_SIZE,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 4
              });
            }
          }

          return updatedFood;
        });

        setCamera({ x: newHead.x - CANVAS_WIDTH / 2, y: newHead.y - CANVAS_HEIGHT / 2 });

        return newSnake;
      });

      setBots(prevBots => {
        return prevBots.map(bot => {
          if (!bot.alive) return bot;

          const head = bot.body[0];
          
          const nearFood = food.filter(f => {
            const dx = f.x - head.x;
            const dy = f.y - head.y;
            return Math.sqrt(dx * dx + dy * dy) < 200;
          });

          let targetAngle = bot.angle;
          if (nearFood.length > 0 && Math.random() < 0.3) {
            const target = nearFood[0];
            targetAngle = Math.atan2(target.y - head.y, target.x - head.x);
          } else if (Math.random() < 0.02) {
            targetAngle = bot.angle + (Math.random() - 0.5) * 0.5;
          }

          const angleDiff = targetAngle - bot.angle;
          const adjustedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
          const newAngle = bot.angle + adjustedAngleDiff * 0.1;

          const newHead = {
            x: head.x + Math.cos(newAngle) * SNAKE_SPEED * delta,
            y: head.y + Math.sin(newAngle) * SNAKE_SPEED * delta
          };

          if (newHead.x < 0 || newHead.x > WORLD_SIZE || newHead.y < 0 || newHead.y > WORLD_SIZE) {
            setFood(f => [...f, ...spawnFoodFromSnake(bot.body)]);
            return { ...bot, alive: false };
          }

          const otherBodies = [snake, ...prevBots.filter(b => b.id !== bot.id && b.alive).map(b => b.body)];
          if (checkSnakeCollision(newHead, otherBodies)) {
            setFood(f => [...f, ...spawnFoodFromSnake(bot.body)]);
            return { ...bot, alive: false };
          }

          const newBody = [newHead];
          for (let i = 0; i < bot.body.length - 1; i++) {
            const curr = bot.body[i];
            const next = bot.body[i + 1];
            const dx = curr.x - next.x;
            const dy = curr.y - next.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
              const ratio = CELL_SIZE / dist;
              newBody.push({
                x: curr.x - dx * ratio,
                y: curr.y - dy * ratio
              });
            } else {
              newBody.push({ ...next });
            }
          }

          let newScore = bot.score;
          setFood(prevFood => {
            let updatedFood = [...prevFood];
            let foodEaten = 0;
            
            updatedFood = updatedFood.filter(f => {
              const dx = newHead.x - f.x;
              const dy = newHead.y - f.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < CELL_SIZE) {
                foodEaten++;
                return false;
              }
              return true;
            });

            if (foodEaten > 0) {
              newScore += foodEaten;
              for (let i = 0; i < foodEaten; i++) {
                newBody.push({ ...newBody[newBody.length - 1] });
                updatedFood.push({
                  x: Math.random() * WORLD_SIZE,
                  y: Math.random() * WORLD_SIZE,
                  color: COLORS[Math.floor(Math.random() * COLORS.length)],
                  size: 4
                });
              }
            }

            return updatedFood;
          });

          return { ...bot, body: newBody, angle: newAngle, score: newScore };
        });
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, mousePos, food, bots, snake, checkSnakeCollision, gameOver, spawnFoodFromSnake]);

  useEffect(() => {
    if (!canvasRef.current || gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 50;
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;
    
    for (let x = startX; x < camera.x + CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x - camera.x, 0);
      ctx.lineTo(x - camera.x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = startY; y < camera.y + CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y - camera.y);
      ctx.lineTo(CANVAS_WIDTH, y - camera.y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(-camera.x, -camera.y, WORLD_SIZE, WORLD_SIZE);

    food.forEach(f => {
      const screenX = f.x - camera.x;
      const screenY = f.y - camera.y;
      
      if (screenX > -20 && screenX < CANVAS_WIDTH + 20 && screenY > -20 && screenY < CANVAS_HEIGHT + 20) {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    bots.forEach(bot => {
      if (!bot.alive) return;
      
      bot.body.forEach((segment, index) => {
        const screenX = segment.x - camera.x;
        const screenY = segment.y - camera.y;
        
        if (screenX > -20 && screenX < CANVAS_WIDTH + 20 && screenY > -20 && screenY < CANVAS_HEIGHT + 20) {
          ctx.fillStyle = index === 0 ? bot.color : bot.color + 'CC';
          ctx.beginPath();
          ctx.arc(screenX, screenY, CELL_SIZE / 2, 0, Math.PI * 2);
          ctx.fill();
          
          if (index === 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(bot.name, screenX, screenY - 15);
          }
        }
      });
    });

    snake.forEach((segment, index) => {
      const screenX = segment.x - camera.x;
      const screenY = segment.y - camera.y;
      
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, CELL_SIZE / 2);
      gradient.addColorStop(0, index === 0 ? '#10b981' : '#34d399');
      gradient.addColorStop(1, index === 0 ? '#059669' : '#10b981');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, CELL_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      
      if (index === 0) {
        ctx.fillStyle = '#000';
        const eyeOffset = 3;
        ctx.beginPath();
        ctx.arc(screenX + Math.cos(angle + 0.3) * eyeOffset, screenY + Math.sin(angle + 0.3) * eyeOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + Math.cos(angle - 0.3) * eyeOffset, screenY + Math.sin(angle - 0.3) * eyeOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(playerName, screenX, screenY - 15);
      }
    });
  });

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full border border-purple-500">
          <h1 className="text-6xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Snakesize.io
          </h1>
          <p className="text-center text-gray-400 mb-6">Eat. Grow. Dominate.</p>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Enter your name:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your snake name"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
              maxLength={15}
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
            />
          </div>

          <button
            onClick={startGame}
            disabled={!playerName.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-bold text-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Play Now
          </button>

          {leaderboard.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={24} />
                Global Leaderboard
              </h2>
              <div className="bg-gray-800 rounded-lg p-4">
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <span className="text-gray-300">
                      <span className="font-bold text-yellow-500">#{index + 1}</span> {entry.name}
                    </span>
                    <span className="text-green-400 font-bold">{entry.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-gray-400 text-sm space-y-1">
            <p className="font-bold text-white mb-2">How to Play:</p>
            <p>• Move your mouse to control direction</p>
            <p>• Eat colored dots to grow longer</p>
            <p>• Make other snakes crash into you</p>
            <p>• Avoid hitting other snakes or walls</p>
            <p>• Become the biggest snake!</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    const playerRank = leaderboard.findIndex(e => e.name === playerName && e.score === score) + 1;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-8 max-w-md w-full border border-red-500">
          <h1 className="text-4xl font-bold text-center mb-4 text-red-500">You Died!</h1>
          <div className="text-center mb-6">
            <p className="text-gray-300 text-lg mb-2">Final Length:</p>
            <p className="text-5xl font-bold text-green-400">{score}</p>
            {playerRank > 0 && playerRank <= 10 && (
              <p className="text-yellow-500 mt-2 text-xl">#{playerRank} on Global Leaderboard!</p>
            )}
          </div>

          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={24} />
                Top Players
              </h2>
              <div className="bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center py-2 border-b border-gray-700 last:border-0 ${
                      entry.name === playerName && entry.score === score ? 'bg-green-900/30 px-2 rounded' : ''
                    }`}
                  >
                    <span className="text-gray-300">
                      <span className={`font-bold ${index < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                        #{index + 1}
                      </span> {entry.name}
                    </span>
                    <span className="text-green-400 font-bold">{entry.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setGameState('menu')}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-bold text-lg hover:from-green-600 hover:to-blue-600 flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const aliveSnakes = [{ name: playerName, score }, ...bots.filter(b => b.alive).map(b => ({ name: b.name, score: b.score }))]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex gap-4 items-center flex-wrap justify-center">
        <div className="bg-gray-900 px-6 py-3 rounded-lg border border-purple-500">
          <span className="text-gray-400 mr-2">Length:</span>
          <span className="text-green-400 font-bold text-2xl">{score}</span>
        </div>
        <div className="bg-gray-900 px-6 py-3 rounded-lg border border-purple-500 max-w-xs">
          <span className="text-gray-400 mr-2"><User size={16} className="inline" /></span>
          <span className="text-white font-bold truncate">{playerName}</span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg shadow-2xl border border-purple-500 relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-700 cursor-none"
        />
        <div className="absolute top-4 right-4 bg-gray-900/90 rounded-lg p-3 border border-purple-500 min-w-[200px]">
          <h3 className="text-white font-bold mb-2 flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" />
            Live Ranks
          </h3>
          <div className="space-y-1 text-sm">
            {aliveSnakes.map((s, idx) => (
              <div 
                key={idx} 
                className={`flex justify-between ${s.name === playerName ? 'text-green-400 font-bold' : 'text-gray-400'}`}
              >
                <span className="truncate mr-2">#{idx + 1} {s.name}</span>
                <span>{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-gray-300 text-sm text-center">
        <p>Move your mouse to control • Eat dots to grow • Avoid other snakes</p>
      </div>
    </div>
  );
};

export default SnakesizeGame;