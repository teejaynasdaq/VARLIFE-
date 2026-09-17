# welcome to the ubar driver app

# this app is for drivers to get rides from riders

# now this are the schema and supabase sql code

```json
# schema for drivers table
  {
 "user_id": "driver_uuid",
 "lat": the current driver lat,
 "lng": the current driver lng,
 "is_available": true,
 "updated_at": "timestamp"
}
```

```sql
-- Create the drivers table
CREATE TABLE public.drivers (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  is_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to update their own data
CREATE POLICY "Drivers can update their own status"
ON public.drivers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow anyone (or riders) to see available drivers
CREATE POLICY "Anyone can see available drivers"
ON public.drivers
FOR SELECT
USING (is_available = true);

```

```json
# schema for rides table
{
 "rider_id": "user_uuid",
 "pickup_lat": 6.5244,
 "pickup_lng": 3.3792,
 "destination_lat": 6.6018,
 "destination_lng": 3.3515,
 "price": 12.50,
 "distance_km": 8.3,
 "status": "searching",
 "driver_id": null
}
```

```sql
-- Create the rides table
create table public.rides (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- User/Rider Details
  rider_id uuid references auth.users(id) on delete cascade not null,

  -- Route Details
  pickup_lat float8 not null,
  pickup_lng float8 not null,
  destination_lat float8,
  destination_lng float8,

  -- Trip Info
  price numeric(10, 2) not null,
  distance_km numeric(10, 2) not null,

  -- Status: searching, accepted, arriving, ongoing, completed, cancelled
  status text default 'searching'::text not null,

  -- Driver Details (null until accepted)
  driver_id uuid references auth.users(id) on delete set null
);

-- Set up Row Level Security (RLS)
-- This allows users to see their own rides
alter table public.rides enable row level security;

create policy "Users can view their own rides"
  on public.rides for select
  using ( auth.uid() = rider_id );

create policy "Users can insert their own rides"
  on public.rides for insert
  with check ( auth.uid() = rider_id );

-- Allow all authenticated users to read records (so drivers can find rides)
-- In a production app, you would refine this further.
create policy "Authenticated users can see searching rides"
  on public.rides for select
  to authenticated
  using ( true );

-- Allow riders to update (cancel) their own rides
create policy "Users can update their own rides"
  on public.rides for update
  using ( auth.uid() = rider_id )
  with check ( auth.uid() = rider_id );
```

```sql
-- 1. Ensure realtime.messages policies allow authenticated users to receive/send broadcasts
CREATE POLICY "authenticated can receive broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated can send broadcasts"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Create trigger function for rides
CREATE OR REPLACE FUNCTION public.rides_changes_trigger()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'topic:rides:' || COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$;

-- 3. Create trigger for rides
DROP TRIGGER IF EXISTS rides_broadcast_trigger ON public.rides;
CREATE TRIGGER rides_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.rides_changes_trigger();

-- 4. Create trigger function for drivers
CREATE OR REPLACE FUNCTION public.drivers_changes_trigger()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'topic:drivers:' || COALESCE(NEW.id, OLD.id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$;

-- 5. Create trigger for drivers
DROP TRIGGER IF EXISTS drivers_broadcast_trigger ON public.drivers;
CREATE TRIGGER drivers_broadcast_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.drivers_changes_trigger();

```
