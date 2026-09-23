
CREATE POLICY "survey files readable" ON storage.objects FOR SELECT USING (bucket_id IN ('survey-maps','plant-photos'));
CREATE POLICY "survey files insertable" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('survey-maps','plant-photos'));
CREATE POLICY "survey files updatable" ON storage.objects FOR UPDATE USING (bucket_id IN ('survey-maps','plant-photos')) WITH CHECK (bucket_id IN ('survey-maps','plant-photos'));
CREATE POLICY "survey files deletable" ON storage.objects FOR DELETE USING (bucket_id IN ('survey-maps','plant-photos'));
