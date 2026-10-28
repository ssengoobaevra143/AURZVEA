const { getPool, json, text } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const listingId = text(body.listingId, 50);
  const name = text(body.name, 120);
  const email = text(body.email, 254).toLowerCase();
  const phone = text(body.phone, 40);
  const message = text(body.message, 3000);
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return json(res, 400, { error: "Enter your name, a valid email address, and a message of at least 10 characters." });
  }
  if (body.companyWebsite) return json(res, 200, { ok: true });
  try {
    const pool = getPool();
    let validListingId = null;
    if (listingId) {
      const found = await pool.query("SELECT id FROM listings WHERE id = $1 AND status = 'published'", [listingId]);
      if (!found.rowCount) return json(res, 400, { error: "That listing is unavailable." });
      validListingId = found.rows[0].id;
    }
    const result = await pool.query(
      "INSERT INTO enquiries (listing_id, buyer_name, buyer_email, buyer_phone, message) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at",
      [validListingId, name, email, phone || null, message]
    );
    return json(res, 201, { ok: true, enquiryId: result.rows[0].id, message: "Your enquiry has been received." });
  } catch (error) {
    console.error("AUREVE enquiry:", error.message);
    return json(res, error.statusCode || 500, { error: error.statusCode === 503 ? error.message : "Could not submit your enquiry." });
  }
};
