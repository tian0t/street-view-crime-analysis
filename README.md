# Street View Crime Analysis

### London streetscapes, urban functions, and recorded crime

[![Live dashboard](https://img.shields.io/badge/Live%20Dashboard-4285F4?logo=googlechrome&logoColor=white)](https://tian0t.github.io/street-view-crime-analysis/dashboard/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Jupyter](https://img.shields.io/badge/Workflow-Jupyter-F37626?logo=jupyter&logoColor=white)](https://jupyter.org/)
[![Geospatial](https://img.shields.io/badge/Geospatial-GeoPandas%20%7C%20Shapely-139C5A)](https://geopandas.org/)
[![Computer vision](https://img.shields.io/badge/Computer%20Vision-PyTorch%20%7C%20Transformers-EE4C2C?logo=pytorch&logoColor=white)](https://huggingface.co/)
[![Dashboard](https://img.shields.io/badge/Frontend-Plotly%20%7C%20Leaflet-0D6EFD)](https://plotly.com/javascript/)

An urban data science project aims to examine how street environment indicators and image-derived urban features relate to crime records in Greater London.

**Quick links:** [Live dashboard](https://tian0t.github.io/street-view-crime-analysis/dashboard/) · [Data preparation notebook](./Part0_DataPrep_SVI.ipynb) · [Main analysis notebook](./Part1_Main_Analysis.ipynb) · [Practical briefing](./Practical%20Briefing.docx)

> The analysis is observational. The results describe associations in the available data and should not be interpreted as causal effects or policy predictions.

## At a glance

- **150,654** Mapillary images selected on a regular 50 m grid
- **150,653** images successfully processed by both computer-vision pipelines
- **150,182** image samples spatially matched to an LSOA boundary
- **3,525 / 4,988 LSOAs** with both environmental and crime data (**70.7%** of the crime-record base)
- **19** SegFormer environmental features and **10** image-derived urban-function classes
- Crime data covering **January 2019–June 2025**, annualized from 78 months of monthly incident counts

## What the project asks

1. Do recorded crime rates and crime composition vary across image-derived urban functions?
2. Which streetscape features show the strongest associations with different crime categories?
3. Do these associations vary between residential, commercial, transportation, education, industrial, and natural contexts?

## Dashboard

The [interactive dashboard](https://tian0t.github.io/street-view-crime-analysis/dashboard/) brings together:

- an LSOA-level spatial evidence map;
- functional-zone distributions and exploratory Kruskal–Wallis tests;
- crime profiles with means and interquartile ranges;
- Pearson and Spearman correlation views;
- annual and monthly crime-volume trends;
- feature-correlation diagnostics;
- an exploratory regression scenario simulator.

The dashboard uses annualized recorded incidents per 1,000 residents for spatial and zone comparisons. Rates are normalized with mean 2019–2022 population estimates; trend charts show raw recorded incident counts rather than population-standardized rates.

## Selected results

After filtering to functional categories with at least 40 LSOAs, the current dashboard reports the following mean total crime rates:

| Image-derived function | LSOAs | Mean annual rate per 1,000 |
|---|---:|---:|
| Commercial | 1,069 | 148.93 |
| Transportation | 461 | 89.22 |
| Industrial | 45 | 87.87 |
| Outdoors and natural | 401 | 83.41 |
| Education | 101 | 72.42 |
| Residential | 1,410 | 68.96 |

The dashboard also reports environmental associations using Pearson and Spearman correlations. These are exploratory, unadjusted comparisons across the available LSOA sample; p-values are not corrected for multiple comparisons.

## Method

```text
50 m London grid
        ↓
Mapillary image selection
        ↓
SegFormer-B0 → 19 pixel-level streetscape features
UrbanCLIP  → 10 image-derived urban-function scores
        ↓
Spatial join to LSOA boundaries
        ↓
LSOA-level feature aggregation
        ↓
MPS monthly crime counts + ONS population estimates
        ↓
Correlation, zone comparison, diagnostics, and dashboard
```

### Computer vision

- [SegFormer-B0 fine-tuned on Cityscapes](https://huggingface.co/nvidia/segformer-b0-finetuned-cityscapes-1024-1024) extracts pixel proportions for roads, buildings, vegetation, sky, vehicles, and other urban elements.
- [UrbanCLIP](https://github.com/siruzhong/WWW24-UrbanCLIP) is used with zero-shot urban-function prompts to classify image context. LSOA-level function is the modal image classification, not an official land-use label.

### Crime and population data

| Dataset | Role | Link |
|---|---|---|
| London LSOA boundaries | Spatial analysis unit | [London Datastore](https://data.london.gov.uk/dataset/statistical-gis-boundary-files-london/) |
| LSOA population estimates | Population denominator | [ONS](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/lowersuperoutputareamidyearpopulationestimates) |
| MPS recorded crime | Monthly LSOA-level crime counts | [London Datastore](https://data.london.gov.uk/dataset/recorded_crime_summary/) |
| Mapillary imagery | Street-level image source | [Mapillary](https://www.mapillary.com/?locale=en_US) |

## Repository structure

```text
.
├── dashboard/
│   ├── index.html              # Dashboard layout
│   ├── styles.css              # Visual system and responsive layout
│   ├── app.js                  # Charts, map, interactions, and simulator
│   ├── analysis_summary.js     # Dashboard analysis payload
│   └── map_payload.js          # Dashboard map payload
├── LSOA_data/                  # London LSOA boundary files
├── Processing data/            # Processed crime, imagery, and feature tables
├── Part0_DataPrep_SVI.ipynb    # Grid, imagery, SegFormer, and UrbanCLIP workflow
├── Part1_Main_Analysis.ipynb   # LSOA aggregation and statistical analysis
├── transit.ipynb               # Supplementary browser/PDF workflow
├── Practical Briefing.docx     # Written project briefing
├── environment.yml             # Conda environment specification
└── README.md
```

Raw Mapillary images and some large intermediate artifacts are not included in the repository because of size and licensing constraints. The notebooks document the collection and processing workflow.

## Getting started

### Open the dashboard locally

```bash
git clone https://github.com/tian0t/street-view-crime-analysis.git
cd street-view-crime-analysis/dashboard
python3 -m http.server 8000
```

Open <http://localhost:8000> in a browser.

### Reproduce the analysis workflow

1. Create the Conda environment from [`environment.yml`](./environment.yml).
2. Run [`Part0_DataPrep_SVI.ipynb`](./Part0_DataPrep_SVI.ipynb) for grid creation, Mapillary retrieval, segmentation, and urban-function inference.
3. Run [`Part1_Main_Analysis.ipynb`](./Part1_Main_Analysis.ipynb) for spatial joining, LSOA aggregation, crime-rate preparation, correlations, and visual analysis.
4. A Mapillary API token is required for fresh image retrieval. Do not commit tokens or private image archives.

> The published dashboard payload uses the raw monthly MPS incident files to calculate the current annualized rates. The notebook-exported crime-rate CSVs are retained as workflow artifacts and may not reproduce the dashboard figures exactly.

## Limitations

- Mapillary coverage is uneven, with major roads generally better represented than small residential or industrial streets.
- Images are forward-facing rather than panoramic and may miss important environmental context.
- Urban functions are image-derived predictions; they are not official planning or land-use classifications.
- A single dominant function is assigned to each LSOA, which masks mixed land use within neighbourhoods.
- The analysis is observational and does not control for all potential confounders, including deprivation, population density, mobility, or policing intensity.
- Smaller functional groups have higher uncertainty and are excluded from the main zone-specific comparisons when they contain fewer than 40 LSOAs.

## Author

**Huaiyu Tian** · MSc Urban Data Science, University of Leeds
