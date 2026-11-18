import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const userName = localStorage.getItem("userName") || "User";
    const userRole = localStorage.getItem("userRole") || "student";
    const [mobileOpen, setMobileOpen] = useState(false);

    function handleLogout() {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userPhone");

        setMobileOpen(false);
        navigate("/login");
    }

    function scrollToSection(id) {
        setMobileOpen(false);
        if (location.pathname === "/") {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                return;
            }
        }
        navigate(`/#${id}`);
    }

    return (
        <header className="header">
            <nav className="navbar">
                <Link to="/" className="logo" onClick={() => setMobileOpen(false)}>
                    Rent<span>ease</span>
                </Link>

                <button
                    className="mobile-toggle"
                    type="button"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation"
                >
                    ☰
                </button>

                <div className={`nav-links ${mobileOpen ? "mobile-show" : ""}`}>
                    <Link
                        className="nav-link"
                        to="/"
                        onClick={() => setMobileOpen(false)}
                    >
                        Home
                    </Link>

                    <button
                        type="button"
                        className="nav-link nav-text-btn"
                        onClick={() => scrollToSection("find-pg")}
                    >
                        Find PG
                    </button>

                    <button
                        type="button"
                        className="nav-link nav-text-btn"
                        onClick={() => scrollToSection("about")}
                    >
                        About
                    </button>

                    {loggedIn && userRole === "student" && (
                        <Link
                            className="nav-link my-bookings-link"
                            to="/my-bookings"
                            onClick={() => setMobileOpen(false)}
                        >
                            📋 My Bookings
                        </Link>
                    )}

                    {loggedIn && userRole === "owner" && (
                        <>
                            <Link
                                className="nav-link my-listings-link"
                                to="/my-listings"
                                onClick={() => setMobileOpen(false)}
                            >
                                🏢 My Listings & Requests
                            </Link>

                            <Link
                                to="/add-pg"
                                className="nav-button add-pg-btn"
                                onClick={() => setMobileOpen(false)}
                            >
                                + Add PG
                            </Link>
                        </>
                    )}

                    {loggedIn ? (
                        <>
                            <div className="nav-user">
                                <span className="user-name">
                                    Hi, {userName}
                                </span>
                                <span className="user-role">
                                    {userRole === "owner" ? "PG Owner" : "Student"}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="nav-button logout-btn"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="nav-button login-btn"
                                onClick={() => setMobileOpen(false)}
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="nav-button register-btn"
                                onClick={() => setMobileOpen(false)}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
