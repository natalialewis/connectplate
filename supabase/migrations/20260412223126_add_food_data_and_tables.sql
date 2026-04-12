create extension if not exists "pg_trgm" with schema "public";


  create table "public"."fdc_food_nutrients" (
    "id" bigint not null,
    "fdc_id" bigint not null,
    "nutrient_id" integer not null,
    "amount" numeric not null
      );


alter table "public"."fdc_food_nutrients" enable row level security;


  create table "public"."fdc_food_portions" (
    "id" bigint not null,
    "fdc_id" bigint not null,
    "amount" numeric,
    "gram_weight" numeric,
    "measure_unit" text,
    "portion_description" text,
    "modifier" text
      );


alter table "public"."fdc_food_portions" enable row level security;


  create table "public"."fdc_foods" (
    "fdc_id" bigint not null,
    "data_type" text not null,
    "description" text not null
      );


alter table "public"."fdc_foods" enable row level security;


  create table "public"."fdc_nutrients" (
    "nutrient_id" integer not null,
    "name" text not null,
    "unit_name" text not null,
    "rank" integer
      );


alter table "public"."fdc_nutrients" enable row level security;


  create table "public"."recipe_ingredients" (
    "id" uuid not null default gen_random_uuid(),
    "recipe_id" uuid not null,
    "sort_order" integer not null,
    "raw_line" text not null,
    "quantity" numeric,
    "unit" text,
    "ingredient_phrase" text not null,
    "usda_fdc_id" bigint,
    "usda_food_description" text,
    "nutrition" jsonb,
    "nutrition_snapshot_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP
      );


alter table "public"."recipe_ingredients" enable row level security;


  create table "public"."recipe_steps" (
    "id" uuid not null default gen_random_uuid(),
    "recipe_id" uuid not null,
    "step_order" integer not null,
    "body" text not null
      );


alter table "public"."recipe_steps" enable row level security;


  create table "public"."recipe_tags" (
    "recipe_id" uuid not null,
    "tag_id" uuid not null
      );


alter table "public"."recipe_tags" enable row level security;


  create table "public"."recipes" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "title" text not null,
    "description" text,
    "notes" text,
    "image_url" text,
    "is_public" boolean not null default true,
    "servings" numeric,
    "prep_time_minutes" integer,
    "cook_time_minutes" integer,
    "nutrition_total" jsonb,
    "nutrition_total_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone not null default CURRENT_TIMESTAMP
      );


alter table "public"."recipes" enable row level security;


  create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "label" text not null,
    "created_at" timestamp with time zone not null default CURRENT_TIMESTAMP
      );


alter table "public"."tags" enable row level security;

CREATE INDEX fdc_food_nutrients_fdc_id_idx ON public.fdc_food_nutrients USING btree (fdc_id);

CREATE UNIQUE INDEX fdc_food_nutrients_fdc_id_nutrient_id_key ON public.fdc_food_nutrients USING btree (fdc_id, nutrient_id);

CREATE UNIQUE INDEX fdc_food_nutrients_pkey ON public.fdc_food_nutrients USING btree (id);

CREATE INDEX fdc_food_portions_fdc_id_idx ON public.fdc_food_portions USING btree (fdc_id);

CREATE UNIQUE INDEX fdc_food_portions_pkey ON public.fdc_food_portions USING btree (id);

CREATE INDEX fdc_foods_data_type_idx ON public.fdc_foods USING btree (data_type);

CREATE INDEX fdc_foods_description_trgm_idx ON public.fdc_foods USING gin (description public.gin_trgm_ops);

CREATE UNIQUE INDEX fdc_foods_pkey ON public.fdc_foods USING btree (fdc_id);

CREATE UNIQUE INDEX fdc_nutrients_pkey ON public.fdc_nutrients USING btree (nutrient_id);

CREATE UNIQUE INDEX recipe_ingredients_pkey ON public.recipe_ingredients USING btree (id);

CREATE INDEX recipe_ingredients_recipe_id_idx ON public.recipe_ingredients USING btree (recipe_id, sort_order);

CREATE INDEX recipe_ingredients_usda_fdc_id_idx ON public.recipe_ingredients USING btree (usda_fdc_id) WHERE (usda_fdc_id IS NOT NULL);

CREATE UNIQUE INDEX recipe_steps_pkey ON public.recipe_steps USING btree (id);

CREATE INDEX recipe_steps_recipe_id_idx ON public.recipe_steps USING btree (recipe_id, step_order);

CREATE UNIQUE INDEX recipe_steps_recipe_id_step_order_key ON public.recipe_steps USING btree (recipe_id, step_order);

CREATE UNIQUE INDEX recipe_tags_pkey ON public.recipe_tags USING btree (recipe_id, tag_id);

CREATE INDEX recipe_tags_tag_id_idx ON public.recipe_tags USING btree (tag_id);

CREATE INDEX recipes_owner_created_idx ON public.recipes USING btree (owner_id, created_at DESC);

CREATE INDEX recipes_owner_id_idx ON public.recipes USING btree (owner_id);

CREATE UNIQUE INDEX recipes_pkey ON public.recipes USING btree (id);

CREATE INDEX recipes_public_created_idx ON public.recipes USING btree (created_at DESC) WHERE (is_public = true);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);

alter table "public"."fdc_food_nutrients" add constraint "fdc_food_nutrients_pkey" PRIMARY KEY using index "fdc_food_nutrients_pkey";

alter table "public"."fdc_food_portions" add constraint "fdc_food_portions_pkey" PRIMARY KEY using index "fdc_food_portions_pkey";

alter table "public"."fdc_foods" add constraint "fdc_foods_pkey" PRIMARY KEY using index "fdc_foods_pkey";

alter table "public"."fdc_nutrients" add constraint "fdc_nutrients_pkey" PRIMARY KEY using index "fdc_nutrients_pkey";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_pkey" PRIMARY KEY using index "recipe_ingredients_pkey";

alter table "public"."recipe_steps" add constraint "recipe_steps_pkey" PRIMARY KEY using index "recipe_steps_pkey";

alter table "public"."recipe_tags" add constraint "recipe_tags_pkey" PRIMARY KEY using index "recipe_tags_pkey";

alter table "public"."recipes" add constraint "recipes_pkey" PRIMARY KEY using index "recipes_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."fdc_food_nutrients" add constraint "fdc_food_nutrients_fdc_id_fkey" FOREIGN KEY (fdc_id) REFERENCES public.fdc_foods(fdc_id) ON DELETE CASCADE not valid;

alter table "public"."fdc_food_nutrients" validate constraint "fdc_food_nutrients_fdc_id_fkey";

alter table "public"."fdc_food_nutrients" add constraint "fdc_food_nutrients_fdc_id_nutrient_id_key" UNIQUE using index "fdc_food_nutrients_fdc_id_nutrient_id_key";

alter table "public"."fdc_food_nutrients" add constraint "fdc_food_nutrients_nutrient_id_fkey" FOREIGN KEY (nutrient_id) REFERENCES public.fdc_nutrients(nutrient_id) ON DELETE CASCADE not valid;

alter table "public"."fdc_food_nutrients" validate constraint "fdc_food_nutrients_nutrient_id_fkey";

alter table "public"."fdc_food_portions" add constraint "fdc_food_portions_fdc_id_fkey" FOREIGN KEY (fdc_id) REFERENCES public.fdc_foods(fdc_id) ON DELETE CASCADE not valid;

alter table "public"."fdc_food_portions" validate constraint "fdc_food_portions_fdc_id_fkey";

alter table "public"."fdc_food_portions" add constraint "fdc_food_portions_gram_positive" CHECK (((gram_weight IS NULL) OR (gram_weight > (0)::numeric))) not valid;

alter table "public"."fdc_food_portions" validate constraint "fdc_food_portions_gram_positive";

alter table "public"."fdc_foods" add constraint "fdc_foods_description_nonempty" CHECK ((length(TRIM(BOTH FROM description)) > 0)) not valid;

alter table "public"."fdc_foods" validate constraint "fdc_foods_description_nonempty";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_phrase_nonempty" CHECK ((length(TRIM(BOTH FROM ingredient_phrase)) > 0)) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_phrase_nonempty";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_quantity_positive" CHECK (((quantity IS NULL) OR (quantity > (0)::numeric))) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_quantity_positive";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_raw_nonempty" CHECK ((length(TRIM(BOTH FROM raw_line)) > 0)) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_raw_nonempty";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_recipe_id_fkey";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_sort_non_negative" CHECK ((sort_order >= 0)) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_sort_non_negative";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_unit_nonempty" CHECK (((unit IS NULL) OR (length(TRIM(BOTH FROM unit)) > 0))) not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_unit_nonempty";

alter table "public"."recipe_ingredients" add constraint "recipe_ingredients_usda_fdc_id_fkey" FOREIGN KEY (usda_fdc_id) REFERENCES public.fdc_foods(fdc_id) ON DELETE SET NULL not valid;

alter table "public"."recipe_ingredients" validate constraint "recipe_ingredients_usda_fdc_id_fkey";

alter table "public"."recipe_steps" add constraint "recipe_steps_body_nonempty" CHECK ((length(TRIM(BOTH FROM body)) > 0)) not valid;

alter table "public"."recipe_steps" validate constraint "recipe_steps_body_nonempty";

alter table "public"."recipe_steps" add constraint "recipe_steps_order_non_negative" CHECK ((step_order >= 0)) not valid;

alter table "public"."recipe_steps" validate constraint "recipe_steps_order_non_negative";

alter table "public"."recipe_steps" add constraint "recipe_steps_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_steps" validate constraint "recipe_steps_recipe_id_fkey";

alter table "public"."recipe_steps" add constraint "recipe_steps_recipe_id_step_order_key" UNIQUE using index "recipe_steps_recipe_id_step_order_key";

alter table "public"."recipe_tags" add constraint "recipe_tags_recipe_id_fkey" FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_tags" validate constraint "recipe_tags_recipe_id_fkey";

alter table "public"."recipe_tags" add constraint "recipe_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."recipe_tags" validate constraint "recipe_tags_tag_id_fkey";

alter table "public"."recipes" add constraint "recipes_cook_non_negative" CHECK (((cook_time_minutes IS NULL) OR (cook_time_minutes >= 0))) not valid;

alter table "public"."recipes" validate constraint "recipes_cook_non_negative";

alter table "public"."recipes" add constraint "recipes_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."recipes" validate constraint "recipes_owner_id_fkey";

alter table "public"."recipes" add constraint "recipes_prep_non_negative" CHECK (((prep_time_minutes IS NULL) OR (prep_time_minutes >= 0))) not valid;

alter table "public"."recipes" validate constraint "recipes_prep_non_negative";

alter table "public"."recipes" add constraint "recipes_servings_positive" CHECK (((servings IS NULL) OR (servings > (0)::numeric))) not valid;

alter table "public"."recipes" validate constraint "recipes_servings_positive";

alter table "public"."tags" add constraint "tags_slug_key" UNIQUE using index "tags_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_fdc_foods(search_term text, max_results integer DEFAULT 20)
 RETURNS SETOF public.fdc_foods
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
$function$
;

grant delete on table "public"."fdc_food_nutrients" to "anon";

grant insert on table "public"."fdc_food_nutrients" to "anon";

grant references on table "public"."fdc_food_nutrients" to "anon";

grant select on table "public"."fdc_food_nutrients" to "anon";

grant trigger on table "public"."fdc_food_nutrients" to "anon";

grant truncate on table "public"."fdc_food_nutrients" to "anon";

grant update on table "public"."fdc_food_nutrients" to "anon";

grant delete on table "public"."fdc_food_nutrients" to "authenticated";

grant insert on table "public"."fdc_food_nutrients" to "authenticated";

grant references on table "public"."fdc_food_nutrients" to "authenticated";

grant select on table "public"."fdc_food_nutrients" to "authenticated";

grant trigger on table "public"."fdc_food_nutrients" to "authenticated";

grant truncate on table "public"."fdc_food_nutrients" to "authenticated";

grant update on table "public"."fdc_food_nutrients" to "authenticated";

grant delete on table "public"."fdc_food_nutrients" to "service_role";

grant insert on table "public"."fdc_food_nutrients" to "service_role";

grant references on table "public"."fdc_food_nutrients" to "service_role";

grant select on table "public"."fdc_food_nutrients" to "service_role";

grant trigger on table "public"."fdc_food_nutrients" to "service_role";

grant truncate on table "public"."fdc_food_nutrients" to "service_role";

grant update on table "public"."fdc_food_nutrients" to "service_role";

grant delete on table "public"."fdc_food_portions" to "anon";

grant insert on table "public"."fdc_food_portions" to "anon";

grant references on table "public"."fdc_food_portions" to "anon";

grant select on table "public"."fdc_food_portions" to "anon";

grant trigger on table "public"."fdc_food_portions" to "anon";

grant truncate on table "public"."fdc_food_portions" to "anon";

grant update on table "public"."fdc_food_portions" to "anon";

grant delete on table "public"."fdc_food_portions" to "authenticated";

grant insert on table "public"."fdc_food_portions" to "authenticated";

grant references on table "public"."fdc_food_portions" to "authenticated";

grant select on table "public"."fdc_food_portions" to "authenticated";

grant trigger on table "public"."fdc_food_portions" to "authenticated";

grant truncate on table "public"."fdc_food_portions" to "authenticated";

grant update on table "public"."fdc_food_portions" to "authenticated";

grant delete on table "public"."fdc_food_portions" to "service_role";

grant insert on table "public"."fdc_food_portions" to "service_role";

grant references on table "public"."fdc_food_portions" to "service_role";

grant select on table "public"."fdc_food_portions" to "service_role";

grant trigger on table "public"."fdc_food_portions" to "service_role";

grant truncate on table "public"."fdc_food_portions" to "service_role";

grant update on table "public"."fdc_food_portions" to "service_role";

grant delete on table "public"."fdc_foods" to "anon";

grant insert on table "public"."fdc_foods" to "anon";

grant references on table "public"."fdc_foods" to "anon";

grant select on table "public"."fdc_foods" to "anon";

grant trigger on table "public"."fdc_foods" to "anon";

grant truncate on table "public"."fdc_foods" to "anon";

grant update on table "public"."fdc_foods" to "anon";

grant delete on table "public"."fdc_foods" to "authenticated";

grant insert on table "public"."fdc_foods" to "authenticated";

grant references on table "public"."fdc_foods" to "authenticated";

grant select on table "public"."fdc_foods" to "authenticated";

grant trigger on table "public"."fdc_foods" to "authenticated";

grant truncate on table "public"."fdc_foods" to "authenticated";

grant update on table "public"."fdc_foods" to "authenticated";

grant delete on table "public"."fdc_foods" to "service_role";

grant insert on table "public"."fdc_foods" to "service_role";

grant references on table "public"."fdc_foods" to "service_role";

grant select on table "public"."fdc_foods" to "service_role";

grant trigger on table "public"."fdc_foods" to "service_role";

grant truncate on table "public"."fdc_foods" to "service_role";

grant update on table "public"."fdc_foods" to "service_role";

grant delete on table "public"."fdc_nutrients" to "anon";

grant insert on table "public"."fdc_nutrients" to "anon";

grant references on table "public"."fdc_nutrients" to "anon";

grant select on table "public"."fdc_nutrients" to "anon";

grant trigger on table "public"."fdc_nutrients" to "anon";

grant truncate on table "public"."fdc_nutrients" to "anon";

grant update on table "public"."fdc_nutrients" to "anon";

grant delete on table "public"."fdc_nutrients" to "authenticated";

grant insert on table "public"."fdc_nutrients" to "authenticated";

grant references on table "public"."fdc_nutrients" to "authenticated";

grant select on table "public"."fdc_nutrients" to "authenticated";

grant trigger on table "public"."fdc_nutrients" to "authenticated";

grant truncate on table "public"."fdc_nutrients" to "authenticated";

grant update on table "public"."fdc_nutrients" to "authenticated";

grant delete on table "public"."fdc_nutrients" to "service_role";

grant insert on table "public"."fdc_nutrients" to "service_role";

grant references on table "public"."fdc_nutrients" to "service_role";

grant select on table "public"."fdc_nutrients" to "service_role";

grant trigger on table "public"."fdc_nutrients" to "service_role";

grant truncate on table "public"."fdc_nutrients" to "service_role";

grant update on table "public"."fdc_nutrients" to "service_role";

grant delete on table "public"."recipe_ingredients" to "anon";

grant insert on table "public"."recipe_ingredients" to "anon";

grant references on table "public"."recipe_ingredients" to "anon";

grant select on table "public"."recipe_ingredients" to "anon";

grant trigger on table "public"."recipe_ingredients" to "anon";

grant truncate on table "public"."recipe_ingredients" to "anon";

grant update on table "public"."recipe_ingredients" to "anon";

grant delete on table "public"."recipe_ingredients" to "authenticated";

grant insert on table "public"."recipe_ingredients" to "authenticated";

grant references on table "public"."recipe_ingredients" to "authenticated";

grant select on table "public"."recipe_ingredients" to "authenticated";

grant trigger on table "public"."recipe_ingredients" to "authenticated";

grant truncate on table "public"."recipe_ingredients" to "authenticated";

grant update on table "public"."recipe_ingredients" to "authenticated";

grant delete on table "public"."recipe_ingredients" to "service_role";

grant insert on table "public"."recipe_ingredients" to "service_role";

grant references on table "public"."recipe_ingredients" to "service_role";

grant select on table "public"."recipe_ingredients" to "service_role";

grant trigger on table "public"."recipe_ingredients" to "service_role";

grant truncate on table "public"."recipe_ingredients" to "service_role";

grant update on table "public"."recipe_ingredients" to "service_role";

grant delete on table "public"."recipe_steps" to "anon";

grant insert on table "public"."recipe_steps" to "anon";

grant references on table "public"."recipe_steps" to "anon";

grant select on table "public"."recipe_steps" to "anon";

grant trigger on table "public"."recipe_steps" to "anon";

grant truncate on table "public"."recipe_steps" to "anon";

grant update on table "public"."recipe_steps" to "anon";

grant delete on table "public"."recipe_steps" to "authenticated";

grant insert on table "public"."recipe_steps" to "authenticated";

grant references on table "public"."recipe_steps" to "authenticated";

grant select on table "public"."recipe_steps" to "authenticated";

grant trigger on table "public"."recipe_steps" to "authenticated";

grant truncate on table "public"."recipe_steps" to "authenticated";

grant update on table "public"."recipe_steps" to "authenticated";

grant delete on table "public"."recipe_steps" to "service_role";

grant insert on table "public"."recipe_steps" to "service_role";

grant references on table "public"."recipe_steps" to "service_role";

grant select on table "public"."recipe_steps" to "service_role";

grant trigger on table "public"."recipe_steps" to "service_role";

grant truncate on table "public"."recipe_steps" to "service_role";

grant update on table "public"."recipe_steps" to "service_role";

grant delete on table "public"."recipe_tags" to "anon";

grant insert on table "public"."recipe_tags" to "anon";

grant references on table "public"."recipe_tags" to "anon";

grant select on table "public"."recipe_tags" to "anon";

grant trigger on table "public"."recipe_tags" to "anon";

grant truncate on table "public"."recipe_tags" to "anon";

grant update on table "public"."recipe_tags" to "anon";

grant delete on table "public"."recipe_tags" to "authenticated";

grant insert on table "public"."recipe_tags" to "authenticated";

grant references on table "public"."recipe_tags" to "authenticated";

grant select on table "public"."recipe_tags" to "authenticated";

grant trigger on table "public"."recipe_tags" to "authenticated";

grant truncate on table "public"."recipe_tags" to "authenticated";

grant update on table "public"."recipe_tags" to "authenticated";

grant delete on table "public"."recipe_tags" to "service_role";

grant insert on table "public"."recipe_tags" to "service_role";

grant references on table "public"."recipe_tags" to "service_role";

grant select on table "public"."recipe_tags" to "service_role";

grant trigger on table "public"."recipe_tags" to "service_role";

grant truncate on table "public"."recipe_tags" to "service_role";

grant update on table "public"."recipe_tags" to "service_role";

grant delete on table "public"."recipes" to "anon";

grant insert on table "public"."recipes" to "anon";

grant references on table "public"."recipes" to "anon";

grant select on table "public"."recipes" to "anon";

grant trigger on table "public"."recipes" to "anon";

grant truncate on table "public"."recipes" to "anon";

grant update on table "public"."recipes" to "anon";

grant delete on table "public"."recipes" to "authenticated";

grant insert on table "public"."recipes" to "authenticated";

grant references on table "public"."recipes" to "authenticated";

grant select on table "public"."recipes" to "authenticated";

grant trigger on table "public"."recipes" to "authenticated";

grant truncate on table "public"."recipes" to "authenticated";

grant update on table "public"."recipes" to "authenticated";

grant delete on table "public"."recipes" to "service_role";

grant insert on table "public"."recipes" to "service_role";

grant references on table "public"."recipes" to "service_role";

grant select on table "public"."recipes" to "service_role";

grant trigger on table "public"."recipes" to "service_role";

grant truncate on table "public"."recipes" to "service_role";

grant update on table "public"."recipes" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";


  create policy "fdc_food_nutrients read for all"
  on "public"."fdc_food_nutrients"
  as permissive
  for select
  to public
using (true);



  create policy "fdc_food_portions read for all"
  on "public"."fdc_food_portions"
  as permissive
  for select
  to public
using (true);



  create policy "fdc_foods read for all"
  on "public"."fdc_foods"
  as permissive
  for select
  to public
using (true);



  create policy "fdc_nutrients read for all"
  on "public"."fdc_nutrients"
  as permissive
  for select
  to public
using (true);



  create policy "Owners manage recipe_ingredients delete"
  on "public"."recipe_ingredients"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Owners manage recipe_ingredients insert"
  on "public"."recipe_ingredients"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Owners manage recipe_ingredients update"
  on "public"."recipe_ingredients"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Recipe ingredients visible with recipe"
  on "public"."recipe_ingredients"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_ingredients.recipe_id) AND ((r.is_public = true) OR (r.owner_id = ( SELECT auth.uid() AS uid)))))));



  create policy "Owners manage recipe_steps delete"
  on "public"."recipe_steps"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Owners manage recipe_steps insert"
  on "public"."recipe_steps"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Owners manage recipe_steps update"
  on "public"."recipe_steps"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Recipe steps visible with recipe"
  on "public"."recipe_steps"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_steps.recipe_id) AND ((r.is_public = true) OR (r.owner_id = ( SELECT auth.uid() AS uid)))))));



  create policy "Owners manage recipe_tags delete"
  on "public"."recipe_tags"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_tags.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Owners manage recipe_tags insert"
  on "public"."recipe_tags"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_tags.recipe_id) AND (r.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "Recipe tags visible with recipe"
  on "public"."recipe_tags"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.recipes r
  WHERE ((r.id = recipe_tags.recipe_id) AND ((r.is_public = true) OR (r.owner_id = ( SELECT auth.uid() AS uid)))))));



  create policy "Recipes are viewable if public or owned"
  on "public"."recipes"
  as permissive
  for select
  to public
using (((is_public = true) OR (( SELECT auth.uid() AS uid) = owner_id)));



  create policy "Users can create recipes as themselves"
  on "public"."recipes"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Users can delete own recipes"
  on "public"."recipes"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Users can update own recipes"
  on "public"."recipes"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id))
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Authenticated users can create tags"
  on "public"."tags"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Tags are viewable by everyone"
  on "public"."tags"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER set_updated_at_recipes BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


