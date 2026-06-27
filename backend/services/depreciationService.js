const pool = require('../config/database');

// Derive depreciation rate from useful life years (TT 45/2013/TT-BTC)
const getRateFromUsefulLife = (usefulLifeYears) => {
  if (!usefulLifeYears || usefulLifeYears <= 0) return 0.20;
  return 1 / usefulLifeYears;
};

// Calculate remaining value using straight-line method per Vietnamese regulations
const calculateDepreciation = (purchasePrice, depreciationRate, monthsElapsed) => {
  const monthlyRate = depreciationRate / 100 / 12;
  const totalDepreciation = Math.min(purchasePrice * monthlyRate * monthsElapsed, purchasePrice);
  return Math.max(0, purchasePrice - totalDepreciation);
};

// List all assets with depreciation data
const listAssetsWithDepreciation = async () => {
  try {
    const query = `
      SELECT 
        d.id,
        d.device_code,
        d.name,
        d.brand,
        d.model,
        d.purchase_date,
        d.purchase_price,
        d.status,
        d.depreciation_rate,
        dc.name AS category_name,
        dc.useful_life_years,
        dept.name AS department_name
      FROM devices d
      LEFT JOIN device_categories dc ON d.category_id = dc.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE d.purchase_date IS NOT NULL AND d.purchase_price > 0
      ORDER BY d.created_at DESC
    `;
    
    const [rows] = await pool.promise().query(query);
    
    // Calculate remaining value for each asset
    const assetsWithDepreciation = rows.map(asset => {
      const purchaseDate = new Date(asset.purchase_date);
      const today = new Date();
      const monthsElapsed = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                           (today.getMonth() - purchaseDate.getMonth());
      
      // Use useful_life_years from category to derive rate; fallback to device depreciation_rate
      const rateFromLife = getRateFromUsefulLife(asset.useful_life_years);
      const deviceRate = asset.depreciation_rate != null ? Number(asset.depreciation_rate) / 100 : rateFromLife;
      const effectiveRate = deviceRate * 100; // convert to percentage for calculateDepreciation
      
      const remainingValue = calculateDepreciation(
        asset.purchase_price,
        effectiveRate,
        monthsElapsed
      );
      
      return {
        ...asset,
        useful_life_years: asset.useful_life_years,
        depreciation_rate: effectiveRate,
        months_elapsed: Math.max(0, monthsElapsed),
        depreciation_amount: asset.purchase_price - remainingValue,
        remaining_value: remainingValue
      };
    });
    
    return assetsWithDepreciation;
  } catch (err) {
    console.error('Error fetching assets with depreciation:', err);
    throw err;
  }
};

// Update depreciation rate for a specific asset
const updateDepreciationRate = async (assetId, depreciationRate, userId) => {
  try {
    const query = `
      UPDATE devices 
      SET depreciation_rate = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await pool.promise().query(query, [depreciationRate, assetId]);
    
    if (result.affectedRows === 0) {
      return false;
    }
    
    // Record audit log
    try {
      const auditQuery = `
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      await pool.promise().query(auditQuery, [
        userId,
        'UPDATE',
        'devices',
        assetId,
        null,
        `depreciation_rate: ${depreciationRate}`
      ]);
    } catch (auditErr) {
      console.error('Error recording audit log:', auditErr);
    }
    
    return true;
  } catch (err) {
    console.error('Error updating depreciation rate:', err);
    throw err;
  }
};

// Get yearly depreciation summary
const getYearlySummary = async () => {
  try {
    const query = `
      SELECT 
        d.id,
        d.device_code,
        d.name,
        d.purchase_price,
        d.purchase_date,
        d.depreciation_rate,
        dc.name AS category_name,
        dc.useful_life_years
      FROM devices d
      LEFT JOIN device_categories dc ON d.category_id = dc.id
      WHERE d.purchase_date IS NOT NULL AND d.purchase_price > 0
      ORDER BY d.purchase_date DESC
    `;
    
    const [rows] = await pool.promise().query(query);
    
    const summaryByYear = {};
    
    rows.forEach(asset => {
      const rateFromLife = getRateFromUsefulLife(asset.useful_life_years);
      const deviceRate = asset.depreciation_rate != null ? Number(asset.depreciation_rate) / 100 : rateFromLife;
      const effectiveRate = deviceRate * 100;
      
      const purchaseYear = new Date(asset.purchase_date).getFullYear();
      const purchaseDate = new Date(asset.purchase_date);
      const today = new Date();
      const monthsElapsed = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                           (today.getMonth() - purchaseDate.getMonth());
      
      const remainingValue = calculateDepreciation(
        asset.purchase_price,
        effectiveRate,
        monthsElapsed
      );
      
      const depreciationAmount = asset.purchase_price - remainingValue;
      
      if (!summaryByYear[purchaseYear]) {
        summaryByYear[purchaseYear] = {
          year: purchaseYear,
          total_purchase_price: 0,
          total_depreciation: 0,
          total_remaining_value: 0,
          asset_count: 0
        };
      }
      
      summaryByYear[purchaseYear].total_purchase_price += asset.purchase_price;
      summaryByYear[purchaseYear].total_depreciation += depreciationAmount;
      summaryByYear[purchaseYear].total_remaining_value += remainingValue;
      summaryByYear[purchaseYear].asset_count += 1;
    });
    
    return Object.values(summaryByYear).sort((a, b) => a.year - b.year);
  } catch (err) {
    console.error('Error fetching yearly summary:', err);
    throw err;
  }
};

module.exports = {
  listAssetsWithDepreciation,
  updateDepreciationRate,
  getYearlySummary
};
