import db from "../config/db.js";

// Mapping of specialty keys to human-readable labels
const SPECIALTY_LABELS = {
  tenancy: "Tenancy & Housing Law",
  employment: "Employment & Labor Law",
  contract: "Contracts & Freelance",
  consumer: "Consumer Protection",
  family: "Family Law & Divorce",
  criminal: "Criminal Defense"
};

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
 * Get all registered advocates
 */
export async function getAllLawyers(req, res) {
  try {
    const result = await db.execute("SELECT * FROM lawyers WHERE is_visible = 1");
    const lawyers = result.rows.map(row => {
      return {
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
        verified_cases: JSON.parse(row.verified_cases)
      };
    });

    return res.status(200).json(lawyers.reverse());
  } catch (error) {
    console.error("Error retrieving lawyers:", error);
    return res.status(500).json({ error: "Internal Server Error fetching advocates directory." });
  }
}

/**
 * Get a single advocate by ID
 */
export async function getLawyerById(req, res) {
  try {
    const { id } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM lawyers WHERE id = ?",
      args: [id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Advocate not found." });
    }

    const row = result.rows[0];
    return res.status(200).json({
      success: true,
      user: {
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
      }
    });
  } catch (error) {
    console.error("Error retrieving lawyer by ID:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
}

/**
 * Delete an advocate account by ID
 */
export async function deleteLawyer(req, res) {
  try {
    const { id } = req.params;

    const check = await db.execute({
      sql: "SELECT id FROM lawyers WHERE id = ?",
      args: [id]
    });

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Advocate not found." });
    }

    await db.execute({
      sql: "DELETE FROM lawyers WHERE id = ?",
      args: [id]
    });

    return res.status(200).json({ message: "Advocate account deleted successfully." });
  } catch (error) {
    console.error("Error deleting lawyer:", error);
    return res.status(500).json({ error: "Internal Server Error during account deletion." });
  }
}

/**
 * Update lawyer verification status (admin use)
 */
export async function updateLawyerVerification(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'verified' or 'pending' or 'rejected'

    if (!['verified', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'verified', 'pending', or 'rejected'." });
    }

    const check = await db.execute({ sql: "SELECT id FROM lawyers WHERE id = ?", args: [id] });
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Advocate not found." });
    }

    await db.execute({
      sql: "UPDATE lawyers SET verification_status = ? WHERE id = ?",
      args: [status, id]
    });

    return res.status(200).json({ message: `Verification status updated to '${status}'.` });
  } catch (error) {
    console.error("Error updating verification:", error);
    return res.status(500).json({ error: "Internal Server Error." });
  }
}

/**
 * Register a new advocate profile
 */
export async function registerLawyer(req, res) {
  try {
    const {
      name,
      gender,
      city,
      position,
      specialty,
      exp,
      fought,
      ongoing,
      won,
      fees,
      contactInfo,
      avatarBase64,
      barCouncilId,
      password
    } = req.body;

    // Validation
    const errors = [];
    if (!name || name.trim() === "") errors.push("Full Name is required.");
    if (!gender || gender.trim() === "") errors.push("Gender is required.");
    if (!city || city.trim() === "") errors.push("City is required.");
    if (!position || position.trim() === "") errors.push("Jurisdiction / Court Position is required.");
    if (!specialty || specialty.trim() === "") errors.push("Practice Area / Lawyer Type is required.");
    if (exp === undefined || exp === "") errors.push("Years of Experience is required.");
    if (fought === undefined || fought === "") errors.push("Cases Fought count is required.");
    if (!fees || fees.trim() === "") errors.push("Average Fees is required.");
    if (!contactInfo || contactInfo.trim() === "") errors.push("Direct Contact Info is required.");

    const parsedExp = parseInt(exp);
    const parsedFought = parseInt(fought);
    const parsedOngoing = parseInt(ongoing);
    const parsedWon = won !== undefined && won !== "" ? parseInt(won) : null;

    if (isNaN(parsedExp) || parsedExp < 0) errors.push("Experience must be a non-negative integer.");
    if (isNaN(parsedFought) || parsedFought < 0) errors.push("Cases Fought must be a non-negative integer.");
    if (ongoing !== undefined && ongoing !== "" && (isNaN(parsedOngoing) || parsedOngoing < 0)) {
      errors.push("Ongoing Cases must be a non-negative integer.");
    }
    if (parsedWon !== null && (isNaN(parsedWon) || parsedWon < 0)) {
      errors.push("Cases Won must be a non-negative integer.");
    }

    if (parsedWon !== null && !isNaN(parsedFought) && !isNaN(parsedWon) && parsedWon > parsedFought) {
      errors.push("Cases Won cannot be greater than total Cases Fought.");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: "Validation Failed", details: errors });
    }

    // CROSS-TABLE UNIQUE CONSTRAINT CHECK
    const checkContact = contactInfo.trim().toLowerCase();
    
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
        contact: contactInfo
      });
    }

    // Auto-calculate properties
    let winRate = "85%";
    if (parsedWon !== null && !isNaN(parsedWon)) {
      const winRateVal = parsedFought > 0 ? Math.round((parsedWon / parsedFought) * 100) : 0;
      winRate = `${winRateVal}%`;
    }
    const barNumber = `BAR #${Math.floor(100000 + Math.random() * 900000)}`;
    const specialtyLabel = SPECIALTY_LABELS[specialty] || "General Law";

    // Sluggify name to get ID
    let slugId = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    if (slugId.startsWith("-")) slugId = slugId.substring(1);
    if (slugId.endsWith("-")) slugId = slugId.slice(0, -1);
    if (slugId === "") slugId = "advocate-" + Math.floor(Math.random() * 1000);

    // Check if ID exists, append unique suffix if needed
    const idCheck = await db.execute({
      sql: "SELECT COUNT(*) as count FROM lawyers WHERE id = ?",
      args: [slugId]
    });
    let finalId = slugId;
    if (idCheck.rows[0].count > 0) {
      finalId = `${slugId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Avatar initials
    const nameParts = name.trim().split(/\s+/);
    const avatarText = nameParts.map(n => n[0]).join("").substring(0, 2).toUpperCase() || "AV";

    // Bio
    const bio = `Verified Advocate practicing in ${position} of ${city}. Dedicated to representing clients in ${specialtyLabel} matters with upfront flat-fee options.`;

    // Packages array
    const packages = [
      { name: "Initial Brief Consultation", price: "₹1,000", desc: "Up to 45 min consultation online or offline." },
      { name: "Standard Case Representation", price: fees, desc: "General counsel and document preparation." }
    ];

    // Verified cases array
    const verifiedCases = [
      { case_type: `Verdict in ${position} Matter`, year: 2024, court_level: position, role: "Petitioner's Counsel" },
      { case_type: `Dispute Resolution under State Codes`, year: 2023, court_level: position, role: "Respondent's Counsel" },
      { case_type: `Compliance Review & Arbitration`, year: 2022, court_level: "Tribunal", role: "Petitioner's Counsel" }
    ];

    // Insert record — verification_status always 'pending' and is_visible 0 on registration
    await db.execute({
      sql: `INSERT INTO lawyers (id, name, specialty, specialty_label, avatar_text, avatar_base64, rating, cases_handled, win_rate, bio, bar_number, bar_council_id, verification_status, password, contact_info, is_visible, packages, verified_cases, is_profile_completed) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 0, ?, ?, 1)`,
      args: [
        finalId,
        name.trim(),
        specialty,
        specialtyLabel,
        avatarText,
        avatarBase64 || null,
        "5.0",
        parsedFought,
        winRate,
        bio,
        barNumber,
        barCouncilId || null,
        password || null,
        contactInfo || null,
        JSON.stringify(packages),
        JSON.stringify(verifiedCases)
      ]
    });

    const responseData = {
      id: finalId,
      name,
      specialty,
      specialtyLabel,
      avatarText,
      avatarBase64: avatarBase64 || null,
      rating: "5.0",
      casesHandled: parsedFought,
      winRate,
      bio,
      barNumber,
      barCouncilId: barCouncilId || null,
      verificationStatus: "pending",
      contactInfo,
      packages,
      verified_cases: verifiedCases,
      isProfileCompleted: true
    };

    return res.status(201).json({
      message: "Advocate profile registered successfully.",
      lawyer: responseData
    });

  } catch (error) {
    console.error("Error registering lawyer:", error);
    // Catch database-level unique constraint violations (LibSQL/SQLite, MySQL, Postgres)
    if (isDuplicateEntryError(error)) {
      return res.status(409).json({
        error: "UserAlreadyExists",
        message: "Account already exists. Please log in."
      });
    }
    return res.status(500).json({ error: "Internal Server Error during registration." });
  }
}

/**
 * Mock DigiLocker verification (to be called by frontend)
 */
export async function verifyDigiLocker(req, res) {
  try {
    const { lawyerId, barCouncilId, contactInfo } = req.body;

    if (!barCouncilId) {
      return res.status(400).json({ error: "barCouncilId is required." });
    }

    let resolvedId = lawyerId;

    // If lawyerId provided, try to find by ID first
    if (lawyerId) {
      const check = await db.execute({ sql: "SELECT id FROM lawyers WHERE id = ?", args: [lawyerId] });
      if (check.rows.length === 0) {
        // Fallback: try to find by contactInfo
        if (contactInfo) {
          const fallback = await db.execute({
            sql: "SELECT id FROM lawyers WHERE contact_info = ?",
            args: [contactInfo]
          });
          if (fallback.rows.length > 0) {
            resolvedId = fallback.rows[0].id;
          } else {
            return res.status(404).json({ error: "Advocate not found. Please ensure you are logged in with the correct account." });
          }
        } else {
          return res.status(404).json({ error: "Advocate not found. Please ensure you are logged in with the correct account." });
        }
      }
    } else if (contactInfo) {
      // No lawyerId provided — find by contactInfo
      const fallback = await db.execute({
        sql: "SELECT id FROM lawyers WHERE contact_info = ?",
        args: [contactInfo]
      });
      if (fallback.rows.length > 0) {
        resolvedId = fallback.rows[0].id;
      } else {
        return res.status(404).json({ error: "Advocate not found. Please ensure you are logged in with the correct account." });
      }
    } else {
      return res.status(400).json({ error: "Either lawyerId or contactInfo is required." });
    }

    // Update status to verified and make profile visible
    await db.execute({
      sql: "UPDATE lawyers SET verification_status = 'verified', is_visible = 1, bar_council_id = ? WHERE id = ?",
      args: [barCouncilId, resolvedId]
    });

    return res.status(200).json({ message: "DigiLocker verification successful. Profile is now visible.", lawyerId: resolvedId });
  } catch (error) {
    console.error("Error verifying via DigiLocker:", error);
    return res.status(500).json({ error: "Internal Server Error during DigiLocker verification." });
  }
}

export async function updateLawyerProfile(req, res) {
  try {
    const { id } = req.params;
    const { name, specialty, fought, won, bio, avatarBase64 } = req.body;
    const parsedFought = parseInt(fought) || 0;
    const parsedWon = won ? parseInt(won) : 0;
    let winRate = '85%';
    if (parsedFought > 0) winRate = `${Math.round((parsedWon / parsedFought) * 100)}%`;
    const nameParts = (name || '').trim().split(/\s+/);
    const avatarText = nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AV';
    await db.execute({
      sql: 'UPDATE lawyers SET name = ?, specialty = ?, avatar_text = ?, avatar_base64 = COALESCE(?, avatar_base64), cases_handled = ?, win_rate = ?, bio = ?, is_profile_completed = 1 WHERE id = ?',
      args: [name, specialty, avatarText, avatarBase64 || null, parsedFought, winRate, bio || '', id]
    });
    const updated = await db.execute({ sql: 'SELECT * FROM lawyers WHERE id = ?', args: [id] });
    const row = updated.rows[0];
    const lawyer = {
      id: row.id, name: row.name, specialty: row.specialty, specialtyLabel: row.specialty_label,
      avatarText: row.avatar_text, avatarBase64: row.avatar_base64, rating: row.rating,
      casesHandled: Number(row.cases_handled), winRate: row.win_rate, bio: row.bio,
      barNumber: row.bar_number, barCouncilId: row.bar_council_id,
      verificationStatus: row.verification_status || 'pending', contactInfo: row.contact_info,
      packages: JSON.parse(row.packages), verified_cases: JSON.parse(row.verified_cases),
      isProfileCompleted: row.is_profile_completed === 1
    };
    return res.status(200).json({ message: 'Profile updated successfully.', user: lawyer });
  } catch (error) {
    console.error('Error updating lawyer:', error);
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

