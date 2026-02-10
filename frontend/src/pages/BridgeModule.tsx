import { useEffect, useState } from "react";
import {
  getStates,
  getDistricts,
  getDistrictDetails,
} from "../api/locationApi";

interface StateType {
  id: number;
  name: string;
}

interface DistrictType {
  id: number;
  name: string;
}

type StructureType = "Highway" | "Other" | "";

type LocationMode = "location" | "custom" | null;

type FootpathType = "none" | "single" | "double";

type MaterialGrade = "E250" | "E350" | "E450";

type ConcreteGrade =
  | "M25"
  | "M30"
  | "M35"
  | "M40"
  | "M45"
  | "M50"
  | "M55"
  | "M60";

type ActiveFocus =
  | "typeOfStructure"
  | "location"
  | "geometry"
  | "materials"
  | "additionalGeometry"
  | null;

const validateSpan = (span: number | ""): string => {
  if (span === "") return "";
  if (span < 20 || span > 45) {
    return "Span must be between 20 m and 45 m";
  }
  return "";
};

const validateCarriagewayWidth = (width: number | ""): string => {
  if (width === "") return "";
  if (width < 4.25) {
    return "Carriageway width must be at least 4.25 m";
  }
  return "";
};

const validateSkewAngle = (
  skewAngle: number | "",
): { error: string; warning: string } => {
  if (skewAngle === "") return { error: "", warning: "" };
  const abs = Math.abs(skewAngle);
  if (Number.isNaN(abs)) {
    return { error: "Skew angle must be a valid number", warning: "" };
  }

  if (abs <= 15) {
    return { error: "", warning: "" };
  }

  return {
    error: "",
    warning: "Detailed analysis required as per IRC",
  };
};

const Warning = ({ text }: { text: string }) => (
  <div
    style={{
      marginTop: 8,
      display: "flex",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fff8e1",
      color: "#8a6d00",
      padding: "8px 10px",
      borderRadius: 4,
      fontSize: 13,
    }}
  >
    ⚠️ {text}
  </div>
);

const BridgeModule = () => {
  const [activeTab, setActiveTab] = useState<"basic" | "additional">("basic");
  const [activeFocus, setActiveFocus] = useState<ActiveFocus>(null);

  // Type of Structure
  const [structureType, setStructureType] = useState<StructureType>("");

  // Location Data
  const [locationMode, setLocationMode] = useState<LocationMode>(null);
  const [states, setStates] = useState<StateType[]>([]);
  const [districts, setDistricts] = useState<DistrictType[]>([]);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

  // Modal control
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Auto parameters
  const [windSpeed, setWindSpeed] = useState<number | null>(null);
  const [seismicZone, setSeismicZone] = useState<string>("");
  const [minTemp, setMinTemp] = useState<number | null>(null);
  const [maxTemp, setMaxTemp] = useState<number | null>(null);
  const [manualParams, setManualParams] = useState<{
    windSpeed: number | null;
    seismicZone: string;
    minTemp: number | null;
    maxTemp: number | null;
  }>({
    windSpeed: null,
    seismicZone: "",
    minTemp: null,
    maxTemp: null,
  });
  const [closestLocation, setClosestLocation] = useState<{
    state: string;
    district: string;
    confidence: number;
  } | null>(null);

  // Geometry modal inputs (Modify Additional Geometry - pre‑existing logic)
  type Geometry = {
    spacing: number;
    girders: number;
    overhang: number;
  };
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [geometryError, setGeometryError] = useState<string>("");

  // Geometric Details (main left-panel section)
  const [span, setSpan] = useState<number | "">("");
  const [carriagewayWidth, setCarriagewayWidth] = useState<number | "">("");
  const [footpath, setFootpath] = useState<FootpathType>("none");
  const [skewAngle, setSkewAngle] = useState<number | "">("");
  const [spanError, setSpanError] = useState<string>("");
  const [carriagewayError, setCarriagewayError] = useState<string>("");
  const [skewError, setSkewError] = useState<string>("");
  const [skewWarning, setSkewWarning] = useState<string>("");

  // Material Inputs
  const [girderMaterial, setGirderMaterial] = useState<MaterialGrade>("E250");
  const [crossBracingMaterial, setCrossBracingMaterial] =
    useState<MaterialGrade>("E250");
  const [deckConcreteGrade, setDeckConcreteGrade] =
    useState<ConcreteGrade>("M25");

  const hasBlockingErrors =
    !!spanError ||
    !!carriagewayError ||
    !!skewError ||
    structureType === "Other";

  // Load states
  useEffect(() => {
    getStates().then(setStates);
  }, []);

  // Handle state change
  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateId = Number(e.target.value);
    setSelectedState(stateId);
    setSelectedDistrict(null);

    setWindSpeed(null);
    setSeismicZone("");
    setMinTemp(null);
    setMaxTemp(null);

    const districtsData = await getDistricts(stateId);
    setDistricts(districtsData);
  };
  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    padding: "12px 40px 12px 12px", // space for arrow
    borderRadius: 6,
    border: "1px solid #cfd8dc",
    fontSize: 15,
    color: "#0b5cff",
    backgroundColor: "#fff",
    appearance: "none",
    cursor: structureType === "Other" ? "not-allowed" : "pointer",
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%230b5cff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  };

  //common styles
  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    padding: "12px 12px 12px 12px",
    borderRadius: 6,
    border: "1px solid #cfd8dc",
    fontSize: 15,
    boxSizing: "border-box",
    cursor: structureType === "Other" ? "not-allowed" : "pointer",
    lineHeight: "24px",
    appearance: "textfield",
  };

  const modalInputStyle: React.CSSProperties = {
    width: "100%",
    height: 48,
    padding: "12px 14px",
    borderRadius: 6,
    border: "1px solid #cfd8dc",
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#fff",
  };

  // Handle district change
  const handleDistrictChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const districtId = Number(e.target.value);
    setSelectedDistrict(districtId);

    const details = await getDistrictDetails(districtId);
    setWindSpeed(details.wind.wind_speed);
    setSeismicZone(details.seismic.seismic_zone);
    setMinTemp(details.temperature.min_temp);
    setMaxTemp(details.temperature.max_temp);
  };

  const openGeometryModal = () => {
    if (typeof carriagewayWidth !== "number") {
      alert("Please enter Carriageway Width before modifying geometry");
      return;
    }

    const overallWidth = carriagewayWidth + 5;

    const spacing = 2.5;
    const girders = Math.floor((overallWidth - 2) / spacing);
    const overhang = Number((overallWidth - girders * spacing).toFixed(1));

    setGeometry({ spacing, girders, overhang });
    setGeometryError("");
    setShowModal(true);
  };

  const updateFromSpacing = (spacing: number) => {
    if (!geometry || typeof carriagewayWidth !== "number") return;

    const overallWidth = carriagewayWidth + 5;
    if (spacing <= 0 || spacing >= overallWidth) {
      setGeometryError("Invalid spacing");
      return;
    }

    const girders = Math.round((overallWidth - geometry.overhang) / spacing);
    const overhang = Number((overallWidth - girders * spacing).toFixed(1));

    if (overhang < 0) {
      setGeometryError("Geometry constraints violated");
      return;
    }

    setGeometry({ spacing, girders, overhang });
    setGeometryError("");
  };

  const updateFromGirders = (girders: number) => {
    if (!geometry || typeof carriagewayWidth !== "number") return;

    const overallWidth = carriagewayWidth + 5;
    if (girders <= 0) {
      setGeometryError("Number of girders must be positive");
      return;
    }

    const overhang = Number(
      (overallWidth - geometry.spacing * girders).toFixed(1),
    );

    if (overhang < 0 || overhang >= overallWidth) {
      setGeometryError("Geometry constraints violated");
      return;
    }

    setGeometry({ spacing: geometry.spacing, girders, overhang });
    setGeometryError("");
  };

  const updateFromOverhang = (overhang: number) => {
    if (!geometry || typeof carriagewayWidth !== "number") return;

    const overallWidth = carriagewayWidth + 5;
    if (overhang < 0 || overhang >= overallWidth) {
      setGeometryError("Invalid overhang");
      return;
    }

    const spacing = Number(
      ((overallWidth - overhang) / geometry.girders).toFixed(1),
    );

    if (spacing <= 0) {
      setGeometryError("Geometry constraints violated");
      return;
    }

    setGeometry({ spacing, girders: geometry.girders, overhang });
    setGeometryError("");
  };

  // Geometric details field-level validation handlers
  const handleSpanBlur = () => {
    setSpanError(validateSpan(span));
  };

  const fieldBlockStyle: React.CSSProperties = {
    marginBottom: 24,
  };

  const handleCarriagewayBlur = () => {
    setCarriagewayError(validateCarriagewayWidth(carriagewayWidth));
  };

  const handleSkewBlur = () => {
    const { error, warning } = validateSkewAngle(skewAngle);
    setSkewError(error);
    setSkewWarning(warning);
  };

  const runBackendValidation = async () => {
    //for future updatse
  };

  //closest location
  const fetchClosestLocation = async () => {
    if (!manualParams) return;

    const res = await fetch("http://localhost:8000/api/closest/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wind_speed: manualParams.windSpeed,
        seismic_zone: manualParams.seismicZone,
        min_temp: manualParams.minTemp,
        max_temp: manualParams.maxTemp,
      }),
    });

    const data = await res.json();
    setClosestLocation(data);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Tabs Section*/}
      <div style={{ display: "flex", borderBottom: "2px solid #444" }}>
        <button
          onClick={() => setActiveTab("basic")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "basic" ? "3px solid #007bff" : "none",
            color: "black",
            cursor: "pointer",
          }}
        >
          Basic Inputs
        </button>

        <button
          onClick={() => setActiveTab("additional")}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "none",
            borderBottom:
              activeTab === "additional" ? "3px solid #007bff" : "none",
            color: "black",
            cursor: "pointer",
          }}
        >
          Additional Inputs
        </button>

        
          <h3
            style={{
             marginLeft:"450px",

              border: "none",
              background: "none",
            }}
          >
            Group Design
          </h3>
        
      </div>

      {/* Main */}
      {activeTab === "basic" ? (
        <div
          style={{
            display: "flex",
            flex: 1,
            width: "100%",
            minHeight: "calc(100vh - 50px)",
          }}
        >
          {/* LEFT PANEL - 30% */}
          <div
            style={{
              width: "30%",
              minWidth: "30%",
              padding: "20px",
              borderRight: "1px solid #333",
              boxSizing: "border-box",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <h2>Bridge Module – Basic Inputs</h2>

            {/*Type of Structure */}
            <div
              onMouseEnter={() => setActiveFocus("typeOfStructure")}
              onMouseLeave={() => setActiveFocus(null)}
              style={{ maxWidth: 520 }}
            >
              {/* SECTION LABEL */}
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7a2ee6",
                  marginBottom: 6,
                  letterSpacing: "0.5px",
                }}
              >
                STRUCTURE TYPE
              </label>

              {/* DROPDOWN */}
              <select
                id="structureType"
                value={structureType}
                onChange={(e) =>
                  setStructureType(e.target.value as StructureType)
                }
                style={selectStyle}
              >
                <option value="">Select Structure Type</option>
                <option value="Highway">Highway</option>
                <option value="Other">Other</option>
              </select>

              {/* WARNING MESSAGE */}
              {structureType === "Other" && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#d32f2f", // RED warning
                  }}
                >
                  Other structures not included
                </p>
              )}
            </div>

            {/* Project Location Section*/}
            <div style={{ maxWidth: 520 }}>
              {/* PROJECT LOCATION */}
              <h3
                style={{
                  opacity: structureType === "Other" ? 0.4 : 1,
                  color: "#7a2ee6",
                  fontWeight: 700,
                  fontSize: 20,
                  marginBottom: 16,
                }}
              >
                Project Location
              </h3>

              {/* CHECKBOXES */}
              <div
                style={{
                  opacity: structureType === "Other" ? 0.4 : 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  pointerEvents: structureType === "Other" ? "none" : "auto",
                  cursor: structureType === "Other" ? "not-allowed" : "default",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#ff8c00",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={locationMode === "location"}
                    onChange={() =>
                      setLocationMode(
                        locationMode === "location" ? null : "location",
                      )
                    }
                  />
                  Enter Location Name
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#ff8c00",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={locationMode === "custom"}
                    onChange={() => {
                      if (locationMode === "custom") {
                        setLocationMode(null);
                        setShowCustomModal(false);
                      } else {
                        setLocationMode("custom");
                        setShowCustomModal(true);
                      }
                    }}
                  />
                  Tabulate Custom Loading Parameters
                </label>
              </div>

              {/* STATE & DISTRICT */}
              {locationMode === "location" && (
                <>
                  <div style={{ marginTop: 24 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0b5cff",
                      }}
                    >
                      STATE
                    </label>
                    <select
                      value={selectedState ?? ""}
                      onChange={handleStateChange}
                      style={selectStyle}
                    >
                      <option value="">Select State</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0b5cff",
                      }}
                    >
                      DISTRICT
                    </label>
                    <select
                      value={selectedDistrict ?? ""}
                      onChange={handleDistrictChange}
                      disabled={!selectedState}
                      style={selectStyle}
                    >
                      <option value="">Select District</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* RESULTING PARAMS */}

              <>
                <h3
                  style={{
                    opacity: structureType === "Other" ? 0.4 : 1,
                    marginTop: 32,
                    color: "#7a2ee6",
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  Resulting Parameters
                </h3>

                {/* PARAMS TABLE */}
                <div
                  style={{
                    opacity: structureType === "Other" ? 0.4 : 1,
                    marginTop: 12,
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: "14px 18px",
                  }}
                >
                  {[
                    [
                      "Wind Speed",
                      locationMode === "location" && selectedDistrict
                        ? `${windSpeed ?? "--"} km/h`
                        : locationMode === "custom"
                          ? `${manualParams.windSpeed ?? "--"} km/h`
                          : "--",
                    ],
                    [
                      "Seismic Zone",
                      locationMode === "location" && selectedDistrict
                        ? seismicZone || "--"
                        : locationMode === "custom"
                          ? manualParams.seismicZone || "--"
                          : "--",
                    ],
                    [
                      "Temperature (Min/Max)",
                      locationMode === "location" && selectedDistrict
                        ? `${minTemp ?? "--"}°C / ${maxTemp ?? "--"}°C`
                        : locationMode === "custom"
                          ? `${manualParams.minTemp ?? "--"}°C / ${manualParams.maxTemp ?? "--"}°C`
                          : "--",
                    ],
                  ].map(([label, value], i) => (
                    <div key={i}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "12px 0",
                          fontWeight: 500,
                        }}
                      >
                        <span>{label}:</span>
                        <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                          {value}
                        </span>
                      </div>
                      {i < 2 && (
                        <hr
                          style={{
                            border: "none",
                            borderTop: "1px solid #e0e0e0",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/*CLOSEST LOCATION SECTION */}
                {locationMode === "custom" && closestLocation && (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px 14px",
                      borderRadius: 6,
                      backgroundColor: "#f0f7ff",
                      borderLeft: "4px solid #0b5cff",
                      fontSize: 14,
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      <strong>Closest Matching Location:</strong>{" "}
                      {closestLocation.district}, {closestLocation.state}
                    </div>
                    <div>
                      <strong>Match Confidence:</strong>{" "}
                      {closestLocation.confidence}%
                    </div>
                  </div>
                )}
              </>
            </div>

            {/* 3. Geometric Details */}
            <div
              onMouseEnter={() => setActiveFocus("geometry")}
              onMouseLeave={() => setActiveFocus(null)}
              style={{
                opacity: structureType === "Other" ? 0.4 : 1,
                maxWidth: 520,
              }}
            >
              {/* SECTION TITLE */}
              <h3
                style={{
                  color: "#7a2ee6",
                  fontWeight: 700,
                  fontSize: 20,
                  marginBottom: 20,
                }}
              >
                Geometric Details
              </h3>

              {/* SPAN */}
              <div style={fieldBlockStyle}>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: "#0b5cff" }}
                >
                  SPAN (M)
                </div>
                <div
                  style={{ fontSize: 12, color: "#616161", marginBottom: 6 }}
                >
                  Valid range: 20 m – 45 m
                </div>
                <input
                  type="number"
                  placeholder="Enter span length"
                  value={span}
                  onChange={(e) =>
                    setSpan(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  onBlur={handleSpanBlur}
                  disabled={structureType === "Other"}
                  style={inputStyle}
                />
                {spanError && <Warning text={spanError} />}
              </div>

              {/* CARRIAGEWAY */}
              <div style={fieldBlockStyle}>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: "#0b5cff" }}
                >
                  CARRIAGEWAY WIDTH (M)
                </div>
                <div
                  style={{ fontSize: 12, color: "#616161", marginBottom: 6 }}
                >
                  Must be ≥ 4.25 m and &lt; 24 m
                </div>
                <input
                  type="number"
                  placeholder="Enter width"
                  value={carriagewayWidth}
                  onChange={(e) =>
                    setCarriagewayWidth(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  onBlur={handleCarriagewayBlur}
                  disabled={structureType === "Other"}
                  style={inputStyle}
                />
                {carriagewayError && <Warning text={carriagewayError} />}
              </div>

              {/* FOOTPATH */}
              <div style={fieldBlockStyle}>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: "#0b5cff" }}
                >
                  FOOTPATH DESIGN
                </div>
                <div
                  style={{ fontSize: 12, color: "#616161", marginBottom: 6 }}
                >
                  Options: Single-sided / Both / None
                </div>
                <select
                  value={footpath}
                  onChange={(e) => setFootpath(e.target.value as FootpathType)}
                  disabled={structureType === "Other"}
                  style={selectStyle}
                >
                  <option value="">Select footpath design</option>
                  <option value="single">Single-sided</option>
                  <option value="double">Both sides</option>
                  <option value="none">None</option>
                </select>
              </div>

              {/* SKEW */}
              <div style={fieldBlockStyle}>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: "#0b5cff" }}
                >
                  SKEW ANGLE (DEGREES)
                </div>
                <div
                  style={{ fontSize: 12, color: "#616161", marginBottom: 6 }}
                >
                  Preferred range: ±15°
                </div>
                <input
                  type="number"
                  placeholder="Enter skew angle"
                  value={skewAngle}
                  onChange={(e) =>
                    setSkewAngle(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  onBlur={handleSkewBlur}
                  disabled={structureType === "Other"}
                  style={inputStyle}
                />
                {skewWarning && <Warning text={skewWarning} />}
              </div>
            </div>

            {/*Modify Additional Geometry */}
            <div
              onMouseEnter={() => setActiveFocus("additionalGeometry")}
              onMouseLeave={() => setActiveFocus(null)}
              style={{
                marginTop: 24,
                opacity: structureType === "Other" ? 0.4 : 1,
              }}
            >
              <button
                onClick={openGeometryModal}
                disabled={structureType === "Other"}
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#ffd200",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: 16,
                  border: "none",
                  borderRadius: 6,
                  cursor: structureType === "Other" ? "not-allowed" : "pointer",
                }}
              >
                Modify Additional Geometry
              </button>
            </div>

            {/*Material Inputs */}
            <div
              onMouseEnter={() => setActiveFocus("materials")}
              onMouseLeave={() => setActiveFocus(null)}
              style={{
                opacity: structureType === "Other" ? 0.4 : 1,
                marginTop: 24,
                maxWidth: 520,
              }}
            >
              <h3
                style={{
                  color: "#7a2ee6",
                  fontWeight: 700,
                  fontSize: 20,
                  marginBottom: 20,
                }}
              >
                Material Inputs
              </h3>

              {/* GIRDER MATERIAL */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0b5cff",
                    marginBottom: 6,
                  }}
                >
                  GIRDER MATERIAL
                </label>

                <select
                  value={girderMaterial}
                  disabled={structureType === "Other"}
                  onChange={(e) =>
                    setGirderMaterial(e.target.value as MaterialGrade)
                  }
                  style={{
                    ...selectStyle,
                    borderColor: "#0b5cff", // active look like image
                    cursor:
                      structureType === "Other" ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Select girder material</option>
                  <option value="E250">E250</option>
                  <option value="E350">E350</option>
                  <option value="E450">E450</option>
                </select>
              </div>

              {/* CROSS BRACING MATERIAL */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0b5cff",
                    marginBottom: 6,
                  }}
                >
                  CROSS BRACING MATERIAL
                </label>

                <select
                  value={crossBracingMaterial}
                  disabled={structureType === "Other"}
                  onChange={(e) =>
                    setCrossBracingMaterial(e.target.value as MaterialGrade)
                  }
                  style={selectStyle}
                >
                  <option value="">Select bracing material</option>
                  <option value="E250">E250</option>
                  <option value="E350">E350</option>
                  <option value="E450">E450</option>
                </select>
              </div>

              {/* DECK CONCRETE GRADE */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0b5cff",
                    marginBottom: 6,
                  }}
                >
                  DECK CONCRETE GRADE
                </label>

                <select
                  value={deckConcreteGrade}
                  disabled={structureType === "Other"}
                  onChange={(e) =>
                    setDeckConcreteGrade(e.target.value as ConcreteGrade)
                  }
                  style={selectStyle}
                >
                  <option value="">Select concrete grade</option>
                  <option value="M25">M25</option>
                  <option value="M30">M30</option>
                  <option value="M35">M35</option>
                  <option value="M40">M40</option>
                  <option value="M45">M45</option>
                  <option value="M50">M50</option>
                  <option value="M55">M55</option>
                  <option value="M60">M60</option>
                </select>
              </div>

              {/* VALIDATE BUTTON */}
              <button
                onClick={runBackendValidation}
                disabled={hasBlockingErrors}
                style={{
                  width: "100%",
                  marginTop: 24,
                  padding: "16px",
                  backgroundColor: hasBlockingErrors ? "#9bbcf3" : "#0b5cff",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 6,
                  cursor: hasBlockingErrors ? "not-allowed" : "pointer",
                }}
              >
                Validate &amp; Proceed
              </button>

              {/* INFO NOTE */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  backgroundColor: "#f7f0ff",
                  padding: "12px 14px",
                  borderRadius: 6,
                  borderLeft: "4px solid #7a2ee6",
                  fontSize: 14,
                  color: "#7a2ee6",
                }}
              >
                <span style={{ fontWeight: 700 }}>ℹ</span>
                <span>
                  Note: All required fields must be completed before proceeding
                  to the next step
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - 60% */}
          <div
            style={{
              width: "70%",
              minWidth: "60%",
              padding: "20px",
              boxSizing: "border-box",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <h3>Reference Image</h3>

            <div
              className="osdag-right-panel"
              style={{ height: "100%", position: "relative" }}
            >
              {activeFocus && (
                <div
                  style={{
                    marginTop: 1,
                    padding: "12px 14px",
                    borderRadius: 6,
                    backgroundColor: "#f7f0ff",
                    borderLeft: "4px solid #7a2ee6",
                    fontSize: 14,
                    position: "absolute",
                    zIndex: 1,
                    color: "#4a148c",
                    minHeight: 48,
                  }}
                >
                  {activeFocus === "typeOfStructure" &&
                    "The structure type determines which bridge configurations and checks are applicable in this module."}

                  {activeFocus === "location" &&
                    "Project location governs wind speed, seismic zone, and temperature values as per applicable Indian standards."}

                  {activeFocus === "geometry" &&
                    "Geometric inputs define span length, carriageway width, footpath arrangement, and skew angle of the bridge deck."}

                  {activeFocus === "additionalGeometry" &&
                    "Additional geometry allows fine control of girder spacing, overhang width, and number of girders used in design."}

                  {activeFocus === "materials" &&
                    "Material inputs specify steel grades for girders and bracing, and concrete grade for the deck slab."}
                </div>
              )}
              <img
                src="/images/osdag-bridge-layout.png"
                alt="Osdag Bridge Layout"
                style={{
                  width: "100%",
                  height: "calc(100% - 60px)",
                  objectFit: "contain",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  display: "block",
                  position: "relative",
                  zIndex: -1,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: "20px" }}>
          <h2>Additional Inputs</h2>
          <p style={{ color: "#777" }}>
            Placeholder section as per Osdag screening task requirements.
          </p>
        </div>
      )}

      {/* Geometry Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 520,
              borderRadius: 12,
              backgroundColor: "#FFD200",
              padding: 24,
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            {/* HEADER */}
            <h2 style={{ margin: 0, fontWeight: 800 }}>
              Modify Additional Geometry
            </h2>

            {/* COMPUTED GIRDERS */}
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                COMPUTED NUMBER OF GIRDERS
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 6,
                  padding: "14px 16px",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1b7f1b",
                  border: "1px solid #ddd",
                }}
              >
                {geometry?.girders ?? "--"}
              </div>
            </div>

            {/* INPUTS */}
            <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Deck Overhang Width (m)"
                value={geometry?.overhang ?? ""}
                onChange={(e) => updateFromOverhang(Number(e.target.value))}
                style={modalInputStyle}
              />

              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="Girder Spacing (m)"
                value={geometry?.spacing ?? ""}
                onChange={(e) => updateFromSpacing(Number(e.target.value))}
                style={modalInputStyle}
              />

              <input
                type="number"
                inputMode="numeric"
                placeholder="Number of Girders"
                value={geometry?.girders ?? ""}
                onChange={(e) => updateFromGirders(Number(e.target.value))}
                style={modalInputStyle}
              />
            </div>

            {/* ERROR BOX */}
            {geometryError && (
              <div
                style={{
                  marginTop: 18,
                  background: "#FFF5F5",
                  color: "#D32F2F",
                  padding: "12px 14px",
                  borderRadius: 6,
                  borderLeft: "5px solid #D32F2F",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                ✖ {geometryError}
              </div>
            )}

            {/* FOOTER */}
            <div
              style={{
                marginTop: 28,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "#E0E0E0",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                disabled={!!geometryError}
                onClick={() => setShowModal(false)}
                style={{
                  background: geometryError ? "#9bbcf3" : "#000000",
                  color: "#fff",
                  border: "none",
                  padding: "12px 32px",
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: geometryError ? "not-allowed" : "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Loading Parameters Modal */}
      {showCustomModal && locationMode === "custom" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 600,
              background: "#ffd200",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h2>Custom Loading Parameters</h2>

            <table style={{ width: "100%", marginTop: 16 }}>
              <tbody>
                <tr>
                  <td>Wind Speed (km/h)</td>
                  <td>
                    <input
                      type="number"
                      style={inputStyle}
                      onChange={(e) =>
                        setManualParams((p) => ({
                          ...p,
                          windSpeed: Number(e.target.value),
                        }))
                      }
                    />
                  </td>
                </tr>

                <tr>
                  <td>Seismic Zone</td>
                  <td>
                    <select
                      value={manualParams.seismicZone}
                      onChange={(e) =>
                        setManualParams((p) => ({
                          ...p,
                          seismicZone: e.target.value,
                        }))
                      }
                      style={selectStyle}
                    >
                      <option value="">Select Seismic Zone</option>
                      <option value="I">Zone I</option>
                      <option value="II">Zone II</option>
                      <option value="III">Zone III</option>
                      <option value="IV">Zone IV</option>
                      <option value="V">Zone V</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td>Min Temp (°C)</td>
                  <td>
                    <input
                      type="number"
                      style={inputStyle}
                      onChange={(e) =>
                        setManualParams((p) => ({
                          ...p,
                          minTemp: Number(e.target.value),
                        }))
                      }
                    />
                  </td>
                </tr>

                <tr>
                  <td>Max Temp (°C)</td>
                  <td>
                    <input
                      type="number"
                      style={inputStyle}
                      onChange={(e) =>
                        setManualParams((p) => ({
                          ...p,
                          maxTemp: Number(e.target.value),
                        }))
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button
                style={{ color: "white" }}
                onClick={() => setShowCustomModal(false)}
              >
                Cancel
              </button>
              <button
                style={{ marginLeft: 12, color: "white" }}
                onClick={async () => {
                  setShowCustomModal(false);
                  await fetchClosestLocation();
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BridgeModule;
