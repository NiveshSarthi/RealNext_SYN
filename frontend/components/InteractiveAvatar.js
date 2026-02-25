import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    Environment,
    ContactShadows,
    Float,
    MeshDistortMaterial,
    Sphere,
    RoundedBox,
    Cylinder,
    Lightformer
} from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { MicrophoneIcon } from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicrophoneOutlineIcon } from '@heroicons/react/24/outline';
import { processVoiceCommand } from '../utils/voiceCommandEngine';

// --- Inner 3D Scene Components ---

function RobotHead() {
    const headRef = useRef();

    // Use useFrame to make the head look at the mouse cursor
    useFrame((state) => {
        // Calculate target rotation based on mouse position
        // state.pointer holds normalized device coordinates (-1 to +1)
        const targetX = (state.pointer.x * Math.PI) / 4; // Max rotation angle
        const targetY = (state.pointer.y * Math.PI) / 6;

        if (headRef.current) {
            // Smoothly interpolate current rotation towards target rotation
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetX, 0.1);
            headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -targetY, 0.1);
        }
    });

    return (
        <group ref={headRef} position={[0, 0.5, 0]}>
            {/* Main Head Casting */}
            <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.2} smoothness={4}>
                <meshStandardMaterial color="#1a1f2e" metalness={0.8} roughness={0.2} />
            </RoundedBox>

            {/* Glowing Visor */}
            <RoundedBox args={[0.9, 0.4, 1.25]} radius={0.1} position={[0, 0.1, 0.1]}>
                <meshStandardMaterial
                    color="#f49d25"
                    emissive="#f49d25"
                    emissiveIntensity={2}
                    toneMapped={false} // Prevents intense colors from washing out
                />
            </RoundedBox>

            {/* Antenna Left */}
            <Cylinder args={[0.05, 0.05, 0.5]} position={[-0.7, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <meshStandardMaterial color="#333" />
            </Cylinder>
            <Sphere args={[0.1]} position={[-1, 0.2, 0]}>
                <meshStandardMaterial color="#f49d25" emissive="#f49d25" emissiveIntensity={1} />
            </Sphere>

            {/* Antenna Right */}
            <Cylinder args={[0.05, 0.05, 0.5]} position={[0.7, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <meshStandardMaterial color="#333" />
            </Cylinder>
            <Sphere args={[0.1]} position={[1, 0.2, 0]}>
                <meshStandardMaterial color="#f49d25" emissive="#f49d25" emissiveIntensity={1} />
            </Sphere>
        </group>
    );
}

function RobotBody() {
    return (
        <group position={[0, -0.6, 0]}>
            {/* Neck */}
            <Cylinder args={[0.2, 0.2, 0.4]} position={[0, 0.5, 0]}>
                <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
            </Cylinder>

            {/* Torso core - using DistortMaterial for a "liquid metal" / advanced tech feel */}
            <Sphere args={[0.6, 64, 64]}>
                <MeshDistortMaterial
                    color="#f49d25"
                    attach="material"
                    distort={0.3} // Amount of distortion
                    speed={2}     // Speed of distortion animation
                    roughness={0}
                    metalness={1}
                />
            </Sphere>

            {/* Outer Armor Chassis */}
            <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.8, 0.4, 0.8, 4]} />
                <meshStandardMaterial color="#0A0D14" metalness={0.5} roughness={0.5} wireframe={true} transparent opacity={0.3} />
            </mesh>
        </group>
    );
}


function Scene() {
    return (
        <>
            {/* The Float component adds a subtle hovering animation to everything inside it */}
            <Float
                speed={2} // Animation speed
                rotationIntensity={0.2} // How much it rotates while floating
                floatIntensity={0.5} // How high/low it floats
                floatingRange={[-0.1, 0.1]}
            >
                <group position={[0, -0.2, 0]}>
                    <RobotHead />
                    <RobotBody />
                </group>
            </Float>

            {/* ContactShadows provides a realistic grounded shadow beneath the floating object */}
            <ContactShadows
                position={[0, -1.8, 0]}
                opacity={0.6}
                scale={10}
                blur={2}
                far={4}
                color="#000000"
            />

            {/* Environmental Lighting Setup for a premium look */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />

            {/* Preset environment maps provide realistic reflections on metallic surfaces */}
            <Environment preset="city">
                {/* Adding custom lightformers inside the environment creates striking studio-style highlights */}
                <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
            </Environment>
        </>
    );
}

// --- Main Wrapper Component ---

export default function InteractiveAvatar({ isVisible = true, onClose }) {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [message, setMessage] = useState("Greetings, Executive. I am your active pipeline assistant.");
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setTranscript('');
                setMessage("Listening... (Say 'Go to Dashboard' or 'Open Leads')");
            };

            recognition.onresult = (event) => {
                let current = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    current += event.results[i][0].transcript;
                }
                setTranscript(current);

                // Show real-time transcript in the bubble
                if (current) setMessage(`"${current}"`);

                if (event.results[event.results.length - 1].isFinal) {
                    setIsListening(false);
                    if (recognitionRef.current) recognitionRef.current.stop();

                    // Call the advanced command engine
                    processVoiceCommand(current, router).then(result => {
                        if (result && result.message) {
                            setMessage(result.message);
                        }
                        if (!result || !result.success) {
                            setTimeout(() => updateContextualMessage(router?.pathname), 4000);
                        }
                    });
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech error", event.error);
                setIsListening(false);
                setMessage("Error parsing audio. Please check microphone permissions.");
                setTimeout(() => updateContextualMessage(router?.pathname), 4000);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition not supported in this browser.");
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [router]);


    const toggleListening = (e) => {
        e.stopPropagation(); // Don't drag when clicking
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
            } catch (err) { }
        }
    };

    const updateContextualMessage = (path) => {
        if (!path) return;
        if (path === '/') {
            setMessage("Welcome to the Command Center. Click outside the charts to analyze specific datasets, or use the quick links below to navigate.");
        } else if (path.includes('lead-center')) {
            setMessage("Lead Center Active. You can drag and drop lead cards to change stages, or use the 'Bulk Actions' bar to manage multiple clients.");
        } else if (path.includes('leads') && path.includes('[id]')) {
            setMessage("Target Acquired. Here you can review detailed telemetry, add secure notes, or initiate a communication sequence.");
        } else if (path.includes('inventory')) {
            setMessage("Inventory systems online. Review property valuations and status here.");
        } else if (path.includes('wa-marketing')) {
            setMessage("Marketing array primed. Manage your automated broadcast sequences from this terminal.");
        } else {
            setMessage("Systems stable. I am monitoring the application state.");
        }
    };

    // Contextual Help Logic on Mount/Route Change
    useEffect(() => {
        if (!router) return;
        if (!isListening) {
            updateContextualMessage(router.pathname);
        }
    }, [router?.pathname, isListening]);

    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return null;
    if (!isVisible) return null;

    return (
        // Absolute positioning with Framer Motion drag capabilities
        <motion.div
            drag
            dragMomentum={false} // Stops it from sliding after letting go
            dragElastic={0.1} // Little less bouncy when hitting edges
            // Constrain dragging to the screen (approximate, adjust as needed)
            dragConstraints={{ top: -window.innerHeight + 350, left: -window.innerWidth + 350, right: 0, bottom: 0 }}
            className="fixed bottom-8 right-8 z-[100] flex flex-col items-end pointer-events-auto cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }} // Prevents scrolling while dragging on touch
        >

            {/* Chat Bubble / Greeting */}
            <motion.div
                animate={{
                    borderColor: isListening ? 'rgba(244, 157, 37, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: isListening ? '0 0 20px rgba(244, 157, 37, 0.2)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                className={`mb-4 bg-white/[0.05] backdrop-blur-xl border-2 rounded-2xl p-4 shadow-2xl pointer-events-auto max-w-[250px] transform transition-all duration-300 group relative ${!isListening && 'hover:bg-white/10 hover:scale-105'}`}
            >
                {/* Control Actions */}
                <div className="absolute -top-4 -left-4 flex items-center gap-2">
                    <button
                        onClick={toggleListening}
                        className={`h-10 w-10 cursor-pointer rounded-full border flex items-center justify-center transition-all shadow-lg z-10 ${isListening ? 'bg-primary border-primary text-black animate-pulse scale-110' : 'bg-[#0D1117] border-white/20 text-gray-400 hover:text-white hover:bg-white/10 hover:scale-110'}`}
                        title={isListening ? "Stop Listening" : "Voice Command"}
                    >
                        {isListening ? <MicrophoneIcon className="h-5 w-5" /> : <MicrophoneOutlineIcon className="h-5 w-5" />}
                    </button>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black/50 border border-white/20 text-gray-400 flex items-center justify-center text-xs hover:text-white hover:bg-red-500/50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Dismiss Avatar"
                >
                    ✕
                </button>

                <div className={`text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2 transition-colors ${isListening ? 'text-primary' : 'text-gray-400'}`}>
                    <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isListening ? 'scale-150' : ''}`}></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    {isListening ? 'Listening...' : 'System Online'}
                </div>
                <p className={`text-sm font-medium leading-relaxed transition-colors ${isListening ? 'text-white' : 'text-gray-300'}`}>
                    {message}
                </p>
            </motion.div>

            {/* 3D Canvas Container */}
            <div className="w-[300px] h-[300px] rounded-full relative pointer-events-auto">
                <Canvas
                    camera={{ position: [0, 0, 4], fov: 45 }}
                    // Required for the transparent background to blend with our dark UI
                    gl={{ alpha: true, antialias: true }}
                >
                    <Scene />
                </Canvas>
            </div>
        </motion.div>
    );
}
