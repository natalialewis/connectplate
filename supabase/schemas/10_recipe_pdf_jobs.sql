-- PDF export jobs: background worker uploads to Storage; client polls by job id.
CREATE TABLE recipe_pdf_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    storage_path TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX recipe_pdf_jobs_user_created_idx ON recipe_pdf_jobs (user_id, created_at DESC);
CREATE INDEX recipe_pdf_jobs_recipe_idx ON recipe_pdf_jobs (recipe_id);

CREATE TRIGGER set_updated_at_recipe_pdf_jobs
    BEFORE UPDATE ON recipe_pdf_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

ALTER TABLE recipe_pdf_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pdf jobs"
ON recipe_pdf_jobs FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own pdf jobs"
ON recipe_pdf_jobs FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Private bucket: files at {user_id}/{job_id}.pdf; access via signed URLs from API.
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-pdfs', 'recipe-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own recipe pdfs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'recipe-pdfs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
