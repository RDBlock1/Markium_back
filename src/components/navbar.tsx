// components/navbar.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NavItem } from "@/types/market"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signIn, signOut, useSession } from 'next-auth/react';
// Import the wrapper instead of the actual component
import { WalletConnectButton } from "./wallet-connect-buttion-wrapper"

import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { UserMenu } from "./ui/user-menu"
import { toast } from "sonner"

const navItems: NavItem[] = [
  { label: "MARKET", href: "/" },
  { label: "WATCHLIST", href: "/watchlist" },
  { label: "LEADERBOARD", href: "/leaderboard" },
  { label: "USER EXPLORER", href: "/user-profile" },
  { label: "BLOG", href: "/blog" },
  { label: "CONTACT", href: "/contact" }
]


export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const path = usePathname()
  const { data: session } = useSession()
  const activeNavItem = navItems.find(item => item.href === path)?.label

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }
  const handleLogout = async () => {
    console.log('Logging out...');
    try {
      await signOut({ redirect: false });
      toast.success('Logout successful');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  const handleSocialLogin = async (provider: string) => {
    console.log(`Login with ${provider}`);
    try {
      const isOut = await signOut({ redirect: false });

      if (isOut) {
        console.log('Sign out successful');

        const res = await signIn(provider, {
          prompt: 'login',
          callbackUrl: `${window.location.origin}/uptime/new/monitors`,
        });
        console.log('res', res);

        // if (res?) {
        //   console.log('res', res);
        //   console.error('Sign in error:', res.error);
        //   toast.error(mapErrorMessage(res.error), {
        //     duration: 5000, // Optional: Adjust duration if needed
        //   });

        //   return;
        // }
      } else {
        console.log('Sign out failed:', isOut);
      }
    } catch (error) {
      console.log('Error during social login:', error);
    }
    // Implement social login logic
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-dashed border-[#282727]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-white">
              <Image
                src="/markium.jpg"
                alt="Markium Logo"
                width={150}
                height={50}
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.div key={item.label} whileHover={{ y: -2 }} className="relative">
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200 py-2 px-1",
                    activeNavItem === item.label ? "text-[#00D395]" : "text-gray-400 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Desktop Login Button */}
          <div className="hidden md:flex items-center ">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <WalletConnectButton />
            </motion.div>


            {
              session?.user ? (
                // i have to show user profile photo and name
                <UserMenu
                  name={session.user.name!}
                  email={session.user.email!}
                  imageUrl={session.user.image!}
                  onLogout={handleLogout}
                />
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="w-fit py-2 px-4 ml-4 flex items-center space-x-2"
                >
                  Login
                </Button>
              )
            }

          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMobileMenu}
              className="text-white hover:text-gray-300 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-[#1a1a1a] bg-[#0A0B0D]/95 backdrop-blur-sm"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "block px-3 py-2 text-base font-medium transition-colors duration-200 rounded-md",
                        activeNavItem === item.label
                          ? "text-white bg-[#00D395]/10 border-l-2 border-[#00D395]"
                          : "text-gray-400 hover:text-white hover:bg-white/5",
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                  className="pt-4 border-t border-[#1a1a1a] mt-4 flex  justify-around items-center space-x-4"
                >
                  <WalletConnectButton />

                  {
                    session?.user ? (
                      // i have to show user profile photo and name
                      <UserMenu
                        name={session.user.name!}
                        email={session.user.email!}
                        imageUrl={session.user.image!}
                        onLogout={handleLogout}
                      />
                    ) : (
                      <Button
                        variant="default"
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className="w-fit py-2 px-12  flex items-center space-x-2"
                      >
                        Login
                      </Button>
                    )
                  }
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}