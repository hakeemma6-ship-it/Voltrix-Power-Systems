/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Type definitions for category and product data structures.
 * Data is sourced purely from MongoDB via the /api/categories and /api/products endpoints.
 */

export interface SubCategoryProduct {
  id: string;
  name: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  applications: string[];
  image: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: SubCategoryProduct[];
}

/** Initial empty placeholder. Components populate this via the /api/categories endpoint. */
export const CATEGORIES_DATA: Category[] = [];
