import { z } from "zod";

/**
 * Schemas for the national IrishPlanningApplications ArcGIS feature service.
 * Field mapping and known data issues: docs/data-dictionary.md.
 *
 * Queries must request `outSR=4326` so geometry arrives as longitude/latitude.
 */

const PLACEHOLDERS = new Set(["", "n/a"]);

/** Trimmed text, with empty strings and placeholders treated as missing. */
const text = z
  .string()
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return PLACEHOLDERS.has(trimmed.toLowerCase()) ? null : trimmed;
  });

const requiredText = text.pipe(z.string());

const number = z
  .number()
  .nullish()
  .transform((value) => value ?? null);

/** ArcGIS dates are epoch milliseconds; we keep the calendar date only. */
const calendarDate = z
  .number()
  .nullish()
  .transform((ms) =>
    ms === null || ms === undefined ? null : new Date(ms).toISOString().slice(0, 10),
  );

const geometry = z
  .object({ x: z.number(), y: z.number() })
  .nullish()
  .transform((point) => (point ? { lng: point.x, lat: point.y } : null));

/**
 * One feature from the service. Applicant name and address fields are not
 * declared, so zod strips them: personal data never leaves this parser.
 */
export const nationalFeatureSchema = z
  .object({
    attributes: z.object({
      OBJECTID: z.number().int(),
      PlanningAuthority: requiredText,
      ApplicationNumber: requiredText,
      SiteId: text,
      DevelopmentDescription: text,
      DevelopmentAddress: text,
      DevelopmentPostcode: text,
      ApplicationType: text,
      ApplicationStatus: text,
      Decision: text,
      LandUseCode: text,
      OneOffHouse: text,
      OneOffKPI: text,
      NumResidentialUnits: number,
      FloorArea: number,
      AreaofSite: number,
      ReceivedDate: calendarDate,
      DecisionDueDate: calendarDate,
      DecisionDate: calendarDate,
      GrantDate: calendarDate,
      WithdrawnDate: calendarDate,
      ExpiryDate: calendarDate,
      FIRequestDate: calendarDate,
      FIRecDate: calendarDate,
      AppealRefNumber: text,
      AppealStatus: text,
      AppealDecision: text,
      AppealSubmittedDate: calendarDate,
      AppealDecisionDate: calendarDate,
      LinkAppDetails: text,
      ETL_DATE: calendarDate,
    }),
    geometry,
  })
  .transform(({ attributes: a, geometry: location }) => ({
    sourceObjectId: a.OBJECTID,
    councilName: a.PlanningAuthority,
    applicationNumber: a.ApplicationNumber,
    siteId: a.SiteId,
    description: a.DevelopmentDescription,
    address: a.DevelopmentAddress,
    eircode: a.DevelopmentPostcode,
    location,
    applicationTypeRaw: a.ApplicationType,
    statusRaw: a.ApplicationStatus,
    decisionRaw: a.Decision,
    landUseCodeRaw: a.LandUseCode,
    oneOffHouseRaw: a.OneOffHouse,
    oneOffKpiRaw: a.OneOffKPI,
    residentialUnits: a.NumResidentialUnits,
    floorArea: a.FloorArea,
    siteArea: a.AreaofSite,
    receivedDate: a.ReceivedDate,
    decisionDueDate: a.DecisionDueDate,
    decisionDate: a.DecisionDate,
    grantDate: a.GrantDate,
    withdrawnDate: a.WithdrawnDate,
    expiryDate: a.ExpiryDate,
    furtherInfoRequestedDate: a.FIRequestDate,
    furtherInfoReceivedDate: a.FIRecDate,
    appeal:
      a.AppealRefNumber === null
        ? null
        : {
            caseNumber: a.AppealRefNumber,
            statusRaw: a.AppealStatus,
            decisionRaw: a.AppealDecision,
            submittedDate: a.AppealSubmittedDate,
            decisionDate: a.AppealDecisionDate,
          },
    councilFileUrl: a.LinkAppDetails,
    sourceUpdatedDate: a.ETL_DATE,
  }));

export type NationalApplication = z.output<typeof nationalFeatureSchema>;

/**
 * A page of query results. Features stay `unknown` here so one malformed
 * record can be reported and skipped without failing the whole page.
 */
export const nationalQueryResponseSchema = z.object({
  features: z.array(z.unknown()),
  exceededTransferLimit: z.boolean().optional(),
});
