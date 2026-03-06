import type WpCustomizer from "../../helpers/WpCustomizer";

export interface CustomizerPayload {
  kind: string;
  apply(customizer: WpCustomizer): Promise<void>;
}
