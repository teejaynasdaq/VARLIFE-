/**
 * Firebase/Firestore data layer (legacy filename: supabase.ts).
 * Kept so existing `@/lib/supabase` imports keep working.
 * There is NO live Supabase client here — Auth/DB/Storage are Firebase.
 */
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { calculateFare, RIDE_TYPE_MULTIPLIERS } from "@/lib/pricing";
import { toDbStatus } from "@/lib/rideStatus";

// Map Clerk IDs directly to Firebase UIDs (no-op mapping to avoid breaking other files)
export const clerkIdToUuid = (id: string): string => id;

// Connection check helper
export const checkConnection = async (): Promise<boolean> => {
  try {
    // Lightweight connectivity probe against Firestore
    await getDocs(query(collection(db, "users"), limit(1)));
    return true;
  } catch (err) {
    console.error("[Firebase] Connection check failed:", err);
    return false;
  }
};

// Storage upload re-implementation
export const uploadImageToSupabase = async (
  uri: string,
  bucket: string,
  path: string,
): Promise<string | null> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `${bucket}/${path}`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error("[Firebase Storage] Upload error:", err);
    return null;
  }
};

export const ensureStorageBucket = async (bucketName: string): Promise<boolean> => {
  return true;
};

// --- Fluent Query Builder for Supabase Compatibility ---
class SupabaseQueryBuilder {
  private collectionName: string;
  private filters: { field: string; operator: string; value: any }[] = [];
  private limitVal?: number;
  private orderField?: string;
  private orderAscending = true;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  select(fields?: string) {
    return this;
  }

  eq(field: string, value: any) {
    // Translate common fields for compatibility
    let f = field;
    if (field === "id") f = "id";
    this.filters.push({ field: f, operator: "==", value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, operator: "in", value: values });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(val: number) {
    this.limitVal = val;
    return this;
  }

  single() {
    return this.execute().then(res => {
      if (res.error) throw res.error;
      return { data: res.data ? res.data[0] || null : null, error: null };
    });
  }

  maybeSingle() {
    return this.execute().then(res => {
      return { data: res.data ? res.data[0] || null : null, error: null };
    });
  }

  async execute() {
    try {
      let q = query(collection(db, this.collectionName));
      for (const f of this.filters) {
        q = query(q, where(f.field, f.operator as any, f.value));
      }
      if (this.orderField) {
        q = query(q, orderBy(this.orderField, this.orderAscending ? "asc" : "desc"));
      }
      if (this.limitVal) {
        q = query(q, limit(this.limitVal));
      }
      const snap = await getDocs(q);
      const results = snap.docs.map(docObj => ({ id: docObj.id, ...docObj.data() }));
      return { data: results, error: null };
    } catch (err: any) {
      console.error("[Firestore Compat Builder] Query execution error:", err);
      return { data: null, error: err };
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async insert(data: any | any[]) {
    try {
      const arr = Array.isArray(data) ? data : [data];
      const results = [];
      for (const item of arr) {
        // If an explicit id/UID is passed in the item, use it as the Firestore document ID
        const docId = item.id || item.driver_id || item.user_id || item.rider_id;
        const docRef = docId 
          ? doc(db, this.collectionName, docId) 
          : doc(collection(db, this.collectionName));
        
        const payload = {
          id: docRef.id,
          ...item,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await setDoc(docRef, payload, { merge: true });
        results.push(payload);
      }
      return { data: results, error: null };
    } catch (err: any) {
      console.error("[Firestore Compat Builder] Insert error:", err);
      return { data: null, error: err };
    }
  }

  async upsert(data: any | any[]) {
    return this.insert(data);
  }

  async update(data: any) {
    try {
      const results = await this.execute();
      if (results.data) {
        for (const item of results.data) {
          const docRef = doc(db, this.collectionName, item.id);
          await updateDoc(docRef, { ...data, updated_at: new Date().toISOString() });
        }
      }
      return { data: results.data, error: null };
    } catch (err: any) {
      console.error("[Firestore Compat Builder] Update error:", err);
      return { data: null, error: err };
    }
  }

  async delete() {
    try {
      const results = await this.execute();
      if (results.data) {
        for (const item of results.data) {
          const docRef = doc(db, this.collectionName, item.id);
          await deleteDoc(docRef);
        }
      }
      return { error: null };
    } catch (err: any) {
      console.error("[Firestore Compat Builder] Delete error:", err);
      return { error: err };
    }
  }
}

class SupabaseChannel {
  private callbacks: { table: string; event: string; callback: (payload: any) => void }[] = [];
  private unsubscribes: (() => void)[] = [];

  constructor(private name: string) {}

  on(
    type: string,
    filter: { event: string; schema: string; table: string; filter?: string },
    callback: (payload: any) => void
  ) {
    this.callbacks.push({ table: filter.table, event: filter.event, callback });
    return this;
  }

  subscribe() {
    for (const cb of this.callbacks) {
      const colRef = collection(db, cb.table);
      const unsub = onSnapshot(colRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const docData = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === "added" && (cb.event === "INSERT" || cb.event === "*")) {
            cb.callback({ eventType: "INSERT", new: docData });
          } else if (change.type === "modified" && (cb.event === "UPDATE" || cb.event === "*")) {
            cb.callback({ eventType: "UPDATE", new: docData });
          } else if (change.type === "removed" && (cb.event === "DELETE" || cb.event === "*")) {
            cb.callback({ eventType: "DELETE", old: docData });
          }
        });
      });
      this.unsubscribes.push(unsub);
    }
    return this;
  }

  unsubscribe() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }
}

export const supabase = {
  from: (collectionName: string) => new SupabaseQueryBuilder(collectionName),
  channel: (name: string) => new SupabaseChannel(name),
  removeChannel: (channel: any) => {
    if (channel && typeof channel.unsubscribe === "function") {
      channel.unsubscribe();
    }
  }
};

// --- Repository Functions ---
export const upsertUser = async (user: {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
  authProvider?: string;
}) => {
  const userRef = doc(db, "users", user.id);
  const now = new Date().toISOString();
  const parts = user.fullName.trim().split(/\s+/);
  const firstName = user.firstName ?? parts[0] ?? "";
  const lastName = user.lastName ?? (parts.slice(1).join(" ") || "");

  const payload = {
    id: user.id,
    clerk_id: user.id,
    email: user.email,
    first_name: firstName,
    last_name: lastName,
    full_name: user.fullName,
    phone: user.phone ?? null,
    profile_image_url: user.profileImageUrl ?? null,
    auth_provider: user.authProvider ?? "email",
    updated_at: now,
  };

  await setDoc(userRef, payload, { merge: true });
  return payload;
};

export const updateUserProfile = async (user: {
  id: string;
  fullName: string;
  profileImageUrl?: string | null;
}) => {
  const userRef = doc(db, "users", user.id);
  const parts = user.fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || "";

  const payload = {
    first_name: firstName,
    last_name: lastName,
    full_name: user.fullName,
    profile_image_url: user.profileImageUrl ?? null,
    updated_at: new Date().toISOString(),
  };

  await updateDoc(userRef, payload);
  return { id: user.id, ...payload };
};

export const getUserById = async (id: string) => {
  const userRef = doc(db, "users", id);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
};

export const getDriverById = async (id: string) => {
  const driverRef = doc(db, "drivers", id);
  const snap = await getDoc(driverRef);
  if (!snap.exists()) return null;

  const driverData = snap.data();

  const vehicleRef = doc(db, "vehicle_details", id);
  const vehicleSnap = await getDoc(vehicleRef);
  const vehicleDetails = vehicleSnap.exists() ? vehicleSnap.data() : null;

  const bankRef = doc(db, "bank_details", id);
  const bankSnap = await getDoc(bankRef);
  const bankDetails = bankSnap.exists() ? bankSnap.data() : null;

  return {
    ...driverData,
    vehicle_details: vehicleDetails,
    bank_details: bankDetails,
  };
};

export const upsertDriver = async (driver: {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate: string;
  profile_image?: string | null;
}) => {
  const driverRef = doc(db, "drivers", driver.id);
  const payload = {
    ...driver,
    user_id: driver.id,
    is_online: false,
    is_verified: false,
    verification_status: "pending",
    rating: 5.0,
    total_rides: 0,
    total_trips: 0,
    total_earnings: 0,
    updated_at: new Date().toISOString(),
  };

  await setDoc(driverRef, payload, { merge: true });
  return [payload];
};

export const getRideById = async (id: string) => {
  const rideRef = doc(db, "rides", id);
  const snap = await getDoc(rideRef);
  if (!snap.exists()) return null;

  const rideData = snap.data();
  if (rideData.driver_id) {
    const driverRef = doc(db, "drivers", rideData.driver_id);
    const driverSnap = await getDoc(driverRef);
    if (driverSnap.exists()) {
      rideData.drivers = driverSnap.data();
    }
  }
  return rideData;
};

export const createRide = async (rideData: {
  user_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  stops?: any[];
  capacity?: number;
  distance_km?: number;
  duration_minutes?: number;
  ride_type?: string;
  payment_method?: string;
  student_discount_pct?: number;
  proposed_price?: number;
}) => {
  const distanceKm = rideData.distance_km ?? 0;
  const durationMin = rideData.duration_minutes ?? 0;
  const multiplier = RIDE_TYPE_MULTIPLIERS[rideData.ride_type ?? "standard"] ?? 1.1;

  const fare = await calculateFare({
    distanceKm,
    durationMinutes: durationMin,
    rideTypeMultiplier: multiplier,
    studentDiscountPct: rideData.student_discount_pct,
  });

  const finalPrice = rideData.proposed_price ?? fare.final_price;
  const driverPayout = finalPrice * 0.85;
  const platformCommission = finalPrice - driverPayout;

  const userRef = doc(db, "users", rideData.user_id);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : null;
  const passengerName = userData?.full_name || "VARLIFE User";
  const passengerPhone = userData?.phone || "";

  const rideRef = doc(collection(db, "rides"));
  const payload = {
    // Original fields for compatibility
    id: rideRef.id,
    user_id: rideData.user_id,
    rider_id: rideData.user_id,
    status: "requested",
    pickup_address: rideData.pickup_address,
    pickup_lat: rideData.pickup_lat,
    pickup_lng: rideData.pickup_lng,
    dropoff_address: rideData.dropoff_address,
    dropoff_lat: rideData.dropoff_lat,
    dropoff_lng: rideData.dropoff_lng,
    distance_km: distanceKm,
    duration_minutes: durationMin,
    base_fare: fare.base_fare,
    distance_cost: fare.distance_cost,
    time_cost: fare.time_cost,
    surge_multiplier: fare.surge_multiplier,
    discount_applied: fare.discount_applied,
    final_price: finalPrice,
    proposed_price: rideData.proposed_price ?? null,
    platform_commission: platformCommission,
    driver_payout: driverPayout,
    payment_method: rideData.payment_method ?? "cash",
    payment_status: "pending",
    stops: rideData.stops ?? [],
    capacity: rideData.capacity ?? 1,
    requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // New strict 23 fields required by user
    rideId: rideRef.id,
    passengerId: rideData.user_id,
    passengerName: passengerName,
    passengerPhone: passengerPhone,
    pickupAddress: rideData.pickup_address,
    pickupLatitude: rideData.pickup_lat,
    pickupLongitude: rideData.pickup_lng,
    destinationAddress: rideData.dropoff_address,
    destinationLatitude: rideData.dropoff_lat,
    destinationLongitude: rideData.dropoff_lng,
    selectedRideType: rideData.ride_type ?? "VAR Go",
    estimatedDistanceKm: distanceKm,
    estimatedDurationMin: durationMin,
    estimatedFare: fare.final_price,
    offerAmount: rideData.proposed_price ?? null,
    recommendedFare: fare.final_price,
    paymentMethod: rideData.payment_method ?? "cash",
    driverId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(rideRef, payload);
  return [payload];
};

export const getRideHistory = async (userId: string) => {
  const ridesQuery = query(
    collection(db, "rides"),
    where("rider_id", "==", userId),
    orderBy("requested_at", "desc")
  );
  const snap = await getDocs(ridesQuery);
  const rides = snap.docs.map(docObj => docObj.data());

  for (const ride of rides) {
    if (ride.driver_id) {
      const driverRef = doc(db, "drivers", ride.driver_id);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        const driverData = driverSnap.data();
        const userRef = doc(db, "users", ride.driver_id);
        const userSnap = await getDoc(userRef);
        ride.drivers = {
          ...driverData,
          users: userSnap.exists() ? userSnap.data() : null
        };
      }
    }
  }
  return rides;
};

export const getAvailableRides = async () => {
  const ridesQuery = query(
    collection(db, "rides"),
    where("status", "==", "requested"),
    orderBy("requested_at", "asc")
  );
  const snap = await getDocs(ridesQuery);
  const rides = snap.docs.map(docObj => docObj.data());

  for (const ride of rides) {
    const userRef = doc(db, "users", ride.rider_id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      ride.users = userSnap.data();
    }
  }
  return rides;
};

export const updateRideStatus = async (
  rideId: string,
  status: string,
  driverId?: string,
  extra?: Record<string, any>,
) => {
  const dbStatus = toDbStatus(status);
  const rideRef = doc(db, "rides", rideId);
  const updateData: any = {
    status: dbStatus,
    updated_at: new Date().toISOString(),
    ...extra,
  };
  if (driverId) updateData.driver_id = driverId;

  if (dbStatus === "accepted") updateData.accepted_at = new Date().toISOString();
  if (dbStatus === "started") updateData.started_at = new Date().toISOString();
  if (dbStatus === "completed") updateData.completed_at = new Date().toISOString();
  if (dbStatus === "cancelled") updateData.cancelled_at = new Date().toISOString();

  await updateDoc(rideRef, updateData);
  const updatedSnap = await getDoc(rideRef);
  return [updatedSnap.data()];
};

export const createNegotiation = async (negotiation: {
  ride_id: string;
  sender_type: "driver" | "user";
  proposed_price: number;
  message?: string;
}) => {
  const negRef = doc(collection(db, "ride_negotiations"));
  const payload = {
    id: negRef.id,
    ...negotiation,
    created_at: new Date().toISOString(),
  };
  await setDoc(negRef, payload);
  return [payload];
};

export const getRideNegotiations = async (rideId: string) => {
  const negQuery = query(
    collection(db, "ride_negotiations"),
    where("ride_id", "==", rideId),
    orderBy("created_at", "asc")
  );
  const snap = await getDocs(negQuery);
  return snap.docs.map(docObj => docObj.data());
};

export const createPaymentRecord = async (payment: {
  ride_id: string;
  user_id: string;
  amount: number;
  stripe_payment_intent_id?: string;
  status?: string;
}) => {
  const payRef = doc(collection(db, "payments"));
  const payload = {
    id: payRef.id,
    ...payment,
    status: payment.status || "SUCCESS",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await setDoc(payRef, payload);
  return [payload];
};

export const getVehicleDetails = async (driverId: string) => {
  const snap = await getDoc(doc(db, "vehicle_details", driverId));
  return snap.exists() ? snap.data() : null;
};

export const upsertVehicleDetails = async (details: {
  driver_id: string;
  car_model?: string;
  number_plate?: string;
  license_url?: string | null;
  outside_pic_url?: string | null;
  inside_pic_url?: string | null;
}) => {
  const ref = doc(db, "vehicle_details", details.driver_id);
  const payload = {
    ...details,
    updated_at: new Date().toISOString(),
  };
  await setDoc(ref, payload, { merge: true });
  return [payload];
};

export const upsertBankDetails = async (details: {
  driver_id: string;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  branch_code?: string;
}) => {
  const ref = doc(db, "bank_details", details.driver_id);
  const payload = {
    ...details,
    updated_at: new Date().toISOString(),
  };
  await setDoc(ref, payload, { merge: true });
  return [payload];
};

export const getEmergencyContacts = async (userId: string) => {
  const contactsQuery = query(
    collection(db, "emergency_contacts"),
    where("user_id", "==", userId)
  );
  const snap = await getDocs(contactsQuery);
  return snap.docs.map(docObj => docObj.data());
};

export const addEmergencyContact = async (contact: {
  user_id: string;
  name: string;
  phone: string;
}) => {
  const ref = doc(collection(db, "emergency_contacts"));
  const payload = {
    id: ref.id,
    ...contact,
    created_at: new Date().toISOString(),
  };
  await setDoc(ref, payload);
  return [payload];
};

export const deleteEmergencyContact = async (contactId: string) => {
  await deleteDoc(doc(db, "emergency_contacts", contactId));
};

export const submitRating = async (rating: {
  ride_id: string;
  user_id: string;
  driver_id: string;
  rating: number;
  review?: string;
}) => {
  const ref = doc(collection(db, "ride_ratings"));
  const payload = {
    id: ref.id,
    ride_id: rating.ride_id,
    rater_id: rating.user_id,
    rated_user_id: rating.driver_id,
    rating: rating.rating,
    review: rating.review || null,
    created_at: new Date().toISOString(),
  };
  await setDoc(ref, payload);
  return [payload];
};

export const updateDriverLocation = async (
  driverId: string,
  lat: number,
  lng: number,
) => {
  await updateDoc(doc(db, "drivers", driverId), {
    current_lat: lat,
    current_lng: lng,
    updated_at: new Date().toISOString(),
  });
};

export const setDriverOnlineStatus = async (
  driverId: string,
  isOnline: boolean,
  lat?: number,
  lng?: number,
) => {
  const update: any = {
    is_online: isOnline,
    updated_at: new Date().toISOString(),
  };
  if (isOnline) {
    update.online_since = new Date().toISOString();
    if (lat) update.current_lat = lat;
    if (lng) update.current_lng = lng;
  }
  await updateDoc(doc(db, "drivers", driverId), update);
  const snap = await getDoc(doc(db, "drivers", driverId));
  return [snap.data()];
};

export const upsertPayshapDetails = async (details: {
  driver_id: string;
  payshap_number: string;
  account_name: string;
  bank_name?: string;
}) => {
  const ref = doc(db, "payshap_details", details.driver_id);
  const payload = {
    driver_id: details.driver_id,
    payshap_number: details.payshap_number,
    account_name: details.account_name,
    bank_name: details.bank_name ?? null,
    updated_at: new Date().toISOString(),
  };
  await setDoc(ref, payload, { merge: true });
  return [payload];
};

export const getNearbyOnlineDrivers = async (
  lat: number,
  lng: number,
  radiusKm = 15,
) => {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const driversQuery = query(
    collection(db, "drivers"),
    where("is_online", "==", true),
    where("is_approved", "==", true)
  );

  let snap;
  try {
    snap = await getDocs(driversQuery);
  } catch (err) {
    console.error("[getNearbyOnlineDrivers] Error fetching drivers:", err);
    throw err;
  }
  const drivers: DocumentData[] = [];

  for (const docObj of snap.docs) {
    const d = docObj.data();
    if (
      d.current_lat >= lat - latDelta &&
      d.current_lat <= lat + latDelta &&
      d.current_lng >= lng - lngDelta &&
      d.current_lng <= lng + lngDelta
    ) {
      const userRef = doc(db, "users", d.id);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        console.error("[getNearbyOnlineDrivers] Error fetching user " + d.id + ":", err);
        throw err;
      }
      const userData = userSnap.exists() ? userSnap.data() : null;

      drivers.push({
        ...d,
        full_name: userData ? `${userData.first_name ?? ""} ${userData.last_name ?? ""}`.trim() : "VARLIFE Driver",
        profile_image: userData?.profile_image_url,
        rating: userData?.rating ?? 5,
        vehicle_plate: d.vehicle_registration,
      });
    }
  }

  return drivers;
};

export const getSavedLocations = async (userId: string) => {
  const locationsQuery = query(
    collection(db, "saved_locations"),
    where("user_id", "==", userId)
  );
  const snap = await getDocs(locationsQuery);
  return snap.docs.map(docObj => docObj.data());
};

export const getRecentDestinations = async (userId: string, limitVal = 5) => {
  const ridesQuery = query(
    collection(db, "rides"),
    where("rider_id", "==", userId),
    orderBy("requested_at", "desc"),
    limit(limitVal * 3)
  );
  const snap = await getDocs(ridesQuery);
  const rides = snap.docs.map(docObj => docObj.data());

  const seen = new Set<string>();
  const unique: { address: string; latitude: number; longitude: number }[] = [];

  for (const ride of rides) {
    const key = ride.dropoff_address?.toLowerCase().trim();
    if (!key || seen.has(key) || !ride.dropoff_lat || !ride.dropoff_lng) continue;
    seen.add(key);
    unique.push({
      address: ride.dropoff_address,
      latitude: Number(ride.dropoff_lat),
      longitude: Number(ride.dropoff_lng),
    });
    if (unique.length >= limitVal) break;
  }

  return unique;
};

export const getPaymentHistory = async (userId: string) => {
  const ridesQuery = query(
    collection(db, "rides"),
    where("rider_id", "==", userId),
    where("status", "==", "completed"),
    orderBy("completed_at", "desc")
  );
  const snap = await getDocs(ridesQuery);
  return snap.docs.map(docObj => {
    const r = docObj.data();
    return {
      id: r.id,
      amount: r.final_price,
      status: r.payment_status ?? "paid",
      created_at: r.completed_at ?? r.created_at,
      rides: r,
    };
  });
};

export const submitLostItemReport = async (report: {
  user_id: string;
  ride_id: string;
  description: string;
}) => {
  const ref = doc(collection(db, "lost_item_reports"));
  const payload = {
    id: ref.id,
    user_id: report.user_id,
    ride_id: report.ride_id,
    description: report.description,
    status: "open",
    created_at: new Date().toISOString(),
  };
  await setDoc(ref, payload);
  return [payload];
};

export const getActiveRideChats = async (userId: string) => {
  const ridesQuery = query(
    collection(db, "rides"),
    where("rider_id", "==", userId),
    where("status", "in", ["accepted", "started", "completed"]),
    orderBy("updated_at", "desc"),
    limit(20)
  );
  const snap = await getDocs(ridesQuery);
  const rides = snap.docs.map(docObj => docObj.data());

  for (const r of rides) {
    if (r.driver_id) {
      const driverRef = doc(db, "drivers", r.driver_id);
      const driverSnap = await getDoc(driverRef);
      if (driverSnap.exists()) {
        const driverData = driverSnap.data();
        const userRef = doc(db, "users", r.driver_id);
        const userSnap = await getDoc(userRef);
        r.drivers = {
          ...driverData,
          full_name: userSnap.exists()
            ? `${userSnap.data()?.first_name ?? ""} ${userSnap.data()?.last_name ?? ""}`.trim()
            : "Driver",
          profile_image: userSnap.exists() ? userSnap.data()?.profile_image_url : null,
        };
      }
    }
  }

  return rides;
};

export const cancelRide = async (
  rideId: string,
  _cancelledBy: "user" | "driver" | "system",
  reason?: string,
) => {
  const rideRef = doc(db, "rides", rideId);
  const payload = {
    status: "cancelled",
    cancellation_reason: reason ?? null,
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await updateDoc(rideRef, payload);
  const snap = await getDoc(rideRef);
  return [snap.data()];
};

export const submitStudentVerification = async (submission: {
  user_id: string;
  institution: string;
  student_number?: string;
  student_email?: string;
  card_photo_url: string;
  selfie_photo_url: string;
}) => {
  const ref = doc(db, "student_verifications", submission.user_id);
  const payload = {
    user_id: submission.user_id,
    institution: submission.institution,
    student_number: submission.student_number ?? null,
    student_email: submission.student_email ?? null,
    card_photo_url: submission.card_photo_url,
    selfie_photo_url: submission.selfie_photo_url,
    status: "pending",
    updated_at: new Date().toISOString(),
  };

  await setDoc(ref, payload);

  await updateDoc(doc(db, "users", submission.user_id), {
    student_verification_status: "pending",
    university: submission.institution,
    student_number: submission.student_number ?? null,
    student_email: submission.student_email ?? null,
    updated_at: new Date().toISOString(),
  });

  return payload;
};

export const getStudentVerificationStatus = async (userId: string) => {
  const snap = await getDoc(doc(db, "student_verifications", userId));
  return snap.exists() ? snap.data() : null;
};

export const deleteUserAccount = async (userId: string, clerkId: string) => {
  const now = new Date().toISOString();

  const ridesQuery = query(
    collection(db, "rides"),
    where("rider_id", "==", userId)
  );
  const ridesSnap = await getDocs(ridesQuery);
  for (const rideDoc of ridesSnap.docs) {
    const r = rideDoc.data();
    if (["requested", "accepted", "started"].includes(r.status)) {
      await updateDoc(doc(db, "rides", rideDoc.id), {
        status: "cancelled",
        cancellation_reason: "Account deleted",
        cancelled_at: now,
      });
    }
  }

  await updateDoc(doc(db, "users", userId), {
    email: `deleted_${userId.slice(0, 8)}@varlife.invalid`,
    first_name: "Deleted",
    last_name: "User",
    full_name: "Deleted User",
    phone: null,
    profile_image_url: null,
    push_token: null,
    deleted_at: now,
    updated_at: now,
  });

  return { success: true, clerkId };
};
