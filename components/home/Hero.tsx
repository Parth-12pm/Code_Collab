"use client"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import type React from "react"

import Link from "next/link"
import { TypeAnimation } from "react-type-animation"
import { ArrowRight, Code, Shield, Zap, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Hero() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const spring = {
    type: "spring",
    damping: 10,
    stiffness: 100,
    restDelta: 0.001,
  }

  return (
    <section
      id="home"
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
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
          background: useMotionTemplate`radial-gradient(600px at ${mouseX}px ${mouseY}px, rgba(var(--primary), 0.15), transparent 80%)`,
        }}
      />

      <div className="relative z-10 container py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                  CodeCollab
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
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
                  repeat={Number.POSITIVE_INFINITY}
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
                { icon: <Shield className="h-3 w-3" />, text: "E2E Encrypted" },
                { icon: <Zap className="h-3 w-3" />, text: "Zero Latency" },
                { icon: <Cpu className="h-3 w-3" />, text: "AI Assisted" },
                { icon: <Code className="h-3 w-3" />, text: "Multi-Language" },
              ].map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1 py-1.5">
                  {item.icon}
                  {item.text}
                </Badge>
              ))}
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link href="/auth/authenticate" passHref>
                <Button size="lg" className="group">
                  Create Session
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Button size="lg" variant="outline" asChild>
                <a href="#features">View Documentation</a>
              </Button>
            </motion.div>
          </div>

          {/* Code Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, ...spring }}
            className="hidden lg:block relative h-[400px] rounded-xl overflow-hidden border shadow-xl bg-card/50 backdrop-blur-sm"
          >
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="font-mono text-base space-y-2">
                <div className="text-muted-foreground">// Recursive function to calculate factorial</div>
                <div>
                  <span className="text-emerald-400">function</span> <span className="text-blue-400">factorial</span>(
                  <span className="text-yellow-300">n</span>) <br />
                  {"{"}
                </div>
                <div className="pl-4">
                  <span className="text-muted-foreground">// Base case: if n is 0, return 1</span>
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">if</span> (<span className="text-yellow-300">n</span>{" "}
                  <span className="text-muted-foreground">===</span> <span className="text-orange-400">0</span>) <br />
                  {"{"}
                </div>
                <div className="pl-8">
                  <span className="text-purple-400">return</span> <span className="text-orange-400">1</span>;
                </div>
                <div className="pl-4">{"}"}</div>

                <div className="pl-4">
                  <span className="text-muted-foreground">// Recursive call: n * factorial(n - 1)</span>
                </div>
                <div className="pl-4">
                  <span className="text-purple-400">return</span> <span className="text-yellow-300">n</span>{" "}
                  <span className="text-muted-foreground">*</span> <span className="text-blue-400">factorial</span>(
                  <span className="text-yellow-300">n</span> <span className="text-muted-foreground">-</span>{" "}
                  <span className="text-orange-400">1</span>);
                </div>
                <div>{"}"}</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        <div className="flex flex-col items-center">
          <div className="w-8 h-12 border-2 border-primary/30 rounded-lg flex justify-center">
            <motion.div
              className="w-1 h-3 bg-primary rounded-full mt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
          <p className="text-xs text-primary/80 mt-2 tracking-widest">SCROLL TO EXPLORE</p>
        </div>
      </motion.div>
    </section>
  )
}
