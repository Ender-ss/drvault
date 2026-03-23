import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, ExternalHyperlink, Table, ShadingType
} from "docx"
import { saveAs } from "file-saver"
import type { ExtendedCopy, Hook } from "../hooks/useCopies"
import type { Annotation } from "../components/editor/ScriptEditor"

// ── Helpers ──
const FONT = "Arial"

function heading(text: string, color: string = "000000") {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, font: FONT, color })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
    border: { bottom: { color, style: BorderStyle.SINGLE, size: 1 } },
  })
}

function bodyLine(text: string, opts?: { bold?: boolean; italic?: boolean; color?: string; size?: number }) {
  return new Paragraph({
    children: [new TextRun({
      text,
      font: FONT,
      size: opts?.size || 20,
      bold: opts?.bold,
      italics: opts?.italic,
      color: opts?.color,
    })],
    spacing: { after: 80 },
  })
}

function linkParagraph(url: string, label?: string) {
  return new Paragraph({
    children: [
      new ExternalHyperlink({
        children: [new TextRun({ text: label || url, style: "Hyperlink", font: FONT, size: 18 })],
        link: url.startsWith("http") ? url : `https://${url}`,
      }),
    ],
    spacing: { after: 80 },
  })
}

// ── Build annotated paragraphs ──
function buildAnnotatedParagraphs(text: string, annotations: Annotation[]): Paragraph[] {
  if (!annotations || annotations.length === 0) {
    return text.split("\n").map(l => bodyLine(l))
  }

  return text.split("\n").map(line => {
    if (!line.trim()) return bodyLine("")

    type Segment = { text: string; color?: string; refNumber?: number }
    let segments: Segment[] = [{ text: line }]

    annotations.forEach(ann => {
      const newSegments: Segment[] = []
      segments.forEach(seg => {
        if (seg.color) {
          newSegments.push(seg)
          return
        }

        let remaining = seg.text
        const searchFor = ann.selectedText
        if (!searchFor) {
           newSegments.push(seg)
           return
        }

        while (true) {
          const idx = remaining.indexOf(searchFor)
          if (idx === -1) {
            if (remaining) newSegments.push({ text: remaining })
            break
          }
          if (idx > 0) {
            newSegments.push({ text: remaining.substring(0, idx) })
          }
          newSegments.push({ text: searchFor, color: ann.color || "#3B82F6", refNumber: ann.refNumber })
          remaining = remaining.substring(idx + searchFor.length)
        }
      })
      segments = newSegments
    })

    const runs = segments.flatMap(seg => {
      if (seg.color) {
        const fillHex = seg.color.startsWith('#') ? seg.color.substring(1) : seg.color
        return [
          new TextRun({
            text: seg.text,
            size: 20,
            font: FONT,
            shading: { type: ShadingType.CLEAR, fill: fillHex }
          }),
          new TextRun({
            text: ` [${seg.refNumber}]`,
            superScript: true,
            bold: true,
            size: 16,
            font: FONT,
            shading: { type: ShadingType.CLEAR, fill: fillHex },
            color: "000000"
          })
        ]
      }
      return [new TextRun({ text: seg.text, size: 20, font: FONT })]
    })

    return new Paragraph({ children: runs, spacing: { after: 120 } })
  })
}

// ────────────────────────────────────
// Main export function
// ────────────────────────────────────
export async function exportCopyToDocx(
  copy: ExtendedCopy,
  hooks: Hook[],
  briefing: string,
  script: string,
  annotations: Annotation[],
  briefingEN?: string,
  scriptEN?: string,
  adTitle?: string
) {
  const children: (Paragraph | Table)[] = []

  // ═══════════════════════════════════════
  // TITLE & META
  // ═══════════════════════════════════════
  children.push(new Paragraph({
    children: [new TextRun({ text: adTitle ? `${copy.title} - ${adTitle}` : copy.title, bold: true, size: 36, font: FONT })],
    heading: HeadingLevel.TITLE,
    spacing: { after: 200 },
  }))

  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Status: `, bold: true, size: 20, font: FONT }),
      new TextRun({ text: `${copy.status}  •  `, size: 20, font: FONT }),
      new TextRun({ text: `Nicho: `, bold: true, size: 20, font: FONT }),
      new TextRun({ text: `${copy.niche}  •  `, size: 20, font: FONT }),
      new TextRun({ text: `Plataforma: `, bold: true, size: 20, font: FONT }),
      new TextRun({ text: `${copy.platform}  •  `, size: 20, font: FONT }),
      new TextRun({ text: `Funil: `, bold: true, size: 20, font: FONT }),
      new TextRun({ text: copy.funnel, size: 20, font: FONT }),
    ],
    spacing: { after: 100 },
  }))

  children.push(new Paragraph({
    children: [
      new TextRun({ text: `Autores: `, bold: true, size: 20, font: FONT }),
      new TextRun({ text: copy.authors.join(", "), size: 20, font: FONT }),
    ],
    spacing: { after: 400 },
  }))

  if (copy.avatarTitle || copy.avatarLink || copy.avatarUrl) {
    children.push(heading("AVATAR / REFERÊNCIA VISUAL", "A855F7"))
    children.push(bodyLine(copy.avatarTitle || "Avatar Selecionado", { bold: true }))
    if (copy.avatarLink || copy.avatarUrl) {
      children.push(linkParagraph(copy.avatarLink || copy.avatarUrl || ""))
    }
    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))
  }

  // ═══════════════════════════════════════
  // PORTUGUÊS
  // ═══════════════════════════════════════
  children.push(new Paragraph({
    children: [new TextRun({ text: "━━━  VERSÃO PORTUGUÊS  ━━━", bold: true, size: 28, font: FONT, color: "22C55E" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 400 },
  }))

  // -- BRIEFING PT --
  children.push(heading("BRIEFING DE EDIÇÃO", "FF6B6B"))
  briefing.split("\n").forEach(line => {
    children.push(bodyLine(line, { italic: true }))
  })

  // -- HOOKS PT --
  children.push(heading(`HOOKS (${hooks.length})`, "22C55E"))
  hooks.forEach(hook => {
    const isValidado = hook.status.toLowerCase() === "validado"
    children.push(new Paragraph({
      children: [new TextRun({
        text: `${hook.label} — ${hook.status}`,
        bold: true, size: 20, font: FONT,
        color: isValidado ? "22C55E" : "EAB308",
        highlight: isValidado ? "green" : "yellow",
      })],
      spacing: { before: 200, after: 100 },
    }))
    children.push(...buildAnnotatedParagraphs(hook.text, annotations))
  })

  // -- BODY / SCRIPT PT --
  children.push(heading("BODY / SCRIPT", "22C55E"))
  children.push(...buildAnnotatedParagraphs(script, annotations))

  // -- ANNOTATIONS LIST (also as standalone at end of PT) --
  if (annotations.length > 0) {
    children.push(heading("LISTA DE REFERÊNCIAS / COMENTÁRIOS", "A855F7"))
    
    // Sort annotations by refNumber for better reading
    const sortedAnns = [...annotations].sort((a, b) => (a.refNumber || 0) - (b.refNumber || 0))
    
    sortedAnns.forEach((ann) => {
      const typeLabel = ann.type === "broll" ? "B-Roll" : ann.type === "comment" ? "Comentário" : "Link"
      const typeColor = ann.type === "broll" ? "7C3AED" : ann.type === "comment" ? "2563EB" : "16A34A"
      const fillHex = ann.color?.startsWith('#') ? ann.color.substring(1) : "FFFF00"
      
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `Ref ${ann.refNumber} [${typeLabel}] `, bold: true, size: 20, font: FONT, color: typeColor }),
          new TextRun({ text: `"${ann.selectedText}"`, italics: true, size: 20, font: FONT, shading: { type: ShadingType.CLEAR, fill: fillHex } }),
        ],
        spacing: { before: 200, after: 50 },
      }))
      if (ann.type === "link" || ann.type === "broll") {
        children.push(linkParagraph(ann.content))
      } else {
        children.push(bodyLine(`→ ${ann.content}`))
      }
      if (ann.brollTitle) {
        children.push(bodyLine(`Mídia: ${ann.brollTitle}`, { italic: true, color: "7C3AED", size: 18 }))
      }
    })
  }

  // ═══════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════
  if (scriptEN || briefingEN || hooks.some(h => h.textEN)) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "", size: 20 })],
      spacing: { before: 600 },
      pageBreakBefore: true,
    }))

    children.push(new Paragraph({
      children: [new TextRun({ text: "━━━  ENGLISH VERSION  ━━━", bold: true, size: 28, font: FONT, color: "3B82F6" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 400 },
    }))

    // -- BRIEFING EN --
    if (briefingEN) {
      children.push(heading("EDITING BRIEF", "FF6B6B"))
      briefingEN.split("\n").forEach(line => {
        children.push(bodyLine(line, { italic: true }))
      })
    }

    // -- HOOKS EN --
    if (hooks.some(h => h.textEN)) {
      children.push(heading(`HOOKS (${hooks.length})`, "3B82F6"))
      hooks.forEach(hook => {
        children.push(new Paragraph({
          children: [new TextRun({ text: `${hook.label} — ${hook.status}`, bold: true, size: 20, font: FONT, color: "3B82F6" })],
          spacing: { before: 200, after: 100 },
        }))
        children.push(...buildAnnotatedParagraphs(hook.textEN || hook.text, annotations))
      })
    }

    // -- BODY EN --
    if (scriptEN) {
      children.push(heading("BODY / SCRIPT", "3B82F6"))
      children.push(...buildAnnotatedParagraphs(scriptEN, annotations))
    }
  }

  // ═══════════════════════════════════════
  // BUILD & DOWNLOAD
  // ═══════════════════════════════════════
  try {
    console.log("[DRVault Export] Generating DOCX...")
    const doc = new Document({
      sections: [{ properties: {}, children }],
    })

    const blob = await Packer.toBlob(doc)
    console.log("[DRVault Export] Blob created, size:", blob.size)
    const baseName = adTitle ? `${copy.title} - ${adTitle}` : copy.title
    const fileName = `${baseName.replace(/[^a-zA-Z0-9\s-]/g, "").trim()}.docx`
    saveAs(blob, fileName)
    console.log("[DRVault Export] SaveAs called for:", fileName)
  } catch (err) {
    console.error("[DRVault Export] Error:", err)
    alert("Erro ao gerar DOCX: " + (err instanceof Error ? err.message : String(err)))
  }
}
