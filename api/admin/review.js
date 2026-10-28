const { getPool, json, text } = require("../_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    res.setHeader("Allow", "GET, PATCH");
    return json(res, 405, { error: "Method not allowed" });
  }
  const expected = process.env.AUREVE_ADMIN_TOKEN;
  const supplied = text(req.headers["x-admin-token"], 500);
  if (!expected || supplied.length !== expected.length ||
      !require("crypto").timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return json(res, 401, { error: "Unauthorized" });
  }
  try {
    const pool = getPool();
    if (req.method === "GET") {
      const [listings, enquiries, sellers] = await Promise.all([
        pool.query("SELECT * FROM listings WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100"),
        pool.query("SELECT * FROM enquiries WHERE status = 'new' ORDER BY created_at DESC LIMIT 100"),
        pool.query("SELECT * FROM seller_applications WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100")
      ]);
      return json(res, 200, { pendingListings: listings.rows, newEnquiries: enquiries.rows, pendingSellerApplications: sellers.rows });
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const kind = text(body.kind, 30);
    const id = text(body.id, 50);
    const action = text(body.action, 30);
    const allowed = {
      listing: { approve: "published", reject: "rejected" },
      seller: { approve: "approved", reject: "rejected" },
      enquiry: { contact: "contacted", close: "closed", spam: "spam" }
    };
    if (!allowed[kind] || !allowed[kind][action] || !/^[0-9a-f-]{36}$/i.test(id)) {
      return json(res, 400, { error: "Provide a valid kind, record ID, and action." });
    }
    const table = kind === "listing" ? "listings" : kind === "seller" ? "seller_applications" : "enquiries";
    const status = allowed[kind][action];
    const result = await pool.query(`UPDATE ${table} SET status = $1 WHERE id = $2 RETURNING id, status`, [status, id]);
    if (!result.rowCount) return json(res, 404, { error: "Record not found." });
    return json(res, 200, { ok: true, record: result.rows[0] });
  } catch (error) {
    console.error("AUREVE admin review:", error.message);
    return json(res, error.statusCode || 500, { error: error.statusCode === 503 ? error.message : "Admin review failed." });
  }
};
