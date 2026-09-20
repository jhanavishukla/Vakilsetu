import db from "../config/db.js";

/**
 * Checks if an error is a database-level unique constraint violation.
 * Handles LibSQL/SQLite (UNIQUE constraint failed),
 * MySQL (ER_DUP_ENTRY), and PostgreSQL (23505) errors.
 */
function isDuplicateEntryError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    msg.includes('unique constraint failed') ||
    msg.includes('unique constraint') ||
    code === 'ER_DUP_ENTRY' ||
    code === '23505' ||
    code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}

/**
 * Get all registered clients (admin use)
 */
export async function getAllClients(req, res) {
  try {
    const result = await db.execute("SELECT id, name, city, contact, avatar, interest FROM clients");
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving all clients:", error);
    return res.status(500).json({ error: "Internal Server Error fetching clients." });
  }
}

/**
 * Register a client profile
 */
export async function registerClient(req, res) {
  try {
    const { name, city, contact, avatar, interest, password } = req.body;

    const errors = [];
    if (!name || name.trim() === "") errors.push("Full Name is required.");
    if (!city || city.trim() === "") errors.push("City is required.");
    if (!contact || contact.trim() === "") errors.push("Contact value is required.");
    if (!interest || interest.trim() === "") errors.push("Primary Legal Concern is required.");

    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation Failed", details: errors });
    }

    // CROSS-TABLE UNIQUE CONSTRAINT CHECK
    const checkContact = contact.trim().toLowerCase();
    
    // Check if it exists in lawyers
    const lawyerCheck = await db.execute({
      sql: "SELECT id FROM lawyers WHERE LOWER(contact_info) = ?",
      args: [checkContact]
    });
    // Check if it exists in clients
    const clientCheck = await db.execute({
      sql: "SELECT id FROM clients WHERE LOWER(contact) = ?",
      args: [checkContact]
    });

    if (lawyerCheck.rows.length > 0 || clientCheck.rows.length > 0) {
      return res.status(409).json({
        error: "UserAlreadyExists",
        message: "Account already exists. Please log in.",
        contact: contact
      });
    }

    let slugId = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    if (slugId.startsWith("-")) slugId = slugId.substring(1);
    if (slugId.endsWith("-")) slugId = slugId.slice(0, -1);
    if (slugId === "") slugId = "client-" + Math.floor(Math.random() * 1000);

    // Ensure unique ID
    const idCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM clients WHERE id = ?",
      args: [slugId]
    });
    let finalId = slugId;
    if (idCheck.rows[0].count > 0) {
      finalId = `${slugId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await db.execute({
      sql: "INSERT INTO clients (id, name, city, contact, avatar, interest, password, is_profile_completed) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
      args: [finalId, name.trim(), city.trim(), contact.trim(), avatar || null, interest, password || null]
    });

    return res.status(201).json({
      message: "Client profile registered successfully.",
      client: {
        id: finalId,
        name: name.trim(),
        city: city.trim(),
        contact: contact.trim(),
        avatar: avatar || null,
        interest,
        isProfileCompleted: true
      }
    });
  } catch (error) {
    console.error("Error registering client:", error);
    // Catch database-level unique constraint violations (LibSQL/SQLite, MySQL, Postgres)
    if (isDuplicateEntryError(error)) {
      return res.status(409).json({
        error: "UserAlreadyExists",
        message: "Account already exists. Please log in."
      });
    }
    return res.status(500).json({ error: "Internal Server Error registering client profile." });
  }
}

/**
 * Get a single client by ID
 */
export async function getClientById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM clients WHERE id = ?",
      args: [id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found." });
    }

    const row = result.rows[0];
    return res.status(200).json({
      success: true,
      user: {
        id: row.id,
        name: row.name,
        city: row.city,
        contact: row.contact,
        avatar: row.avatar,
        interest: row.interest,
        isProfileCompleted: row.is_profile_completed === 1
      }
    });
  } catch (error) {
    console.error("Error retrieving client by ID:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
}

/**
 * Delete a client account by ID
 */
export async function deleteClient(req, res) {
  try {
    const { id } = req.params;

    const check = await db.execute({
      sql: "SELECT id FROM clients WHERE id = ?",
      args: [id]
    });

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Client not found." });
    }

    await db.execute({
      sql: "DELETE FROM clients WHERE id = ?",
      args: [id]
    });

    return res.status(200).json({ message: "Client account deleted successfully." });
  } catch (error) {
    console.error("Error deleting client:", error);
    return res.status(500).json({ error: "Internal Server Error during account deletion." });
  }
}

export async function updateClientProfile(req, res) {
  try {
    const { id } = req.params;
    const { name, city, interest, avatar } = req.body;
    const clientCheck = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [id] });
    if (clientCheck.rows.length === 0) return res.status(404).json({ error: 'Client not found.' });
    await db.execute({
      sql: 'UPDATE clients SET name = ?, city = ?, interest = ?, avatar = COALESCE(?, avatar), is_profile_completed = 1 WHERE id = ?',
      args: [name, city, interest, avatar || null, id]
    });
    const updated = await db.execute({ sql: 'SELECT * FROM clients WHERE id = ?', args: [id] });
    const row = updated.rows[0];
    const client = { id: row.id, name: row.name, city: row.city, contact: row.contact, avatar: row.avatar, interest: row.interest, isProfileCompleted: row.is_profile_completed === 1 };
    return res.status(200).json({ message: 'Profile updated successfully.', user: client });
  } catch (error) {
    console.error('Error updating client:', error);
    // Catch database-level unique constraint violations
    if (isDuplicateEntryError(error)) {
      return res.status(409).json({
        error: "UserAlreadyExists",
        message: "Account already exists. Please log in."
      });
    }
    return res.status(500).json({ error: 'Internal Server Error during profile update.' });
  }
}

