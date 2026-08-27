# SAMUDRA AI — Official Data Sources

Researched and verified: 2026-08-27

---

## 1. Open-Meteo Marine API (PRIMARY — Live SST, Waves, Wind, Swell, Currents)

| Field | Value |
|-------|-------|
| URL | `https://marine-api.open-meteo.com/v1/marine` |
| Auth | None (free, public) |
| Data type | Real-time + 7-day forecast (WaveWatch III / ECMWF) |
| Variables | `wave_height`, `wave_direction`, `wave_period`, `wind_wave_height`, `wind_wave_period`, `swell_wave_height`, `swell_wave_period`, `swell_wave_direction`, `ocean_current_velocity`, `ocean_current_direction`, `sea_surface_temperature` |
| Coverage | Global ocean (Bay of Bengal, Arabian Sea included) |
| Resolution | ~5 km, hourly |
| Forecast | Up to 7 days |
| Format | JSON |
| Latest verified | 2026-08-27T18:00 |
| Sample | Chennai: SST 29.9°C, Wave 0.9m, Swell 0.64m, Current 0.6 km/h |

**Query format:**
```
GET https://marine-api.open-meteo.com/v1/marine
  ?latitude=13.08&longitude=80.27
  &current=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_period,swell_wave_height,swell_wave_period,swell_wave_direction,ocean_current_velocity,ocean_current_direction,sea_surface_temperature
  &hourly=wave_height,swell_wave_height,swell_wave_period,wind_wave_height,sea_surface_temperature,ocean_current_velocity
  &forecast_days=3
```

---

## 2. INCOIS ERDDAP — Oceansat-2 OCM Chlorophyll

| Field | Value |
|-------|-------|
| URL | `https://erddap.incois.gov.in/erddap/griddap/incois_oceansat2_datasets` |
| Dataset ID | `incois_oceansat2_datasets` |
| Auth | None (public ERDDAP) |
| Variables | `CHL` (chlorophyll-a, mg/m³), `KD490` (diffuse attenuation), `TSM` (suspended matter) |
| Coverage | 0.1°N–27.9°N, 46.7°E–99.3°E |
| Resolution | 0.04° (~4 km) |
| Time range | 2011-02-02 to 2020-05-01 |
| Format | JSON, CSV, NetCDF |
| Status | **HISTORICAL** — clearly labeled, not live |

**Query format:**
```
GET https://erddap.incois.gov.in/erddap/griddap/incois_oceansat2_datasets.json
  ?CHL[(last)][(12.9):(13.2)][(80.1):(80.5)]
```

**Limitation:** No free public real-time chlorophyll source for Indian waters. This is the best available from INCOIS.

---

## 3. INCOIS ERDDAP — Argo 10-Day Temperature/Salinity (Near-Real-Time)

| Field | Value |
|-------|-------|
| URL | `https://erddap.incois.gov.in/erddap/griddap/incois_argo_10d_VAM` |
| Dataset ID | `incois_argo_10d_VAM` |
| Auth | None (public) |
| Variables | `TEMP` (°C at depth levels), `SAL` (PSU) |
| Coverage | 29.5°S–29.5°N, 30.5°E–119.5°E |
| Resolution | 1° (coarse), 24 depth levels (5m–2000m) |
| Time range | 2004-01-10 to 2026-07-30 |
| Latest verified | 2026-07-30 (less than 1 month old) |
| Format | JSON via ERDDAP |
| Sample | Chennai at 5m depth: TEMP = 29.378°C |

**Query format:**
```
GET https://erddap.incois.gov.in/erddap/griddap/incois_argo_10d_VAM.json
  ?TEMP[(last)][(5.0)][(13.0):(13.5)][(80.0):(80.5)]
```

---

## 4. INCOIS ERDDAP — ASCAT Daily Wind (Supplementary)

| Field | Value |
|-------|-------|
| URL | `https://erddap.incois.gov.in/erddap/griddap/ascat_daily_datasets` |
| Dataset ID | `ascat_daily_datasets` |
| Auth | None (public) |
| Variables | `wind_speed` (m/s), `eastward_wind` (m/s), `northward_wind` (m/s) |
| Coverage | 29.9°S–29.9°N, 20.1°E–139.9°E |
| Resolution | 0.25° (~25 km) |
| Time range | 2007-03-21 to 2023-05-21 |
| Status | **HISTORICAL** — prefer Open-Meteo for live wind |

---

## 5. NCEI ERDDAP — OISST v2.1 (Near-Real-Time SST, PRIMARY)

| Field | Value |
|-------|-------|
| URL | `https://www.ncei.noaa.gov/erddap/griddap/ncdc_oisst_v2_avhrr_prelim_by_time_zlev_lat_lon` |
| Dataset ID (preliminary) | `ncdc_oisst_v2_avhrr_prelim_by_time_zlev_lat_lon` |
| Dataset ID (final) | `ncdc_oisst_v2_avhrr_by_time_zlev_lat_lon` |
| Auth | None (public) |
| Variables | `sst` (°C), `anom` (°C anomaly) |
| Coverage | Global (0.25° grid) |
| Time range | 2020-02 to 2026-08-25 (preliminary extends to yesterday) |
| Resolution | 0.25° daily |
| Latest verified | 2026-08-24: SST = 29.33–29.49°C (Chennai offshore) |
| Lag | 1-3 days |

**Query format:**
```
GET https://www.ncei.noaa.gov/erddap/griddap/ncdc_oisst_v2_avhrr_prelim_by_time_zlev_lat_lon.json
  ?sst[(last)][(0.0)][(13.0)][(80.25)]
```

---

## 6. PIFSC ERDDAP — ESA CCI Chlorophyll-a v6.0 (PRIMARY CHL)

| Field | Value |
|-------|-------|
| URL | `https://oceanwatch.pifsc.noaa.gov/erddap/griddap/esa-cci-chla-8d-v6-0` |
| Dataset ID | `esa-cci-chla-8d-v6-0` |
| Auth | None (public) |
| Variables | `chlor_a` (mg/m³) |
| Coverage | Global |
| Resolution | 0.042° (~4 km), 8-day composite |
| Time range | 1997-09 to 2026-06-26 |
| Latest verified | 2026-06-26 (2 months old, 8-day composites) |

**Query format:**
```
GET https://oceanwatch.pifsc.noaa.gov/erddap/griddap/esa-cci-chla-8d-v6-0.json
  ?chlor_a[(last)][(12.95):(13.15)][(80.2):(80.4)]
```

---

## DATA ARCHITECTURE

```
LIVE SST ──────────── NCEI ERDDAP OISST v2.1 (1-2 day lag, satellite-observed)
                      Fallback 1: Open-Meteo Marine `sea_surface_temperature` (model, hourly)
                      Fallback 2: INCOIS Argo 10d VAM (within ~1 month)

CHLOROPHYLL ───────── PIFSC ERDDAP ESA-CCI v6.0 (8-day composite, latest ~2 months)
                      Fallback: INCOIS Oceansat-2 ERDDAP (latest = 2020-05-01, HISTORICAL)

SST GRADIENT ─────── Computed: Open-Meteo SST at ±0.25° adjacent grid points
                      Formula: sqrt((dSST/dLat)² + (dSST/dLng)²)

WAVES/SWELL ──────── Open-Meteo Marine (live, hourly, 7-day forecast)

WIND ─────────────── Open-Meteo Marine wind_wave data (from WaveWatch model)

OCEAN CURRENT ────── Open-Meteo Marine `ocean_current_velocity/direction` (live)
```

---

## SOURCES NOT ACCESSIBLE

| Source | Issue |
|--------|-------|
| INCOIS Ocean State Forecast (osf.jsp) | HTTP 404, no machine-readable API |
| NOAA CoastWatch ERDDAP | Connection timeout from India |
| NASA Earthdata OPeNDAP | Requires authentication (HTTP 401) |
| Copernicus Marine | Old domains dead, new requires registration |
| NCMRWF | Requires registration |
| MOSDAC | Requires login for data download |

---

## ML MODEL INPUT PIPELINE

```
Open-Meteo SST (LIVE, today)
  +
INCOIS Chlorophyll (HISTORICAL, labeled)
  +
Computed SST gradient (from adjacent Open-Meteo points)
      ↓
  EXISTING RandomForest (ml-service/main.py)
      ↓
  PFZ probability + confidence
      ↓
  Ranked fishing zones with full provenance
```
