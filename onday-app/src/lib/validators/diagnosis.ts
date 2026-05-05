import { z } from "zod";

const coordinateSchema = z.object({
  lat: z.number().min(33).max(39), // Korea latitude range
  lng: z.number().min(124).max(132), // Korea longitude range
});

export const diagnosisInputSchema = z.object({
  addressA: z.string().min(1, "출발지 A를 입력해주세요"),
  addressB: z.string().optional(),
  coordinateA: coordinateSchema,
  coordinateB: coordinateSchema.optional(),
  leisureA: z.string().optional(),
  leisureCoordA: coordinateSchema.optional(),
  leisureB: z.string().optional(),
  leisureCoordB: coordinateSchema.optional(),
  filters: z.object({
    maxCommuteTime: z.number().min(10).max(120).optional(),
    budget: z
      .object({
        min: z.number().min(0),
        max: z.number().min(0),
      })
      .optional(),
    timeRange: z.enum(["morning", "evening", "flexible"]).optional(),
    priorities: z.array(z.string()).optional(),
  }),
  mode: z.enum(["couple", "single"]),
  deadlineDate: z.string().optional(),
});

export const shareLinkInputSchema = z.object({
  diagnosisId: z.string().uuid(),
  password: z
    .string()
    .min(4, "비밀번호는 4자 이상이어야 합니다")
    .max(20)
    .optional(),
});

export const shareAccessSchema = z.object({
  password: z.string().optional(),
});

export type DiagnosisInputSchema = z.infer<typeof diagnosisInputSchema>;
export type ShareLinkInputSchema = z.infer<typeof shareLinkInputSchema>;
