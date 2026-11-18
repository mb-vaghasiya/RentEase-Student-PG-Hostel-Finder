import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState("");

    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");

    useEffect(() => {
        async function fetchBookings() {
            if (!userId) {
                setError("Please log in to view your bookings.");
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`http://localhost:5000/api/bookings/student/${userId}`);
                if (!res.ok) {
                    throw new Error("Could not load your bookings.");
                }
                const data = await res.json();
                setBookings(data);
            } catch (err) {
                console.error(err);
                setError(err.message || "Unable to fetch bookings.");
            } finally {
                setLoading(false);
            }
        }

        fetchBookings();
    }, [userId]);

    async function handleCancelBooking(bookingId) {
        if (!window.confirm("Are you sure you want to cancel this booking request?")) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "cancelled" })
            });

            if (!res.ok) {
                throw new Error("Failed to cancel booking.");
            }

            setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
            setActionMsg("Booking request cancelled successfully.");
            setTimeout(() => setActionMsg(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to cancel booking.");
        }
    }

    function getStatusBadge(status) {
        switch (status) {
            case "approved":
                return <span className="status-badge status-approved">✓ Approved</span>;
            case "rejected":
                return <span className="status-badge status-rejected">✗ Rejected</span>;
            case "cancelled":
                return <span className="status-badge status-cancelled">Cancelled</span>;
            case "pending":
            default:
                return <span className="status-badge status-pending">⏳ Pending Review</span>;
        }
    }

    return (
        <div className="bookings-page">
            <div className="container">
                <div className="page-header">
                    <h1>My PG Bookings</h1>
                    <p>Track the status of your accommodation requests for {userName || "Student"}</p>
                </div>

                {actionMsg && (
                    <div className="alert-box alert-success">
                        {actionMsg}
                    </div>
                )}

                {loading && (
                    <div className="loading-state">
                        <p>Loading your booking requests...</p>
                    </div>
                )}

                {error && (
                    <div className="alert-box alert-error">
                        {error}
                    </div>
                )}

                {!loading && !error && bookings.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🏠</div>
                        <h3>No Bookings Yet</h3>
                        <p>You haven't requested any PG accommodations yet. Start exploring student stays today!</p>
                        <Link to="/" className="pg-button">
                            Browse Available PGs
                        </Link>
                    </div>
                )}

                {!loading && !error && bookings.length > 0 && (
                    <div className="bookings-grid">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="booking-card">
                                <div className="booking-card-header">
                                    <div>
                                        <h3>{booking.pg_name}</h3>
                                        <p className="booking-location">📍 {booking.pg_location}</p>
                                    </div>
                                    <div>
                                        {getStatusBadge(booking.status)}
                                    </div>
                                </div>

                                <div className="booking-details-grid">
                                    <div>
                                        <span className="label">Monthly Rent</span>
                                        <span className="value">₹{Number(booking.monthly_rent).toLocaleString("en-IN")}/mo</span>
                                    </div>

                                    <div>
                                        <span className="label">Intended Move-in</span>
                                        <span className="value">
                                            {booking.move_in_date ? new Date(booking.move_in_date).toLocaleDateString() : "Flexible"}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="label">Requested On</span>
                                        <span className="value">
                                            {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "Recent"}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="label">Owner Contact</span>
                                        <span className="value">
                                            {booking.owner_name || "Owner"}
                                            {booking.owner_phone ? ` (${booking.owner_phone})` : ""}
                                        </span>
                                    </div>
                                </div>

                                <div className="booking-card-actions">
                                    <Link to={`/pg/${booking.pg_id}`} className="view-link">
                                        View PG Details →
                                    </Link>

                                    {booking.owner_phone && (
                                        <a
                                            href={`tel:${booking.owner_phone.replace(/\s+/g, "")}`}
                                            className="call-owner-btn"
                                        >
                                            📞 Call Owner
                                        </a>
                                    )}

                                    {booking.status === "pending" && (
                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => handleCancelBooking(booking.id)}
                                        >
                                            Cancel Request
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyBookings;
