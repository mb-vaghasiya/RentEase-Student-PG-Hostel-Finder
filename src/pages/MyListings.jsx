import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function MyListings() {
    const [activeTab, setActiveTab] = useState("listings");
    const [pgs, setPgs] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState("");

    // Editing modal state
    const [editingPG, setEditingPG] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        location: "",
        monthly_rent: "",
        sharing_type: "",
        available_students: "",
        food_available: true,
        security_deposit: "",
        owner_phone: "",
        facilities: "",
        rules: ""
    });
    const [saving, setSaving] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);

    const userId = localStorage.getItem("userId");

    useEffect(() => {
        let ignore = false;

        async function fetchData() {
            try {
                // Load owner's listings
                const pgsRes = await fetch(`http://localhost:5000/api/pgs?owner_id=${userId}`);
                if (pgsRes.ok && !ignore) {
                    const pgsData = await pgsRes.json();
                    setPgs(pgsData);
                }

                // Load bookings for this owner
                const bookingsRes = await fetch(`http://localhost:5000/api/bookings/owner/${userId}`);
                if (bookingsRes.ok && !ignore) {
                    const bookingsData = await bookingsRes.json();
                    setBookings(bookingsData);
                }
            } catch (err) {
                console.error(err);
                if (!ignore) setError("Failed to load management dashboard data.");
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        fetchData();

        return () => {
            ignore = true;
        };
    }, [userId, refreshKey]);

    async function handleStatusUpdate(bookingId, newStatus) {
        try {
            const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) {
                throw new Error("Failed to update status.");
            }

            setActionMsg(`Booking request marked as ${newStatus}!`);
            setTimeout(() => setActionMsg(""), 4000);
            setRefreshKey(k => k + 1);
        } catch (err) {
            alert(err.message || "Failed to update booking status.");
        }
    }

    async function handleDeletePG(pgId) {
        if (!window.confirm("Are you sure you want to delete this PG listing? All reviews and bookings for it will also be deleted.")) {
            return;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/pgs/${pgId}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                throw new Error("Failed to delete PG listing.");
            }

            setPgs(pgs.filter(p => p.id !== pgId));
            setActionMsg("PG listing deleted successfully.");
            setTimeout(() => setActionMsg(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to delete PG.");
        }
    }

    function openEditModal(pg) {
        setEditingPG(pg);
        setEditForm({
            name: pg.name || "",
            location: pg.location || "",
            monthly_rent: pg.monthly_rent || "",
            sharing_type: pg.sharing_type || "2 Sharing",
            available_students: pg.available_students ?? 0,
            food_available: pg.food_available ?? true,
            security_deposit: pg.security_deposit || "",
            owner_phone: pg.owner_phone || "",
            facilities: Array.isArray(pg.facilities) ? pg.facilities.join(", ") : "",
            rules: Array.isArray(pg.rules) ? pg.rules.join(", ") : ""
        });
    }

    async function handleSaveEdit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`http://localhost:5000/api/pgs/${editingPG.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...editForm,
                    monthly_rent: Number(editForm.monthly_rent),
                    available_students: Number(editForm.available_students),
                    security_deposit: editForm.security_deposit === "" ? null : Number(editForm.security_deposit),
                    facilities: editForm.facilities.split(",").map(i => i.trim()).filter(Boolean),
                    rules: editForm.rules.split(",").map(i => i.trim()).filter(Boolean)
                })
            });

            if (!res.ok) {
                throw new Error("Failed to save changes.");
            }

            const data = await res.json();
            setPgs(pgs.map(p => p.id === editingPG.id ? data.pg : p));
            setEditingPG(null);
            setActionMsg("PG listing updated successfully!");
            setTimeout(() => setActionMsg(""), 4000);
        } catch (err) {
            alert(err.message || "Failed to save PG updates.");
        } finally {
            setSaving(false);
        }
    }

    const pendingBookingsCount = bookings.filter(b => b.status === "pending").length;

    return (
        <div className="my-listings-page">
            <div className="container">
                <div className="listings-header-row">
                    <div>
                        <h1>Owner Dashboard</h1>
                        <p>Manage your PG accommodations and review student booking requests</p>
                    </div>

                    <Link to="/add-pg" className="nav-button add-pg-btn">
                        + Add New PG Listing
                    </Link>
                </div>

                {actionMsg && (
                    <div className="alert-box alert-success">
                        {actionMsg}
                    </div>
                )}

                {error && (
                    <div className="alert-box alert-error">
                        {error}
                    </div>
                )}

                {/* TABS */}
                <div className="dashboard-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${activeTab === "listings" ? "active" : ""}`}
                        onClick={() => setActiveTab("listings")}
                    >
                        🏢 My PG Listings ({pgs.length})
                    </button>

                    <button
                        type="button"
                        className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
                        onClick={() => setActiveTab("bookings")}
                    >
                        📥 Booking Requests ({bookings.length})
                        {pendingBookingsCount > 0 && (
                            <span className="badge-count">{pendingBookingsCount} pending</span>
                        )}
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <p>Loading dashboard...</p>
                    </div>
                ) : activeTab === "listings" ? (
                    /* LISTINGS TAB */
                    <div className="listings-tab-content">
                        {pgs.length === 0 ? (
                            <div className="empty-state">
                                <h3>No PG Listings Added Yet</h3>
                                <p>You haven't added any PG listings under this owner account yet.</p>
                                <Link to="/add-pg" className="pg-button">
                                    + Add Your First PG Listing
                                </Link>
                            </div>
                        ) : (
                            <div className="owner-pg-grid">
                                {pgs.map((pg) => (
                                    <div key={pg.id} className="owner-pg-card">
                                        <div className="owner-pg-top">
                                            <h3>{pg.name}</h3>
                                            <span className="price-tag">
                                                ₹{Number(pg.monthly_rent).toLocaleString("en-IN")}/mo
                                            </span>
                                        </div>

                                        <p className="owner-pg-loc">📍 {pg.location}</p>

                                        <div className="owner-pg-meta">
                                            <span><strong>Room:</strong> {pg.sharing_type}</span>
                                            <span>
                                                <strong>Available:</strong>{" "}
                                                <span className={pg.available_students > 0 ? "text-success" : "text-danger"}>
                                                    {pg.available_students} beds
                                                </span>
                                            </span>
                                            <span>
                                                <strong>Food:</strong> {pg.food_available ? "Yes" : "No"}
                                            </span>
                                        </div>

                                        <div className="owner-card-actions">
                                            <Link to={`/pg/${pg.id}`} className="action-btn view">
                                                View Page
                                            </Link>
                                            <button
                                                type="button"
                                                className="action-btn edit"
                                                onClick={() => openEditModal(pg)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn delete"
                                                onClick={() => handleDeletePG(pg.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* BOOKINGS REQUESTS TAB */
                    <div className="bookings-tab-content">
                        {bookings.length === 0 ? (
                            <div className="empty-state">
                                <h3>No Booking Requests Received</h3>
                                <p>Students will appear here once they request accommodation for your PGs.</p>
                            </div>
                        ) : (
                            <div className="requests-list">
                                {bookings.map((b) => (
                                    <div key={b.id} className={`request-card status-${b.status}`}>
                                        <div className="request-header">
                                            <div>
                                                <h4>Student: {b.student_name}</h4>
                                                <span className="request-pg-tag">PG: {b.pg_name}</span>
                                            </div>
                                            <span className={`status-badge status-${b.status}`}>
                                                {b.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="request-details">
                                            <p>📧 <strong>Email:</strong> {b.student_email}</p>
                                            <p>📞 <strong>Phone:</strong> {b.student_phone || "Not provided"}</p>
                                            <p>📅 <strong>Requested Move-in:</strong> {b.move_in_date ? new Date(b.move_in_date).toLocaleDateString() : "Flexible"}</p>
                                            <p>🕒 <strong>Date Requested:</strong> {b.created_at ? new Date(b.created_at).toLocaleDateString() : ""}</p>
                                        </div>

                                        <div className="request-actions">
                                            {b.student_phone && (
                                                <a
                                                    href={`tel:${b.student_phone.replace(/\s+/g, "")}`}
                                                    className="call-student-btn"
                                                >
                                                    📞 Call Student
                                                </a>
                                            )}

                                            {b.status === "pending" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="approve-btn"
                                                        onClick={() => handleStatusUpdate(b.id, "approved")}
                                                    >
                                                        ✓ Approve Request
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="reject-btn"
                                                        onClick={() => handleStatusUpdate(b.id, "rejected")}
                                                    >
                                                        ✗ Reject Request
                                                    </button>
                                                </>
                                            )}

                                            {b.status === "approved" && (
                                                <button
                                                    type="button"
                                                    className="reject-btn"
                                                    onClick={() => handleStatusUpdate(b.id, "cancelled")}
                                                >
                                                    Cancel Approval
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* EDIT PG MODAL */}
                {editingPG && (
                    <div className="modal-backdrop" onClick={() => setEditingPG(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Edit PG: {editingPG.name}</h3>
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => setEditingPG(null)}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="edit-form">
                                <label>PG Name</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />

                                <label>Location</label>
                                <input
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    required
                                />

                                <div className="form-row">
                                    <div>
                                        <label>Monthly Rent (₹)</label>
                                        <input
                                            type="number"
                                            value={editForm.monthly_rent}
                                            onChange={(e) => setEditForm({ ...editForm, monthly_rent: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label>Available Beds</label>
                                        <input
                                            type="number"
                                            value={editForm.available_students}
                                            onChange={(e) => setEditForm({ ...editForm, available_students: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div>
                                        <label>Room Sharing</label>
                                        <select
                                            value={editForm.sharing_type}
                                            onChange={(e) => setEditForm({ ...editForm, sharing_type: e.target.value })}
                                        >
                                            <option value="Single Sharing">Single Sharing</option>
                                            <option value="2 Sharing">2 Sharing</option>
                                            <option value="3 Sharing">3 Sharing</option>
                                            <option value="4 Sharing">4 Sharing</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label>Owner Phone</label>
                                        <input
                                            value={editForm.owner_phone}
                                            onChange={(e) => setEditForm({ ...editForm, owner_phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <label className="checkbox-label" style={{ marginTop: "10px" }}>
                                    <input
                                        type="checkbox"
                                        checked={editForm.food_available}
                                        onChange={(e) => setEditForm({ ...editForm, food_available: e.target.checked })}
                                    />
                                    <span>Food / Meals Available</span>
                                </label>

                                <label>Facilities (comma separated)</label>
                                <textarea
                                    rows="2"
                                    value={editForm.facilities}
                                    onChange={(e) => setEditForm({ ...editForm, facilities: e.target.value })}
                                />

                                <div className="modal-actions">
                                    <button type="submit" className="submit-btn" disabled={saving}>
                                        {saving ? "Saving Changes..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => setEditingPG(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyListings;
