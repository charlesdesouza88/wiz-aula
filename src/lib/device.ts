export type Device = "android" | "iphone" | "ipad" | "pc";

export function detectDevice(userAgent: string, maxTouchPoints: number): Device {
  // iPadOS reports a Mac user agent, so a touch-capable "Mac" is an iPad.
  if (/iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return "ipad";
  if (/iPhone|iPod/.test(userAgent)) return "iphone";
  if (/Android/.test(userAgent)) return "android";
  return "pc";
}

export const DEVICE_NAME: Record<Device, string> = {
  android: "um aparelho Android",
  iphone: "um iPhone",
  ipad: "um iPad",
  pc: "um computador",
};
