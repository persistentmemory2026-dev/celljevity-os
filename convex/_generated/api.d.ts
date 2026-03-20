/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentmail from "../agentmail.js";
import type * as auth from "../auth.js";
import type * as biomarkerDefinitions from "../biomarkerDefinitions.js";
import type * as biomarkers from "../biomarkers.js";
import type * as dashboard from "../dashboard.js";
import type * as documents from "../documents.js";
import type * as emailActions from "../emailActions.js";
import type * as emailLog from "../emailLog.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as extractionActions from "../extractionActions.js";
import type * as extractionJobs from "../extractionJobs.js";
import type * as geminiExtractor from "../geminiExtractor.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as itineraries from "../itineraries.js";
import type * as itineraryItems from "../itineraryItems.js";
import type * as patients from "../patients.js";
import type * as quotes from "../quotes.js";
import type * as services from "../services.js";
import type * as treatments from "../treatments.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentmail: typeof agentmail;
  auth: typeof auth;
  biomarkerDefinitions: typeof biomarkerDefinitions;
  biomarkers: typeof biomarkers;
  dashboard: typeof dashboard;
  documents: typeof documents;
  emailActions: typeof emailActions;
  emailLog: typeof emailLog;
  emailTemplates: typeof emailTemplates;
  extractionActions: typeof extractionActions;
  extractionJobs: typeof extractionJobs;
  geminiExtractor: typeof geminiExtractor;
  http: typeof http;
  invites: typeof invites;
  itineraries: typeof itineraries;
  itineraryItems: typeof itineraryItems;
  patients: typeof patients;
  quotes: typeof quotes;
  services: typeof services;
  treatments: typeof treatments;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
