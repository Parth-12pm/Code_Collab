"use client";
import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/toggle-btn";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Code, Menu } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10);
  });

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Languages", link: "#languages" },
    { name: "Contact", link: "#foot" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-lg border-b py-3 shadow-lg"
          : "bg-transparent py-4"
      )}
    >
      <div className="container flex justify-between items-center">
        {/* Logo */}
        <motion.a
          href="#home"
          className="flex items-center group"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="relative flex items-center">
            <Code className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
              CodeCollab
            </span>
          </div>
        </motion.a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center space-x-6">
            {navItems.map((item, index) => (
              <motion.li
                key={index}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <a
                  href={item.link}
                  className="relative px-1 py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-300"
                >
                  <span className="relative">
                    {item.name}
                    <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/auth/authenticate" passHref>
              <Button className="gap-2" size="sm">
                <Code className="h-4 w-4" />
                Start Coding
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-4 md:hidden">
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-8 pt-10">
                <ul className="flex flex-col gap-4">
                  {navItems.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <a
                        href={item.link}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {item.name}
                      </a>
                    </motion.li>
                  ))}
                </ul>
                <Link href="/auth/authenticate" passHref>
                  <Button className="w-full gap-2">
                    <Code className="h-4 w-4" />
                    Start Coding
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
