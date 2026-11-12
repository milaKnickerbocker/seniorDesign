function crossAtLon(a, b, lon) {
    const t = (lon - a.lon) / (b.lon - a.lon);
    return { lat: a.lat + t * (b.lat - a.lat), lon };
}

function clip(poly, inside, intersect) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
        const cur = poly[i];
        const prev = poly[(i + poly.length - 1) % poly.length];
        if (inside(cur)) {
            if (!inside(prev)) out.push(intersect(prev, cur));
            out.push(cur);
        } else if (inside(prev)) {
            out.push(intersect(prev, cur));
        }
    }
    return out;
}

function splitIntoZones(boundary, n) {
    if (n <= 1) return [boundary];
    const lons = boundary.map((p) => p.lon);
    const minLon = Math.min(...lons);
    const width = (Math.max(...lons) - minLon) / n;

    return Array.from({ length: n }, (_, i) => {
        const x0 = minLon + i * width;
        const x1 = x0 + width;
        let poly = clip(boundary, (p) => p.lon >= x0, (a, b) => crossAtLon(a, b, x0));
        poly = clip(poly, (p) => p.lon <= x1, (a, b) => crossAtLon(a, b, x1));
        return poly;
    });
}

module.exports = { splitIntoZones };