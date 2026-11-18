import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PGDetails from "./pages/PGDetails";
import AddPG from "./pages/AddPG";
import MyBookings from "./pages/MyBookings";
import MyListings from "./pages/MyListings";

function Layout({ children }) {
    return (
        <div className="app-container">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Auth Routes */}
                <Route
                    path="/login"
                    element={
                        <Layout>
                            <Login />
                        </Layout>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <Layout>
                            <Register />
                        </Layout>
                    }
                />

                {/* Homepage */}
                <Route
                    path="/"
                    element={
                        <Layout>
                            <Home />
                        </Layout>
                    }
                />

                {/* PG Details: supports both /pg/:id and /pg:id */}
                <Route
                    path="/pg/:id"
                    element={
                        <Layout>
                            <PGDetails />
                        </Layout>
                    }
                />
                <Route
                    path="/:id"
                    element={
                        <Layout>
                            <PGDetails />
                        </Layout>
                    }
                />

                {/* Protected Student Routes */}
                <Route
                    path="/my-bookings"
                    element={
                        <ProtectedRoute role="student">
                            <Layout>
                                <MyBookings />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* Protected Owner Routes */}
                <Route
                    path="/add-pg"
                    element={
                        <ProtectedRoute role="owner">
                            <Layout>
                                <AddPG />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-listings"
                    element={
                        <ProtectedRoute role="owner">
                            <Layout>
                                <MyListings />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
