import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { ArrowUpTrayIcon, DocumentArrowDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { parseCSV, downloadSampleTemplate } from "../../utils/importLeadsHelper";
import { leadsAPI } from "../../utils/api";
import toast from 'react-hot-toast';

export default function ImportLeadsModal({ isOpen, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
                toast.error("Please upload a valid CSV file");
                return;
            }
            setFile(selectedFile);
            setStats(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const selectedFile = e.dataTransfer.files[0];
        if (selectedFile) {
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
                toast.error("Please upload a valid CSV file");
                return;
            }
            setFile(selectedFile);
            setStats(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const parsedData = await parseCSV(file);

            console.log("Parsed CSV Data:", parsedData); // DEBUG: Check what is being parsed

            if (parsedData.length === 0) {
                toast.error("The CSV file is empty");
                setUploading(false);
                return;
            }

            console.log("Sending to API:", { leads: parsedData }); // DEBUG

            // Call API
            const response = await leadsAPI.importLeads({ leads: parsedData });
            console.log("API Response:", response); // DEBUG

            if (response.data && response.data.success) {
                setStats({
                    total: response.data.total || parsedData.length,
                    imported: response.data.imported || 0
                });
                toast.success(`Successfully imported ${response.data.imported} leads`);
                if (onSuccess) onSuccess();
                // Don't close immediately so user can see stats
            } else {
                console.error("Import failed with response:", response);
                toast.error("Import failed. Please check the console for details.");
            }
        } catch (error) {
            console.error("Import failed:", error);
            const errMsg = error.response?.data?.message || error.message || "Failed to import leads";
            toast.error(errMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setStats(null);
        onClose();
    };

    // If stats are shown, show a success view
    if (stats) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Complete</DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-center space-y-4">
                        <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                            <ArrowUpTrayIcon className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white">{stats.imported} Leads Imported</p>
                            <p className="text-gray-400 text-sm mt-1">out of {stats.total} entries found</p>
                        </div>
                        <Button onClick={handleClose} className="w-full mt-4">
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Leads</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Instructions */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400 flex justify-between items-center">
                        <span>Use the sample template to format your data.</span>
                        <button
                            onClick={downloadSampleTemplate}
                            className="flex items-center hover:text-white transition-colors underline"
                        >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                            Download Template
                        </button>
                    </div>

                    {/* File Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-gray-700 hover:border-gray-500 hover:bg-white/5'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {file ? (
                            <div className="flex flex-col items-center">
                                <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3">
                                    <DocumentArrowDownIcon className="h-6 w-6 text-indigo-400" />
                                </div>
                                <p className="font-medium text-white break-all">{file.name}</p>
                                <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                    className="mt-3 text-xs text-red-400 hover:text-red-300 flex items-center"
                                >
                                    <XMarkIcon className="h-3 w-3 mr-1" /> Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <ArrowUpTrayIcon className="h-10 w-10 text-gray-500 mb-3" />
                                <p className="text-gray-300 font-medium">Click to upload or drag & drop</p>
                                <p className="text-xs text-gray-500 mt-1">CSV files only</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                            {uploading ? 'Importing...' : 'Import Leads'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
