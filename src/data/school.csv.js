import * as aq from "arquero"
import {csvFormat, csvParse} from "d3-dsv"
import {readFileSync} from "node:fs"

const mapShortToName = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming"
}

const ctPlanningToLegacyCounty = new Map([
    ["09110", "09003"],
    ["09120", "09001"],
    ["09130", "09007"],
    ["09140", "09009"],
    ["09150", "09015"],
    ["09160", "09005"],
    ["09170", "09009"],
    ["09180", "09011"],
    ["09190", "09001"]
])

function normalizeCountyFips(id) {
    const fips = id ? String(id).padStart(5, "0") : null
    return fips ? ctPlanningToLegacyCounty.get(fips) ?? fips : null
}

function readCSV(path) {
    return csvParse(readFileSync(path, "utf8"), d => ({
        ...d,
        name: String(d.name ?? d.NAME),
        unitid: String(d.unitid ?? d.UNITID).trim(),
        STFIP: d.STFIP ? String(d.STFIP).padStart(2, "0") : null,
        countyFIPS: normalizeCountyFips(d.CNTY),
        year: d.year ? String(d.year.split("-")[0]) : null
    }))
}

const locations = readCSV("src/data/locations.csv")
const tracker = readCSV("src/data/tracker.csv")
const sticker = readCSV("src/data/sticker.csv")

const location_clean = aq
    .from(locations)
    .filter(aq.escape(d => mapShortToName[d.STATE]))
    .derive({
        STATE_NAME: aq.escape(d => mapShortToName[d.STATE])
    })
    .select(
        "LAT",
        "LON",
        "unitid",
        "STATE",
        "STATE_NAME",
        "CITY",
        "CNTY",
        "STFIP",
        "name",
        "countyFIPS",
        "NMCNTY",
        "ZIP"
    )

const sticker_clean = aq
    .from(sticker)
    .select(
        "unitid",
        "name",
        "year",
        "inStateStickerPrice",
        "outOfStateStickerPrice"
    )

const tracker_clean = aq
    .from(tracker)
    .select(
        "unitid",
        "name",
        "year",
        "averageNetPrice",
        "netPriceIncome0to30000",
        "netPriceIncome30001to48000",
        "netPriceIncome48001to75000",
        "netPriceIncome75001to110000",
        "netPriceIncome110001"
    )

const joined = location_clean
    .join(tracker_clean)
    .join(sticker_clean)
    .objects()
    
process.stdout.write(csvFormat(joined))
