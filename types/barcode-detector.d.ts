type BarcodeFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e";

type DetectedBarcode = {
  boundingBox?: DOMRectReadOnly;
  rawValue?: string;
  format?: BarcodeFormat;
  cornerPoints?: Array<{ x: number; y: number }>;
};

declare class BarcodeDetector {
  constructor(options?: { formats?: BarcodeFormat[] });
  detect(image: CanvasImageSource): Promise<DetectedBarcode[]>;
  static getSupportedFormats(): Promise<BarcodeFormat[]>;
}
