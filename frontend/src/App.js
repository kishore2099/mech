import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, PerspectiveCamera, Environment } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import './App.css';

// Mechanical Assembly Component
const MechanicalAssembly = ({ exploded, scrollProgress }) => {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(null);
  
  // Auto rotation when not interacting
  useFrame((state) => {
    if (groupRef.current && !exploded) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  // Parts configuration for exploded view
  const parts = [
    { name: 'Main Chassis', component: Box, position: [0, 0, 0], explodedPos: [0, 0, 0], size: [2, 1, 3], color: '#007BFF' },
    { name: 'Motor Housing', component: Cylinder, position: [-1.5, 0.5, 0], explodedPos: [-4, 1.5, 0], size: [0.5, 0.8, 0.5], color: '#FD7E14' },
    { name: 'Sensor Array', component: Sphere, position: [1.5, 0.5, 0], explodedPos: [4, 1.5, 0], size: [0.4], color: '#28A745' },
    { name: 'Control Unit', component: Box, position: [0, 1.2, 0], explodedPos: [0, 3, 0], size: [1, 0.4, 1], color: '#6F42C1' },
    { name: 'Power Core', component: Cylinder, position: [0, -0.8, 0], explodedPos: [0, -2.5, 0], size: [0.6, 0.4, 0.6], color: '#DC3545' },
    { name: 'Gripper Left', component: Box, position: [-0.7, 0, 1.8], explodedPos: [-2, 0, 4], size: [0.3, 0.3, 0.8], color: '#17A2B8' },
    { name: 'Gripper Right', component: Box, position: [0.7, 0, 1.8], explodedPos: [2, 0, 4], size: [0.3, 0.3, 0.8], color: '#17A2B8' },
  ];

  return (
    <group ref={groupRef}>
      {parts.map((part, index) => {
        const Component = part.component;
        const position = exploded ? part.explodedPos : part.position;
        
        return (
          <animated.group
            key={part.name}
            position={useSpring({
              to: { position },
              config: config.wobbly
            }).position}
          >
            <Component
              args={part.size}
              onPointerOver={() => setHovered(part.name)}
              onPointerOut={() => setHovered(null)}
            >
              <meshPhongMaterial 
                color={hovered === part.name ? '#FFFFFF' : part.color}
                shininess={100}
              />
            </Component>
            {hovered === part.name && (
              <Text
                position={[0, part.size[1] ? part.size[1] + 0.5 : 1, 0]}
                fontSize={0.3}
                color="#343A40"
                anchorX="center"
                anchorY="middle"
              >
                {part.name}
              </Text>
            )}
          </animated.group>
        );
      })}
    </group>
  );
};

// Camera Controller for scroll-based movement
const CameraController = ({ scrollProgress, currentSection }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    // Define camera positions for each section
    const positions = {
      0: { position: [0, 2, 8], target: [0, 0, 0] }, // Landing
      1: { position: [-3, 1, 5], target: [-1.5, 0.5, 0] }, // About (focus on motor)
      2: { position: [3, 2, 6], target: [1.5, 0.5, 0] }, // Projects (focus on sensor)
      3: { position: [0, 4, 4], target: [0, 1.2, 0] }, // Skills (focus on control unit)
      4: { position: [0, 2, 8], target: [0, 0, 0] }, // Contact (back to overview)
    };

    const currentPos = positions[currentSection] || positions[0];
    
    // Smooth camera transition
    camera.position.lerp({ x: currentPos.position[0], y: currentPos.position[1], z: currentPos.position[2] }, 0.05);
    camera.lookAt(currentPos.target[0], currentPos.target[1], currentPos.target[2]);
  }, [camera, scrollProgress, currentSection]);

  return null;
};

// Main App Component
function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [exploded, setExploded] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      setScrollProgress(progress);
      
      // Determine current section based on scroll progress
      const section = Math.floor(progress * 5);
      setCurrentSection(Math.min(section, 4));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="App">
      {/* 3D Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 2, 8]} />
            <CameraController scrollProgress={scrollProgress} currentSection={currentSection} />
            
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />
            
            {/* Environment */}
            <Environment preset="studio" />
            
            {/* 3D Model */}
            <MechanicalAssembly exploded={exploded} scrollProgress={scrollProgress} />
            
            {/* Controls */}
            <OrbitControls 
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              maxDistance={15}
              minDistance={3}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none">
        {/* Navigation */}
        <nav className="fixed top-6 right-6 flex flex-col space-y-4 pointer-events-auto">
          <button 
            onClick={() => setExploded(!exploded)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
            title="Exploded View"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </button>
        </nav>

        {/* Side Navigation */}
        <div className="fixed left-6 top-1/2 transform -translate-y-1/2 flex flex-col space-y-6 pointer-events-auto">
          {['Home', 'About', 'Projects', 'Skills', 'Contact'].map((item, index) => (
            <button
              key={item}
              onClick={() => {
                const targetY = (window.innerHeight * 5) * (index / 5);
                window.scrollTo({ top: targetY, behavior: 'smooth' });
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSection === index 
                  ? 'bg-blue-600 scale-150' 
                  : 'bg-gray-400 hover:bg-gray-600'
              }`}
              title={item}
            />
          ))}
        </div>

        {/* Content Sections */}
        <div className="h-screen flex items-center justify-end pr-20">
          <div className="max-w-lg text-right pointer-events-auto">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">
              Kishore Narayanan
            </h1>
            <h2 className="text-2xl text-blue-600 mb-6">
              Mechanical Engineering & Design
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Scroll to explore the build
            </p>
            <div className="animate-bounce">
              <svg className="w-8 h-8 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="h-screen flex items-center justify-start pl-20">
          <div className="max-w-lg pointer-events-auto bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
            <h3 className="text-4xl font-bold text-gray-800 mb-6">The Architect</h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              As a mechanical engineer specializing in hardware prototyping and patent development, 
              I transform innovative ideas into tangible reality. My passion lies in bridging the gap 
              between concept and creation, utilizing cutting-edge 3D modeling and sensor integration 
              to build the future.
            </p>
            <p className="text-gray-600">
              Every prototype tells a story of precision, innovation, and relentless pursuit of perfection.
            </p>
          </div>
        </div>

        {/* Projects Section */}
        <div className="h-screen flex items-center justify-end pr-20">
          <div className="max-w-2xl pointer-events-auto">
            <h3 className="text-4xl font-bold text-gray-800 mb-8">Case Studies</h3>
            <div className="grid gap-6">
              {[
                {
                  title: "BNO055 Robotics Integration",
                  description: "Advanced sensor fusion for robotic navigation systems",
                  tech: "Arduino, C++, IMU Sensors"
                },
                {
                  title: "IoT Patent Development",
                  description: "Hardware design and patent filing for innovative IoT devices",
                  tech: "3D CAD, Patent Research, Prototyping"
                },
                {
                  title: "Interactive 3D Viewer",
                  description: "Web-based 3D visualization tools for engineering collaboration",
                  tech: "Three.js, WebGL, React"
                }
              ].map((project, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{project.title}</h4>
                  <p className="text-gray-600 mb-3">{project.description}</p>
                  <span className="text-sm text-blue-600 font-medium">{project.tech}</span>
                </div>
              ))}
            </div>
            <a 
              href="https://github.com/kishore2099" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
            >
              View All Projects →
            </a>
          </div>
        </div>

        {/* Skills Section */}
        <div className="h-screen flex items-center justify-center">
          <div className="max-w-4xl pointer-events-auto text-center">
            <h3 className="text-4xl font-bold text-gray-800 mb-12">The Toolkit</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { skill: "3D Modeling", level: "Blender, SolidWorks" },
                { skill: "CAD Design", level: "Advanced Prototyping" },
                { skill: "Hardware", level: "Arduino, ESP32" },
                { skill: "Sensor Integration", level: "IMU, IoT Devices" },
                { skill: "Robotics", level: "Control Systems" },
                { skill: "Patent Development", level: "Research & Filing" }
              ].map((item, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-blue-50">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{item.skill}</h4>
                  <p className="text-gray-600 text-sm">{item.level}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="h-screen flex items-center justify-center">
          <div className="max-w-lg text-center pointer-events-auto">
            <h3 className="text-4xl font-bold text-gray-800 mb-8">Collaborate</h3>
            <p className="text-gray-600 text-lg mb-8">
              Ready to bring your mechanical engineering vision to life? 
              Let's build something extraordinary together.
            </p>
            <div className="flex justify-center space-x-6">
              <a 
                href="https://www.linkedin.com/in/kishore-narayanan-3aab34277/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                LinkedIn
              </a>
              <a 
                href="https://github.com/kishore2099" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;