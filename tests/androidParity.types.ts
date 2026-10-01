import { GlamAr } from "../src/index";
import type { ConfigChangePayload, ResetOptions } from "../src/index";

const resetOptions: ResetOptions = { subCategory: "sunglasses", skuIds: ["sku-1"] };
const emptyReset: ResetOptions = {};
const nullReset: ResetOptions = { subCategory: null, skuIds: null };
const undefinedReset: ResetOptions = { subCategory: undefined, skuIds: undefined };
GlamAr.reset();
GlamAr.reset(undefined);
GlamAr.reset(null);
GlamAr.reset("sunglasses");
GlamAr.reset(resetOptions);
GlamAr.reset(emptyReset);
GlamAr.reset(nullReset);
GlamAr.reset(undefinedReset);
GlamAr.reset({ subCategory: "sunglasses" });
GlamAr.reset({ skuIds: ["sku-1"] });
const resetResult: void = GlamAr.reset(resetOptions);

GlamAr.configChange("opacity", 0.5);
GlamAr.configChange("opacity");
GlamAr.configChange("opacity", 0, "sku-1", "sunglasses");
GlamAr.configChange("opacity", null, "sku-1");
GlamAr.configChange("opacity", undefined, null, "sunglasses");
GlamAr.configChange("opacity", null, null, null);
GlamAr.configChange("opacity", undefined, undefined, undefined);
const configResult: void = GlamAr.configChange("opacity", 0.5);
const minimalPayload: ConfigChangePayload = { type: "opacity" };
const fullPayload: ConfigChangePayload = { type: "opacity", value: 0, skuId: "sku-1", subCategory: "sunglasses" };

GlamAr.setViewportMirrored(true);
GlamAr.setViewportMirrored(false);
const mirrorResult: void = GlamAr.setViewportMirrored(true);
void [resetResult, configResult, mirrorResult, minimalPayload, fullPayload];

// @ts-expect-error Reset only accepts a string or an options object.
GlamAr.reset(123);
// @ts-expect-error SKU lists belong inside the options object.
GlamAr.reset(["sku-1"]);
// @ts-expect-error Subcategory identifiers must be strings.
GlamAr.reset({ subCategory: 123 });
// @ts-expect-error Every SKU identifier must be a string.
GlamAr.reset({ skuIds: ["sku-1", 123] });
// @ts-expect-error SKU identifiers must be supplied as an array.
GlamAr.reset({ skuIds: "sku-1" });
// @ts-expect-error Unsupported reset selectors must not be exposed by the API.
GlamAr.reset({ category: "eyewear" });
// @ts-expect-error A config type is required.
GlamAr.configChange();
// @ts-expect-error Config types must be strings.
GlamAr.configChange(123);
// @ts-expect-error Config values must be numeric when supplied.
GlamAr.configChange("opacity", "0.5");
// @ts-expect-error SKU identifiers must be strings.
GlamAr.configChange("opacity", null, 123);
// @ts-expect-error Subcategory identifiers must be strings.
GlamAr.configChange("opacity", null, null, 123);
// @ts-expect-error Serialized config payload fields omit null values.
const nullPayload: ConfigChangePayload = { type: "opacity", value: null };
// @ts-expect-error Serialized config payloads require a type.
const missingType: ConfigChangePayload = { value: 1 };
// @ts-expect-error A mirror state is required.
GlamAr.setViewportMirrored();
// @ts-expect-error Mirror state is a boolean, not a string command.
GlamAr.setViewportMirrored("start");
// @ts-expect-error Mirror state is a boolean, not a numeric flag.
GlamAr.setViewportMirrored(1);
void [nullPayload, missingType];
