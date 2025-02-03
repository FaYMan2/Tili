import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, X, FileText } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

interface CreateInterviewDialogProps {
  onCreate: (jobName: string, resume: string | null, jobDescriptionText: string) => Promise<void>;
}

const CreateInterviewDialog: React.FC<CreateInterviewDialogProps> = ({ onCreate }) => {
  const [open, setOpen] = useState(false);
  const [jobName, setJobName] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const readPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pages = Array.from({ length: pdf.numPages }, async (_, i) => {
      const page = await pdf.getPage(i + 1);
      const content = await page.getTextContent();
      return content.items.map((item: any) => item.str).join(" ");
    });
    return (await Promise.all(pages)).join("\n");
  };

  const handleCreate = async () => {
    if (!jobName || !resume) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsLoading(true);

    try {
      const [resumeText, jdText] = await Promise.all([
        readPDF(resume),
        jobDescriptionFile ? readPDF(jobDescriptionFile) : "",
      ]);

      await onCreate(jobName, resumeText, jobDescriptionText || jdText);
      setOpen(false);
      resetForm();
      toast.success("Interview created successfully!");
    } catch (error) {
      console.error("Error creating interview:", error);
      toast.error("Failed to create interview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setJobName("");
    setResume(null);
    setJobDescriptionFile(null);
    setJobDescriptionText("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            Start New Interview
          </Button>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[500px] overflow-y-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              New Interview Setup
            </DialogTitle>
            <DialogDescription className="text-gray-300 mt-2">
              Provide position details and required documents
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Job Name */}
            <div className="space-y-2">
              <Label className="text-gray-300">Position Title *</Label>
              <Input
                className="bg-white/5 border-white/10 text-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Senior Frontend Developer"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
              />
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label className="text-gray-300">Your Resume (PDF) *</Label>
              <FileUploadArea
                file={resume}
                onFileChange={setResume}
                accept="application/pdf"
              />
            </div>

            {/* Job Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Job Description (Optional)</Label>
                <Textarea
                  className="bg-white/5 border-white/10 text-gray-300 focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Paste job description text here..."
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  rows={4}
                />
                <div className="text-center text-sm text-gray-400">or</div>
              </div>

              <FileUploadArea
                file={jobDescriptionFile}
                onFileChange={setJobDescriptionFile}
                accept="application/pdf"
              />
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleCreate}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={!jobName || !resume || isLoading}
              >
                {isLoading ? "Creating..." : "Start Interview"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

const FileUploadArea = ({
  file,
  onFileChange,
  accept,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
}) => (
  <motion.div className="group" whileHover={{ scale: 1.02 }}>
    <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer transition-colors hover:border-blue-400/30 bg-white/5">
      <input
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />

      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-blue-400" />

        {file ? (
          <div className="flex items-center gap-2 mt-2">
            <FileText className="h-4 w-4 text-gray-300" />
            <span className="text-sm font-medium text-gray-300">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="text-red-400 hover:text-red-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm font-medium text-gray-300">Upload PDF</span>
            <span className="text-xs text-gray-400">Click or drag and drop</span>
          </>
        )}
      </div>
    </label>
  </motion.div>
);

export default CreateInterviewDialog;