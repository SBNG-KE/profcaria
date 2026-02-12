"use client"

import React, { useEffect, useRef } from 'react';

import { useTheme } from '@/app/context/ThemeContext';

export default function NetworkBackground() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
        let height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;

        const nodes: Node[] = [];
        const nodeCount = 40;
        const connectionDistance = 150;

        class Node {
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
                ctx.fill();
            }
        }

        for (let i = 0; i < nodeCount; i++) {
            nodes.push(new Node());
        }

        function animate() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, width, height);

            nodes.forEach((node, i) => {
                node.update();
                node.draw();

                // Draw connections
                for (let j = i + 1; j < nodes.length; j++) {
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        const opacity = 1 - distance / connectionDistance;
                        ctx.strokeStyle = isDark
                            ? `rgba(255, 255, 255, ${opacity * 0.2})`
                            : `rgba(0, 0, 0, ${opacity * 0.1})`;
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            if (canvas.parentElement) {
                width = canvas.width = canvas.parentElement.offsetWidth;
                height = canvas.height = canvas.parentElement.offsetHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

    }, [isDark]);

    return (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-50" />
    );
}
