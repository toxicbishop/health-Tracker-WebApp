import { z } from "zod";
import { ParameterType } from "../types/health";

const BaseLogSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  timestamp: z.string().datetime({ message: "Invalid ISO timestamp" }),
  notes: z.string().optional(),
});

export const WeightLogSchema = BaseLogSchema.extend({
  type: z.literal(ParameterType.WEIGHT),
  weight: z.number().positive("Weight must be a positive number"),
  unit: z.enum(["kg", "lbs"]),
});

export const BPLogSchema = BaseLogSchema.extend({
  type: z.literal(ParameterType.BLOOD_PRESSURE),
  systolic: z.number().int().positive("Systolic must be a positive integer"),
  diastolic: z.number().int().positive("Diastolic must be a positive integer"),
});

export const HeartRateLogSchema = BaseLogSchema.extend({
  type: z.literal(ParameterType.HEART_RATE),
  bpm: z.number().int().positive("BPM must be a positive integer"),
});

export const HealthLogSchema = z.discriminatedUnion("type", [
  WeightLogSchema,
  BPLogSchema,
  HeartRateLogSchema,
]);

export type ValidatedHealthLog = z.infer<typeof HealthLogSchema>;
