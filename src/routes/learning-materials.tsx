import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FolderOpen,
  UploadCloud,
  FileText,
  Sparkles,
  Plus,
  Search,
  Trash2,
  Eye,
  BookOpen,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Landmark,
  Download,
  Copy,
  Check,
  RefreshCw,
  Layers,
  FileDown,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { StatusPill } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  NoteDocument,
  extractTextFromFile,
  analyzeNotes,
  COMPETENCY_DOMAINS,
} from "@/lib/ai-quiz-engine";
import { useMaterialsStore, stageDocumentForQuiz } from "@/lib/quiz-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learning-materials")({
  head: () => ({
    meta: [
      { title: "Learning Materials | StatLearn AI" },
      {
        name: "description",
        content:
          "Repository of official statistical documents, survey guidelines, and custom uploaded study notes.",
      },
      { property: "og:title", content: "Learning Materials | StatLearn AI" },
    ],
  }),
  component: LearningMaterials,
});

function LearningMaterials() {
  const navigate = useNavigate();
  const { materials, addMaterial, removeMaterial, resetMaterials, syncIgotNotesForDomain } =
    useMaterialsStore();

  const [search, setSearch] = useState("");
  const [selectedCompetency, setSelectedCompetency] = useState("All");

  // Add Material Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addContent, setAddContent] = useState("");
  const [addType, setAddType] = useState<"file" | "paste">("file");
  const [isUploading, setIsUploading] = useState(false);

  // Preview Note Dialog
  const [previewDoc, setPreviewDoc] = useState<NoteDocument | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Domain Full Notes Dialog
  const [domainNotesModal, setDomainNotesModal] = useState<string | null>(null);
  const [isDomainCopied, setIsDomainCopied] = useState(false);
  const [isSyncingIgot, setIsSyncingIgot] = useState(false);

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.detectedTopics.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      (m.summary && m.summary.toLowerCase().includes(search.toLowerCase()));

    const matchesComp =
      selectedCompetency === "All" || m.suggestedCompetencies.includes(selectedCompetency);

    return matchesSearch && matchesComp;
  });

  // Handle iGOT API sync for a specific domain
  function handleSyncIgot(domain: string) {
    if (domain === "All") {
      toast.info("Please select a specific competency domain first to sync targeted iGOT notes.");
      return;
    }
    setIsSyncingIgot(true);
    setTimeout(() => {
      const added = syncIgotNotesForDomain(domain);
      setIsSyncingIgot(false);
      if (added.length > 0) {
        toast.success(`iGOT Karmayogi API: Synced ${added.length} official module(s) for "${domain}".`);
      } else {
        toast.info(`Latest iGOT Karmayogi curricula for "${domain}" is already synchronized.`);
      }
    }, 500);
  }

  // Handle downloading text content as file
  function handleDownloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded "${filename}"`);
  }

  // Copy text helper
  function handleCopyText(text: string, setCopyState: (val: boolean) => void) {
    navigator.clipboard.writeText(text);
    setCopyState(true);
    toast.success("Notes copied to clipboard!");
    setTimeout(() => setCopyState(false), 2000);
  }

  // Handle file upload in modal
  async function handleModalFile(file: File) {
    try {
      setIsUploading(true);
      const { content, type } = await extractTextFromFile(file);
      const analysis = analyzeNotes(content, file.name);

      const newDoc: NoteDocument = {
        id: `mat-${Date.now()}`,
        name: file.name,
        content,
        type,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        wordCount: analysis.wordCount,
        charCount: analysis.charCount,
        detectedTopics: analysis.detectedTopics,
        suggestedCompetencies: analysis.suggestedCompetencies,
        summary: analysis.summary,
      };

      addMaterial(newDoc);
      setIsAddOpen(false);
      toast.success(`Added "${file.name}" to learning materials.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to process file.");
    } finally {
      setIsUploading(false);
    }
  }

  // Handle paste submission in modal
  function handleModalPaste() {
    if (!addContent.trim()) {
      toast.error("Please enter the content for your notes.");
      return;
    }

    const title = addTitle.trim() || "Study Notes " + new Date().toLocaleDateString();
    const analysis = analyzeNotes(addContent, title);

    const newDoc: NoteDocument = {
      id: `mat-${Date.now()}`,
      name: title,
      content: addContent,
      type: "PASTED",
      size: `${(addContent.length / 1024).toFixed(1)} KB`,
      uploadedAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      wordCount: analysis.wordCount,
      charCount: analysis.charCount,
      detectedTopics: analysis.detectedTopics,
      suggestedCompetencies: analysis.suggestedCompetencies,
      summary: analysis.summary,
    };

    addMaterial(newDoc);
    setIsAddOpen(false);
    setAddTitle("");
    setAddContent("");
    toast.success(`Saved "${title}" to learning materials.`);
  }

  // Quick action: Generate Quiz from Document
  function handleGenerateFromDoc(doc: NoteDocument) {
    stageDocumentForQuiz(doc);
    navigate({ to: "/quiz-generator" });
  }

  // Aggregate all notes for a specific domain
  const domainMaterials =
    selectedCompetency === "All"
      ? materials
      : materials.filter((m) => m.suggestedCompetencies.includes(selectedCompetency));

  const fullDomainNotesText = domainMaterials
    .map(
      (m, idx) =>
        `========================================================================================\n` +
        `DOCUMENT ${idx + 1}: ${m.name}\n` +
        `Type: ${m.type} | Word Count: ${m.wordCount} | Topics: ${m.detectedTopics.join(", ")}\n` +
        `Summary: ${m.summary || "Official statistical study curriculum"}\n` +
        `========================================================================================\n\n` +
        m.content.trim() +
        `\n\n`,
    )
    .join("\n");

  return (
    <>
      <PageHeader
        eyebrow="Knowledge Repository"
        title="Learning Materials & Notes"
        subtitle="Manage official guidelines, uploaded notes, and lecture materials used by the AI Quiz Generator."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm("Reset materials library to official sample documents?")) {
                  resetMaterials();
                  toast.success("Restored official documents.");
                }
              }}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="size-3.5" /> Reset to Defaults
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-4" /> Add Material / Notes
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Learning Material</DialogTitle>
                  <DialogDescription>
                    Upload a statistical document or paste study notes to add them to your knowledge
                    library.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 flex gap-1 rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setAddType("file")}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                      addType === "file"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Upload File (PDF, DOCX, TXT)
                  </button>
                  <button
                    onClick={() => setAddType("paste")}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                      addType === "paste"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Paste Text / Notes
                  </button>
                </div>

                {addType === "file" ? (
                  <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center hover:bg-muted/40 transition-colors">
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleModalFile(f);
                      }}
                      accept=".pdf,.docx,.pptx,.txt,.md,.json,.csv"
                    />
                    <UploadCloud className="size-8 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">
                      Click to select a file from your device
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF, DOCX, TXT, Markdown, CSV
                    </p>
                  </label>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Note Title
                      </label>
                      <input
                        type="text"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        placeholder="e.g. Sampling Error Notes"
                        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Note Content
                      </label>
                      <textarea
                        rows={6}
                        value={addContent}
                        onChange={(e) => setAddContent(e.target.value)}
                        placeholder="Paste lecture notes or text here..."
                        className="mt-1 w-full rounded-lg border border-border bg-card p-2.5 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <DialogFooter className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  {addType === "paste" && (
                    <Button size="sm" onClick={handleModalPaste}>
                      Save to Materials
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents, topics, or keywords…"
              className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Domain:</span>
            {["All", ...COMPETENCY_DOMAINS].map((c) => (
              <Button
                key={c}
                size="sm"
                variant={selectedCompetency === c ? "default" : "outline"}
                onClick={() => setSelectedCompetency(c)}
                className="text-xs h-8"
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Domain Knowledge & iGOT Karmayogi Hub Banner */}
        {selectedCompetency !== "All" && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Landmark className="size-4" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {selectedCompetency} Knowledge Hub
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" /> iGOT Karmayogi API Linked
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Displaying {domainMaterials.length} official curriculum documents and training notes for{" "}
                  <strong>{selectedCompetency}</strong>. Sync the latest civil-service modules or review the complete domain handbook.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs bg-background/80 hover:bg-background"
                  disabled={isSyncingIgot}
                  onClick={() => handleSyncIgot(selectedCompetency)}
                >
                  <RefreshCw className={cn("size-3.5", isSyncingIgot && "animate-spin text-primary")} />
                  {isSyncingIgot ? "Syncing API..." : "Sync via iGOT API"}
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 text-xs"
                  onClick={() => setDomainNotesModal(selectedCompetency)}
                >
                  <BookOpen className="size-3.5" /> Read Full Domain Notes
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs bg-background/80 hover:bg-background"
                  onClick={() =>
                    handleDownloadText(
                      `StatLearn_${selectedCompetency.replace(/\s+/g, "_")}_Notes.txt`,
                      fullDomainNotesText,
                    )
                  }
                  title="Download full notes for this domain as .txt"
                >
                  <Download className="size-3.5" /> Export (.TXT)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Materials List */}
      <SectionCard
        title="Knowledge Library"
        description={`${filteredMaterials.length} materials ready for AI assessment generation`}
      >
        {filteredMaterials.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FolderOpen className="mx-auto mb-3 size-10 stroke-1" />
            <p className="font-medium text-foreground">No matching materials found</p>
            <p className="mt-1 text-xs">Try adjusting your search or upload a new document.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMaterials.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                      {doc.type}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{doc.uploadedAt}</span>
                  </div>

                  <h3 className="mt-3 font-display font-semibold text-base leading-snug line-clamp-2">
                    {doc.name}
                  </h3>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {doc.summary || doc.content.slice(0, 160)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {doc.detectedTopics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-accent/60 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{doc.wordCount} words</span>
                    <span>{doc.size}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => handleGenerateFromDoc(doc)}
                    >
                      <Sparkles className="size-3.5" /> Generate Quiz
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview content"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Delete "${doc.name}" from your library?`)) {
                          removeMaterial(doc.id);
                          toast.success("Document removed.");
                        }
                      }}
                      className="text-destructive hover:bg-destructive/10"
                      title="Delete document"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Preview Dialog */}
      {previewDoc && (
        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                {previewDoc.name}
              </DialogTitle>
              <DialogDescription>
                {previewDoc.wordCount} words · {previewDoc.size} · Uploaded {previewDoc.uploadedAt} ·{" "}
                <span className="font-medium text-foreground">
                  Competencies: {previewDoc.suggestedCompetencies.join(", ")}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text">
              {previewDoc.content}
            </div>

            <DialogFooter className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => handleCopyText(previewDoc.content, setIsCopied)}
                >
                  {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {isCopied ? "Copied" : "Copy Content"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => handleDownloadText(previewDoc.name, previewDoc.content)}
                >
                  <Download className="size-3.5" /> Download (.TXT)
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewDoc(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    handleGenerateFromDoc(previewDoc);
                    setPreviewDoc(null);
                  }}
                >
                  <Sparkles className="size-3.5" /> Generate Quiz
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Full Domain Study Notes Dialog */}
      {domainNotesModal && (
        <Dialog open={!!domainNotesModal} onOpenChange={() => setDomainNotesModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Landmark className="size-5 text-primary" />
                  {domainNotesModal} – Complete Official Study Notes & Handbook
                </DialogTitle>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  iGOT Karmayogi Synced
                </span>
              </div>
              <DialogDescription>
                Full synthesized training handbook comprising {domainMaterials.length} official documents from
                MoSPI, NSSTA Greater Noida, and iGOT Karmayogi civil-service courses.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-3 flex-1 overflow-y-auto rounded-xl border border-border bg-card p-5 text-xs font-mono leading-relaxed whitespace-pre-wrap select-text shadow-inner">
              {fullDomainNotesText || "No notes currently available for this domain. Click 'Sync via iGOT API' to retrieve official modules."}
            </div>

            <DialogFooter className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => handleCopyText(fullDomainNotesText, setIsDomainCopied)}
                >
                  {isDomainCopied ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {isDomainCopied ? "All Notes Copied" : "Copy All Notes"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    handleDownloadText(
                      `StatLearn_${domainNotesModal.replace(/\s+/g, "_")}_Handbook.txt`,
                      fullDomainNotesText,
                    )
                  }
                >
                  <Download className="size-3.5" /> Download Full Notes (.TXT)
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDomainNotesModal(null)}>
                  Close
                </Button>
                {domainMaterials.length > 0 && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      handleGenerateFromDoc(domainMaterials[0]);
                      setDomainNotesModal(null);
                    }}
                  >
                    <Sparkles className="size-3.5" /> Generate Domain Quiz
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
