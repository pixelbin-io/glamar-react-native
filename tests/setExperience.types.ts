import { GlamAr } from "../src/index";
import type {
  ExperienceOptions,
  VtoExperienceOptions,
  SkinAnalysisExperienceOptions,
} from "../src/index";

const vto: VtoExperienceOptions = { category: "makeup" };
const skin: SkinAnalysisExperienceOptions = { appId: "app-123" };
const options: ExperienceOptions[] = [vto, skin];
void options;
GlamAr.setExperience("vto", vto);
GlamAr.setExperience("vto", { subCategory: "lipstick" });
GlamAr.setExperience("vto", { skuId: "sku-123" });
GlamAr.setExperience("skinAnalysis", skin);
// @ts-expect-error Experience names are case-sensitive.
GlamAr.setExperience("skinanalysis", skin);
// @ts-expect-error Skin Analysis options cannot be used for VTO.
GlamAr.setExperience("vto", skin);
// @ts-expect-error VTO options cannot be used for Skin Analysis.
GlamAr.setExperience("skinAnalysis", vto);
// @ts-expect-error An options argument is required.
GlamAr.setExperience("vto");
// @ts-expect-error App IDs must be strings.
GlamAr.setExperience("skinAnalysis", { appId: 123 });
