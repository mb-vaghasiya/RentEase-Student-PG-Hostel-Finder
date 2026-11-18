import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AddPG() {
    const navigate = useNavigate();

    const storedUserId = localStorage.getItem("userId");
    const storedUserName = localStorage.getItem("userName") || "";
    const storedUserPhone = localStorage.getItem("userPhone") || "";

    const [form, setForm] = useState({
        name: "",
        location: "",
        monthly_rent: "",
        sharing_type: "2 Sharing",
        available_students: "2",
        food_available: true,
        security_deposit: "",
        owner_name: storedUserName,
        owner_experience: "3+ years",
        owner_phone: storedUserPhone,
        image_url: "/images/pg1.jpg",
        map_url: "",
        facilities: "Wi-Fi, Food, Laundry, CCTV, 24/7 Water",
        rules: "Gates close at 10 PM, Keep rooms clean, Valid ID proof required"
    });

    const [message, setMessage] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage({ text: "", type: "" });
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/pgs",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ...form,
                        monthly_rent: Number(form.monthly_rent),
                        available_students: Number(form.available_students),
                        security_deposit: form.security_deposit === "" ? null : Number(form.security_deposit),
                        owner_id: storedUserId ? Number(storedUserId) : null,
                        facilities: form.facilities
                            .split(",")
                            .map(item => item.trim())
                            .filter(Boolean),
                        rules: form.rules
                            .split(",")
                            .map(item => item.trim())
                            .filter(Boolean)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not add PG listing");
            }

            setMessage({
                text: "PG listing published successfully!",
                type: "success"
            });

            setTimeout(() => {
                if (data.pg && data.pg.id) {
                    navigate(`/pg/${data.pg.id}`);
                } else {
                    navigate("/my-listings");
                }
            }, 1200);

        } catch (error) {
            setMessage({ text: error.message, type: "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="add-pg-page">
            <div className="add-pg-container">
                <div className="form-header">
                    <h1>List Your PG or Hostel</h1>
                    <p>Reach thousands of verified students looking for quality accommodation</p>
                </div>

                {message.text && (
                    <div className={`alert-box alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="add-pg-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>PG / Hostel Name *</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. Royal Student Stay"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Location / Area *</label>
                            <input
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="e.g. Navrangpura, Ahmedabad"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Monthly Rent (₹) *</label>
                            <input
                                name="monthly_rent"
                                type="number"
                                min="1"
                                value={form.monthly_rent}
                                onChange={handleChange}
                                placeholder="e.g. 7500"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Room Sharing Type *</label>
                            <select
                                name="sharing_type"
                                value={form.sharing_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="Single Sharing">Single Sharing</option>
                                <option value="2 Sharing">2 Sharing</option>
                                <option value="3 Sharing">3 Sharing</option>
                                <option value="4 Sharing">4 Sharing</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Available Beds / Student Places *</label>
                            <input
                                name="available_students"
                                type="number"
                                min="0"
                                step="1"
                                value={form.available_students}
                                onChange={handleChange}
                                placeholder="e.g. 4"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Security Deposit (₹)</label>
                            <input
                                name="security_deposit"
                                type="number"
                                min="0"
                                value={form.security_deposit}
                                onChange={handleChange}
                                placeholder="e.g. 7500 (usually 1 month rent)"
                            />
                        </div>
                    </div>

                    <div className="checkbox-row">
                        <label className="checkbox-label">
                            <input
                                name="food_available"
                                type="checkbox"
                                checked={form.food_available}
                                onChange={handleChange}
                            />
                            <span>Food / Mess Included in Rent</span>
                        </label>
                    </div>

                    <hr className="form-divider" />
                    <h3>Owner & Contact Information</h3>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Owner / Manager Name *</label>
                            <input
                                name="owner_name"
                                value={form.owner_name}
                                onChange={handleChange}
                                placeholder="e.g. Rajesh Patel"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Contact Phone Number *</label>
                            <input
                                name="owner_phone"
                                type="tel"
                                value={form.owner_phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Experience / Description</label>
                            <input
                                name="owner_experience"
                                value={form.owner_experience}
                                onChange={handleChange}
                                placeholder="e.g. 5+ years running student hostels"
                            />
                        </div>

                        <div className="form-group">
                            <label>Google Maps Link</label>
                            <input
                                name="map_url"
                                type="url"
                                value={form.map_url}
                                onChange={handleChange}
                                placeholder="https://maps.google.com/..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>PG Image</label>
                        <input
                            name="image_url"
                            type="text"
                            value={form.image_url}
                            onChange={handleChange}
                            placeholder="URL or choose a preset below"
                        />
                        <div className="preset-images">
                            <span>Sample images:</span>
                            <button
                                type="button"
                                className="preset-btn"
                                onClick={() => setForm({ ...form, image_url: "/images/pg1.jpg" })}
                            >
                                Sample 1
                            </button>
                            <button
                                type="button"
                                className="preset-btn"
                                onClick={() => setForm({ ...form, image_url: "/images/pg2.jpg" })}
                            >
                                Sample 2
                            </button>
                            <button
                                type="button"
                                className="preset-btn"
                                onClick={() => setForm({ ...form, image_url: "/images/pg3.jpg" })}
                            >
                                Sample 3
                            </button>
                            <button
                                type="button"
                                className="preset-btn"
                                onClick={() => setForm({ ...form, image_url: "/images/pg4.jpg" })}
                            >
                                Sample 4
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Facilities (comma separated)</label>
                        <textarea
                            name="facilities"
                            rows="2"
                            value={form.facilities}
                            onChange={handleChange}
                            placeholder="Wi-Fi, Food, Laundry, CCTV, RO Water, Study Table"
                        />
                    </div>

                    <div className="form-group">
                        <label>House Rules (comma separated)</label>
                        <textarea
                            name="rules"
                            rows="2"
                            value={form.rules}
                            onChange={handleChange}
                            placeholder="No smoking, Visitors allowed till 8 PM, Valid ID required"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? "Adding Listing..." : "Publish PG Listing"}
                        </button>
                        <Link to="/" className="cancel-link">
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddPG;
