-- Migration: tracking user's last viewed section for "new" badges
-- Run this once to create the tracking table

CREATE TABLE IF NOT EXISTS user_section_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    section VARCHAR(50) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_section (user_id, section),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed initial views for existing admin users (set to distant past so all current items show as "new")
INSERT IGNORE INTO user_section_views (user_id, section, viewed_at)
SELECT u.id, s.section, '2000-01-01'
FROM users u
CROSS JOIN (SELECT 'maintenance' AS section UNION SELECT 'incidents') s
WHERE u.role IN ('admin', 'superadmin');
