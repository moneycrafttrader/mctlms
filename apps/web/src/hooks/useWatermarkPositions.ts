'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WatermarkPosition {
  top: number;
  left: number;
}

export interface WatermarkPositions {
  instances: WatermarkPosition[];
  trap: WatermarkPosition[];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePositions(instanceCount: number, trapCount: number): WatermarkPositions {
  const usedCells = new Set<number>();

  const pickCell = (): [number, number] => {
    let row: number;
    let col: number;
    let cellKey: number;
    do {
      row = randomInt(0, 2);
      col = randomInt(0, 2);
      cellKey = row * 3 + col;
    } while (usedCells.has(cellKey));
    usedCells.add(cellKey);
    return [row, col];
  };

  const instances: WatermarkPosition[] = Array.from({ length: instanceCount }, () => {
    const [row, col] = pickCell();
    return {
      top: row * 33.33 + randomInt(2, 28),
      left: col * 33.33 + randomInt(2, 28),
    };
  });

  const trap: WatermarkPosition[] = Array.from({ length: trapCount }, () => {
    const [row, col] = pickCell();
    return {
      top: row * 33.33 + randomInt(5, 25),
      left: col * 33.33 + randomInt(5, 25),
    };
  });

  return { instances, trap };
}

export function useWatermarkPositions(
  instanceCount: number,
  trapCount: number,
  intervalMs: number,
): WatermarkPositions {
  const [positions, setPositions] = useState<WatermarkPositions>(() =>
    generatePositions(instanceCount, trapCount),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setPositions(generatePositions(instanceCount, trapCount));
    }, intervalMs);
    return () => clearInterval(id);
  }, [instanceCount, trapCount, intervalMs]);

  return positions;
}
