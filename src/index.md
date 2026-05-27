---
toc: false
---

<div class="hero">
  <h1>The Cost of Secondary Education</h1>
</div>

```js
const data = await FileAttachment("./data/school.csv").csv({typed: true})
```

```js
const us = await FileAttachment("./data/us-counties-10m.json").json()
```

```js
const valueByCounty = d3.rollup(
    data,
    v => d3.mean(v, d => d.averageNetPrice),
    d => String(d.countyFIPS).padStart(5, "0")
)

const counties = topojson.feature(us, us.objects.counties)

const states = topojson.mesh(
    us,
    us.objects.states,
    (a, b) => a !== b
)

const nation = topojson.mesh(
    us,
    us.objects.nation
)

const values = Array.from(valueByCounty.values()).filter(d => d != null)

const pointData = Array.from(
    d3.group(data, d => d.unitid),
    ([unitid, rows]) => rows
        .filter(d => Number.isFinite(+d.LON) && Number.isFinite(+d.LAT))
        .sort((a, b) => d3.descending(+a.year, +b.year))[0]
    )

const schoolNameByUnitId = new Map(
    data.map(d => [String(d.unitid), d.name])
)

const countyNameByFips = new Map(
    data.map(d => [
        String(d.countyFIPS).padStart(5, "0"),
        d.NMCNTY
    ])
)

const color = d3.scaleQuantize()
    .domain(d3.extent(values))
    .range(d3.schemeBlues[7])

const visWidth = width * 0.9
const visHeight = 7 / 16 * visWidth

const mapWidth = visWidth * 0.75
const mapHeight = visHeight

const chartWidth = visWidth * 0.25
const chartHeight = visHeight / 2

const legendWidth = mapWidth * 0.2
const legendHeight = mapHeight * 0.05

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [mapWidth, mapHeight]])
    .on("zoom", zoomed)

const container = d3.create("div")

const control = container.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "8px")
    .style("margin-bottom", "12px")

const mode = control.append("select")
    .style("width", "20%")

const input = control.append("input")
    .attr("type", "text")
    .attr("placeholder", "Search schools, cities, counties, zip code, or states")
    .style("width", "50%")

mode.selectAll("option")
    .data([
        {value: "single", label: "Single school search"},
        {value: "aggregate", label: "Aggregate location search"}
    ])
    .join("option")
    .attr("value", d => d.value)
    .text(d => d.label)

const us_projection = d3.geoAlbersUsa()
    .fitSize([mapWidth, mapHeight], counties)

const path = d3.geoPath(us_projection)

const layout = container.append("div")
    .style("display", "flex")
    .style("gap", "0px")
    .style("align-items", "start")

const mapPanel = layout.append("div")
    .style("width", "75%")

const chartPanel = layout.append("div")
    .style("width", "25%")
    .style("display", "flex")
    .style("flex-direction", "column")

const mapSvg = mapPanel.append("svg")
    .attr("viewBox", [0, 0, mapWidth, mapHeight])
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .style("width", "100%")
    .style("height", "auto")
    .on("click", reset)

mapSvg.append("rect")
    .attr("width", mapWidth)
    .attr("height", mapHeight)
    .attr("fill", "white")

const stickerChartSvg = chartPanel.append("svg")
    .attr("viewBox", [0, 0, chartWidth, chartHeight])
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .style("width", "100%")
    .style("height", "auto")

stickerChartSvg.append("rect")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("fill", "white")

const netChartSvg = chartPanel.append("svg")
    .attr("viewBox", [0, 0, chartWidth, chartHeight])
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .style("width", "100%")
    .style("height", "auto")

netChartSvg.append("rect")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("fill", "white")

const zoomLayer = mapSvg.append("g")

const legend = mapSvg.append("g")
    .attr("transform", `translate(${mapWidth * 0.7}, 20)`)

const [d0, d1] = color.domain()
const thresholds = color.thresholds()

const breaks = [d0, ...thresholds, d1]
const blockWidth = legendWidth / color.range().length

legend.append("text")
  .attr("x", 0)
  .attr("y", -8)
  .attr("fill", "black")
  .attr("font-size", 12)
  .attr("font-weight", "bold")
  .text("Average net price")

legend.selectAll("rect")
  .data(color.range())
  .join("rect")
  .attr("x", (d, i) => i * blockWidth)
  .attr("y", 0)
  .attr("stroke", "black")
  .attr("width", blockWidth)
  .attr("height", legendHeight)
  .attr("fill", d => d)

const legendScale = d3.scaleLinear()
  .domain([d0, d1])
  .range([0, legendWidth])

legend.append("g")
  .attr("transform", `translate(0, ${legendHeight})`)
  .attr("color", "black")
  .call(
    d3.axisBottom(legendScale)
      .tickValues(breaks)
      .tickFormat(d => `$${Math.round(d / 1000)}k`)
      .tickSize(6)
  )
  .selectAll("text")
  .attr("font-size", 7)

legend.raise()

const countiesPath = zoomLayer.append("g")

const schoolLayer = zoomLayer.append("g")

const statesPath = zoomLayer.append("path")
    .datum(states)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 0.6)
    .attr("d", path)

const usPath = zoomLayer.append("path")
    .datum(nation)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("d", path)
    .attr("stroke-opacity", 0.5)

let matchedPoints = []
let matchedLocations = []
let selected = null

input.on("input", updateSearch)
mode.on("change", updateSearch)

function updateSearch() {
    const query = input.node().value.toLowerCase().trim()
    const searchMode = mode.node().value

    if (!query) {
        matchedPoints = []
        matchedLocations = []
        selected = null
    } else if (searchMode === "single") {
        matchedPoints = pointData.filter(d => d.name.toLowerCase().includes(query))
        matchedLocations = []
        selected = null
    } else {
        matchedLocations = pointData.filter(d => 
            d.CITY?.toLowerCase().includes(query) ||
            d.STATE_NAME?.toLowerCase().includes(query) ||
            d.NMCNTY?.toLowerCase().includes(query) ||
            d.STATE?.toLowerCase().includes(query) || 
            String(d.ZIP ?? "").padStart(5, "0").includes(query)
        )
        matchedPoints = []
        selected = null
    }

    render()
}

function render() {
    const matchedCountyIds = new Set(
        matchedLocations.map(d => String(d.countyFIPS).padStart(5, "0"))
    )

    const countiesAvailable = counties.features.map(d => ({
        ...d,
        selected: matchedCountyIds.has(String(d.id).padStart(5, "0"))
    }))

    const schoolsAvailable = matchedPoints.map(d => ({
        ...d,
        selected: d.unitid === selected
    }))

    const isSingle = mode.node().value === "single"

    const locationSearchActive =
        mode.node().value === "aggregate" &&
        input.node().value.trim() !== ""

    countiesPath
        .selectAll("path")
        .data(countiesAvailable, d => d.id)
        .join(
            enter => enter.append("path")
                .attr("d", path)
                .attr("fill", d => {
                    const value = valueByCounty.get(d.id)
                    return value == null ? "lightgrey" : color(value)
                })
                .attr("stroke", "black")
                .attr("stroke-width", 0.2)
                .attr("stroke-opacity", 0.5),
            update => update
                .attr("fill", d => {
                    const value = valueByCounty.get(d.id)
                    if (selected == d.id) return "red"
                    if (d.selected) {
                        return value == null ? "lightgrey" : d3.color(color(value)).darker(1)
                    }
                    return value == null ? "lightgrey" : color(value)
                })
                .attr("stroke-width", d => {
                    return d.selected || selected == d.id ? 1 : 0.1
                })
                .attr("cursor", d => {
                    const hasData = valueByCounty.get(d.id) != null
                    if (!hasData || isSingle) return "default"
                    if (locationSearchActive && !d.selected) return "default"
                    return "pointer"
                })
                .on("click", (event, d) => {
                    const hasData = valueByCounty.get(d.id) != null
                    if (!hasData || isSingle) return 
                    if (locationSearchActive && !d.selected) return
                    countyClicked(event, d)
                }),
            exit => exit.remove()
        ) 

    const countySelected = countiesAvailable.filter(d => d.id === selected)
    
    countiesPath
        .selectAll("text")
        .data(countySelected, d => d.id)
        .join("text")
        .attr("class", "county-label")
        .attr("x", d => path.centroid(d)[0])
        .attr("y", d => path.centroid(d)[1])
        .attr("text-anchor", "middle")
        .attr("font-size", 14)
        .attr("fill", "black")
        .text(d => countyNameByFips.get(String(d.id).padStart(5, "0")))

    countiesPath.raise()

    schoolLayer
        .selectAll("circle")
        .data(schoolsAvailable, d => d.unitid)
        .join(
            enter => enter.append("circle")
                .attr("cx", d => us_projection([+d.LON, +d.LAT])?.[0])
                .attr("cy", d => us_projection([+d.LON, +d.LAT])?.[1])
                .attr("r", 3)
                .attr("fill", "yellow")
                .attr("stroke", "black")
                .attr("cursor", "pointer")
                .on("click", schoolClicked),
            update => update
                .attr("fill", d => d.unitid === selected ? "red" : "yellow"),
            exit => exit.remove()
        )

    const schoolsSelected = schoolsAvailable.filter(d => d.selected)

    schoolLayer
        .selectAll("text")
        .data(schoolsSelected, d => d.unitid)
        .join("text")
        .attr("class", "school-label")
        .attr("font-size", 14)
        .attr("fill", "black")
        .attr("x", d => us_projection([+d.LON, +d.LAT])?.[0] - 10)
        .attr("y", d => us_projection([+d.LON, +d.LAT])?.[1] - 2)
        .text(d => d.name)
        
    schoolLayer.raise()

    const aggregate_values = v => ({
        year: v[0].year,
        inStateStickerPrice: d3.mean(v, d => +d.inStateStickerPrice),
        outOfStateStickerPrice: d3.mean(v, d => +d.outOfStateStickerPrice),
        averageNetPrice: d3.mean(v, d => +d.averageNetPrice),
        netPriceIncome0to30000: d3.mean(v, d => +d.netPriceIncome0to30000),
        netPriceIncome30001to48000: d3.mean(v, d => +d.netPriceIncome30001to48000),
        netPriceIncome48001to75000: d3.mean(v, d => +d.netPriceIncome48001to75000),
        netPriceIncome75001to110000: d3.mean(v, d => +d.netPriceIncome75001to110000),
        netPriceIncome110001: d3.mean(v, d => +d.netPriceIncome110001)
    })

    const selectedRows = selected
        ? isSingle
            ? data
                .filter(d => d.unitid === selected)
                .sort((a, b) => d3.ascending(a.year, b.year))
            : Array.from(
                d3.rollup(
                    data.filter(d => String(d.countyFIPS).padStart(5, "0") === String(selected).padStart(5, "0")),
                    aggregate_values,
                    d => d.year
                ).values()
            ).sort((a, b) => d3.ascending(a.year, b.year))
        : Array.from(
            d3.rollup(
                data,
                aggregate_values,
                d => d.year
            ).values()
        ).sort((a, b) => d3.ascending(a.year, b.year))

    const scopeTitle = selected 
        ? isSingle
            ? schoolNameByUnitId.get(String(selected))
            : countyNameByFips.get(String(selected).padStart(5, "0"))
        : "Continental US"

    drawLineChart(
        stickerChartSvg,
        selectedRows,
        ["inStateStickerPrice", "outOfStateStickerPrice"],
        `Tuiton price in ${scopeTitle}`
    )

    drawLineChart(
        netChartSvg,
        selectedRows,
        [
            "averageNetPrice",
            "netPriceIncome0to30000",
            "netPriceIncome30001to48000",
            "netPriceIncome48001to75000",
            "netPriceIncome75001to110000",
            "netPriceIncome110001"
        ],
        `Net price by income in ${scopeTitle}`
    )
}

function drawLineChart(svg, rows, columns, title) {
    const margin = {top: 40, right: 12, bottom: 58, left: 36}

    svg.selectAll("*").remove()

    svg.append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("fill", "white")

    if (!rows.length) {
        svg.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", chartHeight / 2 - 10)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("font-size", 11)
            .text("Select a school / county first")

        svg.append("text")
            .attr("x", chartWidth / 2)
            .attr("y", chartHeight / 2 + 10)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("font-size", 9)
            .text(mode.node().value === "single"
            ? "Click a school point on the map"
            : "Click a colored county on the map")

        return
    }

    const labelMap = {
        inStateStickerPrice: "In-state",
        outOfStateStickerPrice: "Out-of-state",
        averageNetPrice: "Avg net",
        netPriceIncome0to30000: "$0–30k",
        netPriceIncome30001to48000: "$30–48k",
        netPriceIncome48001to75000: "$48–75k",
        netPriceIncome75001to110000: "$75–110k",
        netPriceIncome110001: "$110k+"
    }

    const years = Array.from(new Set(rows.map(d => d.year))).sort()

    const series = columns
        .map(col => ({
            key: col,
            values: rows
            .filter(d => d[col] != null && d[col] !== "" && Number.isFinite(+d[col]))
            .map(d => ({
                year: d.year,
                value: +d[col]
            }))
        }))
        .filter(s => s.values.length >= 2)

    const x = d3.scalePoint()
        .domain(years)
        .range([margin.left, chartWidth - margin.right])
        .padding(0.5)

    const y = d3.scaleLinear()
        .domain([0, d3.max(series, s => d3.max(s.values, d => d.value))])
        .nice()
        .range([chartHeight - margin.bottom, margin.top])

    const lineColor = d3.scaleOrdinal()
        .domain(columns)
        .range(d3.schemeTableau10)

    const line = d3.line()
        .defined(d => Number.isFinite(d.value))
        .x(d => x(d.year))
        .y(d => y(d.value))

    const textX = margin.left

    const text = svg.append("text")
        .attr("x", textX)
        .attr("y", 16)
        .attr("fill", "black")
        .attr("font-size", 11)
        .attr("font-weight", "bold");

    wrapText(
        text,
        title,
        textX,
        chartWidth - margin.left - margin.right
    )

    svg.append("g")
        .attr("transform", `translate(0, ${chartHeight - margin.bottom})`)
        .attr("color", "black")
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .attr("font-size", 8)
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end")

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .attr("color", "black")
        .call(d3.axisLeft(y).ticks(3).tickFormat(d => `$${d3.format(".2s")(d)}`))
        .selectAll("text")
        .attr("font-size", 8)

    svg.append("g")
        .selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", d => lineColor(d.key))
        .attr("stroke-width", 1.6)
        .attr("d", d => line(d.values))

    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${chartHeight - 38})`)

    const legendRow = legend.selectAll("g")
        .data(series)
        .join("g")
        .attr("transform", (d, i) => {
            const col = i % 2
            const row = Math.floor(i / 2)
            return `translate(${col * 80}, ${row * 14})`
        })

    legendRow.append("line")
        .attr("x1", 0)
        .attr("x2", 14)
        .attr("y1", 5)
        .attr("y2", 5)
        .attr("stroke", d => lineColor(d.key))
        .attr("stroke-width", 2)

    legendRow.append("text")
        .attr("x", 18)
        .attr("y", 8)
        .attr("font-size", 8)
        .attr("fill", "black")
        .text(d => labelMap[d.key] ?? d.key)
}

function wrapText(text, content, x, maxWidth) {
    const words = content.split(/\s+/)
    let line = []

    let tspan = text.append("tspan")
        .attr("x", x)
        .attr("dy", 0)

    for (const word of words) {
        line.push(word)
        tspan.text(line.join(" "))

        if (tspan.node().getComputedTextLength() > maxWidth) {
            line.pop()
            tspan.text(line.join(" "))

            line = [word];
            tspan = text.append("tspan")
                .attr("x", x)
                .attr("dy", "1.2em")
                .text(word)
        }
    }
}

function reset() {
    selected = null
    render()
    mapSvg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
    )
}

function clicked(event, x, y, k) {
    event.stopPropagation()
    render()
    mapSvg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
            .translate(mapWidth / 2, mapHeight / 2)
            .scale(k)
            .translate(-x, -y),
        d3.pointer(event, mapSvg.node())
    )
}

function schoolClicked(event, d) {
    selected = d.unitid
    const [x, y] = us_projection([+d.LON, +d.LAT])
    const k = 8
    clicked(event, x, y, k)
}

function countyClicked(event, d) {
    selected = d.id
    const [[x0, y0], [x1, y1]] = path.bounds(d)
    const k = Math.min(8, 0.9 / Math.max((x1 - x0) / mapWidth, (y1 - y0) / mapHeight))
    const [x, y] = [(x0 + x1) / 2, (y0 + y1) / 2]
    clicked(event, x, y, k)
}

function zoomed(event) {
    const {transform} = event
    zoomLayer.attr("transform", transform)
    zoomLayer.attr("stroke-width", 1 / transform.k)
    const textSize = Math.ceil(14 / transform.k)
    schoolLayer
        .selectAll("circle")
        .attr("r", 3 / Math.sqrt(transform.k))
    schoolLayer
        .selectAll("text")
        .attr("font-size", textSize)
    countiesPath
        .selectAll("text")
        .attr("font-size", textSize)
}

mapSvg.call(zoom).on("dblclick.zoom", null)
render()
display(container.node())
```

### Source Code
[Repo](https://github.com/TylerNP/CSC477-Assignment5)

### References

- [D3 Choropleth](https://observablehq.com/@d3/choropleth/2)
- [D3 Zoom & Pan](https://observablehq.com/@d3/zoom-to-bounding-box)
- [zipdecode](https://www.benfry.com/zipdecode/)
- [TuitonTracker](https://www.tuitiontracker.org/) (Secondary Education Prices)
- [NCES](https://nces.ed.gov/programs/edge/geographic/schoollocations) (Geolocation Data of Secondary Education Institutions)
- [US-Atlas](https://github.com/topojson/us-atlas) (County Path Data)