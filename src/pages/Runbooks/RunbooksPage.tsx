import React, { useState, useEffect } from 'react'
import { Book, Upload, Search, Filter, FileText, Database, Layers, Clock, Eye, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import api from '../../services/api'

export default function RunbooksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  useEffect(() => {
    const loadDocs = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/documents/')
        setDocuments(res.data.documents || res.data || [])
      } catch (err) {
        console.error('Failed to load documents:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDocs()
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first!');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/api/documents/upload', formData);
      setDocuments(prev => [res.data, ...prev]);
      alert('File uploaded successfully!');
      setIsModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed!');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      (doc.filename && doc.filename.toLowerCase().includes(lowerQuery)) ||
      (doc.file_type && doc.file_type.toLowerCase().includes(lowerQuery)) ||
      (doc.raw_summary && doc.raw_summary.toLowerCase().includes(lowerQuery))
    );
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto" style={{ background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Book size={32} className="text-slate-900" />
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              Knowledge Base
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Upload PDF/DOCX articles · stored locally · indexed into the RAG vector store
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/20 text-sm"
        >
          <Upload size={18} />
          UPLOAD ARTICLE
        </button>
      </div>



      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search runbooks, tags, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 rounded-2xl text-sm font-medium outline-none border border-slate-200 focus:border-blue-500/50 transition-all bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading documents...</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(90vh-300px)] min-h-[350px]">
            <table className="w-full text-left relative">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr style={{ background: '#f8fafc' }}>
                  {['FILENAME', 'FILE TYPE', 'UPLOADED AT', 'ACTIONS'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc, idx) => (
                  <tr key={doc.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 max-w-xs">
                      <div className="flex items-start gap-3 w-full min-w-0">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-500 flex-shrink-0 mt-0.5">
                          <FileText size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate" title={doc.filename}>{doc.filename || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 px-2.5 py-1 rounded-md bg-slate-100">
                        {doc.file_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-slate-500">
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                    {/* <td className="px-6 py-5 max-w-sm">
                      <p className="text-xs text-slate-600 line-clamp-2">{doc.raw_summary || 'No summary available.'}</p>
                    </td> */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedDocument(doc)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-blue-500"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {/* <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-red-500" title="Delete">
                          <Trash2 size={16} />
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">
                      No documents found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl border" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Upload size={20} />
                </span>
                <h3 className="text-xl font-bold text-slate-900">Upload Article</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <span className="text-slate-500 text-sm">✕</span>
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Supported formats: <strong>PDF, DOCX</strong>. Max file size: <strong>20 MB</strong>.
            </p>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload size={32} className="text-slate-400" />
              <div className="text-center">
                {selectedFile ? (
                  <p className="text-sm font-bold text-blue-600">{selectedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-bold text-slate-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">or select a file from your computer</p>
                  </>
                )}
              </div>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 20 * 1024 * 1024) {
                      alert('File size exceeds 20 MB limit!');
                      e.target.value = ''; // Reset input
                      return;
                    }
                    setSelectedFile(file);
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedFile(null); }} 
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-colors shadow-lg ${
                  uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                }`}
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Drawer/Modal */}
      {selectedDocument && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setSelectedDocument(null)} />
          <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-500 overflow-y-auto translate-x-0">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-500 flex-shrink-0">
                    <FileText size={24} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-extrabold text-slate-900 truncate pr-4" title={selectedDocument.filename}>{selectedDocument.filename}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {selectedDocument.id || 'N/A'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDocument(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <span className="text-slate-500 text-sm">✕</span>
                </button>
              </div>

              {/* Details List */}
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"> Summary</p>
                  <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {selectedDocument.raw_summary || 'No summary available for this document.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
