import { create } from "zustand";

interface RideStore {
  currentRide: any;
  currentRideId: string | null;
  matchedDriver: any;
  origin: any;
  destination: any;
  isCourier: boolean;
  estimatedPrice: number | null;
  passengerCount: number;
  negotiatedPrice: number | null;
  tripHistory: any[];
  stops: any[];
  paymentMethod: "cash" | "payshap";
  userId: string | null;
  polylineCoords: any[];
  distanceKm: number | null;
  durationMin: number | null;
  setCurrentRide: (ride: any) => void;
  clearCurrentRide: () => void;
  setCurrentRideId: (id: string | null) => void;
  setMatchedDriver: (driver: any) => void;
  setOrigin: (origin: any) => void;
  setDestination: (dest: any) => void;
  setIsCourier: (isCourier: boolean) => void;
  setEstimatedPrice: (price: number | null) => void;
  setPassengerCount: (count: number) => void;
  setNegotiatedPrice: (price: number | null) => void;
  setTripHistory: (history: any[]) => void;
  addStop: (stop: any) => void;
  removeStop: (index: number) => void;
  setPaymentMethod: (pm: "cash" | "payshap") => void;
  setUserId: (id: string | null) => void;
  setPolylineCoords: (coords: any) => void;
  setDistanceKm: (km: number) => void;
  setDurationMin: (min: number) => void;
}

export const useRideStore = create<RideStore>((set) => ({
  currentRide: null,
  currentRideId: null,
  matchedDriver: null,
  origin: null,
  destination: null,
  isCourier: false,
  estimatedPrice: null,
  passengerCount: 1,
  negotiatedPrice: null,
  tripHistory: [],
  stops: [],
  paymentMethod: "cash",
  userId: null,
  polylineCoords: [],
  distanceKm: null,
  durationMin: null,
  setCurrentRide: (ride) => set({ currentRide: ride }),
  clearCurrentRide: () => set({ currentRide: null }),
  setCurrentRideId: (id) => set({ currentRideId: id }),
  setMatchedDriver: (driver) => set({ matchedDriver: driver }),
  setOrigin: (origin) => set({ origin }),
  setDestination: (dest) => set({ destination: dest }),
  setIsCourier: (isCourier) => set({ isCourier }),
  setEstimatedPrice: (price) => set({ estimatedPrice: price }),
  setPassengerCount: (count) => set({ passengerCount: count }),
  setNegotiatedPrice: (price) => set({ negotiatedPrice: price }),
  setTripHistory: (history) => set({ tripHistory: history }),
  addStop: (stop) => set((state) => ({ stops: [...state.stops, stop] })),
  removeStop: (index) =>
    set((state) => ({
      stops: state.stops.filter((_, i) => i !== index),
    })),
  setPaymentMethod: (pm) => set({ paymentMethod: pm }),
  setUserId: (id) => set({ userId: id }),
  setPolylineCoords: (coords) => set({ polylineCoords: coords }),
  setDistanceKm: (km) => set({ distanceKm: km }),
  setDurationMin: (min) => set({ durationMin: min }),
}));
