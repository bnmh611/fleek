"use client";

import React, { useState, useEffect, useCallback } from "react";

const ROWS = 15;
const COLS = 15;
const GRID_SIZE = 30;

// 0 = Empty, 1 = Destructible Brick, 2 = Indestructible Brick
const INITIAL_MAZE: number[][] = [
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 0, 0, 0, 1, 1, 0, 2, 0, 1, 1, 0, 0, 0, 2],
  [2, 0, 2, 0, 1, 1, 0, 2, 0, 1, 1, 0, 2, 0, 2],
  [2, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 2],
  [2, 1, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 2],
  [2, 1, 1, 0, 2, 2, 0, 2, 0, 2, 2, 0, 1, 1, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 2, 2, 0, 2, 2, 0, 0, 0, 2, 2, 0, 2, 2, 2],
  [2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2],
  [2, 1, 1, 0, 2, 2, 0, 2, 0, 2, 2, 0, 1, 1, 2],
  [2, 1, 1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 2],
  [2, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 2],
  [2, 0, 2, 0, 1, 1, 0, 2, 0, 1, 1, 0, 2, 0, 2],
  [2, 0, 0, 0, 1, 1, 0, 2, 0, 1, 1, 0, 0, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];

type Tank = {
  x: number;
  y: number;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  alive: boolean;
};

type Bullet = {
  x: number;
  y: number;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  player: keyof Tanks;
};

type Tanks = {
  player1: Tank;
  player2: Tank;
};

const INITIAL_TANKS: Tanks = {
  player1: { x: 1, y: 1, direction: "DOWN", alive: true },
  player2: { x: COLS - 2, y: ROWS - 2, direction: "UP", alive: true },
};

const DIRECTIONS = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

const TankBattle: React.FC = () => {
  const [maze, setMaze] = useState(INITIAL_MAZE);
  const [tanks, setTanks] = useState<Tanks>(INITIAL_TANKS);
  const [bullets, setBullets] = useState<Bullet[]>([]);

  const moveTank = useCallback(
    (player: keyof Tanks, direction: keyof typeof DIRECTIONS): void => {
      if (!tanks[player].alive) return;
      setTanks((prev) => {
        const tank = prev[player];
        const newX = tank.x + DIRECTIONS[direction].dx;
        const newY = tank.y + DIRECTIONS[direction].dy;

        if (
          newX >= 0 &&
          newX < COLS &&
          newY >= 0 &&
          newY < ROWS &&
          maze[newY][newX] === 0
        ) {
          return {
            ...prev,
            [player]: { ...tank, x: newX, y: newY, direction },
          };
        }
        return prev;
      });
    },
    [maze, tanks]
  );

  const fireBullet = useCallback(
    (player: keyof Tanks): void => {
      if (!tanks[player].alive) return;
      setBullets((prev) => [
        ...prev,
        {
          x: tanks[player].x,
          y: tanks[player].y,
          direction: tanks[player].direction,
          player,
        },
      ]);
    },
    [tanks]
  );

  const updateBullets = useCallback(() => {
    setBullets((prev) =>
      prev
        .map((bullet) => {
          const newX = bullet.x + DIRECTIONS[bullet.direction].dx;
          const newY = bullet.y + DIRECTIONS[bullet.direction].dy;

          if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) {
            return null; // Bullet leaves the board
          }

          if (maze[newY][newX] === 1) {
            // Hit a destructible brick
            setMaze((prevMaze) => {
              const newMaze = prevMaze.map((row) => [...row]);
              newMaze[newY][newX] = 0;
              return newMaze;
            });
            return null;
          }

          if (maze[newY][newX] === 2) {
            // Hit an indestructible brick
            return null;
          }

          if (
            (tanks.player1.x === newX && tanks.player1.y === newY && tanks.player1.alive) ||
            (tanks.player2.x === newX && tanks.player2.y === newY && tanks.player2.alive)
          ) {
            // Hit a tank
            setTanks((prevTanks) => ({
              ...prevTanks,
              [bullet.player === "player1" ? "player2" : "player1"]: {
                ...prevTanks[bullet.player === "player1" ? "player2" : "player1"],
                alive: false,
              },
            }));
            return null;
          }

          return { ...bullet, x: newX, y: newY };
        })
        .filter((bullet) => bullet !== null) as Bullet[]
    );
  }, [maze, tanks]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "w":
          moveTank("player1", "UP");
          break;
        case "s":
          moveTank("player1", "DOWN");
          break;
        case "a":
          moveTank("player1", "LEFT");
          break;
        case "d":
          moveTank("player1", "RIGHT");
          break;
        case " ":
          fireBullet("player1");
          break;
        case "ArrowUp":
          moveTank("player2", "UP");
          break;
        case "ArrowDown":
          moveTank("player2", "DOWN");
          break;
        case "ArrowLeft":
          moveTank("player2", "LEFT");
          break;
        case "ArrowRight":
          moveTank("player2", "RIGHT");
          break;
        case "Enter":
          fireBullet("player2");
          break;
        default:
          break;
      }
    },
    [moveTank, fireBullet]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const interval = setInterval(updateBullets, 100);
    return () => clearInterval(interval);
  }, [updateBullets]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <h1>Tank Battle</h1>
      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Controls:</strong>
        </p>
        <p>Player 1: W (Up), S (Down), A (Left), D (Right), Space (Fire)</p>
        <p>Player 2: Arrow Keys (Move), Enter (Fire)</p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, ${GRID_SIZE}px)`,
          gap: "1px",
          backgroundColor: "black",
        }}
      >
        {maze.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isPlayer1 =
              tanks.player1.x === colIndex &&
              tanks.player1.y === rowIndex &&
              tanks.player1.alive;
            const isPlayer2 =
              tanks.player2.x === colIndex &&
              tanks.player2.y === rowIndex &&
              tanks.player2.alive;
            const isBullet = bullets.some(
              (bullet) => bullet.x === colIndex && bullet.y === rowIndex
            );

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  width: GRID_SIZE,
                  height: GRID_SIZE,
                  backgroundColor:
                    cell === 2
                      ? "gray" // Indestructible Brick
                      : cell === 1
                      ? "orange" // Destructible Brick
                      : isPlayer1
                      ? "blue" // Player 1
                      : isPlayer2
                      ? "red" // Player 2
                      : isBullet
                      ? "yellow" // Bullet
                      : "#333", // Empty
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default TankBattle;
