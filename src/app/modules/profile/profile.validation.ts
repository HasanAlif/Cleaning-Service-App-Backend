import { z } from "zod";

const updateProviderProfile = z.object({
  body: z
    .object({
      userName: z
        .string()
        .min(2, "User name must be at least 2 characters")
        .optional(),
      phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number")
        .optional(),
      address: z
        .string()
        .min(5, "Address must be at least 5 characters")
        .optional(),
      aboutMe: z
        .string()
        .min(10, "About me must be at least 10 characters")
        .optional(),
      experience: z
        .string()
        .min(3, "Experience must be at least 3 characters")
        .optional(),
    })
    .optional(), // Make the entire body optional to handle file-only uploads
});

const updateOwnerProfile = z.object({
  body: z
    .object({
      userName: z
        .string()
        .min(2, "User name must be at least 2 characters")
        .optional(),
      phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number")
        .optional(),
      address: z
        .string()
        .min(5, "Address must be at least 5 characters")
        .optional(),
    })
    .optional(),
});

const updateLocationAndAddress = z.object({
  body: z.object({
    address: z
      .string({
        required_error: "Address is required",
      })
      .min(5, "Address must be at least 5 characters"),
    lattitude: z
      .number({
        required_error: "Lattitude is required",
      })
      .min(-90, "Lattitude must be between -90 and 90")
      .max(90, "Lattitude must be between -90 and 90"),
    longitude: z
      .number({
        required_error: "Longitude is required",
      })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
  }),
});

export const profileValidation = {
  updateProviderProfile,
  updateOwnerProfile,
  updateLocationAndAddress,
};
