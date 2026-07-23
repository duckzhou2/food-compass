import {
  milkTeaSelectionFields,
  type MilkTeaProduct,
  type MilkTeaSelection,
  type MilkTeaSelectionField,
  type MilkTeaVariant,
} from "@/types/milk-tea";

export const emptyMilkTeaSelection: MilkTeaSelection = {
  size: null,
  drinkingMethod: null,
  sugar: null,
  version: null,
  base: null,
};

export function getDrinkingMethod(variant: MilkTeaVariant): string | null {
  return variant.temperature ?? variant.ice;
}

function variantValue(
  variant: MilkTeaVariant,
  field: MilkTeaSelectionField,
): string | null {
  return field === "drinkingMethod" ? getDrinkingMethod(variant) : variant[field];
}

export function isReliableVariant(variant: MilkTeaVariant): boolean {
  return variant.dataStatus !== "needs_review" && variant.calories !== null;
}

export function hasSevereReviewConflict(product: MilkTeaProduct): boolean {
  return (
    product.variants.some((variant) => variant.dataStatus === "needs_review") &&
    !product.variants.some(isReliableVariant)
  );
}

export function getPreferredVariant(product: MilkTeaProduct): MilkTeaVariant {
  const explicit = product.variants.find(
    (variant) => variant.variantId === product.defaultSelection.variantId,
  );
  if (explicit && isReliableVariant(explicit)) return explicit;
  return product.variants.find(isReliableVariant) ?? explicit ?? product.variants[0];
}

function selectionFromVariant(variant: MilkTeaVariant | undefined): MilkTeaSelection {
  if (!variant) return { ...emptyMilkTeaSelection };
  return {
    size: variant.size,
    drinkingMethod: getDrinkingMethod(variant),
    sugar: variant.sugar,
    version: variant.version,
    base: variant.base,
  };
}

export function resolveSelectionFromVariantId(
  product: MilkTeaProduct,
  variantId: string | null | undefined,
): MilkTeaSelection {
  const variant = product.variants.find((item) => item.variantId === variantId);
  return variant ? selectionFromVariant(variant) : resolveSelection(product);
}

export function parseDefaultSelection(product: MilkTeaProduct): MilkTeaSelection {
  return selectionFromVariant(getPreferredVariant(product));
}

function uniqueValues(
  variants: MilkTeaVariant[],
  field: MilkTeaSelectionField,
): string[] {
  return [
    ...new Set(
      variants
        .map((variant) => variantValue(variant, field))
        .filter((value): value is string => value !== null),
    ),
  ];
}

export function getValidOptions(
  product: MilkTeaProduct,
  selection: MilkTeaSelection,
  field: MilkTeaSelectionField,
): string[] {
  const fieldIndex = milkTeaSelectionFields.indexOf(field);
  const previousFields = milkTeaSelectionFields.slice(0, fieldIndex);
  const candidates = product.variants.filter((variant) =>
    previousFields.every((previousField) => {
      const selectedValue = selection[previousField];
      return selectedValue === null || variantValue(variant, previousField) === selectedValue;
    }),
  );
  return uniqueValues(candidates, field);
}

export function resolveSelection(
  product: MilkTeaProduct,
  requested: Partial<MilkTeaSelection> = {},
): MilkTeaSelection {
  const preferred = parseDefaultSelection(product);
  const resolved = { ...emptyMilkTeaSelection };
  let candidates = product.variants;

  for (const field of milkTeaSelectionFields) {
    const options = uniqueValues(candidates, field);
    if (options.length === 0) {
      resolved[field] = null;
      continue;
    }
    const requestedValue = requested[field];
    const preferredValue = preferred[field];
    const value =
      requestedValue !== undefined && requestedValue !== null && options.includes(requestedValue)
        ? requestedValue
        : preferredValue !== null && options.includes(preferredValue)
          ? preferredValue
          : options[0];
    resolved[field] = value;
    candidates = candidates.filter((variant) => variantValue(variant, field) === value);
  }
  return resolved;
}

export function updateSelection(
  product: MilkTeaProduct,
  current: MilkTeaSelection,
  field: MilkTeaSelectionField,
  value: string,
): MilkTeaSelection {
  const changedIndex = milkTeaSelectionFields.indexOf(field);
  const requested: Partial<MilkTeaSelection> = { ...current, [field]: value };
  for (const downstream of milkTeaSelectionFields.slice(changedIndex + 1)) {
    requested[downstream] = null;
  }
  return resolveSelection(product, requested);
}

export function findSelectedVariant(
  product: MilkTeaProduct,
  selection: MilkTeaSelection,
): MilkTeaVariant {
  return (
    product.variants.find((variant) =>
      milkTeaSelectionFields.every(
        (field) => variantValue(variant, field) === selection[field],
      ),
    ) ?? getPreferredVariant(product)
  );
}
