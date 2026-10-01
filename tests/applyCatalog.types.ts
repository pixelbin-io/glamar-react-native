import { GlamAr } from "../src/index";
import type { ApplyCatalogOptions } from "../src/index";

const options: ApplyCatalogOptions = { storeFront: "catalog-1" };
const emptyOptions: ApplyCatalogOptions = {};
const nullStoreFront: ApplyCatalogOptions = { storeFront: null };
const undefinedStoreFront: ApplyCatalogOptions = { storeFront: undefined };
GlamAr.applyByCategory("eyewear");
GlamAr.applyByCategory("eyewear", undefined);
GlamAr.applyByCategory("eyewear", null);
GlamAr.applyByCategory("eyewear", options);
GlamAr.applyByCategory("eyewear", emptyOptions);
GlamAr.applyByCategory("eyewear", nullStoreFront);
GlamAr.applyByCategory("eyewear", undefinedStoreFront);
GlamAr.applyBySubCategory("sunglasses");
GlamAr.applyBySubCategory("sunglasses", undefined);
GlamAr.applyBySubCategory("sunglasses", null);
GlamAr.applyBySubCategory("sunglasses", options);
GlamAr.applyBySubCategory("sunglasses", emptyOptions);
GlamAr.applyBySubCategory("sunglasses", nullStoreFront);
GlamAr.applyBySubCategory("sunglasses", undefinedStoreFront);
const categoryResult: void = GlamAr.applyByCategory("eyewear", options);
const subCategoryResult: void = GlamAr.applyBySubCategory("sunglasses", options);
void categoryResult;
void subCategoryResult;

// @ts-expect-error A category string is required.
GlamAr.applyByCategory();
// @ts-expect-error A subcategory string is required.
GlamAr.applyBySubCategory();
// @ts-expect-error Category identifiers must be strings.
GlamAr.applyByCategory(123);
// @ts-expect-error Subcategory identifiers must be strings.
GlamAr.applyBySubCategory(123);
// @ts-expect-error Options must be an object, not a storefront string.
GlamAr.applyByCategory("eyewear", "catalog-1");
// @ts-expect-error Options must be an object, not a storefront string.
GlamAr.applyBySubCategory("sunglasses", "catalog-1");
// @ts-expect-error Storefront identifiers must be strings.
GlamAr.applyByCategory("eyewear", { storeFront: 123 });
// @ts-expect-error Storefront identifiers must be strings.
GlamAr.applyBySubCategory("sunglasses", { storeFront: 123 });
// @ts-expect-error Only storeFront is supported.
GlamAr.applyByCategory("eyewear", { storefront: "catalog-1" });
// @ts-expect-error Only storeFront is supported.
GlamAr.applyBySubCategory("sunglasses", { extra: true });
// @ts-expect-error Exported catalog options reject unsupported properties.
const invalidOptions: ApplyCatalogOptions = { extra: true };
void invalidOptions;
