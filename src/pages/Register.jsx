import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();
    const [type, setType] = useState("student");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    async function handleRegister(event) {
        event.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
            setErrorMsg("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setErrorMsg("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "https://rentease-student-pg-hostel-finder.onrender.com/api/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        full_name: name.trim(),
                        email: email.trim().toLowerCase(),
                        phone: phone.trim(),
                        password: password,
                        role: type
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            setSuccessMsg("Registration successful! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 1200);

        } catch (error) {
            setErrorMsg(error.message || "Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="register-page">
            <div className="register-container">
                <div className="register-heading">
                    <h1>Create Your RentEase Account</h1>
                    <p>Join students and verified property owners across the city</p>
                </div>

                <div className="register-card">
                    <div className="register-icon">
                        {type === "owner" ? "🏢" : "🎓"}
                    </div>

                    <h2>Get Started</h2>
                    <p className="register-description">
                        Create your account to browse or list verified student accommodations
                    </p>

                    {errorMsg && (
                        <div className="alert-box alert-error">
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="alert-box alert-success">
                            {successMsg}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>
                        <label>Register As</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="student">🎓 Student (Looking for stay)</option>
                            <option value="owner">🏢 PG & Hostel Owner (Listing stay)</option>
                        </select>

                        <label>Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Rahul Sharma"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />

                        <label>Password (min 8 characters)</label>
                        <input
                            type="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                        />

                        <label>Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            className="register-submit"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="login-text">
                        Already have an account?{" "}
                        <Link to="/login">Sign In</Link>
                    </p>
                </div>
            </div>
        </section>
    );
}

export default Register;
