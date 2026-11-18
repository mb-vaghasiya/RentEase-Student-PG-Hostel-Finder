import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const userRole = localStorage.getItem("userRole");

    if (!loggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (role && userRole !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
