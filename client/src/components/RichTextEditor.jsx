import React, { useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Bold, Italic, Underline, Link, List, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const quillRef = useRef(null);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        [{ 'header': [1, 2, false] }],
        ['clean']
      ],
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'indent',
    'link', 'align'
  ];

  useEffect(() => {
    // Inject global styles for Quill editor spacing
    const styleId = 'quill-custom-spacing';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        .rich-text-editor-container .ql-container {
          padding-top: 0px !important;
          margin-top: 0 !important;
        }
        .rich-text-editor-container .ql-editor {
          padding: 8px 12px !important;
          margin-top: 0 !important;
          padding-top: 4px !important;
        }
        .rich-text-editor-container .ql-toolbar {
          margin-bottom: 0 !important;
          border-bottom: none !important;
          padding: 2px 8px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="rich-text-editor-container" style={{ paddingTop: '0', marginTop: '-4px' }}>
      <ReactQuill 
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ 
          height: 'auto', 
          minHeight: '150px'
        }}
      />
    </div>
  );
};

export default RichTextEditor;
