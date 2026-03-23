"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Activity, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  const navLinks = [
    { href: "/product", labelKey: "nav.product" },
    { href: "/#how-it-works", labelKey: "nav.howItWorks" },
    { href: "/safety", labelKey: "nav.safety" },
    { href: "/clinics", labelKey: "nav.clinics" },
  ];

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
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "glass border-b border-white/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container-custom flex h-16 items-center justify-between" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2" aria-label="MedNavigator AI home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-brand transition-transform group-hover:scale-105">
            <Activity className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            MedNavigator <span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-brand-50 text-brand-600"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher variant="pill" />
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white gradient-brand shadow-brand transition-all duration-200 hover:-translate-y-px hover:shadow-brand-lg"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {t("nav.getStarted")}
          </Link>
        </div>

        {/* Mobile: language + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="minimal" />
          <button
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
            className="glass border-b border-white/50 md:hidden"
          >
            <div className="container-custom flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-brand-50 text-brand-600"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                <Link
                  href="/chat"
                  className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white gradient-brand"
                >
                  {t("nav.getStarted")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
