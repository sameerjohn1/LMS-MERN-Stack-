import React, { useEffect, useRef, useState } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";
import {
  BookMarked,
  BookOpen,
  Contact,
  Home,
  Menu,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth, useClerk, UserButton, useUser } from "@clerk/clerk-react";

const navItems = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Courses", icon: BookOpen, href: "/courses" },
  { name: "About", icon: BookMarked, href: "/about" },
  { name: "Faculty", icon: Users, href: "/faculty" },
  { name: "Contact", icon: Contact, href: "/contact" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);

  // for clerk
  const { openSignUp } = useClerk();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  // for mobile toggle
  const [isOpen, setIsOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const menuRef = useRef(null);
  const isLoggedIn = isSignedIn && Boolean(localStorage.getItem("token"));

  // INSTANT token removal using Clerk logout event
  useEffect(() => {
    const handleLogout = () => {
      localStorage.removeItem("token");
      console.log("Token removed instantly on Clerk logout event");
    };

    window.addEventListener("user:signed_out", handleLogout);
    return () => window.removeEventListener("user:signed_out", handleLogout);
  }, []);

  // Scroll hide/show
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      if (scrollY > lastScrollY && scrollY > 100) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  //   fetch token
  useEffect(() => {
    const loadToken = async () => {
      if (isSignedIn) {
        const token = await getToken();
        localStorage.setItem("token", token);
        console.log("clerk login token", token);
      }
    };

    loadToken();
  }, [isSignedIn, getToken]);

  //   remove token when signout
  useEffect(() => {
    if (!isSignedIn) {
      localStorage.removeItem("token");
      console.log("Clerk token removed");
    }
  }, [isSignedIn]);

  const desktopLinkClass = (isActive) =>
    `${navbarStyles.desktopNavItem} ${
      isActive ? navbarStyles.desktopNavItemActive : ""
    }`;

  const mobileLinkClasses = (isActive) => `
    ${navbarStyles.mobileMenuItem} ${
    isActive
      ? navbarStyles.mobileMenuItemActive
      : navbarStyles.mobileMenuItemHover
  }
  `;

  return (
    <nav
      className={`${navbarStyles.navbar} ${
        showNavbar ? navbarStyles.navbarVisible : navbarStyles.navbarHidden
      } ${isScrolled ? navbarStyles.scrolled : navbarStyles.navbarDefault}  `}
    >
      <div className={navbarStyles.container}>
        <div className={navbarStyles.innerContainer}>
          {/* LOGO */}
          <div className="flex items-center gap-3 select-none">
            <img src={logo} alt="Logo" className="w-12 h-12" />
            <div className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
              SkillForge
            </div>
          </div>

          {/* Desktop nav */}
          <div className={navbarStyles.desktopNav}>
            <div className={navbarStyles.desktopNavContainer}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/"}
                    className={({ isActive }) => desktopLinkClass(isActive)}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon size={16} className={navbarStyles.desktopNavIcon} />
                      <span className={navbarStyles.desktopNavText}>
                        {item.name}
                      </span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Right Side */}
          <div className={navbarStyles.authContainer}>
            {!isSignedIn ? (
              <button
                type="button"
                onClick={() => openSignUp({})}
                className={
                  navbarStyles.createAccountButton || navbarStyles.loginButton
                }
              >
                <span>Create Account</span>
              </button>
            ) : (
              <div className="flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}

            {/* toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={navbarStyles.mobileMenuButton}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* mobile nav */}
        <div
          ref={menuRef}
          className={`${navbarStyles.mobileMenu} ${
            isOpen ? navbarStyles.mobileMenuOpen : navbarStyles.mobileMenuClosed
          }`}
        >
          <div className={navbarStyles.mobileMenuContainer}>
            <div className={navbarStyles.mobileMenuItems}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === "/"}
                    className={({ isActive }) => mobileLinkClasses(isActive)}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={navbarStyles.mobileMenuIconContainer}>
                      <Icon size={18} className={navbarStyles.mobileMenuIcon} />
                    </div>
                    <span className={navbarStyles.mobileMenuText}>
                      {item.name}
                    </span>
                  </NavLink>
                );
              })}

              {!isSignedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    openSignUp({});
                    setIsOpen(false);
                  }}
                  className={
                    navbarStyles.mobileCreateAccountButton ??
                    navbarStyles.mobileLoginButton
                  }
                >
                  <span>Create Account</span>
                </button>
              ) : (
                <div className="px-4 py-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={navbarStyles.backgroundPattern}>
        <div className={navbarStyles.pattern}></div>
      </div>
    </nav>
  );
};

export default Navbar;
