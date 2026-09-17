import { Driver, MarkerData } from "@/types/type";

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    // Generate random position within ~1-3km of user
    // 0.01 degrees is approx 1.1km
    const latOffset = (Math.random() - 0.5) * 0.04;
    const lngOffset = (Math.random() - 0.5) * 0.04;

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const simulateDriverMovement = (markers: MarkerData[]): MarkerData[] => {
  return markers.map((marker) => {
    // Move slightly
    const latMove = (Math.random() - 0.5) * 0.0005; // Small movement
    const lngMove = (Math.random() - 0.5) * 0.0005;

    return {
      ...marker,
      latitude: marker.latitude + latMove,
      longitude: marker.longitude + lngMove,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: -25.7479, // Default to Pretoria/Gauteng as a broader SA center
      longitude: 28.2293,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  try {
    const timesPromises = markers.map(async (marker) => {
      // Mock calculation using direct distance (haversine approximation)
      // because routing for ALL drivers would be expensive and slow
      const distanceToUser =
        Math.sqrt(
          Math.pow(marker.latitude - userLatitude, 2) +
            Math.pow(marker.longitude - userLongitude, 2),
        ) * 111000; // Convert to meters (approximate)

      const distanceToDestination =
        Math.sqrt(
          Math.pow(userLatitude - destinationLatitude, 2) +
            Math.pow(userLongitude - destinationLongitude, 2),
        ) * 111000; // Convert to meters (approximate)

      const totalDistance = distanceToUser + distanceToDestination;
      const totalTime = (totalDistance / 1000) * 2; // Rough estimate: 2 minutes per km
      const price = (totalTime * 0.5).toFixed(2); // Calculate price based on time

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times:", error);
  }
};
