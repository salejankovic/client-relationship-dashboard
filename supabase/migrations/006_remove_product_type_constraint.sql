-- Migration: Remove rigid product_type constraint
-- Date: 2026-01-22
-- Description: Remove CHECK constraint on product_type to allow dynamic products from products table

-- Drop the CHECK constraint on product_type
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_product_type_check;

-- Also drop the constraint on prospect_type if it's too restrictive
-- We'll keep it for now since prospect types are still managed dynamically

-- Note: After this migration, product_type can be any TEXT value
-- This allows flexibility to add new products through the products table
-- without requiring database migrations
