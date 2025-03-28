"use client";
import { motion } from "framer-motion";
import { MessageSquare, MousePointerClick, Code, Video, BrainCircuit, GitBranch, Share2, Clock, Eye } from "lucide-react";

const features = [
  { 
    title: "Real-Time Chat", 
    description: "Communicate instantly with markdown support", 
    icon: <MessageSquare />,
    color: "text-cyan-400"
  },
  { 
    title: "Cursor Tracking", 
    description: "See collaborators' cursors in real-time", 
    icon: <MousePointerClick />,
    color: "text-blue-400"
  },
  { 
    title: "Live Editing", 
    description: "Code together with syntax highlighting", 
    icon: <Code />,
    color: "text-purple-400"
  },
  { 
    title: "Video Calls", 
    description: "Integrated HD video conferencing", 
    icon: <Video />,
    color: "text-pink-400"
  },
  { 
    title: "AI Assistance", 
    description: "Smart code completions powered by AI", 
    icon: <BrainCircuit />,
    color: "text-indigo-400"
  },
  { 
    title: "Git Integration", 
    description: "Version control without leaving the editor", 
    icon: <GitBranch />,
    color: "text-green-400"
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Consistent header styling with Languages section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
            Core Features
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need for seamless pair programming
          </p>
        </motion.div>

        {/* Feature cards matching your dark theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -5,
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                borderColor: "rgba(59, 130, 246, 0.5)"
              }}
              className="p-8 rounded-xl border border-gray-700 bg-gray-800/50 backdrop-blur-sm transition-all duration-300"
            >
              <div className={`text-5xl mb-6 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Subtle footer note matching your style */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-500">
            Plus many more features designed for developer collaboration
          </p>
        </motion.div>
      </div>
    </section>
  );
}
