const { getPool, json, text } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const business = text(body.businessName, 180);
  const contact = text(body.contactName, 120);
  const email = text(body.email, 254).toLowerCase();
  const phone = text(body.phone, 40);
  const country = text(body.country, 100);
  const message = text(body.message, 2000);
  const categories = Array.isArray(body.categories)
    ? body.categories.map(value => text(value, 80)).filter(Boolean).slice(0, 20)
    : [];
  if (business.length < 2 || contact.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(res, 400, { error: "Business name, contact name, and a valid email are required." });
  }
  if (body.companyWebsite) return json(res, 200, { ok: true });
  try {
    const pool = getPool();
    const result = await pool.query(
      "INSERT INTO seller_applications (business_name, contact_name, email, phone, country, categories, message) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at",
      [business, contact, email, phone || null, country || null, categories, message || null]
    );
    return json(res, 201, { ok: true, applicationId: result.rows[0].id, message: "Your seller application has been submitted for review." });
  } catch (error) {
    console.error("AUREVE seller application:", error.message);
    return json(res, error.statusCode || 500, { error: error.statusCode === 503 ? error.message : "Could not submit your application." });
  }
};
