import crypto from "crypto";

export const generateId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
