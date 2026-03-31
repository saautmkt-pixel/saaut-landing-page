-- Create the table for SAAUT leads
CREATE TABLE IF NOT EXISTS saaut_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company_size TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE saaut_leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for the lead form)
CREATE POLICY "Allow anonymous insert" ON saaut_leads
    FOR INSERT
    WITH CHECK (true);

-- Create policy to allow authenticated users (admin) to read leads
CREATE POLICY "Allow authenticated read" ON saaut_leads
    FOR SELECT
    TO authenticated
    USING (true);
