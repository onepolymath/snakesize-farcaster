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

// Move colors here - outside the component
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

  // Remove this line:
  // const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const generateFood = useCallback(() => {
    const newFood = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      newFood.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        color: COLORS[Math.floor(Math.random() * COLORS.length)], // Change colors to COLORS
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
      const angle = Math.random() * Math.PI * 2;
      const body = [];
      for (let j = 0; j < INITIAL_LENGTH; j++) {
        body.push({
          x: startX - Math.cos(angle) * CELL_SIZE * j,
          y: startY - Math.sin(angle) * CELL_SIZE * j
        });
      }
      newBots.push({
        id: i,
        name: botNames[i % botNames.length],
        body,
        angle,
        color: COLORS[i % COLORS.length], // Change colors to COLORS
        score: INITIAL_LENGTH,
        alive: true
      });
    }
    return newBots;
  }, []);

  // ... rest of the code continues here