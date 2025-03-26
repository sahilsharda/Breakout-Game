import React, { useState, useEffect, useRef } from "react";

const Breakout = () => {
  const canvasRef = useRef(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [powerUp, setPowerUp] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 480;
    canvas.height = 320;

    let ball = { x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2, radius: 10 };
    let paddle = { width: 75, height: 10, x: (canvas.width - 75) / 2, dx: 7 };
    let bricks = [];
    let rowCount = 3;
    let columnCount = 5;
    let brickWidth = 75;
    let brickHeight = 20;
    let brickPadding = 10;
    let brickOffsetTop = 30;
    let brickOffsetLeft = 30;

    for (let c = 0; c < columnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < rowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
      }
    }

    function drawBall() {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    }

    function drawPaddle() {
      ctx.beginPath();
      ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
      ctx.fillStyle = "#0095DD";
      ctx.fill();
      ctx.closePath();
    }

    function drawBricks() {
      for (let c = 0; c < columnCount; c++) {
        for (let r = 0; r < rowCount; r++) {
          if (bricks[c][r].status === 1) {
            let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.beginPath();
            ctx.rect(brickX, brickY, brickWidth, brickHeight);
            ctx.fillStyle = "#0095DD";
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    }

    function drawPowerUp() {
      if (powerUp) {
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.closePath();
      }
    }

    function movePowerUp() {
      if (powerUp) {
        powerUp.y += 2;
        if (
          powerUp.y > canvas.height - paddle.height &&
          powerUp.x > paddle.x &&
          powerUp.x < paddle.x + paddle.width
        ) {
          setPowerUp(null);
          paddle.width += 20; 
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBricks();
      drawBall();
      drawPaddle();
      drawPowerUp();
      movePowerUp();
    }

    function update() {
      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
      }

      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
      } else if (ball.y + ball.radius > canvas.height) {
        setLives((prev) => prev - 1);
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 30;
        ball.dx = 2;
        ball.dy = -2;
      }

      if (ball.y + ball.radius > canvas.height - paddle.height &&
          ball.x > paddle.x &&
          ball.x < paddle.x + paddle.width) {
        ball.dy = -ball.dy;
      }

      for (let c = 0; c < columnCount; c++) {
        for (let r = 0; r < rowCount; r++) {
          let b = bricks[c][r];
          if (b.status === 1) {
            if (
              ball.x > b.x &&
              ball.x < b.x + brickWidth &&
              ball.y > b.y &&
              ball.y < b.y + brickHeight
            ) {
              ball.dy = -ball.dy;
              b.status = 0;
              setScore((prev) => prev + 10);
              if (Math.random() < 0.2) {
                setPowerUp({ x: b.x + brickWidth / 2, y: b.y });
              }
            }
          }
        }
      }
    }

    function gameLoop() {
      draw();
      update();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();
  }, [lives, score, powerUp]);

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
      <p>Lives: {lives} Score: {score}</p>
    </div>
  );
};

export default Breakout;
