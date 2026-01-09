'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move, Check, X, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
    imageOrUrl: File | string;
    onCrop: (blob: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageOrUrl, onCrop, onCancel }: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Load image
    useEffect(() => {
        const img = new Image();
        let src = '';
        let isObjectUrl = false;

        if (typeof imageOrUrl === 'string') {
            src = imageOrUrl;
            img.crossOrigin = 'anonymous';
        } else {
            src = URL.createObjectURL(imageOrUrl);
            isObjectUrl = true;
        }

        img.src = src;
        img.onload = () => {
            setImage(img);

            // "Cover" logic: ensure image covers 600x600
            const minScaleX = 600 / img.width;
            const minScaleY = 600 / img.height;
            const newMinScale = Math.max(minScaleX, minScaleY);

            setScale(newMinScale);
            // Center it
            setPosition({
                x: (600 - img.width * newMinScale) / 2,
                y: (600 - img.height * newMinScale) / 2
            });
        };

        return () => {
            if (isObjectUrl) URL.revokeObjectURL(src);
        };
    }, [imageOrUrl]);

    // Helper: Clamp position to ensure image covers container
    const clampPosition = (x: number, y: number, currentScale: number, img: HTMLImageElement) => {
        const width = img.width * currentScale;
        const height = img.height * currentScale;

        // Bounds: image must cover 600x600
        // Max x is 0 (left edge at container let edge)
        // Min x is 600 - width (right edge at container right edge)
        const minX = 600 - width;
        const maxX = 0;

        const minY = 600 - height;
        const maxY = 0;

        return {
            x: Math.min(Math.max(x, minX), maxX),
            y: Math.min(Math.max(y, minY), maxY)
        };
    };

    // Draw to canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fill background (safe zone)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Save context state
        ctx.save();

        // Draw image with transforms
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        ctx.drawImage(image, 0, 0);

        ctx.restore();

        // Draw Overlay (Mask)
        // We want a circular or square mask. Let's do a square with rounded corners (like the UI)
        // But to make it clear what is being cropped, we can darken the outside.
        // Actually, the canvas IS the crop area (600x600).
        // So anything outside the canvas is "cropped out" visually.

    }, [image, scale, position]);

    useEffect(() => {
        let animationFrameId: number;

        const render = () => {
            draw();
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [draw]);


    // Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !image) return;

        const rawX = e.clientX - dragStart.x;
        const rawY = e.clientY - dragStart.y;

        const clamped = clampPosition(rawX, rawY, scale, image);
        setPosition(clamped);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (!image) return;

        const zoomSpeed = 0.001;
        const newScaleRaw = scale + (e.deltaY * -zoomSpeed);

        const minScaleX = 600 / image.width;
        const minScaleY = 600 / image.height;
        const minScale = Math.max(minScaleX, minScaleY);

        const newScale = Math.min(Math.max(newScaleRaw, minScale), 5); // Max 5x

        setScale(newScale);
        setPosition(prev => clampPosition(prev.x, prev.y, newScale, image));
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (blob) onCrop(blob);
        }, 'image/jpeg', 1.0);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-6">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white">Crop Image</h3>
                    <p className="text-xs text-slate-400">Drag to position. Scroll to resize.</p>
                </div>

                {/* Crop Area */}
                <div
                    ref={containerRef}
                    className="relative w-[300px] h-[300px] mx-auto overflow-hidden rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900 shadow-inner cursor-move touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={600}
                        className="block w-[300px] h-[300px] pointer-events-none" // Display as 300px but render as 600px
                    />

                    {/* Grid Overlay for assistance */}
                    <div className="absolute inset-0 pointer-events-none opacity-30">
                        <div className="absolute top-1/3 w-full h-px bg-white/50"></div>
                        <div className="absolute top-2/3 w-full h-px bg-white/50"></div>
                        <div className="absolute left-1/3 h-full w-px bg-white/50"></div>
                        <div className="absolute left-2/3 h-full w-px bg-white/50"></div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
                    >
                        Save & Upload
                    </button>
                </div>
            </div>
        </div>
    );
}
