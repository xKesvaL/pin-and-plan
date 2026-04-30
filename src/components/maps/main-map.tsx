import type { Position } from "@vnedyalk0v/react19-simple-maps";
import {
  ComposableMap,
  createCoordinates,
  createScaleExtent,
  createTranslateExtent,
  Geographies,
  Geography,
  ZoomableGroup,
} from "@vnedyalk0v/react19-simple-maps";
import { geoBounds, geoCentroid } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { animate } from "motion";
import { useEffect, useRef, useState } from "react";
import mapData from "../../assets/ne_50m_admin_0_map_subunits.json";
import { Button } from "../ui/button";

/**
 * Interactive Map Showcase
 *
 * Shows key features of @vnedyalk0v/react19-simple-maps:
 * ✨ Easy zoom/pan ✨ Click interactions ✨ Multiple projections
 * ✨ Hover effects ✨ Quick navigation
 */
export const MainMap = () => {
  const minZoom = 0.25;
  const maxZoom = 8;
  const animationDurationSeconds = 0.65;
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCountryKey, setSelectedCountryKey] = useState<string | null>(null);
  const [projection, setProjection] = useState<
    "geoEqualEarth" | "geoMercator" | "geoNaturalEarth1"
  >("geoEqualEarth");
  const [position, setPosition] = useState<Position>({
    coordinates: createCoordinates(0, 0),
    zoom: 1,
  });
  const positionRef = useRef(position);
  const mapAnimationRef = useRef<{ stop: () => void } | null>(null);

  // Quick navigation presets
  const quickNav = [
    { name: "World", center: createCoordinates(0, 0), zoom: 1 },
    { name: "Europe", center: createCoordinates(10, 50), zoom: 3 },
    { name: "Asia", center: createCoordinates(100, 30), zoom: 2.5 },
    { name: "Americas", center: createCoordinates(-80, 20), zoom: 2 },
  ];

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    return () => {
      mapAnimationRef.current?.stop();
    };
  }, []);

  const getCountryName = (geography: Feature<Geometry>) => {
    const properties = geography.properties;
    const candidateNames = [
      properties?.name,
      properties?.NAME,
      properties?.NAME_EN,
      properties?.ADMIN,
      properties?.GEOUNIT,
      properties?.SUBUNIT,
    ];

    const matchedName = candidateNames.find((candidate) => typeof candidate === "string");

    if (matchedName) {
      return matchedName;
    }

    return geography.id ? String(geography.id) : "Unknown";
  };

  const getGeographyKey = (geography: Feature<Geometry>) => {
    const properties = geography.properties;
    const candidateKeys = [
      geography.id,
      properties?.NE_ID,
      properties?.WOE_ID,
      properties?.ADM0_A3,
      properties?.GU_A3,
      properties?.SU_A3,
      properties?.BRK_A3,
    ];

    const matchedKey = candidateKeys.find(
      (candidate) => typeof candidate === "string" || typeof candidate === "number",
    );

    if (matchedKey !== undefined) {
      return String(matchedKey);
    }

    return getCountryName(geography);
  };

  const stopMapAnimation = () => {
    mapAnimationRef.current?.stop();
    mapAnimationRef.current = null;
  };

  const animateToPosition = (nextPosition: Position) => {
    const currentPosition = positionRef.current;

    if (
      currentPosition.coordinates[0] === nextPosition.coordinates[0] &&
      currentPosition.coordinates[1] === nextPosition.coordinates[1] &&
      currentPosition.zoom === nextPosition.zoom
    ) {
      return;
    }

    stopMapAnimation();

    mapAnimationRef.current = animate(0, 1, {
      duration: animationDurationSeconds,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setPosition({
          coordinates: createCoordinates(
            currentPosition.coordinates[0] +
              (nextPosition.coordinates[0] - currentPosition.coordinates[0]) * latest,
            currentPosition.coordinates[1] +
              (nextPosition.coordinates[1] - currentPosition.coordinates[1]) * latest,
          ),
          zoom: currentPosition.zoom + (nextPosition.zoom - currentPosition.zoom) * latest,
        });
      },
      onComplete: () => {
        setPosition(nextPosition);
        mapAnimationRef.current = null;
      },
    });
  };

  const handleCountryClick = (geography: Feature<Geometry>) => {
    const center = geoCentroid(geography);

    const bounds = geoBounds(geography);
    const dx = Math.abs(bounds[1][0] - bounds[0][0]);
    const dy = Math.abs(bounds[1][1] - bounds[0][1]);
    const maxDim = Math.max(dx, dy);

    let newZoom = 100 / (maxDim || 1);

    newZoom = Math.max(1, Math.min(newZoom, maxZoom));

    const countryName = getCountryName(geography);
    const countryKey = getGeographyKey(geography);

    animateToPosition({
      coordinates: createCoordinates(center[0], center[1]),
      zoom: newZoom,
    });
    setSelectedCountry(countryName);
    setSelectedCountryKey(countryKey);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>🗺️ Interactive Map Showcase</h1>
      <p>Built with @vnedyalk0v/react19-simple-maps - See our key features!</p>

      {/* Quick Controls */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <label htmlFor="map-projection">Projection: </label>
          <select
            id="map-projection"
            value={projection}
            onChange={(e) =>
              setProjection(e.target.value as "geoEqualEarth" | "geoMercator" | "geoNaturalEarth1")
            }
            style={{ padding: "0.5rem", borderRadius: "4px" }}
          >
            <option value="geoEqualEarth">Equal Earth</option>
            <option value="geoMercator">Mercator</option>
            <option value="geoNaturalEarth1">Natural Earth</option>
          </select>
        </div>

        {quickNav.map((nav) => (
          <Button
            key={nav.name}
            onClick={() => animateToPosition({ coordinates: nav.center, zoom: nav.zoom })}
          >
            {nav.name}
          </Button>
        ))}
      </div>

      {/* Selection Info */}
      <div style={{ marginBottom: "1rem", minHeight: "5.5rem" }}>
        {selectedCountry && (
          <div
            style={{
              background: "#e3f2fd",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <h3>Selected Country: {selectedCountry}</h3>
          </div>
        )}
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          padding: "1rem",
          marginBottom: "2rem",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <ComposableMap projection={projection} width={800} height={500}>
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveStart={stopMapAnimation}
            onMoveEnd={setPosition}
            enableZoom={true}
            minZoom={minZoom}
            maxZoom={maxZoom}
            scaleExtent={createScaleExtent(minZoom, maxZoom)}
            enablePan={true}
            translateExtent={createTranslateExtent(
              createCoordinates(-2000, -1000),
              createCoordinates(2000, 1000),
            )}
          >
            <Geographies geography={mapData}>
              {({ geographies, borders }) => {
                return (
                  <>
                    {geographies.map((geo) => {
                      const geographyKey = getGeographyKey(geo);
                      const isSelected = geographyKey === selectedCountryKey;

                      return (
                        <Geography
                          key={geographyKey}
                          geography={geo}
                          onClick={() => handleCountryClick(geo)}
                          onDragStart={(event) => {
                            event.preventDefault();
                          }}
                          style={{
                            default: {
                              fill: isSelected ? "var(--primary)" : "var(--muted)",
                              outline: "none",
                              strokeWidth: isSelected ? 0 : 0.1,
                              stroke: isSelected ? "var(--primary)" : "var(--background)",
                            },
                            hover: {
                              fill: isSelected ? "var(--primary)" : "var(--accent)",
                              outline: "none",
                              stroke: isSelected ? "var(--primary)  " : "var(--background)",
                              strokeWidth: isSelected ? 0 : 0.1,
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: isSelected ? "var(--primary)" : "var(--accent)",
                              outline: "none",
                              stroke: isSelected ? "var(--primary)" : "var(--background)",
                              strokeWidth: isSelected ? 0 : 0.1,
                              cursor: "pointer",
                            },
                            focused: {
                              fill: isSelected ? "var(--primary)" : "var(--muted)",
                              outline: "none",
                              stroke: isSelected ? "var(--primary)" : "var(--background)",
                              strokeWidth: isSelected ? 0 : 0.1,
                            },
                          }}
                        />
                      );
                    })}
                    {borders ? (
                      <path
                        d={borders}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth={0.5}
                        pointerEvents="none"
                      />
                    ) : null}
                  </>
                );
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div
        style={{
          background: "#fff3e0",
          borderLeft: "4px solid #ff9800",
          padding: "1rem",
          borderRadius: "8px",
        }}
      >
        <h3>🎮 Interactive Features</h3>
        <ul>
          <li>
            <strong>Scroll</strong> to zoom in/out
          </li>
          <li>
            <strong>Click and drag</strong> to pan around
          </li>
          <li>
            <strong>Hover countries</strong> to see hover effects
          </li>
          <li>
            <strong>Click countries</strong> to select them
          </li>
          <li>
            <strong>Change projections</strong> to see different map views
          </li>
          <li>
            <strong>Quick navigation</strong> to jump to regions
          </li>
        </ul>

        <h4>✨ Key Package Features Showcased:</h4>
        <ul>
          <li>
            🗺️ <strong>Multiple Projections</strong> - Equal Earth, Mercator, Natural Earth
          </li>
          <li>
            🖱️ <strong>Hover Effects</strong> - Real-time country highlighting
          </li>
          <li>
            🔍 <strong>Zoom & Pan</strong> - Smooth navigation with default behavior
          </li>
          <li>
            📍 <strong>Click Interactions</strong> - Country selection and zoom
          </li>
          <li>
            ⚡ <strong>Performance</strong> - Optimized rendering with React 19
          </li>
        </ul>

        <p>
          <strong>~300 lines of code</strong> for all these features! Our package handles the
          complexity.
        </p>
      </div>
    </div>
  );
};
