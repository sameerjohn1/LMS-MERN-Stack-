import React, { useState } from "react";
import { navbarStyles } from "../assets/dummyStyles";
import logo from "../assets/logo.png";
import { BookMarked, BookOpen, Contact, Home, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
