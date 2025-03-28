"use client";
import { FaHtml5, FaCss3Alt, FaJs, FaReact, FaNodeJs } from "react-icons/fa";
import { SiTypescript, SiJson, SiMarkdown, SiNextdotjs } from "react-icons/si";
import { LuFileText } from "react-icons/lu";
import { motion } from "framer-motion";

const languages = [
  { name: "Next.js", icon: <SiNextdotjs />, extension: "", color: "text-black" },
  { name: "TypeScript", icon: <SiTypescript />, extension: ".ts", color: "text-blue-600" },
  { name: "React TSX", icon: <FaReact />, extension: ".tsx", color: "text-blue-400" },
  { name: "JSON", icon: <SiJson />, extension: ".json", color: "text-gray-500" },
  { name: "JavaScript", icon: <FaJs />, extension: ".js", color: "text-yellow-400" },
  { name: "HTML", icon: <FaHtml5 />, extension: ".html", color: "text-orange-500" },
  { name: "React JSX", icon: <FaReact />, extension: ".jsx", color: "text-blue-400" },
  { name: "Text", icon: <LuFileText />, extension: ".txt", color: "text-gray-600" },
  { name: "Node.js", icon: <FaNodeJs />, extension: ".js", color: "text-green-500" },
  { name: "CSS", icon: <FaCss3Alt />, extension: ".css", color: "text-blue-500" },
  { name: "Markdown", icon: <SiMarkdown />, extension: ".md", color: "text-gray-700" },
  { name: "And Many More", icon: "✨", extension: "", color: "text-purple-400" },
];

export default function Languages() {
  return (
    <section id="languages" className="py-10 bg-gradient-to-b from-gray-900 to-gray-850">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
          Enhance Your Workflow
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Work with all your favorite languages and frameworks in real-time collaboration
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {languages.map((lang, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ 
                y: -5,
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.2)"
              }}
              className={`p-6 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm bg-white/5 border border-gray-700/50 hover:border-cyan-400/30 transition-all duration-300 cursor-default`}
            >
              <div className={`text-5xl mb-3 ${lang.color} drop-shadow-lg`}>
                {lang.icon}
              </div>
              <h3 className="text-lg font-medium text-white">
                {lang.name}
              </h3>
              {lang.extension && (
                <span className="text-sm text-gray-400 mt-1">
                  {lang.extension}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-400">
            Plus many more languages and frameworks supported through our extensible system
          </p>
        </motion.div>
      </div>
    </section>
  );
}
