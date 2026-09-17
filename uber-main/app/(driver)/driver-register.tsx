import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, type Href } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";

import {
  ImageUploadBox,
  WizardInput,
  WizardBottomBar,
  DobInput,
  ValidationMessage,
} from "@/components/driver/DriverFormComponents";
import { useAuth } from "@/context/AuthContext";
import { supabase, uploadImageToSupabase } from "@/lib/supabase";
import { startVeriffVerification } from "@/lib/veriff";

const FORM_CACHE_KEY = "@driver_registration_form";

export default function DriverRegisterScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Step 1: Personal
  const [firstName, setFirstName] = useState(
    user?.user_metadata?.first_name || "",
  );
  const [surname, setSurname] = useState(user?.user_metadata?.last_name || "");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Step 2: License
  const [licensePic, setLicensePic] = useState<string | null>(null);
  const [licenseBackPic, setLicenseBackPic] = useState<string | null>(null);
  const [backgroundPic, setBackgroundPic] = useState<string | null>(null);
  const [licenseExp, setLicenseExp] = useState("");
  const [licenseNum, setLicenseNum] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Step 3: Vehicle
  const [vehiclePic, setVehiclePic] = useState<string | null>(null);
  const [vehicleLicensePic, setVehicleLicensePic] = useState<string | null>(
    null,
  );
  const [liabilityPic, setLiabilityPic] = useState<string | null>(null);
  const [permitPic, setPermitPic] = useState<string | null>(null);
  const [operatorPic, setOperatorPic] = useState<string | null>(null);
  const [certPic, setCertPic] = useState<string | null>(null);
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  // Step 4: Final Info
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [payshapNumber, setPayshapNumber] = useState("");

  useEffect(() => {
    // Load cached form
    const loadCachedForm = async () => {
      try {
        const cachedStr = await AsyncStorage.getItem(FORM_CACHE_KEY);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached.firstName) setFirstName(cached.firstName);
          if (cached.surname) setSurname(cached.surname);
          if (cached.dob) setDob(cached.dob);
          if (cached.address) setAddress(cached.address);
          if (cached.licenseExp) setLicenseExp(cached.licenseExp);
          if (cached.licenseNum) setLicenseNum(cached.licenseNum);
          if (cached.idNumber) setIdNumber(cached.idNumber);
          if (cached.vehicleBrand) setVehicleBrand(cached.vehicleBrand);
          if (cached.vehicleModel) setVehicleModel(cached.vehicleModel);
          if (cached.vehicleColor) setVehicleColor(cached.vehicleColor);
          if (cached.vehicleYear) setVehicleYear(cached.vehicleYear);
          if (cached.licensePlate) setLicensePlate(cached.licensePlate);
          if (cached.phoneNumber) setPhoneNumber(cached.phoneNumber);
          if (cached.bankName) setBankName(cached.bankName);
          if (cached.accountNumber) setAccountNumber(cached.accountNumber);
          if (cached.branchCode) setBranchCode(cached.branchCode);
          if (cached.payshapNumber) setPayshapNumber(cached.payshapNumber);
        }
      } catch (e) {
        console.error("Failed to load form cache", e);
      }
    };
    loadCachedForm();
  }, []);

  // Save form on change
  useEffect(() => {
    const saveCache = async () => {
      try {
        const formState = {
          firstName,
          surname,
          dob,
          address,
          licenseExp,
          licenseNum,
          idNumber,
          vehicleBrand,
          vehicleModel,
          vehicleColor,
          vehicleYear,
          licensePlate,
          phoneNumber,
          bankName,
          accountNumber,
          branchCode,
          payshapNumber,
        };
        await AsyncStorage.setItem(FORM_CACHE_KEY, JSON.stringify(formState));
      } catch (e) {
        // ignore
      }
    };
    saveCache();
  }, [
    firstName,
    surname,
    dob,
    address,
    licenseExp,
    licenseNum,
    idNumber,
    vehicleBrand,
    vehicleModel,
    vehicleColor,
    vehicleYear,
    licensePlate,
    phoneNumber,
    bankName,
    accountNumber,
    branchCode,
    payshapNumber,
  ]);

  const validateStep1 = () => {
    if (!profilePic) return "Profile picture is required.";
    if (!firstName.trim() || !surname.trim())
      return "Name and surname are required.";

    // Validate DOB (18+ check)
    if (dob.length !== 10) return "Date of birth must be DD-MM-YYYY format.";
    const [d, m, y] = dob.split("-");
    const dobDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (isNaN(dobDate.getTime())) return "Invalid date of birth.";

    const ageDiffMs = Date.now() - dobDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18)
      return "You must be at least 18 years old to register as a driver.";

    if (!address.trim()) return "Official home address is required.";
    return null;
  };

  const validateStep2 = () => {
    if (!licensePic) return "Driver license picture is required.";
    if (licenseExp.length !== 5) return "Expiration date must be MM/YY format.";
    if (!licenseNum.trim()) return "License number is required.";

    // ID Number validation (SA format - 13 digits)
    if (!idNumber.match(/^[0-9]{13}$/))
      return "ID number must be exactly 13 digits.";

    return null;
  };

  const validateStep3 = () => {
    if (!vehiclePic) return "Vehicle exterior picture is required.";
    if (!vehicleLicensePic) return "Vehicle license disc picture is required.";
    if (!vehicleBrand.trim() || !vehicleModel.trim() || !vehicleColor.trim())
      return "Vehicle make, model, and color are required.";
    if (vehicleYear.length !== 4)
      return "Year of manufacture must be 4 digits.";
    if (!licensePlate.trim()) return "License plate number is required.";
    return null;
  };

  const validateStep4 = () => {
    if (!phoneNumber.match(/^[0-9]{10}$/))
      return "Phone number must be 10 digits.";
    if (!bankName.trim() || !accountNumber.trim() || !branchCode.trim())
      return "Complete banking details are required.";
    return null;
  };

  const handleNext = () => {
    setErrorMsg("");

    let error = null;
    if (step === 1) error = validateStep1();
    if (step === 2) error = validateStep2();
    if (step === 3) error = validateStep3();
    if (step === 4) error = validateStep4();

    if (error) {
      setErrorMsg(error);
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Not logged in", "Please sign in first.");
      return;
    }

    setLoading(true);
    try {
      const { data: existingPlate } = await supabase
        .from("drivers")
        .select("id")
        .eq("vehicle_registration", licensePlate.toUpperCase())
        .neq("id", user.id)
        .maybeSingle();
      if (existingPlate) {
        throw new Error("This vehicle license plate is already registered.");
      }

      let uploadedVehiclePic = vehiclePic;
      let uploadedDriverLicensePic = licensePic;
      let uploadedLicenseBackPic = licenseBackPic;
      let uploadedBackgroundPic = backgroundPic;

      if (vehiclePic?.startsWith("file://")) {
        uploadedVehiclePic = await uploadImageToSupabase(
          vehiclePic,
          "driver-docs",
          `${user.id}/vehicle-${Date.now()}.jpg`,
        );
      }
      if (licensePic?.startsWith("file://")) {
        uploadedDriverLicensePic = await uploadImageToSupabase(
          licensePic,
          "driver-docs",
          `${user.id}/license-front-${Date.now()}.jpg`,
        );
      }
      if (licenseBackPic?.startsWith("file://")) {
        uploadedLicenseBackPic = await uploadImageToSupabase(
          licenseBackPic,
          "driver-docs",
          `${user.id}/license-back-${Date.now()}.jpg`,
        );
      }
      if (backgroundPic?.startsWith("file://")) {
        uploadedBackgroundPic = await uploadImageToSupabase(
          backgroundPic,
          "driver-docs",
          `${user.id}/background-${Date.now()}.jpg`,
        );
      }

      const { error: driverError } = await supabase.from("drivers").upsert(
        {
          id: user.id,
          license_number: licenseNum.trim(),
          vehicle_registration: licensePlate.toUpperCase(),
          vehicle_model: `${vehicleBrand} ${vehicleModel}`.trim(),
          vehicle_color: vehicleColor,
          vehicle_year: parseInt(vehicleYear, 10) || null,
          license_pic_url: uploadedDriverLicensePic || null,
          license_back_pic_url: uploadedLicenseBackPic || null,
          background_check_url: uploadedBackgroundPic || null,
          id_number: idNumber.trim(),
          license_expiry: licenseExp || null,
          verification_status: "pending",
          is_verified: false,
          vehicle_pic_url: uploadedVehiclePic || null,
          is_online: false,
          is_approved: false,
          account_status: "pending_approval",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (driverError) throw driverError;

      await supabase
        .from("users")
        .eq("id", user.id)
        .update({
          phone: phoneNumber,
          first_name: firstName,
          last_name: surname,
          role: "driver",
          updated_at: new Date().toISOString(),
        });

      if (bankName || accountNumber || payshapNumber.trim()) {
        await supabase.from("driver_payout_details").upsert(
          {
            driver_id: user.id,
            bank_name: bankName || null,
            account_name: `${firstName} ${surname}`.trim(),
            account_number: accountNumber || null,
            branch_code: branchCode || null,
            payshap_number: payshapNumber.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "driver_id" },
        );
      }

      await startVeriffVerification({
        driverId: user.id,
        firstName: firstName.trim(),
        lastName: surname.trim(),
        idNumber: idNumber.trim(),
        licenseNumber: licenseNum.trim(),
        licenseExpiry: licenseExp || undefined,
        licenseFrontUri: licensePic!,
        licenseBackUri: licenseBackPic || undefined,
      });

      await AsyncStorage.removeItem(FORM_CACHE_KEY);

      Alert.alert(
        "Application Submitted",
        "Your documents have been submitted. We are now verifying your driver licence — this usually takes a few minutes.",
        [
          {
            text: "View Progress",
            onPress: () =>
              router.replace("/(driver)/driver-verification" as Href),
          },
        ],
      );
    } catch (err: any) {
      console.error("[Driver Register] Error:", err);
      const message = err.message || "Please try again.";
      const friendly = message.includes("Verification service not configured")
        ? "Licence verification is temporarily unavailable. Please try again later."
        : message.includes("already in progress")
          ? "Verification is already in progress. Check your status on the verification screen."
          : message.includes("Failed to upload") ||
              message.includes("Missing required")
            ? "Licence photos could not be processed. Upload clearer front/back images and try again."
            : message.includes("Network") || message.includes("fetch")
              ? "Network error. Check your connection and try again."
              : message;
      Alert.alert("Registration Failed", friendly);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = (title: string) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
        <Ionicons name="close" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Help", "Contact VARLIFE support at support@varlife.com")
        }
      >
        <Text style={styles.helpText}>Help</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Personal information</Text>
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <ImageUploadBox
          label="Personal picture"
          imageUri={profilePic}
          onUpload={setProfilePic}
        />
      </View>
      <WizardInput
        placeholder="First name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <WizardInput
        placeholder="Surname"
        value={surname}
        onChangeText={setSurname}
        autoCapitalize="words"
      />
      <DobInput value={dob} onChangeText={setDob} />
      <WizardInput
        placeholder="Please enter your official home address..."
        value={address}
        onChangeText={setAddress}
        autoCapitalize="words"
      />
      <ValidationMessage message={errorMsg} />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Driver license</Text>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}
      >
        <ImageUploadBox
          label="Driver License (front)"
          imageUri={licensePic}
          onUpload={setLicensePic}
        />
        <ImageUploadBox
          label="Driver License (back)"
          imageUri={licenseBackPic}
          onUpload={setLicenseBackPic}
          optional
        />
        <ImageUploadBox
          label="Background/Criminal Record Check"
          imageUri={backgroundPic}
          onUpload={setBackgroundPic}
          optional
        />
      </View>
      <WizardInput
        placeholder="ID number (13 digits)"
        value={idNumber}
        onChangeText={setIdNumber}
        keyboardType="numeric"
        maxLength={13}
      />
      <WizardInput
        placeholder="License number"
        value={licenseNum}
        onChangeText={setLicenseNum}
      />
      <WizardInput
        placeholder="Expiration date (MM/YY)"
        value={licenseExp}
        onChangeText={(t) => {
          const cleaned = t.replace(/[^0-9]/g, "");
          let formatted = cleaned;
          if (cleaned.length > 2)
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
          setLicenseExp(formatted);
        }}
        keyboardType="numeric"
        maxLength={5}
      />
      <ValidationMessage message={errorMsg} />
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Vehicle details</Text>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}
      >
        <ImageUploadBox
          label="Vehicle picture"
          imageUri={vehiclePic}
          onUpload={setVehiclePic}
        />
        <ImageUploadBox
          label="Motor Vehicle licence"
          imageUri={vehicleLicensePic}
          onUpload={setVehicleLicensePic}
        />
        <ImageUploadBox
          label="Passenger Liability Insurance"
          imageUri={liabilityPic}
          onUpload={setLiabilityPic}
          optional
        />
        <ImageUploadBox
          label="E-Hailing Operating Permit"
          imageUri={permitPic}
          onUpload={setPermitPic}
          optional
        />
        <ImageUploadBox
          label="Operator Card"
          imageUri={operatorPic}
          onUpload={setOperatorPic}
          optional
        />
        <ImageUploadBox
          label="Certificate of Registration"
          imageUri={certPic}
          onUpload={setCertPic}
          optional
        />
      </View>
      <WizardInput
        placeholder="Vehicle brand (e.g. Toyota)"
        value={vehicleBrand}
        onChangeText={setVehicleBrand}
      />
      <WizardInput
        placeholder="Vehicle model (e.g. Corolla)"
        value={vehicleModel}
        onChangeText={setVehicleModel}
      />
      <WizardInput
        placeholder="Vehicle color"
        value={vehicleColor}
        onChangeText={setVehicleColor}
      />
      <WizardInput
        placeholder="Year of Manufacture"
        value={vehicleYear}
        onChangeText={setVehicleYear}
        keyboardType="numeric"
        maxLength={4}
      />
      <WizardInput
        placeholder="License plate"
        value={licensePlate}
        onChangeText={setLicensePlate}
        autoCapitalize="characters"
      />
      <ValidationMessage message={errorMsg} />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Final verification</Text>

      <Text style={styles.subLabel}>Contact Info</Text>
      <WizardInput
        placeholder="Mobile number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        maxLength={10}
      />

      <Text style={styles.subLabel}>Banking Details</Text>
      <WizardInput
        placeholder="Bank Name"
        value={bankName}
        onChangeText={setBankName}
      />
      <WizardInput
        placeholder="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="numeric"
      />
      <WizardInput
        placeholder="Branch Code"
        value={branchCode}
        onChangeText={setBranchCode}
        keyboardType="numeric"
      />

      <Text style={styles.subLabel}>PayShap (Optional)</Text>
      <WizardInput
        placeholder="PayShap number (e.g. 0821234567)"
        value={payshapNumber}
        onChangeText={setPayshapNumber}
        keyboardType="phone-pad"
      />

      <ValidationMessage message={errorMsg} />

      <View style={styles.termsBox}>
        <Ionicons name="shield-checkmark" size={24} color="#1C6EF2" />
        <Text style={styles.termsText}>
          By submitting, you agree to VARLIFE's driver terms and consent to
          background checks as required by local regulations.
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {renderHeader("Registration")}

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        <View style={styles.footer}>
          <WizardBottomBar
            currentStep={step}
            totalSteps={totalSteps}
            onNext={handleNext}
            onBack={handleBack}
            nextLabel={step === totalSteps ? "Submit" : "Next >"}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121212" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  helpText: {
    fontSize: 16,
    color: "#1C6EF2",
    fontWeight: "600",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 24,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#AAA",
    marginTop: 8,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  termsBox: {
    flexDirection: "row",
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#333",
  },
  termsText: {
    flex: 1,
    marginLeft: 12,
    color: "#CCC",
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    backgroundColor: "#121212",
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
});
