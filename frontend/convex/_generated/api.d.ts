/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions from "../actions.js";
import type * as customFunctions from "../customFunctions.js";
import type * as dailyEntries from "../dailyEntries.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as rateLimitedFunctions from "../rateLimitedFunctions.js";
import type * as rateLimits from "../rateLimits.js";
import type * as triggers from "../triggers.js";
import type * as users from "../users.js";
import type * as versioning from "../versioning.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  customFunctions: typeof customFunctions;
  dailyEntries: typeof dailyEntries;
  http: typeof http;
  notifications: typeof notifications;
  rateLimitedFunctions: typeof rateLimitedFunctions;
  rateLimits: typeof rateLimits;
  triggers: typeof triggers;
  users: typeof users;
  versioning: typeof versioning;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
