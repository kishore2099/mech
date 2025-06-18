import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere, PerspectiveCamera, Environment, useGLTF, Html } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import './App.css';

// Custom 3D Model Loader Component
const CustomModel = ({ exploded, scrollProgress, modelPath }) => {
  // For now, we'll use the placeholder. When you have your .glb/.gltf file:
  // const { scene } = useGLTF(modelPath || '/models/your-model.glb');
  // return <primitive object={scene.clone()} />;
  
  // Fallback to enhanced placeholder
  return <MechanicalAssembly exploded={exploded} scrollProgress={scrollProgress} />;
};

// Enhanced Mechanical Assembly with better exploded view
const MechanicalAssembly = ({ exploded, scrollProgress }) => {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  
  // Auto rotation when not interacting
  useFrame((state) => {
    if (groupRef.current && !exploded && autoRotate) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  // Enhanced parts configuration for better exploded view
  const parts = [
    { 
      name: 'Main Chassis', 
      component: Box, 
      position: [0, 0, 0], 
      explodedPos: [0, 0, 0], 
      size: [2.2, 1.2, 3.2], 
      color: '#007BFF',
      description: 'Primary structural frame'
    },
    { 
      name: 'Motor Housing', 
      component: Cylinder, 
      position: [-1.5, 0.5, 0], 
      explodedPos: [-5, 2, 0], 
      size: [0.6, 1, 0.6], 
      color: '#FD7E14',
      description: 'Servo motor assembly'
    },
    { 
      name: 'Sensor Array', 
      component: Sphere, 
      position: [1.5, 0.5, 0], 
      explodedPos: [5, 2, 0], 
      size: [0.5], 
      color: '#28A745',
      description: 'BNO055 IMU sensor'
    },
    { 
      name: 'Control Unit', 
      component: Box, 
      position: [0, 1.5, 0], 
      explodedPos: [0, 4, 0], 
      size: [1.2, 0.5, 1.2], 
      color: '#6F42C1',
      description: 'Microcontroller hub'
    },
    { 
      name: 'Power Core', 
      component: Cylinder, 
      position: [0, -1, 0], 
      explodedPos: [0, -3.5, 0], 
      size: [0.8, 0.5, 0.8], 
      color: '#DC3545',
      description: 'Battery management system'
    },
    { 
      name: 'Gripper Left', 
      component: Box, 
      position: [-0.8, 0, 2], 
      explodedPos: [-3, 0, 5], 
      size: [0.4, 0.4, 1], 
      color: '#17A2B8',
      description: 'Actuator gripper'
    },
    { 
      name: 'Gripper Right', 
      component: Box, 
      position: [0.8, 0, 2], 
      explodedPos: [3, 0, 5], 
      size: [0.4, 0.4, 1], 
      color: '#17A2B8',
      description: 'Actuator gripper'
    },
  ];

  return (
    <group 
      ref={groupRef}
      onPointerEnter={() => setAutoRotate(false)}
      onPointerLeave={() => setAutoRotate(true)}
    >
      {parts.map((part, index) => {
        const Component = part.component;
        
        return (
          <animated.group
            key={part.name}
            position={useSpring({
              to: exploded ? part.explodedPos : part.position,
              config: { ...config.wobbly, duration: 1000 }
            }).position}
          >
            <Component
              args={part.size}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(part.name);
              }}
              onPointerOut={() => setHovered(null)}
            >
              <meshPhongMaterial 
                color={hovered === part.name ? '#FFFFFF' : part.color}
                shininess={100}
                transparent
                opacity={hovered === part.name ? 1 : 0.9}
              />
            </Component>
            
            {/* Enhanced hover labels */}
            {hovered === part.name && (
              <Html position={[0, (part.size[1] || part.size[0]) + 1, 0]}>
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                  <div className="font-bold text-sm">{part.name}</div>
                  <div className="text-xs text-gray-300">{part.description}</div>
                </div>
              </Html>
            )}
            
            {/* Exploded view connection lines */}
            {exploded && (
              <mesh>
                <cylinderGeometry args={[0.01, 0.01, 
                  Math.sqrt(
                    Math.pow(part.explodedPos[0] - part.position[0], 2) +
                    Math.pow(part.explodedPos[1] - part.position[1], 2) +
                    Math.pow(part.explodedPos[2] - part.position[2], 2)
                  )
                ]} />
                <meshBasicMaterial color="#888888" transparent opacity={0.3} />
              </mesh>
            )}
          </animated.group>
        );
      })}
    </group>
  );
};

// Animated annotation lines
const AnnotationLine = ({ start, end, label, visible }) => {
  return (
    <animated.group
      visible={useSpring({
        to: { opacity: visible ? 1 : 0 },
        config: config.slow
      }).opacity}
    >
      <mesh>
        <cylinderGeometry args={[0.005, 0.005, 
          Math.sqrt(
            Math.pow(end[0] - start[0], 2) +
            Math.pow(end[1] - start[1], 2) +
            Math.pow(end[2] - start[2], 2)
          )
        ]} />
        <meshBasicMaterial color="#007BFF" />
      </mesh>
      <Html position={end}>
        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
          {label}
        </div>
      </Html>
    </animated.group>
  );
};

// Enhanced Camera Controller
const CameraController = ({ scrollProgress, currentSection }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    const positions = {
      0: { position: [0, 3, 10], target: [0, 0, 0] }, // Landing - overview
      1: { position: [-4, 2, 6], target: [-1.5, 0.5, 0] }, // About - motor housing
      2: { position: [4, 3, 7], target: [1.5, 0.5, 0] }, // Projects - sensor array
      3: { position: [0, 5, 5], target: [0, 1.5, 0] }, // Skills - control unit
      4: { position: [0, 3, 10], target: [0, 0, 0] }, // Contact - overview
    };

    const currentPos = positions[currentSection] || positions[0];
    
    // Smoother camera transitions
    camera.position.lerp(
      { x: currentPos.position[0], y: currentPos.position[1], z: currentPos.position[2] }, 
      0.03
    );
    camera.lookAt(currentPos.target[0], currentPos.target[1], currentPos.target[2]);
  }, [camera, scrollProgress, currentSection]);

  return null;
};

// Animated Skill Tag Component
const AnimatedSkillTag = ({ skill, level, delay = 0 }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + delay) * 0.1;
    }
  });

  return (
    <div 
      ref={meshRef}
      className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-blue-50 skill-tag"
      style={{ 
        animationDelay: `${delay}s`,
        transform: `translateY(${Math.sin(delay) * 5}px)`
      }}
    >
      <h4 className="text-lg font-bold text-gray-800 mb-2">{skill}</h4>
      <p className="text-gray-600 text-sm">{level}</p>
    </div>
  );
};

// Loading Component
const LoadingScreen = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-100 to-blue-100 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4 mx-auto"></div>
      <p className="text-gray-700 text-lg font-medium">Loading Digital Workshop...</p>
    </div>
  </div>
);

// Main App Component
function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef();

  useEffect(() => {
    // Simulate loading time for 3D assets
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollTop / docHeight;
      setScrollProgress(progress);
      
      const section = Math.floor(progress * 5);
      setCurrentSection(Math.min(section, 4));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="App">
      {/* 3D Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas shadows>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 3, 10]} />
            <CameraController scrollProgress={scrollProgress} currentSection={currentSection} />
            
            {/* Enhanced Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1.2} 
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -5]} intensity={0.4} />
            <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.6} penumbra={1} />
            
            {/* Environment */}
            <Environment preset="studio" />
            <fog attach="fog" args={['#f0f0f0', 15, 25]} />
            
            {/* Custom 3D Model - Ready for your .glb/.gltf file */}
            <CustomModel 
              exploded={exploded} 
              scrollProgress={scrollProgress}
              modelPath="/models/your-mechanical-assembly.glb" // Update this path when you upload your model
            />
            
            {/* Enhanced Controls */}
            <OrbitControls 
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              maxDistance={20}
              minDistance={4}
              maxPolarAngle={Math.PI / 1.8}
              minPolarAngle={Math.PI / 6}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none">
        {/* Enhanced Navigation */}
        <nav className="fixed top-6 right-6 flex flex-col space-y-4 pointer-events-auto">
          <button 
            onClick={() => setExploded(!exploded)}
            className={`${exploded ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 pulse-glow`}
            title={exploded ? "Assemble Model" : "Exploded View"}
          >
            {exploded ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            )}
          </button>
          <div className="text-xs text-center text-gray-600 font-medium">
            {exploded ? 'Exploded' : 'Assembly'}
          </div>
        </nav>

        {/* Enhanced Side Navigation */}
        <div className="fixed left-6 top-1/2 transform -translate-y-1/2 flex flex-col space-y-6 pointer-events-auto">
          {[
            { name: 'Home', icon: '🏠' },
            { name: 'About', icon: '👨‍💼' },
            { name: 'Projects', icon: '🔧' },
            { name: 'Skills', icon: '⚙️' },
            { name: 'Contact', icon: '📧' }
          ].map((item, index) => (
            <div key={item.name} className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const targetY = (window.innerHeight * 5) * (index / 5);
                  window.scrollTo({ top: targetY, behavior: 'smooth' });
                }}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  currentSection === index 
                    ? 'bg-blue-600 scale-150 shadow-lg' 
                    : 'bg-gray-400 hover:bg-gray-600'
                }`}
                title={item.name}
              />
              <span className={`text-sm font-medium transition-all duration-300 ${
                currentSection === index ? 'text-blue-600 opacity-100' : 'text-gray-500 opacity-70'
              }`}>
                {item.icon} {item.name}
              </span>
            </div>
          ))}
        </div>

        {/* Content Sections */}
        
        {/* Landing Section */}
        <div className="h-screen flex items-center justify-end pr-20">
          <div className="max-w-lg text-right pointer-events-auto">
            <h1 className="text-6xl font-bold text-gray-800 mb-4 animate-fade-in">
              Kishore Narayanan
            </h1>
            <h2 className="text-2xl text-blue-600 mb-6 animate-fade-in-delay">
              Mechanical Engineering & Design
            </h2>
            <p className="text-gray-600 text-lg mb-8 animate-fade-in-delay-2">
              Digital blueprints brought to life through intelligent design
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
          <div className="max-w-lg pointer-events-auto bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-blue-100">
            <h3 className="text-4xl font-bold text-gray-800 mb-6">The Architect</h3>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              I'm a mechanical engineer passionate about bringing digital blueprints to life through 
              hardware prototyping and intelligent design. Every project is an opportunity to merge 
              precision engineering with innovative thinking.
            </p>
            <p className="text-gray-600 mb-4">
              Specializing in sensor integration, robotics control systems, and patent-worthy innovations 
              that push the boundaries of what's possible in mechanical design.
            </p>
            <div className="border-l-4 border-blue-600 pl-4 text-blue-700 italic">
              "Every prototype tells a story of precision, innovation, and relentless pursuit of perfection."
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="h-screen flex items-center justify-end pr-20">
          <div className="max-w-2xl pointer-events-auto">
            <h3 className="text-4xl font-bold text-gray-800 mb-8">Case Studies</h3>
            <div className="grid gap-6">
              {[
                {
                  title: "Robotic Arm with BNO055 Motion Control",
                  description: "Advanced 6-DOF robotic arm with precision motion control using BNO055 IMU sensor fusion for real-time orientation feedback and smooth trajectory planning.",
                  tech: "Arduino, C++, IMU Sensors, Servo Control",
                  status: "Patent Pending"
                },
                {
                  title: "IoT System Design for Patent Application",
                  description: "Comprehensive IoT hardware design featuring custom PCB development, sensor integration, and wireless communication protocols for industrial automation.",
                  tech: "ESP32, Custom PCB Design, LoRaWAN, 3D CAD",
                  status: "Patent Filed"
                },
                {
                  title: "Interactive 3D Asset Viewer in Blender",
                  description: "Web-based 3D visualization platform for collaborative engineering design review, featuring real-time model manipulation and annotation systems.",
                  tech: "Blender, Three.js, WebGL, React",
                  status: "Production Ready"
                }
              ].map((project, index) => (
                <div key={index} className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4 border-blue-600">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-gray-800">{project.title}</h4>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 leading-relaxed">{project.description}</p>
                  <span className="text-sm text-blue-600 font-medium">{project.tech}</span>
                </div>
              ))}
            </div>
            <a 
              href="https://github.com/kishore2099" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg"
            >
              View All Projects on GitHub →
            </a>
          </div>
        </div>

        {/* Skills Section */}
        <div className="h-screen flex items-center justify-center">
          <div className="max-w-4xl pointer-events-auto text-center">
            <h3 className="text-4xl font-bold text-gray-800 mb-12">The Toolkit</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { skill: "3D Modeling", level: "Blender, SolidWorks, Fusion 360" },
                { skill: "CAD Design", level: "Advanced Prototyping & Simulation" },
                { skill: "Hardware Prototyping", level: "Arduino, ESP32, Raspberry Pi" },
                { skill: "Sensor Integration", level: "IMU, IoT Devices, Data Fusion" },
                { skill: "Robotics Control", level: "Motion Planning & Control Systems" },
                { skill: "Patent Development", level: "Research, Filing & IP Strategy" }
              ].map((item, index) => (
                <AnimatedSkillTag 
                  key={index}
                  skill={item.skill}
                  level={item.level}
                  delay={index * 0.2}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="h-screen flex items-center justify-center">
          <div className="max-w-lg text-center pointer-events-auto">
            <h3 className="text-4xl font-bold text-gray-800 mb-8">Collaborate</h3>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Ready to transform your mechanical engineering vision into reality? 
              Let's collaborate on building something extraordinary that pushes the 
              boundaries of innovation.
            </p>
            <div className="flex justify-center space-x-6 mb-6">
              <a 
                href="https://www.linkedin.com/in/kishore-narayanan-3aab34277/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>💼</span><span>LinkedIn</span>
              </a>
              <a 
                href="https://github.com/kishore2099" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <span>🔧</span><span>GitHub</span>
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Open to discussing robotics projects, patent collaborations, and innovative engineering solutions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;