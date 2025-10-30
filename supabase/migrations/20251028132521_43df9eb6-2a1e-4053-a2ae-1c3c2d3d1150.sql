-- Create drawings table
CREATE TABLE public.drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drawings
CREATE POLICY "Users can view their own drawings" 
ON public.drawings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drawings" 
ON public.drawings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drawings" 
ON public.drawings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drawings" 
ON public.drawings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger for updated_at
CREATE TRIGGER handle_drawings_updated_at
BEFORE UPDATE ON public.drawings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for drawings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('drawings', 'drawings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for drawings bucket
CREATE POLICY "Users can view their own drawings" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'drawings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own drawings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'drawings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own drawings" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'drawings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own drawings" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'drawings' AND auth.uid()::text = (storage.foldername(name))[1]);