-- USDA FoodData Central — local reference copy for autocomplete, nutrient math, and linking recipe lines.
-- Import from official **bulk CSV** downloads (not the per-item JSON API) for reasonable load size and tooling.
--
-- ## Which downloads to use (you do *not* need every CSV in the full bundle)
-- Source: https://fdc.nal.usda.gov/download-datasets.html
--
-- - **Prefer two small zips** — **Foundation Foods (CSV)** + **SR Legacy (CSV)**. Together they are on the order of
--   ~10 MB zipped vs **Full Download of All Data Types** (~450 MB+ zipped / ~3 GB+ unzipped) which also pulls in
--   **Branded** and **FNDDS (survey)** and many auxiliary files you do not need for generic ingredient lookup.
-- - Since **April 2023**, each data-type archive includes **supporting** reference files (e.g. `nutrient.csv`) inside
--   the same zip, so you do not need the separate historical “Supporting Data” download for current releases.
-- - **Product policy here:** treat **Foundation** as higher quality / newer lab-analyzed foods (smaller set);
--   use **SR Legacy** for breadth when Foundation has no good match (`search_fdc_foods` orders by `data_type` for that).
--
-- ## CSV files that actually feed *these* tables
-- | Your table            | File(s) | Notes |
-- |-----------------------|---------|--------|
-- | `fdc_nutrients`       | `nutrient.csv` | Load **once** (same dictionary across types). |
-- | `fdc_foods`           | `food.csv`     | From Foundation zip + SR Legacy zip: keep only `data_type` in (`foundation_food`, `sr_legacy_food`). |
-- | `fdc_food_nutrients`  | `food_nutrient.csv` | Keep rows whose `fdc_id` exists in `fdc_foods`. |
-- | `fdc_food_portions`   | `food_portion.csv` | **Optional** — only if you want household measures (cup, slice) → grams from FDC; skip if you only show **per 100 g** nutrition. |
--
-- **You can ignore** (for this schema): `branded_food*`, `survey_*` / FNDDS-specific tables, `input_food`, acquisition /
-- lab / microbe / sub-sample files, etc. They are useful for other products; they do not map to the four tables here.
--
-- ## Suggested import order (after creating tables)
-- 1. `fdc_nutrients`        ← `nutrient.csv`
-- 2. `fdc_foods`            ← `food.csv` rows for `foundation_food` and `sr_legacy_food` (merge both zips)
-- 3. `fdc_food_nutrients`   ← `food_nutrient.csv` filtered by `fdc_id` in `fdc_foods`
-- 4. `fdc_food_portions`    ← `food_portion.csv` (optional), same `fdc_id` filter
--
-- Tools: `psql \copy ... FROM '...' CSV HEADER`, or a Node/Python script with batch INSERTs, or Supabase
-- Storage + COPY. Use **service_role** or direct Postgres (not anon RLS) for bulk load.
--
-- ## Autocomplete ranking
-- Prefer Foundation over SR Legacy using `ORDER BY CASE data_type WHEN 'foundation_food' THEN 0 … END`, then
-- `similarity(description, :needle)` (see `search_fdc_foods`).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE fdc_nutrients (
    nutrient_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    rank INTEGER
);

CREATE TABLE fdc_foods (
    fdc_id BIGINT PRIMARY KEY,
    data_type TEXT NOT NULL,
    description TEXT NOT NULL,
    CONSTRAINT fdc_foods_description_nonempty CHECK (length(trim(description)) > 0)
);

CREATE INDEX fdc_foods_data_type_idx ON fdc_foods (data_type);
CREATE INDEX fdc_foods_description_trgm_idx ON fdc_foods USING gin (description gin_trgm_ops);

CREATE TABLE fdc_food_nutrients (
    id BIGINT PRIMARY KEY,
    fdc_id BIGINT NOT NULL REFERENCES fdc_foods (fdc_id) ON DELETE CASCADE,
    nutrient_id INTEGER NOT NULL REFERENCES fdc_nutrients (nutrient_id) ON DELETE CASCADE,
    -- FDC amounts are typically **per 100 g** edible portion for these datasets (confirm in your import notes).
    amount NUMERIC NOT NULL,
    UNIQUE (fdc_id, nutrient_id)
);

CREATE INDEX fdc_food_nutrients_fdc_id_idx ON fdc_food_nutrients (fdc_id);

CREATE TABLE fdc_food_portions (
    id BIGINT PRIMARY KEY,
    fdc_id BIGINT NOT NULL REFERENCES fdc_foods (fdc_id) ON DELETE CASCADE,
    amount NUMERIC,
    gram_weight NUMERIC,
    measure_unit TEXT,
    portion_description TEXT,
    modifier TEXT,
    CONSTRAINT fdc_food_portions_gram_positive CHECK (gram_weight IS NULL OR gram_weight > 0)
);

CREATE INDEX fdc_food_portions_fdc_id_idx ON fdc_food_portions (fdc_id);

ALTER TABLE fdc_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdc_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdc_food_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdc_food_portions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fdc_nutrients read for all"
ON fdc_nutrients FOR SELECT USING (true);

CREATE POLICY "fdc_foods read for all"
ON fdc_foods FOR SELECT USING (true);

CREATE POLICY "fdc_food_nutrients read for all"
ON fdc_food_nutrients FOR SELECT USING (true);

CREATE POLICY "fdc_food_portions read for all"
ON fdc_food_portions FOR SELECT USING (true);

-- Optional RPC: Foundation-first substring search (requires `pg_trgm` similarity; `search_term` ≥ 2 chars).
CREATE OR REPLACE FUNCTION public.search_fdc_foods(search_term text, max_results integer DEFAULT 20)
RETURNS SETOF fdc_foods
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT f.*
    FROM fdc_foods f
    WHERE length(trim(search_term)) >= 2
      AND f.data_type IN ('foundation_food', 'sr_legacy_food')
      AND f.description ILIKE '%' || trim(search_term) || '%'
    ORDER BY
        CASE f.data_type
            WHEN 'foundation_food' THEN 0
            WHEN 'sr_legacy_food' THEN 1
            ELSE 9
        END ASC,
        similarity(f.description, trim(search_term)) DESC
    LIMIT least(coalesce(nullif(max_results, 0), 20), 100);
$$;

GRANT EXECUTE ON FUNCTION public.search_fdc_foods(text, integer) TO anon, authenticated;
