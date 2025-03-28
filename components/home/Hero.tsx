"use client";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Link from "next/link";
import { TypeAnimation } from "react-type-animation";
import { FiArrowRight, FiCode, FiCpu, FiLock, FiZap } from "react-icons/fi";

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const spring = {
    type: "spring",
    damping: 10,
    stiffness: 100,
    restDelta: 0.001,
  };

  return (
    <section
      id="home"
      className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gray-950"
      onMouseMove={handleMouseMove}
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Dynamic radial gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: useMotionTemplate`radial-gradient(600px at ${mouseX}px ${mouseY}px, rgba(34, 211, 238, 0.15), transparent 80%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                  CodeCollab
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                <TypeAnimation
                  sequence={[
                    "Enterprise-grade real-time collaboration",
                    2000,
                    "Zero-latency pair programming",
                    2000,
                    "Secure cloud IDE infrastructure",
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                />
              </p>
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center lg:justify-start gap-3 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[
                { icon: <FiLock />, text: "E2E Encrypted" },
                { icon: <FiZap />, text: "Zero Latency" },
                { icon: <FiCpu />, text: "AI Assisted" },
                { icon: <FiCode />, text: "Multi-Language" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -3 }}
                  transition={spring}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-full text-sm text-cyan-400"
                >
                  {item.icon}
                  {item.text}
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/auth/authenticate" passHref legacyBehavior>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                  className="relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Create Session{" "}
                    <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                  </span>
                </motion.a>
              </Link>

              <motion.a
                href="#features"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                className="px-8 py-4 bg-transparent border-2 border-cyan-400/30 text-white font-medium rounded-lg hover:bg-cyan-400/10 transition-all"
              >
                View Documentation
              </motion.a>
            </motion.div>
          </div>

          {/* Code Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, ...spring }}
            className="hidden lg:block relative h-[400px] rounded-xl overflow-hidden border border-cyan-400/20 shadow-2xl bg-gray-900/50 backdrop-blur-sm"
          >
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="font-mono text-base space-y-2">
                <div className="text-gray-500">
                  // Recursive function to calculate factorial
                </div>
                <div>
                  <span className="text-emerald-400">function</span>{" "}
                  <span className="text-blue-400">factorial</span>(
                  <span className="text-yellow-300">n</span>) <br />
                  {"{"}
                </div>
                <div className="pl-4">
                  <span className="text-gray-500">
                    // Base case: if n is 0, return 1
                  </span>
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">if</span> (
                  <span className="text-yellow-300">n</span>{" "}
                  <span className="text-gray-500">===</span>{" "}
                  <span className="text-orange-400">0</span>) <br />
                  {"{"}
                </div>
                <div className="pl-8">
                  <span className="text-purple-400">return</span>{" "}
                  <span className="text-orange-400">1</span>;
                </div>
                <div className="pl-4">{"}"}</div>

                <div className="pl-4">
                  <span className="text-gray-500">
                    // Recursive call: n * factorial(n - 1)
                  </span>
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">return</span>{" "}
                  <span className="text-yellow-300">n</span>{" "}
                  <span className="text-gray-500">*</span>{" "}
                  <span className="text-blue-400">factorial</span>(
                  <span className="text-yellow-300">n</span>{" "}
                  <span className="text-gray-500">-</span>{" "}
                  <span className="text-orange-400">1</span>);
                </div>
                <div>{"}"}</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center">
          <div className="w-8 h-12 border-2 border-cyan-400/30 rounded-lg flex justify-center">
            <motion.div
              className="w-1 h-3 bg-cyan-400 rounded-full mt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <p className="text-xs text-cyan-400/80 mt-2 tracking-widest">
            SCROLL TO EXPLORE
          </p>
        </div>
      </motion.div>
    </section>
  );
}
