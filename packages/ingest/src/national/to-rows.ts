import type { NewAppeal, NewApplication } from "@property-progress/db";

import type { NationalApplication } from "./schema.ts";

/**
 * Every column the national dataset fills. `Required` makes the compiler flag
 * a new column that this mapping forgets. Normalised columns (`applicationType`,
 * `decision`) are set by the normalisation step, not here.
 */
export type NationalApplicationRow = Required<
  Omit<NewApplication, "id" | "createdAt" | "updatedAt" | "applicationType" | "decision">
>;

export type NationalAppealRow = Omit<NewAppeal, "id" | "applicationId" | "createdAt" | "updatedAt">;

export function toApplicationRow(
  app: NationalApplication,
  councilSlug: string,
): NationalApplicationRow {
  return {
    councilSlug,
    applicationNumber: app.applicationNumber,
    siteId: app.siteId,
    description: app.description,
    address: app.address,
    eircode: app.eircode,
    location: app.location ? { x: app.location.lng, y: app.location.lat } : null,
    applicationTypeRaw: app.applicationTypeRaw,
    statusRaw: app.statusRaw,
    decisionRaw: app.decisionRaw,
    landUseCodeRaw: app.landUseCodeRaw,
    oneOffHouseRaw: app.oneOffHouseRaw,
    oneOffKpiRaw: app.oneOffKpiRaw,
    residentialUnits: app.residentialUnits,
    floorArea: app.floorArea,
    siteArea: app.siteArea,
    receivedDate: app.receivedDate,
    decisionDueDate: app.decisionDueDate,
    decisionDate: app.decisionDate,
    grantDate: app.grantDate,
    withdrawnDate: app.withdrawnDate,
    expiryDate: app.expiryDate,
    furtherInfoRequestedDate: app.furtherInfoRequestedDate,
    furtherInfoReceivedDate: app.furtherInfoReceivedDate,
    councilFileUrl: app.councilFileUrl,
    sourceObjectId: app.sourceObjectId,
    sourceUpdatedDate: app.sourceUpdatedDate,
  };
}

/** The national dataset carries at most one appeal per application. */
export function toAppealRow(app: NationalApplication): NationalAppealRow | null {
  if (!app.appeal) return null;

  return {
    caseNumber: app.appeal.caseNumber,
    statusRaw: app.appeal.statusRaw,
    decisionRaw: app.appeal.decisionRaw,
    submittedDate: app.appeal.submittedDate,
    decisionDate: app.appeal.decisionDate,
  };
}
