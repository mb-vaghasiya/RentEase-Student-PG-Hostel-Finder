import { Link } from "react-router-dom";

function PGCard({
    name,
    location,
    price,
    image,
    sharingType = "Student PG",
    available = 0,
    facilities = [],
    rating = 0,
    reviewCount = 0,
    link
}) {
    const displayImage = image || "/images/pg1.jpg";
    const displayFacilities = Array.isArray(facilities) && facilities.length > 0
        ? facilities.slice(0, 4)
        : ["Wi-Fi", "Water", "Electricity"];

    return (
        <div className="pg-card">
            <div className="pg-image">
                <img
                    src={displayImage}
                    alt={name}
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/images/pg1.jpg";
                    }}
                />
                {rating > 0 && (
                    <span className="card-rating-badge">
                        ★ {Number(rating).toFixed(1)} {reviewCount > 0 ? `(${reviewCount})` : ""}
                    </span>
                )}
            </div>

            <div className="pg-content">
                <h3>{name}</h3>

                <p className="pg-location">
                    📍 {location}
                </p>

                <p className="pg-description">
                    Comfortable and affordable student accommodation with verified amenities.
                </p>

                <div className="pg-info">
                    <span>
                        ₹{Number(price).toLocaleString("en-IN")}/month
                    </span>
                    <span className="sharing-badge">
                        {sharingType}
                    </span>
                </div>

                <p className="available">
                    <strong>Availability:</strong>{" "}
                    {available > 0 ? (
                        <span className="avail-count avail-open">
                            {available} {available === 1 ? "Bed" : "Beds"} left
                        </span>
                    ) : (
                        <span className="avail-count avail-full">
                            Fully Occupied
                        </span>
                    )}
                </p>

                <div className="pg-facilities">
                    {displayFacilities.map((f, i) => (
                        <span key={i}>{f}</span>
                    ))}
                </div>

                <Link to={link} className="pg-button">
                    View Details
                </Link>
            </div>
        </div>
    );
}

export default PGCard;
