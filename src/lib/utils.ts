import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getOptimizedThumbUrl(thumbUrl?: string, driveLink?: string): string {
  if (!thumbUrl && !driveLink) return ""

  // If thumbUrl is Google Drive usercontent or has /u/0/, convert to public thumbnail endpoint
  if (thumbUrl && (thumbUrl.includes("drive-usercontent") || thumbUrl.includes("drive.google.com/u/"))) {
    const match = thumbUrl.match(/drive-usercontent\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`
    }
  }

  // If thumbUrl is already a Google Drive thumbnail
  if (thumbUrl && thumbUrl.includes("drive.google.com/thumbnail")) {
    return thumbUrl
  }

  // If thumbUrl is empty or placeholder and driveLink is Google Drive
  if ((!thumbUrl || thumbUrl.includes("picsum.photos")) && driveLink && driveLink.includes("drive.google.com")) {
    const match = driveLink.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || driveLink.match(/id=([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`
    }
  }

  return thumbUrl || ""
}

