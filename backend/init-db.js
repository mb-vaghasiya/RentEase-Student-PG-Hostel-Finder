const pool = require("./db");

async function initDB() {
    try {
        // 1. Ensure owner_id column exists
        await pool.query(`
            ALTER TABLE pg_listings 
            ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `);

        // 2. Sync amenities into facilities text array if empty
        await pool.query(`
            UPDATE pg_listings p
            SET facilities = sub.amenity_names
            FROM (
                SELECT pa.pg_id, array_agg(a.name) AS amenity_names
                FROM pg_amenities pa
                JOIN amenities a ON pa.amenity_id = a.id
                GROUP BY pa.pg_id
            ) sub
            WHERE p.id = sub.pg_id
              AND (p.facilities IS NULL OR cardinality(p.facilities) = 0);
        `);

        // 3. For any PG with empty facilities, give standard defaults
        await pool.query(`
            UPDATE pg_listings
            SET facilities = ARRAY['Wi-Fi', '24/7 Water', 'CCTV', 'Electricity']
            WHERE facilities IS NULL OR cardinality(facilities) = 0;
        `);

        // 4. For any PG with empty rules, provide sensible default rules
        await pool.query(`
            UPDATE pg_listings
            SET rules = ARRAY['No smoking or alcohol inside premises', 'Visitors allowed till 8 PM', 'Keep rooms and common areas clean', 'Valid student ID proof required']
            WHERE rules IS NULL OR cardinality(rules) = 0;
        `);

        // 5. Populate missing owner info on default seed PGs if null
        await pool.query(`
            UPDATE pg_listings
            SET 
                owner_name = COALESCE(owner_name, 'Rahul Patel'),
                owner_experience = COALESCE(owner_experience, '5+ years'),
                owner_phone = COALESCE(owner_phone, '+91 98765 43210'),
                owner_id = COALESCE(owner_id, 1),
                security_deposit = COALESCE(security_deposit, monthly_rent)
            WHERE id = 1 AND (owner_name IS NULL OR owner_phone IS NULL);
        `);

        await pool.query(`
            UPDATE pg_listings
            SET 
                owner_name = COALESCE(owner_name, 'Jayesh Patel'),
                owner_experience = COALESCE(owner_experience, '3 years'),
                owner_phone = COALESCE(owner_phone, '+91 98250 12345'),
                owner_id = COALESCE(owner_id, 3),
                security_deposit = COALESCE(security_deposit, monthly_rent)
            WHERE id = 2 AND (owner_name IS NULL OR owner_phone IS NULL);
        `);

        await pool.query(`
            UPDATE pg_listings
            SET 
                owner_name = COALESCE(owner_name, 'Suresh Shah'),
                owner_experience = COALESCE(owner_experience, '4 years'),
                owner_phone = COALESCE(owner_phone, '+91 94280 67890'),
                owner_id = COALESCE(owner_id, 1),
                security_deposit = COALESCE(security_deposit, monthly_rent)
            WHERE id = 3 AND (owner_name IS NULL OR owner_phone IS NULL);
        `);

        console.log("Database initialized & schema verified successfully.");
    } catch (err) {
        console.error("Database initialization notice/error:", err.message);
    }
}

module.exports = initDB;
