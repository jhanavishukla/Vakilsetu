import db from "../config/db.js";

// POST /api/bookings
export async function createBooking(req, res) {
  try {
    const { lawyerId, clientId, clientName, brief, date, mode } = req.body;
    
    if (!lawyerId || !clientId || !clientName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bookingId = "bk-" + Date.now();

    await db.execute({
      sql: `INSERT INTO bookings (id, lawyer_id, client_id, client_name, brief, date, mode, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'New Inquiry')`,
      args: [bookingId, lawyerId, clientId, clientName, brief || '', date || '', mode || '']
    });

    return res.status(201).json({ success: true, bookingId });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ error: "Failed to create booking" });
  }
}

// GET /api/bookings/:lawyerId
export async function getLawyerBookings(req, res) {
  try {
    const { lawyerId } = req.params;
    
    const result = await db.execute({
      sql: "SELECT * FROM bookings WHERE lawyer_id = ? ORDER BY created_at DESC",
      args: [lawyerId]
    });

    return res.status(200).json({ bookings: result.rows });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
}
