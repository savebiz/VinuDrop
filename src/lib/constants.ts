export interface OrbType {
    level: number;
    name: string;
    color: string; // CSS gradient
    solidColor: string; // Hex for Matter.js
    radius: number; // Physics radius
    score: number;
}

export const ORBS: OrbType[] = [
    { level: 1, name: "Tiny Spark", color: "radial-gradient(circle at 30% 30%, #e879f9, #a21caf)", solidColor: "#a21caf", radius: 15, score: 0 }, // Purple
    { level: 2, name: "Red Dwarf", color: "radial-gradient(circle at 30% 30%, #f87171, #b91c1c)", solidColor: "#ef4444", radius: 25, score: 10 }, // Red
    { level: 3, name: "Orange Star", color: "radial-gradient(circle at 30% 30%, #fb923c, #c2410c)", solidColor: "#f97316", radius: 35, score: 20 }, // Orange
    { level: 4, name: "Yellow Sun", color: "radial-gradient(circle at 30% 30%, #facc15, #a16207)", solidColor: "#eab308", radius: 45, score: 30 }, // Yellow
    { level: 5, name: "Green Planet", color: "radial-gradient(circle at 30% 30%, #4ade80, #15803d)", solidColor: "#22c55e", radius: 60, score: 40 }, // Green
    { level: 6, name: "Blue Giant", color: "radial-gradient(circle at 30% 30%, #60a5fa, #1d4ed8)", solidColor: "#3b82f6", radius: 75, score: 50 }, // Blue
    { level: 7, name: "Indigo Nebula", color: "radial-gradient(circle at 30% 30%, #818cf8, #4338ca)", solidColor: "#6366f1", radius: 90, score: 60 }, // Indigo
    { level: 8, name: "Violet Void", color: "radial-gradient(circle at 30% 30%, #c084fc, #7e22ce)", solidColor: "#a855f7", radius: 105, score: 70 }, // Violet
    { level: 9, name: "Cosmic Core", color: "radial-gradient(circle at 30% 30%, #f472b6, #be185d)", solidColor: "#ec4899", radius: 120, score: 80 }, // Pink
    { level: 10, name: "Galactic Swirl", color: "radial-gradient(circle at 30% 30%, #2dd4bf, #0f766e)", solidColor: "#14b8a6", radius: 135, score: 90 }, // Teal
    { level: 11, name: "Vinu Verse", color: "radial-gradient(circle at 30% 30%, #ffffff, #94a3b8)", solidColor: "#f8fafc", radius: 150, score: 100 }, // White/Vinu
];

export const GAME_WIDTH = 500;
export const GAME_HEIGHT = 700;
export const WALL_THICKNESS = 50;
export const DANGER_HEIGHT = 150;
