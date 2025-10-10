const pool = require("../database/")

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications(){
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
  }
}

/* ***************************
 *  Get a single vehicle by inv_id (parameterized)
 * ************************** */
async function getVehicleById(inv_id) {
  const sql = `
    SELECT i.*, c.classification_name
    FROM public.inventory i
    JOIN public.classification c
      ON i.classification_id = c.classification_id
    WHERE i.inv_id = $1
    LIMIT 1;
  `;
  const result = await pool.query(sql, [inv_id]);
  return result.rows[0] || null;
}

/* ***************************
 *  Add new classification
 * ************************** */
async function addClassification(classification_name) {
  const sql = `INSERT INTO public.classification (classification_name)
              VALUES ($1) RETURNING *`
  return pool.query(sql, [classification_name])
}

/* ***************************
 *  Add new inventory item
 * ************************** */
async function addInventory({
  inv_make,
  inv_model,
  inv_year,
  inv_description,
  inv_image,
  inv_thumbnail,
  inv_price,
  inv_miles,
  inv_color,
  classification_id,
}) {
  const sql = `
    INSERT INTO public.inventory (
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *;
  `
  const params = [
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id,
  ]
  return pool.query(sql, params)
}

/* ***************************
 *  Inventory analytics helpers
 * ************************** */
async function getInventorySummaryMetrics() {
  const sql = `
    SELECT
      COUNT(inv_id)::int AS total_vehicles,
      COALESCE(SUM(inv_price), 0)::numeric AS total_value,
      COALESCE(AVG(inv_price), 0)::numeric AS average_price,
      COALESCE(AVG(inv_miles), 0)::numeric AS average_mileage,
      COALESCE(MAX(inv_price), 0)::numeric AS highest_price,
      COALESCE(MIN(inv_price), 0)::numeric AS lowest_price
    FROM public.inventory;
  `
  const result = await pool.query(sql)
  return result.rows[0]
}

async function getInventoryByClassificationSummary() {
  const sql = `
    SELECT
      c.classification_id,
      c.classification_name,
      COUNT(i.inv_id)::int AS vehicle_count,
      COALESCE(SUM(i.inv_price), 0)::numeric AS total_value,
      COALESCE(AVG(i.inv_price), 0)::numeric AS average_price
    FROM public.classification c
    LEFT JOIN public.inventory i
      ON i.classification_id = c.classification_id
    GROUP BY c.classification_id, c.classification_name
    ORDER BY vehicle_count DESC, c.classification_name;
  `
  const result = await pool.query(sql)
  return result.rows
}

async function getTopPricedVehicles(limit = 5) {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 5
  const sql = `
    SELECT
      i.inv_id,
      i.inv_make,
      i.inv_model,
      i.inv_year,
      i.inv_price,
      i.inv_miles,
      c.classification_name
    FROM public.inventory i
    JOIN public.classification c
      ON i.classification_id = c.classification_id
    ORDER BY i.inv_price DESC, i.inv_year DESC
    LIMIT $1;
  `
  const result = await pool.query(sql, [safeLimit])
  return result.rows
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  addClassification,
  addInventory,
  getInventorySummaryMetrics,
  getInventoryByClassificationSummary,
  getTopPricedVehicles,
};
