"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/safety", label: "Safety" },
  { href: "/clinics", label: "For Clinics" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass border-b border-white/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container-custom flex h-16 items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="MedNavigator AI home">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-brand transition-transform group-hover:scale-105">
            <Activity className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">
            MedNavigator <span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-brand-600 bg-brand-50"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden glass border-b border-white/50"
          >
            <div className="container-custom py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-brand-600 bg-brand-50"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
                <Link
                  href="/contact"
                  className="px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/demo"
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white text-center gradient-brand"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
