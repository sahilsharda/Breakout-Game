import { useRef, useEffect, useState } from "react";

const BreakoutGame = () => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const paddle = { x: canvas.width / 2 - 40, y: canvas.height - 20, width: 80, height: 10, speed: 5 };
    const ball = { x: canvas.width / 2, y: canvas.height - 30, radius: 8, dx: 3, dy: -3 };

    const brickRowCount = 4, brickColumnCount = 7;
    const bricks = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[r] = [];
      for (let c = 0; c < brickColumnCount; c++) {
        bricks[r][c] = { x: c * 70 + 20, y: r * 30 + 40, width: 60, height: 20, visible: true };
      }
    }

    function drawPaddle() {
      ctx.fillStyle = "blue";
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }

    function drawBall() {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }

    function drawBricks() {
      bricks.forEach(row => row.forEach(brick => {
        if (brick.visible) {
          ctx.fillStyle = "green";
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
      }));
    }

    function movePaddle(e) {
      if (e.key === "ArrowLeft" && paddle.x > 0) paddle.x -= paddle.speed;
      if (e.key === "ArrowRight" && paddle.x < canvas.width - paddle.width) paddle.x += paddle.speed;
    }

    function detectCollisions() {
      bricks.forEach(row => row.forEach(brick => {
        if (brick.visible &&
          ball.x > brick.x && ball.x < brick.x + brick.width &&
          ball.y - ball.radius < brick.y + brick.height && ball.y + ball.radius > brick.y) {
          ball.dy *= -1;
          brick.visible = false;
          setScore(prev => prev + 10);
        }
      }));

      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx *= -1;
      if (ball.y - ball.radius < 0) ball.dy *= -1;
      if (ball.y + ball.radius > canvas.height) setGameOver(true);

      if (ball.x > paddle.x && ball.x < paddle.x + paddle.width && ball.y + ball.radius > paddle.y) {
        ball.dy *= -1;
      }
    }

    function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBricks();
      drawPaddle();
      drawBall();

      ball.x += ball.dx;
      ball.y += ball.dy;

      detectCollisions();

      if (!gameOver) requestAnimationFrame(update);
    }

    document.addEventListener("keydown", movePaddle);
    update();

    return () => document.removeEventListener("keydown", movePaddle);
  }, [gameOver]);

  return (
    <div>
      <h2>Score: {score}</h2>
      {gameOver && <h2>Game Over! Refresh to Play Again</h2>}
      <canvas ref={canvasRef} width={500} height={400} style={{ border: "2px solid black" }}></canvas>
    </div>
  );
};

export default BreakoutGame;
