export const NATIONAL_SERVICE_URL =
  "https://services.arcgis.com/NzlPQPKn5QF9v2US/arcgis/rest/services/IrishPlanningApplications/FeatureServer/0/query";

/** The service's maximum page size. */
export const MAX_PAGE_SIZE = 2000;

/**
 * Fields we request. Applicant name and address fields are deliberately
 * absent, so personal data is never downloaded.
 */
export const OUT_FIELDS = [
  "OBJECTID",
  "PlanningAuthority",
  "ApplicationNumber",
  "SiteId",
  "DevelopmentDescription",
  "DevelopmentAddress",
  "DevelopmentPostcode",
  "ApplicationType",
  "ApplicationStatus",
  "Decision",
  "LandUseCode",
  "OneOffHouse",
  "OneOffKPI",
  "NumResidentialUnits",
  "FloorArea",
  "AreaofSite",
  "ReceivedDate",
  "DecisionDueDate",
  "DecisionDate",
  "GrantDate",
  "WithdrawnDate",
  "ExpiryDate",
  "FIRequestDate",
  "FIRecDate",
  "AppealRefNumber",
  "AppealStatus",
  "AppealDecision",
  "AppealSubmittedDate",
  "AppealDecisionDate",
  "LinkAppDetails",
  "ETL_DATE",
] as const;

export interface PageQuery {
  /** Council name exactly as in the dataset's `PlanningAuthority` field. */
  councilDatasetName: string;
  /** Only applications received on or after this date (`YYYY-MM-DD`). */
  receivedFrom: string;
  offset: number;
  pageSize: number;
}

export function buildPageUrl(query: PageQuery): URL {
  const url = new URL(NATIONAL_SERVICE_URL);
  url.search = new URLSearchParams({
    where: `PlanningAuthority = '${escapeSqlString(query.councilDatasetName)}' AND ReceivedDate >= DATE '${query.receivedFrom}'`,
    outFields: OUT_FIELDS.join(","),
    outSR: "4326",
    orderByFields: "OBJECTID",
    resultOffset: String(query.offset),
    resultRecordCount: String(query.pageSize),
    f: "json",
  }).toString();
  return url;
}

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}
