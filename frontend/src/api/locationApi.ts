const getDefaultBaseUrl = () => {
  const FALLBACK = "http://localhost:8000/api";

  if (typeof window === "undefined") {
    return FALLBACK;
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "localhost";
  return `${protocol}//${hostname}:8000/api`;
};

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, "");

const BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL ?? getDefaultBaseUrl()
);


export const getStates = async () => {
  const response = await fetch(`${BASE_URL}/states/`);
  return response.json();
};

export const getDistricts = async (stateId: number) => {
  const response = await fetch(`${BASE_URL}/districts/?state_id=${stateId}`);
  return response.json();
};

export const getDistrictDetails = async (districtId: number) => {
  const response = await fetch(`${BASE_URL}/districts/${districtId}/details/`);
  return response.json();
};
