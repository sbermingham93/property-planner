# Data dictionary

What we record for each planning application, where each value comes from, and when we need it. Agreed 2026-10-28.

**Source:** N = national dataset ([IrishPlanningApplications](https://data-housinggovie.opendata.arcgis.com/maps/housinggovie::irishplanningapplications)), C = council planning website, A = An Coimisiún Pleanála (appeals board), X = other external (BCMS, zoning, CSO boundaries), D = derived by us with rules or spatial queries, L = extracted from text or documents by an LLM.

**Phase:** P1 = council scorecard, P2 = appeal reasons, P3 = predictions.

## Principles

- **Raw and normalised side by side.** Coded source values are messy: in the pilot councils since 2020, application type has 52 spellings and decision has 120. We store the raw value exactly as received (trimmed) and a normalised value mapped through a lookup table. Nothing from the source is lost, and the mapping can be corrected and re-run.
- **Placeholders are missing values.** Empty strings and `n/a` become `null`.
- **Dates are calendar dates** (`YYYY-MM-DD`), not timestamps.
- **Unverified values are labelled.** Fields known to be unreliable (see Known issues) are used only after cross-checking.

## 1. Identity and location

| Field                                              | Source      | Phase |
| -------------------------------------------------- | ----------- | ----- |
| Council, application number, link to council file  | N           | P1    |
| Site ID (links repeat applications on one site)    | N           | P1    |
| Address, Eircode                                   | N           | P1    |
| Location point; site boundary                      | N           | P1    |
| Electoral division, CSO small area, urban or rural | D (PostGIS) | P1    |
| Zoning                                             | X           | P3    |

## 2. The application

| Field                                                            | Source                     | Phase |
| ---------------------------------------------------------------- | -------------------------- | ----- |
| Application type, raw and normalised                             | N, D                       | P1    |
| Development description (free text)                              | N                          | P1    |
| Development category (see below)                                 | N where coded, else L      | P1    |
| Residential units                                                | N; C or L where unreliable | P1    |
| Floor area, site area                                            | N                          | P1    |
| Applicant type: individual, company, public body                 | D from the name            | P1    |
| Applicant name, companies and public bodies only                 | N, C                       | P1    |
| Agent or architect firm                                          | C                          | P3    |
| Protected structure; environmental impact or habitats assessment | C, A                       | P3    |

Normalised application types: `permission`, `outline`, `retention`, `permission_and_retention`, `extension_of_duration`, `section_5_exemption`, `other`.

Development categories: about 12 to 15, seeded from the national land-use codes (for example `A01N SINGLE HOUSE : NEW`, `A05E DOMESTIC EXTENSION`, `A03N APARTMENTS : NEW`). The code is blank for about 85% of pilot applications, so an LLM assigns the category from the description. Accuracy is checked by hand on a sample of a few hundred before use. The final list is agreed with the first sample.

## 3. Timeline

| Field                                                            | Source | Phase |
| ---------------------------------------------------------------- | ------ | ----- |
| Received, decision due, decision, grant, withdrawn, expiry dates | N      | P1    |
| Further information requested and received                       | N      | P1    |
| Invalidation date; clarification of further information          | C      | P2    |
| Construction start (commencement notice)                         | X      | P2    |

Derived (D, P1): weeks to decision; weeks added by further information; statutory deadline met or missed; total weeks to final grant including any appeal; weeks from grant to construction start.

## 4. The council's decision

| Field                                              | Source | Phase |
| -------------------------------------------------- | ------ | ----- |
| Decision, raw and normalised                       | N, D   | P1    |
| Refusal reasons, by category                       | C, L   | P2    |
| Number of conditions; development contribution (€) | C, L   | P2    |
| Number of third-party submissions                  | C      | P2    |

Normalised decisions: `grant`, `grant_with_conditions`, `refuse`, `split`, `invalid`, `withdrawn`, `pending`.

## 5. Appeals (zero or more per application)

| Field                                                     | Source                                  | Phase |
| --------------------------------------------------------- | --------------------------------------- | ----- |
| Appeals board case number, case type                      | N, A                                    | P1    |
| Appellant: first party (applicant) or third party         | A                                       | P1    |
| Lodged and decided dates; outcome, raw and normalised     | N, A                                    | P1    |
| Number of observers                                       | A                                       | P2    |
| Inspector's recommendation; whether the board followed it | L (inspector's report, board direction) | P2    |
| Grounds of appeal; board's reasons, by category           | L                                       | P2    |
| Judicial review                                           | later                                   | later |

## Not collected

- Names of individual applicants, people who made submissions, and individual appellants. Only a type is stored.
- Personal addresses, phone numbers and email addresses found in documents.

## Scope decisions

- **Scorecard application types:** everything is stored, but the scorecard counts only `permission`, `outline` and `retention`, with retention reported separately. Extensions of duration and Section 5 exemptions are excluded.
- **History:** load from 2012; analyse from 2018. Report applications made under the Planning and Development Act 2024 procedures separately from earlier ones.

## National dataset field mapping

Query the service with `outSR=4326` so geometry arrives as longitude and latitude; `ITMEasting` and `ITMNorthing` are empty. The service returns at most 2,000 records per request. Parsing and cleaning: `packages/ingest/src/national/schema.ts`. Mapping to table rows: `packages/ingest/src/national/to-rows.ts`. Tables: `packages/db/src/schema/`.

| Source field                                                                                     | Our field                                                                                                    |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `OBJECTID`                                                                                       | `sourceObjectId`                                                                                             |
| `PlanningAuthority`                                                                              | `councilName`                                                                                                |
| `ApplicationNumber`                                                                              | `applicationNumber`                                                                                          |
| `SiteId`                                                                                         | `siteId`                                                                                                     |
| `DevelopmentDescription`, `DevelopmentAddress`, `DevelopmentPostcode`                            | `description`, `address`, `eircode`                                                                          |
| geometry                                                                                         | `location` (`lng`, `lat`)                                                                                    |
| `ApplicationType`, `ApplicationStatus`, `Decision`, `LandUseCode`                                | `applicationTypeRaw`, `statusRaw`, `decisionRaw`, `landUseCodeRaw`                                           |
| `OneOffHouse`, `OneOffKPI`                                                                       | `oneOffHouseRaw`, `oneOffKpiRaw`                                                                             |
| `NumResidentialUnits`, `FloorArea`, `AreaofSite`                                                 | `residentialUnits`, `floorArea`, `siteArea`                                                                  |
| `ReceivedDate`, `DecisionDueDate`, `DecisionDate`, `GrantDate`, `WithdrawnDate`, `ExpiryDate`    | `receivedDate`, `decisionDueDate`, `decisionDate`, `grantDate`, `withdrawnDate`, `expiryDate`                |
| `FIRequestDate`, `FIRecDate`                                                                     | `furtherInfoRequestedDate`, `furtherInfoReceivedDate`                                                        |
| `AppealRefNumber`, `AppealStatus`, `AppealDecision`, `AppealSubmittedDate`, `AppealDecisionDate` | `appeal.caseNumber`, `appeal.statusRaw`, `appeal.decisionRaw`, `appeal.submittedDate`, `appeal.decisionDate` |
| `LinkAppDetails`                                                                                 | `councilFileUrl`                                                                                             |
| `ETL_DATE`                                                                                       | `sourceUpdatedDate`                                                                                          |
| `ApplicantForename`, `ApplicantSurname`, `ApplicantAddress`                                      | dropped on parse; see open question below                                                                    |

## Known issues (pilot councils)

- Residential units: blank for Dún Laoghaire-Rathdown, zero for Fingal, sparse for Dublin City and South Dublin.
- Dublin City: newest record July 2026 and no council file links.
- Application numbers can carry trailing spaces (Fingal).
- Units of `FloorArea` and `AreaofSite` (m² or hectares) are not documented; verify before use.

## Open questions

- Applicant type and company names need the applicant name at parse time. The current schema drops all applicant fields; classifying applicants (keep companies, discard individuals) is a separate step to design.
