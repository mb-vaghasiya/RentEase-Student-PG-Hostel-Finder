import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [userType, setUserType] = useState("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    async function handleLogin(event) {
        event.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!email.trim() || !password.trim()) {
            setErrorMsg("Please enter both email and password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/api/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            // Check selected role
            if (data.user.role !== userType) {
                throw new Error(`This account is registered as a ${data.user.role}. Please switch "Login As" to ${data.user.role === "owner" ? "PG Owner" : "Student"}.`);
            }

            // Save user session details
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("userId", String(data.user.id));
            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userRole", data.user.role);
            localStorage.setItem("userEmail", data.user.email);
            if (data.user.phone) {
                localStorage.setItem("userPhone", data.user.phone);
            }

            setSuccessMsg("Login successful! Redirecting...");
            setTimeout(() => {
                navigate("/");
            }, 600);

        } catch (error) {
            setErrorMsg(error.message || "Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="login-page">
            <div className="login-container">
                <div className="login-heading">
                    <h1>Welcome Back to RentEase</h1>
                    <p>Find, explore, and manage student accommodations with ease</p>
                </div>

                <div className="login-cards">
                    <div className="login-card">
                        <div className="login-icon">
                            {userType === "owner" ? "🏢" : "🎓"}
                        </div>

                        <h2>Sign In</h2>
                        <p>Access your personalized RentEase account</p>

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

                        <form onSubmit={handleLogin}>
                            <label>Login As</label>
                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                            >
                                <option value="student">🎓 Student</option>
                                <option value="owner">🏢 PG & Hostel Owner</option>
                            </select>

                            <label>Email Address</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            <button
                                type="submit"
                                className="login-submit"
                                disabled={loading}
                            >
                                {loading ? "Signing in..." : "Login"}
                            </button>
                        </form>

                        <p className="register-text">
                            Don't have an account yet?{" "}
                            <Link to="/register">Create an account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Login;
