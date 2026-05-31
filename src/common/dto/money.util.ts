/**
 * Money is stored as integer fils (1 JOD = 1000 fils) to avoid float errors.
 * These helpers convert at the API boundary only.
 */
export const jodToFils = (jod: number): number => Math.round(jod * 1000);
export const filsToJod = (fils: number): number => fils / 1000;
