import { useRef, useEffect, useState } from "react";
import './BreakoutGame.css';
import { levelConfigs } from '../levels';
import { PATTERNS } from '../levels/levelConfig';

const BreakoutGame = () => {
  const canvasRef = useRef(null);
  const nameInputRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [bricksRemaining, setBricksRemaining] = useState(0);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const keysPressed = useRef({});
  const brickHitSound = useRef(null);
  const paddleHitSound = useRef(null);
  const wallHitSound = useRef(null);
  const levelUpSound = useRef(null);
  const touchStartX = useRef(null);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [backgroundElements, setBackgroundElements] = useState([]);

  // Initialize game objects
  const gameState = useRef({
    paddle: null,
    ball: null,
    bricks: []
  });

  // Load leaderboard from localStorage
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem("breakoutLeaderboard");
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  // Initialize game
  useEffect(() => {
    // Initialize sounds
    brickHitSound.current = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3");
    paddleHitSound.current = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3");
    wallHitSound.current = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-casino-notification-211.mp3");
    levelUpSound.current = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3");

    resetGame();
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle touch events
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    if (!gameStarted) {
      setGameStarted(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;

    const touchX = e.touches[0].clientX;
    const diff = touchX - touchStartX.current;

    if (diff > 0) {
      keysPressed.current["ArrowRight"] = true;
      keysPressed.current["ArrowLeft"] = false;
    } else {
      keysPressed.current["ArrowLeft"] = true;
      keysPressed.current["ArrowRight"] = false;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    keysPressed.current["ArrowLeft"] = false;
    keysPressed.current["ArrowRight"] = false;
  };

  // Handle button press
  const handleButtonPress = (direction) => {
    if (direction === 'left') {
      keysPressed.current["ArrowLeft"] = true;
      keysPressed.current["ArrowRight"] = false;
    } else {
      keysPressed.current["ArrowRight"] = true;
      keysPressed.current["ArrowLeft"] = false;
    }
  };

  // Handle button release
  const handleButtonRelease = () => {
    keysPressed.current["ArrowLeft"] = false;
    keysPressed.current["ArrowRight"] = false;
  };

  const handleLevelSelect = (level) => {
    if (!playerName.trim()) {
      alert("Please enter your name to start the game!");
      return;
    }
    const levelNum = parseInt(level);
    setSelectedLevel(levelNum);
    setCurrentLevel(levelNum);
    setGameStarted(true);
    setGameOver(false);
    setShowLevelSelect(false);
    // Reset game after state updates
    setTimeout(() => {
      resetGame();
    }, 0);
  };

  const resetGame = () => {
    const canvas = canvasRef.current;
    const config = levelConfigs[currentLevel];

    gameState.current = {
      paddle: {
        width: 100,
        height: 12,
        speed: 8,
        y: canvas.height - 50,
        x: canvas.width / 2 - 50
      },
      ball: {
        radius: 8,
        x: canvas.width / 2,
        y: canvas.height - 70,
        dx: config.speed,
        dy: -config.speed,
        speed: config.speed
      },
      bricks: createBricks(canvas)
    };

    setGameOver(false);
    setScore(0);
  };

  const createBricks = (canvas) => {
    const config = levelConfigs[currentLevel];
    const brickRowCount = config.brickRowCount;
    const brickColumnCount = config.brickColumnCount;
    const brickWidth = config.brickWidth;
    const brickHeight = config.brickHeight;
    const brickPadding = config.brickPadding;
    const brickOffsetTop = config.brickOffsetTop;

    const totalBricksWidth = (brickWidth + brickPadding) * brickColumnCount - brickPadding;
    const brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;

    const bricks = [];
    let visibleBricks = 0;

    for (let r = 0; r < brickRowCount; r++) {
      bricks[r] = [];
      for (let c = 0; c < brickColumnCount; c++) {
        let visible = true;

        // Apply different patterns based on level
        switch (config.pattern) {
          case PATTERNS.STANDARD:
            visible = true;
            break;
          case PATTERNS.ALTERNATE:
            visible = (r + c) % 2 === 0;
            break;
          case PATTERNS.PYRAMID:
            visible = c >= r && c < brickColumnCount - r;
            break;
          case PATTERNS.DIAMOND:
            const center = Math.floor(brickColumnCount / 2);
            const distance = Math.abs(c - center) + Math.abs(r - Math.floor(brickRowCount / 2));
            visible = distance <= Math.floor(brickRowCount / 2);
            break;
          case PATTERNS.ZIGZAG:
            visible = (r + c) % 3 === 0;
            break;
          case PATTERNS.CHECKERBOARD:
            visible = (r % 2 === 0 && c % 2 === 0) || (r % 2 === 1 && c % 2 === 1);
            break;
          case PATTERNS.SPIRAL:
            const centerX = Math.floor(brickColumnCount / 2);
            const centerY = Math.floor(brickRowCount / 2);
            const dist = Math.sqrt(Math.pow(c - centerX, 2) + Math.pow(r - centerY, 2));
            visible = Math.floor(dist) % 2 === 0;
            break;
          case PATTERNS.CROSS:
            visible = c === Math.floor(brickColumnCount / 2) || r === Math.floor(brickRowCount / 2);
            break;
          case PATTERNS.DOUBLE:
            visible = (r % 2 === 0 && c % 2 === 0) || (r % 2 === 1 && c % 2 === 1) ||
              (c === Math.floor(brickColumnCount / 2) || r === Math.floor(brickRowCount / 2));
            break;
          case PATTERNS.CHALLENGE:
            visible = (r + c) % 2 === 0 && (c !== Math.floor(brickColumnCount / 2) || r !== Math.floor(brickRowCount / 2));
            break;
          default:
            visible = true;
        }

        if (visible) visibleBricks++;

        bricks[r][c] = {
          x: brickOffsetLeft + c * (brickWidth + brickPadding),
          y: brickOffsetTop + r * (brickHeight + brickPadding),
          width: brickWidth,
          height: brickHeight,
          visible: visible,
          color: config.colors[r % config.colors.length]
        };
      }
    }
    setBricksRemaining(visibleBricks);
    return bricks;
  };

  const drawPaddle = (ctx, paddle) => {
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, "#00CED1");
    gradient.addColorStop(1, "#008B8B");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6);
    ctx.fill();
  };

  const drawBall = (ctx, ball) => {
    ctx.fillStyle = "#00FFFF";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
    ctx.fill();
    ctx.closePath();
  };

  const drawBricks = (ctx, bricks) => {
    bricks.forEach((row, rowIndex) => row.forEach(brick => {
      if (brick.visible) {
        const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
        gradient.addColorStop(0, brick.color);
        gradient.addColorStop(1, adjustColor(brick.color, -20));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        ctx.fill();

        ctx.strokeStyle = adjustColor(brick.color, -40);
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    }));
  };

  const adjustColor = (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleKeyDown = (e) => {
    keysPressed.current[e.key] = true;
    if (!gameStarted && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "a" || e.key === "d")) {
      setGameStarted(true);
    }
    // Add Enter key functionality for game over
    if (gameOver && e.key === "Enter") {
      restartGame();
    }
  };

  const handleKeyUp = (e) => {
    keysPressed.current[e.key] = false;
  };

  const movePaddle = (paddle, canvas) => {
    if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) {
      paddle.x = Math.max(0, paddle.x - paddle.speed);
    }
    if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) {
      paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
    }
  };

  const detectCollisions = (ball, paddle, bricks, canvas) => {
    let hitBrick = false;
    bricks.forEach(row => row.forEach(brick => {
      if (brick.visible &&
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height) {

        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapLeft || minOverlap === overlapRight) {
          ball.dx *= -1;
          wallHitSound.current.currentTime = 0;
          wallHitSound.current.play();
        } else {
          ball.dy *= -1;
          wallHitSound.current.currentTime = 0;
          wallHitSound.current.play();
        }

        brick.visible = false;
        setBricksRemaining(prev => prev - 1);
        setScore(prev => prev + 10);
        hitBrick = true;
        checkLevelComplete();
      }
    }));

    if (hitBrick) {
      brickHitSound.current.currentTime = 0;
      brickHitSound.current.play();
    }

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx *= -1;
      wallHitSound.current.currentTime = 0;
      wallHitSound.current.play();
    }
    if (ball.y - ball.radius < 0) {
      ball.dy *= -1;
      wallHitSound.current.currentTime = 0;
      wallHitSound.current.play();
    }

    if (ball.y + ball.radius > canvas.height) {
      setGameOver(true);
      updateLeaderboard();
    }

    if (
      ball.y + ball.radius > paddle.y &&
      ball.y - ball.radius < paddle.y + paddle.height &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      const hitPosition = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle = hitPosition * Math.PI / 3;
      const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = Math.sin(angle) * currentSpeed;
      ball.dy = -Math.abs(Math.cos(angle) * currentSpeed);

      paddleHitSound.current.currentTime = 0;
      paddleHitSound.current.play();
    }
  };

  const checkLevelComplete = () => {
    if (bricksRemaining === 0) {
      setShowLevelComplete(true);
      levelUpSound.current.play();

      // Wait for 2 seconds before transitioning to next level
      setTimeout(() => {
        setShowLevelComplete(false);
        if (currentLevel < Object.keys(levelConfigs).length) {
          setCurrentLevel(prev => prev + 1);
          setIsTransitioning(true);
          setTimeout(() => {
            resetGame();
            setIsTransitioning(false);
          }, 500);
        } else {
          // Game completed
          setGameOver(true);
          updateLeaderboard();
        }
      }, 2000);
    }
  };

  const updateLeaderboard = () => {
    if (!playerName.trim()) return;

    const newEntry = {
      name: playerName,
      score: score,
      date: new Date().toLocaleDateString()
    };

    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Keep top 10 scores

    setLeaderboard(updatedLeaderboard);
    localStorage.setItem("breakoutLeaderboard", JSON.stringify(updatedLeaderboard));
  };

  const startGame = () => {
    if (!playerName.trim()) {
      alert("Please enter your name to start the game!");
      return;
    }
    setShowLevelSelect(true);
  };

  const restartGame = () => {
    resetGame();
    setGameStarted(true);
    setGameOver(false);
  };

  const goHome = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    resetGame();
  };

  // Initialize background elements
  useEffect(() => {
    const elements = [];
    // Add more elements with different types
    for (let i = 0; i < 40; i++) {
      const type = Math.random();
      elements.push({
        x: Math.random() * 900,
        y: Math.random() * 600,
        size: Math.random() * 15 + 5,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.1,
        type: type < 0.3 ? 'circle' :
          type < 0.5 ? 'square' :
            type < 0.7 ? 'triangle' :
              type < 0.85 ? 'star' : 'diamond',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        color: `rgba(0, 206, 209, ${Math.random() * 0.5 + 0.1})`,
        pulseSpeed: Math.random() * 0.02 + 0.01
      });
    }
    setBackgroundElements(elements);
  }, []);

  // Update background elements
  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      setBackgroundElements(prev => prev.map(element => ({
        ...element,
        y: element.y + element.speed,
        x: element.x + Math.sin(element.y / 50) * 2,
        rotation: element.rotation + element.rotationSpeed,
        opacity: Math.sin(Date.now() * element.pulseSpeed + element.x) * 0.2 + 0.3,
        size: element.size + Math.sin(Date.now() * 0.001) * 0.5
      })));
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted]);

  const drawBackground = (ctx) => {
    backgroundElements.forEach(element => {
      ctx.save();
      ctx.globalAlpha = element.opacity;
      ctx.fillStyle = element.color;
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 2;

      ctx.translate(element.x, element.y);
      ctx.rotate(element.rotation * Math.PI / 180);

      switch (element.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, element.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;

        case 'square':
          ctx.fillRect(-element.size / 2, -element.size / 2, element.size, element.size);
          ctx.strokeRect(-element.size / 2, -element.size / 2, element.size, element.size);
          break;

        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -element.size);
          ctx.lineTo(element.size, element.size);
          ctx.lineTo(-element.size, element.size);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'star':
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * element.size,
              -Math.sin((18 + i * 72) * Math.PI / 180) * element.size);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (element.size / 2),
              -Math.sin((54 + i * 72) * Math.PI / 180) * (element.size / 2));
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(0, -element.size);
          ctx.lineTo(element.size, 0);
          ctx.lineTo(0, element.size);
          ctx.lineTo(-element.size, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
      }

      ctx.restore();
    });
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { paddle, ball, bricks } = gameState.current;

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    let animationFrameId;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background elements
      drawBackground(ctx);

      movePaddle(paddle, canvas);
      drawBricks(ctx, bricks);
      drawPaddle(ctx, paddle);
      drawBall(ctx, ball);

      ball.x += ball.dx;
      ball.y += ball.dy;

      detectCollisions(ball, paddle, bricks, canvas);

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(update);
      }
    };

    update();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="game-container">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        padding: '20px'
      }}>
        {gameStarted && !gameOver && (
          <>
            <button
              className="home-button"
              onClick={goHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🏠</span> Home
            </button>
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              color: '#00CED1',
              fontSize: '1.2rem',
              animation: 'textPulse 2s infinite'
            }}>
              Level: {currentLevel}
            </div>
          </>
        )}

        {showLevelComplete && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '30px',
            borderRadius: '10px',
            border: '2px solid #00CED1',
            boxShadow: '0 0 30px #00CED1',
            animation: 'levelComplete 0.5s ease-out'
          }}>
            <h2 style={{
              color: '#00CED1',
              margin: '0 0 10px 0',
              fontSize: '2rem'
            }}>
              Level {currentLevel} Complete!
            </h2>
            <p style={{
              color: '#00FFFF',
              margin: '0',
              fontSize: '1.2rem'
            }}>
              {currentLevel < Object.keys(levelConfigs).length ? 'Get ready for the next level!' : 'Congratulations! You completed all levels!'}
            </p>
          </div>
        )}

        <h2 style={{
          margin: 0,
          color: '#00CED1',
          fontFamily: 'Arial, sans-serif',
          animation: 'textPulse 2s infinite',
          fontSize: isMobile ? '1.5rem' : '2rem'
        }}>Score: {score}</h2>

        {!gameStarted && !gameOver && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            textAlign: 'center',
            backgroundColor: 'rgba(10, 25, 47, 0.9)',
            padding: '30px',
            borderRadius: '10px',
            border: '2px solid #00CED1',
            boxShadow: '0 0 20px rgba(0, 206, 209, 0.5)',
            width: '90%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h2 style={{
              color: '#00CED1',
              margin: '0 0 20px 0',
              fontSize: '28px',
              animation: 'textPulse 2s infinite'
            }}>Breakout Game</h2>

            <div style={{
              width: '100%',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    setShowLevelSelect(true);
                  }
                }}
                style={{
                  padding: '12px',
                  width: '100%',
                  backgroundColor: 'rgba(0, 206, 209, 0.1)',
                  border: '1px solid #00CED1',
                  borderRadius: '4px',
                  color: '#00FFFF',
                  textAlign: 'center',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
              />
              {!playerName.trim() && (
                <p style={{
                  color: '#ff6b6b',
                  margin: '5px 0',
                  fontSize: '14px',
                  animation: 'textPulse 2s infinite'
                }}>
                  Please enter your name to start
                </p>
              )}
            </div>

            <div style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button
                onClick={startGame}
                disabled={!playerName.trim()}
                style={{
                  padding: '12px 20px',
                  backgroundColor: playerName.trim() ? 'rgba(0, 206, 209, 0.2)' : 'rgba(128, 128, 128, 0.2)',
                  color: playerName.trim() ? '#00CED1' : '#808080',
                  border: '2px solid ' + (playerName.trim() ? '#00CED1' : '#808080'),
                  borderRadius: '5px',
                  cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  transition: 'all 0.3s',
                  width: '100%',
                  opacity: playerName.trim() ? 1 : 0.7
                }}
              >
                Start Game
              </button>

              <button
                onClick={() => setShowLeaderboard(true)}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: '#00CED1',
                  border: '2px solid #00CED1',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.3s',
                  width: '100%'
                }}
              >
                View Leaderboard
              </button>
            </div>
          </div>
        )}

        {showLevelSelect && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            padding: '30px',
            borderRadius: '10px',
            border: '2px solid #00CED1',
            boxShadow: '0 0 30px #00CED1',
            width: '90%',
            maxWidth: '600px'
          }}>
            <h2 style={{
              color: '#00CED1',
              margin: '0 0 20px 0',
              fontSize: '24px',
              animation: 'textPulse 2s infinite'
            }}>
              Select Level
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {Object.entries(levelConfigs).map(([level, config]) => (
                <div
                  key={level}
                  className={`level-card ${selectedLevel === parseInt(level) ? 'selected' : ''}`}
                  onClick={() => handleLevelSelect(level)}
                  style={{
                    padding: '15px',
                    backgroundColor: 'rgba(0, 206, 209, 0.1)',
                    border: '2px solid ' + (selectedLevel === parseInt(level) ? '#00CED1' : 'rgba(0, 206, 209, 0.3)'),
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    transform: selectedLevel === parseInt(level) ? 'scale(1.05)' : 'scale(1)',
                    animation: 'levelSelect 0.3s ease-out'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: config.colors[0],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease'
                  }}>
                    {level}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#00CED1',
                    textAlign: 'center'
                  }}>
                    {config.pattern.replace(/_/g, ' ').toLowerCase().split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowLevelSelect(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#00CED1',
                  border: '2px solid #00CED1',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.3s'
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="game-over-container" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
            textAlign: 'center',
            backgroundColor: 'rgba(10, 25, 47, 0.95)',
            padding: '40px',
            borderRadius: '15px',
            border: '2px solid #00CED1',
            boxShadow: '0 0 30px rgba(0, 206, 209, 0.5)',
            width: '90%',
            maxWidth: '500px',
            animation: 'gameOverEntrance 0.8s ease-out',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 className="game-over-title" style={{
              color: '#00CED1',
              margin: '0 0 20px 0',
              fontSize: '32px',
              animation: 'textGlow 2s infinite',
              textShadow: '0 0 10px #00CED1'
            }}>Game Over!</h2>

            <div className="score-display" style={{
              margin: '20px 0',
              padding: '20px',
              backgroundColor: 'rgba(0, 206, 209, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(0, 206, 209, 0.3)',
              animation: 'scorePulse 2s infinite'
            }}>
              <p style={{
                color: '#00FFFF',
                margin: '0',
                fontSize: '24px',
                animation: 'textPulse 2s infinite'
              }}>Final Score: {score}</p>
              <p style={{
                color: '#00CED1',
                margin: '10px 0 0 0',
                fontSize: '18px',
                opacity: 0.8
              }}>Level Reached: {currentLevel}</p>
            </div>

            <p className="restart-hint" style={{
              color: '#00CED1',
              margin: '20px 0',
              fontSize: '16px',
              opacity: 0.8,
              animation: 'fadeInOut 2s infinite'
            }}>
              Press Enter to play again
            </p>

            <div className="game-over-buttons" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              marginTop: '20px'
            }}>
              <button
                onClick={restartGame}
                className="game-over-button"
                style={{
                  padding: '15px 25px',
                  backgroundColor: 'rgba(0, 206, 209, 0.2)',
                  color: '#00CED1',
                  border: '2px solid #00CED1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.3s',
                  width: '100%',
                  animation: 'buttonPulse 2s infinite'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Play Again
              </button>

              <button
                onClick={goHome}
                className="game-over-button"
                style={{
                  padding: '15px 25px',
                  backgroundColor: 'transparent',
                  color: '#00CED1',
                  border: '2px solid #00CED1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.3s',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span>🏠</span> Return to Home
              </button>

              <button
                onClick={() => setShowLeaderboard(true)}
                className="game-over-button"
                style={{
                  padding: '15px 25px',
                  backgroundColor: 'transparent',
                  color: '#00CED1',
                  border: '2px solid #00CED1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.3s',
                  width: '100%'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.1)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                View Leaderboard
              </button>
            </div>
          </div>
        )}

        {showLeaderboard && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
            textAlign: 'center',
            backgroundColor: 'rgba(10, 25, 47, 0.95)',
            padding: '30px',
            borderRadius: '10px',
            border: '2px solid #00CED1',
            boxShadow: '0 0 20px rgba(0, 206, 209, 0.5)',
            width: '80%',
            maxWidth: '400px'
          }}>
            <h2 style={{ color: '#00CED1', margin: '0 0 20px 0', fontSize: '28px' }}>Leaderboard</h2>

            {leaderboard.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                {leaderboard.map((entry, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(0, 206, 209, 0.3)',
                    color: '#00FFFF'
                  }}>
                    <span>{index + 1}. {entry.name}</span>
                    <span>{entry.score}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#00FFFF', margin: '0 0 20px 0' }}>No scores yet!</p>
            )}

            <button
              onClick={() => setShowLeaderboard(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: '#00CED1',
                border: '2px solid #00CED1',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s',
                width: '100%'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Close
            </button>
          </div>
        )}

        <div style={{
          position: 'relative',
          opacity: isTransitioning ? 0.5 : 1,
          transition: 'opacity 0.5s ease-in-out'
        }}>
          <canvas
            ref={canvasRef}
            width={900}
            height={600}
            style={{
              border: "2px solid #00CED1",
              borderRadius: '8px',
              backgroundColor: '#0a192f',
              boxShadow: '0 0 20px rgba(0, 206, 209, 0.3)',
              maxWidth: '100%',
              height: 'auto',
              touchAction: 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        <div className="mobile-controls">
          <button
            className="control-button"
            onTouchStart={() => handleButtonPress('left')}
            onTouchEnd={handleButtonRelease}
            onMouseDown={() => handleButtonPress('left')}
            onMouseUp={handleButtonRelease}
            onMouseLeave={handleButtonRelease}
          >
            ←
          </button>
          <button
            className="control-button"
            onTouchStart={() => handleButtonPress('right')}
            onTouchEnd={handleButtonRelease}
            onMouseDown={() => handleButtonPress('right')}
            onMouseUp={handleButtonRelease}
            onMouseLeave={handleButtonRelease}
          >
            →
          </button>
        </div>

        <div style={{
          color: '#00CED1',
          textAlign: 'center',
          animation: 'textPulse 2s infinite'
        }}>
          {isMobile ? (
            <p style={{
              margin: '5px 0',
              fontSize: '14px',
              animation: 'textPulse 2s infinite'
            }}>Use the buttons below or swipe to control the paddle</p>
          ) : (
            <p style={{
              margin: '5px 0',
              fontSize: '14px',
              animation: 'textPulse 2s infinite'
            }}>Use ← → arrow keys or A/D to control the paddle</p>
          )}
          <p style={{
            margin: '5px 0',
            fontSize: '12px',
            opacity: 0.7,
            animation: 'textPulse 2s infinite'
          }}>Destroy all bricks to win!</p>
        </div>
      </div>
    </div>
  );
};

export default BreakoutGame;