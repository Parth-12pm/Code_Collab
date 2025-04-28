"use client"
import { motion } from "framer-motion"
import { MessageSquare, MousePointerClick, Code, Video, BrainCircuit, GitBranch } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Real-Time Chat",
    description: "Communicate instantly with markdown support",
    icon: <MessageSquare className="h-10 w-10" />,
  },
  {
    title: "Cursor Tracking",
    description: "See collaborators' cursors in real-time",
    icon: <MousePointerClick className="h-10 w-10" />,
  },
  {
    title: "Live Editing",
    description: "Code together with syntax highlighting",
    icon: <Code className="h-10 w-10" />,
  },
  {
    title: "Video Calls",
    description: "Integrated HD video conferencing",
    icon: <Video className="h-10 w-10" />,
  },
  {
    title: "AI Assistance",
    description: "Smart code completions powered by AI",
    icon: <BrainCircuit className="h-10 w-10" />,
  },
  {
    title: "Git Integration",
    description: "Version control without leaving the editor",
    icon: <GitBranch className="h-10 w-10" />,
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 mb-4">
            Core Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need for seamless pair programming
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-muted-foreground/20 bg-card/50 backdrop-blur-sm h-full transition-all duration-300">
                <CardHeader>
                  <div className="text-primary mb-4">{feature.icon}</div>
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground">Plus many more features designed for developer collaboration</p>
        </motion.div>
      </div>
    </section>
  )
}
