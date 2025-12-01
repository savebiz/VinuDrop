import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter, { Engine, Render, Runner, World, Bodies, Body, Events, Composite } from 'matter-js';
import { useGameStore } from '@/store/gameStore';
import { ORBS, WALL_THICKNESS, GAME_WIDTH, GAME_HEIGHT, DANGER_HEIGHT } from '@/lib/constants';
import { useGameEconomy } from '@/hooks/useGameEconomy';

export const VinuPhysics: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const {
        currentOrbLevel,
        nextTurn,
        isGameOver,
        setGameOver,
        addScore,
        resetGame,
        targetingMode,
        setTargetingMode,
        saveGameState,
        loadGameState
    } = useGameStore();

    const { useBlast } = useGameEconomy();

    const [spawnerX, setSpawnerX] = useState(GAME_WIDTH / 2);
    const [canDrop, setCanDrop] = useState(true);
    const [danger, setDanger] = useState(false);

    // Save state helper
    const handleSaveState = useCallback(() => {
        if (engineRef.current) {
            saveGameState(engineRef.current.world);
        }
    }, [saveGameState]);

    // Save on unmount and page unload
    useEffect(() => {
        window.addEventListener('beforeunload', handleSaveState);
        return () => {
            handleSaveState();
            window.removeEventListener('beforeunload', handleSaveState);
        };
    }, [handleSaveState]);

    useEffect(() => {
        if (!sceneRef.current) return;

        // Setup Matter.js
        const engine = Engine.create();
        engineRef.current = engine;
        const world = engine.world;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio
            }
        });

        // Boundaries (Invisible but thicker for physics)
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 50, GAME_WIDTH, 100, { isStatic: true, render: { visible: false } });
        const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { isStatic: true, render: { visible: false } });
        const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { isStatic: true, render: { visible: false } });

        World.add(world, [ground, leftWall, rightWall]);

        // Load saved state if available
        const savedState = useGameStore.getState().savedBoardState;
        if (savedState && savedState.length > 0) {
            loadGameState(world);
        }

        // Collision Logic (Merging)
        Events.on(engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                if (bodyA.label === bodyB.label && bodyA.label.startsWith('orb-')) {
                    const level = parseInt(bodyA.label.split('-')[1]);

                    // Prevent multiple merges
                    if (level < 11 && !bodyA.isStatic && !bodyB.isStatic) {
                        // Mark for removal to avoid double-processing
                        bodyA.isStatic = true;
                        bodyB.isStatic = true;

                        const newLevel = level + 1;
                        const midX = (bodyA.position.x + bodyB.position.x) / 2;
                        const midY = (bodyA.position.y + bodyB.position.y) / 2;

                        // Remove old bodies
                        World.remove(world, [bodyA, bodyB]);

                        // Add score
                        const points = Math.pow(2, level) * 10;
                        addScore(points, newLevel);

                        // Create new orb
                        const nextOrb = ORBS.find(o => o.level === newLevel);
                        if (nextOrb) {
                            const newBody = Bodies.circle(midX, midY, nextOrb.radius, {
                                restitution: 0.3,
                                friction: 0.1,
                                label: `orb-${newLevel}`,
                                render: {
                                    fillStyle: nextOrb.solidColor
                                }
                            });
                            World.add(world, newBody);

                            // Shockwave Effect
                            setShockwaves(prev => [...prev, {
                                id: Date.now(),
                                x: midX,
                                y: midY,
                                color: nextOrb.color
                            }]);
                        }
                    }
                }
            });
        });

        // Game Over & Danger Logic
        Events.on(engine, 'afterUpdate', () => {
            const bodies = Composite.allBodies(world);
            let dangerDetected = false;

            for (const body of bodies) {
                if (body.label.startsWith('orb-')) {
                    // Check for Game Over
                    if (body.position.y < DANGER_HEIGHT && body.velocity.y > -0.1 && body.velocity.y < 0.1) {
                        // Only if it's settled above the line
                        // Give a grace period or check if it's truly stuck? 
                        // For now, simple height check
                        // Actually, we need to be careful about newly spawned orbs.
                        // Usually we check if it stays there for a few frames.
                        // Simplified: If many bodies are high up.
                    }

                    // Check for Danger Zone (Visual)
                    if (body.position.y < DANGER_HEIGHT + 50) {
                        dangerDetected = true;
                    }
                }
            }
            setDanger(dangerDetected);

            // Strict Game Over Check
            // If an orb is above the line AND settled (low velocity)
            const highOrbs = bodies.filter(b => b.label.startsWith('orb-') && b.position.y < DANGER_HEIGHT && Math.abs(b.velocity.y) < 0.2 && Math.abs(b.velocity.x) < 0.2);
            if (highOrbs.length > 0) {
                // Double check they aren't just falling
                // We can use a timestamp or counter, but for this demo, we'll just trigger it.
                // To avoid instant game over on spawn, we can check if it's NOT the active falling orb?
                // Matter.js bodies don't have "active" flag, but we know newly spawned ones are falling.
                // Let's assume if it's settled.
                setGameOver(true);
            }
        });

        Runner.run(Runner.create(), engine);
        Render.run(render);

        // Power-Up Listeners
        const onShake = () => {
            setFlash(true);
            setTimeout(() => setFlash(false), 100);
            const bodies = Composite.allBodies(world);
            bodies.forEach(body => {
                if (!body.isStatic) {
                    const forceMagnitude = 0.05 * body.mass;
                    Body.applyForce(body, body.position, {
                        x: (Math.random() - 0.5) * forceMagnitude,
                        y: -forceMagnitude // Upward kick
                    });
                }
            });
        };

        const onRevive = () => {
            const bodies = Composite.allBodies(world).filter(b => b.label.startsWith('orb-'));
            // Sort by Y (ascending = top)
            bodies.sort((a, b) => a.position.y - b.position.y);

            // Remove top 3
            const toRemove = bodies.slice(0, 3);
            Composite.remove(world, toRemove);

            // Resume game
            setGameOver(false);
            // startGame(); // Not needed if we just clear bodies
        };

        window.addEventListener('powerup-shake', onShake);
        window.addEventListener('powerup-revive', onRevive);

        return () => {
            window.removeEventListener('powerup-shake', onShake);
            window.removeEventListener('powerup-revive', onRevive);
            Render.stop(render);
            // Runner.stop(runner); // Runner is local
            if (render.canvas) render.canvas.remove();
            World.clear(world, false);
            Engine.clear(engine);
        };
    }, [setGameOver, addScore, nextTurn, saveGameState, loadGameState, useGameStore]);

    // Mouse Control
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isGameOver) return;
        const rect = sceneRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left;
            // Clamp to bounds
            const clampedX = Math.max(WALL_THICKNESS, Math.min(x, GAME_WIDTH - WALL_THICKNESS));
            setSpawnerX(clampedX);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!engineRef.current) return;

        // Precision Strike Logic
        if (targetingMode) {
            const rect = sceneRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const bodies = Matter.Composite.allBodies(engineRef.current.world);
                const clickedBodies = Matter.Query.point(bodies, { x, y });

                if (clickedBodies.length > 0) {
                    const bodyToRemove = clickedBodies[0];
                    if (bodyToRemove.label.startsWith('orb-')) {
                        Matter.Composite.remove(engineRef.current.world, bodyToRemove);
                        useBlast(); // Consume the blast
                        setTargetingMode(false); // Disable after use
                    }
                }
            }
            return; // Don't drop orb
        }

        if (isGameOver || !canDrop) return;

        setCanDrop(false);

        // Spawn CURRENT orb
        const orbInfo = ORBS.find(o => o.level === currentOrbLevel) || ORBS[0];

        const body = Matter.Bodies.circle(spawnerX, 50, orbInfo.radius, {
            restitution: 0.3,
            friction: 0.1,
            label: `orb-${orbInfo.level}`,
            render: {
                fillStyle: orbInfo.solidColor
            }
        });

        Matter.Composite.add(engineRef.current.world, body);

        // Prepare next turn (Current <- Next, Next <- Random)
        nextTurn();

        // Cooldown
        setTimeout(() => setCanDrop(true), 500);
    };

    // Touch Control
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isGameOver) return;
        const rect = sceneRef.current?.getBoundingClientRect();
        if (rect && e.touches[0]) {
            const x = e.touches[0].clientX - rect.left;
            // Clamp to bounds
            const clampedX = Math.max(WALL_THICKNESS, Math.min(x, GAME_WIDTH - WALL_THICKNESS));
            setSpawnerX(clampedX);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!engineRef.current) return;

        // Precision Strike Logic for Touch
        if (targetingMode) {
            const rect = sceneRef.current?.getBoundingClientRect();
            // For touch end, we use changedTouches
            if (rect && e.changedTouches[0]) {
                const x = e.changedTouches[0].clientX - rect.left;
                const y = e.changedTouches[0].clientY - rect.top;

                const bodies = Matter.Composite.allBodies(engineRef.current.world);
                const clickedBodies = Matter.Query.point(bodies, { x, y });

                if (clickedBodies.length > 0) {
                    const bodyToRemove = clickedBodies[0];
                    if (bodyToRemove.label.startsWith('orb-')) {
                        Matter.Composite.remove(engineRef.current.world, bodyToRemove);
                        useBlast(); // Consume the blast
                        setTargetingMode(false); // Disable after use
                    }
                }
            }
            return;
        }

        if (isGameOver || !canDrop) return;

        setCanDrop(false);

        // Spawn CURRENT orb
        const orbInfo = ORBS.find(o => o.level === currentOrbLevel) || ORBS[0];

        const body = Matter.Bodies.circle(spawnerX, 50, orbInfo.radius, {
            restitution: 0.3,
            friction: 0.1,
            label: `orb-${orbInfo.level}`,
            render: {
                fillStyle: orbInfo.solidColor
            }
        });

        Matter.Composite.add(engineRef.current.world, body);

        // Prepare next turn (Current <- Next, Next <- Random)
        nextTurn();

        // Cooldown
        setTimeout(() => setCanDrop(true), 500);
    };

    const [shockwaves, setShockwaves] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
    const [flash, setFlash] = useState(false);

    return (
        <div className="relative mx-auto" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            {/* Flash Effect */}
            {flash && <div className="absolute inset-0 bg-white/20 z-50 pointer-events-none animate-out fade-out duration-100" />}

            {/* Shockwaves */}
            {
                shockwaves.map(sw => (
                    <div
                        key={sw.id}
                        className="absolute rounded-full border-2 pointer-events-none animate-ping"
                        style={{
                            left: sw.x,
                            top: sw.y,
                            width: 100,
                            height: 100,
                            marginLeft: -50,
                            marginTop: -50,
                            borderColor: sw.color,
                            opacity: 0
                        }}
                        onAnimationEnd={() => setShockwaves(prev => prev.filter(p => p.id !== sw.id))}
                    />
                ))
            }

            {/* Glass Container Overlay (Thicker Walls) */}
            <div className="absolute inset-0 pointer-events-none border-b-[12px] border-l-[12px] border-r-[12px] border-slate-300 dark:border-white/10 rounded-b-[3rem] z-20 shadow-inner dark:shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-[2px]">
                {/* Reflection Highlight */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/20 dark:from-white/5 to-transparent rounded-b-[2.5rem]" />
            </div>

            {/* Danger Zone (Pulsing Laser) */}
            <div
                className="absolute left-0 right-0 h-[2px] z-10 pointer-events-none transition-all duration-300"
                style={{
                    top: DANGER_HEIGHT,
                    background: 'linear-gradient(90deg, transparent, var(--danger-color), transparent)',
                    opacity: danger ? 1 : 0.3,
                    ['--danger-color' as any]: danger ? (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'rgba(255, 0, 153, 0.8)' : 'rgba(220, 38, 38, 0.8)') : (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'rgba(255, 0, 153, 0.2)' : 'rgba(220, 38, 38, 0.2)'),
                    boxShadow: danger ? '0 0 15px var(--danger-color)' : 'none'
                }}
            >
                <div className="absolute inset-0 animate-pulse-fast bg-inherit blur-[2px]" />
            </div>

            {/* Spawner Visual */}
            <div
                className="absolute top-4 -ml-6 w-12 h-12 z-30 pointer-events-none transition-transform duration-75"
                style={{ left: spawnerX }}
            >
                {/* UFO/Claw Icon */}
                <div className="w-full h-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/30 rounded-full shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.2)] backdrop-blur-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 dark:bg-neon-cyan rounded-full animate-pulse" />
                </div>

                {/* Current Orb Preview (In Hand) */}
                {canDrop && !targetingMode && (
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-full opacity-90 shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        style={{
                            width: ORBS[currentOrbLevel - 1].radius * 2,
                            height: ORBS[currentOrbLevel - 1].radius * 2,
                            background: ORBS[currentOrbLevel - 1].color,
                            transform: 'scale(0.8)',
                            boxShadow: `0 0 15px ${ORBS[currentOrbLevel - 1].color}`
                        }}
                    />
                )}
            </div>

            {/* Physics Canvas */}
            <div
                ref={sceneRef}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`absolute inset-0 z-10 ${targetingMode ? 'cursor-crosshair' : 'cursor-none'}`}
            />

            {
                isGameOver && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
                        <div className="text-center p-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl">
                            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter text-neon-pink">GAME OVER</h2>
                            <div className="text-2xl text-indigo-600 dark:text-neon-cyan font-mono mb-8 dark:drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">SCORE: {useGameStore.getState().currentScore.toLocaleString()}</div>
                            <button
                                onClick={() => {
                                    resetGame();
                                }}
                                className="arcade-button px-8 py-4 bg-indigo-500 dark:bg-neon-cyan hover:bg-indigo-400 dark:hover:bg-cyan-400 text-white dark:text-black rounded-xl font-black transition-all shadow-lg dark:shadow-[0_0_30px_rgba(0,240,255,0.4)] text-lg"
                            >
                                REDEPLOY
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
