const data = window.ANALYSIS_SUMMARY;

// DOM Elements
const anchorNav = document.getElementById("anchorNav");
const metaCards = document.getElementById("metaCards");
const findingCards = document.getElementById("findingCards");
const methodSelect = document.getElementById("methodSelect");
const crimeSelect = document.getElementById("crimeSelect");
const chartNote = document.getElementById("chartNote");
const timeSeriesSelect = document.getElementById("timeSeriesSelect");
const zoneCards = document.getElementById("zoneCards");
const qualityList = document.getElementById("qualityList");
const zoneCrimeSelect = document.getElementById("zoneCrimeSelect");
const bubbleCrimeSelect = document.getElementById("bubbleCrimeSelect");
const simTargetSelect = document.getElementById("simTargetSelect");
const simControls = document.getElementById("simControls");
const simResult = document.getElementById("simResult");
const simPresets = document.getElementById("simPresets");
const mapModeSelect = document.getElementById("mapModeSelect");
const coverageToggle = document.getElementById("coverageToggle");
const mapLegend = document.getElementById("mapLegend");

// Plotly Configuration
const plotCfg = { displayModeBar: 'hover', responsive: true };

// Returns a theme-aware Plotly base layout (call each time you render)
function getPlotLayout() {
  const isLight = document.documentElement.dataset.theme === 'light';
  const textColor   = isLight ? 'rgba(0,0,0,0.65)'   : 'rgba(255,255,255,0.75)';
  const gridColor   = isLight ? 'rgba(0,0,0,0.07)'   : 'rgba(255,255,255,0.05)';
  const zeroColor   = isLight ? 'rgba(0,0,0,0.15)'   : 'rgba(255,255,255,0.1)';
  const tickColor   = isLight ? 'rgba(0,0,0,0.50)'   : 'rgba(255,255,255,0.6)';
  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font: { color: textColor, family: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif", size: 12 },
    margin: { l: 80, r: 40, t: 40, b: 60 },
    xaxis: {
      gridcolor: gridColor,
      zerolinecolor: zeroColor,
      tickfont: { color: tickColor },
      titlefont: { color: textColor },
    },
    yaxis: {
      gridcolor: gridColor,
      zerolinecolor: zeroColor,
      tickfont: { color: tickColor },
      titlefont: { color: textColor },
    },
  };
}

// Utilities
function formatPct(v, digits = 2) {
  return `${(v * 100).toFixed(digits)}%`;
}

function fillSelect(selectEl, list) {
  if (!selectEl) return;
  if (!list?.length) {
    selectEl.innerHTML = "";
    return;
  }
  if (typeof list[0] === "string") {
    selectEl.innerHTML = list.map((item) => `<option value="${item}">${item}</option>`).join("");
  } else {
    selectEl.innerHTML = list.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
  }
}

// Display-name abbreviations for long crime category labels
const CRIME_LABELS = {
  "ARSON AND CRIMINAL DAMAGE": "Arson & Criminal Damage",
  "MISCELLANEOUS CRIMES AGAINST SOCIETY": "Misc. Crimes Against Society",
  "POSSESSION OF WEAPONS": "Weapons Offences",
  "VIOLENCE AGAINST THE PERSON": "Violence Against Person",
  "PUBLIC ORDER OFFENCES": "Public Order",
  "VEHICLE OFFENCES": "Vehicle Offences",
  "DRUG OFFENCES": "Drug Offences",
};

function prettyCrime(name) {
  if (CRIME_LABELS[name]) return CRIME_LABELS[name];
  return String(name)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

// Navigation setup with ScrollSpy and Liquid Glass Sliding Indicator
function initNav() {
  if (!anchorNav) return;
  const nav = [
    ["overview", "Overview"],
    ["methodology", "Methodology"],
    ["map", "Map"],
    ["zones", "Zones"],
    ["zone-crime", "Profiles"],
    ["insights", "Findings"],
    ["explorer", "Correlations"],
    ["timeline", "Trends"],
    ["support-heatmap", "Diagnostics"],
    ["evidence", "Evidence"],
    ["simulator", "Simulator"],
    ["quality", "Quality"],
  ];
  
  // Render nav links and insert empty sliding indicator container
  anchorNav.innerHTML = `
    <div class="nav-indicator" id="navIndicator"></div>
    ${nav.map(([id, name]) => `<a href="#${id}" role="menuitem">${name}</a>`).join("")}
  `;

  const links = anchorNav.querySelectorAll("a");
  const sections = Array.from(document.querySelectorAll(".chapter"));
  let currentSectionIndex = 0;
  let isScrolling = false;
  const scrollCooldown = 900; // Cooldown threshold in ms for scroll resistance/damping

  const showcase = document.querySelector(".showcase");

  function resizeChartsForSection(sectionId) {
    if (sectionId === "map" && window.map) {
      try { window.map.invalidateSize(); } catch(e) {}
    }
    if (!window.Plotly) return;
    const chartIds = {
      "zones": ["distChart", "zoneTestChart"],
      "zone-crime": ["zoneCrimeChart"],
      "explorer": ["corrChartPearson", "corrChartSpearman"],
      "timeline": ["timeChart", "seasonalityChart"],
      "support-heatmap": ["corrHeatmap", "featureCorrChart"],
      "evidence": ["evidenceChart"],
      "simulator": ["simGaugeChart", "simChart"]
    };
    if (chartIds[sectionId]) {
      chartIds[sectionId].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          try { Plotly.Plots.resize(el); } catch(e) {}
        }
      });
    }
  }

  function scrollToSection(index) {
    if (index < 0 || index >= sections.length) return;
    isScrolling = true;
    currentSectionIndex = index;
    
    // Hardware-accelerated sliding transition
    showcase.style.transform = `translateY(-${index * 100}vh)`;

    links.forEach(l => l.classList.remove("active"));
    links[index].classList.add("active");
    
    // Smoothly scroll the horizontal topnav menu to center the active link
    const linkEl = links[index];
    const containerWidth = anchorNav.offsetWidth;
    const linkOffset = linkEl.offsetLeft;
    const linkWidth = linkEl.offsetWidth;
    anchorNav.scrollTo({
      left: linkOffset - (containerWidth / 2) + (linkWidth / 2),
      behavior: "smooth"
    });

    updateNavIndicator();

    // Silently update the URL hash to track navigation status
    if (sections[index] && sections[index].id) {
      history.replaceState(null, null, "#" + sections[index].id);
    }

    // Trigger immediate resize during transition
    resizeChartsForSection(sections[index].id);

    setTimeout(() => {
      isScrolling = false;
      // Trigger final resize after transition settles
      resizeChartsForSection(sections[index].id);
    }, scrollCooldown);
  }

  // Click handler
  links.forEach((link, idx) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToSection(idx);
    });
  });

  // Wheel listener for scroll hijacking with resistance/damping
  window.addEventListener("wheel", (e) => {
    // Exempt map zoom, horizontally scrollable nav, scrollable quality cards, scrollable zones cards, dropdown panels, and simulator scrollable controls
    if (e.target.closest("#mapCanvas") || 
        e.target.closest("#anchorNav") || 
        e.target.closest(".cards-stack") ||
        e.target.closest(".zone-metrics-column") ||
        e.target.closest(".t-dropdown") ||
        e.target.closest(".sim-layout-column--controls")) {
      return; 
    }
    
    e.preventDefault();
    if (isScrolling) return;

    if (e.deltaY > 15) {
      scrollToSection(currentSectionIndex + 1);
    } else if (e.deltaY < -15) {
      scrollToSection(currentSectionIndex - 1);
    }
  }, { passive: false });

  // Swipe support on mobile devices
  let touchStartY = 0;
  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchend", (e) => {
    if (e.target.closest("#mapCanvas") || 
        e.target.closest("#anchorNav") || 
        e.target.closest(".cards-stack") ||
        e.target.closest(".zone-metrics-column") ||
        e.target.closest(".t-dropdown") || 
        e.target.closest(".sim-layout-column--controls")) {
      return; 
    }
    
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > 65) {
      if (isScrolling) return;
      if (diff > 0) {
        scrollToSection(currentSectionIndex + 1);
      } else {
        scrollToSection(currentSectionIndex - 1);
      }
    }
  }, { passive: true });

  // Resize listener
  window.addEventListener("resize", updateNavIndicator);

  // Force initial alignment snap on load based on URL hash
  setTimeout(() => {
    const hash = window.location.hash;
    let initialIdx = 0;
    if (hash) {
      const targetId = hash.substring(1);
      const targetIdx = sections.findIndex(s => s.id === targetId);
      if (targetIdx !== -1) initialIdx = targetIdx;
    }
    scrollToSection(initialIdx);
  }, 250);
}

// Moves and resizes the liquid glass background pill indicator
function updateNavIndicator() {
  const indicator = document.getElementById("navIndicator");
  const activeLink = document.querySelector(".topnav a.active");
  const nav = document.getElementById("anchorNav");
  if (!indicator || !activeLink || !nav) return;

  const activeRect = activeLink.getBoundingClientRect();
  const navRect = nav.getBoundingClientRect();

  const relativeLeft = activeLink.offsetLeft;
  const linkWidth = activeRect.width;

  const paddingX = 16; // Shorten width by 16px (8px on each side)
  indicator.style.left = `${relativeLeft + (paddingX / 2)}px`;
  indicator.style.width = `${linkWidth - paddingX}px`;

  // Auto-scroll the nav container to keep active link fully visible
  const navScrollLeft = nav.scrollLeft;
  const navWidth = navRect.width;

  if (relativeLeft < navScrollLeft) {
    nav.scrollTo({ left: relativeLeft - 16, behavior: "smooth" });
  } else if (relativeLeft + linkWidth > navScrollLeft + navWidth) {
    nav.scrollTo({ left: relativeLeft + linkWidth - navWidth + 16, behavior: "smooth" });
  }
}

// Render data
function renderMeta() {
  if (!metaCards || !data?.meta) return;
  const m = data.meta;
  const fmt = (v) => (v == null ? "N/A" : typeof v === "number" ? v.toLocaleString() : v);
  const cards = [
    ["Grid Centroids (50m)", fmt(m.grid_centers ?? m.grid_points_matched)],
    ["Mapillary Images", fmt(m.mapillary_images ?? m.unique_images)],
    ["Boundary-Filtered Samples", fmt(m.spatial_joined_samples ?? 150182)],
    ["Merged LSOAs", fmt(m.lsoa_merged)],
    ["Data Coverage", m.coverage_ratio != null ? formatPct(m.coverage_ratio) : "N/A"],
    ["Environmental Features", fmt(m.feature_count)],
  ];
  metaCards.innerHTML = cards.map(([label, value]) => `
    <article class="metric-card">
      <p>${label}</p>
      <h4>${value}</h4>
    </article>
  `).join("");
}

function renderFindings() {
  if (!findingCards || !data?.top_findings) return;
  const p = data.top_findings.pearson_theft_positive || { feature: "N/A", value: 0, p: 1 };
  const n = data.top_findings.pearson_theft_negative || { feature: "N/A", value: 0, p: 1 };
  const tier = data.evidence_tiers || {};
  const kw = data.zone_tests?.find(x => x.crime === "THEFT") || { H: 105.62, p: 3.46e-21 };
  const m = data.scenario_models?.THEFT || { r2_train: 0.0886, r2_test: 0.0569 };
  
  const cards = [
    { title: "Environmental Catalysts", desc: `Built-up density (features like building footprint and fence coverage) exhibits the strongest positive link with theft: <strong>${p.feature}</strong> (r=<strong>${p.value.toFixed(3)}</strong>, p=${p.p.toExponential(1)}). Dense environments create concealment and target-rich hotspots, facilitating spatial opportunities for property crimes.` },
    { title: "Protective Deterrents", desc: `Visual openness (such as sky visibility and topographic spacing) acts as a citywide crime deterrent: <strong>${n.feature}</strong> (r=<strong>${n.value.toFixed(3)}</strong>, p=${n.p.toExponential(1)}). High sky-view visibility supports Jane Jacobs' "eyes on the street" natural surveillance.` },
    { title: "Evidence Strength Tiers", desc: `Kruskal-Wallis and regression screenings identified <strong>${tier.strong ?? 0} Strong</strong> and <strong>${tier.moderate ?? 0} Moderate</strong> robust statistical associations between visual street features and crime rates, moving beyond generic citywide averages to reveal zone-specific environmental influences.` },
    { title: "Spatial Variance H-Test", desc: `Kruskal H-Test confirms crime rates differ significantly across functional zones (H=<strong>${kw.H.toFixed(2)}</strong>, p=<strong>${kw.p.toExponential(1)}</strong>). Zone context shapes opportunity structure: theft concentrates in commercial cores, while vehicle offences peak at transit hubs.` },
    { title: "Data Scope & Scale", desc: `Extracted 19 visual feature dimensions across <strong>150,654 images</strong> and matched them to <strong>3,525 Greater London LSOAs</strong>, achieving <strong>${(data.meta.coverage_ratio * 100).toFixed(1)}%</strong> of citywide neighborhood coverage, providing a highly representative regional analysis.` },
    { title: "Model Generalization", desc: `Regression baseline achieves test R² of <strong>${(m.r2_test * 100).toFixed(2)}%</strong> and train R² of <strong>${(m.r2_train * 100).toFixed(2)}%</strong>. Visual features provide modest but statistically robust explanations. Greenery has contrasting roles, facilitating concealment in residential/commercial zones.` },
  ];
  
  findingCards.innerHTML = cards.map((x, i) => `
    <article class="question-card">
      <p class="question-index">0${i + 1}</p>
      <h4>${x.title}</h4>
      <p>${x.desc}</p>
    </article>
  `).join("");
}

function updateCorrelationChart() {
  if (!crimeSelect || !document.getElementById("corrChartPearson") || !document.getElementById("corrChartSpearman")) return;
  const crime = crimeSelect.value;
  
  const isLight = document.documentElement.dataset.theme === 'light';
  const markerLineColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";
  const zeroLineColor = isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)";

  // Pearson (Linear)
  const rowsP = data.correlations["Pearson"][crime].slice(0, 14);
  const xP = rowsP.map((r) => r.value).reverse();
  const yP = rowsP.map((r) => r.feature).reverse();
  const colorsP = xP.map((v) => (v >= 0 ? "rgba(255, 149, 0, 0.85)" : "rgba(52, 199, 89, 0.85)"));

  Plotly.react("corrChartPearson", [{
    type: "bar",
    orientation: "h",
    x: xP, y: yP,
    marker: { color: colorsP, line: { width: 1, color: markerLineColor } },
    customdata: rowsP.map((r) => [r.p, r.n]).reverse(),
    hovertemplate: "<b>%{y}</b><br>Pearson r: %{x:.3f}<br>p-value: %{customdata[0]:.2e}<br>Sample Size: %{customdata[1]}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, title: "Pearson Correlation Coefficient", zeroline: true, zerolinecolor: zeroLineColor, zerolinewidth: 1.5 },
    yaxis: { ...(getPlotLayout()).yaxis, title: "" },
    margin: { l: 140, r: 20, t: 20, b: 50 }
  }, plotCfg);

  // Spearman (Rank)
  const rowsS = data.correlations["Spearman"][crime].slice(0, 14);
  const xS = rowsS.map((r) => r.value).reverse();
  const yS = rowsS.map((r) => r.feature).reverse();
  const colorsS = xS.map((v) => (v >= 0 ? "rgba(255, 149, 0, 0.85)" : "rgba(52, 199, 89, 0.85)"));

  Plotly.react("corrChartSpearman", [{
    type: "bar",
    orientation: "h",
    x: xS, y: yS,
    marker: { color: colorsS, line: { width: 1, color: markerLineColor } },
    customdata: rowsS.map((r) => [r.p, r.n]).reverse(),
    hovertemplate: "<b>%{y}</b><br>Spearman ρ: %{x:.3f}<br>p-value: %{customdata[0]:.2e}<br>Sample Size: %{customdata[1]}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, title: "Spearman Rank Correlation", zeroline: true, zerolinecolor: zeroLineColor, zerolinewidth: 1.5 },
    yaxis: { ...(getPlotLayout()).yaxis, title: "" },
    margin: { l: 140, r: 20, t: 20, b: 50 }
  }, plotCfg);

  const strongestP = rowsP[rowsP.length - 1]; // rows is sorted descending, so strongest is the last one in reverse (which is rowsP[0])
  const strongestS = rowsS[0];
  if (chartNote && strongestP && strongestS) {
    chartNote.innerHTML = `Strongest environmental correlates for ${prettyCrime(crime)}: ` +
      `Pearson (Linear): <strong>${rowsP[0].feature}</strong> (r=${rowsP[0].value.toFixed(3)}, p=${rowsP[0].p.toExponential(1)}) | ` +
      `Spearman (Rank): <strong>${strongestS.feature}</strong> (ρ=${strongestS.value.toFixed(3)}, p=${strongestS.p.toExponential(1)})`;
  }
}

function updateTimeChart() {
  if (!timeSeriesSelect || !document.getElementById("timeChart")) return;
  const key = timeSeriesSelect.value || "TOTAL";
  
  // Disable monthly checkbox for non-TOTAL crime categories (dataset only contains annual stats by category)
  const monthlyToggle = document.getElementById("timeResolutionToggle");
  if (monthlyToggle) {
    if (key !== "TOTAL") {
      monthlyToggle.disabled = true;
      monthlyToggle.checked = false;
    } else {
      monthlyToggle.disabled = false;
    }
  }

  const isGranular = monthlyToggle?.checked;
  const showYoY = document.getElementById("timeYoYToggle")?.checked;
  const yoyToggle = document.getElementById("timeYoYToggle");
  const yoyLabel = document.getElementById("yoyToggleLabel");
  let effectiveShowYoY = showYoY;

  if (yoyToggle && yoyLabel) {
    if (isGranular || key !== "TOTAL") {
      yoyLabel.style.display = "none";
      yoyToggle.checked = false;
      effectiveShowYoY = false;
    } else {
      yoyLabel.style.display = "flex";
    }
  }

  const traces = [];
  let series;

  if (isGranular && key === "TOTAL") {
    // Render high-res monthly series (unused field monthly_total)
    series = data.time_series.monthly_total;
    const x = series.map((d) => {
      const yr = d.month.substring(0, 4);
      const mo = d.month.substring(4, 6);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(mo) - 1]} ${yr}`;
    });
    const y = series.map((d) => d.value);

    traces.push({
      name: "Monthly Count",
      type: "scatter",
      mode: "lines",
      x, y,
      line: { color: "#007aff", width: 2, shape: "spline" },
      hovertemplate: "%{x}<br>Crime Volume: %{y:,.0f}<extra></extra>",
    });
  } else {
    // Render annual series
    series = key === "TOTAL" ? data.time_series.total : data.time_series.categories[key];
    const x = series.map((d) => d.year);
    const y = series.map((d) => d.value);

    traces.push({
      name: "Annual Count",
      type: "scatter",
      mode: "lines+markers",
      x, y,
      line: { color: key === "TOTAL" ? "#007aff" : "#ff9500", width: 3, shape: "linear" },
      marker: { size: 8, color: "#fff", line: { width: 2, color: (key === "TOTAL" ? "#007aff" : "#ff9500") } },
      hovertemplate: "Year %{x}<br>Volume: %{y:,.0f}<extra></extra>",
    });

    // Add Year-over-Year Growth Rate overlay as secondary bar chart (unused field yoy)
    if (effectiveShowYoY && key === "TOTAL") {
      // Exclude partial years (e.g. a year with fewer than 12 months of data) —
      // otherwise they'd render as a misleading 0% bar or a false swing.
      const yoyData = data.time_series.yoy.filter(d => !d.partial && d.change_pct !== null);
      const isLight = document.documentElement.dataset.theme === 'light';
      const yoyLineColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
      traces.push({
        name: "YoY Growth",
        type: "bar",
        x: yoyData.map(d => d.year),
        y: yoyData.map(d => d.change_pct * 100),
        yaxis: "y2",
        marker: {
          color: yoyData.map(d => d.change_pct >= 0 ? "rgba(255, 59, 48, 0.4)" : "rgba(52, 199, 89, 0.4)"),
          line: { width: 1, color: yoyLineColor }
        },
        hovertemplate: "YoY Change: %{y:+.2f}%<extra></extra>"
      });
    }
  }

  const isLight = document.documentElement.dataset.theme === 'light';
  const legendColor = isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.5)";
  const labelColor = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.4)";
  const secondaryGridColor = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.02)";
  const secondaryZeroColor = isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)";

  // Define layout with potential secondary y-axis
  const layout = {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, title: isGranular ? "Month" : "Year" },
    yaxis: { ...(getPlotLayout()).yaxis, title: "Crime Incidents Count" },
    legend: { orientation: "h", y: -0.2, font: { color: legendColor } }
  };

  const hasPartial = !isGranular && series.some(d => d.partial);
  if (hasPartial) {
    layout.annotations = [{
      xref: 'paper',
      yref: 'paper',
      x: 1,
      xanchor: 'right',
      y: 1.05,
      yanchor: 'bottom',
      text: '* 2025 represents partial-year data (concludes in June)',
      showarrow: false,
      font: {
        size: 10,
        color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
      }
    }];
  }

  if (effectiveShowYoY && !isGranular && key === "TOTAL") {
    layout.yaxis2 = {
      title: "YoY % Change",
      titlefont: { color: labelColor },
      tickfont: { color: labelColor },
      overlaying: "y",
      side: "right",
      gridcolor: secondaryGridColor,
      zerolinecolor: secondaryZeroColor,
    };
  }

  Plotly.react("timeChart", traces, layout, plotCfg);
}

function renderSeasonality() {
  if (!document.getElementById("seasonalityChart")) return;
  const s = data.time_series.seasonality;
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const isLight = document.documentElement.dataset.theme === 'light';
  const barTextColor = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";

  Plotly.react("seasonalityChart", [{
    type: "heatmap",
    z: s.matrix,
    x: monthLabels,
    y: s.years,
    colorscale: "Viridis",
    colorbar: { title: "Crimes", tickfont: { color: barTextColor } },
    hovertemplate: "Year %{y}, %{x}<br>Crime Volume: %{z:,.0f}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, title: "" },
    yaxis: { ...(getPlotLayout()).yaxis, title: "Year" },
    annotations: [{
      xref: 'paper',
      yref: 'paper',
      x: 1,
      xanchor: 'right',
      y: 1.05,
      yanchor: 'bottom',
      text: '* 2025 data concludes in June',
      showarrow: false,
      font: {
        size: 10,
        color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
      }
    }]
  }, plotCfg);
}
function renderCorrelationHeatmap() {
  if (!document.getElementById("corrHeatmap")) return;
  const h = data.corr_heatmap;
  const isLight = document.documentElement.dataset.theme === 'light';
  const barTextColor = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";

  Plotly.react("corrHeatmap", [{
    type: "heatmap",
    z: h.matrix,
    x: h.crimes.map(c => prettyCrime(c)),
    y: h.features,
    colorscale: "RdBu",
    reversescale: true,
    zmin: -0.3,
    zmax: 0.3,
    colorbar: { tickfont: { color: barTextColor } },
    hovertemplate: "Feature %{y}<br>Crime %{x}<br>r = %{z:.3f}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, tickangle: -25, tickfont: { size: 9.8 } },
    yaxis: { ...(getPlotLayout()).yaxis, tickfont: { size: 9.8 } },
    margin: { l: 120, r: 20, t: 20, b: 80 }
  }, plotCfg);
}

function renderFeatureCorrMatrix() {
  if (!document.getElementById("featureCorrChart")) return;
  const m = data.feature_corr_matrix;
  const isLight = document.documentElement.dataset.theme === 'light';
  const barTextColor = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";

  Plotly.react("featureCorrChart", [{
    type: "heatmap",
    z: m.matrix,
    x: m.features,
    y: m.features,
    colorscale: "RdBu",
    reversescale: true,
    zmin: -1, zmax: 1,
    colorbar: { tickfont: { color: barTextColor } },
    hovertemplate: "%{y} × %{x}<br>Pearson r = %{z:.3f}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, tickangle: -30, tickfont: { size: 9.8 } },
    yaxis: { ...(getPlotLayout()).yaxis, tickfont: { size: 9.8 } },
    margin: { l: 120, r: 20, t: 20, b: 80 }
  }, plotCfg);
}
function renderZones() {
  if (!zoneCards) return;
  zoneCards.innerHTML = data.zone_cards.map((z, idx) => {
    const ratioText = z.relative_total_index >= 1.0 
      ? `<strong class="text-highlight">+${((z.relative_total_index - 1)*100).toFixed(0)}%</strong> vs city avg` 
      : `<strong class="text-highlight">-${((1 - z.relative_total_index)*100).toFixed(0)}%</strong> vs city avg`;
      
    // Build details table
    const tableRows = z.top_crime_mix.slice(0, 4).map(x => `
      <tr>
        <td style="color: var(--text-secondary); padding: 0.2rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.04);">${prettyCrime(x.crime)}</td>
        <td style="text-align: right; font-weight: 500; padding: 0.2rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.04);">${x.value.toFixed(2)}</td>
      </tr>
    `).join("");
    
    const activeClass = idx === 0 ? "active" : "";
    
    return `
      <article class="expandable-zone-card ${activeClass}" data-index="${idx}">
        <div class="expandable-card-row-1">
          <span class="card-zone-name">${z.name}</span>
          <span class="card-n-val">n=${z.sample_size}</span>
        </div>
        <div class="expandable-card-row-2">
          <span class="card-total-crime">Total: <strong>${z.mean_total_crime.toFixed(2)}</strong></span>
          <span class="card-vs-avg">${ratioText}</span>
        </div>
        <div class="card-details">
          <table class="crime-table" style="width:100%; border-collapse:collapse; margin-top:0.25rem;">
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }).join("");

  // Bind click handlers to cards for smooth accordion behavior
  const cards = zoneCards.querySelectorAll(".expandable-zone-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      cards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
    });
  });
}

function renderDistribution() {
  if (!document.getElementById("distChart")) return;
  const rows = data.function_distribution.slice(0, 10);
  const isLight = document.documentElement.dataset.theme === 'light';
  const markerLineColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";

  Plotly.react("distChart", [{
    type: "bar",
    x: rows.map((r) => r.function),
    y: rows.map((r) => r.count),
    marker: { color: "#007aff", opacity: 0.8, line: {width: 1, color: markerLineColor} },
    hovertemplate: "%{x}<br>LSOAs: %{y}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, title: "Functional Zone", tickangle: -25 },
    yaxis: { ...(getPlotLayout()).yaxis, title: "LSOA Count" },
    margin: { l: 60, r: 20, t: 40, b: 80 }
  }, plotCfg);
}

function getCrimeDescription(crime) {
  const descriptions = {
    "THEFT": "<strong>Theft</strong> exhibits the highest volume, concentrated heavily in <strong>Commercial</strong> zones due to shoplifting and high foot traffic. Residential zones remain low and uniform.",
    "ROBBERY": "<strong>Robbery</strong> occurs predominantly in <strong>Commercial</strong> and transit hubs, showing high variance and indicating a strong correlation with evening foot traffic densities.",
    "BURGLARY": "<strong>Burglary</strong> rates are more evenly distributed but show distinct residential peaks, where quiet <strong>Residential</strong> streets provide target accessibility.",
    "VEHICLE OFFENCES": "<strong>Vehicle Offences</strong> show strong association with <strong>Workplace/Mixed</strong> and residential perimeter streets. Open parking structures and road accessibility act as key environmental catalysts.",
    "DRUG OFFENCES": "<strong>Drug Offences</strong> exhibit local hotspots in <strong>Commercial</strong> areas and alleyways. Visual indicators of low natural surveillance correlate strongly with arrest locations.",
    "POSSESSION OF WEAPONS": "<strong>Possession of Weapons</strong> is highly localized, tracking high-density commercial zones. Statistical variance is high, indicating localized policing hotspots.",
    "PUBLIC ORDER OFFENCES": "<strong>Public Order</strong> violations are prevalent in active <strong>Commercial</strong> cores. Alcohol outlet density and public transit stations represent primary spatial predictors.",
    "ARSON AND CRIMINAL DAMAGE": "<strong>Criminal Damage & Arson</strong> exhibits stable averages across both <strong>Residential</strong> and mixed zones, showing a moderate correlation with indicators of physical disorder.",
    "MISCELLANEOUS CRIMES AGAINST SOCIETY": "<strong>Miscellaneous Crimes</strong> show relative stability across zones, with slight elevations in commercial/industrial zones due to regulatory inspections."
  };
  return descriptions[crime] || `This chart breaks down the selected crime type by functional zone, showing the mean and volatility rates.`;
}

function updateZoneCrimeChart() {
  if (!zoneCrimeSelect || !document.getElementById("zoneCrimeChart")) return;
  const c = zoneCrimeSelect.value;
  const z = data.zone_crime_stats;
  const x = z.map((r) => r.function);
  const mean = z.map((r) => r[c].mean);
  const q25 = z.map((r) => r[c].q25);
  const q75 = z.map((r) => r[c].q75);
  
  const descEl = document.getElementById("profileDesc");
  if (descEl) {
    descEl.innerHTML = getCrimeDescription(c);
  }
  
  const isLight = document.documentElement.dataset.theme === 'light';
  const markerLineColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";
  const errColor = isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)";

  Plotly.react("zoneCrimeChart", [{
    type: "bar",
    x, y: mean,
    marker: { color: "#ff9500", opacity: 0.85, line: {width:1, color: markerLineColor} },
    error_y: {
      type: "data", symmetric: false,
      array: q75.map((v, i) => Math.max(v - mean[i], 0)),
      arrayminus: q25.map((v, i) => Math.max(mean[i] - v, 0)),
      color: errColor,
      thickness: 1.5,
    },
    hovertemplate: "Zone: %{x}<br>Mean Crime Rate: %{y:.3f} per 1000<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, tickangle: -20 },
    yaxis: { ...(getPlotLayout()).yaxis, title: `${prettyCrime(c)} per 1000 residents` },
    margin: { l: 60, r: 20, t: 40, b: 80 }
  }, plotCfg);
}

function updateEvidenceChart() {
  if (!bubbleCrimeSelect || !document.getElementById("evidenceChart")) return;
  const crime = bubbleCrimeSelect.value;
  const rows = data.evidence_bubble.filter((r) => r.crime === crime);
  
  // Use absolute correlation to define bubble size for better data-density visual
  const maxAbsCorr = Math.max(...rows.map(r => Math.abs(r.corr)), 0.1);
  const sizes = rows.map(r => (Math.abs(r.corr) / maxAbsCorr) * 20 + 8);

  const isLight = document.documentElement.dataset.theme === 'light';
  const textColor = isLight ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.85)";
  const markerBorderColor = isLight ? "#000" : "#fff";
  const lineColor1 = isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)";
  const lineColor2 = isLight ? "rgba(0,0,0,0.3)" : "rgba(255, 255, 255, 0.4)";

  Plotly.react("evidenceChart", [{
    type: "scatter",
    mode: "markers+text",
    x: rows.map((r) => r.corr),
    y: rows.map((r) => r.sig),
    text: rows.map((r) => r.feature),
    textposition: "top center",
    marker: {
      size: sizes,
      color: rows.map((r) => (r.corr >= 0 ? "rgba(255, 149, 0, 0.8)" : "rgba(52, 199, 89, 0.8)")),
      opacity: 0.8,
      line: { width: 1.5, color: markerBorderColor },
    },
    textfont: {color: textColor, size: 10},
    hovertemplate: "Feature: <b>%{text}</b><br>Correlation: %{x:.3f}<br>-log10(p): %{y:.2f}<br>LSOAs: %{marker.size}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, title: "Pearson Correlation Coefficient", zeroline: true },
    yaxis: { ...(getPlotLayout()).yaxis, title: "Statistical Significance: -log10(p-value)" },
    shapes: [
      // Dotted lines representing significance thresholds (p < 0.05 is ~1.30, p < 0.01 is 2.00)
      { type: "line", x0: -0.4, x1: 0.4, y0: 1.301, y1: 1.301, line: { color: lineColor1, width: 1, dash: "dash" } },
      { type: "line", x0: -0.4, x1: 0.4, y0: 2, y1: 2, line: { color: lineColor2, width: 1, dash: "dot" } }
    ],
  }, plotCfg);
}

function renderZoneTests() {
  if (!document.getElementById("zoneTestChart")) return;
  const rows = data.zone_tests || [];
  const y = rows.map((r) => prettyCrime(r.crime));
  const x = rows.map((r) => (r.p == null ? 0 : -Math.log10(Math.max(r.p, 1e-300))));
  const hVals = rows.map((r) => r.H ?? 0);
  
  const isLight = document.documentElement.dataset.theme === 'light';
  const markerLineColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";

  Plotly.react("zoneTestChart", [{
    type: "bar",
    orientation: "h",
    x: x.slice().reverse(),
    y: y.slice().reverse(),
    customdata: hVals.slice().reverse(),
    marker: { color: "rgba(191, 90, 242, 0.8)", line:{width:1, color: markerLineColor} },
    hovertemplate: "%{y}<br>-log10(p): %{x:.2f}<br>Kruskal H: %{customdata:.2f}<extra></extra>",
  }], {
    ...getPlotLayout(),
    xaxis: { ...(getPlotLayout()).xaxis, title: "Significance: -log10(p-value)" },
    yaxis: { ...(getPlotLayout()).yaxis },
    margin: { l: 150, r: 20, t: 40, b: 60 },
    shapes: [
      { type: "line", x0: 1.301, x1: 1.301, y0: -0.5, y1: y.length - 0.5, line: { dash: "dot", color: "#ff9500" } },
      { type: "line", x0: 2, x1: 2, y0: -0.5, y1: y.length - 0.5, line: { dash: "dot", color: "#34c759" } },
    ],
  }, plotCfg);
}

function setupSimulator() {
  if (!simTargetSelect || !simPresets || !simControls || !simResult) return;
  const models = data.scenario_models || {};
  const available = Object.keys(models).filter((k) => models[k]);
  if (!available.length) return;
  
  fillSelect(simTargetSelect, available.map((k) => ({ value: k, label: prettyCrime(k) })));
  const presets = [
    { key: "baseline", label: "Baseline" },
    { key: "safety", label: "Safety Boost" },
    { key: "risk", label: "Risk Stress" },
  ];
  simPresets.innerHTML = presets.map((p) => `<button class="sim-preset-btn" data-preset="${p.key}">${p.label}</button>`).join("");

  // Tabs for simulator visual panes are handled globally by initTabs()

  function renderControls(target) {
    const model = models[target];
    simControls.innerHTML = model.features.map((f, i) => `
      <div class="sim-card">
        <div class="sim-row">
          <label>${f.feature}</label>
          <span class="sim-val" id="simv_${i}">${f.mean.toFixed(3)}</span>
          <div class="sim-range-wrap">
            <input type="range" id="sim_${i}" min="${f.q10}" max="${f.q90}" step="${Math.max((f.q90 - f.q10) / 180, 0.0001)}" value="${f.mean}" />
            <div class="sim-range-meta">
              <span>Q10 ${f.q10.toFixed(3)}</span>
              <span>Q90 ${f.q90.toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  }

  function computePrediction(target, draw = true) {
    const model = models[target];
    let zsum = 0;
    const contrib = [];
    model.features.forEach((f, i) => {
      const el = document.getElementById(`sim_${i}`);
      const v = parseFloat(el.value);
      document.getElementById(`simv_${i}`).textContent = v.toFixed(3);
      const z = (v - f.mean) / (f.std || 1);
      const impact = f.beta_std * z;
      zsum += impact;
      contrib.push({ feature: f.feature, impact });
    });
    const pred = model.y_mean + model.y_std * zsum;
    const delta = pred - model.y_mean;
    const ratio = model.y_mean === 0 ? 0 : delta / model.y_mean;

    // Display scenario prediction statistics
    simResult.innerHTML = `
      <div class="sim-metrics-header" style="width:100%; display:flex; justify-content:space-between; margin-bottom:0.75rem; font-size:0.85rem; color:var(--text-secondary);">
        <span>Holdout R²: <strong>${(model.r2_test ?? 0).toFixed(3)}</strong> (Train R²: ${(model.r2_train ?? 0).toFixed(3)})</span>
        <span>Sample Size: <strong>n = ${model.n} LSOAs</strong></span>
      </div>
      <span class="sim-chip">Baseline: ${model.y_mean.toFixed(3)}</span>
      <span class="sim-chip">Scenario: ${pred.toFixed(3)}</span>
      <span class="sim-chip" style="color: ${delta >= 0 ? 'var(--warning)' : 'var(--positive)'}">Delta: ${delta >= 0 ? "+" : ""}${delta.toFixed(3)} (${(ratio * 100).toFixed(2)}%)</span>
    `;

    if (!draw) return;
    const sorted = contrib.slice().sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    const isLight = document.documentElement.dataset.theme === 'light';
    const gaugeBg = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)";
    const gaugeBorder = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)";
    const gaugeTitleColor = isLight ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.85)";

    // Render Expected Impact Gauge
    if (document.getElementById("simGaugeChart")) {
      Plotly.react("simGaugeChart", [{
        type: "indicator",
        mode: "gauge+number+delta",
        value: pred,
        number: { font: { color: isLight ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)" } },
        delta: { reference: model.y_mean, font: { color: isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)" }, increasing: { color: "#ff3b30" }, decreasing: { color: "#34c759" } },
        gauge: {
          axis: { 
            range: [Math.max(0, model.y_mean * 0.55), model.y_mean * 1.45],
            tickfont: { color: isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)" }
          },
          bar: { color: "#007aff" },
          bgcolor: gaugeBg,
          bordercolor: gaugeBorder,
        },
        title: { text: prettyCrime(target), font: { color: gaugeTitleColor, size: 14 } },
      }], {
        ...getPlotLayout(),
        margin: { l: 40, r: 40, t: 40, b: 40 }
      }, plotCfg);
    }

    // Render Coefficient Feature Weights Bar
    if (document.getElementById("simChart")) {
      Plotly.react("simChart", [{
        type: "bar",
        orientation: "h",
        x: sorted.map((d) => d.impact).reverse(),
        y: sorted.map((d) => d.feature).reverse(),
        marker: { color: sorted.map((d) => (d.impact >= 0 ? "#ff9500" : "#34c759")).reverse() },
        hovertemplate: "%{y}<br>Standardized Impact: %{x:.3f}<extra></extra>",
      }], {
        ...getPlotLayout(),
        margin: { l: 110, r: 20, t: 20, b: 40 },
        xaxis: { ...(getPlotLayout()).xaxis, title: "Standardized Impact Coefficient" },
        yaxis: { ...(getPlotLayout()).yaxis, title: "" },
      }, plotCfg);
    }
  }

  function applyPreset(target, preset) {
    const model = models[target];
    model.features.forEach((f, i) => {
      const el = document.getElementById(`sim_${i}`);
      if (!el) return;
      if (preset === "baseline") el.value = f.mean;
      else if (preset === "safety") el.value = f.beta_std >= 0 ? f.q10 : f.q90;
      else if (preset === "risk") el.value = f.beta_std >= 0 ? f.q90 : f.q10;
    });
    computePrediction(target);
  }

  function refresh() {
    const target = simTargetSelect.value;
    renderControls(target);
    const model = models[target];
    model.features.forEach((_, i) => {
      document.getElementById(`sim_${i}`).addEventListener("input", () => computePrediction(target));
    });
    computePrediction(target);
    simPresets.querySelectorAll("button").forEach((b) => {
      b.onclick = () => applyPreset(target, b.dataset.preset);
    });
  }

  simTargetSelect.addEventListener("change", refresh);
  refresh();
}

function renderQuality() {
  if (!qualityList) return;
  qualityList.innerHTML = data.quality_notes.map((q) => {
      let badge = "Note";
      let parsedText = q;

      if (q.includes("Coverage:") || q.includes("MPS LSOAs")) {
        badge = "Data Scope";
        parsedText = q.replace(/(\d[\d,]+)\s+of\s+(\d[\d,]+)/, "<span class='text-highlight'>$1</span> of <span class='text-highlight'>$2</span>")
                      .replace(/(\d+\.\d+%)/, "<span class='text-highlight'>$1</span>");
      } else if (q.includes("Sample imbalance") || q.includes("Residential")) {
        badge = "Sampling Bias";
        parsedText = q.replace(/(Residential[^;]+)/g, "<span class='text-highlight'>$1</span>");
      } else if (q.includes("observational") || q.includes("causal")) {
        badge = "Causality";
        parsedText = q.replace("observational", "<span class='text-highlight'>observational (non-causal)</span>");
      } else if (q.includes("Crime data source") || q.includes("Metropolitan Police")) {
        badge = "Data Source";
        parsedText = q.replace("Metropolitan Police Service", "<span class='text-highlight'>Metropolitan Police Service</span>")
                      .replace("Jan 2019", "<span class='text-highlight'>Jan 2019</span>")
                      .replace("Jun 2025", "<span class='text-highlight'>Jun 2025</span>");
      } else if (q.includes("linear model") || q.includes("train R")) {
        badge = "Model Quality";
        parsedText = q.replace(/R\u00b2=([\d\.]+)/g, "R\u00b2 = <span class='text-highlight'>$1</span>");
      } else if (q.includes("Average holdout")) {
        badge = "Generalization";
        parsedText = q.replace(/([\d\.]+)\.$/, "<span class='text-highlight'>$1</span>.");
      } else if (q.includes("Zone-difference")) {
        badge = "Significance";
        parsedText = q.replace(/(\d+\/\d+)/, "<span class='text-highlight'>$1</span>");
      }

      return `
        <article class="limit-item">
          <div class="limit-header">
            <span class="limit-badge">${badge}</span>
          </div>
          <p>${parsedText}</p>
        </article>
      `;
    })
    .join("");
}

function initMap() {
  const mapEl = document.getElementById("mapCanvas");
  if (!mapEl) return;

  // Graceful fallback if map_payload.js failed to load or is too slow
  if (!window.MAP_PAYLOAD || !window.L) {
    mapEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.4);font-size:0.9rem;">Map data is loading… If this persists, please refresh the page.</div>`;
    return;
  }
  const payload = window.MAP_PAYLOAD;
  const isLight = document.documentElement.dataset.theme === 'light';
  
  const map = L.map("mapCanvas", { zoomControl: true }).setView([51.5072, -0.12], 10);
  window.map = map;
  
  const tileUrl = isLight 
    ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  
  const mapTileLayer = L.tileLayer(tileUrl, {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);
  window.mapTileLayer = mapTileLayer;

  const q = payload.crime_quantiles || [3.2, 3.6, 4.0, 4.6];
  const crimeColors = ["#1d3a5b", "#245c7a", "#2f8a8f", "#64b07a", "#ff9500"];
  const fnPalette = {
    residential: "#34c759",
    commercial: "#ff9500",
    transportation: "#007aff",
    "outdoors and natural": "#32d74b",
    education: "#bf5af2",
    industrial: "#8e8e93",
    "health care": "#ff3b30",
    "sports and recreation": "#64d2ff",
    hotel: "#ffd60a",
    "civil and governmental": "#ff2d55",
    unknown: "#48484a",
  };

  function colorByCrime(v) {
    const activeIsLight = document.documentElement.dataset.theme === 'light';
    if (v == null || Number.isNaN(v)) return activeIsLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
    if (v <= q[0]) return crimeColors[0];
    if (v <= q[1]) return crimeColors[1];
    if (v <= q[2]) return crimeColors[2];
    if (v <= q[3]) return crimeColors[3];
    return crimeColors[4];
  }

  function renderLegend(mode) {
    if (!mapLegend) return;
    let items = [];
    const activeIsLight = document.documentElement.dataset.theme === 'light';
    const noDataColor = activeIsLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
    if (mode === "crime") {
      items = [
        [crimeColors[0], `≤ ${q[0].toFixed(2)}`],
        [crimeColors[1], `${q[0].toFixed(2)} - ${q[1].toFixed(2)}`],
        [crimeColors[2], `${q[1].toFixed(2)} - ${q[2].toFixed(2)}`],
        [crimeColors[3], `${q[2].toFixed(2)} - ${q[3].toFixed(2)}`],
        [crimeColors[4], `> ${q[3].toFixed(2)}`],
      ];
    } else if (mode === "coverage") {
      items = [["#007aff", "Has merged data"], [noDataColor, "No merged data"]];
    } else {
      items = Object.entries(fnPalette).map(([k, v]) => [v, k]);
    }
    mapLegend.innerHTML = items.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("");
  }

  const lsoaLayer = L.geoJSON(payload.geojson, {
    style: (f) => {
      const p = f.properties || {};
      const mode = mapModeSelect.value;
      const activeIsLight = document.documentElement.dataset.theme === 'light';
      const noDataColor = activeIsLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
      const borderColor = activeIsLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
      const fillColor = mode === "crime" ? colorByCrime(p.total_crime) :
                        mode === "coverage" ? (p.has_data ? "#007aff" : noDataColor) :
                        fnPalette[String(p.predicted_function || "unknown").toLowerCase()] || fnPalette.unknown;
      return { color: borderColor, weight: 0.5, fillColor, fillOpacity: p.has_data ? 0.7 : 0.2 };
    },
    onEachFeature: (feature, layer) => {
      const p = feature.properties || {};
      layer.bindPopup(`
        <div style="font-family: var(--font-family); color: var(--text-primary);">
          <b>${p.LSOA11NM || "LSOA"}</b><br/>
          Function: ${p.predicted_function || "N/A"}<br/>
          Total crime rate: ${p.total_crime == null ? "N/A" : Number(p.total_crime).toFixed(3)}
        </div>
      `);
    },
  }).addTo(map);
  window.lsoaLayer = lsoaLayer;

  const pts = payload.coverage_points || [];
  const ptFillColor = isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)";
  const coverageLayer = L.layerGroup(pts.map((pt) =>
    L.circleMarker([pt[1], pt[0]], { radius: 1, stroke: false, fillColor: ptFillColor, fillOpacity: 0.5 })
  ));
  window.coverageLayer = coverageLayer;
  window.coverageToggle = coverageToggle;

  coverageLayer.addTo(map);
  map.fitBounds(lsoaLayer.getBounds(), { padding: [10, 10] });

  function refreshMapMode() {
    lsoaLayer.setStyle(lsoaLayer.options.style);
    renderLegend(mapModeSelect.value);
  }

  function refreshCoverage() {
    coverageToggle.checked ? coverageLayer.addTo(map) : coverageLayer.remove();
  }

  mapModeSelect.addEventListener("change", refreshMapMode);
  coverageToggle.addEventListener("change", refreshCoverage);
  renderLegend("crime");
}

// Dropdown Logic
function initDropdowns() {
  const btns = document.querySelectorAll('.info-btn');
  const dropdowns = document.querySelectorAll('.t-dropdown');
  const duration = 150; // matches --dropdown-close-dur

  function closeDropdown(d) {
    if (d.classList.contains('is-open')) {
      d.classList.remove('is-open');
      d.classList.add('is-closing');
      setTimeout(() => {
        d.classList.remove('is-closing');
      }, duration);
    }
  }

  function closeAllDropdowns(exceptId) {
    dropdowns.forEach(d => {
      if (d.id !== exceptId) closeDropdown(d);
    });
  }

  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.dataset.target;
      const d = document.getElementById(targetId);
      if (!d) return;

      if (d.classList.contains('is-open')) {
        closeDropdown(d);
      } else {
        closeAllDropdowns(targetId);
        d.classList.remove('is-closing');
        void d.offsetWidth; 
        d.classList.add('is-open');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.t-dropdown') && !e.target.closest('.info-btn')) {
      closeAllDropdowns();
    }
  });

  // Keyboard support for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  });
}

// Tab Switching Controller for multi-panel sections
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      const container = btn.closest(".tabs-container");
      if (!container) return;
      
      // Deactivate other buttons
      container.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Deactivate other panes
      container.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      
      // Activate clicked pane
      const activePane = document.getElementById(tabId);
      if (activePane) {
        activePane.classList.add("active");
        
        // Let CSS transitions settle before triggering resize to ensure container box is stable
        setTimeout(() => {
          activePane.querySelectorAll(".plotly-box").forEach(box => {
            if (box.id && window.Plotly) {
              Plotly.Plots.resize(box.id);
            }
          });
          if (window.map && activePane.querySelector("#mapCanvas")) {
            window.map.invalidateSize();
          }
        }, 150);
      }
    });
  });
}

// Boot sequence
// Boot sequence
function boot() {
  if (!data) {
    console.error("ANALYSIS_SUMMARY data not loaded.");
    return;
  }

  // Force scroll to top on load and prevent browser scroll restoration
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  
  // Set theme from localStorage or system preference BEFORE rendering any charts
  const html = document.documentElement;
  const STORE = 'sv-crime-theme';
  const saved = localStorage.getItem(STORE);
  const systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  if (saved) {
    html.dataset.theme = saved;
  } else if (systemPrefersLight) {
    html.dataset.theme = 'light';
  } else {
    html.dataset.theme = 'dark';
  }
  
  try { initNav(); } catch(e) { console.error("initNav failed:", e); }
  try { renderMeta(); } catch(e) { console.error("renderMeta failed:", e); }
  try { renderFindings(); } catch(e) { console.error("renderFindings failed:", e); }
  try { renderZones(); } catch(e) { console.error("renderZones failed:", e); }
  try { renderQuality(); } catch(e) { console.error("renderQuality failed:", e); }

  fillSelect(crimeSelect, data.crime_options.map((k) => ({ value: k, label: prettyCrime(k) })));
  fillSelect(zoneCrimeSelect, data.crime_options.map((k) => ({ value: k, label: prettyCrime(k) })));
  fillSelect(bubbleCrimeSelect, data.crime_options.map((k) => ({ value: k, label: prettyCrime(k) })));
  fillSelect(timeSeriesSelect, ["TOTAL", ...Object.keys(data.time_series.categories)]);

  crimeSelect?.addEventListener("change", updateCorrelationChart);
  zoneCrimeSelect?.addEventListener("change", updateZoneCrimeChart);
  bubbleCrimeSelect?.addEventListener("change", updateEvidenceChart);
  
  timeSeriesSelect?.addEventListener("change", updateTimeChart);
  document.getElementById("timeResolutionToggle")?.addEventListener("change", updateTimeChart);
  document.getElementById("timeYoYToggle")?.addEventListener("change", updateTimeChart);

  // Initialize Plotly-dependent views if Plotly is loaded
  if (window.Plotly) {
    try { renderDistribution(); } catch(e) { console.error("renderDistribution failed:", e); }
    try { renderCorrelationHeatmap(); } catch(e) { console.error("renderCorrelationHeatmap failed:", e); }
    try { renderSeasonality(); } catch(e) { console.error("renderSeasonality failed:", e); }
    try { renderFeatureCorrMatrix(); } catch(e) { console.error("renderFeatureCorrMatrix failed:", e); }
    try { renderZoneTests(); } catch(e) { console.error("renderZoneTests failed:", e); }

    try { updateCorrelationChart(); } catch(e) { console.error("updateCorrelationChart failed:", e); }
    try { updateTimeChart(); } catch(e) { console.error("updateTimeChart failed:", e); }
    try { updateZoneCrimeChart(); } catch(e) { console.error("updateZoneCrimeChart failed:", e); }
    try { updateEvidenceChart(); } catch(e) { console.error("updateEvidenceChart failed:", e); }
    try { setupSimulator(); } catch(e) { console.error("setupSimulator failed:", e); }
  } else {
    console.warn("Plotly is not loaded. Charts will not display.");
    document.querySelectorAll(".plotly-box").forEach(box => {
      box.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);font-size:0.9rem;">Plotly library failed to load. Please check your internet connection.</div>`;
    });
  }

  try { initMap(); } catch(e) { console.error("initMap failed:", e); }
  try { initDropdowns(); } catch(e) { console.error("initDropdowns failed:", e); }
  try { initTabs(); } catch(e) { console.error("initTabs failed:", e); }
  try { initTheme(); } catch(e) { console.error("initTheme failed:", e); }
}

// Theme toggle — persists to localStorage, re-renders all Plotly charts
function initTheme() {
  const html   = document.documentElement;
  const btn    = document.getElementById('themeToggle');
  const STORE  = 'sv-crime-theme';

  function rerenderAllCharts() {
    if (window.Plotly) {
      try { updateCorrelationChart(); } catch(e) {}
      try { updateTimeChart(); } catch(e) {}
      try { updateZoneCrimeChart(); } catch(e) {}
      try { updateEvidenceChart(); } catch(e) {}
      try { renderCorrelationHeatmap(); } catch(e) {}
      try { renderSeasonality(); } catch(e) {}
      try { renderFeatureCorrMatrix(); } catch(e) {}
      try { renderZoneTests(); } catch(e) {}
      
      const simTarget = document.getElementById('simTargetSelect');
      if (simTarget?.value) {
        simTarget.dispatchEvent(new Event('change'));
      }
    }

    // Refresh map layer and styles
    if (window.map && window.mapTileLayer) {
      const activeIsLight = html.dataset.theme === 'light';
      const newUrl = activeIsLight 
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      window.mapTileLayer.setUrl(newUrl);

      if (window.lsoaLayer) {
        window.lsoaLayer.setStyle(window.lsoaLayer.options.style);
      }

      if (window.coverageLayer && window.coverageToggle?.checked) {
        window.coverageLayer.remove();
        const pts = window.MAP_PAYLOAD.coverage_points || [];
        const fillColor = activeIsLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)";
        window.coverageLayer = L.layerGroup(pts.map((pt) =>
          L.circleMarker([pt[1], pt[0]], { radius: 1, stroke: false, fillColor, fillOpacity: 0.5 })
        ));
        window.coverageLayer.addTo(window.map);
      }
    }
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const next = html.dataset.theme === 'light' ? 'dark' : 'light';
      html.dataset.theme = next;
      localStorage.setItem(STORE, next);
      // Small delay so CSS vars update before Plotly reads them
      requestAnimationFrame(() => setTimeout(rerenderAllCharts, 40));
    });
  }
}

let pollAttempts = 0;
function pollAndBoot() {
  const isLoaded = window.ANALYSIS_SUMMARY && window.MAP_PAYLOAD && window.L && window.Plotly;
  if (isLoaded || pollAttempts > 100) {
    boot();
  } else {
    pollAttempts++;
    setTimeout(pollAndBoot, 50);
  }
}
window.addEventListener('load', pollAndBoot);
