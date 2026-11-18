import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function PGDetails() {
    const params = useParams();
    // Support either /pg/:id or legacy /pg:id matching
    const id = params.id ? params.id.replace(/^pg/, "") : "";

    const [pg, setPg] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Booking state
    const [moveInDate, setMoveInDate] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingMsg, setBookingMsg] = useState({ text: "", type: "" });

    // Review form state
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMsg, setReviewMsg] = useState({ text: "", type: "" });

    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        async function fetchPGAndReviews() {
            if (!id) {
                setError("Invalid PG specified.");
                setLoading(false);
                return;
            }

            try {
                // Fetch single PG
                const pgRes = await fetch(`http://localhost:5000/api/pgs/${id}`);
                if (!pgRes.ok) {
                    if (pgRes.status === 404) {
                        throw new Error("This PG listing does not exist.");
                    }
                    throw new Error("Could not fetch PG details.");
                }
                const pgData = await pgRes.json();
                setPg(pgData);

                // Fetch PG reviews
                const reviewsRes = await fetch(`http://localhost:5000/api/pgs/${id}/reviews`);
                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    setReviews(reviewsData);
                }
            } catch (err) {
                console.error("PG details error:", err);
                setError(err.message || "Unable to load PG details. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        fetchPGAndReviews();
    }, [id]);

    async function handleBookPG(e) {
        e.preventDefault();
        setBookingMsg({ text: "", type: "" });

        if (!loggedIn) {
            setBookingMsg({
                text: "Please login with a Student account to book this PG.",
                type: "error"
            });
            return;
        }

        if (userRole !== "student") {
            setBookingMsg({
                text: "Only students can book a PG accommodation.",
                type: "error"
            });
            return;
        }

        if (!moveInDate) {
            setBookingMsg({
                text: "Please choose your intended move-in date.",
                type: "error"
            });
            return;
        }

        setBookingLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: Number(userId),
                    pg_id: Number(id),
                    move_in_date: moveInDate
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit booking request.");
            }

            setBookingMsg({
                text: "Booking request submitted successfully! The owner will review your request.",
                type: "success"
            });
            setMoveInDate("");
        } catch (err) {
            setBookingMsg({ text: err.message, type: "error" });
        } finally {
            setBookingLoading(false);
        }
    }

    async function handleReviewSubmit(e) {
        e.preventDefault();
        setReviewMsg({ text: "", type: "" });

        if (!reviewComment.trim()) {
            setReviewMsg({ text: "Please enter your review comments.", type: "error" });
            return;
        }

        setReviewLoading(true);

        try {
            const res = await fetch(`http://localhost:5000/api/pgs/${id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_id: userId ? Number(userId) : null,
                    rating: Number(reviewRating),
                    comment: reviewComment.trim()
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit review.");
            }

            setReviewMsg({ text: "Thank you! Your review has been added.", type: "success" });
            setReviewComment("");
            setReviewRating(5);

            // Prepend new review to list
            if (data.review) {
                setReviews([data.review, ...reviews]);
            }
        } catch (err) {
            setReviewMsg({ text: err.message, type: "error" });
        } finally {
            setReviewLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="pg-detail loading-container">
                <h2>Loading PG details...</h2>
            </div>
        );
    }

    if (error || !pg) {
        return (
            <div className="pg-detail">
                <div className="detail-error-box">
                    <h2>{error || "PG Not Found"}</h2>
                    <p>The requested accommodation listing could not be found or was removed.</p>
                    <Link to="/" className="back-button">
                        ← Go Back Home
                    </Link>
                </div>
            </div>
        );
    }

    const image = pg.image_url && pg.image_url.trim() ? pg.image_url : "/images/pg1.jpg";
    const map = pg.map_url && pg.map_url.trim()
        ? pg.map_url
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pg.location + " " + pg.name)}`;

    const todayString = new Date().toISOString().split("T")[0];

    return (
        <div className="pg-detail">
            <Link to="/" className="back-button">
                ← Back to All PGs
            </Link>

            <div className="pg-detail-card">
                <div className="detail-image">
                    <img
                        src={image}
                        alt={pg.name}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/pg1.jpg";
                        }}
                    />
                </div>

                <div className="detail-header-row">
                    <div>
                        <h1>{pg.name}</h1>
                        <p className="detail-location">📍 {pg.location}</p>
                    </div>
                    {pg.avg_rating > 0 && (
                        <div className="detail-rating-pill">
                            ★ {Number(pg.avg_rating).toFixed(1)} / 5.0
                            <span className="reviews-count">({reviews.length} reviews)</span>
                        </div>
                    )}
                </div>

                <div className="detail-price">
                    ₹{Number(pg.monthly_rent).toLocaleString("en-IN")}
                    <span className="per-month"> / month</span>
                </div>

                {/* PG KEY INFORMATION */}
                <div className="detail-section">
                    <h2>Key Information</h2>

                    <div className="detail-grid">
                        <div>
                            <strong>Room Type</strong>
                            <p>{pg.sharing_type || "Standard Sharing"}</p>
                        </div>

                        <div>
                            <strong>Available Beds</strong>
                            <p className={pg.available_students > 0 ? "text-success" : "text-danger"}>
                                {pg.available_students > 0
                                    ? `${pg.available_students} Student Places Available`
                                    : "Fully Occupied"}
                            </p>
                        </div>

                        <div>
                            <strong>Food Service</strong>
                            <p>
                                {pg.food_available === true
                                    ? "✓ Food Included"
                                    : pg.food_available === false
                                    ? "✗ Self / Not Provided"
                                    : "Contact Owner"}
                            </p>
                        </div>

                        <div>
                            <strong>Security Deposit</strong>
                            <p>
                                {pg.security_deposit != null
                                    ? `₹${Number(pg.security_deposit).toLocaleString("en-IN")}`
                                    : "₹" + Number(pg.monthly_rent).toLocaleString("en-IN")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FACILITIES */}
                <div className="detail-section">
                    <h2>Facilities & Amenities</h2>

                    {pg.facilities && pg.facilities.length > 0 ? (
                        <div className="facility-list">
                            {pg.facilities.map((facility, index) => (
                                <span key={index}>✓ {facility}</span>
                            ))}
                        </div>
                    ) : (
                        <p>Standard student amenities provided. Please contact the owner for details.</p>
                    )}
                </div>

                {/* RULES */}
                <div className="detail-section">
                    <h2>PG Rules & Guidelines</h2>

                    {pg.rules && pg.rules.length > 0 ? (
                        <ul className="rules">
                            {pg.rules.map((rule, index) => (
                                <li key={index}>{rule}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>Standard student conduct rules apply.</p>
                    )}
                </div>

                {/* OWNER DETAILS & MAP */}
                <div className="detail-section">
                    <h2>Owner & Contact Information</h2>

                    <div className="owner-box">
                        <p>
                            <strong>Owner / Manager:</strong>{" "}
                            {pg.owner_name || "PG Administrator"}
                        </p>

                        <p>
                            <strong>Experience:</strong>{" "}
                            {pg.owner_experience || "Verified PG Owner"}
                        </p>

                        <p>
                            <strong>Contact Phone:</strong>{" "}
                            {pg.owner_phone || "Not specified"}
                        </p>

                        <div className="action-buttons-row">
                            {pg.owner_phone && (
                                <a
                                    href={`tel:${pg.owner_phone.replace(/\s+/g, "")}`}
                                    className="contact-button"
                                >
                                    📞 Call Owner
                                </a>
                            )}

                            <a
                                href={map}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-button"
                            >
                                🗺️ View Location on Map
                            </a>
                        </div>
                    </div>
                </div>

                {/* BOOKING SECTION */}
                <div className="detail-section booking-box">
                    <h2>Book Your Stay</h2>

                    {pg.available_students <= 0 ? (
                        <div className="alert-box alert-warning">
                            ⚠️ This PG is currently fully occupied. Check back soon or contact the owner directly for upcoming vacancies.
                        </div>
                    ) : !loggedIn ? (
                        <div className="booking-login-prompt">
                            <p>Are you a student planning to move in?</p>
                            <Link to="/login" className="pg-button">
                                Sign In to Book This PG
                            </Link>
                        </div>
                    ) : userRole === "owner" ? (
                        <p className="owner-note">
                            ℹ️ You are viewing this listing as a Property Owner. Student bookings will appear in your dashboard.
                        </p>
                    ) : (
                        <form onSubmit={handleBookPG} className="booking-form">
                            {bookingMsg.text && (
                                <div className={`alert-box alert-${bookingMsg.type}`}>
                                    {bookingMsg.text}
                                    {bookingMsg.type === "success" && (
                                        <div style={{ marginTop: "8px" }}>
                                            <Link to="/my-bookings" className="small-link">
                                                View in My Bookings →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}

                            <label htmlFor="moveInInput">
                                Select Intended Move-in Date:
                            </label>
                            <input
                                id="moveInInput"
                                type="date"
                                min={todayString}
                                value={moveInDate}
                                onChange={(e) => setMoveInDate(e.target.value)}
                                required
                            />

                            <button
                                type="submit"
                                className="book-now-button"
                                disabled={bookingLoading}
                            >
                                {bookingLoading ? "Submitting Request..." : "Request to Book This PG"}
                            </button>
                        </form>
                    )}
                </div>

                {/* REVIEWS & RATINGS SECTION */}
                <div className="detail-section reviews-section">
                    <h2>Student Reviews & Ratings</h2>

                    {reviews.length === 0 ? (
                        <p className="no-reviews">
                            No student reviews yet. Be the first to share your experience!
                        </p>
                    ) : (
                        <div className="reviews-list">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="review-card">
                                    <div className="review-top">
                                        <span className="reviewer-name">
                                            👤 {rev.student_name || "Verified Student"}
                                        </span>
                                        <span className="review-stars">
                                            {"★".repeat(rev.rating)}
                                            {"☆".repeat(5 - rev.rating)}
                                        </span>
                                    </div>
                                    <p className="review-comment">"{rev.comment}"</p>
                                    <span className="review-date">
                                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ADD REVIEW FORM */}
                    {loggedIn && userRole === "student" && (
                        <div className="add-review-box">
                            <h3>Write a Review</h3>

                            {reviewMsg.text && (
                                <div className={`alert-box alert-${reviewMsg.type}`}>
                                    {reviewMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleReviewSubmit}>
                                <label>Your Rating:</label>
                                <select
                                    value={reviewRating}
                                    onChange={(e) => setReviewRating(e.target.value)}
                                >
                                    <option value="5">★★★★★ (5 Stars - Excellent)</option>
                                    <option value="4">★★★★☆ (4 Stars - Very Good)</option>
                                    <option value="3">★★★☆☆ (3 Stars - Average)</option>
                                    <option value="2">★★☆☆☆ (2 Stars - Below Average)</option>
                                    <option value="1">★☆☆☆☆ (1 Star - Poor)</option>
                                </select>

                                <label>Your Feedback / Experience:</label>
                                <textarea
                                    rows="3"
                                    placeholder="Tell future students about room cleanliness, food quality, Wi-Fi speed, and owner behavior..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    required
                                />

                                <button
                                    type="submit"
                                    className="submit-review-btn"
                                    disabled={reviewLoading}
                                >
                                    {reviewLoading ? "Submitting..." : "Post Review"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PGDetails;
