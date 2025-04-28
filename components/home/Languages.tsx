"use client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  SiTypescript,
  SiNextdotjs,
  SiJavascript,
  SiHtml5,
  SiCss3,
  SiReact,
  SiNodedotjs,
  SiJson,
  SiMarkdown,
} from "react-icons/si";
import { FaPlus } from "react-icons/fa6";
import { FileText } from "lucide-react";

const languages = [
  {
    name: "TypeScript",
    icon: <SiTypescript className="h-12 w-12" />,
    extension: ".ts",
    color: "text-blue-600",
  },
  {
    name: "React",
    icon: <SiReact className="h-12 w-12" />,
    extension: ".tsx",
    color: "text-blue-400",
  },
  {
    name: "JSON",
    icon: <SiJson className="h-12 w-12" />,
    extension: ".json",
    color: "text-gray-500",
  },
  {
    name: "JavaScript",
    icon: <SiJavascript className="h-12 w-12" />,
    extension: ".js",
    color: "text-yellow-400",
  },
  {
    name: "HTML",
    icon: <SiHtml5 className="h-12 w-12" />,
    extension: ".html",
    color: "text-orange-500",
  },
  {
    name: "Node.js",
    icon: <SiNodedotjs className="h-12 w-12" />,
    extension: ".js",
    color: "text-green-500",
  },
  {
    name: "CSS",
    icon: <SiCss3 className="h-12 w-12" />,
    extension: ".css",
    color: "text-blue-500",
  },
  {
    name: "Markdown",
    icon: <SiMarkdown className="h-12 w-12" />,
    extension: ".md",
    color: "text-gray-700",
  },
  {
    name: "Text",
    icon: <FileText className="h-12 w-12" />,
    extension: ".txt",
    color: "text-gray-600",
  },
  {
    name: "JSX",
    icon: <SiReact className="h-12 w-12" />,
    extension: ".jsx",
    color: "text-blue-400",
  },
  {
    name: "And More",
    icon: <FaPlus />,
    extension: "",
    color: "text-purple-400",
  },
];

export default function Languages() {
  return (
    <section id="languages" className="py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 mb-4">
            Enhance Your Workflow
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Work with all your favorite languages and frameworks in real-time
            collaboration
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
              }}
            >
              <Card className="h-full border-muted-foreground/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className={`mb-3 ${lang.color} drop-shadow-lg`}>
                    {lang.icon}
                  </div>
                  <h3 className="text-lg font-medium">{lang.name}</h3>
                  {lang.extension && (
                    <span className="text-sm text-muted-foreground mt-1">
                      {lang.extension}
                    </span>
                  )}
                </CardContent>
              </Card>
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
          <p className="text-muted-foreground">
            Plus many more languages and frameworks supported through our
            extensible system
          </p>
        </motion.div>
      </div>
    </section>
  );
}
