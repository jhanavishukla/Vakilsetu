import db from "../config/db.js";

/**
 * Log in / check if user exists by contact info + optional password
 */
export async function loginUser(req, res) {
  try {
    const { contact, role, password } = req.body;

    if (!contact || contact.trim() === "") {
      return res.status(400).json({ error: "Contact value is required." });
    }

    const searchContact = contact.trim().toLowerCase();

    if (role === "lawyer") {
      // Search in lawyers table by contact_info or bar_number
      const result = await db.execute({
        sql: "SELECT * FROM lawyers WHERE LOWER(contact_info) = ? OR LOWER(bar_number) = ?",
        args: [searchContact, searchContact]
      });

      if (result.rows.length > 0) {
        const row = result.rows[0];

        // If password is set in DB and provided in request, validate it
        if (row.password && password && row.password !== password) {
          return res.status(401).json({ exists: true, error: "Incorrect password." });
        }

        const lawyer = {
          id: row.id,
          name: row.name,
          specialty: row.specialty,
          specialtyLabel: row.specialty_label,
          avatarText: row.avatar_text,
          avatarBase64: row.avatar_base64,
          rating: row.rating,
          casesHandled: Number(row.cases_handled),
          winRate: row.win_rate,
          bio: row.bio,
          barNumber: row.bar_number,
          barCouncilId: row.bar_council_id,
          verificationStatus: row.verification_status || 'pending',
          contactInfo: row.contact_info,
          packages: JSON.parse(row.packages),
          verified_cases: JSON.parse(row.verified_cases),
          isProfileCompleted: row.is_profile_completed === 1
        };
        return res.status(200).json({ exists: true, user: lawyer });
      }
    } else {
      // Search in clients table by contact
      const result = await db.execute({
        sql: "SELECT * FROM clients WHERE LOWER(contact) = ?",
        args: [searchContact]
      });

      if (result.rows.length > 0) {
        const row = result.rows[0];

        // If password is set in DB and provided in request, validate it
        if (row.password && password && row.password !== password) {
          return res.status(401).json({ exists: true, error: "Incorrect password." });
        }

        const client = {
          id: row.id,
          name: row.name,
          city: row.city,
          contact: row.contact,
          avatar: row.avatar,
          interest: row.interest,
          isProfileCompleted: row.is_profile_completed === 1
        };
        return res.status(200).json({ exists: true, user: client });
      }
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal Server Error during login." });
  }
}
