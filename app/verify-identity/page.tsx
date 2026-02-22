"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Camera, Video, Upload, CheckCircle2, AlertCircle, Loader2, Play, Square, RefreshCw, ScanFace, FileImage
} from 'lucide-react';

const MAX_VIDEO_LENGTH_MS = 15000; // 15 seconds

function VerificationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [step, setStep] = useState(1);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Video Recording State
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [cameraError, setCameraError] = useState('');
    const [cameraReady, setCameraReady] = useState(false);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Initial check
    useEffect(() => {
        if (!token) {
            setSubmitError('Invalid or missing verification token. Please use the link sent to your email.');
        }
    }, [token]);

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        };
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // ------------- VIDEO LOGIC -------------
    const requestCameraPermission = async () => {
        setCameraError('');
        setCameraReady(false);
        try {
            // Just call getUserMedia — the browser will natively prompt the user
            // for camera + microphone permission. No pre-checking needed.
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: true
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraReady(true);
        } catch (err: any) {
            console.error('Camera access error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setCameraError(
                    'You denied camera access. Please tap the lock or camera icon in your address bar, allow camera and microphone, then tap "Retry" below.'
                );
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('No camera found on this device. Please use a device with a working camera.');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setCameraError('Your camera is being used by another app. Close other apps using the camera and try again.');
            } else {
                setCameraError('Could not access the camera. Please check your device settings and try again.');
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const startRecording = () => {
        if (!videoRef.current || !videoRef.current.srcObject) return;

        setVideoBlob(null);
        setVideoPreviewUrl(null);
        setRecordingTime(MAX_VIDEO_LENGTH_MS / 1000);

        const stream = videoRef.current.srcObject as MediaStream;
        const options = { mimeType: 'video/webm' };
        let recorder;

        try {
            recorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.warn("video/webm not supported, falling back to default");
            recorder = new MediaRecorder(stream);
        }

        mediaRecorderRef.current = recorder;
        const chunks: BlobPart[] = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: recorder.mimeType });
            setVideoBlob(blob);
            setVideoPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
        };

        recorder.start();
        setIsRecording(true);

        // Auto-stop at 15s
        setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                stopRecording();
            }
        }, MAX_VIDEO_LENGTH_MS);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording && recordingTime > 0) {
            interval = setInterval(() => {
                setRecordingTime((prev) => prev - 1);
            }, 1000);
        } else if (recordingTime === 0 && isRecording) {
            stopRecording();
        }
        return () => clearInterval(interval);
    }, [isRecording, recordingTime]);

    // ------------- SUBMISSION -------------
    const handleSubmit = async () => {
        if (!imageFile || !videoBlob || !token) return;
        setIsSubmitting(true);
        setSubmitError('');

        try {
            // 1. Upload Image to Vercel Blob via our API
            const imageFormData = new FormData();
            imageFormData.append('file', imageFile);
            const imageExt = imageFile.name.split('.').pop() || 'jpg';
            const imgRes = await fetch(`/api/upload?filename=kyc-image-${Date.now()}.${imageExt}`, {
                method: 'POST',
                body: imageFile, // Using generic body as expected by /api/upload
            });
            if (!imgRes.ok) throw new Error('Failed to upload image.');
            const imgData = await imgRes.json();
            const imageUrl = imgData.url;

            // 2. Upload Video to Vercel Blob
            const videoExt = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
            const vidRes = await fetch(`/api/upload?filename=kyc-video-${Date.now()}.${videoExt}`, {
                method: 'POST',
                body: videoBlob,
            });
            if (!vidRes.ok) throw new Error('Failed to upload video.');
            const vidData = await vidRes.json();
            const videoUrl = vidData.url;

            // 3. Finalize Verification
            const finalRes = await fetch('/api/verify-identity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, imageUrl, videoUrl })
            });

            const finalData = await finalRes.json();

            if (!finalRes.ok) {
                throw new Error(finalData.error || 'Verification failed.');
            }

            setSubmitSuccess(true);
        } catch (err: any) {
            console.error(err);
            setSubmitError(err.message || 'An unexpected error occurred during upload.');
        } finally {
            setIsSubmitting(false);
        }
    };


    // ------------- RENDER -------------
    if (!token) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h1 className="text-2xl font-black uppercase tracking-tight">Access Denied</h1>
                    <p className="text-neutral-400 text-sm">{submitError}</p>
                </div>
            </div>
        );
    }

    if (submitSuccess) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Identity Verified!</h1>
                        <p className="text-neutral-400 text-sm mt-2">
                            Your verification was successful. The employer has been notified and you are officially shortlisted.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/professional/feed')}
                        className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-lg hover:bg-neutral-200 transition-all"
                    >
                        Return to Platform
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
            {/* Header */}
            <header className="px-6 py-6 border-b border-neutral-900 flex justify-center">
                <span className="text-xl font-black uppercase tracking-[0.2em] text-white">profcaria</span>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="max-w-xl w-full">

                    {/* Progress Bar */}
                    <div className="flex items-center justify-between mb-8 px-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-white text-black' : 'bg-neutral-900 border border-neutral-800 text-neutral-500'}`}>
                                    {s < step ? <CheckCircle2 size={16} /> : s}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mt-2">
                                    {s === 1 ? 'Start' : s === 2 ? 'Image' : 'Video'}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-black border border-neutral-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
                        {/* Step 1: Intro */}
                        {step === 1 && (
                            <div className="space-y-6 text-center animate-in slide-in-from-bottom-4 fade-in">
                                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <ScanFace className="w-10 h-10 text-amber-500" />
                                </div>
                                <h1 className="text-3xl font-black uppercase tracking-tight leading-none text-white">Identity Verification</h1>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    To protect employers and ensure trust on our platform, you must verify your identity before proceeding to the shortlisted phase.
                                </p>
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-left space-y-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-800 pb-2">What you need:</p>
                                    <ul className="text-sm text-neutral-300 space-y-2">
                                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> A clear photo of yourself</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> A device with a working camera</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> 30 seconds of your time</li>
                                    </ul>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full py-4 mt-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-lg shadow-white/10 hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Continue <ScanFace size={16} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Image Upload */}
                        {step === 2 && (
                            <div className="space-y-6 text-center animate-in slide-in-from-right fade-in">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Upload ID Photo</h2>
                                <p className="text-neutral-400 text-xs">
                                    Please upload a clear, front-facing photo of yourself.
                                </p>

                                <div className="relative">
                                    {imagePreview ? (
                                        <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-neutral-800 overflow-hidden shadow-2xl">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] uppercase font-bold text-white hover:bg-black"
                                            >
                                                Retake
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center justify-center w-48 h-48 mx-auto rounded-full border-2 border-dashed border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 transition-colors">
                                            <FileImage className="w-10 h-10 text-neutral-500 mb-2" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Select Image</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-neutral-900">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="w-1/3 py-4 rounded-xl bg-neutral-900 text-white font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStep(3);
                                            requestCameraPermission();
                                        }}
                                        disabled={!imageFile}
                                        className="flex-1 py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-lg hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next Component
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Video Record & Submit */}
                        {step === 3 && (
                            <div className="space-y-6 text-center animate-in slide-in-from-right fade-in">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Record 15s Video</h2>
                                <p className="text-neutral-400 text-xs">
                                    Record a short video stating your full name. This proves liveliness.
                                </p>

                                {cameraError && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm text-left space-y-3">
                                        <p className="font-bold text-xs uppercase tracking-widest text-red-500">Camera Access Required</p>
                                        <p className="whitespace-pre-line leading-relaxed">{cameraError}</p>
                                        <button onClick={requestCameraPermission} className="w-full mt-2 py-3 rounded-lg bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-widest hover:bg-red-500/30 transition-all">
                                            Retry Camera Access
                                        </button>
                                    </div>
                                )}

                                {!cameraReady && !cameraError && (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
                                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Requesting camera access...</p>
                                    </div>
                                )}

                                <div className="relative w-full aspect-[4/3] bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner">
                                    {!videoPreviewUrl ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className={`w-full h-full object-cover ${isRecording ? 'opacity-100' : 'opacity-80'}`}
                                        />
                                    ) : (
                                        <video
                                            src={videoPreviewUrl || undefined}
                                            controls
                                            className="w-full h-full object-contain bg-black"
                                        />
                                    )}

                                    {/* Recording Indicator */}
                                    {isRecording && (
                                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-500/30">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                                                00:{recordingTime.toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Controls Overlay */}
                                    {!videoPreviewUrl && !cameraError && (
                                        <div className="absolute bottom-4 inset-x-0 flex justify-center">
                                            {!isRecording ? (
                                                <button
                                                    onClick={startRecording}
                                                    className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center border-4 border-white/20 hover:scale-110 hover:border-white/40 transition-all"
                                                >
                                                    <div className="w-4 h-4 bg-white rounded-full" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={stopRecording}
                                                    className="w-14 h-14 bg-neutral-900 rounded-full flex items-center justify-center border-4 border-white/20 hover:scale-110 hover:border-red-500/40 transition-all group"
                                                >
                                                    <Square className="w-4 h-4 text-red-500" fill="currentColor" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {videoPreviewUrl && (
                                    <button
                                        onClick={() => {
                                            setVideoBlob(null);
                                            setVideoPreviewUrl(null);
                                            requestCameraPermission();
                                        }}
                                        className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-white flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <RefreshCw size={12} /> Retake Video
                                    </button>
                                )}

                                {submitError && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-xs font-medium">
                                        {submitError}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4 border-t border-neutral-900">
                                    <button
                                        onClick={() => {
                                            stopCamera();
                                            setStep(2);
                                        }}
                                        disabled={isSubmitting}
                                        className="w-1/3 py-4 rounded-xl bg-neutral-900 text-white font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!videoBlob || isSubmitting}
                                        className="flex-1 py-4 rounded-xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-lg hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Uploading securely...</> : <><Upload size={16} /> Submit Verification</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function VerificationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-neutral-500 animate-spin" /></div>}>
            <VerificationContent />
        </Suspense>
    );
}
