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
        loadGameState,
        resetKey
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
    // Save on visibility change (tab switch/minimize) and unmount
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleSaveState();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Also keep beforeunload for actual page close, but use it sparingly if needed. 
        // Actually, for modern browsers, visibilitychange is preferred for saving data.
        // We'll stick to visibilitychange + unmount cleanup.

        return () => {
            handleSaveState();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [handleSaveState]);

    const runnerRef = useRef<Matter.Runner | null>(null);

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

        // Custom Render Loop for Cosmic Orbs
        Events.on(render, 'afterRender', () => {
            const context = render.context;
            if (!context) return;

            const bodies = Composite.allBodies(engine.world);

            context.save();

            try {
                bodies.forEach((body) => {
                    if (body.label.startsWith('orb-')) {
                        const level = parseInt(body.label.split('-')[1]);
                        const orbData = ORBS.find(o => o.level === level);

                        if (orbData && body.render.visible !== false) {
                            const { x, y } = body.position;
                            // @ts-ignore
                            const radius = body.circleRadius || 20;

                            // 1. Base Glow (Outer Halo)
                            const glow = context.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.5);
                            glow.addColorStop(0, orbData.color);
                            glow.addColorStop(1, 'transparent');
                            context.fillStyle = glow;
                            context.globalAlpha = 0.3;
                            context.beginPath();
                            context.arc(x, y, radius * 1.5, 0, 2 * Math.PI);
                            context.fill();
                            context.globalAlpha = 1;

                            // 2. Main Sphere Body (Glassy Gradient)
                            const g = context.createRadialGradient(
                                x - radius * 0.3, y - radius * 0.3, 0,
                                x, y, radius
                            );
                            g.addColorStop(0, 'rgba(255,255,255,0.9)'); // Bright highlight center
                            g.addColorStop(0.2, orbData.color); // Main color
                            g.addColorStop(0.8, orbData.color); // Deep color
                            g.addColorStop(1, 'rgba(0,0,0,0.8)'); // Dark edge

                            context.fillStyle = g;
                            context.beginPath();
                            context.arc(x, y, radius, 0, 2 * Math.PI);
                            context.fill();

                            // 3. Specular Highlight (The "Gloss")
                            context.beginPath();
                            context.ellipse(x - radius * 0.3, y - radius * 0.3, radius * 0.4, radius * 0.25, Math.PI / 4, 0, 2 * Math.PI);
                            context.fillStyle = 'rgba(255, 255, 255, 0.6)';
                            context.fill();

                            // 4. Rim Light (Bottom reflection)
                            context.beginPath();
                            context.arc(x, y, radius * 0.9, 0.5 * Math.PI, 2.5 * Math.PI); // Bottom arc
                            context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                            context.lineWidth = 2;
                            context.stroke();

                            // 5. Inner Light / Core
                            context.shadowColor = orbData.color;
                            context.shadowBlur = 15;
                            context.fillStyle = 'rgba(255,255,255,0.2)';
                            context.beginPath();
                            context.arc(x, y, radius * 0.5, 0, 2 * Math.PI);
                            context.fill();
                            context.shadowBlur = 0;
                        }
                    }
                });
            } catch (e) {
                console.error("Error rendering orbs:", e);
            } finally {
                context.restore();
            }
        });

        // Boundaries (Invisible but thicker for physics)
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 50, GAME_WIDTH, 100, { isStatic: true, render: { visible: false } });
        const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { isStatic: true, render: { visible: false } });
        const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT * 2, { isStatic: true, render: { visible: false } });

        World.add(world, [ground, leftWall, rightWall]);

        // Load saved state if available
        const savedState = useGameStore.getState().savedBoardState;
        console.log("VinuPhysics Effect: resetKey", resetKey, "savedState length:", savedState?.length);

        if (savedState && savedState.length > 0) {
            console.log("Loading saved state...");
            loadGameState(world);
        } else {
            console.log("Starting fresh game.");
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

        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
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
            if (runnerRef.current) {
                Runner.stop(runnerRef.current);
            }
            if (render.canvas) render.canvas.remove();
            World.clear(world, false);
            Engine.clear(engine);
        };
    }, [setGameOver, addScore, nextTurn, saveGameState, loadGameState, resetKey]);

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
            {flash && <div className="absolute inset-0 bg-white/30 z-50 pointer-events-none animate-out fade-out duration-100" />}

            {/* Shockwaves */}
            {
                shockwaves.map(sw => (
                    <div
                        key={sw.id}
                        className="absolute rounded-full border-4 pointer-events-none animate-ping"
                        style={{
                            left: sw.x,
                            top: sw.y,
                            width: 100,
                            height: 100,
                            marginLeft: -50,
                            marginTop: -50,
                            borderColor: sw.color,
                            opacity: 0,
                            boxShadow: `0 0 20px ${sw.color}`
                        }}
                        onAnimationEnd={() => setShockwaves(prev => prev.filter(p => p.id !== sw.id))}
                    />
                ))
            }

            {/* Holographic Container Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
                {/* Glowing Borders */}
                <div className="absolute inset-0 border-b-[4px] border-l-[4px] border-r-[4px] border-cyan-500/30 rounded-b-[3rem] shadow-[0_0_30px_rgba(0,240,255,0.2)] backdrop-blur-[1px]"></div>

                {/* Corner Accents */}
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-[4px] border-l-[4px] border-cyan-400 rounded-bl-[3rem] shadow-[0_0_20px_rgba(0,240,255,0.5)]"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-[4px] border-r-[4px] border-cyan-400 rounded-br-[3rem] shadow-[0_0_20px_rgba(0,240,255,0.5)]"></div>

                {/* Grid Background Effect */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.3) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* Drop Guide Laser */}
            {canDrop && !isGameOver && !targetingMode && (
                <div
                    className="absolute top-0 bottom-0 w-[2px] z-0 pointer-events-none transition-all duration-75"
                    style={{
                        left: spawnerX,
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0))',
                        boxShadow: '0 0 10px rgba(255,255,255,0.3)'
                    }}
                />
            )}

            {/* Danger Zone (Laser Grid) */}
            <div
                className="absolute left-0 right-0 h-[4px] z-10 pointer-events-none transition-all duration-300"
                style={{
                    top: DANGER_HEIGHT,
                    background: danger ? 'rgba(255, 0, 50, 0.8)' : 'rgba(255, 0, 50, 0.1)',
                    boxShadow: danger ? '0 0 20px rgba(255, 0, 50, 0.8)' : 'none'
                }}
            >
                <div className="absolute inset-0 animate-pulse bg-inherit blur-[4px]" />
                {/* Grid lines below danger line */}
                {danger && (
                    <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-500/20 to-transparent"
                        style={{
                            backgroundImage: 'linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px)',
                            backgroundSize: '20px 100%'
                        }}
                    />
                )}
            </div>

            {/* Spawner Visual */}
            <div
                className="absolute top-4 -ml-8 w-16 h-16 z-30 pointer-events-none transition-transform duration-75"
                style={{ left: spawnerX }}
            >
                {/* Claw / Emitter */}
                <div className="w-full h-full relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-8 bg-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-4 border-t-2 border-cyan-400 rounded-t-full shadow-[0_0_15px_rgba(0,240,255,0.6)]"></div>
                </div>

                {/* Current Orb Preview (In Hand) */}
                {canDrop && !targetingMode && (
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-full opacity-90 animate-float"
                        style={{
                            width: ORBS[currentOrbLevel - 1].radius * 2,
                            height: ORBS[currentOrbLevel - 1].radius * 2,
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), ${ORBS[currentOrbLevel - 1].color})`,
                            boxShadow: `0 0 20px ${ORBS[currentOrbLevel - 1].color}, inset 0 0 10px rgba(255,255,255,0.5)`
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

        </div>
    );
};
