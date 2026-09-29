import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerk, UserButton, useUser } from "@clerk/react";
import logo from "../assets/images/logo.jpeg";

import {
    Menu,
    X,
    Home,
    Map,
    Sparkles,
    Bookmark,
    Star,
    Globe,
    ChevronDown,
} from "lucide-react";

const Navbar = () => {
    const { openSignIn } = useClerk();
    const { user } = useUser();
    const location = useLocation();
    const [mobileMenu, setMobileMenu] = useState(false);

    const navItems = [
        {
            name: "Home",
            path: "/",
            icon: Home,
        },
        {
            name: "Explore",
            path: "/explore",
            icon: Map,
        },
        {
            name: "Plan Trip",
            path: "/plan-my-trip",
            icon: Sparkles,
        },
        {
            name: "AI Guide",
            path: "/ai-guides",
            icon: Sparkles,
        },
        {
            name: "My Trips",
            path: "/my-trip",
            icon: Bookmark,
        },
        {
            name: "Review",
            path: "/review",
            icon: Star,
        },
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
    });

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
            {/* ================= DESKTOP / TOP BAR ================= */}

            <div className="mx-auto flex h-18 max-w-375 items-center justify-between px-5 lg:px-10">
                {/* ================= LOGO ================= */}

                <Link to="/" className="flex items-center gap-3">
                    <div className="relative flex h-15 w-15 items-center justify-center">
                        <img src={logo} alt="Bharatpur AI Logo" className="h-15 w-15 rounded-full object-cover" />
                    </div>

                    <div>
                        <h1 className="text-[22px] font-extrabold leading-none tracking-tight text-slate-800 sm:text-[24px]">
                            Bharatpur Sathii
                        </h1>

                        <p className="mt-1 text-[8px] font-bold tracking-[0.22em] text-slate-500 sm:text-[9px]">
                            YOUR TOURISM GUIDE
                        </p>
                    </div>
                </Link>

                {/* ================= DESKTOP NAVIGATION ================= */}

                <nav className="hidden items-center gap-3 xl:flex">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative flex items-center gap-2 px-3 py-6 text-sm font-medium transition 2xl:px-4 ${isActive ? "text-emerald-700" : "text-slate-600 hover:text-emerald-700"}`}
                            >
                                <Icon size={18} strokeWidth={1.8} />
                                {item.name}

                                {isActive && (
                                    <span className="absolute bottom-0 left-3 right-3 h-0.75 rounded-full bg-emerald-700" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ================= RIGHT SIDE ================= */}

                <div className="hidden items-center gap-3 md:flex">
                    {/* ================= LANGUAGE ================= */}

                    <div className="relative"></div>

                    {/* ================= CLERK USER ================= */}

                    {user ? (
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-11 h-11",
                                },
                            }}
                        />
                    ) : (
                        <button
                            onClick={openSignIn}
                            className="rounded-full bg-emerald-700 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-800 hover:-translate-y-0.5"
                        >
                            {("Sign In")}
                        </button>
                    )}
                </div>

                {/* ================= MOBILE BUTTON ================= */}

                <button
                    onClick={() => setMobileMenu(!mobileMenu)}
                    className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 xl:hidden"
                    aria-label="Toggle menu"
                >
                    {mobileMenu ? <X size={27} /> : <Menu size={27} />}
                </button>
            </div>

            {/* ================= MOBILE MENU ================= */}

            {mobileMenu && (
                <div className="border-t border-slate-100 bg-white px-5 pb-5 xl:hidden">
                    <nav className="flex flex-col gap-1 pt-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenu(false)}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${isActive ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}
                                >
                                    <Icon size={19} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* ================= MOBILE CONTROLS ================= */}

                    <div className="mt-3 flex gap-3 border-t border-slate-100 pt-4">

                        {/* Clerk */}

                        {user ? (
                            <div className="flex items-center justify-center px-2">
                                <UserButton />
                            </div>
                        ) : (
                            <button
                                onClick={openSignIn}
                                className="rounded-xl bg-emerald-700 px-5 font-semibold text-white"
                            >
                                "SignIn"
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;