
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name TEXT NOT NULL,
  campus_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  survey_name TEXT NOT NULL,
  survey_type TEXT NOT NULL DEFAULT 'Plant Survey',
  surveyor TEXT NOT NULL DEFAULT '',
  survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  map_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surveys TO anon, authenticated;
GRANT ALL ON public.surveys TO service_role;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surveys open access" ON public.surveys FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER surveys_updated BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.survey_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_areas TO anon, authenticated;
GRANT ALL ON public.survey_areas TO service_role;
ALTER TABLE public.survey_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas open access" ON public.survey_areas FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.plant_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  common_name TEXT NOT NULL,
  local_names TEXT DEFAULT '',
  scientific_name TEXT NOT NULL DEFAULT '',
  family TEXT DEFAULT '',
  genus TEXT DEFAULT '',
  species TEXT DEFAULT '',
  plant_type TEXT DEFAULT '',
  native_status TEXT DEFAULT 'unknown',
  description TEXT DEFAULT '',
  ecological_information TEXT DEFAULT '',
  flowering_season TEXT DEFAULT '',
  fruiting_season TEXT DEFAULT '',
  common_uses TEXT DEFAULT '',
  reference_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plant_master TO anon, authenticated;
GRANT ALL ON public.plant_master TO service_role;
ALTER TABLE public.plant_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plant master open access" ON public.plant_master FOR ALL USING (true) WITH CHECK (true);
CREATE UNIQUE INDEX plant_master_sci_unique ON public.plant_master (lower(scientific_name)) WHERE scientific_name <> '';

CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  area_id UUID REFERENCES public.survey_areas(id) ON DELETE SET NULL,
  plant_id UUID REFERENCES public.plant_master(id) ON DELETE SET NULL,
  common_name TEXT NOT NULL,
  local_name TEXT DEFAULT '',
  scientific_name TEXT DEFAULT '',
  family TEXT DEFAULT '',
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 0),
  map_x DOUBLE PRECISION,
  map_y DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  gps_accuracy DOUBLE PRECISION,
  height DOUBLE PRECISION CHECK (height IS NULL OR height >= 0),
  girth DOUBLE PRECISION CHECK (girth IS NULL OR girth >= 0),
  growth_form TEXT DEFAULT '',
  health TEXT DEFAULT 'healthy',
  native_status TEXT DEFAULT 'unknown',
  flower_present BOOLEAN NOT NULL DEFAULT false,
  fruit_present BOOLEAN NOT NULL DEFAULT false,
  identification_status TEXT NOT NULL DEFAULT 'identified',
  remarks TEXT DEFAULT '',
  surveyor TEXT DEFAULT '',
  survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  survey_time TIME NOT NULL DEFAULT CURRENT_TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.observations TO anon, authenticated;
GRANT ALL ON public.observations TO service_role;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "observations open access" ON public.observations FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER observations_updated BEFORE UPDATE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX observations_survey_idx ON public.observations (survey_id);

CREATE TABLE public.observation_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id UUID NOT NULL REFERENCES public.observations(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL DEFAULT 'whole_plant',
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.observation_photos TO anon, authenticated;
GRANT ALL ON public.observation_photos TO service_role;
ALTER TABLE public.observation_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos open access" ON public.observation_photos FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX observation_photos_obs_idx ON public.observation_photos (observation_id);

INSERT INTO public.plant_master (common_name, local_names, scientific_name, family, genus, species, plant_type, native_status, description, flowering_season, fruiting_season, common_uses) VALUES
('Neem','Bevu, Nimba','Azadirachta indica','Meliaceae','Azadirachta','indica','Tree','native','Fast-growing evergreen tree valued for medicinal properties.','Mar-May','Jun-Aug','Medicine, shade, pest control'),
('Mango','Mavu, Aam','Mangifera indica','Anacardiaceae','Mangifera','indica','Tree','native','Large evergreen fruit tree.','Dec-Mar','Apr-Jul','Fruit, timber, shade'),
('Coconut','Tengu, Nariyal','Cocos nucifera','Arecaceae','Cocos','nucifera','Palm','native','Tall palm with edible fruit.','Year-round','Year-round','Fruit, oil, fibre'),
('Banyan','Aalada mara, Bargad','Ficus benghalensis','Moraceae','Ficus','benghalensis','Tree','native','Large spreading tree with aerial roots.','Mar-Jun','May-Sep','Shade, ecological keystone'),
('Peepal','Arali, Pipal','Ficus religiosa','Moraceae','Ficus','religiosa','Tree','native','Sacred fig with heart-shaped leaves.','Feb-Apr','May-Jul','Shade, religious value'),
('Gulmohar','May flower','Delonix regia','Fabaceae','Delonix','regia','Tree','introduced','Ornamental tree with bright red flowers.','Apr-Jun','Aug-Nov','Ornamental, avenue tree'),
('Tamarind','Hunase, Imli','Tamarindus indica','Fabaceae','Tamarindus','indica','Tree','native','Long-lived tree with sour pods.','Apr-Jun','Jan-Apr','Fruit, timber, shade'),
('Jamun','Nerale','Syzygium cumini','Myrtaceae','Syzygium','cumini','Tree','native','Evergreen tree with purple edible fruit.','Mar-Apr','Jun-Aug','Fruit, medicine'),
('Guava','Perala, Amrood','Psidium guajava','Myrtaceae','Psidium','guajava','Tree','introduced','Small fruit tree.','Mar-Apr','Aug-Dec','Fruit'),
('Ashoka','Sita Ashok','Saraca asoca','Fabaceae','Saraca','asoca','Tree','native','Ornamental tree with orange flowers.','Feb-Apr','May-Jul','Ornamental, medicine'),
('Teak','Tegu, Sagwan','Tectona grandis','Lamiaceae','Tectona','grandis','Tree','native','Deciduous timber tree.','Jun-Sep','Nov-Jan','Timber'),
('Bamboo','Bidiru','Bambusa vulgaris','Poaceae','Bambusa','vulgaris','Grass','introduced','Fast-growing woody grass.','Rare','Rare','Construction, crafts'),
('Hibiscus','Dasavala','Hibiscus rosa-sinensis','Malvaceae','Hibiscus','rosa-sinensis','Shrub','introduced','Ornamental flowering shrub.','Year-round','Rare','Ornamental, hair care'),
('Bougainvillea','Kagada hoovu','Bougainvillea glabra','Nyctaginaceae','Bougainvillea','glabra','Shrub','introduced','Thorny ornamental climber.','Year-round','Rare','Ornamental hedges'),
('Curry Leaf','Karibevu','Murraya koenigii','Rutaceae','Murraya','koenigii','Shrub','native','Aromatic culinary shrub.','Mar-May','Jun-Aug','Culinary, medicine'),
('Tulsi','Holy Basil','Ocimum tenuiflorum','Lamiaceae','Ocimum','tenuiflorum','Herb','native','Sacred aromatic herb.','Year-round','Year-round','Medicine, religious'),
('Aloe Vera','Lolesara','Aloe barbadensis','Asphodelaceae','Aloe','barbadensis','Succulent','introduced','Medicinal succulent.','Nov-Feb','Rare','Medicine, cosmetics'),
('Papaya','Parangi','Carica papaya','Caricaceae','Carica','papaya','Tree','introduced','Short-lived fruit tree.','Year-round','Year-round','Fruit'),
('Silver Oak','Silver oak','Grevillea robusta','Proteaceae','Grevillea','robusta','Tree','introduced','Tall shade tree used in plantations.','Mar-May','Jun-Aug','Shade, timber'),
('Rain Tree','Mysore mara','Samanea saman','Fabaceae','Samanea','saman','Tree','introduced','Wide canopy avenue tree.','Mar-May','Jun-Sep','Shade, avenue'),
('Sandalwood','Srigandha','Santalum album','Santalaceae','Santalum','album','Tree','native','Aromatic heartwood tree.','Mar-Apr','Sep-Dec','Perfume, carving'),
('Jackfruit','Halasu, Kathal','Artocarpus heterophyllus','Moraceae','Artocarpus','heterophyllus','Tree','native','Large fruiting tree.','Dec-Mar','Apr-Aug','Fruit, timber'),
('Areca Palm','Adike','Areca catechu','Arecaceae','Areca','catechu','Palm','native','Slender palm grown for nuts.','Mar-May','Aug-Nov','Nut, ornamental'),
('Croton','Croton','Codiaeum variegatum','Euphorbiaceae','Codiaeum','variegatum','Shrub','introduced','Colourful ornamental foliage shrub.','Rare','Rare','Ornamental');
