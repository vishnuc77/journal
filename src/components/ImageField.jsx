import { useRef, useState } from "react";
import { supabase, SCREENSHOT_BUCKET } from "../supabaseClient";

const MAX_IMAGES = 5;

export default function ImageField({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const images = value || [];

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    setError("");
    try {
      const uploadedUrls = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(SCREENSHOT_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage
          .from(SCREENSHOT_BUCKET)
          .getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }
      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="image-field">
      <label className="field-label">
        {label} ({images.length}/{MAX_IMAGES})
      </label>
      <div className="image-grid">
        {images.map((url, i) => (
          <div className="image-preview" key={url + i}>
            <img src={url} alt={`${label} ${i + 1}`} />
            <button
              type="button"
              className="btn-ghost btn-small"
              onClick={() => removeAt(i)}
            >
              Remove
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            className="upload-dropzone"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "+ Add"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        style={{ display: "none" }}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
