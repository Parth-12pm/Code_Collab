"use client";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { FiCode, FiMenu, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import Logo from "./Logo";
import Link from "next/link";
import { ModeToggle } from "../ui/toggle-btn";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10);
  });

  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Languages", link: "#languages" },
    { name: "Contact", link: "#foot" },
  ];

  // Close mobile menu when clicking a link
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [mobileOpen]);

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-gray-900/95 backdrop-blur-lg border-b border-gray-800/50 py-3 shadow-xl"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Logo/Brand */}
          <motion.a
            href="#home"
            className="flex items-center group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Logo className="h-10 w-10 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              CodeCollab
            </span>
          </motion.a>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.li
                key={index}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <a
                  href={item.link}
                  className="relative px-1 py-2 text-gray-300 hover:text-white text-sm font-medium tracking-wide transition-colors duration-300"
                >
                  <span className="relative">
                    {item.name}
                    <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 hover:w-full"></span>
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button - Updated with Link */}
          <motion.div
            className="hidden md:block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Link href="/auth/authenticate" passHref legacyBehavior>
              <motion.a className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center gap-2">
                <FiCode className="h-4 w-4" />
                Start Coding
              </motion.a>
            </Link>
          </motion.div>
          <ModeToggle />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 focus:outline-none z-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: mobileOpen ? 1 : 0, x: mobileOpen ? "0%" : "100%" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 bg-gray-900/95 backdrop-blur-lg z-40 md:hidden pt-24 px-6"
        style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
      >
        <ul className="flex flex-col space-y-8">
          {navItems.map((item, index) => (
            <motion.li
              key={index}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: mobileOpen ? 0 : 50, opacity: mobileOpen ? 1 : 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <a
                href={item.link}
                className="text-2xl font-medium text-gray-300 hover:text-white py-3 block border-b border-gray-800"
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </a>
            </motion.li>
          ))}
        </ul>

        {/* Mobile CTA Button - Updated with Link */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: mobileOpen ? 0 : 20, opacity: mobileOpen ? 1 : 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Link href="/AuthPage" passHref legacyBehavior>
            <motion.a
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-lg shadow-lg flex items-center justify-center gap-3"
              onClick={() => setMobileOpen(false)}
            >
              <FiCode className="h-5 w-5" />
              Start Coding Session
            </motion.a>
          </Link>
        </motion.div>
      </motion.div>
    </>
  );
}
