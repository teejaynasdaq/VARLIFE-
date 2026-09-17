import { useState, useCallback } from "react";

import { Ride, Driver } from "@/types/type";

/** Maps a Supabase driver row to the UI Driver type. */
export function mapSupabaseDriver(driver: any, index = 0): Driver {
  const nameParts = (driver.full_name ?? "VARLIFE Driver").split(" ");
  return {
    id: index + 1,
    first_name: nameParts[0] ?? "Driver",
    last_name: nameParts.slice(1).join(" ") || "",
    profile_image_url:
      driver.profile_image ??
      driver.profile_image_url ??
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a2dc52b2-8bf7-4e49-9a36-3ffb5229ed02/-/preview/465x466/",
    car_seats: 4,
    rating: Number(driver.rating ?? 5),
  };
}

/** Maps a Supabase ride row for RideCard display. */
export function normalizeRideForCard(ride: any): Ride {
  const driverUser = ride.drivers?.users;
  const driverName = driverUser
    ? `${driverUser.first_name ?? ""} ${driverUser.last_name ?? ""}`.trim()
    : "";
  const parts = driverName.split(" ");
  return {
    id: ride.id,
    origin_address: ride.pickup_address ?? "",
    destination_address: ride.dropoff_address ?? "",
    origin_latitude: Number(ride.pickup_lat ?? 0),
    origin_longitude: Number(ride.pickup_lng ?? 0),
    destination_latitude: Number(ride.dropoff_lat ?? 0),
    destination_longitude: Number(ride.dropoff_lng ?? 0),
    ride_time: ride.duration_minutes ?? 0,
    duration_minutes: ride.duration_minutes ?? 0,
    fare_price: Number(ride.final_price ?? 0),
    payment_status: ride.payment_status ?? "pending",
    driver_id: 0,
    user_id: ride.rider_id,
    created_at:
      ride.created_at ?? ride.requested_at ?? new Date().toISOString(),
    requested_at: ride.requested_at,
    status: (ride.status ?? "requested").toUpperCase(),
    pickup_address: ride.pickup_address,
    dropoff_address: ride.dropoff_address,
    pickup_lat: ride.pickup_lat,
    pickup_lng: ride.pickup_lng,
    dropoff_lat: ride.dropoff_lat,
    dropoff_lng: ride.dropoff_lng,
    driver: {
      first_name: parts[0] ?? "Driver",
      last_name: parts.slice(1).join(" "),
      car_seats: 4,
      profile_image_url: driverUser?.profile_image_url,
    },
  };
}

/** @deprecated Use Supabase helpers directly. Kept for backward compatibility. */
export const useFetch = <T>(_url: string) => {
  const [data] = useState<T | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const refetch = useCallback(async () => {}, []);
  return { data, loading, error, refetch };
};
