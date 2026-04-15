import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RecipePdfIngredient, RecipePdfRecipe, RecipePdfStep } from "./types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.55,
    color: "#171717",
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 52,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#737373",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 26,
    color: "#0a0a0a",
    marginBottom: 10,
  },
  lede: {
    fontSize: 12,
    color: "#525252",
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 22,
  },
  metaPill: {
    fontSize: 9,
    color: "#404040",
    backgroundColor: "#f5f5f5",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#0a0a0a",
    marginBottom: 8,
    marginTop: 4,
  },
  notes: {
    fontSize: 10.5,
    color: "#525252",
    marginBottom: 18,
  },
  list: {
    marginLeft: 4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 6,
  },
  listNumber: {
    width: 22,
    fontSize: 11,
    color: "#737373",
  },
  listBody: {
    flex: 1,
    fontSize: 11,
    color: "#262626",
  },
  nutritionBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  nutritionHint: {
    fontSize: 8.5,
    color: "#737373",
    marginBottom: 8,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  nutrientName: { fontSize: 10, color: "#262626", flex: 1, paddingRight: 8 },
  nutrientVal: { fontSize: 10, color: "#525252" },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 52,
    right: 52,
    fontSize: 8,
    color: "#a3a3a3",
    textAlign: "center",
  },
});

type Nutrient = {
  nutrient_id: number;
  name: string;
  unit_name: string;
  rank?: number | null;
  amount: number;
};

function parseNutrients(total: Record<string, unknown> | null): Nutrient[] {
  if (!total || typeof total !== "object") {
    return [];
  }
  const nutrients = (total as { nutrients?: unknown }).nutrients;
  if (!Array.isArray(nutrients)) {
    return [];
  }
  return nutrients.filter(
    (n): n is Nutrient =>
      typeof n === "object" &&
      n !== null &&
      typeof (n as Nutrient).name === "string" &&
      typeof (n as Nutrient).amount === "number",
  );
}

function priorityName(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("energy") || n.includes("calorie")) {
    return 0;
  }
  if (n === "protein") {
    return 1;
  }
  if (n.includes("carbohydrate")) {
    return 2;
  }
  if (n.includes("total lipid") || n === "fat") {
    return 3;
  }
  if (n.includes("fiber")) {
    return 4;
  }
  if (n.includes("sodium")) {
    return 5;
  }
  return 100;
}

function formatNum(n: number): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  const a = Math.abs(n);
  if (a >= 1000) {
    return n.toFixed(0);
  }
  if (a >= 10) {
    return n.toFixed(1);
  }
  return n.toFixed(2);
}

export function RecipePdfDocument({
  recipe,
  steps,
  ingredients,
}: {
  recipe: RecipePdfRecipe;
  steps: RecipePdfStep[];
  ingredients: RecipePdfIngredient[];
}) {
  const nutrients = parseNutrients(recipe.nutrition_total).sort((a, b) => {
    const ar = a.rank ?? Number.POSITIVE_INFINITY;
    const br = b.rank ?? Number.POSITIVE_INFINITY;
    if (ar !== br) {
      return ar - br;
    }
    const pa = priorityName(a.name);
    const pb = priorityName(b.name);
    if (pa !== pb) {
      return pa - pb;
    }
    return a.name.localeCompare(b.name);
  });
  const displayNutrients = nutrients.slice(0, 32);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>Recipe</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description ? <Text style={styles.lede}>{recipe.description}</Text> : null}

        <View style={styles.metaRow}>
          {recipe.servings != null ? (
            <Text style={styles.metaPill}>Servings: {String(recipe.servings)}</Text>
          ) : null}
          {recipe.prep_time_minutes != null ? (
            <Text style={styles.metaPill}>Prep: {recipe.prep_time_minutes} min</Text>
          ) : null}
          {recipe.cook_time_minutes != null ? (
            <Text style={styles.metaPill}>Cook: {recipe.cook_time_minutes} min</Text>
          ) : null}
          <Text style={styles.metaPill}>{recipe.is_public ? "Public" : "Private"}</Text>
        </View>

        {recipe.notes ? (
          <View>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{recipe.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Ingredients</Text>
        <View style={styles.list}>
          {ingredients.map((ing, i) => (
            <View key={`ing-${i}`} style={styles.listItem}>
              <Text style={styles.listNumber}>{i + 1}.</Text>
              <Text style={styles.listBody}>{ing.raw_line}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Instructions</Text>
        <View style={styles.list}>
          {steps.map((s, i) => (
            <View key={s.step_order} style={styles.listItem}>
              <Text style={styles.listNumber}>{i + 1}.</Text>
              <Text style={styles.listBody}>{s.body}</Text>
            </View>
          ))}
        </View>

        {displayNutrients.length > 0 ? (
          <View style={styles.nutritionBox}>
            <Text style={styles.sectionTitle}>Nutrition (whole recipe)</Text>
            <Text style={styles.nutritionHint}>
              Sum of ingredient lines using USDA per-100 g data — for reference only.
            </Text>
            {displayNutrients.map((n) => (
              <View key={n.nutrient_id} style={styles.nutrientRow}>
                <Text style={styles.nutrientName}>{n.name}</Text>
                <Text style={styles.nutrientVal}>
                  {formatNum(n.amount)} {n.unit_name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Exported from Connectplate — {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
}
