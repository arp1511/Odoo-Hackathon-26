-- V6__fix_seeded_passwords.sql
-- Update seeded users password_hash to the correct BCrypt hash of 'password123'

UPDATE users 
SET password_hash = '$2a$10$bMuGd8WAnoab1Mc6Luei1ey8j9AfJsb2Wqs9XRtEkbmfj8yZqR54e' 
WHERE email IN (
    'manager@transitops.com', 
    'dispatcher@transitops.com', 
    'safety@transitops.com', 
    'finance@transitops.com'
);
