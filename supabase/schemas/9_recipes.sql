-- Recipes (public or private), ordered steps, structured ingredients, tags, and nutrient snapshots.
-- Links to `fdc_foods.fdc_id` when the user picks a USDA row from autocomplete; snapshot JSONB keeps stable totals.
--
-- Steps: every recipe has ≥1 step in app code; DB enforces non-empty `body` per row (not “at least one row” —
-- use a transaction in the app or a deferred constraint trigger if you want that in SQL).
--
-- Ingredients: `quantity` and `unit` are **optional** (e.g. “1 onion” is not naturally a cup). When present,
-- `quantity` must be positive and `unit` non-empty. `ingredient_phrase` is the parsed product name (“milk”) for
-- `fdc_foods` / `search_fdc_foods`; `raw_line` preserves the original line.

CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    image_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    servings NUMERIC,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    nutrition_total JSONB,
    nutrition_total_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT recipes_servings_positive CHECK (servings IS NULL OR servings > 0),
    CONSTRAINT recipes_prep_non_negative CHECK (prep_time_minutes IS NULL OR prep_time_minutes >= 0),
    CONSTRAINT recipes_cook_non_negative CHECK (cook_time_minutes IS NULL OR cook_time_minutes >= 0)
);

CREATE INDEX recipes_owner_id_idx ON recipes (owner_id);
CREATE INDEX recipes_public_created_idx ON recipes (created_at DESC) WHERE is_public = true;
CREATE INDEX recipes_owner_created_idx ON recipes (owner_id, created_at DESC);

CREATE TRIGGER set_updated_at_recipes
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    body TEXT NOT NULL,
    CONSTRAINT recipe_steps_order_non_negative CHECK (step_order >= 0),
    CONSTRAINT recipe_steps_body_nonempty CHECK (length(trim(body)) > 0),
    UNIQUE (recipe_id, step_order)
);

CREATE INDEX recipe_steps_recipe_id_idx ON recipe_steps (recipe_id, step_order);

CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    raw_line TEXT NOT NULL,
    quantity NUMERIC,
    unit TEXT,
    -- Parsed name for USDA search (“milk”, “all-purpose flour”); user refines via dropdown.
    ingredient_phrase TEXT NOT NULL,
    usda_fdc_id BIGINT REFERENCES fdc_foods (fdc_id) ON DELETE SET NULL,
    usda_food_description TEXT,
    nutrition JSONB,
    nutrition_snapshot_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT recipe_ingredients_sort_non_negative CHECK (sort_order >= 0),
    CONSTRAINT recipe_ingredients_quantity_positive CHECK (quantity IS NULL OR quantity > 0),
    CONSTRAINT recipe_ingredients_unit_nonempty CHECK (unit IS NULL OR length(trim(unit)) > 0),
    CONSTRAINT recipe_ingredients_phrase_nonempty CHECK (length(trim(ingredient_phrase)) > 0),
    CONSTRAINT recipe_ingredients_raw_nonempty CHECK (length(trim(raw_line)) > 0)
);

CREATE INDEX recipe_ingredients_recipe_id_idx ON recipe_ingredients (recipe_id, sort_order);
CREATE INDEX recipe_ingredients_usda_fdc_id_idx ON recipe_ingredients (usda_fdc_id)
    WHERE usda_fdc_id IS NOT NULL;

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE recipe_tags (
    recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, tag_id)
);

CREATE INDEX recipe_tags_tag_id_idx ON recipe_tags (tag_id);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
ON tags FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tags"
ON tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Recipes are viewable if public or owned"
ON recipes FOR SELECT USING (
    is_public = true OR (select auth.uid()) = owner_id
);

CREATE POLICY "Users can create recipes as themselves"
ON recipes FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Users can update own recipes"
ON recipes FOR UPDATE TO authenticated
USING ((select auth.uid()) = owner_id)
WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Users can delete own recipes"
ON recipes FOR DELETE TO authenticated
USING ((select auth.uid()) = owner_id);

CREATE POLICY "Recipe steps visible with recipe"
ON recipe_steps FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_steps.recipe_id
          AND (r.is_public = true OR r.owner_id = (select auth.uid()))
    )
);

CREATE POLICY "Owners manage recipe_steps insert"
ON recipe_steps FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_steps.recipe_id AND r.owner_id = (select auth.uid())
    )
);

CREATE POLICY "Owners manage recipe_steps update"
ON recipe_steps FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_steps.recipe_id AND r.owner_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_steps.recipe_id AND r.owner_id = (select auth.uid())
    )
);

CREATE POLICY "Owners manage recipe_steps delete"
ON recipe_steps FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_steps.recipe_id AND r.owner_id = (select auth.uid())
    )
);

CREATE POLICY "Recipe ingredients visible with recipe"
ON recipe_ingredients FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id
          AND (r.is_public = true OR r.owner_id = (select auth.uid()))
    )
);

CREATE POLICY "Owners manage recipe_ingredients insert"
ON recipe_ingredients FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id AND r.owner_id = (select auth.uid())
    )
);

CREATE POLICY "Owners manage recipe_ingredients update"
ON recipe_ingredients FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id AND r.owner_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id AND r.owner_id = (select auth.uid())
    )
);

CREATE POLICY "Owners manage recipe_ingredients delete"
ON recipe_ingredients FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_ingredients.recipe_id AND r.owner_id = (select auth.uid())
    )
);

CREATE POLICY "Recipe tags visible with recipe"
ON recipe_tags FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_tags.recipe_id
          AND (r.is_public = true OR r.owner_id = (select auth.uid()))
    )
);

CREATE POLICY "Owners manage recipe_tags insert"
ON recipe_tags FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_tags.recipe_id AND r.owner_id = (select auth.uid())
    )
);

CREATE POLICY "Owners manage recipe_tags delete"
ON recipe_tags FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM recipes r
        WHERE r.id = recipe_tags.recipe_id AND r.owner_id = (select auth.uid())
    )
);
