import { useEffect, useRef, useState } from "react";
import * as mapboxgl from "mapbox-gl/esm";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./FireWatchMap.css";

function FireWatchMap() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const draw = useRef(null);

    const [geoJson, setGeoJson] = useState(null);
    const [message, setMessage] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    //return currently selected boundary if there is one
    function getSelectedBoundary(){
        if(!draw.current) return null;

        const selected = draw.current.getSelected();

        return selected.features.length > 0 ? selected.features[0]:null;
    }

    //display boundary GeoJson and validate point count
    function displayBoundary(feature){
        if(!feature || feature.geometry.type !== "Polygon"){
            setGeoJson(null);
            return;
        }

        const coordinates = feature.geometry.coordinates[0];
        const pointCount = coordinates.length -1;

        if(pointCount < 3){
            setGeoJson(null);
            setMessage("Invalid patrol boundary. Must have at least 3 points.");

            return;

        }

        setGeoJson(feature);
        setMessage("Patrol boundary accepted.");

    }


    // Handle newly created or edited boundary
    function handleDraw(event) {
        const feature = event.features?.[0] ?? getSelectedBoundary();

        if(feature){
            displayBoundary(feature);
        }

    }

    //show geojson for whichever boundary the operator selects
    function handleSelectionChange(event){
        const selectedFeature = event.features?.[0];

        if(selectedFeature) {
            displayBoundary(selectedFeature);
        }else{
            setGeoJson(null);
        }

    }

    // refresh display after deleting boundary
    function handleDelete() {
        const remaining = draw.current?.getAll().features ?? [];

        if(remaining.length === 0){
            setGeoJson(null);
            setMessage("Patrol boundary cleared.");
            console.log("All patrol boundaries cleared.");
            return;
        }

        //perfer another selected boundary, otherwise show remaining one
        const selectedFeature = getSelectedBoundary();
        const nextFeature = selectedFeature ?? remaining[remaining.length-1];

        displayBoundary(nextFeature);
        setMessage("Patrol boundary deleted");

    }

    function requestDelete() {
        const selected = getSelectedBoundary();

        if (!selected) {
            setMessage("Select a boundary before deleting it.");
            return;
        }

        setPendingDeleteId(selected.id);
        setShowDeleteConfirm(true);
    }

    function confirmDelete() {
        if (pendingDeleteId == null || !draw.current) return;

        draw.current.delete(pendingDeleteId);

        setPendingDeleteId(null);
        setShowDeleteConfirm(false);
    }

    function cancelDelete() {
        setPendingDeleteId(null);
        setShowDeleteConfirm(false);
    }

    //delete a vertex not the entire polygon
    function deleteSelectedVertex(){
        if(!draw.current) return;

        if(draw.current.getMode() !== "direct_select") {
            setMessage(
                "Select a polygon, then click one of its vertices to edit it"
            );
            return;
        }

        const selectedPoints = draw.current.getSelectedPoints();

        if(selectedPoints.features.length === 0) {
            setMessage("Select a vertex before deleting it.");
            return;
        }

        //in direct_select mode, trash removes selected vertices
        draw.current.trash();

        setMessage("Selected vertex deleted, if the polygon remains valid");

    }


    useEffect(() => {

        if (map.current) return;
        
        const mapInstance = new mapboxgl.Map({
            accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/standard",
            center: [-81.3792, 28.5383],
            zoom: 10
        });

        map.current = mapInstance;

        mapInstance.on("load", () => {
            const drawControl = new MapboxDraw({
                displayControlsDefault: false,
                controls: {
                    polygon: true,
                }
        });

        draw.current = drawControl;

        mapInstance.addControl(drawControl, "top-right");

        mapInstance.on("draw.create", handleDraw);
        mapInstance.on("draw.update", handleDraw);
        mapInstance.on("draw.selectionchange",handleSelectionChange);
        mapInstance.on("draw.delete",handleDelete);

        });
        
        map.current.on("error", (event) => {
            console.error("Mapbox error:", event.error);
    });

    return () => {
        mapInstance.remove();
        map.current = null;
        draw.current = null;
    };
}, []);

    return (
        <div className="map-wrapper">
            <div
                ref={mapContainer}
                className="map-container"
            />

            <div className="map-info">
                <h2>FireWatch Patrol Boundary</h2>

                <p>
                    Draw a polygon using the polygon control. 
                    Select a boundary to view its coordinates, 
                    edit its vertices, or delete it using the trash 
                    control.
                </p>

                <div className="boundary-actions">
                    <button onClick={deleteSelectedVertex}>
                        Delete Selected Vertex
                        </button>

                    <button className="delete-boundary-button" onClick={requestDelete}>
                        Delete Selected Boundary
                    </button>
                </div>
                
                {showDeleteConfirm && (
                    <div className="delete-confirm">
                        
                        <p>
                            Are you sure you want to delete this patrol boundary?
                            This action cannot be undone.
                            </p>
                        
                        <button onClick={confirmDelete}>
                            Yes, Delete
                            </button>
                        <button onClick={cancelDelete}>
                            Cancel
                            </button>
                        
                        </div>
                    )}

                {message && (
                    <p className="message" role="status">
                        {message}
                    </p>
                )}

                {geoJson && (
                    <>
                        <h3>Boundary GeoJson</h3>
                    <pre>
                        {JSON.stringify(geoJson, null, 2)}
                    </pre>

                    </>
                )}
            </div>
        </div>
    );
}

export default FireWatchMap;