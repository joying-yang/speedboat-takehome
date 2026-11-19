import { z } from "zod";
import { hasValidSpendLimit } from "../spend-limits/spend-limit-form";

export const keySettingsSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a key name.").max(120),
    scopes: z.array(z.string()).min(1, "Select at least one scope."),
    spendLimit: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || hasValidSpendLimit(value),
        "Enter an amount greater than zero.",
      ),
    alertThresholds: z.array(z.number()),
  })
  .superRefine((values, context) => {
    if (values.alertThresholds.length > 0 && !hasValidSpendLimit(values.spendLimit)) {
      context.addIssue({
        code: "custom",
        path: ["spendLimit"],
        message: "Set a monthly cap before configuring alert thresholds.",
      });
    }
  });

export type KeySettingsValues = z.infer<typeof keySettingsSchema>;
