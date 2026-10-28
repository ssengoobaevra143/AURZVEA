const { getPool, json, text } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Method not allowed" });
  }
  try {
    const pool = getPool();
    const category = text(req.query.category, 80);
    const q = text(req.query.q, 120);
    const location = text(req.query.location, 100);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 24, 1), 60);
    const values = [];
    const where = ["status = 'published'"];
    if (category && category.toLowerCase() !== "all") {
      values.push(category);
      where.push(`category = $${values.length}`);
    }
    if (q) {
      values.push(`%${q.replace(/[\\%_]/g, "\\$&")}%`);
      where.push(`(title ILIKE $ ${values.length} ESCAPE '\\\\' OR description ILIKE $${values.length} ESCAPE '\\\\' OR category ILIKE $${values.length} ESCAPE '\\\\')`.replace("$ ", "$"));
    }
    if (location) {
      values.push(`%${location.replace(/[\\%_]/g, "\\$&")}%`);
      where.push(`location ILIKE $${values.length} ESCAPE '\\\\'`);
    }
    values.push(limit);
    const result = await pool.query(
      `SELECT id, title, category, description, price_amount, price_currency, price_label, location, image_url, seller_name, featured, created_at
       FROM listings WHERE ${where.join(" AND ")}
       ORDER BY featured DESC, created_at DESC LIMIT $${values.length}`,
      values
    );
    return json(res, 200, { listings: result.rows, count: result.rowCount });
  } catch (error) {
    console.error("AUREVE listings:", error.message);
    return json(res, error.statusCode || 500, { error: error.statusCode === 503 ? error.message : "Could not load listings." });
  }
};
