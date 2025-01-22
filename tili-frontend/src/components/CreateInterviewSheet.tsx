import React, { useState } from "react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import * as pdfjs from "pdfjs-dist";

// Set worker source from the public folder
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";

interface CreateInterviewSheetProps {
  onCreate: (jobName: string, resume: File | null, jobDescriptionFile: File | null, jobDescriptionText: string) => void;
}

const CreateInterviewSheet: React.FC<CreateInterviewSheetProps> = ({ onCreate }) => {
  const [jobName, setJobName] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [showJobDescriptionForm, setShowJobDescriptionForm] = useState(false);

  const readPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const textArray: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      textArray.push(pageText);
    }

    return textArray.join("\n");
  };

  const handleCreate = async () => {
    let resumeText = "";
    let jobDescriptionFileText = "";

    if (resume && resume.type === "application/pdf") {
      try {
        resumeText = await readPDF(resume);
      } catch (error) {
        console.error("Error reading resume PDF:", error);
      }
    }

    if (jobDescriptionFile && jobDescriptionFile.type === "application/pdf") {
      try {
        jobDescriptionFileText = await readPDF(jobDescriptionFile);
      } catch (error) {
        console.error("Error reading job description PDF:", error);
      }
    }

    console.log("Resume Text:", resumeText);
    console.log("Job Description File Text:", jobDescriptionFileText);
    console.log("Job Description Text Area:", jobDescriptionText);

    onCreate(jobName, resume, jobDescriptionFile, jobDescriptionText);
    setJobName("");
    setResume(null);
    setJobDescriptionFile(null);
    setJobDescriptionText("");
    setShowJobDescriptionForm(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          Create New Interview
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="border-gray-700 bg-white/5 text-white p-6">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold text-white">Create New Interview</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          {/* Job Name Input */}
          <input
            className="w-full px-4 py-2 bg-white/10 text-white rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Job Name"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
          />

          {/* Resume Upload Area */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-lg p-6 bg-gray-800 text-center hover:bg-gray-700 cursor-pointer">
            <label className="w-full cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
              />
              <div className="text-white text-sm">
                {resume ? <span>{resume.name}</span> : "Click to upload your resume (PDF only)"}
              </div>
            </label>
          </div>

          {/* Optional Job Description Form */}
          <div className="space-y-4">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white w-full"
              onClick={() => setShowJobDescriptionForm((prev) => !prev)}
            >
              {showJobDescriptionForm ? "Cancel Job Description" : "Add Job Description (Optional)"}
            </Button>

            {showJobDescriptionForm && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-lg p-6 bg-gray-800 text-center hover:bg-gray-700 cursor-pointer">
                  <label className="w-full cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) => setJobDescriptionFile(e.target.files?.[0] || null)}
                    />
                    <div className="text-white text-sm">
                      {jobDescriptionFile ? (
                        <span>{jobDescriptionFile.name}</span>
                      ) : (
                        "Click to upload Job Description (PDF only)"
                      )}
                    </div>
                  </label>
                </div>
                <textarea
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Or write the Job Description here"
                  value={jobDescriptionText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button className="bg-green-500 hover:bg-green-600 text-white w-full" onClick={handleCreate}>
            Submit
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateInterviewSheet;
