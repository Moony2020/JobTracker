import React, { useRef, useMemo } from 'react';
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

  return (
    <div className="rich-text-editor-container">
      <ReactQuill 
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ height: 'auto', minHeight: '150px' }}
      />
    </div>
  );
};

export default RichTextEditor;
