const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");
const initDB = require("./init-db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB schema additions & verify data
initDB();

// ===================================
// 1. Root & Health Check
// ===================================
app.get("/", (req, res) => {
    res.send("RentEase backend is running!");
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT current_database() AS database, NOW() AS current_time"
        );
        res.json({
            message: "PostgreSQL connected successfully!",
            database: result.rows[0].database,
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error("Database test error:", error.message);
        res.status(500).json({ message: "Database connection failed." });
    }
});

// ===================================
// 2. Authentication: Register
// ===================================
app.post("/api/register", async (req, res) => {
    try {
        const { full_name, email, phone, password, role } = req.body;

        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !full_name.trim() ||
            !email.trim() ||
            !password ||
            !role
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        if (!["student", "owner"].includes(role)) {
            return res.status(400).json({
                message: "Role must be student or owner."
            });
        }

        const cleanName = full_name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = typeof phone === "string" ? phone.trim() : null;

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, full_name, email, phone, role, created_at`,
            [cleanName, cleanEmail, cleanPhone, passwordHash, role]
        );

        const newUser = result.rows[0];

        res.status(201).json({
            message: "Registration successful!",
            user: {
                id: newUser.id,
                name: newUser.full_name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            }
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }
        console.error("Registration error:", error.message);
        res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
});

// ===================================
// 3. Authentication: Login
// ===================================
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Please enter your email and password."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, full_name, email, phone, password_hash, role
             FROM users
             WHERE email = $1`,
            [cleanEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({
            message: "Login failed. Please try again."
        });
    }
});

// ===================================
// 4. PG Listings: Get All (with filters & ratings)
// ===================================
app.get("/api/pgs", async (req, res) => {
    try {
        const { search, sharing_type, max_rent, food_available, owner_id } = req.query;

        let query = `
            SELECT
                p.id,
                p.name,
                p.location,
                p.monthly_rent,
                p.sharing_type,
                p.available_students,
                p.food_available,
                p.security_deposit,
                p.owner_name,
                p.owner_experience,
                p.owner_phone,
                p.image_url,
                p.map_url,
                COALESCE(p.facilities, '{}') AS facilities,
                COALESCE(p.rules, '{}') AS rules,
                p.owner_id,
                COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS avg_rating,
                COUNT(r.id)::int AS review_count
            FROM pg_listings p
            LEFT JOIN reviews r ON p.id = r.pg_id
            WHERE 1=1
        `;

        const params = [];

        if (search && search.trim() !== "") {
            params.push(`%${search.trim().toLowerCase()}%`);
            query += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.location) LIKE $${params.length})`;
        }

        if (sharing_type && sharing_type.trim() !== "") {
            params.push(sharing_type.trim());
            query += ` AND p.sharing_type = $${params.length}`;
        }

        if (max_rent && !isNaN(Number(max_rent))) {
            params.push(Number(max_rent));
            query += ` AND p.monthly_rent <= $${params.length}`;
        }

        if (food_available !== undefined && food_available !== "") {
            params.push(food_available === "true" || food_available === true);
            query += ` AND p.food_available = $${params.length}`;
        }

        if (owner_id && !isNaN(Number(owner_id))) {
            params.push(Number(owner_id));
            query += ` AND p.owner_id = $${params.length}`;
        }

        query += ` GROUP BY p.id ORDER BY p.id ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Fetch PGs error:", error.message);
        res.status(500).json({
            message: "Failed to fetch PG listings."
        });
    }
});

// ===================================
// 5. PG Listings: Get Single PG by ID
// ===================================
app.get("/api/pgs/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid PG ID." });
        }

        const result = await pool.query(`
            SELECT
                p.id,
                p.name,
                p.location,
                p.monthly_rent,
                p.sharing_type,
                p.available_students,
                p.food_available,
                p.security_deposit,
                p.owner_name,
                p.owner_experience,
                p.owner_phone,
                p.image_url,
                p.map_url,
                COALESCE(p.facilities, '{}') AS facilities,
                COALESCE(p.rules, '{}') AS rules,
                p.owner_id,
                COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)::float AS avg_rating,
                COUNT(r.id)::int AS review_count
            FROM pg_listings p
            LEFT JOIN reviews r ON p.id = r.pg_id
            WHERE p.id = $1
            GROUP BY p.id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "PG listing not found." });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Fetch single PG error:", error.message);
        res.status(500).json({
            message: "Failed to fetch PG details."
        });
    }
});

// ===================================
// 6. PG Listings: Create New PG
// ===================================
app.post("/api/pgs", async (req, res) => {
    try {
        const {
            name,
            location,
            monthly_rent,
            sharing_type,
            available_students,
            food_available,
            security_deposit,
            owner_name,
            owner_experience,
            owner_phone,
            image_url,
            map_url,
            facilities,
            rules,
            owner_id
        } = req.body;

        if (
            typeof name !== "string" ||
            typeof location !== "string" ||
            typeof sharing_type !== "string" ||
            !name.trim() ||
            !location.trim() ||
            !sharing_type.trim() ||
            monthly_rent === undefined ||
            monthly_rent === "" ||
            available_students === undefined ||
            available_students === ""
        ) {
            return res.status(400).json({
                message: "Please fill in all required fields."
            });
        }

        const rent = Number(monthly_rent);
        const available = Number(available_students);

        if (
            !Number.isFinite(rent) ||
            rent <= 0 ||
            !Number.isInteger(available) ||
            available < 0
        ) {
            return res.status(400).json({
                message: "Enter a valid rent and number of available students."
            });
        }

        let deposit = null;
        if (security_deposit !== undefined && security_deposit !== null && security_deposit !== "") {
            deposit = Number(security_deposit);
            if (!Number.isFinite(deposit) || deposit < 0) {
                return res.status(400).json({
                    message: "Enter a valid security deposit."
                });
            }
        }

        const facilitiesList = Array.isArray(facilities)
            ? facilities.map(i => String(i).trim()).filter(Boolean)
            : [];

        const rulesList = Array.isArray(rules)
            ? rules.map(i => String(i).trim()).filter(Boolean)
            : [];

        const validOwnerId = owner_id && Number.isInteger(Number(owner_id)) ? Number(owner_id) : null;

        const result = await pool.query(
            `INSERT INTO pg_listings (
                name, location, monthly_rent,
                sharing_type, available_students,
                food_available, security_deposit,
                owner_name, owner_experience, owner_phone,
                image_url, map_url, facilities, rules, owner_id
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14, $15
            )
            RETURNING *`,
            [
                name.trim(),
                location.trim(),
                rent,
                sharing_type.trim(),
                available,
                Boolean(food_available),
                deposit,
                owner_name?.trim() || null,
                owner_experience?.trim() || null,
                owner_phone?.trim() || null,
                image_url?.trim() || null,
                map_url?.trim() || null,
                facilitiesList,
                rulesList,
                validOwnerId
            ]
        );

        res.status(201).json({
            message: "PG added successfully!",
            pg: result.rows[0]
        });
    } catch (error) {
        console.error("Add PG error:", error.message);
        res.status(500).json({
            message: "Failed to add PG. Please check backend logs."
        });
    }
});

// ===================================
// 7. PG Listings: Update PG
// ===================================
app.put("/api/pgs/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid PG ID." });
        }

        const {
            name,
            location,
            monthly_rent,
            sharing_type,
            available_students,
            food_available,
            security_deposit,
            owner_name,
            owner_experience,
            owner_phone,
            image_url,
            map_url,
            facilities,
            rules
        } = req.body;

        const existing = await pool.query("SELECT * FROM pg_listings WHERE id = $1", [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: "PG listing not found." });
        }

        const current = existing.rows[0];

        const rent = monthly_rent !== undefined ? Number(monthly_rent) : current.monthly_rent;
        const available = available_students !== undefined ? Number(available_students) : current.available_students;
        const deposit = security_deposit !== undefined && security_deposit !== "" ? Number(security_deposit) : current.security_deposit;

        const facilitiesList = facilities !== undefined
            ? (Array.isArray(facilities) ? facilities.map(i => String(i).trim()).filter(Boolean) : [])
            : current.facilities;

        const rulesList = rules !== undefined
            ? (Array.isArray(rules) ? rules.map(i => String(i).trim()).filter(Boolean) : [])
            : current.rules;

        const result = await pool.query(
            `UPDATE pg_listings SET
                name = COALESCE($1, name),
                location = COALESCE($2, location),
                monthly_rent = $3,
                sharing_type = COALESCE($4, sharing_type),
                available_students = $5,
                food_available = COALESCE($6, food_available),
                security_deposit = $7,
                owner_name = COALESCE($8, owner_name),
                owner_experience = COALESCE($9, owner_experience),
                owner_phone = COALESCE($10, owner_phone),
                image_url = COALESCE($11, image_url),
                map_url = COALESCE($12, map_url),
                facilities = $13,
                rules = $14
             WHERE id = $15
             RETURNING *`,
            [
                name ? name.trim() : null,
                location ? location.trim() : null,
                rent,
                sharing_type ? sharing_type.trim() : null,
                available,
                food_available !== undefined ? Boolean(food_available) : null,
                deposit,
                owner_name ? owner_name.trim() : null,
                owner_experience ? owner_experience.trim() : null,
                owner_phone ? owner_phone.trim() : null,
                image_url ? image_url.trim() : null,
                map_url ? map_url.trim() : null,
                facilitiesList,
                rulesList,
                id
            ]
        );

        res.json({
            message: "PG updated successfully!",
            pg: result.rows[0]
        });
    } catch (error) {
        console.error("Update PG error:", error.message);
        res.status(500).json({ message: "Failed to update PG." });
    }
});

// ===================================
// 8. PG Listings: Delete PG
// ===================================
app.delete("/api/pgs/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid PG ID." });
        }

        // Clean up dependent records first
        await pool.query("DELETE FROM reviews WHERE pg_id = $1", [id]);
        await pool.query("DELETE FROM bookings WHERE pg_id = $1", [id]);
        await pool.query("DELETE FROM pg_amenities WHERE pg_id = $1", [id]);

        const result = await pool.query("DELETE FROM pg_listings WHERE id = $1 RETURNING id", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "PG listing not found." });
        }

        res.json({ message: "PG listing deleted successfully!" });
    } catch (error) {
        console.error("Delete PG error:", error.message);
        res.status(500).json({ message: "Failed to delete PG listing." });
    }
});

// ===================================
// 9. Reviews: Get Reviews for a PG
// ===================================
app.get("/api/pgs/:id/reviews", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid PG ID." });
        }

        const result = await pool.query(`
            SELECT
                r.id,
                r.student_id,
                r.pg_id,
                r.rating,
                r.comment,
                r.created_at,
                COALESCE(u.full_name, 'Anonymous Student') AS student_name
            FROM reviews r
            LEFT JOIN users u ON r.student_id = u.id
            WHERE r.pg_id = $1
            ORDER BY r.created_at DESC
        `, [id]);

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch reviews error:", error.message);
        res.status(500).json({ message: "Failed to fetch reviews." });
    }
});

// ===================================
// 10. Reviews: Add a Review
// ===================================
app.post("/api/pgs/:id/reviews", async (req, res) => {
    try {
        const pgId = Number(req.params.id);
        const { student_id, rating, comment } = req.body;

        if (!Number.isInteger(pgId) || pgId <= 0) {
            return res.status(400).json({ message: "Invalid PG ID." });
        }

        const parsedRating = Number(rating);
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ message: "Rating must be an integer between 1 and 5." });
        }

        if (!comment || typeof comment !== "string" || !comment.trim()) {
            return res.status(400).json({ message: "Please provide a review comment." });
        }

        const validStudentId = student_id && Number.isInteger(Number(student_id)) ? Number(student_id) : null;

        const result = await pool.query(
            `INSERT INTO reviews (student_id, pg_id, rating, comment, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (student_id, pg_id)
             DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = NOW()
             RETURNING id, student_id, pg_id, rating, comment, created_at`,
            [validStudentId, pgId, parsedRating, comment.trim()]
        );

        let studentName = "Student";
        if (validStudentId) {
            const userRes = await pool.query("SELECT full_name FROM users WHERE id = $1", [validStudentId]);
            if (userRes.rows.length > 0) {
                studentName = userRes.rows[0].full_name;
            }
        }

        res.status(201).json({
            message: "Review added successfully!",
            review: {
                ...result.rows[0],
                student_name: studentName
            }
        });
    } catch (error) {
        console.error("Add review error:", error.message);
        res.status(500).json({ message: "Failed to submit review." });
    }
});

// ===================================
// 11. Bookings: Create a Booking Request
// ===================================
app.post("/api/bookings", async (req, res) => {
    try {
        const { student_id, pg_id, move_in_date } = req.body;

        if (!student_id || !pg_id || !move_in_date) {
            return res.status(400).json({
                message: "Student ID, PG ID, and Move-in date are required."
            });
        }

        const pgCheck = await pool.query("SELECT * FROM pg_listings WHERE id = $1", [Number(pg_id)]);
        if (pgCheck.rows.length === 0) {
            return res.status(404).json({ message: "PG listing not found." });
        }

        const pg = pgCheck.rows[0];
        if (pg.available_students <= 0) {
            return res.status(400).json({
                message: "Sorry, this PG has no available beds right now."
            });
        }

        // Check if student already has a pending booking for this PG
        const existing = await pool.query(
            `SELECT id FROM bookings
             WHERE student_id = $1 AND pg_id = $2 AND status = 'pending'`,
            [Number(student_id), Number(pg_id)]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                message: "You already have a pending booking request for this PG."
            });
        }

        const result = await pool.query(
            `INSERT INTO bookings (student_id, pg_id, move_in_date, status, booking_date, created_at)
             VALUES ($1, $2, $3, 'pending', NOW(), NOW())
             RETURNING *`,
            [Number(student_id), Number(pg_id), move_in_date]
        );

        res.status(201).json({
            message: "Booking request submitted successfully! The owner will review your request.",
            booking: result.rows[0]
        });
    } catch (error) {
        console.error("Create booking error:", error.message);
        res.status(500).json({ message: "Failed to submit booking request." });
    }
});

// ===================================
// 12. Bookings: Get Student Bookings
// ===================================
app.get("/api/bookings/student/:studentId", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({ message: "Invalid student ID." });
        }

        const result = await pool.query(`
            SELECT
                b.id,
                b.student_id,
                b.pg_id,
                b.booking_date,
                b.move_in_date,
                b.status,
                b.created_at,
                p.name AS pg_name,
                p.location AS pg_location,
                p.monthly_rent,
                p.image_url,
                p.owner_name,
                p.owner_phone
            FROM bookings b
            JOIN pg_listings p ON b.pg_id = p.id
            WHERE b.student_id = $1
            ORDER BY b.created_at DESC
        `, [studentId]);

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch student bookings error:", error.message);
        res.status(500).json({ message: "Failed to fetch bookings." });
    }
});

// ===================================
// 13. Bookings: Get Owner Bookings
// ===================================
app.get("/api/bookings/owner/:ownerId", async (req, res) => {
    try {
        const ownerId = Number(req.params.ownerId);
        if (!Number.isInteger(ownerId) || ownerId <= 0) {
            return res.status(400).json({ message: "Invalid owner ID." });
        }

        const ownerUser = await pool.query("SELECT full_name, phone FROM users WHERE id = $1", [ownerId]);
        const ownerInfo = ownerUser.rows[0] || {};

        const result = await pool.query(`
            SELECT
                b.id,
                b.student_id,
                b.pg_id,
                b.booking_date,
                b.move_in_date,
                b.status,
                b.created_at,
                p.name AS pg_name,
                p.location AS pg_location,
                p.monthly_rent,
                u.full_name AS student_name,
                u.email AS student_email,
                u.phone AS student_phone
            FROM bookings b
            JOIN pg_listings p ON b.pg_id = p.id
            JOIN users u ON b.student_id = u.id
            WHERE p.owner_id = $1
               OR (p.owner_phone IS NOT NULL AND p.owner_phone = $2)
               OR (p.owner_name IS NOT NULL AND LOWER(p.owner_name) = LOWER($3))
            ORDER BY b.created_at DESC
        `, [ownerId, ownerInfo.phone || "", ownerInfo.full_name || ""]);

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch owner bookings error:", error.message);
        res.status(500).json({ message: "Failed to fetch booking requests." });
    }
});

// ===================================
// 14. Bookings: Update Status (Approve, Reject, Cancel)
// ===================================
app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

        const allowed = ["approved", "rejected", "cancelled", "pending"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const existing = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const prevBooking = existing.rows[0];

        const result = await pool.query(
            "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );

        // Adjust available_students count if status changed to/from approved
        if (status === "approved" && prevBooking.status !== "approved") {
            await pool.query(
                "UPDATE pg_listings SET available_students = GREATEST(0, available_students - 1) WHERE id = $1",
                [prevBooking.pg_id]
            );
        } else if (prevBooking.status === "approved" && (status === "rejected" || status === "cancelled")) {
            await pool.query(
                "UPDATE pg_listings SET available_students = available_students + 1 WHERE id = $1",
                [prevBooking.pg_id]
            );
        }

        res.json({
            message: `Booking ${status} successfully!`,
            booking: result.rows[0]
        });
    } catch (error) {
        console.error("Update booking status error:", error.message);
        res.status(500).json({ message: "Failed to update booking status." });
    }
});

// ===================================
// 15. User Profile
// ===================================
app.get("/api/users/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const result = await pool.query(
            "SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("User profile error:", error.message);
        res.status(500).json({ message: "Failed to load user profile." });
    }
});

// ===================================
// 16. Fallback & Server Start
// ===================================
app.use("/api", (req, res) => {
    res.status(404).json({ message: "API route not found." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`RentEase backend running on http://localhost:${PORT}`);
});
