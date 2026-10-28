const { getPool, json, text } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  if (body.companyWebsite) return json(res, 200, { ok: true, message: "Thank you for subscribing." });
  const email = text(body.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(res, 400, { error: "Enter a valid email address." });
  }
  try {
    const pool = getPool();
    await pool.query(
      "INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET status = 'subscribed', consented_at = NOW()",
      [email]
    );
    return json(res, 201, { ok: true, message: "Thank you for subscribing to the AUREVÉ Journal." });
  } catch (error) {
    console.error("AUREVE newsletter:", error.message);
    return json(res, error.statusCode || 500, { error: error.statusCode === 503 ? error.message : "Could not complete newsletter signup." });
  }
};
