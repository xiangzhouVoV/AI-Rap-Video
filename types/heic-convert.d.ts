declare module "heic-convert" {
  function convert(options: { buffer: Uint8Array; format: "JPEG" | "PNG"; quality?: number }): Promise<ArrayBuffer>;
  export default convert;
}
