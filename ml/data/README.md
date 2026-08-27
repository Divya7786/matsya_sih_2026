# ORCA PFZ ML - Data Sources

## Primary Datasets

### 1. NOAA OISST v2.1 (Sea Surface Temperature)
- **Official source**: https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/v2.1/access/avhrr/
- **Resolution**: 0.25 deg (~28km), daily, global
- **Format**: NetCDF
- **File pattern**: `oisst-avhrr-v02r01.YYYYMMDD.nc`
- **Authentication**: None required (open access)
- **Training period**: 2020-01-01 to 2024-12-31
- **Variables used**: sst (sea surface temperature in deg C)

### 2. NASA MODIS-Aqua Level-3 Chlorophyll-a
- **Official source**: https://oceandata.sci.gsfc.nasa.gov/
- **Resolution**: 4km, 8-day composite, global
- **Format**: NetCDF
- **Authentication**: NASA Earthdata login required (free: https://urs.earthdata.nasa.gov/)
- **Training period**: 2020-01-01 to 2024-12-31
- **Variables used**: chlor_a (chlorophyll-a concentration in mg/m3)

### 3. Bathymetry (ETOPO1 or GEBCO)
- **Purpose**: Depth masking for continental shelf (20-200m)
- **One-time download**

## Geographic Scope
- Indian coastal waters: Latitude 7N to 23N, Longitude 66E to 95E
- Covers: Bay of Bengal, Arabian Sea, Andaman Sea

## Data Integrity Rules
- Raw data in `raw/` directory is NEVER modified
- All processing outputs go to `processed/`
- Every download is logged with date and source URL
- No synthetic/fabricated data permitted

## Download Log
| Date | Dataset | Files | Status |
|------|---------|-------|--------|
| (pending) | NOAA OISST | - | Not started |
| (pending) | NASA MODIS Chl-a | - | Not started |
