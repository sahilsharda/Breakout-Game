import { useRef, useEffect, useState } from "react";

const BreakoutGame = () => {
  const canvasRef = useRef(null);
  const nameInputRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const keysPressed = useRef({});
  const brickHitSound = useRef(null);
  const paddleHitSound = useRef(null);
  const wallHitSound = useRef(null);

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

    resetGame();
  }, []);

  const resetGame = () => {
    const canvas = canvasRef.current;
    
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
        dx: 4,
        dy: -4,
        speed: 4
      },
      bricks: createBricks(canvas)
    };

    setGameOver(false);
    setScore(0);
  };

  const createBricks = (canvas) => {
    const brickRowCount = 6;
    const brickColumnCount = 9;
    const brickWidth = 70;
    const brickHeight = 20;
    const brickPadding = 8;
    const brickOffsetTop = 50;

    const totalBricksWidth = (brickWidth + brickPadding) * brickColumnCount - brickPadding;
    const brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;

    const bricks = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[r] = [];
      for (let c = 0; c < brickColumnCount; c++) {
        bricks[r][c] = {
          x: brickOffsetLeft + c * (brickWidth + brickPadding),
          y: brickOffsetTop + r * (brickHeight + brickPadding),
          width: brickWidth,
          height: brickHeight,
          visible: true
        };
      }
    }
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
        gradient.addColorStop(0, `rgba(0, ${180 + rowIndex * 15}, 255, 0.9)`);
        gradient.addColorStop(1, `rgba(0, ${140 + rowIndex * 15}, 255, 1)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        ctx.fill();
        
        ctx.strokeStyle = "#008B8B";
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    }));
  };

  const handleKeyDown = (e) => {
    keysPressed.current[e.key] = true;
    if (!gameStarted && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "a" || e.key === "d")) {
      setGameStarted(true);
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
        setScore(prev => prev + 10);
        hitBrick = true;
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
    resetGame();
    setGameStarted(true);
    setGameOver(false);
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  };

  const restartGame = () => {
    resetGame();
    setGameStarted(true);
    setGameOver(false);
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a1a2e'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        width: '100%',
        maxWidth: '900px'
      }}>
        <h2 style={{ margin: 0, color: '#00CED1', fontFamily: 'Arial, sans-serif' }}>Score: {score}</h2>
        
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
            width: '80%',
            maxWidth: '400px'
          }}>
            <h2 style={{ color: '#00CED1', margin: '0 0 20px 0', fontSize: '28px' }}>Breakout Game</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{
                  padding: '8px',
                  width: '100%',
                  backgroundColor: 'rgba(0, 206, 209, 0.1)',
                  border: '1px solid #00CED1',
                  borderRadius: '4px',
                  color: '#00FFFF',
                  textAlign: 'center'
                }}
              />
            </div>
            
            <button 
              onClick={startGame}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(0, 206, 209, 0.2)',
                color: '#00CED1',
                border: '2px solid #00CED1',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s',
                marginBottom: '10px',
                width: '100%'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.2)'}
            >
              Start Game
            </button>
            
            <button 
              onClick={() => setShowLeaderboard(true)}
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
              View Leaderboard
            </button>
          </div>
        )}
        
        {gameOver && (
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
            width: '80%',
            maxWidth: '400px'
          }}>
            <h2 style={{ color: '#00CED1', margin: '0 0 20px 0', fontSize: '28px' }}>Game Over!</h2>
            <p style={{ color: '#00FFFF', margin: '0 0 20px 0' }}>Final Score: {score}</p>
            <button 
              onClick={restartGame}
              style={{
                padding: '10px 20px',
                backgroundColor: 'rgba(0, 206, 209, 0.2)',
                color: '#00CED1',
                border: '2px solid #00CED1',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s',
                marginBottom: '10px',
                width: '100%'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 206, 209, 0.2)'}
            >
              Play Again
            </button>
            <button 
              onClick={() => setShowLeaderboard(true)}
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
              View Leaderboard
            </button>
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
        
        <canvas 
          ref={canvasRef} 
          width={900} 
          height={600}
          style={{ 
            border: "2px solid #00CED1",
            borderRadius: '8px',
            backgroundColor: '#0a192f',
            boxShadow: '0 0 20px rgba(0, 206, 209, 0.3)'
          }}
        />
        <div style={{ color: '#00CED1', textAlign: 'center' }}>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>Use ← → arrow keys or A/D to control the paddle</p>
          <p style={{ margin: '5px 0', fontSize: '12px', opacity: 0.7 }}>Destroy all bricks to win!</p>
        </div>
      </div>
    </div>
  );
};

export default BreakoutGame;