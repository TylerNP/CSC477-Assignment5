# Assignment5

## Design Decisions

I chose to use a choropleth horizontally concantenated with two vertically concantenated line charts. For the line charts, as it depicts temporal data, I used it particularly to depict a trend with price changes over time. Within the line charts, I used color to encode the categorical information as the position encoding was used for the qualitative and ordinal values. For the choropleth, I used it to give geographical context for the price trends shown in the line charts since each chart refers to a specific county or institution. With position and sized used by the choropleth, I used color again to encode the average net price. I used a threshold scale to encode these values as it is meant to give an overall sense, of the price in a region, since the line charts can give more specific information. 

For the interaction, I provided selection through both a search bar and directly clicking a point or geo shape. I choose selection, since being able to pick out a specific point allows the user the ability to explore the trends in different regions or institutions with increasing levels of details when selected. Additionally, due to the size of the map, I added zooming and panning to move around the map and make some of the selections more easily clickable and visible. To increase the affordance of the interaction, I added a hint that details the map motion and changed the color of the selected points and counties. Furthermore, I changed the size or borders of objects when hovered to indicate the target and the ability to interact. 

## References 
- [TuitonTracker](https://www.tuitiontracker.org/) Data on the total cost and tuiton prices of IPEDS recognized institutions
- [NCES](https://nces.ed.gov/programs/edge/geographic/schoollocations) Geospatial location of IPEDS institutions
- [US-Atlas](https://github.com/topojson/us-atlas) US Topojson data 

## Inspiration and Code References

- [zipdecode](https://www.benfry.com/zipdecode/) Inspiration for Design
- [D3 Choropleth](https://observablehq.com/@d3/choropleth/2) Code Reference
- [D3 Zoom & Pan](https://observablehq.com/@d3/zoom-to-bounding-box) Code Reference

# Observable Framework

This is an [Observable Framework](https://observablehq.com/framework/) app. To install the required dependencies, run:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

Then visit <http://localhost:3000> to preview your app.

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

A typical Framework project looks like this:

```ini
.
├─ src
│  ├─ components
│  │  └─ timeline.js           # an importable module
│  ├─ data
│  │  ├─ launches.csv.js       # a data loader
│  │  └─ events.json           # a static data file
│  ├─ example-dashboard.md     # a page
│  ├─ example-report.md        # another page
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the app config file
├─ package.json
└─ README.md
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/project-structure#routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your app. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/data-loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [app configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the app’s title.

## Command reference

| Command           | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `npm install`            | Install or reinstall dependencies                        |
| `npm run dev`        | Start local preview server                               |
| `npm run build`      | Build your static site, generating `./dist`              |
| `npm run deploy`     | Deploy your app to Observable                            |
| `npm run clean`      | Clear the local data loader cache                        |
| `npm run observable` | Run commands like `observable help`                      |
