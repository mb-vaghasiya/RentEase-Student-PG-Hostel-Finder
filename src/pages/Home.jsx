import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PGCard from "../components/PGCard";

function Home() {
    const [pgs, setPgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [sharingFilter, setSharingFilter] = useState("all");
    const [budgetFilter, setBudgetFilter] = useState("all");
    const [foodFilter, setFoodFilter] = useState("all");

    const userRole = localStorage.getItem("userRole");
    const loggedIn = localStorage.getItem("loggedIn") === "true";

    const defaultImages = [
        "/images/pg1.jpg",
        "/images/pg2.jpg",
        "/images/pg3.jpg",
        "/images/pg4.jpg"
    ];

    useEffect(() => {
        async function fetchPGs() {
            try {
                const response = await fetch("http://localhost:5000/api/pgs");
                if (!response.ok) {
                    throw new Error("Failed to load PG listings");
                }
                const data = await response.json();
                setPgs(data);
            } catch (err) {
                setError("Could not connect to backend server. Make sure backend is running.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchPGs();
    }, []);

    const filteredPGs = pgs.filter((pg) => {
        // Search filter
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term ||
            pg.name.toLowerCase().includes(term) ||
            pg.location.toLowerCase().includes(term);

        // Sharing filter
        const matchesSharing = sharingFilter === "all" ||
            (pg.sharing_type && pg.sharing_type.toLowerCase().includes(sharingFilter.toLowerCase()));

        // Budget filter
        const rent = Number(pg.monthly_rent);
        let matchesBudget = true;
        if (budgetFilter !== "all") {
            const max = Number(budgetFilter);
            matchesBudget = !isNaN(max) && rent <= max;
        }

        // Food filter
        let matchesFood = true;
        if (foodFilter === "yes") matchesFood = pg.food_available === true;
        if (foodFilter === "no") matchesFood = pg.food_available === false;

        return matchesSearch && matchesSharing && matchesBudget && matchesFood;
    });

    function resetFilters() {
        setSearchTerm("");
        setSharingFilter("all");
        setBudgetFilter("all");
        setFoodFilter("all");
    }

    return (
        <>
            {/* HERO SECTION */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-text">
                        <p className="small-title">
                            🎓 VERIFIED STUDENT PG & HOSTEL FINDER
                        </p>

                        <h1>
                            Find Your Perfect
                            <span> PG & Hostel</span>
                        </h1>

                        <p>
                            Discover comfortable, affordable, and safe student accommodations near your college campus with transparent pricing and verified owners.
                        </p>

                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search by area, college name, or city (e.g. Adalaj, Ahmedabad)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    const el = document.getElementById("find-pg");
                                    if (el) el.scrollIntoView({ behavior: "smooth" });
                                }}
                            >
                                Search PGs
                            </button>
                        </div>

                        {loggedIn && userRole === "owner" && (
                            <div className="owner-hero-badge">
                                <span>Are you a PG Owner?</span>
                                <Link to="/add-pg" className="owner-cta-btn">
                                    + Add New Listing
                                </Link>
                                <Link to="/my-listings" className="owner-cta-btn secondary">
                                    Manage Listings
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* FIND PG SECTION */}
            <section className="find-pg" id="find-pg">
                <div className="section-title">
                    <p>EXPLORE ACCOMMODATIONS</p>
                    <h2>Available PGs & Hostels</h2>
                    <span>
                        Browse verified accommodations with room choices, amenities, and student reviews.
                    </span>
                </div>

                {/* FILTERS TOOLBAR */}
                <div className="container filters-bar">
                    <div className="filter-group">
                        <label>Room Sharing</label>
                        <select
                            value={sharingFilter}
                            onChange={(e) => setSharingFilter(e.target.value)}
                        >
                            <option value="all">All Room Types</option>
                            <option value="Single">Single Sharing</option>
                            <option value="2 Sharing">2 Sharing</option>
                            <option value="3 Sharing">3 Sharing</option>
                            <option value="4 Sharing">4 Sharing</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Max Budget</label>
                        <select
                            value={budgetFilter}
                            onChange={(e) => setBudgetFilter(e.target.value)}
                        >
                            <option value="all">Any Budget</option>
                            <option value="6000">Up to ₹6,000 / month</option>
                            <option value="8000">Up to ₹8,000 / month</option>
                            <option value="10000">Up to ₹10,000 / month</option>
                            <option value="15000">Up to ₹15,000 / month</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Food Included</label>
                        <select
                            value={foodFilter}
                            onChange={(e) => setFoodFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="yes">Food Available Only</option>
                            <option value="no">Without Food</option>
                        </select>
                    </div>

                    {(searchTerm || sharingFilter !== "all" || budgetFilter !== "all" || foodFilter !== "all") && (
                        <button
                            type="button"
                            className="reset-filters-btn"
                            onClick={resetFilters}
                        >
                            Reset Filters
                        </button>
                    )}
                </div>

                <div className="pg-container">
                    {loading && (
                        <div className="loading-state">
                            <p>Loading verified PG listings...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && filteredPGs.length === 0 && (
                        <div className="empty-state">
                            <p>No PGs match your selected criteria.</p>
                            <button
                                type="button"
                                className="reset-filters-btn"
                                onClick={resetFilters}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}

                    {!loading && !error && filteredPGs.map((pg, index) => {
                        const fallbackImg = defaultImages[index % defaultImages.length];
                        const img = pg.image_url && pg.image_url.trim() ? pg.image_url : fallbackImg;

                        return (
                            <PGCard
                                key={pg.id}
                                id={pg.id}
                                name={pg.name}
                                location={pg.location}
                                price={pg.monthly_rent}
                                image={img}
                                sharingType={pg.sharing_type}
                                available={pg.available_students}
                                foodAvailable={pg.food_available}
                                facilities={pg.facilities}
                                rating={pg.avg_rating}
                                reviewCount={pg.review_count}
                                link={`/pg/${pg.id}`}
                            />
                        );
                    })}
                </div>
            </section>

            {/* ABOUT SECTION */}
            <section className="about-section" id="about">
                <div className="about-container">
                    <div className="about-content">
                        <p className="small-title">
                            ABOUT RENTEASE
                        </p>

                        <h2>
                            Comfortable, Safe & Affordable Student Living
                        </h2>

                        <p>
                            RentEase is designed specifically for students seeking quality PGs and hostels near top universities and colleges. We simplify the housing search by offering verified listings with transparent rates, student reviews, and direct owner contacts.
                        </p>

                        <div className="about-features-grid">
                            <div className="feature-item">
                                <span className="feature-icon">🛡️</span>
                                <h4>Verified Listings</h4>
                                <p>Genuine photos, verified pricing, and real owner profiles.</p>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">⚡</span>
                                <h4>Instant Requests</h4>
                                <p>Book your bed online and track your approval status in real-time.</p>
                            </div>
                            <div className="feature-item">
                                <span className="feature-icon">⭐</span>
                                <h4>Real Student Reviews</h4>
                                <p>Read honest feedback from fellow students before choosing your stay.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default Home;
